// import Docxtemplater from "docxtemplater";
// import PizZip from "pizzip";
// import PizZipUtils from "pizzip/utils/index.js";
// import { saveAs } from "file-saver";
// import expressionParser from "docxtemplater/expressions";

// function loadFile(url: string, callback: any) {
//   PizZipUtils.getBinaryContent(url, callback);
// }

// export function gerarCertificado(data: Record<string, string>) {
//   loadFile("/templates/certificado-frente-verso.pptx", (error: Error, content: any) => {
//     if (error) {
//       throw error;
//     }
//     const zip = new PizZip(content);
//     const doc = new Docxtemplater(zip, {
//       delimiters: { start: "[", end: "]" },
//       paragraphLoop: true,
//       linebreaks: true,
//       parser: expressionParser,
//     });
//     doc.render(data);
//     const out = doc.getZip().generate({
//       type: "blob",
//       mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     }); //Output the document using Data-URI
//     saveAs(out, "output.pptx");
//   });
// }

import JSZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path, { join } from 'path';

class DocxTemplateProcessor {
    /**
     * Load and process a Word DOCX template
     * @param {string} templatePath - Path to the template file
     * @param {Object} templateData - Data to replace placeholders in the template
     * @param {string} outputPath - Path to save the processed document
     */
    static processTemplate(templatePath, templateData, outputPath) {
        try {
            // Read the template file
            const content = fs.readFileSync(templatePath, 'binary');

            // Create a new JSZip instance
            const zip = new JSZip(content);

            // Create a new Docxtemplater instance
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true
            });

            // Set the template data
            doc.setData(templateData);

            // Render the document
            doc.render();

            // Get the generated document
            const generatedDoc = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });

            // Write the generated document to the output path
            fs.writeFileSync(outputPath, generatedDoc);

            console.log(`Document successfully generated at ${outputPath}`);
        } catch (error) {
            console.error('Error processing template:', error);
            throw error;
        }
    }

    /**
     * Extract contents of a DOCX file
     * @param {string} docxPath - Path to the DOCX file
     * @param {string} extractPath - Directory to extract contents
     */
    static extractDocx(docxPath, extractPath) {
        try {
            // Read the DOCX file
            const content = fs.readFileSync(docxPath, 'binary');

            // Create a new JSZip instance
            const zip = new JSZip(content);

            // Ensure extraction directory exists
            if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
            }

            // Extract and write each file in the ZIP
            Object.keys(zip.files).forEach(filename => {
                const fileContent = zip.files[filename].asNodeBuffer();
                const fullPath = path.join(extractPath, filename);

                // Ensure directory exists
                const fileDir = path.dirname(fullPath);
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true });
                }

                // Write file
                fs.writeFileSync(fullPath, fileContent);
                console.log(`Extracted: ${filename}`);
            });

            console.log(`Successfully extracted to ${extractPath}`);
        } catch (error) {
            console.error('Error extracting DOCX:', error);
            throw error;
        }
    }
}

class DocxRecompiler {
    /**
     * Repack extracted DOCX files into a new DOCX
     * @param {string} extractedDirPath - Path to directory with extracted files
     * @param {string} outputPath - Path to save the repacked DOCX
     */
    static repackDocx(extractedDirPath, outputPath) {
        try {
            // Create a new ZIP
            const zip = new JSZip();

            // Read all files in the extracted directory recursively
            function addFilesToZip(dirPath, zipFolder = zip) {
                const files = fs.readdirSync(dirPath);

                files.forEach(file => {
                    const fullPath = path.join(dirPath, file);
                    const stats = fs.statSync(fullPath);

                    if (stats.isDirectory()) {
                        // Create a new folder in the ZIP
                        const subFolder = zipFolder.folder(file);
                        addFilesToZip(fullPath, subFolder);
                    } else {
                        // Add file to ZIP
                        const content = fs.readFileSync(fullPath);
                        zipFolder.file(file, content);
                    }
                });
            }

            // Add files to ZIP
            addFilesToZip(extractedDirPath);

            // Generate the DOCX file
            const generatedDocx = zip.generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });

            // Write the generated DOCX
            fs.writeFileSync(outputPath, generatedDocx);

            console.log(`DOCX successfully repacked to ${outputPath}`);
        } catch (error) {
            console.error('Error repacking DOCX:', error);
            throw error;
        }
    }

    /**
     * Validate DOCX structure before repacking
     * @param {string} extractedDirPath - Path to extracted files
     * @returns {boolean} - Whether the structure is valid
     */
    static validateDocxStructure(extractedDirPath) {
        const requiredFolders = ['word', 'docProps'];
        const requiredRootFiles = ['[Content_Types].xml'];

        const checkRequiredItems = (items, requiredList) => {
            return requiredList.every(req => 
                items.includes(req)
            );
        };

        try {
            const rootContents = fs.readdirSync(extractedDirPath);

            // Check root-level required files and folders
            const hasRequiredRootFiles = checkRequiredItems(
                rootContents, 
                [...requiredRootFiles, ...requiredFolders]
            );

            // Additional checks can be added here
            const wordFolderContents = fs.readdirSync(path.join(extractedDirPath, 'word'));
            const requiredWordFiles = ['document.xml', 'styles.xml'];
            const hasRequiredWordFiles = checkRequiredItems(
                wordFolderContents, 
                requiredWordFiles
            );

            return hasRequiredRootFiles && hasRequiredWordFiles;
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    /**
     * Full workflow: extract, modify, and repack
     * @param {string} inputDocx - Path to input DOCX
     * @param {string} extractPath - Path to extract files
     * @param {string} outputDocx - Path to save repacked DOCX
     * @param {Function} modifyFn - Optional function to modify extracted files
     */
    static processDocx(inputDocx, extractPath, outputDocx, modifyFn = null) {
        try {
            // Extract DOCX
            const content = fs.readFileSync(inputDocx, 'binary');
            const zip = new JSZip(content);

            // Ensure extraction directory exists
            if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
            }

            // Extract files
            Object.keys(zip.files).forEach(filename => {
                const fileContent = zip.files[filename].asNodeBuffer();
                const fullPath = path.join(extractPath, filename);

                // Ensure directory exists
                const fileDir = path.dirname(fullPath);
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true });
                }

                // Write file
                fs.writeFileSync(fullPath, fileContent);
            });

            // Optional modification step
            if (modifyFn && typeof modifyFn === 'function') {
                modifyFn(extractPath);
            }

            // Validate structure
            if (!this.validateDocxStructure(extractPath)) {
                throw new Error('Invalid DOCX structure');
            }

            // Repack
            this.repackDocx(extractPath, outputDocx);
        } catch (error) {
            console.error('DOCX processing failed:', error);
            throw error;
        }
    }
}

// Example usage
try {
    // Sample template data
    const templateData = {
        name: 'John Doe',
        position: 'Software Engineer',
        company: 'Tech Innovations Inc.',
        date: new Date().toLocaleDateString()
    };

    // Process template
    // DocxTemplateProcessor.processTemplate(
    //     './template/lista-dia-todo.docx',   // Input template
    //     templateData,        // Template data
    //     './output/output.docx'      // Output document
    // );

    // Optional: Extract contents of a DOCX
    // DocxTemplateProcessor.extractDocx(
    //     'test/templates/lista-dia-todo.docx',     // DOCX to extract
    //     'test/output/extracted-docx'  // Extraction directory
    // );

    DocxRecompiler.repackDocx('test/output/extracted-docx', 'test/output/repacked-docx.docx');


} catch (error) {
    console.error('Processing failed:', error);
}

// Note: Requires following npm packages:
// npm install pizzip docxtemplater