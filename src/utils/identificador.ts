import { loadFile } from "./load-file";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import { saveAs } from "file-saver";

import type { Identificador } from "@/@types/Identificador";

export type Period = "manha" | "tarde" | "manhaTarde" | "nenhum";
export type Schedule = { dia: string; periodo?: Period };
type DaySchedule = { instrutorA: Schedule[]; instrutorB: Schedule[] | null };
export type EventSchedule = DaySchedule;

type Instrutor = {
  paginas: number;
  dias: string;
  periodo: Period;
}[];

type Pages = {
  instrutorA: Instrutor;
  instrutorB: Instrutor;
};

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
  instrutor
    .filter((item) => item.periodo !== "nenhum")
    .forEach((item) => {
      const repetition = xmlPage.repeat(item.paginas);
      const dias =
        item.periodo === "manha"
          ? diasManha
          : item.periodo === "tarde"
          ? diasTarde
          : diasManhaTarde;
      if (item.periodo !== "nenhum") {
        result += substituirOcorrencias(
          repetition,
          instrutorName,
          dias,
          item.periodo as "manha" | "tarde" | "manhaTarde",
          courseTime
        );
      }
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
  docData: Identificador,
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

    const updatedXml = mainXmlContent.split(TAG_NAME).join(
      formatarPaginas(
        {
          instrutorA: formattedPages.instrutorA.filter(
            (item) => item.periodo !== "nenhum"
          ),
          instrutorB: formattedPages.instrutorB.filter(
            (item) => item.periodo !== "nenhum"
          ),
        },
        xmlNewContent,
        courseTime
      )
    );

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
  if (eventSchedule.instrutorB) {
    organizarHorarios(eventSchedule.instrutorB, paginasInstrutorB);
  }

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
    let day: string, month: string, year: string;

    if (date.includes("-")) {
      // Se estiver no formato "yyyy-MM-dd"
      const [y, m, d] = date.split("-");
      year = y;
      month = m;
      day = d;
    } else {
      // Assume o formato "dd/MM/yyyy"
      [day, month, year] = date.split("/");
    }

    // Converter para o formato "dd/MM/yyyy" se necessário (aqui só usamos month e ano)
    const monthYear = `${month}/${year.slice(2)}`;
    if (!formatado[monthYear]) {
      formatado[monthYear] = [];
    }
    formatado[monthYear].push(day);
  });

  const resultado: string[] = [];
  for (const [monthYear, days] of Object.entries(formatado)) {
    const lastDay = days.pop();
    if (days.length > 0) {
      resultado.push(`${days.join(", ")} E ${lastDay}/${monthYear}`);
    } else if (lastDay) {
      resultado.push(`${lastDay}/${monthYear}`);
    }
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
  console.log("Substituindo ocorrências...");
  console.log("periodo:", periodo);
  console.log("courseTime:", courseTime);
  const patterns = {
    "\\[pi\\]": () => `${++contador.pi}`,
    "\\[p_nome\\]": () => `[p_nome${++contador.p_nome}]`,
    "\\[p_matricula\\]": () => `[p_matricula${++contador.p_matricula}]`,
    "\\[p_codigo\\]": () => `[p_codigo${++contador.p_codigo}]`,
    "\\[instrutor\\]": () => `[${instrutor}]`,
    "\\[data_frequencia\\]": () => data,
    "\\[manha\\]": () =>
      periodo === "manha" || periodo === "manhaTarde" ? "Manhã" : "",
    "\\[tarde\\]": () =>
      periodo === "tarde" || periodo === "manhaTarde" ? "Tarde" : "",
    "\\[manha_h\\]": () =>
      periodo === "manha" || periodo === "manhaTarde" ? "[manha_horario]" : "",
    "\\[tarde_h\\]": () =>
      periodo === "tarde" || periodo === "manhaTarde" ? "[tarde_horario]" : "",
  };

  const contador = { pi: 0, p_nome: 0, p_matricula: 0, p_codigo: 0 };

  return Object.entries(patterns).reduce(
    (result, [pattern, replacer]) =>
      result.replace(new RegExp(pattern, "g"), replacer),
    texto
  );
}

export function gerarDias(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  const dataInicio = new Date(inicio.split("/").reverse().join("-"));
  const dataFim = new Date(fim.split("/").reverse().join("-"));

  const dataAtual = new Date(dataInicio);
  while (dataAtual <= dataFim) {
    dias.push(
      dataAtual.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  return dias;
}

type Dias = {
  instrutorA: Record<string, { periodo?: Period }>;
  instrutorB: Record<string, { periodo?: Period }> | null;
};

export function formatDays(dias: Dias): EventSchedule {
  return {
    instrutorA: Object.entries(dias.instrutorA).map(([dia, { periodo }]) => ({
      dia,
      periodo,
    })),
    instrutorB: dias.instrutorB
      ? Object.entries(dias.instrutorB).map(([dia, { periodo }]) => ({
          dia,
          periodo,
        }))
      : null,
  };
}
