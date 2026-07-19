/**
 * Daggerheart: Hope & Fear (expansion, releases 2026-08-25) — content module.
 *
 * Every canonical data file (adversaries, domain cards, classes, subclasses,
 * ancestries, communities, environments, items, campaign frames) merges these
 * arrays in at module load and tags them with source 'hope-fear', so filling
 * the arrays below is the ONLY data change needed when the PDF drops. The
 * merge points, schema requirements, and UI wiring checklist live in
 * docs/HOPE_FEAR_INTEGRATION.md. Every entry is validated by the smoke tests
 * against src/data/schemas.js — run `npm test` after each batch is pasted in.
 *
 * Known contents (from Darrington Press announcements):
 *  - 4 classes: Witch, Warlock, Brawler, Assassin (2 subclasses each)
 *  - New Dread domain card set (Witch/Warlock; multiclassable)
 *  - Transformations: Vampire, Werewolf, Reanimated, Shapeshifter, Ghost, Demigod
 *  - New ancestry & community cards
 *  - 130+ adversaries, new environments, 4 campaign frames
 */

// ── Classes ── same object shape as CLASSES in systems/daggerheart.js:
// 'Witch': { domains: ['Dread', '?'], baseEvasion: 10, baseHp: 5, description,
//            features, classFeatures: [{name, description}],
//            hopeFeature: {name, description}, startingItems? }
export const HF_CLASSES = {};

// ── Subclasses ── same shape as SUBCLASSES: className → [{ name, description,
// spellcastTrait?, foundation: {name, description}, specialization: {...},
// mastery: {...} }]
export const HF_SUBCLASSES = {};

// ── Dread domain cards ── same shape as DOMAIN_CARDS entries:
// { name, domain: 'Dread', level: 1-10, type: 'Spell'|'Ability'|'Grimoire',
//   recallCost: 0-4, description }
export const HF_DOMAIN_CARDS = [];

// ── Ancestries / Communities ── same object shapes as ANCESTRIES/COMMUNITIES:
// 'Name': { description, features: [{name, description}] }
export const HF_ANCESTRIES = {};
export const HF_COMMUNITIES = {};

// ── Adversaries ── same shape as DAGGERHEART_ADVERSARIES entries:
// { name, tier: 1-4, role, description, motives, difficulty,
//   thresholds: {minor, major}, hp, stress, attack, attackName, attackRange,
//   attackDamage, experience?, features: [{name, type, description}] }
// NB: legacy threshold naming — `minor` holds the MAJOR value, `major` SEVERE.
export const HF_ADVERSARIES = [];

// ── Environments ── same shape as DAGGERHEART_ENVIRONMENTS entries:
// { name, tier, type: 'exploration'|'social'|'combat'|'traversal'|'event',
//   description, impulses, difficulty, potentialAdversaries?, features: [...] }
export const HF_ENVIRONMENTS = [];

// ── Items ── same shapes as the four arrays in daggerheartItems.js; keyed by
// which catalog they extend.
export const HF_WEAPONS = [];
export const HF_ARMOR = [];
export const HF_EQUIPMENT = [];
export const HF_CONSUMABLES = [];

// ── Campaign frames ── same shape as CAMPAIGN_FRAME_TEMPLATES entries:
// { id, name, complexity, pitch, toneAndFeel: [], themes: [], overview,
//   incitingIncident, ... }
export const HF_CAMPAIGN_FRAMES = [];

// ── Transformations ── NEW mechanic (no core equivalent). Schema decided now
// so the sheet/portal UI can be built against it on day one:
// { key: 'vampire', name: 'Vampire', description,
//   features: [{ name, description, type?: 'passive'|'action'|'reaction' }],
//   // optional mechanical hooks, applied by computeDefenses/ability layer:
//   modifiers?: { evasion?, armorScore?, hpSlots?, stressSlots?, traits? } }
export const HF_TRANSFORMATIONS = [];

// Dread domain UI identity (color/glyph used by pickers and card lists the
// moment Dread cards exist).
export const DREAD_COLOR = '#7f1d1d';
export const DREAD_GLYPH = '🕯';
