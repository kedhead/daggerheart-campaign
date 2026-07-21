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
export const HF_DOMAIN_CARDS = [
  // ── Dread domain (21 cards: 3 at L1, 2 each L2-L10) ──
  { name: 'Blighting Strike', domain: 'Dread', level: 1, type: 'Spell', recallCost: 1, description: "Make a Spellcast Roll against a target within Far range. On a success: on a roll with Hope, deal d6+1 magic damage using your Proficiency; on a roll with Fear, deal d10+1 magic damage using your Proficiency. The target's next successful attack deals half damage. On a failure, you must spend a Hope or mark a Stress." },
  { name: 'Umbral Veil', domain: 'Dread', level: 1, type: 'Spell', recallCost: 1, description: "Once per rest, mark a Stress to encase yourself in shadowy energy. Place tokens on this card equal to the number of Fear in the GM's pool. After an attack roll is made against you, spend any number of tokens to give the result a −1 penalty per token spent. At the end of the scene, clear all unspent tokens." },
  { name: 'Voice of Dread', domain: 'Dread', level: 1, type: 'Spell', recallCost: 0, description: "You can magically speak to a creature you can see, tormenting them with your words. Make a Spellcast Roll against them. On a success, they must mark a Stress and are frozen with terror, making them temporarily Restrained." },
  { name: 'Hideous Retribution', domain: 'Dread', level: 2, type: 'Spell', recallCost: 2, description: "When an ally within Close range takes damage from a target you can see, make a reaction roll against the target using your Spellcast trait. On a success, mark a Stress to deal d6 magic damage using your Proficiency." },
  { name: 'Siphon Essence', domain: 'Dread', level: 2, type: 'Spell', recallCost: 1, description: "Make a Spellcast Roll against a target within Very Close range. Once per long rest on a success, the target takes d12+4 magic damage using your Proficiency. On a success with Fear, gain a +1 bonus to your Proficiency for this attack. You clear a number of Hit Points equal to the number the target marked from this attack." },
  { name: 'Shared Trauma', domain: 'Dread', level: 3, type: 'Spell', recallCost: 1, description: "You can transfer suffering from one creature to another. Once per rest, mark any number of Hit Points on a willing creature within Melee range to clear an equal number of Hit Points on another willing creature within Melee range." },
  { name: 'Terrify', domain: 'Dread', level: 3, type: 'Spell', recallCost: 1, description: "Make a Spellcast Roll against a target within Close range. On a success, the target marks 1d4 Stress, and you can make them flee one range away from you. On a success with Fear, the target also becomes temporarily Vulnerable." },
  { name: 'Chains of Affliction', domain: 'Dread', level: 4, type: 'Spell', recallCost: 2, description: "Mark 2 Stress to temporarily Chain a target within Close range. When a Chained creature deals damage, the target of their attack marks one fewer Hit Point than they normally would. You can't have more than one creature Chained at a time." },
  { name: 'Summon Horror', domain: 'Dread', level: 4, type: 'Spell', recallCost: 2, description: "Mark a Stress to summon an otherworldly creature that deals d8+1 magic damage using your Spellcast trait to a target within Far range. If the target marks any Hit Points, they must succeed on a Reaction Roll (12) or mark an equal number of Stress. After the attack, the creature dissipates." },
  { name: 'Dire Strike', domain: 'Dread', level: 5, type: 'Spell', recallCost: 2, description: "When a target marks any number of Hit Points from an attack you make, you can spend a Hope to drain power from them. The GM loses a Fear." },
  { name: 'Spectral Mist', domain: 'Dread', level: 5, type: 'Spell', recallCost: 0, description: "Spend 2 Hope to conjure an eerie mist that turns you and allies of your choice within Close range momentarily incorporeal. While incorporeal, they can move through solid objects and are immune to physical damage. They become corporeal again after passing through a solid object or making an action roll; otherwise this lasts until the end of the scene." },
  { name: 'Darkfire', domain: 'Dread', level: 6, type: 'Spell', recallCost: 2, description: "Spend any number of Hope to target an equal number of adversaries within Close range. Each target makes a Reaction Roll (15). Targets who fail take d8+6 magic damage using your Spellcast trait as they are engulfed in dark fire. Targets who succeed take half damage." },
  { name: 'Jump Scare', domain: 'Dread', level: 6, type: 'Spell', recallCost: 1, description: "When you deal magic damage to a target, you can mark a Stress to teleport into Melee range with them. When you do, they are Vulnerable until they mark 1 or more Hit Points." },
  { name: 'Dread-Touched', domain: 'Dread', level: 7, type: 'Ability', recallCost: 2, description: "When 4 or more of the domain cards in your loadout are from the Dread domain, gain the following: when you succeed with Fear, you can mark 2 Stress to prevent the GM from gaining a Fear; and once per rest when making an action roll, you can gain a bonus to the roll equal to the number of Fear in the GM's pool." },
  { name: 'Wall of Hunger', domain: 'Dread', level: 7, type: 'Spell', recallCost: 2, description: "Make a Spellcast Roll (10). On a success, spend a Hope to create a visible wall of writhing necrotic energy between two points within Far range. The wall lasts until you mark a Hit Point or cast this spell again. A creature inside the wall when it appears or that passes through it must mark 2 Stress." },
  { name: 'Dark Army', domain: 'Dread', level: 8, type: 'Spell', recallCost: 2, description: "Make a Spellcast Roll (14). Once per long rest on a success, summon fiends that surround and move with you. Place 8 tokens on this card. When you deal damage to a target within Very Close range, spend any number of tokens to add 1d8 each to your damage roll. When you take damage, spend any number of tokens to reduce it by 1d8 each. Each token spent, a fiend acts on your behalf, then disappears. On a rest, clear all unspent tokens." },
  { name: 'Eldritch Flesh', domain: 'Dread', level: 8, type: 'Spell', recallCost: 1, description: "Gain a +1 bonus to your damage thresholds for each Stress you have marked. Additionally, when you roll with Fear, you can spend 2 Hope to clear an Armor Slot." },
  { name: 'Damnation', domain: 'Dread', level: 9, type: 'Spell', recallCost: 2, description: "Make a Spellcast Roll against a target within Far range. On a success, mark any number of Stress to roll an equal number of d20s, dealing magic damage equal to the total result. If this attack defeats the target, all adversaries within Far range of the target must mark a Stress." },
  { name: 'Savor the Anguish', domain: 'Dread', level: 9, type: 'Spell', recallCost: 1, description: "When an adversary within Close range takes Severe damage, you can clear a Stress." },
  { name: 'Avatar of Terror', domain: 'Dread', level: 10, type: 'Spell', recallCost: 2, description: "Mark a Stress to transform into a creature fueled by fear. While in this form, gain a 1d6 bonus to your damage rolls for each Fear in the GM's pool, and gain a Hope when the GM spends a Fear to spotlight an adversary within Very Close range. Before you make an action roll, you must spend a Hope; if you can't, you revert to your normal form." },
  { name: 'Invoke Torment', domain: 'Dread', level: 10, type: 'Spell', recallCost: 2, description: "You deal double damage to targets that have all their Stress marked. Additionally, when an adversary within Close range is defeated with all its Stress marked, you gain a Hope." },
];

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
