/**
 * Vercel Serverless Function - AI Image Generation
 *
 * Battle maps, map assets, portraits and handouts render with OpenAI's
 * newest image model on the account (see _lib/openaiImage.js); storybook art
 * and scene video can also use Replicate.
 *
 * Battle maps and assets used to go through 1min.ai (Magic Art, Flux, SD3).
 * That path is gone: its key leaked and was revoked. An old client that still
 * sends one of those model names gets OpenAI.
 */

import { requireUser, bearerToken, ALLOWED_HEADERS } from './_lib/auth.js';
import { buildMapPrompt, buildRefinePrompt, modelChain, runModelChain, readMapRequest, mapStoragePath } from './_lib/battleMap.js';
import { uploadToStorage, isAllowedAssetUrl } from './_lib/bookRender.js';
import { ART_STYLE_PREAMBLES, applyArtStyle, applyMapArtStyle } from './_lib/artStyle.js';
import { generateOpenAIImage, runImageChain, openaiImageSize, imageFromBody, imageErrorMessage } from './_lib/openaiImage.js';

// Extend timeout - 300s on Pro plan, 60s on Hobby.
// NOTE: vercel.json caps api/*.js at 60s and the Hobby plan enforces 60s
// regardless, so the 300 here is aspirational — a generation that runs past a
// minute is killed, which is what the scene retry loop in storybookGenerator
// exists to paper over.
export const config = {
  maxDuration: 300
};

// Image quality for every OpenAI image request.
//
// Left unset, OpenAI applies its own default, which bills at the top of the
// range — roughly a 15x spread between the cheapest and dearest setting at
// 1536x1024. Portraits render as small circular avatars and scene art as inline
// illustrations, so 'medium' is not visibly different in the places these are
// actually shown, and it is the single biggest lever on image spend.
//
// Raise to 'high' here if chapter art ever looks soft; it's one constant and it
// applies to portraits, scenes and battle maps alike.
const IMAGE_QUALITY = 'medium';

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
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Every endpoint spends API credit — signed-in users only (api/_lib/auth.js).
  const user = await requireUser(req, res);
  if (!user) return;

  // AI battle maps have their own pipeline: GPT Image 2.5 at the monitor's
  // 16:9 resolution, saved straight to campaign storage.
  if (req.body?.type === 'ai-map') return handleAiMap(req, res);

  try {
    const {
      prompt,
      type = 'battle-map',
      model,                  // ignored: maps and assets always use OpenAI
      transparent = false,    // type 'asset' only: render on a transparent background
      size = '1024x1024',
      styleKey,               // optional: for storybook-* types
      gameSystem,             // optional: for storybook-* types ('starwarsd6' swaps style)
      imageModel,             // optional: 'nano-banana' | 'gpt-image-2' (or legacy 'gpt-image-1') | 'flux-pro' | '' (OpenAI fallback)
      referenceImages,        // optional: array of image URLs to use as likeness reference
      artStyle,               // optional: the campaign's art style key, applied to every image type
      artStyleCustom,         // optional: the campaign's own style text when artStyle is 'custom'
      apiKey: rawClientKey   // optional client-provided key (used by portrait callers)
    } = req.body;

    // '__shared__' = client sentinel for "use the server's shared key"
    const clientApiKey = rawClientKey === '__shared__' ? null : rawClientKey;

    // --- Motion Comic: animate a scene still into a short video clip ---
    // Replicate video predictions run 1–5 minutes — longer than a serverless
    // invocation may live — so type:'scene-video' returns the prediction id
    // immediately and the client polls it with type:'video-status'.
    if (type === 'scene-video' || type === 'video-status') {
      const replicateKey = process.env.REPLICATE_API_TOKEN;
      if (!replicateKey) {
        return res.status(500).json({
          error: 'REPLICATE_API_TOKEN is not configured on the server, so scene animation cannot run. Set the env var in Vercel.'
        });
      }

      if (type === 'video-status') {
        const { predictionId } = req.body;
        if (!predictionId || !/^[A-Za-z0-9_-]{5,64}$/.test(predictionId)) {
          return res.status(400).json({ error: 'Missing or invalid predictionId' });
        }
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: { 'Authorization': `Bearer ${replicateKey}` }
        });
        if (!pollRes.ok) {
          const errText = await pollRes.text().catch(() => pollRes.statusText);
          return res.status(pollRes.status || 500).json({ error: `Replicate status error: ${truncateErr(errText)}` });
        }
        const prediction = await pollRes.json();
        const out = prediction.output;
        const videoUrl = typeof out === 'string' ? out : (Array.isArray(out) ? out[0] : null);
        return res.status(200).json({
          status: prediction.status,
          videoUrl: prediction.status === 'succeeded' ? videoUrl : null,
          error: prediction.error ? truncateErr(prediction.error) : null
        });
      }

      // type === 'scene-video' — start the image→video prediction.
      // Image-to-video models on Replicate differ in name and input shape, so
      // try a chain of known-good official models (env override first) and use
      // the first one that accepts the job. Auth/billing errors abort early;
      // not-found/validation errors move on to the next candidate.
      const { imageUrl } = req.body;
      if (!imageUrl || !/^https:\/\//i.test(imageUrl)) {
        return res.status(400).json({ error: 'Missing required field: imageUrl (https URL of the scene image)' });
      }
      const motionPrompt = (prompt && String(prompt).slice(0, 500))
        || 'Subtle cinematic motion: gentle camera drift, ambient movement, characters breathe and shift naturally. Preserve the composition and art style of the source image.';

      const candidates = [
        ...(process.env.REPLICATE_VIDEO_MODEL
          ? [{ path: process.env.REPLICATE_VIDEO_MODEL, input: { image: imageUrl, prompt: motionPrompt } }]
          : []),
        { path: 'wan-video/wan-2.2-i2v-fast', input: { image: imageUrl, prompt: motionPrompt } },
        { path: 'wan-video/wan-2.2-i2v-a14b', input: { image: imageUrl, prompt: motionPrompt } },
        { path: 'kwaivgi/kling-v2.1', input: { start_image: imageUrl, prompt: motionPrompt, duration: 5 } },
        { path: 'minimax/video-01-live', input: { first_frame_image: imageUrl, prompt: motionPrompt } },
      ];

      const attempts = [];
      for (const candidate of candidates) {
        const createRes = await fetch(`https://api.replicate.com/v1/models/${candidate.path}/predictions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${replicateKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ input: candidate.input })
        });
        if (createRes.ok) {
          const prediction = await createRes.json();
          console.log(`scene-video started on ${candidate.path}: ${prediction.id}`);
          return res.status(200).json({ predictionId: prediction.id, status: prediction.status, model: candidate.path });
        }
        const errText = await createRes.text().catch(() => createRes.statusText);
        attempts.push(`${candidate.path} → ${createRes.status} ${truncateErr(errText)}`);
        console.error(`Replicate scene-video ${candidate.path} failed:`, createRes.status, errText.slice(0, 300));
        // Auth/billing problems will fail for every model — stop and report.
        if (createRes.status === 401 || createRes.status === 402 || createRes.status === 403) break;
      }
      return res.status(502).json({ error: `Scene animation could not start. Tried: ${attempts.join(' | ')}` });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    // --- Storybook mode: illustrated style images ---
    if (type === 'storybook-scene' || type === 'storybook-portrait') {
      const presets = gameSystem === 'starwarsd6' ? ART_STYLE_PREAMBLES.scifi : ART_STYLE_PREAMBLES.fantasy;
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
                // Only include image_input when there are actual references —
                // sending an empty array causes a Replicate validation error.
                ...(refs.length > 0 && { image_input: refs }),
                aspect_ratio: imageSize === '1792x1024' ? '16:9'
                  : imageSize === '1024x1792' ? '9:16'
                  : '1:1',
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

      // --- OpenAI GPT Image (reference-capable; any gpt-image-* pick runs the model chain) ---
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
          const sizeForGpt = openaiImageSize(imageSize);
          // Download the references once; each model in the chain gets its own form.
          const refBlobs = [];
          for (let i = 0; i < Math.min(refs.length, 4); i++) {
            const imgRes = await fetch(refs[i]);
            if (!imgRes.ok) continue;
            const buf = await imgRes.arrayBuffer();
            refBlobs.push(new Blob([buf], { type: imgRes.headers.get('content-type') || 'image/png' }));
          }
          // Whichever OpenAI model was picked (gpt-image-1 is retired), use the
          // newest one this account has, down the chain.
          const result = refBlobs.length > 0
            ? await runImageChain(model => {
                // Edits endpoint — uses the downloaded reference images for likeness
                const form = new FormData();
                form.append('model', model);
                form.append('prompt', fullPrompt);
                form.append('size', sizeForGpt);
                form.append('n', '1');
                form.append('quality', IMAGE_QUALITY);
                refBlobs.forEach((blob, i) => form.append('image[]', blob, `ref${i}.png`));
                return fetch('https://api.openai.com/v1/images/edits', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${openaiKey}` },
                  body: form
                });
              })
            // No references available (or all downloads failed) — use generations
            : await generateOpenAIImage({ apiKey: openaiKey, prompt: fullPrompt, size: sizeForGpt, quality: IMAGE_QUALITY });
          if (!result.ok) {
            console.error('OpenAI storybook image error:', result.status, result.body);
            return res.status(result.status || 500).json({ error: truncateErr(imageErrorMessage(result)) });
          }
          const imageUrl = imageFromBody(result.body);
          if (imageUrl) return res.status(200).json({ imageUrl, prompt: fullPrompt, model: result.model });
          return res.status(500).json({ error: `${result.model} returned no image data.` });
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
            // Fall through to OpenAI
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
            console.warn('Flux prediction failed or timed out, falling back to OpenAI:', prediction.status, prediction.error);
          }
        } catch (fluxErr) {
          console.error('Replicate Flux error, falling back to OpenAI:', fluxErr.message);
        }
      }

      // --- OpenAI fallback (default for storybook) ---
      const effectiveKey = clientApiKey || process.env.OPENAI_API_KEY;
      if (!effectiveKey) {
        return res.status(500).json({
          error: 'No OpenAI API key available. Add OPENAI_API_KEY to environment variables or configure one in Settings.'
        });
      }

      const sb = await generateOpenAIImage({ apiKey: effectiveKey, prompt: fullPrompt, size: imageSize, quality: IMAGE_QUALITY });
      if (!sb.ok) return res.status(sb.status || 500).json({ error: imageErrorMessage(sb) });
      const sbImage = imageFromBody(sb.body);
      if (sbImage) return res.status(200).json({ imageUrl: sbImage, prompt: fullPrompt, model: sb.model });
      return res.status(500).json({ error: 'No image data returned from OpenAI' });
    }

    // --- Portrait mode: OpenAI, newest model available ---
    if (type === 'portrait') {
      const effectiveKey = clientApiKey || process.env.OPENAI_API_KEY;
      if (!effectiveKey) {
        return res.status(500).json({
          error: 'No OpenAI API key available. Add OPENAI_API_KEY to environment variables or configure one in Settings.'
        });
      }
      const portrait = await generateOpenAIImage({
        apiKey: effectiveKey,
        prompt: applyArtStyle(prompt, { artStyle, artStyleCustom, gameSystem }),
        size,
        quality: IMAGE_QUALITY
      });
      if (!portrait.ok) return res.status(portrait.status || 500).json({ error: imageErrorMessage(portrait) });
      const portraitImage = imageFromBody(portrait.body);
      if (portraitImage) return res.status(200).json({ imageUrl: portraitImage, model: portrait.model });
      return res.status(500).json({ error: 'No image data returned from OpenAI' });
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
      // gpt-image-1 renders real transparency, which replaced the separate
      // background-removal call. A sprite sheet asks for white instead: it is
      // cut into quadrants and the gaps between items must stay visible.
      const backdrop = transparent
        ? 'isolated on a fully transparent background, no ground, no floor, no cast shadow'
        : 'isolated on a plain white background';
      enhancedPrompt = `${prompt}, top-down view token for D&D VTT, ${backdrop}, high detail fantasy style, clean edges, suitable for tabletop RPG battle map`;
    }

    // The campaign's art style, if it has one: maps get the map wording of it.
    const styleOpts = { artStyle, artStyleCustom, gameSystem };
    enhancedPrompt = ['battle-map', 'special', 'dungeon', 'outdoor', 'city'].includes(type)
      ? applyMapArtStyle(enhancedPrompt, styleOpts)
      : applyArtStyle(enhancedPrompt, styleOpts);

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
            console.warn('nano-banana handout failed, falling back to OpenAI:', prediction.status, prediction.error);
          } else {
            const errText = await createRes.text().catch(() => createRes.statusText);
            console.error('Replicate nano-banana error:', errText);
          }
        } catch (err) {
          console.error('nano-banana error, falling back:', err.message);
        }
      }
    }

    // --- OpenAI (newest model available) for battle maps and map assets ---
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({
        error: 'Image generation is not configured: OPENAI_API_KEY is not set on the server.'
      });
    }

    const wantsTransparency = type === 'asset' && !!transparent;
    const generated = await generateOpenAIImage({
      apiKey: openaiKey,
      prompt: enhancedPrompt,
      size,
      quality: IMAGE_QUALITY,
      // Transparency needs a format with an alpha channel; PNG is the default.
      extra: wantsTransparency ? { background: 'transparent', output_format: 'png' } : {}
    });
    if (!generated.ok) {
      return res.status(generated.status || 500).json({ error: imageErrorMessage(generated) });
    }
    const imageUrl = imageFromBody(generated.body);
    if (!imageUrl) {
      return res.status(500).json({ error: 'No image data returned from OpenAI' });
    }

    return res.status(200).json({
      imageUrl,
      prompt: enhancedPrompt,
      model: generated.model,
      animated: false
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// ── AI battle maps ───────────────────────────────────────────────────────────

// Stop with a clear message before the 60 s function limit kills the call.
const MAP_DEADLINE_MS = 55000;

// Tests replace the upload; everything else goes through the real code.
let uploadMap = uploadToStorage;
export function setMapUploaderForTests(fn) { uploadMap = fn || uploadToStorage; }

async function openaiJson(res) {
  const text = await res.text().catch(() => '');
  try { return JSON.parse(text); } catch { return { error: { message: text.slice(0, 300) } }; }
}

/**
 * type 'ai-map': generate a new map from a description, or — with an
 * `instruction` and the current `imageUrl` — refine an existing one.
 * The image is returned as a storage URL: a 2560x1440 image is too big for
 * Vercel's 4.5 MB response cap as inline base64.
 */
async function handleAiMap(req, res) {
  const request = readMapRequest(req.body);
  if (request.error) return res.status(400).json({ error: request.error });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: 'Map generation is not configured: OPENAI_API_KEY is not set on the server.' });
  const bucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;
  if (!bucket) return res.status(500).json({ error: 'Storage bucket is not configured on the server.' });

  const refining = !!request.instruction;
  if (refining && !isAllowedAssetUrl(request.imageUrl)) {
    return res.status(400).json({ error: 'Only maps saved in this app can be refined.' });
  }
  const prompt = refining
    ? buildRefinePrompt({ instruction: request.instruction })
    : buildMapPrompt({ description: request.description, style: request.style, lighting: request.lighting, artStyle: request.artStyle, artStyleCustom: request.artStyleCustom });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAP_DEADLINE_MS);
  try {
    let source = null;
    if (refining) {
      const imgRes = await fetch(request.imageUrl, { signal: controller.signal });
      if (!imgRes.ok) return res.status(400).json({ error: `Couldn't load the map to refine (${imgRes.status}).` });
      source = new Blob([await imgRes.arrayBuffer()], { type: imgRes.headers.get('content-type') || 'image/png' });
    }

    const send = async ({ model, size }) => {
      const common = { model, prompt, size, quality: request.quality, n: 1, output_format: 'jpeg', output_compression: 90 };
      let r;
      if (refining) {
        const form = new FormData();
        Object.entries(common).forEach(([k, v]) => form.append(k, String(v)));
        form.append('image', source, 'map.png');
        r = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST', headers: { Authorization: `Bearer ${openaiKey}` }, body: form, signal: controller.signal
        });
      } else {
        r = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify(common),
          signal: controller.signal
        });
      }
      return { ok: r.ok, status: r.status, body: await openaiJson(r) };
    };

    const result = await runModelChain(modelChain(request.premium), send);
    if (!result?.ok) {
      const message = result?.body?.error?.message || 'unknown error';
      return res.status(result?.status && result.status < 500 ? result.status : 502).json({ error: `The map couldn't be made: ${message}` });
    }
    const b64 = result.body?.data?.[0]?.b64_json;
    if (!b64) return res.status(502).json({ error: 'The image model returned no picture. Try again.' });

    const path = mapStoragePath(request.campaignId);
    const imageUrl = await uploadMap({ bucket, path, bytes: Buffer.from(b64, 'base64'), idToken: bearerToken(req), contentType: 'image/jpeg' });
    return res.status(200).json({
      imageUrl,
      storagePath: path,
      width: result.step.width,
      height: result.step.height,
      model: result.step.model,
      prompt
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'The map took too long to paint. Try again, or use Standard quality for a faster map.' });
    }
    if (err?.status === 403) return res.status(403).json({ error: 'Only the DM can save maps to this campaign.' });
    console.error('[ai-map]', err);
    return res.status(500).json({ error: `The map couldn't be made: ${err?.message || 'unknown error'}` });
  } finally {
    clearTimeout(timer);
  }
}
