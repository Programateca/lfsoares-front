import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PizZipUtils from "pizzip/utils";

function loadFile(url: string, callback: any) {
  PizZipUtils.getBinaryContent(url, callback);
}

const eventSchedule: EventSchedule = {
  instrutorA: [
    { dia: "30/12/2024", periodo: "Manha" },
    { dia: "31/12/2024", periodo: "Tarde" },
    { dia: "01/01/2025", periodo: "ManhaTarde" },
    { dia: "02/01/2025", periodo: "Manha" },
  ],
  instrutorB: [
    { dia: "30/12/2024", periodo: "Tarde" },
    { dia: "31/12/2024", periodo: "Manha" },
    { dia: "01/01/2025" },
    { dia: "02/01/2025", periodo: "Tarde" },
  ],
};

const PAGES = calcularPaginas(eventSchedule, 11);

function formatarPaginas(pages: Pages, xmlPage: string) {
  let newXmlPages = "";

  const diasTardeA = pages.instrutorA
    .filter((item) => item.dias[0].periodo === "Manha")
    .map((item) => item.dias[0].dia)
    .join(", ");

  const diasManhaA = pages.instrutorA
    .filter((item) => item.dias[0].periodo === "Tarde")
    .map((item) => item.dias[0].dia)
    .join(", ");

  const diasManhaTardeA = pages.instrutorA
    .filter((item) => item.dias[0].periodo === "ManhaTarde")
    .map((item) => item.dias[0].dia)
    .join(", ");

  const diasTardeB = pages.instrutorB
    .filter((item) => item.dias[0].periodo === "Manha")
    .map((item) => item.dias[0].dia)
    .join(", ");

  const diasManhaB = pages.instrutorB
    .filter((item) => item.dias[0].periodo === "Tarde")
    .map((item) => item.dias[0].dia)
    .join(", ");

  const diasManhaTardeB = pages.instrutorB
    .filter((item) => item.dias[0].periodo === "ManhaTarde")
    .map((item) => item.dias[0].dia)
    .join(", ");

  pages.instrutorA.forEach((item) => {
    console.log(diasManhaA);
    newXmlPages += substituirOcorrencias(
      xmlPage.repeat(item.paginas),
      "instrutor_a",
      item.dias[0].periodo === "Manha"
        ? diasManhaA
        : item.dias[0].periodo === "Tarde"
        ? diasTardeA
        : diasManhaTardeA
    );
  });

  pages.instrutorB.forEach((item) => {
    newXmlPages += substituirOcorrencias(
      xmlPage.repeat(item.paginas),
      "instrutor_b",
      item.dias[0].periodo === "Manha"
        ? diasManhaB
        : item.dias[0].periodo === "Tarde"
        ? diasTardeB
        : diasManhaTardeB
    );
  });

  return newXmlPages;
}

export async function gerarIdentificador() {
  // participantes: Record<string, string>[],
  // data?: Record<string, string>
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
      .join(formatarPaginas(PAGES, xmlNewContent));

    // Formatar as paginas
    // const pages = calcularPaginas(eventSchedule, participantes.length);

    loadFile(
      "/templates/identificacao-do-participante.docx",
      (error: Error, content: any) => {
        if (error) {
          throw error;
        }
        const zip = new PizZip(content);
        zip.file("word/document.xml", updatedXml);
        // const doc = new Docxtemplater(zip, {
        //   delimiters: { start: "[", end: "]" },
        //   paragraphLoop: true,
        //   linebreaks: true,
        //   parser: expressionParser,
        // });
        const out = zip.generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        saveAs(out, "output.docx");

        // const url = URL.createObjectURL(out);
        // const link = document.createElement("a");
        // link.href = url;
        // link.download = "document-template-updated.docx";
        // link.click();
        // URL.revokeObjectURL(url);

        // doc.render(data);
        // const out = doc.getZip().generate({
        //   type: "blob",
        //   mimeType:
        //     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // });
        // saveAs(out, "output.docx");
      }
    );
    // Se quiser disponibilizar para download:
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

// Define os dados do evento
type Period = "Manha" | "Tarde" | "ManhaTarde";

type Schedule = { dia: string; periodo?: Period };

type DaySchedule = {
  instrutorA: Schedule[];
  instrutorB: Schedule[];
};

type EventSchedule = DaySchedule;

type Pages = {
  instrutorA: { paginas: number; dias: Schedule[] }[];
  instrutorB: { paginas: number; dias: Schedule[] }[];
};

function calcularPaginas(
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

  // Calcula o número de páginas necessárias para cada período
  // const calcularNumeroDePaginas = (dias: Schedule[]) => {
  //   return Math.ceil(numParticipantes / 10);
  // };

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

// Exemplo de uso
// const eventSchedule: EventSchedule = {
//   instrutorA: [
//     { dia: "30/12/2024", periodo: "Manha" },
//     { dia: "31/12/2024", periodo: "Tarde" },
//     { dia: "01/01/2025", periodo: "ManhaTarde" },
//     { dia: "02/01/2025", periodo: "Manha" },
//   ],
//   instrutorB: [
//     { dia: "30/12/2024", periodo: "Tarde" },
//     { dia: "31/12/2024", periodo: "Manha" },
//     { dia: "01/01/2025" },
//     { dia: "02/01/2025", periodo: "Tarde" },
//   ],
// };

// const numParticipantes = 55;
// console.log(calcularPaginas(eventSchedule, numParticipantes));

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
