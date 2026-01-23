import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const PDF_PATH = path.join(PROJECT_ROOT, 'Daggerheart-Core-Rulebook-5-20-2025-1.pdf');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'daggerheart-rules.json');

async function extractPdfText() {
  try {
    console.log(`Reading PDF from: ${PDF_PATH}`);

    if (!fs.existsSync(PDF_PATH)) {
      console.error('PDF file not found!');
      process.exit(1);
    }

    const dataBuffer = fs.readFileSync(PDF_PATH);

    console.log('Parsing PDF...');
    const data = await pdf(dataBuffer);

    // Create the output object
    const output = {
      meta: {
        title: "Daggerheart Core Rulebook",
        version: "5-20-2025-1",
        extractedAt: new Date().toISOString(),
        pageCount: data.numpages
      },
      content: data.text
    };

    console.log(`Writing extraced text to: ${OUTPUT_PATH}`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    console.log('Success! Text extraction complete.');

  } catch (error) {
    console.error('Error processing PDF:', error);
  }
}

extractPdfText();
