import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";
import expressionParser from "docxtemplater/expressions";

function loadFile(url: string, callback: any) {
  PizZipUtils.getBinaryContent(url, callback);
}

export function generateDocument(data: Record<string, string>) {
  loadFile("/templates/certificado-frente-verso.pptx", (error: Error, content: any) => {
    if (error) {
      throw error;
    }
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "[", end: "e]" },
      paragraphLoop: true,
      linebreaks: true,
      parser: expressionParser,
    });
    doc.render({
      nome_treinamento: "Treinamento de Segurança",
      carga_hora: "8",
      cpf: "123456789",
      cnpj: "123456789",
      e_dia: "01",
      e_mes: "01",
      empresa: "Empresa",
      nome_participante: "Fulano de Tal",
      portaria_treinamento: "123",
      r_dia: "01",
      r_hora: "08",
      r_hora_fim: "17",
      r_mes: "01",
    });
    const out = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }); //Output the document using Data-URI
    saveAs(out, "output.pptx");
  });
}
