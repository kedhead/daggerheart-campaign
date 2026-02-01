import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const INPUT_PATH = path.join(PROJECT_ROOT, 'api', 'daggerheart-rules.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'api', 'daggerheart-embeddings.json');

// Initialize OpenAI
// We need an OpenAI key for embedding generation.
// It can come from .env or process.env
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error('Error: OPENAI_API_KEY is required in .env file to generate embeddings.');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: apiKey,
});

async function generateEmbeddings() {
    try {
        console.log(`Reading chunks from: ${INPUT_PATH}`);
        if (!fs.existsSync(INPUT_PATH)) {
            console.error('Rules JSON not found. Run extract-pdf-text.js first.');
            process.exit(1);
        }

        const rawData = fs.readFileSync(INPUT_PATH, 'utf8');
        const rulesData = JSON.parse(rawData);
        const chunks = rulesData.chunks;

        console.log(`Found ${chunks.length} chunks. Generating embeddings...`);

        const embeddings = [];
        const BATCH_SIZE = 20; // OpenAI batch limit is usually high, but let's be safe

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${i / BATCH_SIZE + 1} / ${Math.ceil(chunks.length / BATCH_SIZE)}...`);

            try {
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: batch.map(c => c.text),
                    encoding_format: "float",
                });

                response.data.forEach((item, index) => {
                    embeddings.push({
                        id: batch[index].id,
                        text: batch[index].text,
                        vector: item.embedding
                    });
                });
            } catch (apiError) {
                console.error('OpenAI API Error:', apiError);
                // Wait and retry logic could follow, but for now we exit
                process.exit(1);
            }
        }

        const output = {
            meta: {
                ...rulesData.meta,
                generatedAt: new Date().toISOString(),
                model: "text-embedding-3-small"
            },
            embeddings: embeddings
        };

        console.log(`Writing embeddings to: ${OUTPUT_PATH}`);
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
        console.log('Success! Embeddings generated.');

    } catch (error) {
        console.error('Error generating embeddings:', error);
    }
}

generateEmbeddings();
