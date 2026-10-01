/**
 * Vercel Serverless Function - AI Sound Generation
 * Uses ElevenLabs API directly for sound effect generation.
 */

export const config = {
  maxDuration: 60
};

/**
 * Generate sound via ElevenLabs directly (returns binary audio)
 */
async function generateViaElevenLabs(apiKey, prompt, duration, promptInfluence) {
  console.log('Generating sound via ElevenLabs direct API');

  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: duration,
      prompt_influence: promptInfluence
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error:', response.status, errorText.substring(0, 200));
    throw new Error(`ElevenLabs API error: ${response.status} ${errorText.substring(0, 100)}`);
  }

  // ElevenLabs returns binary audio directly
  const arrayBuffer = await response.arrayBuffer();
  console.log('ElevenLabs returned audio bytes:', arrayBuffer.byteLength);

  if (arrayBuffer.byteLength < 100) {
    throw new Error('ElevenLabs returned too little data');
  }

  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
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
    const {
      prompt,
      duration = 5,
      promptInfluence = 0.3
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    const clampedDuration = Math.min(Math.max(duration, 0.5), 30);

    console.log('Sound generation request:', {
      promptPreview: prompt.substring(0, 50) + '...',
      duration: clampedDuration,
      promptInfluence
    });

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      return res.status(500).json({
        error: 'Sound generation is not configured: ELEVENLABS_API_KEY is not set on the server.'
      });
    }

    try {
      const audioData = await generateViaElevenLabs(
        elevenLabsKey, prompt, clampedDuration, promptInfluence
      );
      console.log('ElevenLabs success, base64 size:', audioData.length);
      return res.status(200).json({
        audioUrl: null,
        audioData,
        prompt,
        duration: clampedDuration
      });
    } catch (elevenLabsError) {
      // There used to be a 1min.ai fallback here. Its key leaked and was
      // revoked, and its audio often couldn't be downloaded anyway.
      console.error('ElevenLabs failed:', elevenLabsError.message);
      return res.status(502).json({ error: `Sound generation failed: ${elevenLabsError.message}` });
    }

  } catch (error) {
    console.error('Sound generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
