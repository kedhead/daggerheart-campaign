// The Second Draft: rewriting a chronicle chapter as a chapter of a novel.
//
// Chronicle chapters are written one session at a time, so none of them knows
// how the story ends. The second draft is written with the whole book in view
// (an outline of every chapter, the DM's list of threads that pay off later,
// and each character's voice), which is what lets it foreshadow, keep people
// in character, and end chapters on a pull into the next.
//
// Pure prompt building and response checking, so the smoke tests can cover it.

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
export function buildRevisionPrompt({ chapter, outline = [], previousEnding = '', nextOpening = '', voices = [], threads = '', gameSystem = 'daggerheart' }) {
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
- Write like a novel: past tense, third person, vivid and specific, varied rhythm, dialogue where it serves. You may deepen moments, interiority, atmosphere, and transitions, and the chapter may grow by up to half again its length — but don't pad.
- Keep the chapter's title unless it gives away a later twist.

OUTPUT
Return JSON: {"title": "...", "prose": "...", "notes": ["...", "..."]}
- prose: the full revised chapter as paragraphs separated by blank lines. No headings, no lists, no markdown other than *italics* for emphasis.
- notes: 3–6 short lines telling the author what you changed and why (e.g. "Planted the silver ring Mara pockets — it pays off in chapter 9").`;

  const outlineLines = outline.slice(0, MAX_OUTLINE_ITEMS).map(o =>
    `${o.number === chapter.number ? '→ ' : '  '}${o.number}. ${clip(o.title, 80)} — ${clip(o.summary, o.number === outline[outline.length - 1]?.number ? 600 : 260)}`
  );

  const voiceLines = voices
    .filter(v => v && v.name && v.voice)
    .slice(0, 20)
    .map(v => `- ${clip(v.name, 60)}: ${clip(v.voice, 400)}`);

  const user = [
    `# The book (${total} chapter${total === 1 ? '' : 's'}; → marks this one)`,
    outlineLines.join('\n') || '(outline unavailable)',
    threads.trim() ? `\n# Threads the story builds to (from the author)\n${clip(threads, 2000)}` : '',
    voiceLines.length ? `\n# Character voices\n${voiceLines.join('\n')}` : '',
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
