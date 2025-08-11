import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions";
import { parseStringPromise, Builder, Parser } from "xml2js";
import { saveAs } from "file-saver";
import { loadFile } from "./load-file";

const getAssinaturaImage = async (nome: "luiz" | "cledione" | "vazio") => {
  const basePath = "/templates/assinaturas";
  if (nome === "vazio") {
    return await loadFile(`${basePath}/blank-image.png`);
  }
  return await loadFile(
    `${basePath}/${nome.toLowerCase().replace(/\s/g, "_")}_assinatura.png`
  );
};

async function replaceImage(
  zip: PizZip,
  imageMap: Record<string, { data: ArrayBuffer; extension: string }>,
  tipoCertificado?: string
) {
  // Util helpers
  const toMime = (extOrMime?: string) => {
    const v = (extOrMime || "").trim().toLowerCase();
    if (v.includes("/")) return v; // already a mime
    const e = v.replace(/^\./, "");
    switch (e) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "bmp":
        return "image/bmp";
      case "svg":
        return "image/svg+xml";
      case "tiff":
      case "tif":
        return "image/tiff";
      case "webp":
        return "image/webp";
      default:
        return "image/jpeg";
    }
  };

  const findExistingMediaPath = (index: number) => {
    const re = new RegExp(`^ppt\\/media\\/image${index}\\.[A-Za-z0-9]+$`, "i");
    const found = Object.keys(zip.files).find((n) => re.test(n));
    const path = found || `ppt/media/image${index}.jpeg`;
    const partName = `/${path}`;
    return { path, partName };
  };

  const updateContentType = async (partName: string, mime: string) => {
    try {
      const ctPath = "[Content_Types].xml";
      const ctXml = zip.file(ctPath)?.asText();
      if (!ctXml) return;

      const ctObj = await parseStringPromise(ctXml);
      if (!ctObj.Types.Override) ctObj.Types.Override = [];

      const override = ctObj.Types.Override.find(
        (o: any) => o.$?.PartName === partName
      );
      if (override) {
        override.$.ContentType = mime;
      } else {
        ctObj.Types.Override.push({
          $: { PartName: partName, ContentType: mime },
        });
      }

      const builder = new Builder();
      const newCtXml = builder.buildObject(ctObj);
      zip.file(ctPath, newCtXml);
    } catch {
      // ignore content-types update failure; image bytes already replaced
    }
  };

  const writeImageToSlot = async (
    slotIndex: 1 | 2,
    file?: { data: ArrayBuffer; extension: string }
  ) => {
    if (!file?.data) return;
    const { path, partName } = findExistingMediaPath(slotIndex);
    zip.file(path, file.data, { binary: true });
    await updateContentType(partName, toMime(file.extension));
  };

  // Troca image1 e image2 se houver alguma imagem que não seja assinatura
  if (imageMap) {
    const allKeys = Object.keys(imageMap);
    const nonSignatureKeys = allKeys.filter((k) => !/^assinatura\d+$/i.test(k));

    if (nonSignatureKeys.length > 0) {
      // Prefer explicit keys image1 / image2 if provided
      const keyLookup = new Map(allKeys.map((k) => [k.toLowerCase(), k]));
      const used = new Set<string>();

      const selectKeyForSlot = (slot: 1 | 2) => {
        const explicit = keyLookup.get(`image${slot}`);
        if (explicit) {
          used.add(explicit);
          return explicit;
        }
        const next = nonSignatureKeys.find((k) => !used.has(k));
        if (next) {
          used.add(next);
          return next;
        }
        return undefined;
      };

      const key1 = selectKeyForSlot(1);
      const key2 = selectKeyForSlot(2);

      if (key1) {
        await writeImageToSlot(1, imageMap[key1]);
      }
      if (key2) {
        await writeImageToSlot(2, imageMap[key2]);
      }
    }
  }

  // SE FOR CERTIFICADO VAI TER O TIPO DE CERTIFICADO
  if (tipoCertificado) {
    console.log("imageMap", imageMap);
    const totalAssinaturas = Number(tipoCertificado[0]);

    for (let i = 1; i < totalAssinaturas; i++) {
      const blankImage = await getAssinaturaImage("vazio");
      zip.file(`ppt/media/image${i + 2}.png`, blankImage, { binary: true });
    }

    // Assinaturas ocupam os slots image3..image6
    const slots = [3, 4, 5, 6];

    for (let i = 0; i < slots.length; i++) {
      console.log("SLOTS FOR", i);
      const slotNumber = slots[i];
      const key = `assinatura${i + 1}`;

      const selected = (imageMap?.[key]?.extension || "none").toLowerCase();
      const nomeAssinatura: "luiz" | "cledione" | "vazio" =
        selected === "luiz" || selected === "cledione"
          ? (selected as any)
          : "vazio";

      const newImage = await getAssinaturaImage(nomeAssinatura);

      const newImagePath = `ppt/media/image${slotNumber}.png`;
      zip.file(newImagePath, newImage, { binary: true });
    }
    return;
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
    await replaceImage(zipVerso, imageMap, type);
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
