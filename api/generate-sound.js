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

    // Extract audio URL from response - need a presigned S3 URL to access the file
    let audioUrl = null;
    let relativeAssetPath = null;

    // Check various response formats for the asset path
    if (data.aiRecord?.aiRecordDetail?.resultObject?.[0]) {
      relativeAssetPath = data.aiRecord.aiRecordDetail.resultObject[0];
    } else if (data.aiRecord?.aiRecordDetail?.result) {
      const result = data.aiRecord.aiRecordDetail.result;
      if (Array.isArray(result)) {
        relativeAssetPath = result[0];
      } else if (typeof result === 'string') {
        relativeAssetPath = result;
      }
    } else if (data.result) {
      relativeAssetPath = Array.isArray(data.result) ? data.result[0] : data.result;
    } else if (data.url || data.audio_url) {
      relativeAssetPath = data.url || data.audio_url;
    }

    // Search for a presigned/signed URL anywhere in the response
    // The 1min.ai API stores files on S3 at s3.us-east-1.amazonaws.com/asset.1min.ai
    // and provides presigned URLs via temporaryUrl or other fields
    function findSignedUrl(obj, depth = 0) {
      if (depth > 5 || !obj) return null;
      if (typeof obj === 'string') {
        // Look for S3 presigned URLs or any signed URL with auth params
        if (obj.includes('X-Amz-') || obj.includes('s3.') || obj.includes('amazonaws.com')) {
          return obj;
        }
        // Also check for temporaryUrl-style signed URLs
        if (obj.startsWith('http') && obj.includes('?') && obj.length > 200) {
          return obj;
        }
      }
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const found = findSignedUrl(item, depth + 1);
          if (found) return found;
        }
      }
      if (typeof obj === 'object') {
        // Check known fields first
        for (const key of ['temporaryUrl', 'signedUrl', 'downloadUrl', 'presignedUrl', 'url']) {
          if (obj[key] && typeof obj[key] === 'string' && obj[key].startsWith('http')) {
            // Prefer presigned URLs over plain URLs
            if (obj[key].includes('X-Amz-') || obj[key].includes('amazonaws.com')) {
              return obj[key];
            }
          }
        }
        // Then search all values
        for (const val of Object.values(obj)) {
          const found = findSignedUrl(val, depth + 1);
          if (found) return found;
        }
      }
      return null;
    }

    // First try to find a presigned S3 URL in the response
    const signedUrl = findSignedUrl(data);
    if (signedUrl) {
      audioUrl = signedUrl;
      console.log('Found presigned URL in response');
    } else if (data.aiRecord?.temporaryUrl) {
      audioUrl = data.aiRecord.temporaryUrl;
      console.log('Using temporaryUrl from response');
    } else if (relativeAssetPath && relativeAssetPath.startsWith('http')) {
      audioUrl = relativeAssetPath;
    } else if (relativeAssetPath) {
      audioUrl = `https://asset.1min.ai/${relativeAssetPath}`;
    }

    if (!audioUrl) {
      console.error('Could not find audio URL in response:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Could not extract audio URL from API response',
        responseKeys: Object.keys(data)
      });
    }

    console.log('Resolved audio URL:', audioUrl.substring(0, 120));

    // Fetch audio bytes and convert to base64 data URL
    // This is critical because asset.1min.ai URLs require presigned access
    let audioData = null;
    const urlsToTry = [audioUrl];

    // If we got an asset.1min.ai URL (not presigned), also try the S3 direct path
    // In case we missed the presigned URL, try fetching from the API's record endpoint
    if (relativeAssetPath && audioUrl.includes('asset.1min.ai') && !audioUrl.includes('X-Amz-')) {
      // The file is on S3 but we don't have a presigned URL - try fetching the record
      // to get a download link
      try {
        console.log('No presigned URL found, fetching record for download link...');
        const recordId = data.aiRecord?.id || data.aiRecord?.aiRecordDetail?.id;
        if (recordId) {
          const recordResponse = await fetch(`https://api.1min.ai/api/records/${recordId}`, {
            headers: { 'API-KEY': apiKey }
          });
          if (recordResponse.ok) {
            const recordData = await recordResponse.json();
            console.log('Record response keys:', JSON.stringify(Object.keys(recordData)));
            const recordSignedUrl = findSignedUrl(recordData);
            if (recordSignedUrl) {
              console.log('Found presigned URL from record endpoint');
              urlsToTry.unshift(recordSignedUrl);
              audioUrl = recordSignedUrl; // Use this as the primary URL
            }
          }
        }
      } catch (e) {
        console.warn('Record fetch attempt failed:', e.message);
      }
    }

    for (const tryUrl of urlsToTry) {
      try {
        console.log('Fetching audio from:', tryUrl.substring(0, 100));
        const audioResponse = await fetch(tryUrl);

        if (audioResponse.ok) {
          const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
          if (!contentType.includes('html') && !contentType.includes('xml')) {
            const arrayBuffer = await audioResponse.arrayBuffer();
            if (arrayBuffer.byteLength > 100) { // Sanity check - real audio > 100 bytes
              const buffer = Buffer.from(arrayBuffer);
              const base64 = buffer.toString('base64');
              audioData = `data:${contentType};base64,${base64}`;
              console.log('Audio converted to base64, size:', audioData.length);
              break;
            }
          } else {
            console.warn('Fetch returned non-audio content-type:', contentType);
          }
        } else {
          console.warn('Audio fetch failed:', audioResponse.status, tryUrl.substring(0, 80));
        }
      } catch (fetchError) {
        console.warn('Audio fetch error:', fetchError.message);
      }
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
