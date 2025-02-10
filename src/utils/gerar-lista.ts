import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { loadFile } from "./load-file";
// import { loadFile } from "./load-file";

export async function gerarLista(
  data: Record<string, string>,
  options: {
    removeTableCount?: number;
    removeParagraphCount?: number;
    removeTableRowCount?: number;
    removeSpecificTables?: number[];
    removeSpecificParagraphs?: number[];
    removeSpecificTableRows?: number[];
    filterTablesByContent?: (tableContent: string) => boolean;
    filterParagraphsByContent?: (paragraphContent: string) => boolean;
    filterTableRowsByContent?: (rowContent: string) => boolean;
  } = {}
) {
  const fileArrayBuffer = await loadFile("/templates/lista-meio-periodo.docx");

  const zip = new PizZip(fileArrayBuffer);

  // Extract the document.xml
  const documentXml = zip.file("word/document.xml")!.asText();

  // Parse the XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, "text/xml");

  // Remove first N tables
  if (options.removeTableCount) {
    const tables = xmlDoc.getElementsByTagName("w:tbl");
    const tablesArray = Array.from(tables);
    const tablesToRemove = tablesArray.slice(0, options.removeTableCount);

    tablesToRemove.forEach((table) => {
      if (table.parentNode) {
        table.parentNode.removeChild(table);
      }
    });
  }

  // Remove first N paragraphs
  if (options.removeParagraphCount) {
    const paragraphs = xmlDoc.getElementsByTagName("w:p");
    const paragraphsArray = Array.from(paragraphs);
    const paragraphsToRemove = paragraphsArray.slice(
      0,
      options.removeParagraphCount
    );

    paragraphsToRemove.forEach((paragraph) => {
      if (paragraph.parentNode) {
        paragraph.parentNode.removeChild(paragraph);
      }
    });
  }

  // Remove first N table rows
  if (options.removeTableRowCount) {
    const tableRows = xmlDoc.getElementsByTagName("w:tr");
    const tableRowsArray = Array.from(tableRows);
    const rowsToRemove = tableRowsArray.slice(0, options.removeTableRowCount);

    rowsToRemove.forEach((row) => {
      if (row.parentNode) {
        row.parentNode.removeChild(row);
      }
    });
  }

  // Remove specific table rows
  if (options.removeSpecificTableRows) {
    const tableRows = xmlDoc.getElementsByTagName("w:tr");
    const tableRowsArray = Array.from(tableRows);

    options.removeSpecificTableRows
      .sort((a, b) => b - a) // Remove from end to avoid index shifting
      .forEach((index) => {
        if (index >= 0 && index < tableRowsArray.length) {
          const row = tableRowsArray[index];
          if (row.parentNode) {
            row.parentNode.removeChild(row);
          }
        }
      });
  }

  // Filter table rows by content
  if (options.filterTableRowsByContent) {
    const tableRows = xmlDoc.getElementsByTagName("w:tr");
    const tableRowsArray = Array.from(tableRows);

    tableRowsArray.forEach((row) => {
      const rowText = extractElementText(
        row as unknown as import("@xmldom/xmldom").Element
      );
      if (!options.filterTableRowsByContent!(rowText)) {
        if (row.parentNode) {
          row.parentNode.removeChild(row);
        }
      }
    });
  }

  // Serialize the modified XML
  const serializer = new XMLSerializer();
  const modifiedXml = serializer.serializeToString(xmlDoc);
  zip.file("word/document.xml", modifiedXml);

  const doc = new Docxtemplater(zip, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
    parser: expressionParser,
  });
  doc.render(data);
  const out = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }); //Output the document using Data-URI
  saveAs(out, "output.docx");
}

function extractElementText(element: import("@xmldom/xmldom").Element): string {
  const textElements = element.getElementsByTagName("w:t");
  let elementText = "";

  for (let i = 0; i < textElements.length; i++) {
    elementText += textElements[i].textContent || "";
  }

  return elementText.trim();
}
