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
import { Identificador, CourseData } from "@/@types/Identificador";
import { calcularPeriodoDia } from "./calcular-periodo-dia";
import { date } from "zod";

type FormattedDateResult = {
  date: string;
  start: string;
  end: string;
  intervalStart?: string;
  intervalEnd?: string;
  instrutor: string; // Original instructor name for content
  periodo: string;
};

type Props = {
  listaData: Partial<Identificador> & {
    numberOfParticipantes: number;
  };
};

export async function gerarLista({ listaData }: Props): Promise<void> {
  console.log("Dados da Lista", listaData.courseData);
  const TOTAL_PARTICIPANTS = listaData.numberOfParticipantes;
  const TAG_NAME = "<!-- TABLE -->";
  const LISTA_TEMPLATE_DOCX_PATH = "/templates/lista/template-lista.docx";
  const DOCUMENT_XML_PATH = "/templates/lista/document.xml";

  try {
    const DOCUMENT_XML = await (await fetch(DOCUMENT_XML_PATH)).text();
    if (!DOCUMENT_XML) {
      throw new Error("Conteúdo do XML principal não encontrado");
    }
    if (!DOCUMENT_XML.includes(TAG_NAME)) {
      throw new Error("TAG_NAME não encontrada no XML principal");
    }

    const allInstructorFormattedDates = formatDates(listaData.courseData!);

    console.log("Dados formatados por instrutor:", allInstructorFormattedDates);

    for (const sanitizedInstructorNameKey in allInstructorFormattedDates) {
      if (
        allInstructorFormattedDates.hasOwnProperty(sanitizedInstructorNameKey)
      ) {
        const instructorDates =
          allInstructorFormattedDates[sanitizedInstructorNameKey];

        if (instructorDates.length > 0) {
          const actualInstructorNameForContent = instructorDates[0].instrutor;

          const now = new Date();
          const day = String(now.getDate()).padStart(2, "0");
          const month = String(now.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
          const year = now.getFullYear();
          const hours = String(now.getHours()).padStart(2, "0");
          const minutes = String(now.getMinutes()).padStart(2, "0");

          const dateTimeString = `${day}-${month}-${year}_${hours}-${minutes}`;

          const outputFileName = `LISTA-${sanitizedInstructorNameKey.toUpperCase()}-${dateTimeString}.docx`;

          const documentTablesContent = removerUltimaOcorrencia(
            makeTables(instructorDates, TOTAL_PARTICIPANTS),
            BREAK_PAGE_XML
          );
          const finalDocumentXml = DOCUMENT_XML.split(TAG_NAME).join(
            documentTablesContent
          );

          // Prepare a copy of listaData, but override the 'instrutor' field for the current instructor
          const instructorSpecificListaData = {
            ...listaData,
            // Ensure the 'instrutor' field in the template is populated with the current instructor's name
            instrutor: actualInstructorNameForContent,
            // Clear out general instructor fields if they exist at the top level of listaData
            // to avoid them overriding or conflicting in the template if it's not designed for multiple instructors.
            instrutor_a: undefined, // Or set to specific if template expects it
            instrutor_b: undefined, // Or set to specific if template expects it
            // If your template uses assinante1, assinante2 for instructors, adjust accordingly.
            // For example, if assinante1 is always the current instructor for this list:
            // assinante1: actualInstructorNameForContent,
            // assinante2: undefined, // if the list is for a single instructor at a time
          };

          await saveAndRenderFile({
            listaData: instructorSpecificListaData,
            templatePath: LISTA_TEMPLATE_DOCX_PATH,
            outputFileName: outputFileName,
            updatedDocumentXML: finalDocumentXml,
          });
        }
      }
    }
  } catch (error: any) {
    console.error("Erro ao processar ou gerar o documento:", error);
    if (error.properties && error.properties.errors) {
      console.error("Docxtemplater errors:", error.properties.errors);
    }
  }
}

function makeTables(data: FormattedDateResult[], participantsCount: number) {
  const pagesNumber = Math.ceil(participantsCount / 5);
  return data
    .map((item) => {
      if (item.intervalStart && item.intervalStart !== "N/A") {
        return substituirOcorrencias(TABLE_DIA_TODO.repeat(pagesNumber), item);
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

  const PERIODOS = {
    manha: "MANHÃ",
    tarde: "TARDE",
    noite: "NOITE",
  };

  if (
    data.intervalStart &&
    data.intervalEnd &&
    data.intervalStart !== "N/A" &&
    data.intervalEnd !== "N/A"
  ) {
    diaTodoPeriodo.push(
      PERIODOS[
        calcularPeriodoDia(
          data.start,
          data.intervalStart
        ) as keyof typeof PERIODOS
      ]
    );
    diaTodoPeriodo.push(
      PERIODOS[
        calcularPeriodoDia(data.intervalEnd, data.end) as keyof typeof PERIODOS
      ]
    );
  }

  // Calculate period based on intervalEnd time (start of the second session)
  // Ensure intervalEnd exists before parsing

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
      data.intervalStart &&
      data.intervalStart !== "N/A" &&
      data.intervalEnd &&
      data.intervalEnd !== "N/A"
        ? `${data.intervalStart} ÀS ${data.intervalEnd}`
        : "N/A",
    "\\[horario\\]": () => `${data.start} ÀS ${data.end}`,
    PERIODO_1: () => diaTodoPeriodo[0] || "",
    PERIODO_2: () => diaTodoPeriodo[1] || "",
    PERIODO: () =>
      data.periodo === "manha" ? "MANHÃ" : data.periodo.toUpperCase(),
    HORARIO_1: () =>
      data.intervalStart && data.intervalStart !== "N/A"
        ? `${data.start} ÀS ${data.intervalStart}`
        : `${data.start} ÀS ${data.end}`,
    HORARIO_2: () =>
      data.intervalEnd && data.intervalEnd !== "N/A"
        ? `${data.intervalEnd} ÀS ${data.end}`
        : "",
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

function formatDates(dates: CourseData[]): {
  [sanitizedInstructorName: string]: FormattedDateResult[];
} {
  const allInstructorResults: { [key: string]: FormattedDateResult[] } = {};

  const sortFn = (a: FormattedDateResult, b: FormattedDateResult) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    const aStart = a.start || "";
    const bStart = b.start || "";
    return aStart.localeCompare(bStart);
  };

  function addResult(
    instructorName: string | undefined,
    periodo: string | undefined,
    baseDateDetails: CourseData["date"],
    entryStart: string,
    entryEnd: string,
    isSegmentOfInterval: boolean
  ) {
    if (instructorName && periodo && periodo !== "nenhum") {
      const sanitizedName = sanitizeFilename(instructorName);
      if (!allInstructorResults[sanitizedName]) {
        allInstructorResults[sanitizedName] = [];
      }

      const result: FormattedDateResult = {
        date: baseDateDetails.date,
        start: entryStart,
        end: entryEnd,
        intervalStart: isSegmentOfInterval
          ? "N/A"
          : baseDateDetails.intervalStart,
        intervalEnd: isSegmentOfInterval ? "N/A" : baseDateDetails.intervalEnd,
        instrutor: instructorName,
        periodo: periodo || "", // Ensure periodo is a string
      };

      const existingEntry = allInstructorResults[sanitizedName].find(
        (entry) =>
          entry.date === result.date &&
          entry.start === result.start &&
          entry.end === result.end &&
          entry.periodo === result.periodo &&
          entry.intervalStart === result.intervalStart &&
          entry.intervalEnd === result.intervalEnd
      );
      if (!existingEntry) {
        allInstructorResults[sanitizedName].push(result);
      }
    }
  }

  for (const courseItem of dates) {
    const originalDateDetails = { ...courseItem.date }; // Use a fresh copy

    const hasInterval =
      originalDateDetails.intervalStart &&
      originalDateDetails.intervalStart !== "N/A" &&
      originalDateDetails.intervalEnd &&
      originalDateDetails.intervalEnd !== "N/A";

    let periodoHorario1: string | undefined;
    let periodoHorario2: string | undefined;

    if (hasInterval) {
      periodoHorario1 = calcularPeriodoDia(
        originalDateDetails.start,
        originalDateDetails.intervalStart!
      );
      periodoHorario2 = calcularPeriodoDia(
        originalDateDetails.intervalEnd!,
        originalDateDetails.end
      );
    }

    // Process Instrutor A
    if (
      courseItem.instrutorA &&
      courseItem.instrutorA.instrutor &&
      courseItem.instrutorA.periodo &&
      courseItem.instrutorA.periodo !== "nenhum"
    ) {
      let entryStart = originalDateDetails.start;
      let entryEnd = originalDateDetails.end;
      let isSegment = false;

      if (hasInterval) {
        if (courseItem.instrutorA.periodo === periodoHorario1) {
          entryStart = originalDateDetails.start;
          entryEnd = originalDateDetails.intervalStart!;
          isSegment = true;
        } else if (courseItem.instrutorA.periodo === periodoHorario2) {
          entryStart = originalDateDetails.intervalEnd!;
          entryEnd = originalDateDetails.end;
          isSegment = true;
        }
      }
      addResult(
        courseItem.instrutorA.instrutor,
        courseItem.instrutorA.periodo,
        originalDateDetails,
        entryStart,
        entryEnd,
        isSegment
      );
    }

    // Process Instrutor B
    if (
      courseItem.instrutorB &&
      courseItem.instrutorB.instrutor &&
      courseItem.instrutorB.periodo &&
      courseItem.instrutorB.periodo !== "nenhum"
    ) {
      let entryStart = originalDateDetails.start;
      let entryEnd = originalDateDetails.end;
      let isSegment = false;

      if (hasInterval) {
        if (courseItem.instrutorB.periodo === periodoHorario1) {
          entryStart = originalDateDetails.start;
          entryEnd = originalDateDetails.intervalStart!;
          isSegment = true;
        } else if (courseItem.instrutorB.periodo === periodoHorario2) {
          entryStart = originalDateDetails.intervalEnd!;
          entryEnd = originalDateDetails.end;
          isSegment = true;
        }
      }
      addResult(
        courseItem.instrutorB.instrutor,
        courseItem.instrutorB.periodo,
        originalDateDetails,
        entryStart,
        entryEnd,
        isSegment
      );
    }

    // Process instrutoresConfig
    if (courseItem.instrutoresConfig) {
      for (const config of courseItem.instrutoresConfig) {
        if (
          !config.instrutor ||
          !config.periodo ||
          config.periodo === "nenhum"
        ) {
          continue;
        }

        let entryStart = originalDateDetails.start;
        let entryEnd = originalDateDetails.end;
        let isSegment = false;

        if (hasInterval) {
          if (config.periodo === periodoHorario1) {
            entryStart = originalDateDetails.start;
            entryEnd = originalDateDetails.intervalStart!;
            isSegment = true;
          } else if (config.periodo === periodoHorario2) {
            entryStart = originalDateDetails.intervalEnd!;
            entryEnd = originalDateDetails.end;
            isSegment = true;
          }
        }
        addResult(
          config.instrutor,
          config.periodo,
          originalDateDetails,
          entryStart,
          entryEnd,
          isSegment
        );
      }
    }
  }

  // Sort results for each instructor
  for (const instrName in allInstructorResults) {
    if (allInstructorResults.hasOwnProperty(instrName)) {
      allInstructorResults[instrName].sort(sortFn);
    }
  }

  return allInstructorResults;
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

function removerUltimaOcorrencia(texto: string, padrao: string): string {
  const ultimoIndice = texto.lastIndexOf(padrao);

  if (ultimoIndice === -1) {
    // O padrão não foi encontrado, retorna o texto original
    return texto;
  }

  // Extrai a parte da string antes da última ocorrência
  const parteAnterior = texto.slice(0, ultimoIndice);

  // Extrai a parte da string depois da última ocorrência
  const partePosterior = texto.slice(ultimoIndice + padrao.length);

  // Combina as partes para formar a nova string sem a última ocorrência
  return parteAnterior + partePosterior;
}

// Helper function to sanitize filenames
function sanitizeFilename(name: string): string {
  if (!name) return "instrutor_desconhecido";
  return name
    .normalize("NFD") // Normalize to decompose combined graphemes
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_.-]/g, ""); // Remove invalid characters (allow letters, numbers, underscore, dot, hyphen)
}
