/**
 * Vercel Serverless Function — Demiplane PDF Character Import
 * Extracts text from a base64-encoded PDF and uses Claude to parse it
 * into a structured Daggerheart character JSON.
 */

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'pdfBase64 is required' });

    // 1. Decode base64 and extract text with pdf-parse
    const pdfLib = require('pdf-parse');
    const PDFParse = pdfLib.PDFParse;
    const buffer = Buffer.from(pdfBase64, 'base64');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    // Cap text to avoid exceeding Claude's context
    const rawText = result.text.substring(0, 8000);

    if (!rawText.trim()) {
      return res.status(422).json({ error: 'Could not extract text from PDF. Make sure you exported a Demiplane character sheet PDF.' });
    }

    // 2. Call Claude to parse the text into our schema
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    }

    const prompt = `You are parsing a Daggerheart character sheet exported from Demiplane as a PDF.
Extract all available character data and return ONLY a valid JSON object matching the schema below.
Use empty strings, 0, or empty arrays for any field you cannot find — do NOT omit fields.
Trait values are integers typically between -2 and +3.

JSON schema to return:
{
  "name": "",
  "playerName": "",
  "class": "",
  "subclass": "",
  "level": 1,
  "ancestry": "",
  "community": "",
  "traits": {
    "agility": 0,
    "strength": 0,
    "finesse": 0,
    "instinct": 0,
    "presence": 0,
    "knowledge": 0
  },
  "evasion": 10,
  "armor": 0,
  "primaryDomain": "",
  "secondaryDomain": "",
  "domainCards": [],
  "primaryWeapon": "",
  "secondaryWeapon": "",
  "equippedArmor": "",
  "gold": 0,
  "inventory": "",
  "experiences": [],
  "backstory": "",
  "playerNotes": ""
}

Rules:
- "class" must be exactly one of: Bard, Druid, Guardian, Ranger, Rogue, Seraph, Sorcerer, Warrior, Wizard
- "domainCards" is an array of card name strings (e.g. ["Arcane Shield", "Fireball"])
- "experiences" is an array of short strings describing the character's experiences
- Return ONLY the JSON object — no markdown code fences, no explanation, no other text

CHARACTER SHEET TEXT:
${rawText}`;

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!apiResponse.ok) {
      const err = await apiResponse.json().catch(() => ({}));
      return res.status(502).json({ error: `Claude API error: ${err.error?.message || apiResponse.statusText}` });
    }

    const aiData = await apiResponse.json();
    const rawJson = aiData.content?.[0]?.text?.trim();

    if (!rawJson) {
      return res.status(502).json({ error: 'Claude returned an empty response.' });
    }

    // Strip markdown fences if Claude added them despite instructions
    const cleaned = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const character = JSON.parse(cleaned);

    return res.status(200).json({ character });

  } catch (err) {
    console.error('parse-character-pdf error:', err);
    if (err instanceof SyntaxError) {
      return res.status(422).json({ error: 'Failed to parse Claude response as JSON. Try again.' });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
