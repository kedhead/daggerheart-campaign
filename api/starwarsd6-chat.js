import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load rules chunks on cold start
let rulesStore = null;

function loadRules() {
    if (rulesStore) return rulesStore;

    try {
        const paths = [
            path.join(process.cwd(), 'api', 'starwarsd6-rules.json'),
            path.join(__dirname, 'starwarsd6-rules.json'),
            path.join(process.cwd(), 'starwarsd6-rules.json')
        ];

        for (const p of paths) {
            if (fs.existsSync(p)) {
                console.log(`[SW-D6] Loading rules from: ${p}`);
                const data = fs.readFileSync(p, 'utf8');
                rulesStore = JSON.parse(data);
                console.log(`[SW-D6] Loaded ${rulesStore.chunks?.length || 0} rule chunks`);
                return rulesStore;
            }
        }
        console.warn('[SW-D6] Rules file not found in any expected location.');
    } catch (err) {
        console.error('[SW-D6] Error loading rules:', err);
    }
    return null;
}

/**
 * Simple keyword-based relevance scoring.
 * Since we don't have embeddings yet, we rank chunks by how many
 * query words appear in the chunk title + text (case-insensitive).
 */
function scoreChunk(chunk, queryWords) {
    const combined = `${chunk.title} ${chunk.text}`.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
        if (word.length < 3) continue; // skip tiny words
        const regex = new RegExp(word, 'gi');
        const matches = combined.match(regex);
        if (matches) score += matches.length;
    }
    // Boost title matches significantly
    const titleLower = chunk.title.toLowerCase();
    for (const word of queryWords) {
        if (word.length < 3) continue;
        if (titleLower.includes(word)) score += 10;
    }
    return score;
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
        const { message, history = [], apiKey, provider = 'anthropic', campaignContext = '' } = req.body;

        if (!message) return res.status(400).json({ error: 'Missing required field: message' });

        // 1. Load rules and find relevant chunks
        const store = loadRules();
        let contextText = '';

        if (store && store.chunks) {
            const queryWords = message.toLowerCase().split(/\s+/).filter(w => w.length >= 3);

            // Score and rank chunks
            const scored = store.chunks.map(chunk => ({
                ...chunk,
                score: scoreChunk(chunk, queryWords)
            }));

            // Take top 8 most relevant chunks
            const topChunks = scored
                .sort((a, b) => b.score - a.score)
                .slice(0, 8);

            // Always include core mechanic chunk if not already in top results
            const coreChunk = store.chunks.find(c => c.id === 0);
            if (coreChunk && !topChunks.find(c => c.id === 0)) {
                topChunks.pop();
                topChunks.push(coreChunk);
            }

            contextText = topChunks
                .map(c => `### ${c.title}\n${c.text}`)
                .join('\n\n---\n\n');

            console.log(`[SW-D6] Matched ${topChunks.length} chunks for query: "${message.substring(0, 50)}..."`);
        } else {
            contextText = 'Rules reference not loaded. Rely on general Star Wars D6 knowledge.';
        }

        // 2. Construct System Prompt
        const campaignSection = campaignContext
          ? `=== YOUR CAMPAIGN ===\n${campaignContext}\n=== END CAMPAIGN ===\n\n`
          : '';

        const systemPrompt = `You are an AI Game Master assistant for the "Star Wars: The Roleplaying Game" (the West End Games D6 system, 2nd Edition Revised & Expanded).
${campaignContext
  ? `You have full knowledge of the campaign described below and can answer questions about its characters, NPCs, locations, adversaries, lore, and recent events. When the user asks about something in the campaign, draw on that knowledge directly. When giving rules advice, tie it to the specific campaign context where relevant.`
  : `You are a helpful rules assistant. Answer questions about Star Wars D6 mechanics, character creation, the Force, combat, starships, and gameplay.`
}

Tone: Knowledgeable and enthusiastic, like a veteran Star Wars GM who loves this classic system. Be concise — answer the question asked, don't pad with unnecessary caveats. Use Star Wars flavor when appropriate ("May the Force be with you", referencing iconic scenes as examples).

Key reminders:
- This is the West End Games D6 system, NOT Fantasy Flight Games or D20
- Dice pools use D6s only — no other die types
- The Wild Die is central to the experience
- The Force has three skills: Control, Sense, Alter
- Character Points and Force Points are different resources
- Scale differences matter in vehicle/starship combat

${campaignSection}=== RELEVANT RULES REFERENCE ===
${contextText}
=== END RULES ===
`;

        // 3. Call LLM Provider
        let responseText = '';
        let effectiveProvider = provider;
        let effectiveKey = apiKey;

        if (!apiKey || apiKey === '') {
            if (process.env.OPENAI_API_KEY) {
                effectiveProvider = 'openai';
                effectiveKey = process.env.OPENAI_API_KEY;
            } else if (process.env.ANTHROPIC_API_KEY) {
                effectiveProvider = 'anthropic';
                effectiveKey = process.env.ANTHROPIC_API_KEY;
            } else if (process.env.min_api || process.env.MIN_API_KEY) {
                effectiveProvider = '1min';
                effectiveKey = process.env.min_api || process.env.MIN_API_KEY;
            } else {
                return res.status(500).json({
                    error: 'No API keys available. Please configure an API key in Settings, or contact the administrator.'
                });
            }
        }

        try {
            if (effectiveProvider === 'anthropic' || effectiveProvider === 'claude') {
                const key = effectiveKey || process.env.ANTHROPIC_API_KEY;
                if (!key) throw new Error('Missing Anthropic API Key');

                const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

                const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
                    body: JSON.stringify({
                        model,
                        max_tokens: 4096,
                        system: systemPrompt,
                        messages: [
                            ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
                            { role: 'user', content: message }
                        ]
                    })
                });
                if (!apiResponse.ok) throw new Error(`Anthropic: ${await apiResponse.text()}`);
                const data = await apiResponse.json();
                responseText = data.content[0]?.text || '';

            } else if (effectiveProvider === 'openai') {
                const key = effectiveKey || process.env.OPENAI_API_KEY;
                if (!key) throw new Error('Missing OpenAI API Key');

                const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({
                        model: 'gpt-4o',
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

                const fullPrompt = `${systemPrompt}\n\n---\nConversation history:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${message}`;

                const apiResponse = await fetch('https://api.1min.ai/api/features', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'API-KEY': key },
                    body: JSON.stringify({
                        type: 'CHAT_WITH_AI',
                        model: 'gpt-4o-mini',
                        promptObject: { prompt: fullPrompt, isMixed: false }
                    })
                });
                if (!apiResponse.ok) throw new Error(`1min.ai: ${await apiResponse.text()}`);
                const data = await apiResponse.json();
                responseText = data.aiRecord?.aiRecordDetail?.result || data.result || '';
            } else {
                return res.status(400).json({ error: 'Invalid provider' });
            }
        } catch (providerError) {
            console.error('[SW-D6] Provider Error:', providerError);
            return res.status(500).json({ error: `Provider Error: ${providerError.message}` });
        }

        return res.status(200).json({ response: responseText });

    } catch (error) {
        console.error('[SW-D6] Main Handler Error:', error);
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}
