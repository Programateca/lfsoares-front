import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { loadFile } from "./load-file";

export async function gerarLista(
  data: Record<string, string | number>,
  tipo: string
) {
  if (data.tipo_lista === "lista-dia-todo") {
    // Parse time strings
    const horario = String(data.horario)
      .split("ÀS")
      .map((t) => t.trim());
    const intervalo = String(data.intervalo)
      .split("ÀS")
      .map((t) => t.trim());

    if (horario.length !== 2 || intervalo.length !== 2) {
      console.warn("Formato de horário ou intervalo inválido");
    }

    // Extract hours for validation
    const startHour = parseInt(horario[0].split(":")[0], 10);
    const endHour = parseInt(horario[1].split(":")[0], 10);

    // Check if the day spans before and after noon
    if (startHour >= 12 || endHour < 12) {
      throw new Error(
        "Para lista de dia todo, é necessário que o horário comece antes do meio-dia e termine depois do meio-dia"
      );
    }

    // Add new properties to data
    data.M_H_ORARIO = `${horario[0]} ÀS ${intervalo[0]}`;
    data.T_H_ORARIO = `${intervalo[1]} ÀS ${horario[1]}`;
  }

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
    countRemovedPages,
    13 * 3,
    9 * 7,
    1
  );

  // Replace variables in the document and headers
  let xmlText = zip.files["word/document.xml"].asText();

  // Get all header files (header1.xml, header2.xml, etc.)
  const headerFiles = Object.keys(zip.files).filter(
    (fileName) =>
      fileName.startsWith("word/header") && fileName.endsWith(".xml")
  );

  // Replace variables in each header file
  headerFiles.forEach((headerFile) => {
    let headerText = zip.files[headerFile].asText();
    Object.entries(data).forEach(([key, value]) => {
      // const regex = new RegExp(key, "g");
      const wholeWordRegex = new RegExp(`\\b${key}\\b`, "g");
      headerText = headerText.replace(wholeWordRegex, String(value));
    });
    zip.file(headerFile, headerText);
  });

  // Replace variables in main document
  Object.entries(data).forEach(([key, value]) => {
    // const regex = new RegExp(key, "g");
    const wholeWordRegex = new RegExp(`\\b${key}\\b`, "g");
    xmlText = xmlText.replace(wholeWordRegex, String(value));
  });

  // Update the document XML in the zip
  zip.file("word/document.xml", xmlText);

  const out = zip.generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
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
