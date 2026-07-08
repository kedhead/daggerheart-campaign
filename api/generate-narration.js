/**
 * Vercel Serverless Function - AI Voice Narration (text-to-speech)
 * Used by the Storybook "Motion Comic" recap to narrate chapter slides.
 * Primary: ElevenLabs TTS. Fallback: OpenAI TTS. Keys come from server env;
 * the '__shared__' sentinel (or an empty key) from clients means "use env".
 */

export const config = {
  maxDuration: 60
};

// Default narrator: ElevenLabs "Callum" — a weathered, raspy character voice
// that reads like an old wizard recounting the tale. The player offers other
// presets (see NARRATOR_VOICES in CinematicPlayer.jsx) via the voiceId param.
const DEFAULT_ELEVENLABS_VOICE = 'N2lVS1w4EtoT3dr4eOWO';

// Delivery direction for the OpenAI fallback (gpt-4o-mini-tts `instructions`).
const DEFAULT_STYLE =
  'Speak as a wise, ancient wizard telling an epic tale by firelight: unhurried, warm and gravelly, with gentle dramatic pauses and quiet wonder.';

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

// OpenAI TTS voices we allow the client to pick for the fallback, so narrator
// presets still change the actual voice when ElevenLabs is unavailable.
const OPENAI_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse'];

async function narrateViaOpenAI(apiKey, text, style, fallbackVoice) {
  const voice = OPENAI_VOICES.includes(fallbackVoice) ? fallbackVoice : 'ash';
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      instructions: (style || DEFAULT_STYLE).slice(0, 400),
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
    const { text, voiceId, style, fallbackVoice, apiKey: rawClientKey } = req.body || {};
    // '__shared__' = client sentinel for "use the server's shared key"
    const clientKey = rawClientKey === '__shared__' ? null : rawClientKey;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }
    // Keep requests slide-sized; the client chunks per slide anyway.
    const trimmed = text.trim().slice(0, 2500);

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const openaiKey = clientKey || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    let fallbackReason = null;
    if (elevenKey) {
      try {
        const audio = await narrateViaElevenLabs(elevenKey, trimmed, voiceId);
        return res.status(200).json({ audio, provider: 'elevenlabs' });
      } catch (err) {
        console.error('ElevenLabs narration failed:', err.message);
        // A voice-specific rejection shouldn't lose the provider — retry once
        // with the known-good default voice before falling back to OpenAI.
        if (voiceId && voiceId !== DEFAULT_ELEVENLABS_VOICE && /voice/i.test(err.message)) {
          try {
            const audio = await narrateViaElevenLabs(elevenKey, trimmed, DEFAULT_ELEVENLABS_VOICE);
            return res.status(200).json({ audio, provider: 'elevenlabs', voiceFallback: true });
          } catch (retryErr) {
            console.error('ElevenLabs default-voice retry failed:', retryErr.message);
          }
        }
        fallbackReason = err.message.slice(0, 200);
        if (!openaiKey) throw err;
      }
    } else {
      fallbackReason = 'ELEVENLABS_API_KEY is not set on the server';
    }

    if (openaiKey) {
      const audio = await narrateViaOpenAI(openaiKey, trimmed, style, fallbackVoice);
      return res.status(200).json({ audio, provider: 'openai', fallbackReason });
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
