/**
 * Vercel Serverless Function - AI Image Generation
 * Uses 1min.ai API for battle map generation
 * Supports: dall-e-3, flux-dev, stable-diffusion-3, magic-art_7_0
 */

// Extend timeout - 300s on Pro plan, 60s on Hobby
export const config = {
  maxDuration: 300
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
      type = 'battle-map',
      model = 'magic-art_7_0',  // Default to Magic Art 7.0
      size = '1024x1024',
      animated = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing required field: prompt' });
    }

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
      // Note: Magic Art 7.0 doesn't allow "transparent" - use "plain background" instead
      enhancedPrompt = `${prompt}, top-down view token for D&D VTT, plain solid color background, isolated object, high detail fantasy style, clean edges, suitable for tabletop RPG battle map`;
    }

    // --- DALL-E 3 Direct: bypass 1min.ai entirely for speed & reliability ---
    const selectedModel = model || 'dall-e-3';
    if (selectedModel === 'dall-e-3') {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        // Fall through to 1min.ai if no OpenAI key
        console.log('No OPENAI_API_KEY, falling back to 1min.ai for DALL-E 3');
      } else {
        console.log('Using OpenAI directly for DALL-E 3 battle map');

        const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: enhancedPrompt,
            n: 1,
            size: ['1024x1024', '1024x1792', '1792x1024'].includes(size) ? size : '1024x1024',
            quality: 'hd',
            style: 'vivid'
          })
        });

        if (!openaiResponse.ok) {
          const err = await openaiResponse.json().catch(() => ({ error: { message: openaiResponse.statusText } }));
          return res.status(openaiResponse.status).json({
            error: `DALL-E API error: ${err.error?.message || openaiResponse.statusText}`
          });
        }

        const openaiData = await openaiResponse.json();
        const directUrl = openaiData.data?.[0]?.url;

        if (!directUrl) {
          return res.status(500).json({ error: 'No image URL returned from DALL-E' });
        }

        return res.status(200).json({
          imageUrl: directUrl,
          prompt: enhancedPrompt,
          model: 'dall-e-3',
          animated: false
        });
      }
    }

    // --- 1min.ai path for non-DALL-E models ---
    // Get API key from environment - try multiple variable names
    const apiKey = process.env.min_api || process.env.MIN_API_KEY || process.env.MIN_API || process.env.ONEMIN_API_KEY;

    if (!apiKey) {
      console.error('No API key found. Checked: min_api, MIN_API_KEY, MIN_API, ONEMIN_API_KEY');
      return res.status(500).json({
        error: 'Image generation API not configured',
        hint: 'Set min_api environment variable in Vercel'
      });
    }

    // Build request based on model
    let requestBody;

    if (selectedModel === 'magic-art_7_0') {
      // Magic Art 7.0 (Midjourney-style) - matches exact format from 1min.ai docs
      const [width, height] = size.split('x').map(Number);
      let aspectWidth = 1, aspectHeight = 1;

      // Calculate aspect ratio
      const ratio = width / height;
      if (Math.abs(ratio - 16/9) < 0.1) {
        // 16:9 (2560x1440, etc.)
        aspectWidth = 16; aspectHeight = 9;
      } else if (Math.abs(ratio - 9/16) < 0.1) {
        // 9:16 (vertical)
        aspectWidth = 9; aspectHeight = 16;
      } else if (width > height) {
        // Other wide formats (1792x1024 ≈ 7:4)
        aspectWidth = 7; aspectHeight = 4;
      } else if (height > width) {
        // Other tall formats
        aspectWidth = 4; aspectHeight = 7;
      }

      requestBody = {
        type: 'IMAGE_GENERATOR',
        model: 'magic-art_7_0',
        promptObject: {
          prompt: enhancedPrompt,
          mode: 'fast',   // 'fast' ~45sec (2x credits), 'relax' 1-8min (times out on Vercel)
          n: 4,           // Magic Art 7.0 generates 4 images
          isNiji6: false,
          aspect_width: aspectWidth,
          aspect_height: aspectHeight,
          stylize: 200,
          chaos: 25,
          maintainModeration: false  // Disabled - "battle map" triggers false positives
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

    // Use AbortController to timeout before Vercel's limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout (Vercel limit is 60s hobby / 300s pro)

    let response;
    try {
      response = await fetch('https://api.1min.ai/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': apiKey
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          error: 'Image generation timed out. Try using DALL-E 3 model which is faster, or try again.',
          hint: 'Switch to DALL-E 3 in Advanced Options for more reliable generation'
        });
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('1min.ai API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // Try to parse as JSON for better error message
      let errorDetails = errorText;
      let errorMessage = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || response.statusText;
        errorDetails = errorJson;
      } catch (e) {
        // Keep as text
      }

      return res.status(response.status).json({
        error: `Image generation failed: ${errorMessage}`,
        status: response.status,
        details: errorDetails
      });
    }

    const data = await response.json();
    console.log('1min.ai full response keys:', Object.keys(data));
    console.log('1min.ai aiRecord keys:', data.aiRecord ? Object.keys(data.aiRecord) : 'no aiRecord');
    console.log('1min.ai temporaryUrl:', data.aiRecord?.temporaryUrl);
    console.log('1min.ai resultObject:', JSON.stringify(data.aiRecord?.aiRecordDetail?.resultObject));

    // Extract image URL from 1min.ai response - handle many possible formats
    let imageUrl = null;
    let baseUrl = null;

    // Check for temporaryUrl on aiRecord - might be full URL or base URL
    if (data.aiRecord?.temporaryUrl) {
      const tempUrl = data.aiRecord.temporaryUrl;
      console.log('Found temporaryUrl:', tempUrl);

      // If temporaryUrl is a full URL to an image, use it directly
      if (tempUrl.startsWith('http') && /\.(png|jpg|jpeg|gif|webp)/i.test(tempUrl)) {
        imageUrl = tempUrl;
        console.log('Using temporaryUrl directly as image URL');
      } else {
        baseUrl = tempUrl;
      }
    }

    // Format 1: aiRecord.aiRecordDetail.resultUrl (full URL)
    if (data.aiRecord?.aiRecordDetail?.resultUrl) {
      imageUrl = data.aiRecord.aiRecordDetail.resultUrl;
    }
    // Format 2: aiRecord.aiRecordDetail.result (string or array)
    else if (data.aiRecord?.aiRecordDetail?.result) {
      const result = data.aiRecord.aiRecordDetail.result;
      if (Array.isArray(result)) {
        imageUrl = result[0]?.url || result[0];
      } else if (typeof result === 'string') {
        imageUrl = result;
      } else if (result?.url) {
        imageUrl = result.url;
      }
    }
    // Format 3: aiRecord.aiRecordDetail.resultObject (Magic Art 7.0 returns array of paths)
    else if (data.aiRecord?.aiRecordDetail?.resultObject) {
      const resultObj = data.aiRecord.aiRecordDetail.resultObject;
      // Magic Art 7.0 returns array of image paths
      if (Array.isArray(resultObj) && resultObj.length > 0) {
        imageUrl = resultObj[0];
      } else if (resultObj.data?.[0]?.url) {
        imageUrl = resultObj.data[0].url;
      } else if (resultObj.url) {
        imageUrl = resultObj.url;
      } else if (typeof resultObj === 'string') {
        imageUrl = resultObj;
      }
    }
    // Format 4: OpenAI-style data.data[].url
    else if (data.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    }
    // Format 5: Direct resultUrl
    else if (data.resultUrl) {
      imageUrl = data.resultUrl;
    }
    // Format 6: Direct result
    else if (data.result) {
      if (Array.isArray(data.result)) {
        imageUrl = data.result[0]?.url || data.result[0];
      } else if (typeof data.result === 'string') {
        imageUrl = data.result;
      } else if (data.result?.url) {
        imageUrl = data.result.url;
      }
    }
    // Format 7: images array
    else if (Array.isArray(data.images) && data.images[0]) {
      imageUrl = data.images[0]?.url || data.images[0];
    }
    // Format 8: output
    else if (data.output) {
      if (Array.isArray(data.output)) {
        imageUrl = data.output[0]?.url || data.output[0];
      } else if (typeof data.output === 'string') {
        imageUrl = data.output;
      } else if (data.output?.url) {
        imageUrl = data.output.url;
      }
    }
    // Format 9: url directly on data
    else if (data.url) {
      imageUrl = data.url;
    }
    // Format 10: image_url
    else if (data.image_url) {
      imageUrl = data.image_url;
    }

    if (!imageUrl) {
      console.error('Could not find image URL in response. Full response:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Could not extract image URL from API response',
        details: 'Check Vercel logs for full response',
        responseKeys: Object.keys(data),
        hasAiRecord: !!data.aiRecord
      });
    }

    // Log the raw extracted URL before any modification
    console.log('Raw extracted imageUrl:', imageUrl);
    console.log('Base URL from temporaryUrl:', baseUrl);

    // If we have a relative URL, we need to make it absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      if (baseUrl) {
        // Use the temporaryUrl as the base - it should be the signed S3 URL base
        // temporaryUrl might be a full URL to one image, extract the base path
        const baseMatch = baseUrl.match(/^(https?:\/\/[^?]+\/)/);
        if (baseMatch) {
          const basePath = baseMatch[1];
          // Remove the filename from base if present
          const baseDir = basePath.replace(/[^/]+\.(png|jpg|jpeg|gif|webp)$/i, '');
          imageUrl = baseDir + imageUrl;
        } else {
          // temporaryUrl might already be just the base
          imageUrl = baseUrl.replace(/\/$/, '') + '/' + imageUrl;
        }
        console.log('Constructed URL from temporaryUrl:', imageUrl);
      } else {
        // Fallback: try the 1min.ai asset CDN
        imageUrl = `https://asset.1min.ai/${imageUrl}`;
        console.log('Fallback URL:', imageUrl);
      }
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
