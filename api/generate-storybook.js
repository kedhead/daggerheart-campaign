/**
 * Vercel Serverless Function - Storybook AI endpoint
 *
 * Combines two related calls into one function to stay within the Vercel
 * Hobby 12-function cap:
 *   - action: 'chapter'  → GPT-4o writes a storybook chapter from session notes
 *   - action: 'describe' → GPT-4o-mini vision describes an existing portrait
 */

import OpenAI from 'openai';

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action = 'chapter', apiKey: clientApiKey } = req.body || {};
  const effectiveKey = clientApiKey || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!effectiveKey) {
    return res.status(500).json({ error: 'No OpenAI API key available.' });
  }

  const openai = new OpenAI({ apiKey: effectiveKey });

  try {
    if (action === 'describe') return await describeImage(req, res, openai);
    if (action === 'chapter') return await generateChapter(req, res, openai);
    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error(`generate-storybook [${action}] error:`, err);
    return res.status(500).json({
      error: `Failed to ${action === 'describe' ? 'describe image' : 'generate storybook chapter'}`,
      message: err.message
    });
  }
}

// ── action: describe ──────────────────────────────────────────────────────────

async function describeImage(req, res, openai) {
  const { imageUrl, subjectHint } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'Missing required field: imageUrl' });

  const instruction = [
    'Describe the physical appearance of the subject in this image in 1-2 tight sentences,',
    'written as a brief for an illustrator who will redraw them in a different art style.',
    'Cover: species or ancestry, hair, eyes, skin tone, outfit, signature gear, notable features.',
    'Avoid narrative flourish, mood words, or scene details. Just the look of the subject.'
  ].join(' ');

  const userText = subjectHint ? `Subject: ${subjectHint}. ${instruction}` : instruction;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 180,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ]
  });

  const description = completion.choices[0]?.message?.content?.trim() || '';
  return res.status(200).json({ description });
}

// ── action: chapter ───────────────────────────────────────────────────────────

async function generateChapter(req, res, openai) {
  const {
    campaignContext = '',
    session = {},
    priorChapterSummaries = [],
    entityRoster = { characters: [], npcs: [], adversaries: [], locations: [] },
    sceneCount = 3,
    gameSystem = 'daggerheart'
  } = req.body;

  if (!session || !session.title) {
    return res.status(400).json({ error: 'Missing required field: session.title' });
  }

  const numScenes = Math.max(2, Math.min(4, Number(sceneCount) || 3));

  const rosterLines = [];
  const pushRoster = (label, list) => {
    if (!Array.isArray(list) || list.length === 0) return;
    rosterLines.push(`${label}:`);
    list.slice(0, 30).forEach(e => {
      const parts = [e.tag, e.ancestry].filter(Boolean);
      const tagStr = parts.length ? ` (${parts.join(', ')})` : '';
      rosterLines.push(`  - ${e.id} :: ${e.name}${tagStr}`);
    });
  };
  pushRoster('Characters', entityRoster.characters);
  pushRoster('NPCs', entityRoster.npcs);
  pushRoster('Adversaries', entityRoster.adversaries);
  pushRoster('Locations', entityRoster.locations);

  const priorBlock = Array.isArray(priorChapterSummaries) && priorChapterSummaries.length
    ? `\n## Previous chapters (most recent first)\n${priorChapterSummaries.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    : '';

  const sessionNotes = [
    session.summary ? `Summary:\n${session.summary}` : null,
    session.highlights?.length ? `Highlights:\n- ${session.highlights.join('\n- ')}` : null,
    session.dmNotes ? `DM notes:\n${session.dmNotes}` : null,
    session.liveNotesCompiled ? `Live notes:\n${session.liveNotesCompiled}` : null
  ].filter(Boolean).join('\n\n');

  const systemPrompt = `You are the chronicler of an ongoing ${gameSystem === 'starwarsd6' ? 'space opera' : 'high fantasy'} campaign. You transform a game session's notes into a captivating illustrated storybook chapter — a real, engrossing chapter of a novel, not a bullet-point recap.

VOICE AND SHAPE:
- Write in past-tense, third-person omniscient narrative voice, the kind you'd read in a printed fantasy novel. Confident, lyrical, specific.
- Show, don't tell. Give us sensory detail: the smell of rain on stone, the catch in a character's breath, the way light falls across a face.
- Let scenes breathe. Use dialogue when the notes imply it. Quote characters directly when the notes provide words; otherwise paraphrase naturally.
- Vary paragraph length — some urgent and short, others long and immersive. At least one paragraph per major beat in the notes.
- Produce **8 to 14 paragraphs** of genuine prose. A chapter, not a blurb. Never fewer than 8 unless the notes are extremely thin.

STRICT RULES:
1. Use only facts present in the session notes or campaign context. DO NOT invent major new plot points, NPCs, or locations that weren't mentioned. You MAY flesh out moments, interiority, atmosphere, and implied details.
2. Mention every named entity from the notes at least once, by name.
3. For each scene prompt, set a vivid visual composition. These prompts will be passed to an image generator; the client will concatenate a style preamble before them, so focus on subject, action, environment, lighting, and composition.
4. In each scene, list featuredEntityIds drawn ONLY from the provided entity roster (use the id field exactly as given). The client will substitute each entity's physical description into the prompt so the character's actual look is preserved.
5. Title should be evocative, 2-6 words, no quotes.
6. Return valid JSON matching the schema exactly.
7. RACE / ANCESTRY ACCURACY: Pay close attention to each character's ancestry listed in the roster (e.g. Drakona, Galapa, Katari, Fungril). When writing scene visual prompts, ALWAYS explicitly mention the character's species/ancestry and key physical traits (scales, shell, fur, hooves, etc.). Never assume characters are human unless their ancestry is explicitly "Human". This is critical for accurate illustration.`;

  const userPrompt = `# Campaign context
${campaignContext || '(no campaign context provided)'}

# Entity roster (use these ids in featuredEntityIds)
${rosterLines.join('\n') || '(none)'}

${priorBlock}

# Session to chronicle
Title: ${session.title}
${session.sessionNumber ? `Number: ${session.sessionNumber}` : ''}
${session.date ? `Date: ${session.date}` : ''}

${sessionNotes || '(no notes provided — produce a short evocative recap using only the title)'}

# Output JSON schema
{
  "title": "Chapter title",
  "prose": "Full markdown narration — 8 to 14 paragraphs of real novel-grade storytelling, separated by blank lines. Use dialogue, sensory detail, and varying paragraph length. No headings, no lists.",
  "scenes": [
    {
      "caption": "Short caption shown under the image (one sentence).",
      "prompt": "Visual prompt: subject, action, setting, lighting, composition. 1-2 sentences.",
      "featuredEntityIds": ["id1", "id2"]
    }
    // ... ${numScenes} scenes total
  ],
  "spotlights": [
    {
      "entityId": "id-from-roster",
      "entityType": "character|npc|adversary",
      "moment": "One-sentence highlight of what they did this session."
    }
    // up to 4
  ]
}

Produce exactly ${numScenes} scenes. Return ONLY the JSON object.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.85,
    max_tokens: 4000,          // room for a ~12-paragraph chapter + scenes + spotlights JSON
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('Storybook JSON parse error:', e, raw);
    return res.status(502).json({ error: 'Model returned invalid JSON', raw });
  }

  if (!parsed.title || !parsed.prose || !Array.isArray(parsed.scenes)) {
    return res.status(502).json({ error: 'Model response missing required fields', parsed });
  }

  return res.status(200).json({
    title: parsed.title,
    prose: parsed.prose,
    scenes: parsed.scenes.slice(0, 4).map(s => ({
      caption: s.caption || '',
      prompt: s.prompt || '',
      featuredEntityIds: Array.isArray(s.featuredEntityIds) ? s.featuredEntityIds.filter(Boolean) : []
    })),
    spotlights: Array.isArray(parsed.spotlights)
      ? parsed.spotlights.slice(0, 4).map(s => ({
          entityId: s.entityId || '',
          entityType: s.entityType || 'npc',
          moment: s.moment || ''
        }))
      : [],
    model: 'gpt-4o'
  });
}
