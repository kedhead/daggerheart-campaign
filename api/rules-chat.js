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

// ── GM session planner mode ───────────────────────────────────────────
function buildGMPlannerSystemPrompt(cfg, campaignSection, contextText) {
  return `${cfg.systemPromptIntro}

You are now operating as a **GM Session Planner**. The user is the GM. They will describe a session at a high level (location, number of encounters, party size/level, themes, mix of combat/puzzle/social, time budget) and you will return a **single JSON session plan** that the GM can review, refine, and approve.

${campaignSection}=== RELEVANT RULES REFERENCE ===
${contextText}
=== END RULES ===

OUTPUT FORMAT — return ONLY one fenced JSON code block, with no prose before or after, matching exactly this shape:

\`\`\`json
{
  "sessionTitle": "string",
  "estimatedDurationHours": number,
  "partyLevel": number,
  "partySize": number,
  "primaryLocation": "string",
  "pacingOutline": ["Hook: ...", "Rising: ...", "Climax: ...", "Resolution: ..."],
  "encounters": [
    {
      "name": "string",
      "type": "combat" | "puzzle" | "social" | "exploration",
      "summary": "2-3 sentences setting the scene and stakes",
      "estimatedMinutes": number,
      "adversariesNeeded": [
        { "concept": "vivid one-sentence creature concept", "tier": 1|2|3|4, "role": "minion|horde|standard|bruiser|skulk|ranged|support|social|leader|solo|boss", "quantity": number, "reuseExistingName": "exact name from the campaign's Adversaries list when reusing an existing stat block, otherwise null" }
      ],
      "puzzleSpec": null | { "premise": "string", "mechanism": "what the players must do", "solution": "intended solution + a hint", "failureState": "what happens if they fail" },
      "environment": "string (matches a campaign environment if available)",
      "bpEstimate": number
    }
  ],
  "newNPCs":      [{ "name": "string", "occupation": "string", "blurb": "1-2 sentences" }],
  "newLocations": [{ "name": "string", "type": "city|town|village|dungeon|wilderness|landmark|other", "blurb": "1-2 sentences" }],
  "events":       [{ "title": "string", "trigger": "what triggers this event in-session", "outcome": "consequence" }],
  "mapsRequested":[{ "label": "string", "kind": "battle" | "location" }],
  "gmNotes": "Markdown-formatted notes the GM can paste into their session log: hooks, secrets, pacing tips, key NPC voices, contingencies."
}
\`\`\`

DESIGN RULES:
- NAMED ENEMIES ARE MANDATORY: If the GM names a specific character, NPC, or adversary as the enemy of an encounter (e.g. "a fight against Matu Palu"), you MUST build that encounter around that exact entity — NEVER substitute a random or renamed creature.
  • If that name appears in the campaign's **Adversaries** list, set "reuseExistingName" to its exact name (copy it verbatim) and keep the same tier/role as the listed adversary.
  • If that name appears only as an **NPC**, **Character**, or in **Lore** (no matching adversary yet), create ONE new adversary whose "concept" BEGINS with that exact name and portrays that character (e.g. "Matu Palu, the tide-witch who ..."), set "reuseExistingName" to null, and choose role "boss" for a climactic named villain (or "solo"/"leader" if that fits better). Do not rename them.
- Use existing campaign NPCs, locations, and adversaries when they fit. Set "reuseExistingName" to the exact name from the campaign's Adversaries list to avoid spawning duplicates. Only invent new ones when there's no good fit.
- Role "boss" is for a single climactic multi-phase antagonist (very high durability, phase transitions). Use it for the centerpiece villain of a session finale; use "solo" for a strong single enemy that doesn't need phases.
- Daggerheart Battle Points budget per encounter = (3 × partySize) + 2. Costs: 1 BP per group of minions equal to party size; social/support=1 each; horde/ranged/skulk/standard=2 each; leader=3; bruiser=4; solo=5; boss=8. Encounter-by-encounter the bpEstimate must respect this budget (a boss fight is expected to spend most or all of it).
- Match adversary tier to the party's tier of play: level 1 → tier 1, levels 2–4 → tier 2, levels 5–7 → tier 3, levels 8–10 → tier 4. Never pick adversaries more than one tier away from the party's tier.
- Honor the GM's requested counts and types (e.g., "2 puzzle encounters" → exactly 2 entries with type:"puzzle" and a non-null puzzleSpec).
- Estimate encounter minutes so the SUM of estimatedMinutes is close to estimatedDurationHours × 60.
- gmNotes must be a single Markdown string. No code blocks inside it.
- Ground every encounter / NPC / location in the campaign's themes. Reference named places, factions, and lore from the campaign context above.
- mapsRequested is OPTIONAL and limited — only include the 1-3 most useful maps for the session. The GM will opt in per map.

If the GM's prior message already approved a plan and now asks for a refinement, return a NEW complete plan reflecting the change — never partial. Always one fenced JSON block, nothing else.
`;
}

// ── Session note summarizer mode ────────────────────────────────────────
function buildSummarizerSystemPrompt(cfg, campaignSection) {
  return `${cfg.systemPromptIntro}

You are now operating as a **Session Note Summarizer**. The user (the GM) will provide raw session notes (live notes, highlights, and/or DM notes) taken during actual play. Turn them into a polished, readable narrative summary suitable for a campaign session log.

${campaignSection}
CRITICAL ANTI-HALLUCINATION RULES:
1. ONLY use information explicitly present in the provided notes. Do NOT invent, add, or embellish any event, NPC, location, item, or outcome that is not stated or clearly implied by the notes.
2. You MAY use the campaign context above ONLY to get proper names, spellings, and pronouns right (e.g. if notes say "the blacksmith" and the campaign context identifies exactly one blacksmith NPC, you may name them) — NOT to add new plot content.
3. If the notes are sparse or fragmentary, write a short summary reflecting that sparseness. Do not pad it out with invented detail to make it feel complete.
4. Preserve the actual sequence of events as given; do not reorder for dramatic effect if it changes what happened.
5. Write in past tense, third person, 2-5 paragraphs depending on note volume. No headers, no bullet lists — prose only, ready to paste into a "Session Summary" field.

Return ONLY the summary prose. No commentary, no markdown headers, no code fences.`;
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
      apiKey: rawApiKey,
      provider = 'anthropic',
      campaignContext = '',
      gameSystem = 'daggerheart',
      mode = 'chat',
    } = req.body;
    // '__shared__' = client sentinel for "use the server's shared key"
    const apiKey = rawApiKey === '__shared__' ? null : rawApiKey;

    if (!message) return res.status(400).json({ error: 'Missing required field: message' });

    const cfg = SYSTEMS[gameSystem] || SYSTEMS.daggerheart;

    // 1. Retrieve relevant rules context.
    //    For GM session-planning, bias retrieval toward encounter/adversary/pacing material.
    //    Summarize mode skips retrieval entirely — rules lookup is irrelevant to it.
    const retrievalQuery = mode === 'gm-plan'
      ? `${message}\nencounter design adversary tier role battle points pacing puzzle session structure environment`
      : message;
    const contextText = mode === 'summarize' ? '' : await retrieveContext(gameSystem, retrievalQuery, apiKey);

    // 2. Build system prompt
    const campaignSection = campaignContext
      ? `=== YOUR CAMPAIGN ===\n${campaignContext}\n=== END CAMPAIGN ===\n\n`
      : '';

    const systemPrompt = mode === 'gm-plan'
      ? buildGMPlannerSystemPrompt(cfg, campaignSection, contextText)
      : mode === 'summarize'
      ? buildSummarizerSystemPrompt(cfg, campaignSection)
      : `${cfg.systemPromptIntro}
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
