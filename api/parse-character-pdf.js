/**
 * Vercel Serverless Function — Demiplane Character Screenshot Import
 * Accepts a base64-encoded screenshot of a Demiplane character sheet,
 * sends it to Claude Vision, and returns structured Daggerheart character JSON.
 */

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '16mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const effectiveMediaType = mediaType || 'image/png';
    const isPdf = effectiveMediaType === 'application/pdf';

    const prompt = `You are reading a Daggerheart TTRPG character sheet from Demiplane.
Extract all character data and return ONLY a valid JSON object matching the schema below.
Use empty strings, 0, or empty arrays for any field you cannot find — do NOT guess.
Trait values are integers typically between -2 and +3. Look carefully at each trait value shown.

Valid classes: Bard, Druid, Guardian, Ranger, Rogue, Seraph, Sorcerer, Warrior, Wizard
Valid domains: Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor

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

Return ONLY the JSON object — no markdown fences, no explanation.`;

    // PDFs use the document content block; images use the image content block
    const fileContentBlock = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } }
      : { type: 'image', source: { type: 'base64', media_type: effectiveMediaType, data: base64Data } };

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
        messages: [
          {
            role: 'user',
            content: [
              fileContentBlock,
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
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

    // Strip markdown fences if Claude added them
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
