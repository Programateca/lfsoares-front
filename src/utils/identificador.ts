import { loadFile } from "./load-file";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import { saveAs } from "file-saver";

import type { Identificador } from "@/@types/Identificador";

import {
  TABLE_DOUBLE_PERIOD,
  TABLE_DOUBLE_TARDE_NOITE,
  TABLE_DOUBLE_MANHA_NOITE,
} from "./constant-xml-data";

type CourseData = {
  date: {
    date: string;
    start: string;
    end: string;
    intervalStart: string;
    intervalEnd: string;
  };
  address: {
    morning?: string;
    afternoon?: string;
    night?: string;
  };
  instrutorA: {
    instrutor?: string;
    periodo?: string;
  };
  instrutorB: {
    instrutor?: string;
    periodo?: string;
  };
};

// Updated Period type to include noite and combined periods
export type Period =
  | "nenhum"
  | "manha"
  | "tarde"
  | "noite"
  | "manhaTarde"
  | "manhaNoite"
  | "tardeNoite";

// Define the structure for the processed schedule entries
type SortedScheduleEntry = {
  dia: string; // Date in "YYYY-MM-DD" format
  periodo: Exclude<Period, "nenhum">; // Period of the day
  paginas: number; // Number of pages needed for this entry
  instrutores: string[]; // Array of instructor identifiers for this slot
  horario: string; // Formatted time range for the entire block (e.g., "08:00 ÀS 17:00")
  intervalo?: string; // Formatted time range for the interval, if applicable (e.g., "12:00 ÀS 13:00")
};

// Type for split times across different periods
type SplitTimes = {
  manha?: string;
  tarde?: string;
  noite?: string;
};

type TabelaXML = {
  tipo: Exclude<Period, "nenhum">;
};

const MAIN_XML_TAG = "<!-- TABLE -->";

// Configuration for lerTabelaXml
const TabelaXmlFilePaths: Partial<
  Record<
    Exclude<Period, "nenhum" | "manhaTarde" | "tardeNoite" | "manhaNoite">,
    string
  >
> = {
  manha: "/templates/identificador/tabela-single-manha.xml",
  tarde: "/templates/identificador/tabela-single-tarde.xml",
  noite: "/templates/identificador/tabela-single-noite.xml",
};

const TabelaXmlConstantData: Partial<
  Record<Extract<Period, "manhaTarde" | "tardeNoite" | "manhaNoite">, string>
> = {
  manhaTarde: TABLE_DOUBLE_PERIOD,
  tardeNoite: TABLE_DOUBLE_TARDE_NOITE,
  manhaNoite: TABLE_DOUBLE_MANHA_NOITE,
};

// Processes and sorts the course schedule data
function sortData(
  courseData: CourseData[], // Changed parameter type
  numParticipantes: number
): SortedScheduleEntry[] {
  const numeroPaginas = Math.ceil(numParticipantes / 10);
  const groupedEntriesMap = new Map<string, SortedScheduleEntry>();

  courseData.forEach((item) => {
    const dateDetails = item.date; // This is { date, start, end, intervalStart, intervalEnd }

    if (
      !dateDetails ||
      !dateDetails.date ||
      !dateDetails.start ||
      !dateDetails.end
    ) {
      console.warn(
        "Skipping item due to missing date, start, or end time in dateDetails:",
        item
      );
      return;
    }

    const processInstructor = (instrutorConfig: {
      instrutor?: string;
      periodo?: string;
    }) => {
      if (
        instrutorConfig &&
        instrutorConfig.instrutor &&
        instrutorConfig.periodo &&
        instrutorConfig.periodo !== "nenhum"
      ) {
        const instrutorIdentifier = instrutorConfig.instrutor;
        const periodo = instrutorConfig.periodo as Exclude<Period, "nenhum">;

        const key = `${dateDetails.date}-${periodo}`;

        const horario = `${dateDetails.start} ÀS ${dateDetails.end}`;
        let intervalo: string | undefined = undefined;
        if (
          dateDetails.intervalStart &&
          dateDetails.intervalStart !== "N/A" &&
          dateDetails.intervalEnd &&
          dateDetails.intervalEnd !== "N/A"
        ) {
          intervalo = `${dateDetails.intervalStart} ÀS ${dateDetails.intervalEnd}`;
        }

        const existingEntry = groupedEntriesMap.get(key);
        if (!existingEntry) {
          groupedEntriesMap.set(key, {
            dia: dateDetails.date,
            periodo: periodo,
            paginas: numeroPaginas,
            instrutores: [instrutorIdentifier],
            horario: horario,
            intervalo: intervalo,
          });
        } else {
          if (!existingEntry.instrutores.includes(instrutorIdentifier)) {
            existingEntry.instrutores.push(instrutorIdentifier);
          }
        }
      }
    };

    processInstructor(item.instrutorA);
    processInstructor(item.instrutorB);
  });

  const groupedEntries = Array.from(groupedEntriesMap.values());
  const periodOrder: Record<Exclude<Period, "nenhum">, number> = {
    manha: 1,
    tarde: 2,
    noite: 3,
    manhaTarde: 4,
    manhaNoite: 5,
    tardeNoite: 6,
  };

  groupedEntries.sort((a, b) => {
    if (a.dia < b.dia) return -1;
    if (a.dia > b.dia) return 1;
    return periodOrder[a.periodo] - periodOrder[b.periodo];
  });

  return groupedEntries;
}

// Updated function to handle new periods and split times
function substituirOcorrencias(
  texto: string,
  instrutor: string,
  data: string,
  periodo: Exclude<Period, "nenhum">,
  splitTimes: SplitTimes
): string {
  const includesManha = periodo.includes("manha");
  const includesTarde =
    periodo.includes("tarde") || periodo.includes("manhaTarde");
  const includesNoite =
    periodo.includes("noite") ||
    periodo.includes("manhaNoite") ||
    periodo.includes("tardeNoite");

  const contador = {
    pi: 0,
    p_nome: 0,
    p_matricula: 0,
    p_codigo: 0,
    p_manha: 0,
    p_tarde: 0,
    p_noite: 0,
  };

  const patterns: Record<string, () => string> = {
    "\\[pi\\]": () => `${++contador.pi}`,
    "\\[p_nome\\]": () => `[p_nome${++contador.p_nome}]`,
    "\\[p_matricula\\]": () => `[p_matricula${++contador.p_matricula}]`,
    "\\[p_codigo\\]": () => `[p_codigo${++contador.p_codigo}]`,
    "\\[instrutor\\]": () => instrutor,
    "\\[data_frequencia\\]": () => data,
    "\\[manha\\]": () => (includesManha ? "MANHÃ" : ""),
    "\\[tarde\\]": () => (includesTarde ? "TARDE" : ""),
    "\\[noite\\]": () => (includesNoite ? "NOITE" : ""),
    "\\[manha_h\\]": () => (includesManha ? splitTimes.manha || "" : ""),
    "\\[tarde_h\\]": () => (includesTarde ? splitTimes.tarde || "" : ""),
    "\\[noite_h\\]": () => (includesNoite ? splitTimes.noite || "" : ""),
    "\\[p_manha\\]": () =>
      includesManha ? `[p_manha${++contador.p_manha}]` : "",
    "\\[p_tarde\\]": () =>
      includesTarde ? `[p_tarde${++contador.p_tarde}]` : "",
    "\\[p_noite\\]": () =>
      includesNoite ? `[p_noite${++contador.p_noite}]` : "",
  };

  return Object.entries(patterns).reduce(
    (result, [pattern, replacer]) =>
      result.replace(new RegExp(pattern, "g"), replacer),
    texto
  );
}

// Fetches XML template content based on the period type
async function lerTabelaXml({ tipo }: TabelaXML): Promise<string> {
  if (tipo in TabelaXmlConstantData) {
    return TabelaXmlConstantData[tipo as keyof typeof TabelaXmlConstantData]!;
  }

  const filePath = TabelaXmlFilePaths[tipo as keyof typeof TabelaXmlFilePaths];
  if (filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        console.error(
          `Erro ao buscar template XML: ${response.status} ${filePath}`
        );
        return "";
      }
      return await response.text();
    } catch (error) {
      console.error(`Erro de rede ao buscar template XML: ${filePath}`, error);
      return "";
    }
  }

  console.error("Tipo de tabela XML não reconhecido ou não mapeado:", tipo);
  return "";
}

/**
 * Calculates the specific time slots for manha, tarde, or noite periods,
 * especially when a combined period (like manhaTarde) is involved,
 * considering a potential interval.
 */
function calculateSplitTimes(
  periodo: Exclude<Period, "nenhum">,
  horario: string, // Full period horario, e.g., "08:00 ÀS 17:00"
  intervalo?: string // Interval, e.g., "12:00 ÀS 13:00"
): SplitTimes {
  const [startTime, endTime] = horario.split(" ÀS ");

  const getValidTimePart = (part?: string) =>
    part && part !== "N/A" ? part : undefined;
  const intervalParts = intervalo?.split(" ÀS ");
  const intervalStart = getValidTimePart(intervalParts?.[0]);
  const intervalEnd = getValidTimePart(intervalParts?.[1]);

  const splitTimes: SplitTimes = {};

  switch (periodo) {
    case "manha":
      splitTimes.manha = horario;
      break;
    case "tarde":
      splitTimes.tarde = horario;
      break;
    case "noite":
      splitTimes.noite = horario;
      break;
    case "manhaTarde":
      if (intervalStart && intervalEnd) {
        // Both interval parts defined
        splitTimes.manha = `${startTime} ÀS ${intervalStart}`;
        splitTimes.tarde = `${intervalEnd} ÀS ${endTime}`;
      } else if (intervalStart) {
        // Only interval start defined
        splitTimes.manha = `${startTime} ÀS ${intervalStart}`;
        splitTimes.tarde = `${intervalStart} ÀS ${endTime}`;
      } else if (intervalEnd) {
        // Only interval end defined (original specific override)
        splitTimes.manha = `${startTime} ÀS ${endTime}`;
        splitTimes.tarde = "";
      } else {
        // Neither interval part defined, use default 12:00 split
        splitTimes.manha = `${startTime} ÀS 12:00`;
        splitTimes.tarde = `12:00 ÀS ${endTime}`;
      }
      break;
    case "tardeNoite":
      if (intervalStart && intervalEnd) {
        // Both interval parts defined
        splitTimes.tarde = `${startTime} ÀS ${intervalStart}`;
        splitTimes.noite = `${intervalEnd} ÀS ${endTime}`;
      } else if (intervalStart) {
        // Only interval start defined
        splitTimes.tarde = `${startTime} ÀS ${intervalStart}`;
        splitTimes.noite = `${intervalStart} ÀS ${endTime}`;
      } else if (intervalEnd) {
        // Only interval end defined (original specific override)
        splitTimes.tarde = `${startTime} ÀS ${endTime}`;
        splitTimes.noite = "";
      } else {
        // Neither interval part defined, use default 18:00 split
        splitTimes.tarde = `${startTime} ÀS 18:00`;
        splitTimes.noite = `18:00 ÀS ${endTime}`;
      }
      break;
    case "manhaNoite": // Assumes a break between manha and noite, defined by interval or default
      if (intervalStart && intervalEnd) {
        splitTimes.manha = `${startTime} ÀS ${intervalStart}`;
        splitTimes.noite = `${intervalEnd} ÀS ${endTime}`;
      } else {
        // Default full day split (manha until 12:00, noite from 18:00)
        splitTimes.manha = `${startTime} ÀS 12:00`;
        splitTimes.noite = `18:00 ÀS ${endTime}`;
      }
      break;
  }
  return splitTimes;
}

// Formats the sorted schedule entries into an XML string for the document
async function formatarPaginas(pages: SortedScheduleEntry[]): Promise<string> {
  let newXmlPages = "";

  for (const day of pages) {
    const formattedDate = day.dia.split("-").reverse().join("/");
    const splitTimes = calculateSplitTimes(
      day.periodo,
      day.horario,
      day.intervalo
    );

    for (const instrutorId of day.instrutores) {
      const tabelaXml = await lerTabelaXml({ tipo: day.periodo });
      if (tabelaXml) {
        // Ensure tabelaXml is not empty
        const repetition = tabelaXml.repeat(day.paginas);
        newXmlPages += substituirOcorrencias(
          repetition,
          instrutorId,
          formattedDate,
          day.periodo,
          splitTimes
        );
      }
    }
  }
  return newXmlPages;
}

export async function gerarIdentificador(
  docData: Identificador,
  courseData: CourseData[],
  numeroParticipantes: number
): Promise<void> {
  try {
    const formattedPages = sortData(courseData, numeroParticipantes);

    const DOCX_TEMPLATE_BUFFER = await loadFile(
      "/templates/identificador/identificacao-do-participante-nova.docx"
    );

    const templateFileName =
      docData.conteudo_aplicado.length <= 800
        ? "document-template.xml"
        : "document-3colunas.xml";

    const [MAIN_XML_RESPONSE, HEADER3_XML_RESPONSE] = await Promise.all([
      fetch(`/templates/identificador/${templateFileName}`),
      fetch(`/templates/identificador/header3.xml`),
    ]);

    if (!MAIN_XML_RESPONSE.ok)
      throw new Error(`Falha ao buscar ${templateFileName}`);
    if (!HEADER3_XML_RESPONSE.ok)
      throw new Error(`Falha ao buscar header3.xml`);

    const [MAIN_XML_CONTENT, HEADER3_XML_CONTENT] = await Promise.all([
      MAIN_XML_RESPONSE.text(),
      HEADER3_XML_RESPONSE.text(),
    ]);

    const pagesXmlContent = await formatarPaginas(formattedPages);
    const UPDATED_DOCUMENT_XML_FILE =
      MAIN_XML_CONTENT.split(MAIN_XML_TAG).join(pagesXmlContent);

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

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const dateTimeString = `${day}${month}${year}T${hours}${minutes}`;

    const treinamentoNome =
      typeof docData.treinamento === "string"
        ? docData.treinamento
        : "IDENTIFICADOR";

    const cleanedTreinamento = treinamentoNome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");

    const newFilename = `${cleanedTreinamento}_${dateTimeString}.docx`;

    saveAs(out, newFilename);
  } catch (error) {
    console.error("Erro ao gerar identificador:", error);
    // Potentially re-throw or handle more gracefully depending on application needs
  }
}
