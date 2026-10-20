/**
 * Book layout — turns the chronicle into a printable book.
 *
 * Pure data shaping, no React: the Book Press view renders what this returns,
 * and the smoke tests check it directly. Printing goes through the browser's
 * own "Save as PDF" — Chromium paginates with the @page rules from pageCss(),
 * embeds the fonts, and keeps images at full resolution, which a 60-second
 * serverless function returning a 4.5 MB response couldn't do for a whole book.
 */

import { interleaveProseAndScenes } from '../components/Storybook/cinematicTimeline';
import { mentionedEntityIds } from './storybookCast';
import { stripWikiLinks } from './campaignMemory';

// Margins follow print-on-demand norms: Lulu and KDP ask for at least 0.5in
// all round, and the inside (gutter) edge needs more so text doesn't vanish
// into the binding.
export const TRIM_SIZES = [
  { key: '6x9',     label: '6 × 9 in — classic novel',   width: 6,   height: 9,  fontPt: 11,   margins: { top: 0.75, bottom: 0.8, inside: 0.8, outside: 0.6 } },
  { key: '5.5x8.5', label: '5.5 × 8.5 in — digest',      width: 5.5, height: 8.5, fontPt: 10.5, margins: { top: 0.7, bottom: 0.75, inside: 0.75, outside: 0.55 } },
  { key: '8.5x11',  label: '8.5 × 11 in — illustrated',  width: 8.5, height: 11, fontPt: 12.5, margins: { top: 0.9, bottom: 0.95, inside: 1.0, outside: 0.8 } }
];

export const ILLUSTRATION_SIZES = [
  // Scene art is 1024px square, which is exactly 300 DPI at ~3.4in.
  { key: 'crisp', label: 'Crisp (prints at 300 DPI)' },
  { key: 'full',  label: 'Full text width (larger, softer)' }
];

const SCENE_ART_PX = 1024;
const IDEAL_DPI = 300;

export const DEFAULT_BOOK_SETTINGS = {
  title: '',
  subtitle: '',
  byline: '',
  dedication: '',
  trim: '6x9',
  illustrations: 'crisp',
  includeIllustrations: true,
  includeCast: true,
  includeContents: true,
  includeJournals: true,
  excludedChapterIds: []
};

export function trimFor(key) {
  return TRIM_SIZES.find(t => t.key === key) || TRIM_SIZES[0];
}

/** Saved settings merged over the defaults, with the campaign name as the fallback title. */
export function normalizeBookSettings(saved, campaign) {
  const s = { ...DEFAULT_BOOK_SETTINGS, ...(saved || {}) };
  if (!s.title) s.title = campaign?.name || 'The Chronicle';
  if (!TRIM_SIZES.some(t => t.key === s.trim)) s.trim = DEFAULT_BOOK_SETTINGS.trim;
  if (!ILLUSTRATION_SIZES.some(i => i.key === s.illustrations)) s.illustrations = DEFAULT_BOOK_SETTINGS.illustrations;
  if (!Array.isArray(s.excludedChapterIds)) s.excludedChapterIds = [];
  return s;
}

/** Width of the text block in inches — what a full-width illustration fills. */
export function textWidthIn(trim) {
  return +(trim.width - trim.margins.inside - trim.margins.outside).toFixed(2);
}

/** Printed width of a scene illustration in inches. */
export function illustrationWidthIn(settings) {
  const trim = trimFor(settings.trim);
  const full = textWidthIn(trim);
  if (settings.illustrations === 'full') return full;
  return Math.min(full, +(SCENE_ART_PX / IDEAL_DPI).toFixed(2));
}

/** Effective print resolution of an image this many pixels wide, printed this wide. */
export function printDpi(pixelWidth, printedWidthIn) {
  if (!pixelWidth || !printedWidthIn) return 0;
  return Math.round(pixelWidth / printedWidthIn);
}

/**
 * Everything the book needs, in reading order.
 *
 * Chapters run by chapterNumber (the order the Reorder dialog sets), numbered
 * afresh so leaving one out doesn't leave a gap. Only published chapters are
 * bound — drafts aren't the story yet.
 */
export function buildBook({ chapters = [], characters = [], npcs = [], journalsByChapter = {}, settings }) {
  const excluded = new Set(settings.excludedChapterIds || []);
  const bound = chapters
    .filter(c => c && c.status === 'published' && !excluded.has(c.id))
    .sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

  const bookChapters = bound.map((c, i) => {
    const paragraphs = stripWikiLinks(c.prose || '').split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    const scenes = settings.includeIllustrations
      ? (c.scenes || []).filter(s => s?.imageUrl)
      : [];
    const journal = settings.includeJournals
      ? (journalsByChapter[c.id] || [])
          .filter(e => e?.content?.trim())
          .map(e => ({ id: e.id, name: e.characterName || e.authorName || 'A traveller', content: stripWikiLinks(e.content.trim()) }))
      : [];
    return {
      id: c.id,
      number: i + 1,
      title: c.title || `Chapter ${i + 1}`,
      blocks: interleaveProseAndScenes(paragraphs, scenes),
      journal
    };
  });

  return {
    chapters: bookChapters,
    cast: settings.includeCast ? buildCast({ chapters: bound, characters, npcs }) : { heroes: [], others: [] },
    players: characters
      .filter(c => c?.name && c.playerName?.trim())
      .map(c => ({ player: c.playerName.trim(), character: c.name }))
  };
}

/**
 * Who appears in the bound chapters: the party, then everyone else they met.
 *
 * A character counts if a chapter features or spotlights them, or names them
 * in its prose. The fallen are kept — a hero who died in chapter nine is still
 * in the book.
 */
export function buildCast({ chapters = [], characters = [], npcs = [] }) {
  const ids = new Set();
  chapters.forEach(c => {
    (c.spotlights || []).forEach(s => s?.entityId && ids.add(s.entityId));
    (c.scenes || []).forEach(s => (s?.featuredEntityIds || []).forEach(id => ids.add(id)));
  });
  const prose = chapters.map(c => c.prose || '').join('\n\n');
  const living = characters.map(c => ({ ...c, deceased: false }));
  mentionedEntityIds({ characters: living, npcs }, prose).forEach(id => ids.add(id));

  const heroes = characters
    .filter(c => c?.name && ids.has(c.id))
    .map(c => ({
      id: c.id,
      name: c.name,
      portraitUrl: c.avatarUrl || null,
      line: [c.ancestry, c.subclass, c.characterClass || c.class].filter(Boolean).join(' '),
      player: c.playerName?.trim() || '',
      deceased: !!c.deceased
    }));
  const others = npcs
    .filter(n => n?.name && ids.has(n.id) && !n.hidden)
    .map(n => ({
      id: n.id,
      name: n.name,
      portraitUrl: n.avatarUrl || null,
      line: [n.ancestry, n.occupation].filter(Boolean).join(' ')
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { heroes, others };
}

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

/** "Chapter Seven" reads better in print than "Chapter 7"; past twenty, numerals. */
export function chapterLabel(n) {
  return `Chapter ${NUMBER_WORDS[n] || n}`;
}

// A 6x9 page of 11pt Garamond holds roughly 300 words; other trims scale by text area.
const WORDS_PER_6X9_PAGE = 300;

/**
 * Rough page count, for the "is this long enough to bind?" check. The browser
 * decides the real breaks; this only has to be in the right neighbourhood.
 */
export function estimatePages(book, settings) {
  const t = trimFor(settings.trim);
  const area = (w, h, m) => (w - m.inside - m.outside) * (h - m.top - m.bottom);
  const base = trimFor('6x9');
  const scale = (area(t.width, t.height, t.margins) / area(base.width, base.height, base.margins)) * Math.pow(11 / t.fontPt, 2);
  const perPage = WORDS_PER_6X9_PAGE * scale;
  const illusPages = settings.illustrations === 'full' ? 0.6 : 0.45;

  let pages = 2 + (settings.dedication ? 1 : 0) + (settings.includeContents ? 1 : 0);
  const castCount = book.cast.heroes.length + book.cast.others.length;
  if (castCount) pages += Math.ceil(castCount / 8);
  book.chapters.forEach(c => {
    let words = 0;
    let scenes = 0;
    c.blocks.forEach(b => { if (b.kind === 'p') words += b.value.split(/\s+/).length; else scenes += 1; });
    c.journal.forEach(e => { words += e.content.split(/\s+/).length; });
    // Chapters open a third of the way down a fresh page.
    pages += Math.ceil(words / perPage + scenes * illusPages + 0.35);
  });
  return pages;
}

export function wordCount(book) {
  let words = 0;
  book.chapters.forEach(c => c.blocks.forEach(b => { if (b.kind === 'p') words += b.value.split(/\s+/).length; }));
  return words;
}

const cssString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ')}"`;

/**
 * @page rules for the chosen trim. Mirrored margins (wider gutter on the
 * binding side), folios at the foot, the book title in the head of left-hand
 * pages, and a "front" named page for front matter with no folio or header.
 */
export function pageCss(settings) {
  const t = trimFor(settings.trim);
  const m = t.margins;
  const folio = `font-family: 'Book Garamond', Georgia, serif; font-size: ${Math.max(8, t.fontPt - 2)}pt; color: #444;`;
  return `
@page {
  size: ${t.width}in ${t.height}in;
  margin: ${m.top}in ${m.outside}in ${m.bottom}in ${m.inside}in;
  @bottom-center { content: counter(page); ${folio} }
}
@page :left {
  margin: ${m.top}in ${m.inside}in ${m.bottom}in ${m.outside}in;
  @top-center { content: ${cssString((settings.title || '').toUpperCase())}; ${folio} letter-spacing: 0.15em; font-size: ${Math.max(7, t.fontPt - 3)}pt; }
}
@page front {
  @bottom-center { content: none; }
  @top-center { content: none; }
}
`;
}
