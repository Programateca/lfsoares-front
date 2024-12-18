import PizZip from "pizzip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

import PizZipUtils from "pizzip/utils";
import Docxtemplater from "docxtemplater";

import { saveAs } from "file-saver";
import expressionParser from "docxtemplater/expressions";
import { Models } from "@/@types/Models";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadFile(url: string, callback: any) {
  PizZipUtils.getBinaryContent(url, callback);
}

class DocxElementRemover {
  static async removeElements(
    model: Models,
    data: Record<string, string>,
    outputName: string,
    options: {
      removeTableCount?: number;
      removeParagraphCount?: number;
      removeTableRowCount?: number;
      removeSpecificTables?: number[];
      removeSpecificParagraphs?: number[];
      removeSpecificTableRows?: number[];
    } = {}
  ) {
    try {
      // Read the DOCX file
      loadFile(model, (error: Error, content: ArrayBuffer) => {
        if (error) {
          throw error;
        }

        const zip = new PizZip(content);

        // Extract the document.xml
        const documentXml = zip.file("word/document.xml")!.asText();

        // Parse the XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml, "text/xml");

        // Remove last N tables
        if (options.removeTableCount) {
          const tables = xmlDoc.getElementsByTagName("w:tbl");
          const tablesArray = Array.from(tables);
          const tablesToRemove = tablesArray.slice(-options.removeTableCount);

          tablesToRemove.forEach((table) => {
            if (table.parentNode) {
              table.parentNode.removeChild(table);
            }
          });
        }

        // Remove last N paragraphs
        if (options.removeParagraphCount) {
          const paragraphs = xmlDoc.getElementsByTagName("w:p");
          const paragraphsArray = Array.from(paragraphs);
          const paragraphsToRemove = paragraphsArray.slice(
            -options.removeParagraphCount * 2 - 1
          );

          paragraphsToRemove.forEach((paragraph) => {
            if (paragraph.parentNode) {
              paragraph.parentNode.removeChild(paragraph);
            }
          });
        }

        // Remove last N table rows
        if (options.removeTableRowCount) {
          
          const tableRows = xmlDoc.getElementsByTagName("w:tr");
          const tableRowsArray = Array.from(tableRows);
          const rowsToRemove = tableRowsArray.slice(
            -options.removeTableRowCount
          );

          rowsToRemove.forEach((row) => {
            if (row.parentNode) {
              row.parentNode.removeChild(row);
            }
          });

          // const tc = xmlDoc.getElementsByTagName("w:tc");
          // const tcArray = Array.from(tc);
          // const tcToRemove = tcArray.slice(
          //   -2
          // );

          // tcToRemove.forEach((row) => {
          //   if (row.parentNode) {
          //     row.parentNode.removeChild(row);
          //   }
          // });
        }

        // Serialize the modified XML
        const serializer = new XMLSerializer();
        const modifiedXml = serializer.serializeToString(xmlDoc);

        // Update the ZIP file
        zip.file("word/document.xml", modifiedXml);

        // const blob = new Blob([modifiedXml], { type: "application/xml" });
        // saveAs(blob, 'outputName.xml');

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
        saveAs(out, outputName);
        // return zip.generate({ type: "base64" });
        // Write the modified DOCX file
        // const modifiedBuffer = zip.generate({ type: "nodebuffer" });
        // fs.writeFileSync(outputPath, modifiedBuffer);
      });
      console.log("Document modified successfully");
    } catch (error) {
      console.error("Error modifying document:", error);
      throw error;
    }
  }
}

// Example usage
// removeTableCount: 2, // Usar na lista de dia todo e não usar na de meio periodo cada 1 remove 1 pagina
// removeParagraphCount: 4, // Usar na lista de dia todo e não usar na de meio periodo precisa ser o dobro do removeTableCount
// removeTableRowCount: 10 * 7, // Usar na lista de meio período 7 remove uma pagina então 10*7 remove 10 paginas

export { DocxElementRemover };
