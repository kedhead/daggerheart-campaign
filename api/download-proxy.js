/**
 * Vercel Serverless Function - Asset Download Proxy
 *
 * Proxies image and audio downloads to avoid browser CORS issues and returns a
 * base64 data URL. Handles both payload shapes so a single function can back the
 * `/api/download-image` and `/api/download-audio` endpoints (wired via rewrites
 * in vercel.json) — the Hobby plan caps a deployment at 12 serverless functions.
 *
 *   { imageUrl }  → fetch image, return { dataUrl }
 *   { audioUrl }  → fetch audio (with 1min.ai S3 fallbacks), return { dataUrl }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioUrl, imageUrl } = req.body || {};

    if (audioUrl) {
      return await handleAudio(audioUrl, res);
    }
    if (imageUrl) {
      return await handleImage(imageUrl, res);
    }
    return res.status(400).json({ error: 'Missing required field: imageUrl or audioUrl' });
  } catch (error) {
    console.error('Download proxy API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function handleImage(imageUrl, res) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    return res.status(imageResponse.status).json({
      error: `Failed to download image: ${imageResponse.statusText}`,
    });
  }
  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const contentType = imageResponse.headers.get('content-type') || 'image/png';
  return res.status(200).json({ dataUrl: `data:${contentType};base64,${base64}` });
}

async function handleAudio(audioUrl, res) {
  // asset.1min.ai is a private S3 bucket behind a CNAME — try the direct URL
  // first, then a couple of S3 access patterns.
  const urlsToTry = [audioUrl];
  if (audioUrl.includes('asset.1min.ai') && !audioUrl.includes('amazonaws.com')) {
    const path = audioUrl.replace(/^https?:\/\/asset\.1min\.ai\//, '');
    urlsToTry.push(`https://s3.us-east-1.amazonaws.com/asset.1min.ai/${path}`);
    urlsToTry.push(`https://asset.1min.ai.s3.us-east-1.amazonaws.com/${path}`);
  }

  for (const tryUrl of urlsToTry) {
    try {
      const audioResponse = await fetch(tryUrl);
      if (!audioResponse.ok) continue;

      const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
      if (contentType.includes('html') || contentType.includes('xml')) continue;

      const arrayBuffer = await audioResponse.arrayBuffer();
      if (arrayBuffer.byteLength > 100) {
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = contentType.includes('audio') ? contentType : 'audio/mpeg';
        return res.status(200).json({ dataUrl: `data:${mimeType};base64,${base64}` });
      }
    } catch (fetchError) {
      console.warn('Audio fetch error:', fetchError.message, tryUrl.substring(0, 60));
    }
  }

  return res.status(502).json({ error: 'Failed to download audio from any URL', tried: urlsToTry.length });
}
