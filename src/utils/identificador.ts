import { loadFile } from "./load-file";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import { saveAs } from "file-saver";

import type { Identificador } from "@/@types/Identificador";
import { CourseDate } from "@/components/Identificadores";
import {
  TABLE_DOUBLE_PERIOD,
  TABLE_DOUBLE_TARDE_NOITE,
  TABLE_DOUBLE_MANHA_NOITE,
} from "./constant-xml-data";

// Updated Period type to include noite and combined periods
export type Period =
  | "nenhum"
  | "manha"
  | "tarde"
  | "noite"
  | "manhaTarde"
  | "manhaNoite"
  | "tardeNoite";

type PagesData = CourseDate & {
  instrutor?: string;
};

export async function gerarIdentificador(
  docData: Identificador,
  pages: PagesData[],
  numeroParticipantes: number
) {
  try {
    const formattedPages = sortData(pages, numeroParticipantes);
    const MAIN_XML_TAG = "<!-- TABLE -->";

    const DOCX_TEMPLATE_BUFFER = await loadFile(
      "/templates/identificador/identificacao-do-participante-nova.docx"
    );
    // Select the appropriate template based on content length
    const templateFileName =
      docData.conteudo_aplicado.length <= 800
        ? "document-template.xml"
        : "document-3colunas.xml";

    const MAIN_XML = await fetch(
      `/templates/identificador/${templateFileName}`
    );

    const HEADER3_XML = await fetch(`/templates/identificador/header3.xml`);

    const MAIN_XML_CONTENT = await MAIN_XML.text();
    const HEADER3_XML_CONTENT = await HEADER3_XML.text();

    const UPDATED_DOCUMENT_XML_FILE = MAIN_XML_CONTENT.split(MAIN_XML_TAG).join(
      await formatarPaginas(formattedPages)
    );

    const zip = new PizZip(DOCX_TEMPLATE_BUFFER);
    zip.file("word/document.xml", UPDATED_DOCUMENT_XML_FILE);
    zip.file("word/header3.xml", HEADER3_XML_CONTENT);

    const doc = new Docxtemplater(zip, {
      delimiters: { start: "[", end: "]" },
      paragraphLoop: true,
      linebreaks: true,
      parser: expressionParser,
    });

    doc.render(docData);
    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    saveAs(out, "output.docx");
  } catch (error) {
    console.error("Erro ao processar os arquivos XML:", error);
  }
}

// Define the structure for the processed schedule entries
type SortedScheduleEntry = {
  dia: string; // Date in "YYYY-MM-DD" format
  periodo: Exclude<Period, "nenhum">; // Period of the day
  paginas: number; // Number of pages needed for this entry
  instrutorA: boolean; // Flag indicating if instructor A is teaching
  instrutorB: boolean; // Flag indicating if instructor B is teaching
  horario: string; // Formatted time range for the entire block (e.g., "08:00 ÀS 17:00")
  intervalo?: string; // Formatted time range for the interval, if applicable (e.g., "12:00 ÀS 13:00")
};

// Calculates the period based on start and end times
function calculatePeriod(start: string, end: string): Period {
  const parseTime = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(":")) return NaN;
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    )
      return NaN;
    return hours + minutes / 60.0;
  };

  const startTime = parseTime(start);
  const endTime = parseTime(end);

  if (isNaN(startTime) || isNaN(endTime)) {
    console.warn(
      `Invalid or missing time format encountered: start=${start}, end=${end}`
    );
    return "nenhum";
  }

  const midday = 12.0;
  const evening = 18.0;

  const startsBeforeMidday = startTime < midday;
  const startsBeforeEvening = startTime < evening;
  const startsAfterEvening = startTime >= evening;

  const endsBeforeMidday = endTime <= midday;
  const endsBeforeEvening = endTime <= evening;
  const endsAfterEvening = endTime > evening;

  if (startsBeforeMidday && endsAfterEvening) {
    return "manhaNoite"; // Starts before 12:00, ends after 18:00
  } else if (startsBeforeEvening && !startsBeforeMidday && endsAfterEvening) {
    return "tardeNoite"; // Starts between 12:00 and 18:00, ends after 18:00
  } else if (startsBeforeMidday && endsBeforeEvening && !endsBeforeMidday) {
    return "manhaTarde"; // Starts before 12:00, ends between 12:00 and 18:00
  } else if (startsBeforeMidday && endsBeforeMidday) {
    return "manha"; // Starts and ends before 12:00
  } else if (startsBeforeEvening && !startsBeforeMidday && endsBeforeEvening) {
    return "tarde"; // Starts and ends between 12:00 and 18:00
  } else if (startsAfterEvening) {
    return "noite"; // Starts at or after 18:00
  } else {
    console.warn(`Unhandled time condition: start=${start}, end=${end}`);
    return "nenhum"; // Fallback for unhandled cases
  }
}

// Processes and sorts the course schedule data
function sortData(
  pages: PagesData[], // Input array of course dates/times/instructors
  numParticipantes: number // Total number of participants
): SortedScheduleEntry[] {
  const numeroPaginas = Math.ceil(numParticipantes / 10);
  const groupedEntriesMap = new Map<string, SortedScheduleEntry>();

  pages.forEach((item) => {
    if (!item.date || !item.start || !item.end) {
      console.warn(
        "Skipping item due to missing date, start, or end time:",
        item
      );
      return;
    }

    const periodo = calculatePeriod(item.start, item.end);
    if (periodo === "nenhum") {
      return;
    }

    const key = `${item.date}-${periodo}`;
    const horario = `${item.start} ÀS ${item.end}`;
    let intervalo: string | undefined = undefined;
    if (
      item.intervalStart &&
      item.intervalStart !== "N/A" &&
      item.intervalEnd &&
      item.intervalEnd !== "N/A"
    ) {
      intervalo = `${item.intervalStart} ÀS ${item.intervalEnd}`;
    }

    const existingEntry = groupedEntriesMap.get(key);

    if (!existingEntry) {
      groupedEntriesMap.set(key, {
        dia: item.date,
        periodo: periodo,
        paginas: numeroPaginas,
        instrutorA: item.instrutorA ?? false,
        instrutorB: item.instrutorB ?? false,
        horario: horario,
        intervalo: intervalo,
      });
    } else {
      existingEntry.instrutorA =
        existingEntry.instrutorA || (item.instrutorA ?? false);
      existingEntry.instrutorB =
        existingEntry.instrutorB || (item.instrutorB ?? false);
    }
  });

  const groupedEntries = Array.from(groupedEntriesMap.values());

  // Updated period order
  const periodOrder: Record<Exclude<Period, "nenhum">, number> = {
    manha: 1,
    tarde: 2,
    noite: 3, // Added noite
    manhaTarde: 4, // Adjusted order
    manhaNoite: 5, // Added manhaNoite
    tardeNoite: 6, // Added tardeNoite
  };

  groupedEntries.sort((a, b) => {
    if (a.dia < b.dia) return -1;
    if (a.dia > b.dia) return 1;
    if (periodOrder[a.periodo] < periodOrder[b.periodo]) return -1;
    if (periodOrder[a.periodo] > periodOrder[b.periodo]) return 1;
    return 0;
  });

  return groupedEntries;
}

// Type for split times across different periods
type SplitTimes = {
  manha?: string;
  tarde?: string;
  noite?: string;
};

// Updated function to handle new periods and split times
function substituirOcorrencias(
  texto: string,
  instrutor: string,
  data: string,
  periodo: Exclude<Period, "nenhum">,
  splitTimes: SplitTimes
): string {
  // Check which periods are included
  const includesManha = periodo.includes("manha");
  const includesTarde =
    periodo.includes("tarde") || periodo.includes("manhaTarde");
  const includesNoite =
    periodo.includes("noite") ||
    periodo.includes("manhaNoite") ||
    periodo.includes("tardeNoite");

  const patterns = {
    "\\[pi\\]": () => `${++contador.pi}`,
    "\\[p_nome\\]": () => `[p_nome${++contador.p_nome}]`,
    "\\[p_matricula\\]": () => `[p_matricula${++contador.p_matricula}]`,
    "\\[p_codigo\\]": () => `[p_codigo${++contador.p_codigo}]`,
    "\\[instrutor\\]": () => `[${instrutor}]`,
    "\\[data_frequencia\\]": () => data,
    // Period labels
    "\\[manha\\]": () => (includesManha ? "MANHÃ" : ""),
    "\\[tarde\\]": () => (includesTarde ? "TARDE" : ""),
    "\\[noite\\]": () => (includesNoite ? "NOITE" : ""), // Added noite label
    // Period hours
    "\\[manha_h\\]": () => (includesManha ? splitTimes.manha || "" : ""),
    "\\[tarde_h\\]": () => (includesTarde ? splitTimes.tarde || "" : ""),
    "\\[noite_h\\]": () => (includesNoite ? splitTimes.noite || "" : ""), // Added noite hours
    // Participant period placeholders
    "\\[p_manha\\]": () =>
      includesManha ? `[p_manha${++contador.p_manha}]` : "",
    "\\[p_tarde\\]": () =>
      includesTarde ? `[p_tarde${++contador.p_tarde}]` : "",
    "\\[p_noite\\]": () =>
      includesNoite ? `[p_noite${++contador.p_noite}]` : "", // Added noite participant placeholder
  };

  const contador = {
    pi: 0,
    p_nome: 0,
    p_matricula: 0,
    p_codigo: 0,
    p_manha: 0,
    p_tarde: 0,
    p_noite: 0, // Added p_noite counter
  };

  return Object.entries(patterns).reduce(
    (result, [pattern, replacer]) =>
      result.replace(new RegExp(pattern, "g"), replacer),
    texto
  );
}

type TabelaXML = {
  tipo: Exclude<Period, "nenhum">;
};

// Updated function to fetch templates for new periods
async function lerTabelaXml({ tipo }: TabelaXML) {
  if (tipo === "manhaTarde") {
    return TABLE_DOUBLE_PERIOD;
  } else if (tipo === "tardeNoite") {
    return TABLE_DOUBLE_TARDE_NOITE;
  } else if (tipo === "manhaNoite") {
    return TABLE_DOUBLE_MANHA_NOITE;
  } else if (tipo === "manha") {
    const response = await fetch(
      "/templates/identificador/tabela-single-manha.xml"
    );
    return await response.text();
  } else if (tipo === "tarde") {
    const response = await fetch(
      "/templates/identificador/tabela-single-tarde.xml"
    );
    return await response.text();
  } else if (tipo === "noite") {
    // Fetch template for 'noite' period
    const response = await fetch(
      "/templates/identificador/tabela-single-noite.xml" // Assuming this template exists
    );
    return await response.text();
  } else {
    // Fallback or error handling for unexpected period types
    console.error("Tipo de tabela XML não reconhecido:", tipo);
    // Return a default or throw an error
    return ""; // Or throw new Error(`Tipo de tabela XML não suportado: ${tipo}`);
  }
}

// Updated function to calculate split times and format pages
async function formatarPaginas(pages: SortedScheduleEntry[]) {
  let newXmlPages = "";

  for (const day of pages) {
    const formattedDate = day.dia.split("-").reverse().join("/");
    const [startTime, endTime] = day.horario.split(" ÀS ");
    const intervalStart = day.intervalo?.split(" ÀS ")[0];
    const intervalEnd = day.intervalo?.split(" ÀS ")[1];

    // Calculate split times based on period
    const splitTimes: SplitTimes = {};
    switch (day.periodo) {
      case "manha":
        splitTimes.manha = day.horario;
        break;
      case "tarde":
        splitTimes.tarde = day.horario;
        break;
      case "noite":
        splitTimes.noite = day.horario;
        break;
      case "manhaTarde":
        // Use interval if available, otherwise split at 12:00
        splitTimes.manha = `${startTime} ÀS ${intervalStart || "12:00"}`;
        splitTimes.tarde = `${intervalEnd || "12:00"} ÀS ${endTime}`;
        break;
      case "tardeNoite":
        // Split at 18:00
        splitTimes.tarde = `${startTime} ÀS 18:00`;
        splitTimes.noite = `18:00 ÀS ${endTime}`;
        break;
      case "manhaNoite":
        // Split at 12:00 and 18:00, potentially using interval for manha/tarde split
        splitTimes.manha = `${startTime} ÀS ${intervalStart || "12:00"}`;
        // Tarde might be skipped if interval covers 12-18h, or split
        // Simple approach: assume tarde exists between interval/12h and 18h
        splitTimes.tarde = `${intervalEnd || "12:00"} ÀS 18:00`;
        splitTimes.noite = `18:00 ÀS ${endTime}`;
        // Refinement needed here if interval spans across 18:00 or is complex
        break;
    }

    // Process instructor A
    if (day.instrutorA) {
      const tabelaXml = await lerTabelaXml({ tipo: day.periodo });
      const repetition = tabelaXml.repeat(day.paginas);
      newXmlPages += substituirOcorrencias(
        repetition,
        "instrutor_a",
        formattedDate,
        day.periodo,
        splitTimes
      );
    }

    // Process instructor B
    if (day.instrutorB) {
      const tabelaXml = await lerTabelaXml({ tipo: day.periodo });
      const repetition = tabelaXml.repeat(day.paginas);
      newXmlPages += substituirOcorrencias(
        repetition,
        "instrutor_b",
        formattedDate,
        day.periodo,
        splitTimes
      );
    }
  }

  return newXmlPages;
}
