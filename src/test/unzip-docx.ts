import * as fs from "fs";
import * as path from "path";
import PizZip from "pizzip";

// Função para extrair arquivos de um .docx
async function unzipDocx(docxPath: string, outputDir: string) {
  // Lê o arquivo docx como buffer
  const data = fs.readFileSync(docxPath);
  // Carrega o zip usando pizzip
  const zip = new PizZip(data);

  // Garante que a pasta de saída existe
  fs.mkdirSync(outputDir, { recursive: true });

  // Percorre todos os arquivos do zip
  Object.keys(zip.files).forEach((relativePath) => {
    const file = zip.files[relativePath];
    const fullPath = path.join(outputDir, relativePath);
    if (file.dir) {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      // Garante que a pasta do arquivo existe
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, file.asNodeBuffer());
    }
  });

  console.log(`Extração concluída em: ${outputDir}`);
}

// Exemplo de uso
const docxFile =
  "/home/douglasrochak/code/lfsoares/lfsoares-front/public/templates/identificador/identificacao-do-participante-nova.docx"; // Caminho do arquivo .docx
const outputFolder = process.argv[3] || "./output-docx"; // Pasta de saída

if (!docxFile) {
  console.error("Uso: ts-node unzip-docx.ts <arquivo.docx> [pasta_saida]");
  process.exit(1);
}

unzipDocx(docxFile, outputFolder).catch((err) => {
  console.error("Erro ao extrair:", err);
});
