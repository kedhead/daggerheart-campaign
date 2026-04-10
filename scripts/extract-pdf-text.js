import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfLib = require('pdf-parse');
const PDFParse = pdfLib.PDFParse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const PDF_PATH = process.argv[2] || path.join(PROJECT_ROOT, 'Daggerheart-Core-Rulebook-5-20-2025-1.pdf');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'api', 'daggerheart-rules.json');
const SUPPLEMENT_PATH = path.join(PROJECT_ROOT, 'api', 'daggerheart-supplements.json');

// Build supplemental chunks from app system data that isn't in the core PDF.
// This covers homebrew/expansion content defined in src/data/systems/daggerheart.js.
function loadSupplementalChunks(pdfText) {
  const supplementFile = SUPPLEMENT_PATH;
  if (fs.existsSync(supplementFile)) {
    console.log('Loading supplemental data from daggerheart-supplements.json...');
    const data = JSON.parse(fs.readFileSync(supplementFile, 'utf8'));
    return data.chunks || [];
  }
  return [];
}

async function extractPdfText() {
  try {
    console.log(`Reading PDF from: ${PDF_PATH}`);

    if (!fs.existsSync(PDF_PATH)) {
      console.error('PDF file not found!');
      process.exit(1);
    }

    const dataBuffer = fs.readFileSync(PDF_PATH);

    console.log('Parsing PDF...');
    const parser = new PDFParse({ data: dataBuffer });
    const fullData = await parser.getText();
    await parser.destroy();
    const fullText = fullData.text;

    console.log(`Total text length: ${fullText.length} characters`);

    // Chunking strategy: Split by double newlines (paragraphs) and then combine chunks
    // Target chunk size ~1500 characters with overlap
    const sections = fullText.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';
    const CHUNK_SIZE = 1500;
    const OVERLAP = 200;

    for (const section of sections) {
      const cleanSection = section.replace(/\s+/g, ' ').trim();
      if (!cleanSection) continue;

      if ((currentChunk.length + cleanSection.length) > CHUNK_SIZE) {
        chunks.push(currentChunk);
        // Start new chunk with overlap from end of previous
        currentChunk = currentChunk.slice(-OVERLAP) + '\n' + cleanSection;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + cleanSection;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    console.log(`Generated ${chunks.length} PDF chunks.`);

    // Load supplemental data not found in the PDF
    const supplementChunks = loadSupplementalChunks(fullText);
    if (supplementChunks.length > 0) {
      console.log(`Adding ${supplementChunks.length} supplemental chunks.`);
      for (const sc of supplementChunks) {
        chunks.push(sc.text);
      }
    }

    console.log(`Total chunks (PDF + supplements): ${chunks.length}`);

    // Create the output object
    const output = {
      meta: {
        title: "Daggerheart Core Rulebook + Supplements",
        version: "5-20-2025-1",
        extractedAt: new Date().toISOString(),
        pageCount: fullData.numpages,
        chunkCount: chunks.length
      },
      chunks: chunks.map((text, index) => ({
        id: index,
        text: text
      }))
    };

    console.log(`Writing extracted text to: ${OUTPUT_PATH}`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    console.log('Success! Text extraction complete.');

  } catch (error) {
    console.error('Error processing PDF:', error);
  }
}

extractPdfText();
