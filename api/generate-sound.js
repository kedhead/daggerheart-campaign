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
    console.log('1min.ai full response:', JSON.stringify(data, null, 2));

    // Extract the relative asset path from the response
    let assetPath = null;

    if (data.aiRecord?.aiRecordDetail?.resultObject?.[0]) {
      assetPath = data.aiRecord.aiRecordDetail.resultObject[0];
    } else if (data.aiRecord?.aiRecordDetail?.result) {
      const result = data.aiRecord.aiRecordDetail.result;
      assetPath = Array.isArray(result) ? result[0] : result;
    } else if (data.result) {
      assetPath = Array.isArray(data.result) ? data.result[0] : data.result;
    } else if (data.url || data.audio_url) {
      assetPath = data.url || data.audio_url;
    }

    // Check for presigned URL (temporaryUrl) - may be empty string for TEXT_TO_SOUND
    const temporaryUrl = data.aiRecord?.temporaryUrl;
    const hasTemporaryUrl = temporaryUrl && temporaryUrl.length > 10;

    // Build list of URLs to try fetching audio from (in priority order)
    // 1min.ai stores files on S3 bucket "asset.1min.ai" in us-east-1
    // The asset.1min.ai domain doesn't serve files directly (private S3 bucket)
    // Need either a presigned URL or the S3 path-style URL
    const urlsToTry = [];

    if (hasTemporaryUrl) {
      urlsToTry.push(temporaryUrl);
    }

    if (assetPath) {
      // Strip leading slash or http prefix if present
      const cleanPath = assetPath.startsWith('http')
        ? assetPath.replace(/^https?:\/\/asset\.1min\.ai\//, '')
        : assetPath.replace(/^\//, '');

      // S3 path-style URL (most reliable for server-side fetch)
      urlsToTry.push(`https://s3.us-east-1.amazonaws.com/asset.1min.ai/${cleanPath}`);
      // S3 virtual-hosted-style URL
      urlsToTry.push(`https://asset.1min.ai.s3.us-east-1.amazonaws.com/${cleanPath}`);
      // Direct asset.1min.ai URL (CNAME, may not work)
      urlsToTry.push(`https://asset.1min.ai/${cleanPath}`);
    }

    // Try the records endpoint to get a presigned URL
    // The initial response has temporaryUrl: "" but fetching the record
    // separately may return a populated presigned URL
    const recordUuid = data.aiRecord?.uuid;
    if (recordUuid && !hasTemporaryUrl) {
      // Wait briefly for S3 presigned URL generation (may be async)
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        console.log('Fetching record for presigned URL, UUID:', recordUuid);
        const recordResponse = await fetch(`https://api.1min.ai/api/records/${recordUuid}`, {
          headers: { 'API-KEY': apiKey }
        });
        console.log('Record endpoint status:', recordResponse.status);

        if (recordResponse.ok) {
          const recordData = await recordResponse.json();
          // Log the full record response to understand its structure
          console.log('Record response full:', JSON.stringify(recordData, null, 2));

          // Check temporaryUrl at various paths
          const recTempUrl = recordData.temporaryUrl
            || recordData.aiRecord?.temporaryUrl
            || recordData.data?.temporaryUrl;

          if (recTempUrl && recTempUrl.length > 10) {
            console.log('Found presigned URL from records endpoint!');
            urlsToTry.unshift(recTempUrl);
          } else {
            console.warn('Records endpoint temporaryUrl is empty/missing');
          }
        } else {
          const errText = await recordResponse.text();
          console.warn('Record endpoint error:', recordResponse.status, errText.substring(0, 200));
        }
      } catch (e) {
        console.warn('Record fetch failed:', e.message);
      }
    }

    console.log('URLs to try:', urlsToTry.map(u => u.substring(0, 80)));

    if (urlsToTry.length === 0) {
      console.error('No URLs to try for audio download');
      return res.status(500).json({
        error: 'Could not extract audio URL from API response',
        responseKeys: Object.keys(data)
      });
    }

    // The URL we'll report to the client (prefer presigned > S3 > asset.1min.ai)
    let audioUrl = urlsToTry[0];

    // Try each URL to fetch audio bytes and convert to base64
    let audioData = null;
    for (const tryUrl of urlsToTry) {
      try {
        console.log('Trying to fetch audio from:', tryUrl.substring(0, 100));
        const audioResponse = await fetch(tryUrl);
        console.log('Fetch result:', audioResponse.status, audioResponse.headers.get('content-type'));

        if (audioResponse.ok) {
          const ct = audioResponse.headers.get('content-type') || 'audio/mpeg';
          // Reject HTML/XML error pages
          if (ct.includes('html') || ct.includes('xml')) {
            console.warn('Got HTML/XML instead of audio from:', tryUrl.substring(0, 60));
            continue;
          }

          const arrayBuffer = await audioResponse.arrayBuffer();
          console.log('Downloaded bytes:', arrayBuffer.byteLength);

          if (arrayBuffer.byteLength > 100) {
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            const mimeType = ct.includes('audio') ? ct : 'audio/mpeg';
            audioData = `data:${mimeType};base64,${base64}`;
            audioUrl = tryUrl; // Use the URL that actually worked
            console.log('Audio converted to base64, size:', audioData.length);
            break;
          } else {
            console.warn('Response too small to be audio:', arrayBuffer.byteLength, 'bytes');
          }
        } else {
          console.warn('Fetch failed:', audioResponse.status, audioResponse.statusText);
        }
      } catch (fetchError) {
        console.warn('Fetch error for', tryUrl.substring(0, 60), ':', fetchError.message);
      }
    }

    if (!audioData) {
      console.warn('All audio fetch attempts failed. Returning without audioData.');
    }

    return res.status(200).json({
      audioUrl,
      audioData,
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
