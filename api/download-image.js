/**
 * Vercel Serverless Function - Image Download Proxy
 * Proxies image downloads from DALL-E to avoid CORS issues
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
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing required field: imageUrl' });
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({
        error: `Failed to download image: ${imageResponse.statusText}`
      });
    }

    // Get the image as a buffer
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to base64 data URL
    const base64 = buffer.toString('base64');
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Return the data URL
    return res.status(200).json({ dataUrl });

  } catch (error) {
    console.error('Download image API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
