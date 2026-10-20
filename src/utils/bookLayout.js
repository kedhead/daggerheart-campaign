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
import { mentionedEntityIds, nameAppearsIn } from './storybookCast';
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
  useSecondDraft: true,
  threads: '',
  includeEpilogue: true,
  includeGlossary: true,
  epilogue: null,          // { title, prose, createdAt } once written
  epilogueGuidance: '',
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
export function buildBook({ chapters = [], characters = [], npcs = [], locations = [], lore = [], journalsByChapter = {}, settings }) {
  const bound = bindableChapters(chapters, settings);

  const bookChapters = bound.map((c, i) => {
    const useDraft = settings.useSecondDraft !== false && c.bookDraft?.status === 'accepted' && c.bookDraft.prose;
    const paragraphs = stripWikiLinks(useDraft ? c.bookDraft.prose : (c.prose || '')).split(/\n\n+/).map(p => p.trim()).filter(Boolean);
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
      title: (useDraft && c.bookDraft.title) || c.title || `Chapter ${i + 1}`,
      blocks: interleaveProseAndScenes(paragraphs, scenes),
      journal
    };
  });

  const bookProse = bookChapters
    .map(c => c.blocks.filter(b => b.kind === 'p').map(b => b.value).join('\n\n'))
    .join('\n\n');
  const epilogue = settings.includeEpilogue && settings.epilogue?.prose?.trim()
    ? { title: settings.epilogue.title || 'Epilogue', paragraphs: paras(settings.epilogue.prose) }
    : null;

  return {
    chapters: bookChapters,
    epilogue,
    glossary: settings.includeGlossary
      ? buildGlossary({ text: `${bookProse}\n\n${epilogue ? epilogue.paragraphs.join('\n\n') : ''}`, locations, lore })
      : [],
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
  const illusPages = settings.illustrations === 'full' ? 0.45 : 0.3;

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
  if (book.epilogue) pages += Math.ceil(book.epilogue.paragraphs.join(' ').split(/\s+/).length / perPage + 0.35);
  if (book.glossary?.length) pages += Math.ceil(book.glossary.length / (10 * scale));
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

// ── Second Draft ─────────────────────────────────────────────────────────────

/** A short fingerprint of a chapter's text, so a draft knows if its original changed. */
export function proseFingerprint(prose) {
  let h = 5381;
  const t = String(prose || '');
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return `${t.length}:${(h >>> 0).toString(36)}`;
}

/**
 * Where a chapter's second draft stands: 'none', 'review' (written, waiting
 * for the author), 'accepted', or 'stale' (the chronicle text was edited
 * after the draft was written, so the draft may no longer match it).
 */
export function draftStatus(chapter) {
  const d = chapter?.bookDraft;
  if (!d?.prose) return 'none';
  if (d.basedOn && d.basedOn !== proseFingerprint(chapter.prose)) return 'stale';
  return d.status === 'accepted' ? 'accepted' : 'review';
}

const paras = (prose) => stripWikiLinks(prose || '').split(/\n\n+/).map(p => p.trim()).filter(Boolean);

/** First and last beats of a chapter, for the outline the editor sees. */
function summarize(prose) {
  const p = paras(prose);
  if (p.length <= 2) return p.join(' ');
  return `${p.slice(0, 2).join(' ')} … ${p[p.length - 1]}`;
}

/** The text a neighbour contributes: its accepted draft if there is one, so drafts chain together. */
function bookText(chapter) {
  return chapter.bookDraft?.status === 'accepted' && chapter.bookDraft.prose ? chapter.bookDraft.prose : chapter.prose;
}

/**
 * Everything the editor needs to revise one chapter of the book: the outline
 * of the whole book, the seams with the chapters either side, and the voices
 * of whoever appears in it.
 *
 * @param {Array} bound - the chapters in the book, in order (see bindableChapters)
 */
export function revisionContext({ bound, index, characters = [], npcs = [], threads = '' }) {
  const chapter = bound[index];
  const prev = bound[index - 1];
  const next = bound[index + 1];

  const ids = new Set();
  (chapter.spotlights || []).forEach(s => s?.entityId && ids.add(s.entityId));
  (chapter.scenes || []).forEach(s => (s?.featuredEntityIds || []).forEach(id => ids.add(id)));
  const living = characters.map(c => ({ ...c, deceased: false }));
  mentionedEntityIds({ characters: living, npcs }, chapter.prose || '').forEach(id => ids.add(id));
  const voices = [...characters, ...npcs]
    .filter(e => e?.name && e.storyVoice?.trim() && ids.has(e.id))
    .map(e => ({ name: e.name, voice: e.storyVoice.trim() }));

  return {
    chapter: { number: index + 1, title: chapter.title || '', prose: stripWikiLinks(chapter.prose || '') },
    outline: bound.map((c, i) => ({ number: i + 1, title: c.title || '', summary: summarize(c.prose) })),
    previousEnding: prev ? paras(bookText(prev)).slice(-2).join('\n\n') : '',
    nextOpening: next ? paras(next.prose)[0] || '' : '',
    voices,
    threads
  };
}

/** The chapters the book binds, in order — the same rule buildBook uses. */
export function bindableChapters(chapters = [], settings) {
  const excluded = new Set(settings?.excludedChapterIds || []);
  return chapters
    .filter(c => c && c.status === 'published' && !excluded.has(c.id))
    .sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));
}

// ── Back matter ──────────────────────────────────────────────────────────────

const firstSentences = (text, max = 220) => {
  const t = stripWikiLinks(text || '').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return stop > max * 0.4 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};

/**
 * The glossary: the places and lore the book actually mentions, with a line
 * or two from their entries. Hidden entries stay out — they're the DM's.
 */
export function buildGlossary({ text = '', locations = [], lore = [] }) {
  const seen = new Set();
  const entries = [
    ...locations.map(l => ({ term: l.name, kind: l.type || 'Place', desc: l.description, hidden: l.hidden || l.dmOnly })),
    ...lore.map(l => ({ term: l.title, kind: l.type || 'Lore', desc: l.content, hidden: l.hidden || l.dmOnly }))
  ];
  return entries
    .filter(e => e.term?.trim() && !e.hidden && nameAppearsIn(e.term.trim(), text))
    .filter(e => {
      const k = e.term.trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map(e => ({
      term: e.term.trim(),
      kind: e.kind.charAt(0).toUpperCase() + e.kind.slice(1),
      definition: firstSentences(e.desc)
    }))
    .sort((a, b) => a.term.localeCompare(b.term));
}

/** What the epilogue writer gets: the book's outline, how it ends, and the company. */
export function epilogueContext({ bound, characters = [], threads = '', guidance = '' }) {
  const last = bound[bound.length - 1];
  const appears = new Set(buildCast({ chapters: bound, characters }).heroes.map(h => h.id));
  return {
    outline: bound.map((c, i) => ({ number: i + 1, title: c.title || '', summary: summarize(c.prose) })),
    finale: last ? paras(bookText(last)).slice(-3).join('\n\n') : '',
    cast: characters
      .filter(c => c?.name && appears.has(c.id))
      .map(c => ({
        name: c.name,
        line: [c.ancestry, c.characterClass || c.class].filter(Boolean).join(' '),
        voice: c.storyVoice?.trim() || '',
        fallen: !!c.deceased
      })),
    threads,
    guidance
  };
}
