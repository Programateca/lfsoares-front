import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import expressionParser from "docxtemplater/expressions";
import { saveAs } from "file-saver";

function loadFile(url: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";

    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new Error("Failed to load file"));
      }
    };

    xhr.onerror = function () {
      reject(new Error("Network error"));
    };

    xhr.send();
  });
}

function replaceImage(zip: PizZip, imageMap: Record<string, string>) {
  const mediaFolder = "ppt/media/";

  Object.keys(imageMap).forEach((imageName) => {
    const newImage = imageMap[imageName];
    const imagePath = `${mediaFolder}${imageName}`;

    if (zip.files[imagePath]) {
      zip.file(imagePath, newImage, { binary: true });
    } else {
      console.warn(`Image ${imageName} not found in the archive.`);
    }
  });
}

function mergeSlides(processedSlides: PizZip[]) {
  // Usar o primeiro arquivo como base
  const baseZip = processedSlides[0];
  const presentationXml = baseZip.files["ppt/presentation.xml"].asText();
  const presentationRels =
    baseZip.files["ppt/_rels/presentation.xml.rels"].asText();

  let maxId = 256;
  let maxRelId = 1;

  // Preparar novos conteúdos
  let newSlideXml = "";
  let newRelsXml = "";

  processedSlides.forEach((zip, index) => {
    const slideContent = zip.files["ppt/slides/slide1.xml"].asText();
    const slideRels = zip.files["ppt/slides/_rels/slide1.xml.rels"]?.asText();

    // Adicionar slide
    const slideNumber = index + 1;
    maxId++;
    maxRelId++;

    // Copiar o slide
    baseZip.file(`ppt/slides/slide${slideNumber}.xml`, slideContent);

    // Copiar relacionamentos do slide se existirem
    if (slideRels) {
      baseZip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`, slideRels);
    }

    // Adicionar referência do slide
    newSlideXml += `<p:sldId id="${maxId}" r:id="rId${maxRelId}"/>`;
    newRelsXml += `<Relationship Id="rId${maxRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideNumber}.xml"/>`;
  });

  // Atualizar presentation.xml
  const newPresentationXml = presentationXml.replace(
    /<p:sldIdLst>.*<\/p:sldIdLst>/,
    `<p:sldIdLst>${newSlideXml}</p:sldIdLst>`
  );

  // Atualizar presentation.xml.rels
  const newPresentationRels = presentationRels.replace(
    /<\?xml.*\?><Relationships.*>/,
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${newRelsXml}`
  );

  // Atualizar [Content_Types].xml
  let contentTypesXml = baseZip.files["[Content_Types].xml"].asText();
  processedSlides.forEach((_, index) => {
    const slideNumber = index + 1;
    const slideContentType = `<Override PartName="/ppt/slides/slide${slideNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
    if (
      !contentTypesXml.includes(
        `PartName="/ppt/slides/slide${slideNumber}.xml"`
      )
    ) {
      contentTypesXml = contentTypesXml.replace(
        "</Types>",
        `${slideContentType}</Types>`
      );
    }
  });

  // Atualizar arquivos no ZIP
  baseZip.file("ppt/presentation.xml", newPresentationXml);
  baseZip.file("ppt/_rels/presentation.xml.rels", newPresentationRels);
  baseZip.file("[Content_Types].xml", contentTypesXml);

  return baseZip;
}

export async function gerarCertificado(
  data: any[],
  imageMap: Record<string, string>,
  type: string
) {
  try {
    const processedSlides: PizZip[] = [];
    console.log(data);
    // Processar cada conjunto de dados separadamente
    for (const itemData of data) {
      // Carregar template novamente para cada slide
      const content = await loadFile(`/templates/frente-${type}.pptx`);
      const zip = new PizZip(content);

      // Substituir imagens
      replaceImage(zip, imageMap);

      // Criar nova instância do Docxtemplater
      const doc = new Docxtemplater(zip, {
        delimiters: { start: "[", end: "]" },
        paragraphLoop: true,
        linebreaks: true,
        parser: expressionParser,
      });

      // Renderizar com os dados do certificado atual
      doc.render(itemData);
      // Guardar o ZIP processado
      processedSlides.push(doc.getZip());
    }

    // Combinar todos os slides em uma única apresentação
    const finalZip = mergeSlides(processedSlides);

    // Gerar arquivo final
    const out = finalZip.generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    // Salvar arquivo
    saveAs(out, "certificados.pptx");
  } catch (error) {
    console.error("Erro ao gerar certificados:", error);
    throw error;
  }
}
