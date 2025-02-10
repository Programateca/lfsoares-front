import PizZip from "pizzip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import * as fs from "fs";

class DocxElementRemover {
  static async removeElements(
    inputPath: string,
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
  ): Promise<Buffer> {
    try {
      // Read the DOCX file
      const content = fs.readFileSync(inputPath);
      const zip = new PizZip(content);

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
        const rowsToRemove = tableRowsArray.slice(
          0,
          options.removeTableRowCount
        );

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
          const rowText = this.extractElementText(row);
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

      // Update the ZIP file
      zip.file("word/document.xml", modifiedXml);

      // Write the modified DOCX file
      const modifiedBuffer = zip.generate({ type: "nodebuffer" });
      return modifiedBuffer;
    } catch (error) {
      console.error("Error modifying document:", error);
      throw error;
    }
  }

  /**
   * Extracts text content from an XML element
   * @param element XML element to extract text from
   * @returns Extracted text content
   */
  private static extractElementText(
    element: import("@xmldom/xmldom").Element
  ): string {
    const textElements = element.getElementsByTagName("w:t");
    let elementText = "";

    for (let i = 0; i < textElements.length; i++) {
      elementText += textElements[i].textContent || "";
    }

    return elementText.trim();
  }
}

// Example usage
// async function main() {
//   try {
//     // const meioperiodo = "teste/templates/lista-meio-periodo.docx";
//     const diatodo = "teste/templates/lista-dia-todo.docx";
//     await DocxElementRemover.removeElements(diatodo, {
//       removeTableCount: 2, // Usar na lista de dia todo e não usar na de meio periodo cada 1 remove 1 pagina
//       removeParagraphCount: 4, // Usar na lista de dia todo e não usar na de meio periodo precisa ser o dobro do removeTableCount
//       // removeTableRowCount: 10 * 7, // Usar na lista de meio período 7 remove uma pagina então 10*7 remove 10 paginas
//     });
//   } catch (error) {
//     console.error("Example usage error:", error);
//   }
// }

// Uncomment to run the example
// main();

export { DocxElementRemover };
