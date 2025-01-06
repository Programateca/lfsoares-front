import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PizZipUtils from "pizzip/utils";

function loadFile(url: string, callback: any) {
  PizZipUtils.getBinaryContent(url, callback);
}

export async function gerarIdentificador(
  paginas: number,
  data?: Record<string, string>
) {
  const tagName = "<!--aux-page-->";
  try {
    // Carrega o arquivo XML principal
    const responseMainXml = await fetch(
      `/templates/identificacao-participante/word/document-template.xml`
    );
    const responseNewXml = await fetch(`/templates/tabela.xml`);
    const xmlContent = await responseMainXml.text();
    const xmlNewContent = await responseNewXml.text();
    // Verifica a posição da tag
    const tagNameIndex = xmlContent.indexOf(tagName);
    if (tagNameIndex === -1) {
      console.error(`Tag <${tagName}> não encontrada.`);
      return;
    }
    // Atualiza o conteúdo do XML, duplicando e inserindo após a tag
    const updatedXml = xmlContent
      .split(tagName)
      .join(xmlNewContent.repeat(paginas));
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
type Period = "Manha" | "Tarde";

type DaySchedule = {
  instrutorA: Period[];
  instrutorB: Period[];
};

type EventSchedule = DaySchedule[];

function calcularPaginas(eventSchedule: EventSchedule): number {
  // Inicializa contadores para cada categoria de páginas
  let paginasInstrutorAManha = 0;
  let paginasInstrutorATarde = 0;
  let paginasInstrutorAIntegral = 0;

  let paginasInstrutorBManha = 0;
  let paginasInstrutorBTarde = 0;
  let paginasInstrutorBIntegral = 0;

  // Percorre os dias do evento
  for (const day of eventSchedule) {
    // Verifica os períodos de cada instrutor
    const instrutorA = day.instrutorA;
    const instrutorB = day.instrutorB;

    // Conta para Instrutor A
    if (instrutorA.includes("Manha") && instrutorA.includes("Tarde")) {
      paginasInstrutorAIntegral++;
    } else if (instrutorA.includes("Manha")) {
      paginasInstrutorAManha++;
    } else if (instrutorA.includes("Tarde")) {
      paginasInstrutorATarde++;
    }

    // Conta para Instrutor B
    if (instrutorB.includes("Manha") && instrutorB.includes("Tarde")) {
      paginasInstrutorBIntegral++;
    } else if (instrutorB.includes("Manha")) {
      paginasInstrutorBManha++;
    } else if (instrutorB.includes("Tarde")) {
      paginasInstrutorBTarde++;
    }
  }

  // Total de páginas é a soma das categorias
  return (
    (paginasInstrutorAManha > 0 ? 1 : 0) +
    (paginasInstrutorATarde > 0 ? 1 : 0) +
    (paginasInstrutorAIntegral > 0 ? 1 : 0) +
    (paginasInstrutorBManha > 0 ? 1 : 0) +
    (paginasInstrutorBTarde > 0 ? 1 : 0) +
    (paginasInstrutorBIntegral > 0 ? 1 : 0)
  );
}
