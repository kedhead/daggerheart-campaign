import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Per-system configuration ──────────────────────────────────────────
const SYSTEMS = {
  daggerheart: {
    rulesFile: 'daggerheart-embeddings.json',
    useEmbeddings: true,
    logPrefix: '[DH]',
    systemPromptIntro:
      'You are an AI Game Master assistant for the tabletop roleplaying game "Daggerheart".',
    campaignIntro:
      'You have full knowledge of the campaign described below and can answer questions about its NPCs, locations, adversaries, lore, and recent events. When the user asks about something in the campaign, draw on that knowledge directly. When giving rules advice, tie it to the specific campaign context where relevant.',
    noCampaignIntro:
      'You are a helpful rules assistant. Answer questions about Daggerheart mechanics, character creation, and gameplay.',
    tone: 'Tone: Helpful, encouraging, and thematic. Be concise — answer the question asked, don\'t pad with unnecessary caveats.',
    keyReminders: '',
  },
  starwarsd6: {
    rulesFile: 'starwarsd6-rules.json',
    useEmbeddings: false,
    logPrefix: '[SW-D6]',
    systemPromptIntro:
      'You are an AI Game Master assistant for the "Star Wars: The Roleplaying Game" (the West End Games D6 system, 2nd Edition Revised & Expanded).',
    campaignIntro:
      'You have full knowledge of the campaign described below and can answer questions about its characters, NPCs, locations, adversaries, lore, and recent events. When the user asks about something in the campaign, draw on that knowledge directly. When giving rules advice, tie it to the specific campaign context where relevant.',
    noCampaignIntro:
      'You are a helpful rules assistant. Answer questions about Star Wars D6 mechanics, character creation, the Force, combat, starships, and gameplay.',
    tone: 'Tone: Knowledgeable and enthusiastic, like a veteran Star Wars GM who loves this classic system. Be concise — answer the question asked, don\'t pad with unnecessary caveats. Use Star Wars flavor when appropriate ("May the Force be with you", referencing iconic scenes as examples).',
    keyReminders: `Key reminders:
- This is the West End Games D6 system, NOT Fantasy Flight Games or D20
- Dice pools use D6s only — no other die types
- The Wild Die is central to the experience
- The Force has three skills: Control, Sense, Alter
- Character Points and Force Points are different resources
- Scale differences matter in vehicle/starship combat`,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function scoreChunk(chunk, queryWords) {
  const combined = `${chunk.title} ${chunk.text}`.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    if (word.length < 3) continue;
    const regex = new RegExp(word, 'gi');
    const matches = combined.match(regex);
    if (matches) score += matches.length;
  }
  const titleLower = chunk.title.toLowerCase();
  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (titleLower.includes(word)) score += 10;
  }
  return score;
}

// Cached stores keyed by system name
const storeCache = {};

function loadStore(systemKey) {
  if (storeCache[systemKey]) return storeCache[systemKey];
  const cfg = SYSTEMS[systemKey];
  if (!cfg) return null;

  try {
    const paths = [
      path.join(process.cwd(), 'api', cfg.rulesFile),
      path.join(__dirname, cfg.rulesFile),
      path.join(process.cwd(), cfg.rulesFile),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        console.log(`${cfg.logPrefix} Loading rules from: ${p}`);
        const data = fs.readFileSync(p, 'utf8');
        storeCache[systemKey] = JSON.parse(data);
        return storeCache[systemKey];
      }
    }
    console.warn(`${cfg.logPrefix} Rules file not found.`);
  } catch (err) {
    console.error(`${cfg.logPrefix} Error loading rules:`, err);
  }
  return null;
}

// ── Retrieval: embeddings (Daggerheart) or keyword scoring (SW-D6) ──
async function retrieveContext(systemKey, message, apiKey) {
  const cfg = SYSTEMS[systemKey];
  const store = loadStore(systemKey);

  if (cfg.useEmbeddings) {
    // Embedding-based RAG (requires OpenAI key)
    const isOpenAIKey = apiKey?.startsWith('sk-') && !apiKey?.startsWith('sk-ant-');
    const embeddingKey = process.env.OPENAI_API_KEY || (isOpenAIKey ? apiKey : null);

    if (embeddingKey && store) {
      try {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${embeddingKey}` },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: message }),
        });
        if (!embeddingResponse.ok) throw new Error(await embeddingResponse.text());
        const embData = await embeddingResponse.json();
        const queryVector = embData.data[0].embedding;

        const scored = store.embeddings.map((c) => ({ ...c, score: cosineSimilarity(queryVector, c.vector) }));
        const top = scored.sort((a, b) => b.score - a.score).slice(0, 7);
        console.log(`${cfg.logPrefix} RAG: Found ${top.length} relevant chunks.`);
        return top.map((c) => c.text).join('\n\n---\n\n');
      } catch (err) {
        console.error(`${cfg.logPrefix} RAG Error:`, err.message);
        return 'Error retrieving rules context. Please rely on general knowledge.';
      }
    }
    return 'Rules context unavailable (system configuration missing).';
  }

  // Keyword-based scoring (Star Wars D6)
  if (store && store.chunks) {
    const queryWords = message.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
    const scored = store.chunks.map((c) => ({ ...c, score: scoreChunk(c, queryWords) }));
    const topChunks = scored.sort((a, b) => b.score - a.score).slice(0, 8);

    const coreChunk = store.chunks.find((c) => c.id === 0);
    if (coreChunk && !topChunks.find((c) => c.id === 0)) {
      topChunks.pop();
      topChunks.push(coreChunk);
    }

    console.log(`${cfg.logPrefix} Matched ${topChunks.length} chunks for: "${message.substring(0, 50)}..."`);
    return topChunks.map((c) => `### ${c.title}\n${c.text}`).join('\n\n---\n\n');
  }

  return 'Rules reference not loaded. Rely on general knowledge.';
}

// ── Main handler ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      message,
      history = [],
      apiKey,
      provider = 'anthropic',
      campaignContext = '',
      gameSystem = 'daggerheart',
    } = req.body;

    if (!message) return res.status(400).json({ error: 'Missing required field: message' });

    const cfg = SYSTEMS[gameSystem] || SYSTEMS.daggerheart;

    // 1. Retrieve relevant rules context
    const contextText = await retrieveContext(gameSystem, message, apiKey);

    // 2. Build system prompt
    const campaignSection = campaignContext
      ? `=== YOUR CAMPAIGN ===\n${campaignContext}\n=== END CAMPAIGN ===\n\n`
      : '';

    const systemPrompt = `${cfg.systemPromptIntro}
${campaignContext ? cfg.campaignIntro : cfg.noCampaignIntro}

${cfg.tone}

${cfg.keyReminders}

${campaignSection}=== RELEVANT RULES REFERENCE ===
${contextText}
=== END RULES ===
`;

    // 3. Resolve API key / provider
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
          error: 'No API keys available. Please configure an API key in Settings, or contact the administrator.',
        });
      }
    }

    // 4. Call LLM
    let responseText = '';

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
              ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
              { role: 'user', content: message },
            ],
          }),
        });
        if (!apiResponse.ok) throw new Error(`Anthropic: ${await apiResponse.text()}`);
        const data = await apiResponse.json();
        responseText = data.content[0]?.text || '';

      } else if (effectiveProvider === 'openai') {
        const key = effectiveKey || process.env.OPENAI_API_KEY;
        if (!key) throw new Error('Missing OpenAI API Key');

        const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }],
            max_tokens: 4096,
          }),
        });
        if (!apiResponse.ok) throw new Error(`OpenAI: ${await apiResponse.text()}`);
        const data = await apiResponse.json();
        responseText = data.choices[0]?.message?.content || '';

      } else if (effectiveProvider === '1min') {
        const key = effectiveKey || process.env.min_api || process.env.MIN_API_KEY;
        if (!key) throw new Error('Missing 1min.ai API Key');

        const fullPrompt = `${systemPrompt}\n\n---\nConversation history:\n${history.map((m) => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${message}`;

        const apiResponse = await fetch('https://api.1min.ai/api/features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'API-KEY': key },
          body: JSON.stringify({
            type: 'CHAT_WITH_AI',
            model: 'gpt-4o-mini',
            promptObject: { prompt: fullPrompt, isMixed: false },
          }),
        });
        if (!apiResponse.ok) throw new Error(`1min.ai: ${await apiResponse.text()}`);
        const data = await apiResponse.json();
        responseText = data.aiRecord?.aiRecordDetail?.result || data.result || '';

      } else {
        return res.status(400).json({ error: 'Invalid provider' });
      }
    } catch (providerError) {
      console.error(`${cfg.logPrefix} Provider Error:`, providerError);
      return res.status(500).json({ error: `Provider Error: ${providerError.message}` });
    }

    return res.status(200).json({ response: responseText });

  } catch (error) {
    console.error('Rules-chat handler error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
