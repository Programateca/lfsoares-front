import { parseStringPromise, Builder, Parser } from "xml2js";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { loadFile } from "./load-file";

function replaceImage(zip: PizZip, imageMap: Record<string, ArrayBuffer>) {
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

export async function gerarCertificado(
  data: Record<string, string>[],
  imageMap: Record<string, ArrayBuffer>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _type: string
): Promise<void> {
  const fileArrayBuffer = await loadFile(`/templates/frente.pptx`);
  const zip = new PizZip(fileArrayBuffer);
  if (imageMap) {
    replaceImage(zip, imageMap);
  }
  const numeroDeCertificados = data.length;
  await duplicateSlide(zip, numeroDeCertificados, data);
  const out = zip.generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  saveAs(out, "certificados.pptx");
}

async function duplicateSlide(
  zip: PizZip,
  numTimes: number,
  data: Record<string, string>[]
) {
  const slideNumber = 1;
  const ctPath = "[Content_Types].xml";

  // Obtém o conteúdo do slide original.
  // Seleciona o slider1.xml para ser a base para os novos slides.
  const originalSlidePath = `ppt/slides/slide${slideNumber}.xml`;
  const originalSlideContent = zip.file(originalSlidePath)?.asText();
  if (!originalSlideContent) {
    throw new Error(`Slide ${slideNumber} não encontrado.`);
  }
  // Preenche o slide original com os dados do primeiro participante, se existir.
  if (data[0]) {
    let updatedSlideContent = originalSlideContent;
    for (const key in data[0]) {
      if (Object.prototype.hasOwnProperty.call(data[0], key)) {
        const pattern = new RegExp(key, "g");
        updatedSlideContent = updatedSlideContent.replace(
          pattern,
          data[0][key]
        );
      }
    }
    zip.file(originalSlidePath, updatedSlideContent);
  }

  // Obtém os relacionamentos do slide original (se existirem).
  const originalSlideRelsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
  const originalSlideRelsContent = zip.file(originalSlideRelsPath)?.asText();

  // Carrega e prepara os arquivos XML da apresentação.
  const presentationPath = "ppt/presentation.xml";
  const presentationXml = zip.file(presentationPath)?.asText();
  if (!presentationXml) {
    throw new Error("Arquivo ppt/presentation.xml não encontrado.");
  }
  const parser = new Parser();
  const presentationObj = await parser.parseStringPromise(presentationXml);
  const sldIdLst =
    presentationObj["p:presentation"]["p:sldIdLst"][0]["p:sldId"];

  // Carrega os relacionamentos da apresentação.
  const relsPath = "ppt/_rels/presentation.xml.rels";
  const relsXml = zip.file(relsPath)?.asText();
  if (!relsXml) {
    throw new Error("Arquivo ppt/_rels/presentation.xml.rels não encontrado.");
  }
  const relsObj = await parseStringPromise(relsXml);
  const relationships = relsObj.Relationships.Relationship;

  // Carrega o arquivo [Content_Types].xml.
  const ctXml = zip.file(ctPath)?.asText();
  if (!ctXml) {
    throw new Error("Arquivo [Content_Types].xml não encontrado.");
  }
  const ctObj = await parseStringPromise(ctXml);

  // Duplicação: realiza a cópia o número de vezes especificado.
  for (let i = 1; i < numTimes; i++) {
    // Determina o novo número do slide.
    const slideFiles = Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(name)
    );
    const slideNumbers = slideFiles.map((name) =>
      Number(name.match(/slide(\d+)\.xml/)![1])
    );
    const newSlideNumber = Math.max(...slideNumbers) + 1;
    const newSlidePath = `ppt/slides/slide${newSlideNumber}.xml`;

    // Preenche os placeholders do slide com os dados do participante atual.
    const currentData = data[i] || {};
    let filledSlideContent = originalSlideContent;
    for (const key in currentData) {
      if (Object.prototype.hasOwnProperty.call(currentData, key)) {
        const pattern = new RegExp(key, "g");
        filledSlideContent = filledSlideContent.replace(
          pattern,
          currentData[key]
        );
      }
    }

    // Adiciona o slide duplicado no zip.
    zip.file(newSlidePath, filledSlideContent);

    // Duplicação dos relacionamentos do slide, se existirem.
    if (originalSlideRelsContent) {
      const newSlideRelsPath = `ppt/slides/_rels/slide${newSlideNumber}.xml.rels`;
      zip.file(newSlideRelsPath, originalSlideRelsContent);
    }

    // Atualiza a lista de slides na apresentação.
    let maxId = 256;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sldIdLst.forEach((sld: any) => {
      const id = Number(sld.$["id"]);
      if (id > maxId) {
        maxId = id;
      }
    });
    const newId = maxId + 1;

    // Cria um novo relacionamento para o slide duplicado.
    const newRid = "rId" + (relationships.length + 1);
    relationships.push({
      $: {
        Id: newRid,
        Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
        Target: `slides/slide${newSlideNumber}.xml`,
      },
    });

    // Insere o novo slide na lista da apresentação.
    sldIdLst.push({ $: { id: newId.toString(), "r:id": newRid } });

    // Atualiza [Content_Types].xml.
    ctObj.Types.Override.push({
      $: {
        PartName: `/ppt/slides/slide${newSlideNumber}.xml`,
        ContentType:
          "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
      },
    });
  }

  // Reconstrói os XMLs atualizados.
  const builder = new Builder();
  const newPresentationXml = builder.buildObject(presentationObj);
  const newRelsXml = builder.buildObject(relsObj);
  const newCtXml = builder.buildObject(ctObj);

  // Atualiza os arquivos XML no zip.
  zip.file(presentationPath, newPresentationXml);
  zip.file(relsPath, newRelsXml);
  zip.file(ctPath, newCtXml);
}
