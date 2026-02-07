/**
 * Vercel Serverless Function - Audio Download Proxy
 * Proxies audio downloads from 1min.ai to avoid CORS issues
 * Tries multiple S3 URL formats since asset.1min.ai is a private S3 bucket
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioUrl } = req.body;

    if (!audioUrl) {
      return res.status(400).json({ error: 'Missing required field: audioUrl' });
    }

    // Build list of URLs to try (different S3 access patterns)
    const urlsToTry = [audioUrl];

    // If it's an asset.1min.ai CNAME URL (not already an S3 URL), try S3 patterns
    if (audioUrl.includes('asset.1min.ai') && !audioUrl.includes('amazonaws.com')) {
      const path = audioUrl.replace(/^https?:\/\/asset\.1min\.ai\//, '');
      urlsToTry.push(`https://s3.us-east-1.amazonaws.com/asset.1min.ai/${path}`);
      urlsToTry.push(`https://asset.1min.ai.s3.us-east-1.amazonaws.com/${path}`);
    }

    for (const tryUrl of urlsToTry) {
      try {
        console.log('Trying to download audio from:', tryUrl.substring(0, 100));
        const audioResponse = await fetch(tryUrl);

        if (audioResponse.ok) {
          const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
          if (contentType.includes('html') || contentType.includes('xml')) {
            console.warn('Got HTML/XML instead of audio from:', tryUrl.substring(0, 60));
            continue;
          }

          const arrayBuffer = await audioResponse.arrayBuffer();
          if (arrayBuffer.byteLength > 100) {
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            const mimeType = contentType.includes('audio') ? contentType : 'audio/mpeg';
            const dataUrl = `data:${mimeType};base64,${base64}`;
            console.log('Audio downloaded, base64 size:', dataUrl.length);
            return res.status(200).json({ dataUrl });
          }
        } else {
          console.warn('Fetch failed:', audioResponse.status, tryUrl.substring(0, 60));
        }
      } catch (fetchError) {
        console.warn('Fetch error:', fetchError.message, tryUrl.substring(0, 60));
      }
    }

    return res.status(502).json({
      error: 'Failed to download audio from any URL',
      tried: urlsToTry.length
    });

  } catch (error) {
    console.error('Download audio API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
