/**
 * Vercel Serverless Function - AI Image Generation
 * Uses 1min.ai API for battle map generation
 * Supports: dall-e-3, flux-dev, stable-diffusion-3, magic-art_7_0
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
      model = 'dall-e-3',  // Default to DALL-E 3 (more widely available)
      size = '1024x1024',
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

    // Build the enhanced prompt based on type - emphasizing overhead/orthographic D&D battle map style
    let enhancedPrompt = prompt;

    if (type === 'battle-map' || type === 'special') {
      enhancedPrompt = `Overhead orthographic top-down view D&D battle map, tabletop RPG gaming mat style, ${prompt}, flat perspective looking straight down, no horizon visible, suitable for miniature placement, high detail fantasy illustration, square grid compatible, professional VTT map, no text or labels, clean crisp edges`;
    } else if (type === 'dungeon') {
      enhancedPrompt = `Overhead orthographic top-down view dungeon battle map for D&D, ${prompt}, stone floor tiles, walls visible from above, flat perspective looking straight down, dark fantasy torchlit atmosphere, suitable for miniature combat, VTT ready, no text labels, clean edges`;
    } else if (type === 'outdoor') {
      enhancedPrompt = `Overhead orthographic top-down view outdoor battle map for D&D, ${prompt}, flat perspective looking straight down from above, natural terrain visible from bird's eye view, fantasy RPG style, grid-compatible layout, VTT ready, no text or labels`;
    } else if (type === 'city') {
      enhancedPrompt = `Overhead orthographic top-down view city street battle map for D&D, ${prompt}, medieval fantasy buildings from above, flat perspective looking straight down, cobblestone streets, suitable for miniature combat, VTT ready, no text or labels`;
    } else if (type === 'asset') {
      enhancedPrompt = `${prompt}, top-down view token for D&D VTT, transparent background, isolated object, high detail fantasy style, clean edges, suitable for tabletop RPG battle map`;
    }

    // Build request based on model
    let requestBody;
    const selectedModel = model || 'dall-e-3';

    if (selectedModel === 'magic-art_7_0') {
      // Magic Art 7.0 (Midjourney-style) - may require higher tier
      const [width, height] = size.split('x').map(Number);
      let aspectWidth = 1, aspectHeight = 1;
      if (width > height) { aspectWidth = 7; aspectHeight = 4; }
      else if (height > width) { aspectWidth = 4; aspectHeight = 7; }

      requestBody = {
        type: 'IMAGE_GENERATOR',
        model: 'magic-art_7_0',
        promptObject: {
          prompt: enhancedPrompt,
          mode: 'fast',
          n: 1,
          isNiji6: false,
          aspect_width: aspectWidth,
          aspect_height: aspectHeight,
          stylize: 100,
          chaos: 10,
          maintainModeration: true
        }
      };
    } else if (selectedModel === 'flux-dev' || selectedModel === 'flux-schnell') {
      // Flux models
      requestBody = {
        type: 'IMAGE_GENERATOR',
        model: selectedModel,
        promptObject: {
          prompt: enhancedPrompt,
          num_outputs: 1,
          aspect_ratio: size === '1792x1024' ? '16:9' : size === '1024x1792' ? '9:16' : '1:1'
        }
      };
    } else {
      // DALL-E 3 (default) and Stable Diffusion
      requestBody = {
        type: 'IMAGE_GENERATOR',
        model: selectedModel,
        promptObject: {
          prompt: enhancedPrompt,
          n: 1,
          size: size,
          quality: 'hd'
        }
      };
    }

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
    console.log('1min.ai response:', JSON.stringify(data).substring(0, 1500));

    // Extract image URL from 1min.ai response
    let imageUrl = null;

    // Try different response structures
    if (data.aiRecord?.aiRecordDetail?.resultUrl) {
      imageUrl = data.aiRecord.aiRecordDetail.resultUrl;
    } else if (data.aiRecord?.aiRecordDetail?.result) {
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
    }

    if (!imageUrl) {
      console.error('Could not find image URL in response:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Could not extract image URL from API response',
        response: data
      });
    }

    return res.status(200).json({
      imageUrl,
      prompt: enhancedPrompt,
      model: selectedModel,
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
