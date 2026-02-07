/**
 * Vercel Serverless Function - Audio Download Proxy
 * Proxies audio downloads from 1min.ai to avoid CORS issues
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

    // Fetch the audio from the URL
    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      return res.status(audioResponse.status).json({
        error: `Failed to download audio: ${audioResponse.statusText}`
      });
    }

    // Get the audio as a buffer
    const arrayBuffer = await audioResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to base64 data URL
    const base64 = buffer.toString('base64');
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Return the data URL
    return res.status(200).json({ dataUrl });

  } catch (error) {
    console.error('Download audio API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
