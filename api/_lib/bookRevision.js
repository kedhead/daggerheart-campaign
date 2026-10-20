// The Second Draft: rewriting a chronicle chapter as a chapter of a novel.
//
// Chronicle chapters are written one session at a time, so none of them knows
// how the story ends. The second draft is written with the whole book in view
// (an outline of every chapter, the DM's list of threads that pay off later,
// and each character's voice), which is what lets it foreshadow, keep people
// in character, and end chapters on a pull into the next.
//
// Pure prompt building and response checking, so the smoke tests can cover it.

import { dialogueGuidance, sampleLines, tableQuoteLines } from './dialogue.js';

const MAX_PROSE_CHARS = 24000;
const MAX_OUTLINE_ITEMS = 60;

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
};

/**
 * @param {object} p
 * @param {{ number: number, title: string, prose: string }} p.chapter
 * @param {Array<{ number: number, title: string, summary: string }>} p.outline - every chapter in the book, in order
 * @param {string} [p.previousEnding] - the last lines of the chapter before
 * @param {string} [p.nextOpening]    - the first lines of the chapter after
 * @param {Array<{ name: string, voice: string }>} [p.voices]
 * @param {string} [p.threads]  - the DM's notes on what the story builds to
 * @param {string} [p.gameSystem]
 */
export function buildRevisionPrompt({ chapter, outline = [], previousEnding = '', nextOpening = '', voices = [], threads = '', quotes = [], dialogue, gameSystem = 'daggerheart' }) {
  const genre = gameSystem === 'starwarsd6' ? 'space opera' : 'high fantasy';
  const total = outline.length;
  const isFinal = total > 0 && chapter.number === outline[outline.length - 1].number;

  const system = `You are the editor turning a tabletop campaign's chronicle into a published ${genre} novel. You are revising ONE chapter of it — the second draft, written now that the whole story is known.

THE JOB
- Keep every event, decision, outcome, and named person, place, and thing from the original chapter, in the same order. Nothing that happened may be removed, reversed, or contradicted, and nothing major may be invented: no new characters, deaths, betrayals, places, or plot events.
- Remove the game. No dice, rolls, Hope or Fear tokens, stress, hit points, damage numbers, levels, classes used as job titles, "short rest", "the GM", or anything else that reads as rules. Turn each into the story it stood for (a lucky break, a desperate gamble, exhaustion, a wound).
- Foreshadow. Use the book outline and the threads below to plant small, subtle hints of what is coming — an image, an unease, a line of dialogue that will mean more later. Never reveal or spoil a later event outright, and never refer to future chapters.
- Keep characters in voice. Where a voice note is given, every line of that character's dialogue, choice, and inner thought must fit it. Show it; never restate the note.
- Keep continuity with the chapters around it: pick up from how the previous chapter ended, and ${isFinal ? 'as this is the final chapter, close the story with a resonant ending.' : 'end on a hook — an unanswered question, a turn, or a moment of tension that pulls the reader into the next chapter.'}
- Write like a novel: past tense, third person, vivid and specific, varied rhythm. You may deepen moments, interiority, atmosphere, and transitions, and the chapter may grow by up to half again its length — but don't pad.
- Keep the chapter's title unless it gives away a later twist.

${dialogueGuidance(dialogue)}
- Lines already quoted in the original text were said at the table or chosen by the author: keep them word for word.

OUTPUT
Return JSON: {"title": "...", "prose": "...", "notes": ["...", "..."]}
- prose: the full revised chapter as paragraphs separated by blank lines. No headings, no lists, no markdown other than *italics* for emphasis.
- notes: 3–6 short lines telling the author what you changed and why (e.g. "Planted the silver ring Mara pockets — it pays off in chapter 9").`;

  const outlineLines = outline.slice(0, MAX_OUTLINE_ITEMS).map(o =>
    `${o.number === chapter.number ? '→ ' : '  '}${o.number}. ${clip(o.title, 80)} — ${clip(o.summary, o.number === outline[outline.length - 1]?.number ? 600 : 260)}`
  );

  const voiceLines = voices
    .filter(v => v && v.name && (v.voice || v.lines))
    .slice(0, 20)
    .map(v => {
      const lines = sampleLines(v.lines);
      const said = lines.length ? `Sample lines: ${lines.map(l => `"${l.replace(/^["“]|["”]$/g, '')}"`).join(' / ')}` : '';
      return `- ${clip(v.name, 60)}: ${[clip(v.voice || '', 400), said].filter(Boolean).join(' ')}`;
    });
  const quoteLines = tableQuoteLines(quotes);

  const user = [
    `# The book (${total} chapter${total === 1 ? '' : 's'}; → marks this one)`,
    outlineLines.join('\n') || '(outline unavailable)',
    threads.trim() ? `\n# Threads the story builds to (from the author)\n${clip(threads, 2000)}` : '',
    voiceLines.length ? `\n# Character voices\n${voiceLines.join('\n')}` : '',
    quoteLines.length ? `\n# Said at the table during this chapter — use every line word for word\n${quoteLines.map(q => `- ${q}`).join('\n')}` : '',
    previousEnding ? `\n# How the previous chapter ended\n${clip(previousEnding, 700)}` : '',
    nextOpening ? `\n# How the next chapter opens\n${clip(nextOpening, 500)}` : '',
    `\n# Chapter ${chapter.number}: ${clip(chapter.title, 120)} — original text to revise\n${String(chapter.prose || '').slice(0, MAX_PROSE_CHARS)}`,
    '\nReturn ONLY the JSON object.'
  ].filter(Boolean).join('\n');

  return { system, user };
}

const words = (s) => (String(s || '').trim().match(/\S+/g) || []).length;

/**
 * Check the model's answer. A second draft much shorter than the original has
 * almost certainly dropped events, so it is flagged for the author rather than
 * trusted.
 */
export function parseRevision(raw, original) {
  let parsed;
  try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return { error: 'The editor returned something unreadable. Try again.' }; }
  const prose = typeof parsed?.prose === 'string' ? parsed.prose.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : '';
  if (!prose) return { error: 'The editor returned an empty chapter. Try again.' };
  const notes = (Array.isArray(parsed.notes) ? parsed.notes : [])
    .filter(n => typeof n === 'string' && n.trim())
    .map(n => clip(n, 300))
    .slice(0, 8);
  const ratio = words(original) ? words(prose) / words(original) : 1;
  return {
    title: typeof parsed.title === 'string' && parsed.title.trim() ? clip(parsed.title, 120) : '',
    prose,
    notes,
    shrunk: ratio < 0.7
  };
}

/**
 * The epilogue: where everyone ended up. Written from the outline of the
 * whole book, the final chapter's closing, and the cast — so it can resolve
 * threads without inventing a different ending.
 *
 * @param {object} p
 * @param {Array<{ number, title, summary }>} p.outline
 * @param {string} p.finale - the closing paragraphs of the last chapter
 * @param {Array<{ name, line, voice, fallen }>} p.cast
 */
export function buildEpiloguePrompt({ outline = [], finale = '', cast = [], threads = '', guidance = '', gameSystem = 'daggerheart' }) {
  const genre = gameSystem === 'starwarsd6' ? 'space opera' : 'high fantasy';
  const system = `You are writing the epilogue of a ${genre} novel made from a tabletop campaign: a closing chapter set some time after the final events, telling where each member of the company ended up.

- Stay true to everything that happened. Don't contradict the story, bring back the fallen, or invent new villains or adventures. You may imagine quiet, believable futures that grow from who each person was and what they lived through.
- Give each member of the company a moment of their own, in their own voice where one is noted. Remember the fallen with weight.
- Pay off the threads the author lists, if the story left them open.
- No game terms: no dice, levels, classes as titles, Hope or Fear.
- 500 to 900 words, past tense, novel prose, paragraphs separated by blank lines. End on an image that lingers.

Return JSON: {"title": "...", "prose": "..."}`;

  const user = [
    `# The book`,
    outline.slice(0, MAX_OUTLINE_ITEMS).map(o => `${o.number}. ${clip(o.title, 80)} — ${clip(o.summary, 260)}`).join('\n') || '(no outline)',
    finale ? `\n# How the final chapter ends\n${clip(finale, 1500)}` : '',
    cast.length ? `\n# The company\n${cast.slice(0, 12).map(c =>
      `- ${clip(c.name, 60)}${c.line ? ` (${clip(c.line, 80)})` : ''}${c.fallen ? ' — fell during the story' : ''}${c.voice ? `. Voice: ${clip(c.voice, 300)}` : ''}`
    ).join('\n')}` : '',
    threads.trim() ? `\n# Threads the story built to\n${clip(threads, 1500)}` : '',
    guidance.trim() ? `\n# The author's wishes for the epilogue\n${clip(guidance, 1000)}` : '',
    '\nReturn ONLY the JSON object.'
  ].filter(Boolean).join('\n');

  return { system, user };
}

/** Back-cover copy: sells the story without giving the ending away. */
export function buildBlurbPrompt({ outline = [], cast = [], title = '', gameSystem = 'daggerheart' }) {
  const genre = gameSystem === 'starwarsd6' ? 'space opera' : 'fantasy';
  // The blurb only needs the setup; the back half of the book is where the spoilers live.
  const setup = outline.slice(0, Math.max(1, Math.ceil(outline.length * 0.4)));
  const system = `You write back-cover copy for ${genre} novels. Write the blurb for this one.

- 110 to 170 words. Present tense. Open with a hook line, introduce the company and what's at stake, and close on a question or a promise.
- Sell the story; never reveal how it ends or any late twist. You only know the opening chapters on purpose.
- No game terms. No quotation marks around the title.

Return JSON: {"blurb": "..."} — paragraphs separated by blank lines.`;
  const user = [
    title ? `# Title\n${clip(title, 120)}` : '',
    `# How the story opens`,
    setup.map(o => `${o.number}. ${clip(o.title, 80)} — ${clip(o.summary, 300)}`).join('\n') || '(no chapters)',
    cast.length ? `\n# The company\n${cast.slice(0, 8).map(c => `- ${clip(c.name, 60)}${c.line ? ` (${clip(c.line, 60)})` : ''}`).join('\n')}` : '',
    '\nReturn ONLY the JSON object.'
  ].filter(Boolean).join('\n');
  return { system, user };
}
