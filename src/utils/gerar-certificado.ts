import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import { parseStringPromise, Builder, Parser } from "xml2js";
import { saveAs } from "file-saver";
import { loadFile } from "./load-file";

async function replaceImage(
  zip: PizZip,
  imageMap: Record<string, { data: ArrayBuffer; extension: string }>
) {
  const mediaFolder = "ppt/media/";

  for (const imageName in imageMap) {
    const { data: newImage, extension } = imageMap[imageName];
    const originalImageName = `${imageName.split(".")[0]}`;
    const files = Object.keys(zip.files);
    const imageFile = files.find((f) =>
      f.startsWith(`${mediaFolder}${originalImageName}`)
    );

    if (imageFile) {
      const newImagePath = `${mediaFolder}${originalImageName}.${extension}`;
      zip.file(newImagePath, newImage, { binary: true });

      if (imageFile !== newImagePath) {
        zip.remove(imageFile);
        const slideFiles = files.filter(
          (f) => f.startsWith("ppt/slides/") && f.endsWith(".xml")
        );
        for (const slideFile of slideFiles) {
          let slideContent = zip.file(slideFile)!.asText();
          const oldImageName = imageFile.split("/").pop()!;
          const newImageName = newImagePath.split("/").pop()!;
          slideContent = slideContent.replace(
            new RegExp(oldImageName, "g"),
            newImageName
          );
          zip.file(slideFile, slideContent);
        }

        const slideRelsFiles = files.filter(
          (f) => f.startsWith("ppt/slides/_rels/") && f.endsWith(".xml.rels")
        );
        for (const relsFile of slideRelsFiles) {
          let relsContent = zip.file(relsFile)!.asText();
          const oldImageName = imageFile.split("/").pop()!;
          const newImageName = newImagePath.split("/").pop()!;
          relsContent = relsContent.replace(
            new RegExp(oldImageName, "g"),
            newImageName
          );
          zip.file(relsFile, relsContent);
        }
      }

      if (imageName === "image3") {
        const slideFiles = files.filter(
          (f) => f.startsWith("ppt/slides/") && f.endsWith(".xml")
        );
        for (const slideFile of slideFiles) {
          const slideContent = zip.file(slideFile)!.asText();
          const parser = new Parser();
          const slideObj = await parser.parseStringPromise(slideContent);
          const newImageName = newImagePath.split("/").pop()!;

          const pictures =
            slideObj["p:sld"]["p:cSld"][0]["p:spTree"][0]["p:pic"];
          if (pictures) {
            for (const pic of pictures) {
              const blip = pic["p:blipFill"][0]["a:blip"][0];
              const relationshipId = blip?.$["r:embed"];

              if (relationshipId) {
                const relsFile = `ppt/slides/_rels/${slideFile
                  .split("/")
                  .pop()}.rels`;
                const relsContent = zip.file(relsFile)!.asText();
                const relsParser = new Parser();
                const relsObj = await relsParser.parseStringPromise(
                  relsContent
                );
                const relationship = relsObj.Relationships.Relationship.find(
                  (r: any) => r.$.Id === relationshipId
                );

                if (
                  relationship &&
                  relationship.$.Target.endsWith(newImageName)
                ) {
                  const xfrm = pic["p:spPr"][0]["a:xfrm"][0];
                  if (xfrm && xfrm["a:ext"]) {
                    xfrm["a:ext"][0].$.cy = "972800"; // 2.72cm em EMUs
                  }
                }
              }
            }
          }

          const builder = new Builder();
          const newSlideXml = builder.buildObject(slideObj);
          zip.file(slideFile, newSlideXml);
        }
      }
    } else {
      console.warn(`Image ${imageName} not found in the archive.`);
    }
  }
}

export async function gerarCertificado(
  data: Record<string, string>[],
  imageMap: Record<string, { data: ArrayBuffer; extension: string }>,
  type: string
): Promise<void> {
  const fileArrayBufferFrente = await loadFile(
    `/templates/certificado/frente-assinatura.pptx`
  );
  let templateVerso = `/templates/certificado/verso-${type}.pptx`;
  if (data[0]?.conteudo && data[0].conteudo.length > 700) {
    templateVerso = `/templates/certificado/verso-${type}-2coluna.pptx`;
  }
  const fileArrayBufferVerso = await loadFile(templateVerso);

  // // Frente
  const zip = new PizZip(fileArrayBufferFrente);
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

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const dateTimeString = `${day}${month}${year}T${hours}${minutes}`;

  saveAs(out, `CERTIFICADOS_FRENTE-${dateTimeString}.pptx`);

  // Verso
  const zipVerso = new PizZip(fileArrayBufferVerso);

  if (imageMap) {
    replaceImage(zipVerso, imageMap);
  }

  const doc = new Docxtemplater(zipVerso, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
    parser: expressionParser,
  });

  doc.render(data[0]);
  const outVerso = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  saveAs(outVerso, `CERTIFICADOS_VERSO-${dateTimeString}.pptx`);
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
