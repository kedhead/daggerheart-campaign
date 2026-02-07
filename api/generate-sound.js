/**
 * Vercel Serverless Function - AI Sound Generation
 * Uses 1min.ai API (ElevenLabs) for sound effect generation
 */

export const config = {
  maxDuration: 60
};

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

    // Get API key from environment
    const apiKey = process.env.min_api || process.env.MIN_API_KEY || process.env.MIN_API || process.env.ONEMIN_API_KEY;

    if (!apiKey) {
      console.error('No API key found for sound generation');
      return res.status(500).json({
        error: 'Sound generation API not configured',
        hint: 'Set min_api environment variable in Vercel'
      });
    }

    console.log('Generating sound with 1min.ai:', {
      promptPreview: prompt.substring(0, 50) + '...',
      duration,
      promptInfluence,
      outputFormat
    });

    const requestBody = {
      type: 'TEXT_TO_SOUND',
      model: 'elevenlabs-text-to-sound',
      conversationId: `sound-${Date.now()}`,
      promptObject: {
        text: prompt,
        duration_seconds: Math.min(Math.max(duration, 0.5), 30), // Clamp between 0.5-30
        prompt_influence: promptInfluence,
        output_format: outputFormat,
        loop: false
      }
    };

    console.log('1min.ai sound request:', JSON.stringify(requestBody));

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
      console.error('1min.ai sound API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      let errorMessage = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || response.statusText;
      } catch (e) {
        // Keep as text
      }

      return res.status(response.status).json({
        error: `Sound generation failed: ${errorMessage}`,
        status: response.status
      });
    }

    const data = await response.json();
    console.log('1min.ai sound response keys:', Object.keys(data));

    // Extract audio URL from response
    let audioUrl = null;

    // Check various response formats
    if (data.aiRecord?.aiRecordDetail?.resultObject?.[0]) {
      audioUrl = data.aiRecord.aiRecordDetail.resultObject[0];
    } else if (data.aiRecord?.aiRecordDetail?.result) {
      const result = data.aiRecord.aiRecordDetail.result;
      if (Array.isArray(result)) {
        audioUrl = result[0];
      } else if (typeof result === 'string') {
        audioUrl = result;
      }
    } else if (data.result) {
      audioUrl = Array.isArray(data.result) ? data.result[0] : data.result;
    } else if (data.url || data.audio_url) {
      audioUrl = data.url || data.audio_url;
    }

    // Handle relative URLs
    if (audioUrl && !audioUrl.startsWith('http')) {
      // Check for temporaryUrl base
      if (data.aiRecord?.temporaryUrl) {
        const baseUrl = data.aiRecord.temporaryUrl;
        if (baseUrl.startsWith('http')) {
          const baseMatch = baseUrl.match(/^(https?:\/\/[^?]+\/)/);
          if (baseMatch) {
            audioUrl = baseMatch[1] + audioUrl;
          }
        }
      } else {
        // Fallback to 1min.ai asset CDN
        audioUrl = `https://asset.1min.ai/${audioUrl}`;
      }
    }

    if (!audioUrl) {
      console.error('Could not find audio URL in response:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Could not extract audio URL from API response',
        responseKeys: Object.keys(data)
      });
    }

    console.log('Generated audio URL:', audioUrl);

    return res.status(200).json({
      audioUrl,
      prompt,
      duration
    });

  } catch (error) {
    console.error('Sound generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
