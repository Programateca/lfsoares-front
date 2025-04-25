import { loadFile } from "./load-file";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import { saveAs } from "file-saver";

import type { Identificador } from "@/@types/Identificador";
import { CourseDate } from "@/components/Identificadores";

export type Period = "manha" | "tarde" | "manhaTarde" | "nenhum";

type PagesData = CourseDate & {
  instrutor?: string;
};

// Helper function to parse formatted dates back to individual days
// function parseDatasFormatadas(formattedString: string): string[] {
//   const days: string[] = [];

//   // Split by semicolons to get different month/year groups
//   const monthGroups = formattedString.split(";").map((s) => s.trim());

//   for (const group of monthGroups) {
//     if (!group) continue;

//     // Format could be: "1, 2, 3 E 4/05/23" or "5/05/23"
//     const match = group.match(/^(.*?)\/(\d{2})\/(\d{2,4})$/);
//     if (match) {
//       const [, dayPart, month, year] = match;

//       // Process the day part which could be "1, 2, 3 E 4" or just "5"
//       let dayNumbers: string[];
//       if (dayPart.includes(" E ")) {
//         const parts = dayPart.split(" E ");
//         dayNumbers = [...parts[0].split(", "), parts[1]];
//       } else if (dayPart.includes(",")) {
//         dayNumbers = dayPart.split(", ");
//       } else {
//         dayNumbers = [dayPart];
//       }

//       // Create full dates
//       dayNumbers.forEach((day) => {
//         days.push(
//           `${day.padStart(2, "0")}/${month}/${
//             year.length === 2 ? `20${year}` : year
//           }`
//         );
//       });
//     }
//   }

//   return days;
// }

export async function gerarIdentificador(
  docData: Identificador,
  pages: PagesData[],
  numeroParticipantes: number
) {
  const formattedPages = sortData(pages, numeroParticipantes);
  const TAG_NAME = "<!--aux-page-->";

  try {
    // Select the appropriate template based on content length
    const templateFileName =
      docData.conteudo_aplicado.length <= 1000
        ? "document-template.xml"
        : "document-3colunas.xml";

    const responseMainXml = await fetch(
      `/templates/identificacao-participante/${templateFileName}`
    );

    const mainXmlContent = await responseMainXml.text();

    const tagNameIndex = mainXmlContent.indexOf(TAG_NAME);
    if (tagNameIndex === -1) {
      console.error(`Tag <${TAG_NAME}> não encontrada.`);
      return;
    }

    const updatedXml = mainXmlContent
      .split(TAG_NAME)
      .join(await formatarPaginas(formattedPages));

    const fileArrayBuffer = await loadFile(
      "/templates/identificacao-do-participante.docx"
    );

    const zip = new PizZip(fileArrayBuffer);
    zip.file("word/document.xml", updatedXml);

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

type SortedScheduleEntry = {
  dia: string; // Date in "YYYY-MM-DD" format
  periodo: Exclude<Period, "nenhum">; // Period of the day
  instrutor: string; // Store the original instructor name
  paginas: number; // Number of pages needed for this entry
  instrutorA: boolean; // Number of pages needed for this entry
  instrutorB: boolean; // Number of pages needed for this entry
  horario: string; // Time range for the entry
  intervalo?: string; // Optional time range for the interval
};

function sortData(
  pages: PagesData[],
  numParticipantes: number
): SortedScheduleEntry[] {
  const numeroPaginas = Math.ceil(numParticipantes / 10);

  const groupedEntriesMap = new Map<string, SortedScheduleEntry>();

  function calculatePeriod(start: string, end: string): Period {
    const startHour = parseInt(start.split(":")[0], 10);
    const endHour = parseInt(end.split(":")[0], 10);
    const endMinute = parseInt(end.split(":")[1], 10);

    if (isNaN(startHour) || isNaN(endHour) || isNaN(endMinute)) {
      console.warn(
        `Invalid time format encountered: start=${start}, end=${end}`
      );
      return "nenhum"; // Return 'nenhum' for invalid formats
    }

    const endsAfterMidday = endHour > 12 || (endHour === 12 && endMinute > 0);

    if (startHour < 12 && endsAfterMidday) {
      return "manhaTarde"; // Starts before 12:00, ends after 12:00
    } else if (startHour < 12) {
      // Starts before 12:00 (and implicitly ends before or at 12:00)
      return "manha";
    } else if (startHour >= 12) {
      // Starts at or after 12:00
      return "tarde";
    } else {
      // This case should ideally not be reached with valid times
      return "nenhum";
    }
  }

  // Iterate through the flat list of page data
  pages.forEach((item) => {
    // Ensure start and end times are present before calculating period
    if (!item.start || !item.end) {
      console.warn("Skipping item due to missing start or end time:", item);
      return; // Skip this item if times are missing
    }

    // Calculate the period based on start and end times
    const periodo = calculatePeriod(item.start, item.end);

    // Get the original instructor name
    const originalInstrutor = item.instrutor;

    // Only process entries with a valid calculated period and an instructor name
    if (
      periodo !== "nenhum" &&
      originalInstrutor // Check if instructor name exists
    ) {
      // Ensure 'date' exists
      if (!item.date) {
        console.warn("Skipping item due to missing date:", item);
        return; // Skip this item if 'date' is missing
      }

      // Assuming item.date is already in "YYYY-MM-DD" format for sorting
      // Use the original instructor name in the key
      const key = `${item.date}-${periodo}-${originalInstrutor}`;

      // Construct horario string
      const horario = `${item.start} ÀS ${item.end}`;

      // Construct intervalo string, handling potential null/undefined values
      let intervalo = "N/A";
      if (
        item.intervalStart &&
        item.intervalEnd &&
        item.intervalStart !== "N/A"
      ) {
        intervalo = `${item.intervalStart} ÀS ${item.intervalEnd}`;
      }

      // If this combination is not already in the map, add it
      if (!groupedEntriesMap.has(key)) {
        groupedEntriesMap.set(key, {
          dia: item.date, // Use 'dia' for the SortedScheduleEntry property
          periodo: periodo as Exclude<Period, "nenhum">, // Cast is safe due to the check above
          instrutor: originalInstrutor, // Use the original instructor name
          paginas: numeroPaginas,
          instrutorA: item.instrutorA ? true : false,
          instrutorB: item.instrutorB ? true : false,
          horario: horario, // Add horario
          intervalo: intervalo, // Add intervalo (optional)
        });
      }
    } else if (periodo !== "nenhum" && !originalInstrutor) {
      console.warn("Skipping item due to missing instructor name:", item);
    }
  });

  // Convert the map values (unique entries) into an array
  const uniqueEntries = Array.from(groupedEntriesMap.values());

  // Define the sort order for periods
  const periodOrder: Record<Exclude<Period, "nenhum">, number> = {
    manha: 1,
    tarde: 2,
    manhaTarde: 3,
  };

  // Sort the unique entries:
  // 1. Primarily by date (chronologically, assuming YYYY-MM-DD format)
  // 2. Secondarily by instructor name (alphabetically)
  // 3. Tertiarily by period ('manha' -> 'tarde' -> 'manhaTarde')
  uniqueEntries.sort((a, b) => {
    // Compare dates
    if (a.dia < b.dia) return -1;
    if (a.dia > b.dia) return 1;

    // Dates are the same, compare instructors alphabetically
    if (a.instrutor < b.instrutor) return -1;
    if (a.instrutor > b.instrutor) return 1;

    // Dates and instructors are the same, compare periods
    if (periodOrder[a.periodo] < periodOrder[b.periodo]) return -1;
    if (periodOrder[a.periodo] > periodOrder[b.periodo]) return 1;

    // Entries are identical for sorting purposes
    return 0;
  });

  return uniqueEntries;
}

function substituirOcorrencias(
  texto: string,
  instrutor: string,
  data: string,
  hora: string,
  periodo: "manha" | "tarde" | "manhaTarde"
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
      periodo === "manha" || periodo === "manhaTarde" ? hora : "",
    "\\[tarde_h\\]": () =>
      periodo === "tarde" || periodo === "manhaTarde" ? hora : "",

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
    const response = await fetch(
      "/templates/identificacao-participante/tabela-double.xml"
    );
    return await response.text();
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
        day.periodo as "manha" | "tarde" | "manhaTarde"
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
        day.periodo as "manha" | "tarde" | "manhaTarde"
      );
    }
  }

  return newXmlPages;
}
