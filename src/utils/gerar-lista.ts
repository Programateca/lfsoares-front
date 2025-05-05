import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { loadFile } from "./load-file";

import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import {
  BREAK_PAGE_XML,
  TABLE_DIA_TODO,
  TABLE_MEIO_PERIODO,
} from "./constants-xml-data-lista";

type DatasObject = {
  date: string;
  start: string;
  end: string;
  intervalStart: string;
  intervalEnd: string;
  instrutor: string;
  instrutorA: boolean;
  instrutorB: boolean;
};

type FormattedDateResult = {
  date: string;
  start: string;
  end: string;
  intervalStart?: string;
  intervalEnd?: string;
  instrutor: string;
  instrutorA: boolean;
  instrutorB: boolean;
  periodo: string;
};

type Props = {
  listaData: Record<string, any>;
};

export async function gerarLista({ listaData }: Props): Promise<void> {
  const FILE_NAME_A = "lista-instrutor-A.docx";
  const FILE_NAME_B = "lista-instrutor-B.docx";
  const TOTAL_PARTICIPANTS = listaData.numberOfParticipantes;
  const TAG_NAME = "<!-- TABLE -->";
  const LISTA_TEMPLATE_DOCX_PATH = "/templates/lista/template-lista.docx";
  const DOCUMENT_XML_PATH = "/templates/lista/document.xml";

  try {
    // if (!(await fs.exists(DOCUMENT_XML_PATH))) {
    //   throw new Error("Arquivo DOCUMENT_XML_PATH não encontrado");
    // }

    const DOCUMENT_XML = await (await fetch(DOCUMENT_XML_PATH)).text();
    if (!DOCUMENT_XML) {
      throw new Error("Conteúdo do XML principal não encontrado");
    }
    if (!DOCUMENT_XML.includes(TAG_NAME)) {
      throw new Error("TAG_NAME não encontrada no XML principal");
    }

    const formattedDates = formatDates(listaData.datasObject);
    // console.log(formattedDates);

    // INSTRUTOR A
    if (formattedDates.instrutorA.length) {
      const documentA = DOCUMENT_XML.split(TAG_NAME).join(
        makeTables(formattedDates.instrutorA, TOTAL_PARTICIPANTS)
      );

      await saveAndRenderFile({
        listaData,
        templatePath: LISTA_TEMPLATE_DOCX_PATH,
        outputFileName: FILE_NAME_A,
        updatedDocumentXML: documentA,
      });
    }

    // INSTRUTOR B
    if (formattedDates.instrutorB.length) {
      const documentB = DOCUMENT_XML.split(TAG_NAME).join(
        makeTables(formattedDates.instrutorB, TOTAL_PARTICIPANTS)
      );
      await saveAndRenderFile({
        listaData,
        templatePath: LISTA_TEMPLATE_DOCX_PATH,
        outputFileName: FILE_NAME_B,
        updatedDocumentXML: documentB,
      });
    }
  } catch (error: any) {
    console.error("Erro ao processar ou gerar o documento:", error);
    if (error.properties && error.properties.errors) {
      console.error("Docxtemplater errors:");
    }
  }
}

function makeTables(data: FormattedDateResult[], participantsCount: number) {
  const pagesNumber = Math.ceil(participantsCount / 5);
  return data
    .map((item, index) => {
      if (item.intervalStart) {
        if (data.length === index + 1) {
          return substituirOcorrencias(TABLE_DIA_TODO.repeat(pagesNumber), item)
            .split(BREAK_PAGE_XML)
            .join("");
        }
        return substituirOcorrencias(TABLE_DIA_TODO.repeat(pagesNumber), item);
      }
      if (data.length === index + 1) {
        return substituirOcorrencias(
          TABLE_MEIO_PERIODO.repeat(pagesNumber),
          item
        )
          .split(BREAK_PAGE_XML)
          .join("");
      }
      return substituirOcorrencias(
        TABLE_MEIO_PERIODO.repeat(pagesNumber),
        item
      );
    })
    .join("");
}

function substituirOcorrencias(
  texto: string,
  data: FormattedDateResult
): string {
  const contador = {
    pi: 0,
    p_nome: 0,
    p_matricula: 0,
    p_codigo: 0,
    p_manha: 0,
    p_tarde: 0,
  };

  let diaTodoPeriodo = [];
  if (data.periodo === "dia-todo") {
    const startHour = parseInt(data.start.split(":")[0], 10);
    if (!isNaN(startHour)) {
      if (startHour < 12) {
        diaTodoPeriodo.push("MANHÃ");
      } else if (startHour >= 12 && startHour < 18) {
        diaTodoPeriodo.push("TARDE");
      } else {
        // >= 18
        diaTodoPeriodo.push("NOITE");
      }
    } else {
      diaTodoPeriodo.push("INDEFINIDO"); // Handle parsing error
    }

    // Calculate period based on intervalEnd time (start of the second session)
    // Ensure intervalEnd exists before parsing
    if (data.intervalEnd) {
      const intervalEndHour = parseInt(data.intervalEnd.split(":")[0], 10);
      if (!isNaN(intervalEndHour)) {
        if (intervalEndHour < 12) {
          // Should typically be afternoon/night
          diaTodoPeriodo.push("MANHÃ");
        } else if (intervalEndHour >= 12 && intervalEndHour < 18) {
          diaTodoPeriodo.push("TARDE");
        } else {
          // >= 18
          diaTodoPeriodo.push("NOITE");
        }
      } else {
        diaTodoPeriodo.push("INDEFINIDO"); // Handle parsing error
      }
    } else {
      diaTodoPeriodo.push("INDEFINIDO"); // Handle missing intervalEnd
    }
  }

  const patterns: { [key: string]: () => string } = {
    p_: () => `${++contador.pi}`,
    participante_: () =>
      `[p_${(++contador.p_nome).toString().padStart(2, "0")}]`,
    "\\[datas\\]": () => {
      const [year, month, day] = data.date.split("-");
      return `${day}/${month}/${year}`;
    },
    "\\[nome_instrutor\\]": () => data.instrutor,
    "\\[intervalo\\]": () =>
      data.intervalStart
        ? `${data.intervalStart} ÀS ${data.intervalEnd}`
        : "N/A",
    "\\[horario\\]": () =>
      data.intervalStart
        ? `${data.start} ÀS ${data.intervalStart} E ${data.intervalEnd} ÀS ${data.end}`
        : `${data.start} ÀS ${data.end}`,
    PERIODO_1: () => diaTodoPeriodo[0],
    PERIODO_2: () => diaTodoPeriodo[1],
    PERIODO: () =>
      data.periodo === "manha" ? "MANHÃ" : data.periodo.toUpperCase(),
    HORARIO_1: () => `${data.start} ÀS ${data.intervalStart}`,
    HORARIO_2: () => `${data.intervalEnd} ÀS ${data.end}`,
    HORARIO: () => `${data.start} ÀS ${data.end}`,
  };

  // Apply replacements sequentially
  let result = texto;
  for (const [pattern, replacer] of Object.entries(patterns)) {
    // Use a loop for replacement to handle the counter increments correctly within each match
    result = result.replace(new RegExp(pattern, "g"), replacer);
  }
  return result;
}

function determinePeriodo(
  start: string,
  end: string
): "manha" | "tarde" | "dia-todo" | "indefinido" {
  // Basic validation
  if (!start || !end || !start.includes(":") || !end.includes(":")) {
    return "indefinido";
  }

  const startHour = parseInt(start.split(":")[0], 10);
  const endHour = parseInt(end.split(":")[0], 10);
  // Basic validation for parsed hours
  if (isNaN(startHour) || isNaN(endHour)) {
    return "indefinido";
  }

  // Define time boundaries (adjust if needed)
  const morningEndHour = 12;
  const afternoonStartHour = 13; // Assuming interval is 12-13

  const startsInMorning = startHour < morningEndHour;
  const endsInAfternoon = endHour >= afternoonStartHour; // Use >= to include times ending exactly at the start of the afternoon or later
  const startsInAfternoon = startHour >= afternoonStartHour;

  // Check for full day spanning morning and afternoon
  if (startsInMorning && endsInAfternoon) {
    // Example: 08:00 - 17:00
    return "dia-todo";
  } else if (startsInMorning && endHour <= morningEndHour) {
    // Example: 08:00 - 12:00
    return "manha";
  } else if (startsInAfternoon) {
    // Example: 13:00 - 17:00
    return "tarde";
  } else {
    // Covers edge cases or times strictly within the typical lunch break, etc.
    // Or could indicate an error in data.
    console.warn(
      `Could not determine periodo for start: ${start}, end: ${end}`
    );
    return "indefinido";
  }
}

function formatDates(dates: DatasObject[]) {
  // 1. Group entries by date
  const groupedByDate = dates.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    // Sort entries within the date by start time for consistent processing
    acc[date].sort((a, b) => a.start.localeCompare(b.start));
    return acc;
  }, {} as Record<string, DatasObject[]>);

  const results = [];

  // 2. Process each date group
  for (const date in groupedByDate) {
    const dailyEntries = groupedByDate[date];

    if (dailyEntries.length === 1) {
      // Case 1: Single entry for the day
      const entry = dailyEntries[0];
      const periodo = determinePeriodo(entry.start, entry.end);

      // Keep interval only if it's a standard full day (e.g., 8-17)
      // Adjust this condition based on the precise definition of a "full day"
      const isStandardFullDay =
        entry.start === "08:00" && entry.end === "17:00";

      if (isStandardFullDay && periodo === "dia-todo") {
        // Full day, single instructor, keep interval
        results.push({
          date: entry.date,
          start: entry.start,
          end: entry.end,
          intervalStart: entry.intervalStart,
          intervalEnd: entry.intervalEnd,
          instrutor: entry.instrutor,
          instrutorA: entry.instrutorA,
          instrutorB: entry.instrutorB,
          periodo: "dia-todo",
        });
      } else {
        // Partial day or non-standard full day, remove interval
        results.push({
          date: entry.date,
          start: entry.start,
          end: entry.end,
          // intervalStart and intervalEnd are omitted
          instrutor: entry.instrutor,
          instrutorA: entry.instrutorA,
          instrutorB: entry.instrutorB,
          periodo: periodo, // Use determined periodo ('manha', 'tarde', 'indefinido')
        });
      }
    } else if (dailyEntries.length === 2) {
      // Case 2: Two entries for the day (expected: morning and afternoon)
      const entry1 = dailyEntries[0]; // Assumes first is morning due to sort
      const entry2 = dailyEntries[1]; // Assumes second is afternoon

      if (entry1.instrutor === entry2.instrutor) {
        // Same instructor for both periods: Combine into one full-day entry, keep interval
        results.push({
          date: entry1.date,
          start: entry1.start, // Start of the first period
          end: entry2.end, // End of the second period
          intervalStart: entry1.intervalStart, // Keep interval (assuming consistent)
          intervalEnd: entry1.intervalEnd,
          instrutor: entry1.instrutor,
          instrutorA: entry1.instrutorA,
          instrutorB: entry1.instrutorB,
          periodo: "dia-todo",
        });
      } else {
        // Different instructors: Create two separate entries, remove interval
        // Entry 1 (Morning)
        results.push({
          date: entry1.date,
          start: entry1.start,
          end: entry1.end,
          // intervalStart and intervalEnd are omitted
          instrutor: entry1.instrutor,
          instrutorA: entry1.instrutorA,
          instrutorB: entry1.instrutorB,
          periodo: determinePeriodo(entry1.start, entry1.end), // Should be 'manha'
        });
        // Entry 2 (Afternoon)
        results.push({
          date: entry2.date,
          start: entry2.start,
          end: entry2.end,
          // intervalStart and intervalEnd are omitted
          instrutor: entry2.instrutor,
          instrutorA: entry2.instrutorA,
          instrutorB: entry2.instrutorB,
          periodo: determinePeriodo(entry2.start, entry2.end), // Should be 'tarde'
        });
      }
    }
    // Optional: Handle cases with > 2 entries per day if necessary
    else if (dailyEntries.length > 2) {
      console.warn(
        `Date ${date} has ${dailyEntries.length} entries. Processing individually without interval.`
      );
      // Process each entry individually as a partial day without interval
      dailyEntries.forEach((entry) => {
        results.push({
          date: entry.date,
          start: entry.start,
          end: entry.end,
          instrutor: entry.instrutor,
          instrutorA: entry.instrutorA,
          instrutorB: entry.instrutorB,
          periodo: determinePeriodo(entry.start, entry.end),
        });
      });
    }
  }

  // 3. Optional: Sort final results by date then start time for consistency
  results.sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    // If dates are the same, sort by start time
    return a.start.localeCompare(b.start);
  });

  // Define the type for the accumulator
  type SeparatedResults = {
    instrutorA: FormattedDateResult[];
    instrutorB: FormattedDateResult[];
  };

  const separaPorInstrutor = results.reduce<SeparatedResults[]>(
    (acc, item) => {
      const { instrutorA, instrutorB } = item;
      if (instrutorA) {
        // Ensure item matches the expected type if necessary, though TS should handle the union
        acc[0].instrutorA.push(item as FormattedDateResult);
      }
      if (instrutorB) {
        acc[0].instrutorB.push(item as FormattedDateResult);
      }
      return acc;
    },
    [{ instrutorA: [], instrutorB: [] }] // Initial value matches the accumulator type
  );

  return separaPorInstrutor[0];
}

async function saveAndRenderFile({
  templatePath,
  outputFileName,
  listaData,
  updatedDocumentXML,
}: {
  templatePath: string;
  outputFileName: string;
  updatedDocumentXML: string;
  listaData: Record<string, any>;
}) {
  const templateBuffer = await loadFile(templatePath);

  const zip = new PizZip(templateBuffer);
  zip.file("word/document.xml", updatedDocumentXML);

  // Create Docxtemplater instance
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
    parser: expressionParser,
  });

  doc.render(listaData);

  const out = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  saveAs(out, outputFileName);
}
