import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";
import expressionParser from "docxtemplater/expressions";

function loadFile(url: string, callback: any) {
  PizZipUtils.getBinaryContent(url, callback);
}

export function gerarLista(data: Record<string, string>) {

  const PAGE_SIZE = 5;

  const pages: string[] = [];
  for (let i = 0; i < data.participantes.length; i += PAGE_SIZE) {
    pages.push(data.participantes.slice(i, i + PAGE_SIZE));
  }

  loadFile("/templates/lista-dia-todo.docx", (error: Error, content: any) => {
    if (error) {
      throw error;
    }
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "[", end: "]" },
      paragraphLoop: true,
      linebreaks: true,
      parser: expressionParser,
    });
    doc.render({
      pages,
    });
    const out = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }); //Output the document using Data-URI
    saveAs(out, "output.docx");
  });
}
