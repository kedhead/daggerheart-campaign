/**
 * Vercel Serverless Function - AI Image Generation
 * Uses 1min.ai API for image generation (supports multiple models)
 */

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
      type = 'battle-map',
      model = 'dall-e-3',
      size = '1024x1024',
      style = 'vivid',
      quality = 'standard',
      animated = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    // Get API key from environment
    const apiKey = process.env.min_api || process.env.MIN_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Image generation API not configured' });
    }

    console.log('Generating image with 1min.ai:', { type, model, size, animated });

    // Build the enhanced prompt based on type
    let enhancedPrompt = prompt;

    if (type === 'battle-map') {
      enhancedPrompt = `Top-down battle map for tabletop RPG, bird's eye view, ${prompt}.
        Grid-friendly layout, clear paths and rooms, suitable for miniature placement,
        high detail, fantasy RPG style, no text or labels, clean edges.`;
    } else if (type === 'dungeon') {
      enhancedPrompt = `Top-down dungeon map for D&D/tabletop RPG, bird's eye view, ${prompt}.
        Stone walls, corridors, chambers, grid-compatible layout, dark fantasy style,
        torchlit atmosphere, suitable for VTT, no text.`;
    } else if (type === 'outdoor') {
      enhancedPrompt = `Top-down outdoor battle map for tabletop RPG, bird's eye view, ${prompt}.
        Natural terrain, paths, vegetation, water features if appropriate,
        fantasy RPG style, grid-friendly, no text or labels.`;
    } else if (type === 'city') {
      enhancedPrompt = `Top-down city/town map for tabletop RPG, bird's eye view, ${prompt}.
        Buildings, streets, market squares, fantasy medieval style,
        suitable for miniature combat, no text or labels.`;
    } else if (type === 'asset') {
      enhancedPrompt = `${prompt}. Transparent background, top-down view,
        suitable for tabletop RPG battle map, high detail, clean edges,
        fantasy style, isolated object.`;
    }

    let imageUrl;

    // Use 1min.ai API
    const response = await fetch('https://api.1min.ai/api/features', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey
      },
      body: JSON.stringify({
        type: animated ? 'TEXT_TO_VIDEO' : 'TEXT_TO_IMAGE',
        model: model,
        promptObject: {
          prompt: enhancedPrompt,
          negativePrompt: 'blurry, low quality, text, labels, watermark, signature, distorted, deformed',
          width: parseInt(size.split('x')[0]) || 1024,
          height: parseInt(size.split('x')[1]) || 1024,
          style: style,
          quality: quality,
          numOutputs: 1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('1min.ai API error:', errorText);
      return res.status(response.status).json({
        error: `Image generation failed: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('1min.ai response:', JSON.stringify(data).substring(0, 500));

    // Extract image URL from 1min.ai response
    // The response structure may vary based on the model used
    if (data.aiRecord?.aiRecordDetail?.resultUrl) {
      imageUrl = data.aiRecord.aiRecordDetail.resultUrl;
    } else if (data.aiRecord?.aiRecordDetail?.result) {
      imageUrl = data.aiRecord.aiRecordDetail.result;
    } else if (data.resultUrl) {
      imageUrl = data.resultUrl;
    } else if (data.result) {
      imageUrl = data.result;
    } else if (Array.isArray(data.images) && data.images[0]) {
      imageUrl = data.images[0];
    } else {
      console.error('Unexpected response structure:', data);
      return res.status(500).json({
        error: 'Unexpected response from image generation API',
        data: data
      });
    }

    return res.status(200).json({
      imageUrl,
      prompt: enhancedPrompt,
      model,
      animated
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
