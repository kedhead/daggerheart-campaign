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

    // Track all attempts for debug output
    const debug = [];
    let audioData = null;
    let audioUrl = assetPath ? `https://asset.1min.ai/${assetPath}` : null;
    const recordUuid = data.aiRecord?.uuid;

    // Strategy 1: Try asset.1min.ai with authentication headers
    // asset.1min.ai returns JSON 500 (it's an API server, not raw S3)
    // so it likely needs auth to serve files
    if (assetPath) {
      const cleanPath = assetPath.replace(/^\//, '');
      const assetUrl = `https://asset.1min.ai/${cleanPath}`;
      const authHeaders = [
        { headers: { 'API-KEY': apiKey }, label: 'asset.1min.ai+API-KEY' },
        { headers: { 'Authorization': `Bearer ${apiKey}` }, label: 'asset.1min.ai+Bearer' },
        { headers: { 'x-api-key': apiKey }, label: 'asset.1min.ai+x-api-key' },
      ];

      for (const auth of authHeaders) {
        if (audioData) break;
        try {
          const resp = await fetch(assetUrl, { headers: auth.headers });
          const ct = resp.headers.get('content-type') || '';
          const status = resp.status;

          if (resp.ok && (ct.includes('audio') || ct.includes('octet-stream'))) {
            const ab = await resp.arrayBuffer();
            if (ab.byteLength > 100) {
              const buf = Buffer.from(ab);
              audioData = `data:audio/mpeg;base64,${buf.toString('base64')}`;
              debug.push({ strategy: auth.label, status, result: 'SUCCESS', bytes: ab.byteLength });
              break;
            }
          } else if (resp.ok && ct.includes('json')) {
            const body = await resp.json();
            debug.push({ strategy: auth.label, status, jsonKeys: Object.keys(body), msg: (body.message || body.error || '').substring(0, 100) });
            // Check if JSON contains a download URL
            const url = body.temporaryUrl || body.url || body.downloadUrl || body.signedUrl;
            if (url && url.length > 10 && url.startsWith('http')) {
              urlsToTry.unshift(url);
              debug.push({ strategy: auth.label, note: 'Found URL in response', url: url.substring(0, 80) });
            }
          } else {
            // Read body for error details
            let errBody = '';
            try { errBody = (await resp.text()).substring(0, 150); } catch {}
            debug.push({ strategy: auth.label, status, contentType: ct.substring(0, 50), body: errBody });
          }
        } catch (e) {
          debug.push({ strategy: auth.label, error: e.message });
        }
      }
    }

    // Strategy 2: Try various 1min.ai API record/download endpoints
    if (!audioData && recordUuid) {
      const apiEndpoints = [
        { url: `https://api.1min.ai/api/ai-records/${recordUuid}`, label: 'ai-records' },
        { url: `https://api.1min.ai/api/features/${recordUuid}`, label: 'features/uuid' },
        { url: `https://api.1min.ai/api/features/${recordUuid}/download`, label: 'features/download' },
      ];

      for (const ep of apiEndpoints) {
        if (audioData) break;
        try {
          const resp = await fetch(ep.url, { headers: { 'API-KEY': apiKey } });
          const ct = resp.headers.get('content-type') || '';
          const status = resp.status;

          if (resp.ok && (ct.includes('audio') || ct.includes('octet-stream'))) {
            const ab = await resp.arrayBuffer();
            if (ab.byteLength > 100) {
              const buf = Buffer.from(ab);
              audioData = `data:audio/mpeg;base64,${buf.toString('base64')}`;
              debug.push({ strategy: ep.label, status, result: 'SUCCESS', bytes: ab.byteLength });
              break;
            }
          } else if (resp.ok && ct.includes('json')) {
            const body = await resp.json();
            const tempUrl = body.temporaryUrl || body.aiRecord?.temporaryUrl || '';
            debug.push({ strategy: ep.label, status, keys: Object.keys(body), temporaryUrl: (tempUrl || '').substring(0, 80) || '(empty)' });
            if (tempUrl && tempUrl.length > 10) {
              urlsToTry.unshift(tempUrl);
            }
          } else {
            debug.push({ strategy: ep.label, status, contentType: ct.substring(0, 50) });
          }
        } catch (e) {
          debug.push({ strategy: ep.label, error: e.message });
        }
      }
    }

    // Strategy 3: Try all collected URLs (presigned URLs found above, S3 URLs)
    if (!audioData) {
      for (const tryUrl of urlsToTry) {
        try {
          const audioResponse = await fetch(tryUrl);
          const status = audioResponse.status;
          const ct = audioResponse.headers.get('content-type') || '';
          const label = tryUrl.substring(0, 80);

          if (audioResponse.ok && !ct.includes('html') && !ct.includes('xml')) {
            const ab = await audioResponse.arrayBuffer();
            if (ab.byteLength > 100) {
              const buf = Buffer.from(ab);
              const mimeType = ct.includes('audio') ? ct : 'audio/mpeg';
              audioData = `data:${mimeType};base64,${buf.toString('base64')}`;
              audioUrl = tryUrl;
              debug.push({ strategy: 'direct-url', url: label, status, result: 'SUCCESS', bytes: ab.byteLength });
              break;
            }
          }
          debug.push({ strategy: 'direct-url', url: label, status, contentType: ct.substring(0, 30) });
        } catch (e) {
          debug.push({ strategy: 'direct-url', url: tryUrl.substring(0, 60), error: e.message });
        }
      }
    }

    if (!audioData) {
      console.warn('All audio fetch attempts failed:', JSON.stringify(debug));
    }

    return res.status(200).json({
      audioUrl,
      audioData,
      debug,
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
