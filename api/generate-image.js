/**
 * Vercel Serverless Function - AI Image Generation
 * Uses 1min.ai API for battle map generation
 * Supports: dall-e-3, flux-dev, stable-diffusion-3, magic-art_7_0
 */

// Extend timeout - 300s on Pro plan, 60s on Hobby
export const config = {
  maxDuration: 300
};

// Trim and tidy a third-party API error string so it's safe to surface to
// the client without dumping a full HTML page or stack trace.
function truncateErr(input) {
  if (!input) return '';
  let str = typeof input === 'string' ? input : (() => { try { return JSON.stringify(input); } catch { return String(input); } })();
  // If it's a JSON envelope, extract the most useful message field
  try {
    const parsed = JSON.parse(str);
    str = parsed?.detail || parsed?.error?.message || parsed?.error || parsed?.message || str;
  } catch { /* not JSON, keep raw */ }
  if (typeof str !== 'string') str = String(str);
  return str.length > 240 ? str.slice(0, 237) + '…' : str;
}

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
      animated = false,
      styleKey,               // optional: for storybook-* types
      gameSystem,             // optional: for storybook-* types ('starwarsd6' swaps style)
      imageModel,             // optional: 'nano-banana' | 'gpt-image-1' | 'flux-pro' | '' (dall-e-3)
      referenceImages,        // optional: array of image URLs to use as likeness reference
      apiKey: clientApiKey   // optional client-provided key (used by portrait callers)
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    // --- Storybook mode: illustrated style images ---
    if (type === 'storybook-scene' || type === 'storybook-portrait') {
      const fantasyPreambles = {
        watercolor: 'Soft watercolor storybook illustration, washed pastel tones, loose expressive brushwork, fairytale atmosphere, painterly, no text or labels',
        oil: 'Classical oil painting fairytale illustration, rich textured brushwork, warm golden lighting, Arthur Rackham inspired, no text or labels',
        'ink-wash': 'Ink and watercolor wash storybook illustration, expressive brushstrokes, muted palette, intimate composition, no text or labels',
        illuminated: 'Illuminated manuscript illustration, gilded borders, medieval tapestry aesthetic, stylised figures, no text or labels',
        'children-storybook': "Classic children's storybook illustration, friendly line art with soft colour fills, whimsical, Tony DiTerlizzi inspired, no text or labels",
        'fantasy-anime': 'Fantasy anime illustration, bold black ink outlines, vibrant saturated colour palette, painterly cel-shaded fills with soft highlights, expressive stylised character poses, rich adventure atmosphere reminiscent of modern western-anime fantasy box art, no text or labels'
      };
      const scifiPreambles = {
        watercolor: 'Soft watercolor sci-fi illustration, washed pastel tones, painterly space opera atmosphere, no text or labels',
        oil: 'Oil painting sci-fi concept illustration, textured brushwork, dramatic cinematic lighting, space opera, no text or labels',
        'ink-wash': 'Ink and watercolor wash sci-fi illustration, expressive strokes, muted palette, no text or labels',
        illuminated: 'Retro-futurist illuminated sci-fi illustration, ornamental borders, stylised figures, no text or labels',
        'children-storybook': "Classic children's storybook sci-fi illustration, friendly line art with soft colour fills, whimsical, no text or labels",
        'fantasy-anime': 'Sci-fi anime illustration, bold black ink outlines, vibrant saturated colour palette, painterly cel-shaded fills with soft highlights, expressive stylised character poses, sleek space-opera adventure atmosphere, no text or labels'
      };
      const presets = gameSystem === 'starwarsd6' ? scifiPreambles : fantasyPreambles;
      const preamble = (styleKey && styleKey !== 'custom' && presets[styleKey])
        || (styleKey && styleKey.length > 6 ? styleKey : null) // treat as custom preamble if long
        || presets.watercolor;

      const fullPromptBase = `${preamble}. ${prompt}`;
      const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
      const imageSize = validSizes.includes(size) ? size : '1024x1024';

      const replicateKey = process.env.REPLICATE_API_TOKEN;
      const refs = Array.isArray(referenceImages) ? referenceImages.filter(Boolean) : [];

      // When we have reference images we prepend a strong likeness directive
      // BEFORE the style preamble so the model treats the references as the
      // source of truth — the narrative scene text often describes characters
      // generically, which without this dominates the references and produces
      // "fake" characters that don't match the originals.
      const likenessDirective = refs.length > 0
        ? `CRITICAL CHARACTER REFERENCE: The reference image${refs.length > 1 ? 's' : ''} attached show the EXACT character${refs.length > 1 ? 's' : ''} that must appear in this image. Faithfully reproduce their face, hair, eye colour, skin tone, body proportions, species/ancestry, clothing, and gear from the reference${refs.length > 1 ? 's' : ''}. Do NOT invent new characters. Do NOT swap their species. Where any text below could conflict with the references, the references win. `
        : '';

      const fullPrompt = `${likenessDirective}${fullPromptBase}`;

      // --- Google Gemini 2.5 Flash Image ("nano-banana", and v2) via Replicate ---
      //     Best for character likeness — accepts the original portrait(s)
      //     as reference images and redraws them in the requested style.
      //     When the user explicitly selects nano-banana and it can't run,
      //     we fail loudly so the UI shows the real reason.
      if (imageModel === 'nano-banana' || imageModel === 'nano-banana-2') {
        if (!replicateKey) {
          return res.status(500).json({
            error: 'REPLICATE_API_TOKEN is not configured on the server, so nano-banana cannot run. Set the env var in Vercel or pick a different image model.'
          });
        }
        const replicatePath = imageModel === 'nano-banana-2'
          ? 'google/nano-banana-2'
          : 'google/nano-banana';
        console.log(`Using Replicate ${replicatePath} for storybook image, refs: ${refs.length}`);
        try {
          const createRes = await fetch(`https://api.replicate.com/v1/models/${replicatePath}/predictions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${replicateKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait'
            },
            body: JSON.stringify({
              input: {
                prompt: fullPrompt,
                image_input: refs,
                output_format: 'png'
              }
            })
          });
          if (!createRes.ok) {
            const errText = await createRes.text().catch(() => createRes.statusText);
            console.error(`Replicate ${replicatePath} error:`, errText);
            return res.status(createRes.status || 500).json({
              error: `Replicate ${replicatePath} error: ${truncateErr(errText)}`
            });
          }
          let prediction = await createRes.json();
          if (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
            const deadline = Date.now() + 55000;
            while (Date.now() < deadline && prediction.status !== 'succeeded' && prediction.status !== 'failed') {
              await new Promise(r => setTimeout(r, 2000));
              const pollRes = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${replicateKey}` } });
              if (pollRes.ok) prediction = await pollRes.json();
            }
          }
          if (prediction.status === 'succeeded' && prediction.output) {
            const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
            if (url) return res.status(200).json({ imageUrl: url, prompt: fullPrompt, model: imageModel });
            return res.status(500).json({ error: `${imageModel} returned no output URL.` });
          }
          return res.status(500).json({
            error: `${imageModel} prediction ${prediction.status}: ${truncateErr(prediction.error || 'unknown reason')}`
          });
        } catch (err) {
          console.error(`${imageModel} error:`, err);
          return res.status(500).json({ error: `${imageModel} request failed: ${err.message}` });
        }
      }

      // --- OpenAI gpt-image-1 / gpt-image-2 (reference-capable) ---
      //     Uses /v1/images/edits when references are provided, otherwise
      //     /v1/images/generations. Requires a verified OpenAI organisation
      //     (and gpt-image-2 may require a higher org tier).
      if (imageModel === 'gpt-image-1' || imageModel === 'gpt-image-2') {
        const openaiKey = clientApiKey || process.env.OPENAI_API_KEY;
        if (!openaiKey) {
          return res.status(500).json({
            error: `No OpenAI API key configured, so ${imageModel} cannot run. Add OPENAI_API_KEY to the server env or pick a different image model.`
          });
        }
        console.log(`Using OpenAI ${imageModel} for storybook image, refs:`, refs.length);
        try {
          const sizeForGpt = imageSize === '1792x1024' ? '1536x1024'
            : imageSize === '1024x1792' ? '1024x1536'
            : '1024x1024';
          let gptRes;
          if (refs.length > 0) {
            const form = new FormData();
            form.append('model', imageModel);
            form.append('prompt', fullPrompt);
            form.append('size', sizeForGpt);
            form.append('n', '1');
            for (let i = 0; i < Math.min(refs.length, 4); i++) {
              const imgRes = await fetch(refs[i]);
              if (!imgRes.ok) continue;
              const buf = await imgRes.arrayBuffer();
              form.append('image[]', new Blob([buf], { type: imgRes.headers.get('content-type') || 'image/png' }), `ref${i}.png`);
            }
            gptRes = await fetch('https://api.openai.com/v1/images/edits', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${openaiKey}` },
              body: form
            });
          } else {
            gptRes = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: imageModel, prompt: fullPrompt, size: sizeForGpt, n: 1 })
            });
          }
          if (!gptRes.ok) {
            const errText = await gptRes.text().catch(() => gptRes.statusText);
            console.error(`${imageModel} error:`, errText);
            return res.status(gptRes.status || 500).json({
              error: `${imageModel} error: ${truncateErr(errText)}`
            });
          }
          const data = await gptRes.json();
          const b64 = data.data?.[0]?.b64_json;
          const directUrl = data.data?.[0]?.url;
          if (b64) return res.status(200).json({ imageUrl: `data:image/png;base64,${b64}`, prompt: fullPrompt, model: imageModel });
          if (directUrl) return res.status(200).json({ imageUrl: directUrl, prompt: fullPrompt, model: imageModel });
          return res.status(500).json({ error: `${imageModel} returned no image data.` });
        } catch (err) {
          console.error(`${imageModel} error:`, err);
          return res.status(500).json({ error: `${imageModel} request failed: ${err.message}` });
        }
      }

      // --- Replicate Flux Pro path (better at species/anatomy accuracy) ---
      if (imageModel === 'flux-pro' && replicateKey) {
        console.log('Using Replicate Flux Pro for storybook image');
        try {
          // Flux aspect_ratio format
          const fluxAspect = imageSize === '1792x1024' ? '16:9'
            : imageSize === '1024x1792' ? '9:16'
            : '1:1';

          // Create prediction
          const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${replicateKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait'
            },
            body: JSON.stringify({
              input: {
                prompt: fullPrompt,
                aspect_ratio: fluxAspect,
                output_format: 'png',
                output_quality: 90,
                safety_tolerance: 5,
                prompt_upsampling: true
              }
            })
          });

          if (!createRes.ok) {
            const err = await createRes.json().catch(() => ({ detail: createRes.statusText }));
            console.error('Replicate API error:', err);
            // Fall through to DALL-E
          } else {
            let prediction = await createRes.json();

            // If not completed yet, poll for result (max ~55s)
            if (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
              const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
              const deadline = Date.now() + 55000;
              while (Date.now() < deadline && prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                await new Promise(r => setTimeout(r, 2000));
                const pollRes = await fetch(pollUrl, {
                  headers: { 'Authorization': `Bearer ${replicateKey}` }
                });
                if (pollRes.ok) prediction = await pollRes.json();
              }
            }

            if (prediction.status === 'succeeded' && prediction.output) {
              const fluxUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
              if (fluxUrl) {
                return res.status(200).json({ imageUrl: fluxUrl, prompt: fullPrompt, model: 'flux-1.1-pro' });
              }
            }
            console.warn('Flux prediction failed or timed out, falling back to DALL-E:', prediction.status, prediction.error);
          }
        } catch (fluxErr) {
          console.error('Replicate Flux error, falling back to DALL-E:', fluxErr.message);
        }
      }

      // --- DALL-E 3 path (default) ---
      const effectiveKey = clientApiKey || process.env.OPENAI_API_KEY;
      if (!effectiveKey) {
        return res.status(500).json({
          error: 'No OpenAI API key available. Add OPENAI_API_KEY to environment variables or configure one in Settings.'
        });
      }

      const sbResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt: fullPrompt, n: 1, size: imageSize, quality: 'hd', style: 'natural' })
      });
      if (!sbResponse.ok) {
        const err = await sbResponse.json().catch(() => ({ error: { message: sbResponse.statusText } }));
        return res.status(sbResponse.status).json({ error: `DALL-E API error: ${err.error?.message || sbResponse.statusText}` });
      }
      const sbData = await sbResponse.json();
      const sbUrl = sbData.data?.[0]?.url;
      if (!sbUrl) return res.status(500).json({ error: 'No image URL returned from DALL-E' });
      return res.status(200).json({ imageUrl: sbUrl, prompt: fullPrompt, model: 'dall-e-3' });
    }

    // --- Portrait mode: DALL-E 3 direct, same as old generate-portrait.js ---
    if (type === 'portrait') {
      const effectiveKey = clientApiKey || process.env.OPENAI_API_KEY;
      if (!effectiveKey) {
        return res.status(500).json({
          error: 'No OpenAI API key available. Add OPENAI_API_KEY to environment variables or configure one in Settings.'
        });
      }
      const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
      const imageSize = validSizes.includes(size) ? size : '1024x1024';
      const portraitResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: imageSize, quality: 'standard', style: 'vivid' })
      });
      if (!portraitResponse.ok) {
        const err = await portraitResponse.json().catch(() => ({ error: { message: portraitResponse.statusText } }));
        return res.status(portraitResponse.status).json({ error: `DALL-E API error: ${err.error?.message || portraitResponse.statusText}` });
      }
      const portraitData = await portraitResponse.json();
      const portraitUrl = portraitData.data[0]?.url;
      if (!portraitUrl) return res.status(500).json({ error: 'No image URL returned from DALL-E' });
      return res.status(200).json({ imageUrl: portraitUrl });
    }

    // Build the enhanced prompt based on type - emphasizing overhead/orthographic D&D battle map style
    let enhancedPrompt = prompt;

    if (type === 'battle-map' || type === 'special') {
      enhancedPrompt = `Overhead orthographic top-down view D&D battle map, tabletop RPG gaming mat style, ${prompt}, flat perspective looking straight down, no horizon visible, suitable for miniature placement, high detail fantasy illustration, square grid compatible, professional VTT map, no text or labels, clean crisp edges, edge-to-edge rendering, fills the entire 16:9 widescreen canvas completely, absolutely no letterboxing, borders, or margins`;
    } else if (type === 'dungeon') {
      enhancedPrompt = `Overhead orthographic top-down view dungeon battle map for D&D, ${prompt}, stone floor tiles, walls visible from above, flat perspective looking straight down, dark fantasy torchlit atmosphere, suitable for miniature combat, VTT ready, no text labels, clean edges, edge-to-edge rendering, fills the entire 16:9 widescreen canvas completely, absolutely no letterboxing, borders, or margins`;
    } else if (type === 'outdoor') {
      enhancedPrompt = `Overhead orthographic top-down view outdoor battle map for D&D, ${prompt}, flat perspective looking straight down from above, natural terrain visible from bird's eye view, fantasy RPG style, grid-compatible layout, VTT ready, no text or labels, edge-to-edge rendering, fills the entire 16:9 widescreen canvas completely, absolutely no letterboxing, borders, or margins`;
    } else if (type === 'city') {
      enhancedPrompt = `Overhead orthographic top-down view city street battle map for D&D, ${prompt}, medieval fantasy buildings from above, flat perspective looking straight down, cobblestone streets, suitable for miniature combat, VTT ready, no text or labels, edge-to-edge rendering, fills the entire 16:9 widescreen canvas completely, absolutely no letterboxing, borders, or margins`;
    } else if (type === 'asset') {
      // Note: Magic Art 7.0 doesn't allow "transparent" - use "plain background" instead
      enhancedPrompt = `${prompt}, top-down view token for D&D VTT, plain solid color background, isolated object, high detail fantasy style, clean edges, suitable for tabletop RPG battle map`;
    }

    // --- Gemini 2.5 Flash Image ("nano-banana") for Handouts ---
    if (type === 'handout') {
      const replicateKey = process.env.REPLICATE_API_TOKEN;
      if (replicateKey) {
        console.log('Using Replicate nano-banana (Gemini 2.5 Flash Image) for handout');
        try {
          const createRes = await fetch('https://api.replicate.com/v1/models/google/nano-banana/predictions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${replicateKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait'
            },
            body: JSON.stringify({
              input: {
                prompt: enhancedPrompt,
                aspect_ratio: size === '1792x1024' ? '16:9' : '1:1',
                output_format: 'png'
              }
            })
          });
          
          if (createRes.ok) {
            let prediction = await createRes.json();
            if (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
              const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
              const deadline = Date.now() + 55000;
              while (Date.now() < deadline && prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                await new Promise(r => setTimeout(r, 2000));
                const pollRes = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${replicateKey}` } });
                if (pollRes.ok) prediction = await pollRes.json();
              }
            }
            if (prediction.status === 'succeeded' && prediction.output) {
              const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
              if (url) return res.status(200).json({ imageUrl: url, prompt: enhancedPrompt, model: 'nano-banana' });
            }
            console.warn('nano-banana handout failed, falling back to DALL-E 3:', prediction.status, prediction.error);
          } else {
            const errText = await createRes.text().catch(() => createRes.statusText);
            console.error('Replicate nano-banana error:', errText);
          }
        } catch (err) {
          console.error('nano-banana error, falling back:', err.message);
        }
      }
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
