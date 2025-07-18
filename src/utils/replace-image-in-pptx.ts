import PizZip from "pizzip";
import * as fs from "fs";
/**
 * Replaces a specific image in a PowerPoint presentation with a new image.
 *
 * @param pptxFilePath The path to the .pptx file to be modified.
 * @param newImagePath The path to the new image that will replace the old one.
 * @param targetImageName The name of the image to be replaced within the presentation (e.g., "image4.svg").
 * @returns A Buffer containing the modified .pptx file.
 */
export async function replaceImageInPptx(
  pptxFilePath: string,
  newImagePath: string,
  targetImageName: string = "image4.svg"
): Promise<Buffer> {
  try {
    // Step 1: Read the .pptx file
    const pptxContent = fs.readFileSync(pptxFilePath);
    const zip = new PizZip(pptxContent);

    // Step 2: Read the new image file
    const newImageContent = fs.readFileSync(newImagePath);

    // Step 3: Define the path to the image within the .pptx archive
    const imagePathInPptx = `ppt/media/${targetImageName}`;

    // Step 4: Check if the target image exists in the presentation
    if (!zip.files[imagePathInPptx]) {
      throw new Error(
        `Image "${targetImageName}" not found in the presentation.`
      );
    }

    // Step 5: Replace the old image with the new one
    zip.file(imagePathInPptx, newImageContent, { binary: true });

    // Step 6: Generate the modified .pptx file as a buffer
    const modifiedPptxBuffer = zip.generate({
      type: "nodebuffer",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    return modifiedPptxBuffer;
  } catch (error) {
    console.error("An error occurred while replacing the image:", error);
    throw error;
  }
}

/**
 * Example of how to use the function.
 * This part of the script will only run if the file is executed directly.
 */
async function main() {
  const pptxFile =
    "/home/douglasrochak/code/lfsoares/lfsoares-front/public/templates/certificado/frente-assinatura.pptx";
  const newImage =
    "/home/douglasrochak/code/lfsoares/lfsoares-front/public/logo.png"; // Example new image
  const outputPptxPath =
    "/home/douglasrochak/code/lfsoares/lfsoares-front/public/templates/certificado/frente-assinatura-modified.pptx";

  console.log("Starting image replacement...");

  try {
    const modifiedPptx = await replaceImageInPptx(pptxFile, newImage);
    fs.writeFileSync(outputPptxPath, modifiedPptx);
    console.log(
      `Image replaced successfully. Modified file saved to: ${outputPptxPath}`
    );
  } catch (error) {
    console.error("Failed to replace image:", error);
  }
}
