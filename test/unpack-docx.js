import fs from "fs";
import PizZip from "pizzip";

function extractDocx(docxPath, outputDir) {
  try {
    // Lê o arquivo docx
    const content = fs.readFileSync(docxPath);

    // Cria instância do PizZip
    const zip = new PizZip(content);

    // Cria diretório de saída se não existir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extrai todos os arquivos
    Object.keys(zip.files).forEach((filename) => {
      const file = zip.files[filename];

      if (!file.dir) {
        const filePath = `${outputDir}/${filename}`;
        const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));

        // Cria diretórios necessários
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        // Escreve o arquivo
        const fileContent = file.asNodeBuffer();
        fs.writeFileSync(filePath, fileContent);
        console.log(`Extraído: ${filename}`);
      }
    });

    console.log("Extração concluída!");
  } catch (error) {
    console.error("Erro ao extrair arquivo:", error.message);
  }
}

// Exemplo de uso
const docxFile =
  "public/templates/identificador/identificador-assinatura-template.docx";
const outputDirectory = "./test/extracted";

extractDocx(docxFile, outputDirectory);
