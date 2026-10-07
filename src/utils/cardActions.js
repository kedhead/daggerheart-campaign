// What a domain card (or class feature) lets you DO, read from its rules text.
//
// Before this, every Spell got a "Cast" button whether or not it called for a
// roll (34 don't), cards that call for a Strength or Agility Roll got nothing,
// the dice button rolled only the first dice expression on the card, and
// nothing paid a card's Hope or Stress cost or tracked "once per long rest".
// This turns the text into the actions it describes. Pure — no React, no
// Firebase — so it can be checked against every card in the rulebook.
//
// Actions:
//   { kind: 'spellcast', difficulty, reaction }        Spellcast Roll (reaction: Counterspell-style)
//   { kind: 'trait', trait, difficulty }                Strength Roll, Agility Roll…
//   { kind: 'dice', quantity, dieType, modifier, scale, label }
//                                                       scale: 'proficiency' | 'spellcast' | 'tier' | null
//   { kind: 'hope', amount }                            "spend a Hope", "spend 2 Hope"
//   { kind: 'stress', amount }                          "mark a Stress"
//   { kind: 'uses', per }                               "once per long rest" (per: long rest | short rest | rest | session)
//   { kind: 'tokens' }                                  cards that place tokens

import { SUBCLASSES, getTierForLevel } from '../data/systems/daggerheart.js';
import { effectiveTraits, rollBonusesFor } from '../data/daggerheartAbilityEffects.js';
import { normalizeHopeSlots, usableHopeMax, usableHopeFilled } from './daggerheartHope.js';
import { stressSlotsOf } from './daggerheartVitals.js';

const WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };
const TRAITS = ['Strength', 'Agility', 'Finesse', 'Instinct', 'Presence', 'Knowledge'];

const amountOf = (w) => WORDS[String(w).toLowerCase()] ?? (parseInt(w, 10) || 0);

// Costs the CHARACTER pays — not ones the text imposes on a target or an ally
// ("force them to mark 2 Stress", "an ally can spend a Hope"). A ward's
// "holder" (Rune Ward) is usually you, so that one is offered.
function paidBySomeoneElse(text, index) {
  const before = text.slice(Math.max(0, index - 40), index).toLowerCase();
  return /\b(them|they|target|targets|adversar\w*|enem\w*|creature|ally|allies|it|each|others?)\b[^.;:]*$/.test(before)
    && !/\byou\b[^.;:]*$/.test(before.slice(-14));
}

function costs(text, word) {
  // "spend up to 3 Hope" is paid one at a time, so it offers "Spend 1 Hope".
  const re = new RegExp(`\\b(?:spend|mark)\\s+(?:(up to)\\s+)?(a|an|one|two|three|four|five|\\d+)\\s+${word}\\b`, 'gi');
  const amounts = new Set();
  for (const m of text.matchAll(re)) {
    const verb = m[0].toLowerCase().startsWith('spend') ? 'spend' : 'mark';
    if (word === 'Hope' && verb !== 'spend') continue;
    if (word === 'Stress' && verb !== 'mark') continue;
    if (paidBySomeoneElse(text, m.index)) continue;
    const n = m[1] ? 1 : amountOf(m[2]);
    if (n > 0) amounts.add(n);
  }
  return [...amounts].sort((a, b) => a - b);
}

function diceActions(text) {
  const out = [];
  const seen = new Set();
  const re = /\b(\d+)?d(4|6|8|10|12|20)(s?)(?:\s*\+\s*(\d+))?/g;
  for (const m of text.matchAll(re)) {
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 60);
    const near = text.slice(m.index + m[0].length, m.index + m[0].length + 90);
    let scale = null;
    if (/^[^.]*?(?:using|equal to)\s+your\s+Proficiency/i.test(near)) scale = 'proficiency';
    else if (/^[^.]*?equal to your (?:subclass's )?Spellcast trait/i.test(near)) scale = 'spellcast';
    else if (/^[^.]*?equal to your tier\b/i.test(near)) scale = 'tier';
    // "that many d10s" / "a number of d6s" with no stated count: the player
    // decides, so offer one die and let them roll again.
    const quantity = m[1] ? parseInt(m[1], 10) : 1;
    const dieType = parseInt(m[2], 10);
    const modifier = m[4] ? parseInt(m[4], 10) : 0;
    const kindWord = (after.match(/^\s*(magic|physical|direct)?\s*(damage|Hit Points?|Stress)/i) || [])[0] || '';
    const label = kindWord.trim().replace(/\s+/g, ' ');
    const key = `${scale ? scale[0] : quantity}d${dieType}+${modifier}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: 'dice', quantity, dieType, modifier, scale, label });
  }
  return out;
}

// "make a Spellcast Roll" — but not "when you (would) make a Spellcast Roll" or
// "before you make…", which describe a trigger or a bonus, not this card's roll —
// nor "without making an Agility Roll" (Deft Maneuvers).
const MAKES = (trait) =>
  new RegExp(`(?<!would |when you |whenever you |before you |after you |if you |without )\\b(?:make|makes|making)\\s+(?:a|an|the)\\s+${trait} Roll`, 'i');

function difficultyAfter(text, phrase) {
  const m = text.match(new RegExp(`${phrase}\\s*\\((\\d+)\\)`, 'i'));
  return m ? parseInt(m[1], 10) : null;
}

// "At level 1, your Rally Die is a d6. … At level 5, your Rally Die increases
// to a d8." Given the character's level, keep only the die they have now.
function dieForLevel(text, dice, level) {
  const up = text.match(/At level (\d+), your ([A-Za-z ]+? Die) increases to a d(\d+)/i);
  if (!up || !(level > 0)) return dice;
  const base = text.match(new RegExp(`your ${up[2]} is a d(\\d+)`, 'i'));
  const drop = level >= Number(up[1]) ? Number(base?.[1]) : Number(up[3]);
  return dice.filter(d => !(d.dieType === drop && d.quantity === 1 && !d.scale));
}

/**
 * The actions a piece of rules text describes, in a stable order:
 * rolls, dice, costs, then tracking. Pass the character's `level` for
 * features whose die grows with level (Rally, Unstoppable).
 */
export function parseCardActions(text, { level } = {}) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const actions = [];

  // Only when the card has you MAKE the roll — "+1 bonus to your Spellcast
  // Rolls" (Arcana-Touched) is a modifier, not a cast.
  if (MAKES('Spellcast').test(text) || /\bSpellcast Roll\s*\(\d+\)/i.test(text)) {
    actions.push({ kind: 'spellcast', difficulty: difficultyAfter(text, 'Spellcast Roll'), reaction: false });
  } else if (/\breaction roll using your Spellcast trait/i.test(text)) {
    actions.push({ kind: 'spellcast', difficulty: null, reaction: true });
  }
  for (const trait of TRAITS) {
    if (MAKES(trait).test(text) || new RegExp(`\\b${trait} Roll\\s*\\(\\d+\\)`, 'i').test(text)) {
      actions.push({ kind: 'trait', trait: trait.toLowerCase(), difficulty: difficultyAfter(text, `${trait} Roll`) });
    }
  }
  actions.push(...dieForLevel(text, diceActions(text), level));
  for (const amount of costs(text, 'Hope')) actions.push({ kind: 'hope', amount });
  for (const amount of costs(text, 'Stress')) actions.push({ kind: 'stress', amount });

  const use = text.match(/\b(?:once|twice)\s+per\s+(long rest|short rest|rest|session)\b/i);
  if (use) actions.push({ kind: 'uses', per: use[1].toLowerCase() });
  if (/\btokens?\b/i.test(text)) actions.push({ kind: 'tokens' });

  return actions;
}

/** Display text for a dice action given the character's numbers. */
export function diceFormula(action, { proficiency = 1, spellcast = 0, tier = 1 } = {}) {
  const n = action.scale === 'proficiency' ? Math.max(1, proficiency)
    : action.scale === 'spellcast' ? Math.max(1, spellcast)
    : action.scale === 'tier' ? Math.max(1, tier)
    : action.quantity;
  return `${n}d${action.dieType}${action.modifier ? `+${action.modifier}` : ''}`;
}

/**
 * Which uses to clear after a rest. A short rest refreshes "once per rest" and
 * "once per short rest"; a long rest refreshes every rest-based use. "Once per
 * session" is cleared by hand.
 */
export function usesClearedByRest(cardUses = {}, restType) {
  const next = {};
  for (const [key, entry] of Object.entries(cardUses || {})) {
    const per = entry?.per;
    const clears = restType === 'long'
      ? per === 'long rest' || per === 'short rest' || per === 'rest'
      : per === 'short rest' || per === 'rest';
    next[key] = clears ? { ...entry, used: false } : entry;
  }
  return next;
}

/**
 * A subclass feature slot can hold two features ("Unwavering / Iron Will",
 * described as "Unwavering: … Iron Will: …"). Split it so each gets its own
 * text and buttons. A single feature comes back as one part.
 */
export function featureParts(feature) {
  const name = String(feature?.name || '');
  const text = String(feature?.description || '');
  const names = name.split(' / ').map(n => n.trim()).filter(Boolean);
  if (names.length < 2) return [{ name, text }];
  const starts = names.map(n => text.indexOf(`${n}: `));
  if (starts.some(i => i < 0) || starts.some((i, k) => k > 0 && i <= starts[k - 1])) return [{ name, text }];
  return names.map((n, k) => ({
    name: n,
    text: text.slice(starts[k] + n.length + 2, k + 1 < names.length ? starts[k + 1] : text.length).trim(),
  }));
}

/** The character's tier, for "a number of d6s equal to your tier". */
export function tierOf(character) {
  return getTierForLevel(Number(character?.level) || 1);
}

// ── The character's side: modifiers and costs ─────────────────────────────

function subclassOf(cls, name) {
  return (SUBCLASSES[cls] || []).find(s => s.name === name) || null;
}

/**
 * The character's Spellcast trait (lowercase), from their subclass — or a
 * multiclass subclass when the main one has none (Guardian, Warrior). Null
 * if neither grants one.
 */
export function spellcastTraitOf(character) {
  const own = subclassOf(character?.class, character?.subclass)?.spellcastTrait;
  const mc = character?.multiclass
    ? subclassOf(character.multiclass.class, character.multiclass.subclass)?.spellcastTrait
    : null;
  const trait = own || mc;
  return trait ? trait.toLowerCase() : null;
}

/**
 * What to add to a Spellcast Roll: the Spellcast trait (with passive trait
 * bonuses such as Bone-Touched) plus passive Spellcast bonuses (Arcana-Touched).
 * The sheet's Cast button used to add nothing, and the portal's added the
 * character's highest trait.
 */
export function spellcastModifier(character) {
  const trait = spellcastTraitOf(character);
  const traits = effectiveTraits(character);
  const base = trait ? Number(traits[trait]) || 0 : 0;
  return { trait, modifier: base + (rollBonusesFor(character).spellcast || 0) };
}

/** A trait roll's modifier, passive trait bonuses included. */
export function traitModifier(character, trait) {
  return Number(effectiveTraits(character)[trait]) || 0;
}

/** Hope the character can spend right now (scars respected). */
export function hopeAvailable(character) {
  const slots = normalizeHopeSlots(character?.hopeSlots);
  return usableHopeFilled(character, slots);
}

/** Unmarked Stress slots. */
export function stressAvailable(character) {
  return stressSlotsOf(character).filter(s => !s).length;
}

/** Updates that spend `n` Hope, or null if the character can't afford it. */
export function spendHope(character, n) {
  if (!(n > 0) || hopeAvailable(character) < n) return null;
  const slots = normalizeHopeSlots(character?.hopeSlots);
  const next = [...slots];
  let left = n;
  for (let i = usableHopeMax(character, slots) - 1; i >= 0 && left > 0; i -= 1) {
    if (next[i]) { next[i] = false; left -= 1; }
  }
  return { hopeSlots: next };
}

/** Updates that mark `n` Stress, or null if there aren't enough free slots. */
export function markStress(character, n) {
  if (!(n > 0) || stressAvailable(character) < n) return null;
  const next = [...stressSlotsOf(character)];
  let left = n;
  for (let i = 0; i < next.length && left > 0; i += 1) {
    if (!next[i]) { next[i] = true; left -= 1; }
  }
  return { stressSlots: next };
}
