// One art style for a whole campaign.
//
// The storybook has always had a chosen style (watercolor, fantasy anime…),
// but every other image — portraits, monsters, locations, lore, handouts,
// maps — carried its own hard-coded look ("painterly fantasy art", "oil
// painting concept art"), so a fantasy-anime campaign got an oil-painted
// innkeeper. When a campaign turns on its art style, every image request
// carries it, and the server puts it first and tells the model it outranks
// any other style words in the prompt.
//
// The storybook preambles live here too, so there is one list of styles.

// Illustration styles: portraits, creatures, scenes, handouts.
export const ART_STYLE_PREAMBLES = {
  fantasy: {
    watercolor: 'Soft watercolor storybook illustration, washed pastel tones, loose expressive brushwork, fairytale atmosphere, painterly, no text or labels',
    oil: 'Classical oil painting fairytale illustration, rich textured brushwork, warm golden lighting, Arthur Rackham inspired, no text or labels',
    'ink-wash': 'Ink and watercolor wash storybook illustration, expressive brushstrokes, muted palette, intimate composition, no text or labels',
    illuminated: 'Illuminated manuscript illustration, gilded borders, medieval tapestry aesthetic, stylised figures, no text or labels',
    'children-storybook': "Classic children's storybook illustration, friendly line art with soft colour fills, whimsical, Tony DiTerlizzi inspired, no text or labels",
    'fantasy-anime': 'Fantasy anime illustration, bold black ink outlines, vibrant saturated colour palette, painterly cel-shaded fills with soft highlights, expressive stylised character poses, rich adventure atmosphere reminiscent of modern western-anime fantasy box art, no text or labels'
  },
  scifi: {
    watercolor: 'Soft watercolor sci-fi illustration, washed pastel tones, painterly space opera atmosphere, no text or labels',
    oil: 'Oil painting sci-fi concept illustration, textured brushwork, dramatic cinematic lighting, space opera, no text or labels',
    'ink-wash': 'Ink and watercolor wash sci-fi illustration, expressive strokes, muted palette, no text or labels',
    illuminated: 'Retro-futurist illuminated sci-fi illustration, ornamental borders, stylised figures, no text or labels',
    'children-storybook': "Classic children's storybook sci-fi illustration, friendly line art with soft colour fills, whimsical, no text or labels",
    'fantasy-anime': 'Sci-fi anime illustration, bold black ink outlines, vibrant saturated colour palette, painterly cel-shaded fills with soft highlights, expressive stylised character poses, sleek space-opera adventure atmosphere, no text or labels'
  }
};

// The same styles worded for a top-down battle map. "Expressive character
// poses" means nothing to a map, and an illuminated manuscript's gilded
// borders would frame a map the monitor needs edge to edge.
export const MAP_ART_STYLES = {
  watercolor: 'a soft watercolor battle map: washed pastel tones, loose brushwork textures on the ground, a gentle fairytale feel',
  oil: 'an oil-painted battle map: rich textured brushwork, warm golden light, classic fantasy illustration colours',
  'ink-wash': 'an ink-and-wash battle map: confident ink linework with muted watercolour washes',
  illuminated: 'a battle map in the colours and ornament of an illuminated manuscript — rich jewel tones and gold accents in the terrain itself, with no border or frame',
  'children-storybook': "a children's storybook battle map: friendly clean line art with soft colour fills, whimsical shapes",
  'fantasy-anime': 'a fantasy anime battle map, like a top-down background painting from a modern fantasy anime: clean ink outlines, cel-shaded colour regions with soft highlights, a vibrant saturated palette'
};

export const ART_STYLE_KEYS = Object.keys(ART_STYLE_PREAMBLES.fantasy);

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
};

/**
 * The preamble for an illustration, or '' when the campaign has no style.
 * `custom` is the author's own description, used when the key is 'custom'.
 */
export function artStylePreamble({ artStyle, artStyleCustom, gameSystem } = {}) {
  if (!artStyle) return '';
  if (artStyle === 'custom') return artStyleCustom ? clip(artStyleCustom, 400) : '';
  const set = gameSystem === 'starwarsd6' ? ART_STYLE_PREAMBLES.scifi : ART_STYLE_PREAMBLES.fantasy;
  return set[artStyle] || '';
}

/** The campaign style worded for a battle map, or '' when there is none. */
export function mapArtStyle({ artStyle, artStyleCustom } = {}) {
  if (!artStyle) return '';
  if (artStyle === 'custom') return artStyleCustom ? `a battle map in this art style: ${clip(artStyleCustom, 400)}` : '';
  return MAP_ART_STYLES[artStyle] || '';
}

// Style words the older prompt builders bake in. With a campaign style they
// would argue with it, so they are taken out before the style goes in front.
const COMPETING_STYLE_WORDS = [
  /\b(?:detailed )?fantasy art style\b/gi,
  /\bpainterly(?: quality| style)?\b/gi,
  /\boil painting(?: style)?\b/gi,
  /\b(?:epic )?fantasy concept art\b/gi,
  /\bconcept art\b/gi,
  /\bphoto-?realistic\b/gi,
  /\bdetailed sci-fi art style\b/gi,
  /\bhigh detail fantasy illustration\b/gi,
  /\bhigh detail fantasy style\b/gi
];

export function stripCompetingStyle(prompt) {
  let out = String(prompt || '');
  COMPETING_STYLE_WORDS.forEach(re => { out = out.replace(re, ''); });
  // Tidy the punctuation the removals leave behind.
  return out.replace(/\s*,\s*(?:,\s*)+/g, ', ').replace(/\(\s*,\s*/g, '(').replace(/^\s*[,.]\s*/, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * An image prompt in the campaign's style: the style first, stated as the
 * rule, then the subject with any competing style words removed. Prompts
 * pass through untouched when the campaign has no style.
 */
export function applyArtStyle(prompt, opts = {}) {
  const preamble = artStylePreamble(opts);
  if (!preamble) return prompt;
  return `Art style (use this style only, and ignore any other style words below): ${preamble}.\n\n${stripCompetingStyle(prompt)}`;
}

/** The same, for a battle map: the map wording of the style goes first. */
export function applyMapArtStyle(prompt, opts = {}) {
  const look = mapArtStyle(opts);
  if (!look) return prompt;
  return `Art style (use this style only, and ignore any other style words below): ${look}.\n\n${stripCompetingStyle(prompt)}`;
}
