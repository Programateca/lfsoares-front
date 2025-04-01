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

// function getDias(
//   instrutor: { paginas: number; dias: string; periodo: string }[],
//   periodo: string
// ) {
//   return instrutor.find((item) => item.periodo === periodo)?.dias || "";
// }

async function formatarPaginas(pages: Pages, courseTime: string) {
  // Extract all unique days across both instructors and all periods
  const allDays = new Set<string>();
  const dayToInstructorInfo = new Map<
    string,
    {
      instrutorA?: { periodo: Period; paginas: number };
      instrutorB?: { periodo: Period; paginas: number };
    }
  >();

  // Collect days from instructor A
  pages.instrutorA.forEach((item) => {
    if (item.periodo !== "nenhum" && item.dias) {
      // Parse formatted dates back to individual days
      const days = parseDatasFormatadas(item.dias);
      days.forEach((day) => {
        allDays.add(day);
        const info = dayToInstructorInfo.get(day) || {};
        info.instrutorA = { periodo: item.periodo, paginas: item.paginas };
        dayToInstructorInfo.set(day, info);
      });
    }
  });

  // Collect days from instructor B
  pages.instrutorB.forEach((item) => {
    if (item.periodo !== "nenhum" && item.dias) {
      const days = parseDatasFormatadas(item.dias);
      days.forEach((day) => {
        allDays.add(day);
        const info = dayToInstructorInfo.get(day) || {};
        info.instrutorB = { periodo: item.periodo, paginas: item.paginas };
        dayToInstructorInfo.set(day, info);
      });
    }
  });

  // Sort days chronologically
  const sortedDays = Array.from(allDays).sort((a, b) => {
    const dateA = new Date(a.split("/").reverse().join("-"));
    const dateB = new Date(b.split("/").reverse().join("-"));
    return dateA.getTime() - dateB.getTime();
  });

  let newXmlPages = "";

  // Process pages day by day
  for (const day of sortedDays) {
    const dayInfo = dayToInstructorInfo.get(day);
    if (!dayInfo) continue;

    // Process instructor A for this day if applicable
    if (dayInfo.instrutorA && dayInfo.instrutorA.periodo !== "nenhum") {
      const tabelaXml = await lerTabelaXml({
        tipo: dayInfo.instrutorA.periodo as "manha" | "tarde" | "manhaTarde",
      });
      const repetition = tabelaXml.repeat(dayInfo.instrutorA.paginas);
      newXmlPages += substituirOcorrencias(
        repetition,
        "instrutor_a",
        day,
        dayInfo.instrutorA.periodo as "manha" | "tarde" | "manhaTarde",
        courseTime
      );
    }

    // Process instructor B for this day if applicable
    if (dayInfo.instrutorB && dayInfo.instrutorB.periodo !== "nenhum") {
      const tabelaXml = await lerTabelaXml({
        tipo: dayInfo.instrutorB.periodo as "manha" | "tarde" | "manhaTarde",
      });
      const repetition = tabelaXml.repeat(dayInfo.instrutorB.paginas);
      newXmlPages += substituirOcorrencias(
        repetition,
        "instrutor_b",
        day,
        dayInfo.instrutorB.periodo as "manha" | "tarde" | "manhaTarde",
        courseTime
      );
    }
  }

  return newXmlPages;
}

// Helper function to parse formatted dates back to individual days
function parseDatasFormatadas(formattedString: string): string[] {
  const days: string[] = [];

  // Split by semicolons to get different month/year groups
  const monthGroups = formattedString.split(";").map((s) => s.trim());

  for (const group of monthGroups) {
    if (!group) continue;

    // Format could be: "1, 2, 3 E 4/05/23" or "5/05/23"
    const match = group.match(/^(.*?)\/(\d{2})\/(\d{2,4})$/);
    if (match) {
      const [, dayPart, month, year] = match;

      // Process the day part which could be "1, 2, 3 E 4" or just "5"
      let dayNumbers: string[];
      if (dayPart.includes(" E ")) {
        const parts = dayPart.split(" E ");
        dayNumbers = [...parts[0].split(", "), parts[1]];
      } else if (dayPart.includes(",")) {
        dayNumbers = dayPart.split(", ");
      } else {
        dayNumbers = [dayPart];
      }

      // Create full dates
      dayNumbers.forEach((day) => {
        days.push(
          `${day.padStart(2, "0")}/${month}/${
            year.length === 2 ? `20${year}` : year
          }`
        );
      });
    }
  }

  return days;
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

    const mainXmlContent = await responseMainXml.text();

    const tagNameIndex = mainXmlContent.indexOf(TAG_NAME);
    if (tagNameIndex === -1) {
      console.error(`Tag <${TAG_NAME}> não encontrada.`);
      return;
    }

    const updatedXml = mainXmlContent.split(TAG_NAME).join(
      await formatarPaginas(
        {
          instrutorA: formattedPages.instrutorA.filter(
            (item) => item.periodo !== "nenhum"
          ),
          instrutorB: formattedPages.instrutorB.filter(
            (item) => item.periodo !== "nenhum"
          ),
        },
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
  if (import.meta.env.DEV) console.log("courseTime:", courseTime);
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
