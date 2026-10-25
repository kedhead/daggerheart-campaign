// AI battle maps: the prompt, the model chain and the call to OpenAI.
//
// Maps are made for a 16:9 screen — the battle map monitor — so they are
// generated at 2560x1440 (QHD), filling a 1440p display pixel for pixel and
// upscaling cleanly to 4K. The model asked for may not exist on this
// account (the GPT Image 2.5 ids are new, and one has to be right), so a
// model or size the API rejects falls through to the next in the chain
// rather than failing the map.
//
// Kept apart from api/generate-image.js so the smoke tests can cover it
// without a network.

import { mapArtStyle, ART_STYLE_KEYS } from './artStyle.js';

export const MAP_WIDTH = 2560;
export const MAP_HEIGHT = 1440;

export const MAP_MODELS = {
  // GPT Image 2.5 Flare: OpenAI's default image model since September 2026.
  standard: 'gpt-image-2.5-flare',
  // Sunburst: the premium variant, slower, for maps worth the wait.
  premium: 'gpt-image-2.5-sunburst'
};

/** The models to try, best first, each with a size it accepts. */
export function modelChain(premium = false) {
  return [
    { model: premium ? MAP_MODELS.premium : MAP_MODELS.standard, size: `${MAP_WIDTH}x${MAP_HEIGHT}`, width: MAP_WIDTH, height: MAP_HEIGHT },
    ...(premium ? [{ model: MAP_MODELS.standard, size: `${MAP_WIDTH}x${MAP_HEIGHT}`, width: MAP_WIDTH, height: MAP_HEIGHT }] : []),
    { model: 'gpt-image-2', size: `${MAP_WIDTH}x${MAP_HEIGHT}`, width: MAP_WIDTH, height: MAP_HEIGHT },
    // gpt-image-1 tops out at 3:2; the monitor covers the difference.
    { model: 'gpt-image-1', size: '1536x1024', width: 1536, height: 1024 }
  ];
}

export const MAP_STYLES = {
  painted: 'richly painted digital fantasy art in the style of a premium virtual-tabletop map pack: hand-painted textures, crisp detail, saturated but natural colour',
  realistic: 'a realistic, highly detailed top-down render with true-to-life materials — stone, timber, water, foliage — and natural light and shadow',
  inked: 'a hand-inked tabletop map with clean confident linework and soft watercolour washes, a warm parchment-toned palette',
  grim: 'grim dark fantasy: a desaturated palette, heavy shadows, grime and wear on every surface',
  storybook: 'a whimsical storybook illustration with soft painterly shapes and a warm, inviting palette'
};

export const MAP_LIGHTING = {
  day: 'bright, even daylight with soft shadows',
  golden: 'low golden-hour sunlight with long warm shadows',
  overcast: 'flat, grey overcast light',
  night: 'cold moonlit night — deep blues, pools of shadow, a few warm light sources',
  torchlit: 'darkness lit by torches, braziers and candles casting warm, flickering pools of light',
  eerie: 'unnatural, eerie light — sickly greens or violet glows from magical sources'
};

export const MAP_QUALITY = ['medium', 'high'];

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
};

/**
 * The full image prompt for a new battle map.
 *
 * The parts that make a map usable at the table come first and are stated
 * as hard rules: straight-down view, consistent miniature scale, open space
 * to fight in, and nothing drawn over the art — the image fills the monitor
 * edge to edge, so a frame, title or grid would end up on the players' screen.
 */
export function buildMapPrompt({ description, style = 'painted', lighting = 'day', landscape = true, artStyle, artStyleCustom }) {
  const scene = clip(description, 1500);
  // 'campaign' paints the map in the campaign's own art style, so maps match
  // the portraits and storybook (a fantasy-anime campaign gets anime maps).
  const look = (style === 'campaign' && mapArtStyle({ artStyle, artStyleCustom })) || MAP_STYLES[style] || MAP_STYLES.painted;
  const light = MAP_LIGHTING[lighting] || MAP_LIGHTING.day;
  return [
    'A battle map for a tabletop roleplaying game, seen from directly overhead: a true top-down, orthographic, 90-degree bird\'s-eye view with no perspective, no tilt and no horizon.',
    `The scene: ${scene}`,
    'Make it play well: clear open ground for a fight, with cover, obstacles, elevation changes and points of interest spread across the whole frame, and paths or doorways connecting the areas.',
    'Keep one consistent real-world scale throughout, sized for human-sized miniatures on a 5-foot grid: doors, furniture, trees and rocks at believable sizes.',
    `Art style: ${look}.`,
    `Lighting: ${light}.`,
    `Composition: a full-bleed ${landscape ? '16:9 widescreen landscape' : 'image'} that fills the entire canvas edge to edge with the environment.`,
    'Do not draw any border, frame, vignette, letterboxing, title, text, labels, numbers, compass rose, legend, grid lines, watermark or interface. Do not draw any people, creatures or tokens — the map is empty, ready for the players.'
  ].join('\n');
}

/** The prompt for changing part of an existing map, keeping the rest. */
export function buildRefinePrompt({ instruction }) {
  return [
    'Edit this top-down tabletop battle map.',
    `Change: ${clip(instruction, 800)}`,
    'Keep everything else exactly as it is: the same layout, overhead viewpoint, scale, art style, colours and lighting. The result must still fill the canvas edge to edge, with no text, labels, grid lines, border, people or creatures.'
  ].join('\n');
}

/**
 * Whether an OpenAI error means "try the next model": the model doesn't
 * exist for this account, or it doesn't accept this size. Anything else —
 * a safety refusal, a bad key, a rate limit — is a real error to report.
 */
export function shouldTryNextModel(status, body) {
  const err = body?.error || {};
  const code = String(err.code || '');
  const param = String(err.param || '');
  const message = String(err.message || '').toLowerCase();
  if (status === 404 || code === 'model_not_found') return true;
  if (/model/.test(message) && /(does not exist|not found|not supported|invalid|do not have access|unknown)/.test(message)) return true;
  if (param === 'size' || param === 'model' || (/size/.test(message) && /(invalid|not supported|must be)/.test(message))) return true;
  return false;
}

/**
 * Run the request down the model chain. `send({ model, size })` does one
 * OpenAI call and returns { ok, status, body }. Returns the first success,
 * with the model that made it, or the last error.
 */
export async function runModelChain(chain, send) {
  let last = null;
  for (const step of chain) {
    const result = await send(step);
    if (result.ok) return { ...result, step };
    last = { ...result, step };
    if (!shouldTryNextModel(result.status, result.body)) break;
  }
  return last;
}

const CAMPAIGN_ID = /^[A-Za-z0-9_-]{1,128}$/;

/** Validate a map request. Returns { error } or the cleaned fields. */
export function readMapRequest(body) {
  const { campaignId, description, style, lighting, quality, premium, instruction, imageUrl, artStyle, artStyleCustom } = body || {};
  if (typeof campaignId !== 'string' || !CAMPAIGN_ID.test(campaignId)) return { error: 'A valid campaignId is required.' };
  const refine = typeof instruction === 'string' && instruction.trim();
  if (refine) {
    if (typeof imageUrl !== 'string' || !imageUrl) return { error: 'The map to refine is missing.' };
  } else if (typeof description !== 'string' || !description.trim()) {
    return { error: 'Describe the map you want.' };
  }
  return {
    campaignId,
    description: typeof description === 'string' ? description : '',
    instruction: refine ? instruction : '',
    imageUrl: refine ? imageUrl : '',
    style: (MAP_STYLES[style] || (style === 'campaign' && (ART_STYLE_KEYS.includes(artStyle) || artStyle === 'custom'))) ? style : 'painted',
    artStyle: ART_STYLE_KEYS.includes(artStyle) || artStyle === 'custom' ? artStyle : '',
    artStyleCustom: typeof artStyleCustom === 'string' ? artStyleCustom.slice(0, 400) : '',
    lighting: MAP_LIGHTING[lighting] ? lighting : 'day',
    quality: MAP_QUALITY.includes(quality) ? quality : 'high',
    premium: !!premium
  };
}

/** Where a generated map lives: the campaign's battle maps folder, which only the DM may write. */
export function mapStoragePath(campaignId, now = Date.now()) {
  return `campaigns/${campaignId}/battleMaps/ai_${now}.jpg`;
}
