/**
 * Vercel Serverless Function - AI Sound Generation
 * Uses ElevenLabs API directly for sound effect generation.
 * Falls back to 1min.ai if no ElevenLabs key is configured.
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

/**
 * Generate sound via 1min.ai (returns S3 path, may not be downloadable)
 */
async function generateVia1minAI(apiKey, prompt, duration, promptInfluence, outputFormat) {
  console.log('Generating sound via 1min.ai');

  const requestBody = {
    type: 'TEXT_TO_SOUND',
    model: 'elevenlabs-text-to-sound',
    conversationId: `sound-${Date.now()}`,
    promptObject: {
      text: prompt,
      duration_seconds: duration,
      prompt_influence: promptInfluence,
      output_format: outputFormat,
      loop: false
    }
  };

  const response = await fetch('https://api.1min.ai/api/features', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-KEY': apiKey
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`1min.ai error: ${response.status} ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();

  // Extract audio URL
  let audioUrl = null;
  if (data.aiRecord?.aiRecordDetail?.resultObject?.[0]) {
    audioUrl = data.aiRecord.aiRecordDetail.resultObject[0];
  }

  // Use temporaryUrl if available
  const temporaryUrl = data.aiRecord?.temporaryUrl;
  if (temporaryUrl && temporaryUrl.length > 10) {
    audioUrl = temporaryUrl;
  } else if (audioUrl && !audioUrl.startsWith('http')) {
    audioUrl = `https://asset.1min.ai/${audioUrl}`;
  }

  return { audioUrl, audioData: null };
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
      promptInfluence = 0.3,
      outputFormat = 'mp3_44100_128'
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

    // Try ElevenLabs direct API first (returns binary audio - no S3 issues)
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsKey) {
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
        console.error('ElevenLabs failed, falling back to 1min.ai:', elevenLabsError.message);
      }
    }

    // Fallback: 1min.ai (audio may not be downloadable due to private S3 bucket)
    const oneMinKey = process.env.min_api || process.env.MIN_API_KEY || process.env.MIN_API || process.env.ONEMIN_API_KEY;
    if (!oneMinKey) {
      return res.status(500).json({
        error: 'No API key configured for sound generation',
        hint: 'Set ELEVENLABS_API_KEY or min_api in Vercel environment variables'
      });
    }

    const result = await generateVia1minAI(
      oneMinKey, prompt, clampedDuration, promptInfluence, outputFormat
    );

    return res.status(200).json({
      audioUrl: result.audioUrl,
      audioData: result.audioData,
      prompt,
      duration: clampedDuration
    });

  } catch (error) {
    console.error('Sound generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
