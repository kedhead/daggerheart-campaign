/**
 * Vercel Serverless Function - AI Voice Narration (text-to-speech)
 * Used by the Storybook "Motion Comic" recap to narrate chapter slides.
 * Primary: ElevenLabs TTS. Fallback: OpenAI TTS. Keys come from server env;
 * the '__shared__' sentinel (or an empty key) from clients means "use env".
 */

export const config = {
  maxDuration: 60
};

// A warm, storyteller-style default voice (ElevenLabs "George").
const DEFAULT_ELEVENLABS_VOICE = 'JBFqnCBsd6RMkjVDRZzb';

async function narrateViaElevenLabs(apiKey, text, voiceId) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || DEFAULT_ELEVENLABS_VOICE}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.7, style: 0.35 }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS error: ${response.status} ${errorText.substring(0, 120)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength < 100) throw new Error('ElevenLabs returned too little audio data');
  return `data:audio/mpeg;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
}

async function narrateViaOpenAI(apiKey, text) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'onyx',
      input: text,
      response_format: 'mp3'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS error: ${response.status} ${errorText.substring(0, 120)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength < 100) throw new Error('OpenAI returned too little audio data');
  return `data:audio/mpeg;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, voiceId, apiKey: rawClientKey } = req.body || {};
    // '__shared__' = client sentinel for "use the server's shared key"
    const clientKey = rawClientKey === '__shared__' ? null : rawClientKey;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }
    // Keep requests slide-sized; the client chunks per slide anyway.
    const trimmed = text.trim().slice(0, 2500);

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const openaiKey = clientKey || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    if (elevenKey) {
      try {
        const audio = await narrateViaElevenLabs(elevenKey, trimmed, voiceId);
        return res.status(200).json({ audio, provider: 'elevenlabs' });
      } catch (err) {
        console.error('ElevenLabs narration failed, trying OpenAI:', err.message);
        if (!openaiKey) throw err;
      }
    }

    if (openaiKey) {
      const audio = await narrateViaOpenAI(openaiKey, trimmed);
      return res.status(200).json({ audio, provider: 'openai' });
    }

    return res.status(500).json({
      error: 'No narration provider available.',
      hint: 'Set ELEVENLABS_API_KEY or OPENAI_API_KEY in Vercel environment variables.'
    });
  } catch (err) {
    console.error('generate-narration error:', err);
    return res.status(500).json({ error: err.message || 'Narration generation failed' });
  }
}
