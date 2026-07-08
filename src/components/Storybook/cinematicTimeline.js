/**
 * Cinematic timeline for the Storybook "Motion Comic" recap.
 *
 * Builds a slide list from a chapter that BOTH renderers consume:
 *  - CinematicPlayer.jsx  (DOM/CSS playback)
 *  - cinematicExporter.js (canvas → WebM export)
 *
 * Slide shape:
 * {
 *   kind: 'title' | 'scene' | 'prose' | 'credits',
 *   cast: Array|undefined,    // credits only: [{name, entityType, portraitUrl, moment}]
 *   imageUrl: string|null,   // backdrop (scenes own image; prose reuses last scene)
 *   videoUrl: string|null,   // AI-animated clip for the backdrop, when generated
 *   sceneKey: string|null,   // key into chapter.sceneVideos (scene slides only)
 *   text: string,            // caption / paragraph / chapter title
 *   duration: number,        // seconds
 *   pan: { fromScale, toScale, fromX, fromY, toX, toY },  // % offsets for Ken Burns
 *   fx: string,              // ambient particle effect (see cinematicFX.js)
 *   narrationUrl: string|null
 * }
 */

import { pickEffectForText } from './cinematicFX';

// Also used by ChapterReader to lay out the printed page — kept here so the
// reader and the recap always agree on scene placement.
export function interleaveProseAndScenes(paragraphs, scenes) {
  if (!scenes || scenes.length === 0) {
    return paragraphs.map(p => ({ kind: 'p', value: p }));
  }
  if (!paragraphs || paragraphs.length === 0) {
    return scenes.map(s => ({ kind: 'scene', value: s }));
  }

  // Decide after which paragraph each scene should appear.
  // Evenly spaced: scene i after paragraph floor(i * P / (S+1)) + 1.
  const P = paragraphs.length;
  const S = scenes.length;
  const boundaries = new Map(); // paragraphIdx -> scene[]
  for (let i = 0; i < S; i++) {
    const after = Math.max(1, Math.min(P, Math.floor(((i + 1) * P) / (S + 1))));
    const list = boundaries.get(after) || [];
    list.push(scenes[i]);
    boundaries.set(after, list);
  }

  const out = [];
  paragraphs.forEach((p, idx) => {
    out.push({ kind: 'p', value: p });
    const here = boundaries.get(idx + 1);
    if (here) here.forEach(sc => out.push({ kind: 'scene', value: sc }));
  });
  return out;
}

// Deterministic Ken Burns motion per slide index — alternating drift so
// consecutive slides never move the same way.
function panFor(index) {
  const variants = [
    { fromScale: 1.02, toScale: 1.14, fromX: -2, fromY: -1, toX: 2, toY: 2 },
    { fromScale: 1.15, toScale: 1.04, fromX: 3, fromY: 2, toX: -2, toY: -1 },
    { fromScale: 1.03, toScale: 1.13, fromX: 2, fromY: -2, toX: -2, toY: 1 },
    { fromScale: 1.14, toScale: 1.03, fromX: -3, fromY: 1, toX: 2, toY: -2 },
  ];
  return variants[index % variants.length];
}

// Reading-pace duration when there's no narration to time against.
export function defaultSlideDuration(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.min(12, Math.round(words / 2.8)));
}

/**
 * @param {object} chapter   - { title, prose, scenes: [{id, imageUrl, caption}] }
 * @param {Array=} narration - chapter.narration: [{ index, url, duration }]
 *                             `index` refers to the slide index in this timeline.
 * @returns {Array} slides
 */
export function buildTimeline(chapter, narration = null) {
  if (!chapter) return [];
  const paragraphs = (chapter.prose || '').split(/\n\n+/).filter(p => p.trim());
  const scenes = (chapter.scenes || []).filter(s => s?.imageUrl);
  const blocks = interleaveProseAndScenes(paragraphs, scenes);

  const slides = [];
  const sceneVideos = chapter.sceneVideos || {};
  // Key a scene into chapter.sceneVideos by its id, falling back to its
  // position for chapters authored before scenes carried ids.
  const keyFor = (scene, order) => scene.id || `s${order}`;
  const firstScene = scenes[0] || null;
  const firstImage = firstScene?.imageUrl || null;
  const firstVideo = firstScene ? sceneVideos[keyFor(firstScene, 0)]?.url || null : null;

  // Title card
  slides.push({
    kind: 'title',
    imageUrl: firstImage,
    videoUrl: firstVideo,
    sceneKey: null,
    text: chapter.title || 'Untitled Chapter',
    duration: 4,
    pan: panFor(0),
    fx: 'sparkles',
    narrationUrl: null,
  });

  let currentImage = firstImage;
  let currentVideo = firstVideo;
  let sceneOrder = 0;
  blocks.forEach((blk) => {
    const i = slides.length;
    if (blk.kind === 'scene') {
      const sceneKey = keyFor(blk.value, sceneOrder);
      sceneOrder += 1;
      currentImage = blk.value.imageUrl || currentImage;
      currentVideo = sceneVideos[sceneKey]?.url || null;
      slides.push({
        kind: 'scene',
        imageUrl: blk.value.imageUrl,
        videoUrl: currentVideo,
        sceneKey,
        text: blk.value.caption || '',
        duration: defaultSlideDuration(blk.value.caption || 'scene beat here'),
        pan: panFor(i),
        fx: pickEffectForText(blk.value.caption),
        narrationUrl: null,
      });
    } else {
      slides.push({
        kind: 'prose',
        imageUrl: currentImage,
        videoUrl: currentVideo,
        sceneKey: null,
        text: blk.value,
        duration: defaultSlideDuration(blk.value),
        pan: panFor(i),
        fx: pickEffectForText(blk.value),
        narrationUrl: null,
      });
    }
  });

  // Closing credits from the chapter's Dramatis Personae spotlights — the
  // recap ends like a film instead of stopping dead on the last paragraph.
  // text stays empty so narration generation skips this slide.
  const cast = (chapter.spotlights || []).filter(s => s?.name);
  if (cast.length > 0) {
    slides.push({
      kind: 'credits',
      imageUrl: null,
      videoUrl: null,
      sceneKey: null,
      text: '',
      cast: cast.map(s => ({
        name: s.name,
        entityType: s.entityType || '',
        portraitUrl: s.portraitUrl || null,
        moment: s.moment || '',
      })),
      duration: Math.max(6, Math.min(15, 3 + cast.length * 1.5)),
      pan: panFor(slides.length),
      fx: 'dust',
      narrationUrl: null,
    });
  }

  // Attach cached narration + narration-driven durations
  if (Array.isArray(narration)) {
    narration.forEach(({ index, url, duration }) => {
      const slide = slides[index];
      if (!slide || !url) return;
      slide.narrationUrl = url;
      if (Number.isFinite(duration) && duration > 0.5) {
        slide.duration = Math.max(slide.kind === 'title' ? 3 : 4, duration + 0.8);
      }
    });
  }

  return slides;
}

/** Total runtime in seconds (for the progress bar / export estimates). */
export function timelineDuration(slides) {
  return (slides || []).reduce((sum, s) => sum + (s.duration || 0), 0);
}

/**
 * Slides whose text should be voiced by AI narration: the title card and the
 * story prose. Scene captions are plate labels — displayed under the art but
 * never read aloud (narrating "Mata Palo stands in the corrupted cavern"
 * between story paragraphs breaks the tale). Credits are always silent.
 */
export function narratableSlides(slides) {
  return (slides || [])
    .map((s, i) => ({ i, text: s.text, kind: s.kind }))
    .filter(s =>
      s.text && s.text.trim().length > 1 &&
      s.kind !== 'scene' && s.kind !== 'credits'
    );
}
