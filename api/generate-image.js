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

    if (type === 'battle-map' || type === 'special') {
      enhancedPrompt = `Top-down battle map for tabletop RPG, bird's eye view, ${prompt}. Grid-friendly layout, clear paths and rooms, suitable for miniature placement, high detail, fantasy RPG style, no text or labels, clean edges.`;
    } else if (type === 'dungeon') {
      enhancedPrompt = `Top-down dungeon map for D&D/tabletop RPG, bird's eye view, ${prompt}. Stone walls, corridors, chambers, grid-compatible layout, dark fantasy style, torchlit atmosphere, suitable for VTT, no text.`;
    } else if (type === 'outdoor') {
      enhancedPrompt = `Top-down outdoor battle map for tabletop RPG, bird's eye view, ${prompt}. Natural terrain, paths, vegetation, water features if appropriate, fantasy RPG style, grid-friendly, no text or labels.`;
    } else if (type === 'city') {
      enhancedPrompt = `Top-down city/town map for tabletop RPG, bird's eye view, ${prompt}. Buildings, streets, market squares, fantasy medieval style, suitable for miniature combat, no text or labels.`;
    } else if (type === 'asset') {
      enhancedPrompt = `${prompt}. Transparent background, top-down view, suitable for tabletop RPG battle map, high detail, clean edges, fantasy style, isolated object.`;
    }

    let imageUrl;

    // Determine aspect ratio from size
    const [width, height] = size.split('x').map(Number);
    let aspectRatio = '1:1';
    if (width > height) {
      aspectRatio = '16:9';
    } else if (height > width) {
      aspectRatio = '9:16';
    }

    // Use 1min.ai API with IMAGE_GENERATOR type
    const requestBody = {
      type: 'IMAGE_GENERATOR',
      model: model,
      promptObject: {
        prompt: enhancedPrompt,
        num_outputs: 1,
        aspect_ratio: aspectRatio
      }
    };

    console.log('1min.ai request:', JSON.stringify(requestBody));

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
      console.error('1min.ai API error:', errorText);
      return res.status(response.status).json({
        error: `Image generation failed: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('1min.ai response:', JSON.stringify(data).substring(0, 1000));

    // Extract image URL from 1min.ai response
    // The response structure may vary based on the model used
    if (data.aiRecord?.aiRecordDetail?.resultUrl) {
      imageUrl = data.aiRecord.aiRecordDetail.resultUrl;
    } else if (data.aiRecord?.aiRecordDetail?.result) {
      // Result might be a URL string or an array of URLs
      const result = data.aiRecord.aiRecordDetail.result;
      if (Array.isArray(result)) {
        imageUrl = result[0];
      } else if (typeof result === 'string') {
        imageUrl = result;
      }
    } else if (data.resultUrl) {
      imageUrl = data.resultUrl;
    } else if (data.result) {
      if (Array.isArray(data.result)) {
        imageUrl = data.result[0];
      } else {
        imageUrl = data.result;
      }
    } else if (Array.isArray(data.images) && data.images[0]) {
      imageUrl = data.images[0];
    } else if (data.output) {
      if (Array.isArray(data.output)) {
        imageUrl = data.output[0];
      } else {
        imageUrl = data.output;
      }
    } else {
      console.error('Unexpected response structure:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Unexpected response from image generation API',
        response: data
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
