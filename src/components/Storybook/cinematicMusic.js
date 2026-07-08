/**
 * cinematicMusic — mood-matched soundtrack for the Motion Comic.
 *
 * Scores a timeline against the curated music library's themes: each slide's
 * text is scanned for mood keywords, and the recap is split into "movements"
 * — a new segment starts when the mood clearly changes; slides with no strong
 * signal inherit the current mood so the music doesn't flap between tracks.
 * Track choice within a theme is a deterministic hash of chapter + segment,
 * so a chapter always sounds the same but different chapters (and different
 * movements) vary.
 */

import { MUSIC_LIBRARY, getTrackUrl } from '../../data/musicLibrary';

const THEME_KEYWORDS = [
  // order matters — first match wins. Victory outranks battle so "defeated the
  // warband" scores as triumph, not more combat. `war` is bounded ("\bwar(s)?\b",
  // warband/warrior listed explicitly) so warm/ward/warden never read as battle.
  { theme: 'victory',  re: /\b(victor\w*|triumph\w*|defeated the|vanquish\w*|celebrat\w*|rejoic\w*|peace returned|saved the|heroes return\w*|won the)/i },
  { theme: 'battle',   re: /\b(battl\w*|fight\w*|fought|clash\w*|attack\w*|charg(?:e|es|ed|ing)|siege\w*|combat\w*|wars?\b|warfare|warband\w*|warrior\w*|sword\w*|blade\w*|axes?\b|arrows?\b|strik(?:e|es|ing)|struck|slay\w*|slain|skirmish\w*|duel\w*|ambush\w*)/i },
  { theme: 'tension',  re: /\b(dread\w*|ominous|demon\w*|undead|lich\w*|horror\w*|corrupt\w*|lurk\w*|stalk\w*|terror\w*|evil\w*|doom\w*|ritual of|sacrific\w*|blood\w*|curse[sd]?\b|nightmare\w*)/i },
  { theme: 'tavern',   re: /\b(tavern\w*|inn\b|ale\b|feast\w*|drink\w*|toast\w*|festival\w*|market\w*|merriment|bard's song|supper)/i },
  { theme: 'mystical', re: /\b(magic\w*|arcan\w*|spell\w*|fey\b|spirit\w*|dream\w*|portal\w*|enchant\w*|prophec\w*|vision\w*|gods?\b|goddess\w*|divine|astral|wizard\w*|sorcer\w*)/i },
  { theme: 'mystery',  re: /\b(myster\w*|secret\w*|clue[s]?\b|whisper\w*|hidden|intrigue\w*|investigat\w*|riddle\w*|shadowy figure|hooded|disappear\w*)/i },
];

/** Detect an explicit mood in free-form text, or null when nothing stands out. */
export function pickThemeForText(text) {
  const t = String(text || '');
  for (const { theme, re } of THEME_KEYWORDS) {
    if (re.test(t)) return theme;
  }
  return null;
}

// Small stable string hash (djb2) for deterministic track choice.
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Build the movement list for a timeline.
 * @param {Array} slides - cinematicTimeline slides
 * @param {string} seed  - usually the chapter id (stable per chapter)
 * @returns {Array<{ start: number, theme: string, track: string, url: string }>}
 */
export function buildScore(slides, seed = '') {
  const segments = [];
  let currentTheme = null;
  (slides || []).forEach((s, i) => {
    const explicit = pickThemeForText(s.text);
    const theme = explicit || currentTheme || 'exploration';
    if (!segments.length || theme !== currentTheme) {
      segments.push({ start: i, theme });
      currentTheme = theme;
    }
  });
  segments.forEach((seg, si) => {
    const pool = MUSIC_LIBRARY[seg.theme] || MUSIC_LIBRARY.exploration;
    seg.track = pool[hash(`${seed}:${si}:${seg.theme}`) % pool.length];
    seg.url = getTrackUrl(seg.track);
  });
  return segments;
}

/** The movement covering a given slide index. */
export function segmentAt(segments, slideIndex) {
  let match = null;
  for (const seg of segments || []) {
    if (seg.start <= slideIndex) match = seg;
    else break;
  }
  return match;
}

/**
 * Flatten a score into scheduled spans for the WebM exporter.
 * @returns {Array<{ url: string, startSec: number, durationSec: number }>}
 */
export function musicPlanFor(segments, slides) {
  const starts = [];
  let acc = 0;
  (slides || []).forEach((s, i) => { starts[i] = acc; acc += s.duration || 0; });
  const total = acc;
  return (segments || []).map((seg, si) => {
    const startSec = starts[seg.start] ?? 0;
    const endSec = si + 1 < segments.length ? (starts[segments[si + 1].start] ?? total) : total;
    return { url: seg.url, startSec, durationSec: Math.max(0, endSec - startSec) };
  }).filter(p => p.durationSec > 0.5);
}
