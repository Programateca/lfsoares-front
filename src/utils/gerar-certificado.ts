import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";
import expressionParser from "docxtemplater/expressions";

function loadFile(url: string, callback: any) {
  PizZipUtils.getBinaryContent(url, callback);
}

function replaceImage(zip: any, imageMap: Record<string, string>) {
  const mediaFolder = "ppt/media/";

  Object.keys(imageMap).forEach((imageName) => {
    const newImage = imageMap[imageName];
    const imagePath = `${mediaFolder}${imageName}`;

    if (zip.file(imagePath)) {
      zip.file(imagePath, newImage, { binary: true });
    } else {
      console.warn(`Image ${imageName} not found in the archive.`);
    }
  });
}

export function gerarCertificado(data: any, imageMap: any) {
  loadFile("/templates/certificado-frente-verso.pptx", (error: any, content: any) => {
    if (error) {
      throw error;
    }

    const zip = new PizZip(content);

    // Replace images in the zip
    replaceImage(zip, imageMap);

    const doc = new Docxtemplater(zip, {
      delimiters: { start: "[", end: "]" },
      paragraphLoop: true,
      linebreaks: true,
      parser: expressionParser,
    });

    doc.render(data);

    const out = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    saveAs(out, "output.pptx");
  });
}
