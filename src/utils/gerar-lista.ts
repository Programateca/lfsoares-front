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
  listaData: Partial<Identificador> & {
    numberOfParticipantes: number;
  };
};

export async function gerarLista({ listaData }: Props): Promise<void> {
  console.log("gerarLista", listaData);
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

    const formattedDates = formatDates(listaData.courseData!);

    // INSTRUTOR A
    if (formattedDates.instrutorA.length) {
      const documentA = DOCUMENT_XML.split(TAG_NAME).join(
        removerUltimaOcorrencia(
          makeTables(formattedDates.instrutorA, TOTAL_PARTICIPANTS),
          BREAK_PAGE_XML
        )
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
        removerUltimaOcorrencia(
          makeTables(formattedDates.instrutorB, TOTAL_PARTICIPANTS),
          BREAK_PAGE_XML
        )
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
    .map((item) => {
      if (item.intervalStart) {
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

function formatDates(dates: CourseData[]): {
  instrutorA: FormattedDateResult[];
  instrutorB: FormattedDateResult[];
} {
  const instrutorAResults: FormattedDateResult[] = [];
  const instrutorBResults: FormattedDateResult[] = [];

  for (const courseItem of dates) {
    const dateDetails = courseItem.date; // Contains date, start, end, intervalStart, intervalEnd

    // Process Instrutor A
    if (
      courseItem.instrutorA &&
      courseItem.instrutorA.instrutor &&
      courseItem.instrutorA.periodo !== "nenhum"
    ) {
      const resultA: FormattedDateResult = {
        date: dateDetails.date,
        start: dateDetails.start,
        end: dateDetails.end,
        instrutor: courseItem.instrutorA.instrutor,
        instrutorA: true,
        instrutorB: false,
        periodo: courseItem.instrutorA.periodo || "", // Use the period from CourseData
      };
      // Add interval if the period is 'dia-todo' and interval times are available
      if (
        courseItem.instrutorA.periodo === "dia-todo" &&
        dateDetails.intervalStart &&
        dateDetails.intervalEnd &&
        dateDetails.intervalStart !== "N/A" &&
        dateDetails.intervalEnd !== "N/A"
      ) {
        resultA.intervalStart = dateDetails.intervalStart;
        resultA.intervalEnd = dateDetails.intervalEnd;
      }
      instrutorAResults.push(resultA);
    }

    // Process Instrutor B
    if (
      courseItem.instrutorB &&
      courseItem.instrutorB.instrutor &&
      courseItem.instrutorB.periodo !== "nenhum"
    ) {
      const resultB: FormattedDateResult = {
        date: dateDetails.date,
        start: dateDetails.start,
        end: dateDetails.end,
        instrutor: courseItem.instrutorB.instrutor,
        instrutorA: false,
        instrutorB: true,
        periodo: courseItem.instrutorB.periodo || "", // Use the period from CourseData
      };
      // Add interval if the period is 'dia-todo' and interval times are available
      if (
        courseItem.instrutorB.periodo === "dia-todo" &&
        dateDetails.intervalStart &&
        dateDetails.intervalEnd &&
        dateDetails.intervalStart !== "N/A" &&
        dateDetails.intervalEnd !== "N/A"
      ) {
        resultB.intervalStart = dateDetails.intervalStart;
        resultB.intervalEnd = dateDetails.intervalEnd;
      }
      instrutorBResults.push(resultB);
    }
  }

  // Sort results by date then start time
  const sortFn = (a: FormattedDateResult, b: FormattedDateResult) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    // If dates are the same, sort by start time
    // Ensure start times are valid before comparing
    const aStart = a.start || "";
    const bStart = b.start || "";
    return aStart.localeCompare(bStart);
  };

  instrutorAResults.sort(sortFn);
  instrutorBResults.sort(sortFn);

  return {
    instrutorA: instrutorAResults,
    instrutorB: instrutorBResults,
  };
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
