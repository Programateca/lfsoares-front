import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PizZipUtils from "pizzip/utils";
import expressionParser from "docxtemplater/expressions";

export type Period = "manha" | "tarde" | "manhaTarde";
export type Schedule = { dia: string; periodo?: Period };
type DaySchedule = { instrutorA: Schedule[]; instrutorB: Schedule[] };
export type EventSchedule = DaySchedule;

type Instrutor = {
  paginas: number;
  dias: string;
  periodo: "manha" | "tarde" | "manhaTarde";
}[];

type Pages = {
  instrutorA: Instrutor;
  instrutorB: Instrutor;
};

function loadFile(
  url: string,
  callback: (error: Error | null, data?: string | ArrayBuffer) => void
) {
  PizZipUtils.getBinaryContent(url, callback);
}

function getDias(
  instrutor: { paginas: number; dias: string; periodo: string }[],
  periodo: string
) {
  return instrutor.find((item) => item.periodo === periodo)?.dias || "";
}

function processInstrutor(
  instrutor: Instrutor,
  instrutorName: string,
  xmlPage: string,
  diasManha: string,
  diasTarde: string,
  diasManhaTarde: string,
  courseTime: string
) {
  let result = "";
  instrutor.forEach((item) => {
    const repetition = xmlPage.repeat(item.paginas);
    const dias =
      item.periodo === "manha"
        ? diasManha
        : item.periodo === "tarde"
        ? diasTarde
        : diasManhaTarde;
    result += substituirOcorrencias(
      repetition,
      instrutorName,
      dias,
      item.periodo,
      courseTime
    );
  });
  return result;
}

function formatarPaginas(pages: Pages, xmlPage: string, courseTime: string) {
  const diasManhaA = getDias(pages.instrutorA, "manha");
  const diasTardeA = getDias(pages.instrutorA, "tarde");
  const diasManhaTardeA = getDias(pages.instrutorA, "manhaTarde");
  const diasManhaB = getDias(pages.instrutorB, "manha");
  const diasTardeB = getDias(pages.instrutorB, "tarde");
  const diasManhaTardeB = getDias(pages.instrutorB, "manhaTarde");

  let newXmlPages = "";
  newXmlPages += processInstrutor(
    pages.instrutorA,
    "instrutor_a",
    xmlPage,
    diasManhaA,
    diasTardeA,
    diasManhaTardeA,
    courseTime
  );
  newXmlPages += processInstrutor(
    pages.instrutorB,
    "instrutor_b",
    xmlPage,
    diasManhaB,
    diasTardeB,
    diasManhaTardeB,
    courseTime
  );
  return newXmlPages;
}

export async function gerarIdentificador(
  docData: Record<string, unknown>,
  pages: EventSchedule,
  numeroParticipantes: number,
  courseTime: string
) {
  const formattedPages = calcularPaginas(pages, numeroParticipantes);
  const TAG_NAME = "<!--aux-page-->";

  try {
    const responseMainXml = await fetch(
      `/templates/identificacao-participante/document-template.xml`
    );
    const responseNewXml = await fetch(
      `/templates/identificacao-participante/tabela.xml`
    );
    const mainXmlContent = await responseMainXml.text();
    const xmlNewContent = await responseNewXml.text();

    const tagNameIndex = mainXmlContent.indexOf(TAG_NAME);
    if (tagNameIndex === -1) {
      console.error(`Tag <${TAG_NAME}> não encontrada.`);
      return;
    }

    const updatedXml = mainXmlContent
      .split(TAG_NAME)
      .join(formatarPaginas(formattedPages, xmlNewContent, courseTime));

    loadFile(
      "/templates/identificacao-do-participante.docx",
      (error: Error | null, data?: string | ArrayBuffer) => {
        if (error) throw error;
        if (!data) throw new Error("No data received");

        const zip = new PizZip(data);
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
      }
    );
  } catch (error) {
    console.error("Erro ao processar os arquivos XML:", error);
  }
}

export function calcularPaginas(
  eventSchedule: EventSchedule,
  numParticipantes: number
) {
  const paginasInstrutorA = {
    Manha: [] as Schedule[],
    Tarde: [] as Schedule[],
    ManhaTarde: [] as Schedule[],
  };
  const paginasInstrutorB = {
    Manha: [] as Schedule[],
    Tarde: [] as Schedule[],
    ManhaTarde: [] as Schedule[],
  };

  function organizarHorarios(
    schedule: Schedule[],
    paginas: typeof paginasInstrutorA
  ) {
    for (const item of schedule) {
      if (item.periodo === "manhaTarde") {
        paginas.ManhaTarde.push(item);
      } else if (item.periodo === "manha") {
        paginas.Manha.push(item);
      } else if (item.periodo === "tarde") {
        paginas.Tarde.push(item);
      }
    }
  }

  organizarHorarios(eventSchedule.instrutorA, paginasInstrutorA);
  organizarHorarios(eventSchedule.instrutorB, paginasInstrutorB);

  function formatarPaginasPorPeriodo(paginas: typeof paginasInstrutorA) {
    const numeroPaginas = Math.ceil(numParticipantes / 10);
    return [
      {
        paginas: numeroPaginas,
        dias: formatarDatas(paginas.Manha.map((item) => item.dia)),
        periodo: "manha" as Period,
      },
      {
        paginas: numeroPaginas,
        dias: formatarDatas(paginas.Tarde.map((item) => item.dia)),
        periodo: "tarde" as Period,
      },
      {
        paginas: numeroPaginas,
        dias: formatarDatas(paginas.ManhaTarde.map((item) => item.dia)),
        periodo: "manhaTarde" as Period,
      },
    ].filter((p) => p.dias.length > 0);
  }

  return {
    instrutorA: formatarPaginasPorPeriodo(paginasInstrutorA),
    instrutorB: formatarPaginasPorPeriodo(paginasInstrutorB),
  };
}

export function formatarDatas(dates: string[]): string {
  const formatado: Record<string, string[]> = {};
  dates.forEach((date) => {
    const [day, month, year] = date.split("/");
    const monthYear = `${month}/${year.slice(2)}`;
    if (!formatado[monthYear]) {
      formatado[monthYear] = [];
    }
    formatado[monthYear].push(day);
  });

  const resultado: string[] = [];
  for (const [monthYear, days] of Object.entries(formatado)) {
    resultado.push(`${days.join(", ")} ${monthYear}`);
  }
  return resultado.join("; ");
}

function substituirOcorrencias(
  texto: string,
  instrutor: string,
  data: string,
  periodo: "manha" | "tarde" | "manhaTarde",
  courseTime: string
): string {
  const patterns = {
    "\\[pi\\]": () => `${++contador.pi}`,
    "\\[p_nome\\]": () => `[p_nome${++contador.p_nome}]`,
    "\\[p_matricula\\]": () => `[p_matricula${++contador.p_matricula}]`,
    "\\[p_codigo\\]": () => `[p_codigo${++contador.p_codigo}]`,
    "\\[instrutor\\]": () => `[${instrutor}]`,
    "\\[data_frequencia\\]": () => data,
    "\\[manha\\]": () =>
      periodo === "manha" || periodo === courseTime ? "manhã" : "",
    "\\[tarde\\]": () =>
      periodo === "tarde" || periodo === courseTime ? "tarde" : "",
    "\\[manha_h\\]": () =>
      periodo === "manha" || periodo === courseTime ? "manhã_horário" : "",
    "\\[tarde_h\\]": () =>
      periodo === "tarde" || periodo === courseTime ? "tarde_horário" : "",
  };

  const contador = { pi: 0, p_nome: 0, p_matricula: 0, p_codigo: 0 };

  return Object.entries(patterns).reduce(
    (result, [pattern, replacer]) =>
      result.replace(new RegExp(pattern, "g"), replacer),
    texto
  );
}
