import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function for cosine similarity
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// Load embeddings on cold start (if possible)
let embeddingStore = null;

function loadEmbeddings() {
    if (embeddingStore) return embeddingStore;

    try {
        const paths = [
            path.join(process.cwd(), 'api', 'daggerheart-embeddings.json'),
            path.join(__dirname, 'daggerheart-embeddings.json'),
            path.join(process.cwd(), 'daggerheart-embeddings.json')
        ];

        for (const p of paths) {
            if (fs.existsSync(p)) {
                console.log(`Loading embeddings from: ${p}`);
                const data = fs.readFileSync(p, 'utf8');
                embeddingStore = JSON.parse(data);
                return embeddingStore;
            }
        }
        console.warn('Embeddings file not found in any expected location.', paths);
    } catch (err) {
        console.error('Error loading embeddings:', err);
    }
    return null;
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { message, history = [], apiKey, provider = 'anthropic' } = req.body;

        if (!message) return res.status(400).json({ error: 'Missing required field: message' });

        // Dynamic import OpenAI to prevent crash if module is missing
        let OpenAI;
        try {
            const module = await import('openai');
            OpenAI = module.default;
        } catch (err) {
            console.warn('OpenAI module not found. RAG will be disabled if OpenAI key is present directly.', err);
        }

        // 1. Get Embedding for User Query
        const embeddingKey = process.env.OPENAI_API_KEY || (apiKey?.startsWith('sk-') ? apiKey : null);
        const store = loadEmbeddings();
        let contextText = '';

        if (embeddingKey && store && OpenAI) {
            try {
                const openai = new OpenAI({ apiKey: embeddingKey });
                const embeddingResponse = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: message,
                });
                const queryVector = embeddingResponse.data[0].embedding;

                // 2. Perform Vector Search
                const scoredChunks = store.embeddings.map(chunk => ({
                    ...chunk,
                    score: cosineSimilarity(queryVector, chunk.vector)
                }));

                const topChunks = scoredChunks.sort((a, b) => b.score - a.score).slice(0, 7);
                contextText = topChunks.map(c => c.text).join('\n\n---\n\n');
                console.log(`RAG: Found ${topChunks.length} relevant chunks.`);
            } catch (err) {
                console.error('RAG Error:', err.message);
                contextText = "Error retrieving rules context. Please rely on general Daggerheart knowledge.";
            }
        } else {
            console.log('Skipping RAG:', {
                hasOpenAIModule: !!OpenAI,
                hasKey: !!embeddingKey,
                hasStore: !!store
            });
            contextText = "Rules context unavailable (System configuration missing).";
        }

        // 3. Construct System Prompt
        const systemPrompt = `You are a helpful and knowledgeable AI Game Master assistant for the tabletop roleplaying game "Daggerheart". 
    
You have access to relevant sections of the core rulebook below. Use this information to answer the user's questions accurately.
If the answer cannot be found in the provided text, state that you don't know based on the provided context, but try to provide helpful general RPG advice if applicable.

Tone: Helpful, encouraging, and thematic.

=== RELEVANT RULEBOOK SECTIONS ===
${contextText}
=== END RULES ===
`;

        // 4. Call LLM Provider
        let responseText = '';

        // If client didn't provide a key, try server-side keys in order of preference
        let effectiveProvider = provider;
        let effectiveKey = apiKey;

        if (!apiKey || apiKey === '') {
            // Try Anthropic first (best quality), then OpenAI, then 1min
            if (process.env.ANTHROPIC_API_KEY) {
                effectiveProvider = 'anthropic';
                effectiveKey = process.env.ANTHROPIC_API_KEY;
                console.log('Fallback: Using server-side Anthropic key');
            } else if (process.env.OPENAI_API_KEY) {
                effectiveProvider = 'openai';
                effectiveKey = process.env.OPENAI_API_KEY;
                console.log('Fallback: Using server-side OpenAI key');
            } else if (process.env.min_api || process.env.MIN_API_KEY) {
                effectiveProvider = '1min';
                effectiveKey = process.env.min_api || process.env.MIN_API_KEY;
                console.log('Fallback: Using server-side 1min key');
            } else {
                console.error('No API keys configured on server');
                return res.status(500).json({
                    error: 'No API keys available. Please configure an API key in Settings, or contact the administrator.'
                });
            }
        }

        try {
            if (effectiveProvider === 'anthropic' || effectiveProvider === 'claude') {
                const key = effectiveKey || process.env.ANTHROPIC_API_KEY;
                if (!key) throw new Error('Missing Anthropic API Key');

                const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620';

                const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: 4096,
                        system: systemPrompt,
                        messages: [...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })), { role: 'user', content: message }]
                    })
                });
                if (!apiResponse.ok) throw new Error(`Anthropic: ${await apiResponse.text()}`);
                const data = await apiResponse.json();
                responseText = data.content[0]?.text || '';

            } else if (effectiveProvider === 'openai') {
                const key = effectiveKey || process.env.OPENAI_API_KEY;
                if (!key) throw new Error('Missing OpenAI API Key');

                if (!OpenAI) throw new Error('OpenAI module not installed on server');

                const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({
                        model: 'gpt-4-turbo-preview',
                        messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }],
                        max_tokens: 4096
                    })
                });
                if (!apiResponse.ok) throw new Error(`OpenAI: ${await apiResponse.text()}`);
                const data = await apiResponse.json();
                responseText = data.choices[0]?.message?.content || '';

            } else if (effectiveProvider === '1min') {
                const key = effectiveKey || process.env.min_api || process.env.MIN_API_KEY;
                if (!key) throw new Error('Missing 1min.ai API Key');

                const apiResponse = await fetch('https://api.1min.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({
                        model: 'gpt-4-turbo-preview',
                        messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }],
                        max_tokens: 4096
                    })
                });
                if (!apiResponse.ok) throw new Error(`1min.ai: ${await apiResponse.text()}`);
                const data = await apiResponse.json();
                responseText = data.choices[0]?.message?.content || '';
            } else {
                return res.status(400).json({ error: 'Invalid provider' });
            }
        } catch (providerError) {
            console.error('Provider Error:', providerError);
            return res.status(500).json({ error: `Provider Error: ${providerError.message}` });
        }

        return res.status(200).json({ response: responseText });

    } catch (error) {
        console.error('Main Handler Error:', error);
        // Include detailed error in the main 'error' field so the client UI shows it
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}
