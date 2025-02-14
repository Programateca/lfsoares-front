import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { loadFile } from "./load-file";

export async function gerarLista(
  data: Record<string, string | number>,
  tipo: string
) {
  const maxPages = 12;
  const participantsPerPage = 5;
  const requiredPages = Math.ceil(
    Number(data.numberOfParticipantes) / participantsPerPage
  );
  const countRemovedPages = maxPages - requiredPages;

  const fileArrayBuffer = await loadFile(`/templates/${tipo}.docx`);
  const zip = new PizZip(fileArrayBuffer);

  await removeElementsFromDocx(
    zip,
    {
      removeTable: data.tipo_lista === "lista-dia-todo",
      removeParagraph: true,
      removeTr: data.tipo_lista !== "lista-dia-todo",
      removeTc: false,
    },
    countRemovedPages, // removalTableLimit
    13 * 3, // removalParagraphLimit
    9 * 7, // removalTrLimit
    1
  );

  const doc = new Docxtemplater(zip, {
    delimiters: { start: "[", end: "]" },
    // paragraphLoop: true,
    // linebreaks: true,
    parser: expressionParser,
  });
  doc.render(data);

  const out = zip.generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }); //Output the document using Data-URI
  saveAs(out, "output.docx");
}

interface RemovalOptions {
  removeTable: boolean;
  removeParagraph: boolean;
  removeTr: boolean;
  removeTc: boolean;
}

async function removeElementsFromDocx(
  zip: PizZip,
  // outputFilePath: string,
  options: RemovalOptions,
  removalTableLimit: number,
  removalParagraphLimit: number,
  removalTrLimit: number,
  removalTcLimit: number
) {
  // Lê o arquivo DOCX e descompacta-o
  // const fileArrayBuffer = await loadFile("/templates/lista-meio-periodo.docx");
  // const zip = new PizZip(fileArrayBuffer);

  // Carrega e parseia o document.xml
  const xmlText = zip.files["word/document.xml"].asText();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  // Obtém o elemento <w:body>
  const body = xmlDoc.getElementsByTagName("w:body")[0];
  if (!body) {
    throw new Error("Não foi encontrado <w:body> no document.xml");
  }

  // Remoção de parágrafos diretamente no <w:body>
  if (options.removeParagraph) {
    // Cria array reverso dos filhos para não alterar os índices durante a remoção.
    const paragraphs = Array.from(body.childNodes).filter(
      (node) => node.nodeName === "w:p"
    );
    let removedParagraphs = 0;
    for (
      let i = paragraphs.length - 1;
      i >= 0 && removedParagraphs < removalParagraphLimit;
      i--
    ) {
      const node = paragraphs[i];
      if (node.parentNode) {
        node.parentNode.removeChild(node);
        removedParagraphs++;
      }
    }
  }

  // Remoção de tabelas diretamente no <w:body>
  if (options.removeTable) {
    const tables = Array.from(body.childNodes).filter(
      (node) => node.nodeName === "w:tbl"
    );
    let removedTables = 0;
    for (
      let i = tables.length - 1;
      i >= 0 && removedTables < removalTableLimit;
      i--
    ) {
      const node = tables[i];
      if (node.parentNode) {
        node.parentNode.removeChild(node);
        removedTables++;
      }
    }
  }

  // Remoção de linhas de tabela (<w:tr>) em todo o documento
  if (options.removeTr) {
    const trNodes = Array.from(xmlDoc.getElementsByTagName("w:tr"));
    let removedTr = 0;
    // Remover da lista reversa para evitar problemas de índice
    for (
      let i = trNodes.length - 1;
      i >= 0 && removedTr < removalTrLimit;
      i--
    ) {
      const node = trNodes[i];
      if (node.parentNode) {
        node.parentNode.removeChild(node);
        removedTr++;
      }
    }
  }

  // Remoção de células de tabela (<w:tc>) em todo o documento
  if (options.removeTc) {
    const tcNodes = Array.from(xmlDoc.getElementsByTagName("w:tc"));
    let removedTc = 0;
    for (
      let i = tcNodes.length - 1;
      i >= 0 && removedTc < removalTcLimit;
      i--
    ) {
      const node = tcNodes[i];
      if (node.parentNode) {
        node.parentNode.removeChild(node);
        removedTc++;
      }
    }
  }

  // Serializa o XML atualizado e o coloca de volta no zip
  const serializer = new XMLSerializer();
  const newXml = serializer.serializeToString(xmlDoc);
  zip.file("word/document.xml", newXml);

  // Gera o documento atualizado e escreve em disco
  zip.generate({
    type: "blob",
    compression: "DEFLATE",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}
