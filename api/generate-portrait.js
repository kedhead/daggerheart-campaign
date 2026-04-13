/**
 * Vercel Serverless Function - Portrait Generation Proxy
 * Calls DALL-E 3 using server-side OPENAI_API_KEY or client-provided key
 */

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, apiKey, size } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    // Use client-provided key first, then fall back to server env var
    const effectiveKey = apiKey || process.env.OPENAI_API_KEY;

    if (!effectiveKey) {
      return res.status(500).json({
        error: 'No OpenAI API key available. Add OPENAI_API_KEY to environment variables or configure one in Settings.'
      });
    }

    // Validate size if provided (DALL-E 3 supports 1024x1024, 1024x1792, 1792x1024)
    const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
    const imageSize = validSizes.includes(size) ? size : '1024x1024';

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: imageSize,
        quality: 'standard',
        style: 'vivid'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      return res.status(response.status).json({
        error: `DALL-E API error: ${error.error?.message || response.statusText}`
      });
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image URL returned from DALL-E' });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error('Portrait generation error:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
}
