import { loadFile } from "./load-file";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import { saveAs } from "file-saver";

import type { Identificador } from "@/@types/Identificador";
import { CourseDate } from "@/components/Identificadores";
import { TABLE_DOUBLE_PERIOD } from "./constant-xml-data";

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
      "/templates/identificacao-do-participante-nova.docx"
    );
    // Select the appropriate template based on content length
    const templateFileName =
      docData.conteudo_aplicado.length <= 800
        ? "document-template.xml"
        : "document-3colunas.xml";

    const MAIN_XML = await fetch(
      `/templates/identificacao-participante/${templateFileName}`
    );

    const HEADER3_XML = await fetch(
      `/templates/identificacao-participante/header3.xml`
    );

    const MAIN_XML_CONTENT = await MAIN_XML.text();
    const HEADER3_XML_CONTENT = await HEADER3_XML.text();

    // const tagNameIndex = MAIN_XML_CONTENT.indexOf(MAIN_XML_TAG);
    // if (tagNameIndex === -1) {
    //   throw new Error(`Tag <${MAIN_XML_TAG}> não encontrada.`);
    // }

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
  periodo: Exclude<Period, "nenhum">; // Period of the day ('manha', 'tarde', 'manhaTarde')
  paginas: number; // Number of pages needed for this entry
  instrutorA: boolean; // Flag indicating if instructor A is teaching
  instrutorB: boolean; // Flag indicating if instructor B is teaching
  horario: string; // Formatted time range for the entire block (e.g., "08:00 ÀS 17:00")
  intervalo?: string; // Formatted time range for the interval, if applicable (e.g., "12:00 ÀS 13:00")
};

// Calculates the period ('manha', 'tarde', 'manhaTarde') based on start and end times
function calculatePeriod(start: string, end: string): Period {
  // Helper to parse time string "HH:MM" into a numerical value (hours)
  const parseTime = (timeStr: string): number => {
    // Basic validation for time format
    if (!timeStr || !timeStr.includes(":")) return NaN;
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    // Ensure hours and minutes are valid numbers
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    )
      return NaN;
    return hours + minutes / 60.0; // Return time as hours (e.g., 12:30 -> 12.5)
  };

  const startTime = parseTime(start);
  const endTime = parseTime(end);

  // Check if time parsing was successful
  if (isNaN(startTime) || isNaN(endTime)) {
    console.warn(
      `Invalid or missing time format encountered: start=${start}, end=${end}`
    );
    return "nenhum"; // Return 'nenhum' if times are invalid
  }

  // Determine if the period starts before midday (12:00)
  const startsBeforeMidday = startTime < 12.0;
  // Determine if the period ends after midday (12:00)
  // Note: 12:00 exactly is considered the start of the afternoon for ending purposes.
  const endsAfterMidday = endTime > 12.0;

  if (startsBeforeMidday && endsAfterMidday) {
    return "manhaTarde"; // Period crosses midday
  } else if (startsBeforeMidday) {
    // Starts before 12:00 and ends at or before 12:00
    return "manha";
  } else if (startTime >= 12.0) {
    // Starts at or after 12:00 (and implicitly ends after 12:00)
    return "tarde";
  } else {
    // This case should theoretically not be reached with valid times and the logic above
    console.warn(`Unexpected time condition: start=${start}, end=${end}`);
    return "nenhum";
  }
}

// Processes and sorts the course schedule data
function sortData(
  pages: PagesData[], // Input array of course dates/times/instructors
  numParticipantes: number // Total number of participants
): SortedScheduleEntry[] {
  // Calculate the number of pages needed based on participants (10 per page)
  const numeroPaginas = Math.ceil(numParticipantes / 10);

  // Use a Map to group entries by date and calculated period
  // Key format: "YYYY-MM-DD-periodo" (e.g., "2023-10-27-manha")
  const groupedEntriesMap = new Map<string, SortedScheduleEntry>();

  // Iterate through the raw page data provided
  pages.forEach((item) => {
    // Validate essential fields for processing
    if (!item.date || !item.start || !item.end) {
      console.warn(
        "Skipping item due to missing date, start, or end time:",
        item
      );
      return; // Skip items with incomplete data
    }

    // Calculate the overall period ('manha', 'tarde', 'manhaTarde')
    const periodo = calculatePeriod(item.start, item.end);

    // Skip if the period calculation resulted in 'nenhum' (invalid times)
    if (periodo === "nenhum") {
      return;
    }

    // Create a unique key for grouping based on date and period
    const key = `${item.date}-${periodo}`;

    // Construct the main time range string
    const horario = `${item.start} ÀS ${item.end}`;
    // Construct the interval time range string, if interval times are valid
    let intervalo: string | undefined = undefined;
    // Check if interval times are provided and not placeholder values like "N/A"
    if (
      item.intervalStart &&
      item.intervalStart !== "N/A" &&
      item.intervalEnd &&
      item.intervalEnd !== "N/A"
    ) {
      // Basic validation for interval times could be added here if needed
      intervalo = `${item.intervalStart} ÀS ${item.intervalEnd}`;
    }

    // Check if an entry for this date and period already exists
    const existingEntry = groupedEntriesMap.get(key);

    if (!existingEntry) {
      // If it's the first time seeing this date/period combination, create a new entry
      groupedEntriesMap.set(key, {
        dia: item.date,
        periodo: periodo,
        paginas: numeroPaginas,
        // Initialize instructor flags based on this item
        instrutorA: item.instrutorA ?? false, // Use nullish coalescing for safety
        instrutorB: item.instrutorB ?? false,
        horario: horario, // Use horario/intervalo from this item
        intervalo: intervalo,
      });
    } else {
      // If an entry already exists, update the instructor flags using OR logic
      // This ensures if either instructor A or B is present in any item for this group, the flag is true.
      existingEntry.instrutorA =
        existingEntry.instrutorA || (item.instrutorA ?? false);
      existingEntry.instrutorB =
        existingEntry.instrutorB || (item.instrutorB ?? false);
      // Note: The horario and intervalo from the *first* item encountered for this key are kept.
      // If merging or selecting specific horario/intervalo is needed, add logic here.
    }
  });

  // Convert the map values (the grouped schedule entries) into an array
  const groupedEntries = Array.from(groupedEntriesMap.values());

  // Define the desired sort order for the periods
  const periodOrder: Record<Exclude<Period, "nenhum">, number> = {
    manha: 1,
    tarde: 2,
    manhaTarde: 3,
    noite: 4,
    manhaNoite: 5,
    tardeNoite: 6,
  };

  // Sort the grouped entries based on date and then period
  groupedEntries.sort((a, b) => {
    // 1. Compare by date (chronologically)
    if (a.dia < b.dia) return -1;
    if (a.dia > b.dia) return 1;

    // 2. If dates are the same, compare by period order
    if (periodOrder[a.periodo] < periodOrder[b.periodo]) return -1;
    if (periodOrder[a.periodo] > periodOrder[b.periodo]) return 1;

    // If date and period are the same, consider them equal for sorting
    return 0;
  });

  // Return the sorted array of processed schedule entries
  return groupedEntries;
}

function substituirOcorrencias(
  texto: string,
  instrutor: string,
  data: string,
  hora: string,
  periodo: "manha" | "tarde" | "manhaTarde",
  fixManhaTardeHora?: { horario_manha: string; horario_tarde: string }
): string {
  const patterns = {
    "\\[pi\\]": () => `${++contador.pi}`,
    "\\[p_nome\\]": () => `[p_nome${++contador.p_nome}]`,
    "\\[p_matricula\\]": () => `[p_matricula${++contador.p_matricula}]`,
    "\\[p_codigo\\]": () => `[p_codigo${++contador.p_codigo}]`,
    "\\[instrutor\\]": () => `[${instrutor}]`,
    "\\[data_frequencia\\]": () => data,
    "\\[manha\\]": () =>
      periodo === "manha" || periodo === "manhaTarde" ? "MANHÃ" : "",
    "\\[tarde\\]": () =>
      periodo === "tarde" || periodo === "manhaTarde" ? "TARDE" : "",
    "\\[manha_h\\]": () =>
      periodo === "manha" || periodo === "manhaTarde"
        ? fixManhaTardeHora
          ? fixManhaTardeHora.horario_manha
          : hora
        : "",
    "\\[tarde_h\\]": () =>
      periodo === "tarde" || periodo === "manhaTarde"
        ? fixManhaTardeHora
          ? fixManhaTardeHora.horario_tarde
          : hora
        : "",

    "\\[p_manha\\]": () =>
      periodo === "manha" || periodo === "manhaTarde"
        ? `[p_manha${++contador.p_manha}]`
        : "",
    "\\[p_tarde\\]": () =>
      periodo === "tarde" || periodo === "manhaTarde"
        ? `[p_tarde${++contador.p_tarde}]`
        : "",
  };

  const contador = {
    pi: 0,
    p_nome: 0,
    p_matricula: 0,
    p_codigo: 0,
    p_manha: 0,
    p_tarde: 0,
  };

  return Object.entries(patterns).reduce(
    (result, [pattern, replacer]) =>
      result.replace(new RegExp(pattern, "g"), replacer),
    texto
  );
}

type TabelaXML = {
  tipo: "manha" | "tarde" | "manhaTarde";
};

async function lerTabelaXml({ tipo }: TabelaXML) {
  if (tipo === "manhaTarde") {
    // const response = await fetch(
    //   "/templates/identificacao-participante/tabela-double.xml"
    // );
    // return await response.text();
    return TABLE_DOUBLE_PERIOD;
  } else if (tipo === "manha") {
    const response = await fetch(
      "/templates/identificacao-participante/tabela-single-manha.xml"
    );
    return await response.text();
  } else {
    const response = await fetch(
      "/templates/identificacao-participante/tabela-single-tarde.xml"
    );
    return await response.text();
  }
}

async function formatarPaginas(pages: SortedScheduleEntry[]) {
  let newXmlPages = "";

  for (const day of pages) {
    const formattedDate = day.dia.split("-").reverse().join("/");

    let fixManhaTardeHora = undefined;

    if (day.periodo === "manhaTarde") {
      fixManhaTardeHora = {
        horario_manha: `${day.horario.split(" ÀS ")[0]} ÀS ${
          day.intervalo?.split(" ÀS ")[0]
        }`,
        horario_tarde: `${day.intervalo?.split(" ÀS ")[1]} ÀS ${
          day.horario.split(" ÀS ")[1]
        }`,
      };
    }
    // Process instructor A for this day if applicable
    if (day.instrutorA) {
      const tabelaXml = await lerTabelaXml({
        tipo: day.periodo as "manha" | "tarde" | "manhaTarde",
      });
      const repetition = tabelaXml.repeat(day.paginas);
      newXmlPages += substituirOcorrencias(
        repetition,
        "instrutor_a",
        formattedDate,
        day.horario,
        day.periodo as "manha" | "tarde" | "manhaTarde",
        fixManhaTardeHora
      );
    }

    // Process instructor B for this day if applicable
    if (day.instrutorB) {
      const tabelaXml = await lerTabelaXml({
        tipo: day.periodo as "manha" | "tarde" | "manhaTarde",
      });
      const repetition = tabelaXml.repeat(day.paginas);
      newXmlPages += substituirOcorrencias(
        repetition,
        "instrutor_b",
        formattedDate,
        day.horario,
        day.periodo as "manha" | "tarde" | "manhaTarde",
        fixManhaTardeHora
      );
    }
  }

  return newXmlPages;
}
