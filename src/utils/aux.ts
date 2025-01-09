import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PizZipUtils from "pizzip/utils";

export type Period = "Manha" | "Tarde" | "ManhaTarde";

export type Schedule = { dia: string; periodo?: Period };

type DaySchedule = {
  instrutorA: Schedule[];
  instrutorB: Schedule[];
};

export type EventSchedule = DaySchedule;

type Pages = {
  instrutorA: { paginas: number; dias: Schedule[] }[];
  instrutorB: { paginas: number; dias: Schedule[] }[];
};

function loadFile(
  url: string,
  callback: (error: Error | null, data?: string | ArrayBuffer) => void
) {
  PizZipUtils.getBinaryContent(url, callback);
}

function formatarPaginas(pages: Pages, xmlPage: string) {
  let newXmlPages = "";

  const getDias = (
    instrutor: { paginas: number; dias: Schedule[] }[],
    periodo: Period
  ) =>
    instrutor
      .filter((item) => item.dias[0].periodo === periodo)
      .map((item) => item.dias[0].dia)
      .join(", ");

  const diasManhaA = getDias(pages.instrutorA, "Manha");
  const diasTardeA = getDias(pages.instrutorA, "Tarde");
  const diasManhaTardeA = getDias(pages.instrutorA, "ManhaTarde");

  const diasManhaB = getDias(pages.instrutorB, "Manha");
  const diasTardeB = getDias(pages.instrutorB, "Tarde");
  const diasManhaTardeB = getDias(pages.instrutorB, "ManhaTarde");

  const processInstrutor = (
    instrutor: { paginas: number; dias: Schedule[] }[],
    instrutorName: string,
    diasManha: string,
    diasTarde: string,
    diasManhaTarde: string
  ) => {
    instrutor.forEach((item) => {
      newXmlPages += substituirOcorrencias(
        xmlPage.repeat(item.paginas),
        instrutorName,
        item.dias[0].periodo === "Manha"
          ? diasManha
          : item.dias[0].periodo === "Tarde"
          ? diasTarde
          : diasManhaTarde
      );
    });
  };

  processInstrutor(
    pages.instrutorA,
    "instrutor_a",
    diasManhaA,
    diasTardeA,
    diasManhaTardeA
  );
  processInstrutor(
    pages.instrutorB,
    "instrutor_b",
    diasManhaB,
    diasTardeB,
    diasManhaTardeB
  );

  return newXmlPages;
}

export async function gerarIdentificador(
  data: Record<string, unknown>,
  pages: EventSchedule,
  numeroParticipantes: number
) {
  const formattedPages = calcularPaginas(pages, numeroParticipantes);
  const TAG_NAME = "<!--aux-page-->";
  try {
    // Carrega o arquivo XML principal
    const responseMainXml = await fetch(
      `/templates/identificacao-participante/word/document-template.xml`
    );
    const responseNewXml = await fetch(`/templates/tabela.xml`);
    const xmlContent = await responseMainXml.text();
    const xmlNewContent = await responseNewXml.text();

    // Verifica a posição da tag
    const tagNameIndex = xmlContent.indexOf(TAG_NAME);
    if (tagNameIndex === -1) {
      console.error(`Tag <${TAG_NAME}> não encontrada.`);
      return;
    }

    // Atualiza o conteúdo do XML, duplicando e inserindo após a tag
    const updatedXml = xmlContent
      .split(TAG_NAME)
      .join(formatarPaginas(formattedPages, xmlNewContent));

    // Formatar as paginas
    // const pages = calcularPaginas(eventSchedule, participantes.length);

    loadFile(
      "/templates/identificacao-do-participante.docx",
      (error: Error | null, data?: string | ArrayBuffer) => {
        if (error) {
          throw error;
        }
        if (!data) {
          throw new Error("No data received");
        }
        const zip = new PizZip(data);
        zip.file("word/document.xml", updatedXml);

        // const doc = new Docxtemplater(zip, {
        //   delimiters: { start: "[", end: "]" },
        //   paragraphLoop: true,
        //   linebreaks: true,
        //   parser: expressionParser,
        // });

        // doc.render(data);
        // const out = doc.getZip().generate({
        //   type: "blob",
        //   mimeType:
        //     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // });
        // saveAs(out, "output.docx");

        const out = zip.generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        saveAs(out, "output.docx");
      }
    );
    // Para download:
    // const blob = new Blob([updatedXml], { type: "text/xml" });
    // const url = URL.createObjectURL(blob);
    // const link = document.createElement("a");
    // link.href = url;
    // link.download = "document-template-updated.xml";
    // link.click();
    // URL.revokeObjectURL(url);
    // await saveAs(updatedXml, "output.xml");
  } catch (error) {
    console.error("Erro ao processar os arquivos XML:", error);
  }
}

export function calcularPaginas(
  eventSchedule: EventSchedule,
  numParticipantes: number
): Pages {
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

  // Função para organizar os horários
  const organizarHorarios = (
    schedule: Schedule[],
    paginas: typeof paginasInstrutorA
  ) => {
    for (const item of schedule) {
      if (item.periodo === "ManhaTarde") {
        paginas.ManhaTarde.push(item);
      } else if (item.periodo === "Manha") {
        paginas.Manha.push(item);
      } else if (item.periodo === "Tarde") {
        paginas.Tarde.push(item);
      }
    }
  };

  // Organiza os horários do Instrutor A e B
  organizarHorarios(eventSchedule.instrutorA, paginasInstrutorA);
  organizarHorarios(eventSchedule.instrutorB, paginasInstrutorB);

  // Formata as páginas com o número total de páginas
  const formatarPaginas = (paginas: typeof paginasInstrutorA) => {
    return [
      { paginas: Math.ceil(numParticipantes / 10), dias: paginas.Manha },
      { paginas: Math.ceil(numParticipantes / 10), dias: paginas.Tarde },
      {
        paginas: Math.ceil(numParticipantes / 10),
        dias: paginas.ManhaTarde,
      },
    ].filter((p) => p.dias.length > 0);
  };

  return {
    instrutorA: formatarPaginas(paginasInstrutorA),
    instrutorB: formatarPaginas(paginasInstrutorB),
  };
}

function substituirOcorrencias(
  texto: string,
  instrutor: string,
  data: string
): string {
  // Expressão regular para encontrar o padrão, como "[pi]"
  const pi_regx = new RegExp("\\[pi\\]", "g");
  const p_nome_regx = new RegExp("\\[p_nome\\]", "g");
  const instrutor_regx = new RegExp("\\[instrutor\\]", "g");
  const data_regx = new RegExp("\\[data\\]", "g");
  // const responsavel_tecnico = new RegExp("\\[pi\\]", "g");

  // Contador para adicionar os números sequenciais
  let contador = 1;
  let contador1 = 1;
  let newText = texto;
  // Substituir as ocorrências
  newText = newText.replace(pi_regx, () => `${contador++}`);
  newText = newText.replace(p_nome_regx, () => `[p_nome${contador1++}]`);
  newText = newText.replace(instrutor_regx, () => `[${instrutor}]`);
  newText = newText.replace(data_regx, () => `${data}`);
  return newText;
}
