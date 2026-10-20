// How much the writers may put into characters' mouths.
//
// Session notes rarely record what anyone actually said, and a chapter told
// entirely in paraphrase reads like a report. Each level widens what may be
// spoken while keeping one rule fixed: dialogue dramatises what happened, it
// never changes it. Shared by the Chronicle chapter writer and the Second
// Draft editor so a book reads the same all the way through.

export const DIALOGUE_LEVELS = ['faithful', 'fleshed', 'rich'];
export const DEFAULT_DIALOGUE = 'fleshed';

export function normalizeDialogue(level) {
  return DIALOGUE_LEVELS.includes(level) ? level : DEFAULT_DIALOGUE;
}

const ALWAYS = `- Lines listed as said at the table are canon: use every one, word for word, spoken by the person named, at the moment it fits. They are the best lines in the chapter — build the scene around them.
- Every line must sound like the person saying it: their voice note, and the rhythm and vocabulary of their sample lines. A blunt brute speaks in short, plain words; a scholar over-explains. A sample line may be echoed now and then, never on every page.
- Spoken lines may never add facts: no new secrets, plans, promises, confessions, backstory, names, or decisions that the notes don't support. Dialogue shows how something happened, not what happened.`;

const LEVELS = {
  faithful: `DIALOGUE — FAITHFUL
- Quote characters only where the notes give their words or plainly imply them. Otherwise tell what was said in narration.
${ALWAYS}`,
  fleshed: `DIALOGUE — FLESHED OUT
- Give the chapter's key moments spoken scenes: the argument over a plan, the bargain struck, the reaction to a discovery, the line before the blow lands. Write them as real exchanges, not summaries.
- Aim for dialogue in most scenes where people talk, with narration carrying travel and action between them.
${ALWAYS}`,
  rich: `DIALOGUE — RICH
- Everything in fleshed-out, plus the quiet moments between the big beats: banter on the road, a joke at the fire, a worry voiced on watch. These small exchanges reveal character and relationships — let the company's personalities rub against each other.
- Banter may not invent events; it can only react to what has happened and to who these people are.
${ALWAYS}`
};

/** The prompt section for a dialogue level. */
export function dialogueGuidance(level) {
  return LEVELS[normalizeDialogue(level)];
}

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
};

/** Up to five sample lines, one per line of the author's text. */
export function sampleLines(text) {
  return String(text || '')
    .split(/\n+/)
    .map(l => clip(l, 160))
    .filter(Boolean)
    .slice(0, 5);
}

/** Lines said at the table, cleaned for the prompt. */
export function tableQuoteLines(quotes) {
  return (Array.isArray(quotes) ? quotes : [])
    .filter(q => typeof q === 'string')
    .map(q => clip(q, 300))
    .filter(Boolean)
    .slice(0, 20);
}
