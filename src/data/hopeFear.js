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
export const HF_CLASSES = {
  'Assassin': {
    domains: ['Blade', 'Midnight'],
    baseEvasion: 12,
    baseHp: 5,
    description: 'Masters of inflicting deadly injuries with precise strikes, who approach death as a profession.',
    features: 'Marked for Death, infiltration, burst damage',
    hopeFeature: { name: 'Deadly Determination', description: 'Spend 3 Hope to clear 2 Stress.' },
    classFeatures: [
      { name: 'Marked for Death', description: "On a successful weapon attack, mark a Stress to make the target Marked for Death. When you deal damage to a target you've Marked for Death, add a number of d4s equal to your tier to the damage roll. You can have only one adversary Marked for Death at a time; it lasts until you take a rest, the marked adversary is defeated, or the GM spends Fear equal to your tier to clear it." },
      { name: 'Get In & Get Out', description: 'Spend a Hope to ask the GM for a quick or inconspicuous way into or out of a place you can see. The next roll you make that acts on this information has advantage.' },
    ],
  },
  'Brawler': {
    domains: ['Valor', 'Bone'],
    baseEvasion: 10,
    baseHp: 6,
    description: 'Experts in unarmed combat who hone their bodies into lethal weapons.',
    features: 'Brawler’s Strike, Combo Die, martial versatility',
    hopeFeature: { name: 'Square Up', description: 'Spend 3 Hope to intimidate a target within Close range, making them temporarily Vulnerable.' },
    classFeatures: [
      { name: 'I Am the Weapon', description: 'You have a primary weapon called Brawler’s Strike equipped while you have no other Active Weapons. It uses a trait of your choice, has Melee range, and deals d8+d6 physical damage using your Proficiency (both dice scale off Proficiency). While it is active, you gain a +1 bonus to Evasion.' },
      { name: 'Combo Strike', description: 'After rolling damage on a successful Melee attack, mark a Stress to start a combo strike: roll your Combo Die, then keep rolling until a result is lower than the previous roll. Deal extra damage equal to the total of all Combo Die results (unmodifiable). Your Combo Die starts as a d4; once per tier you can increase it one step as a level-up option.' },
    ],
  },
  'Warlock': {
    domains: ['Dread', 'Grace'],
    baseEvasion: 11,
    baseHp: 5,
    description: 'Those who’ve traded their lives, or even their souls, to an otherworldly patron in exchange for incredible power.',
    features: 'Patron’s Pact, Favor, Patron Die',
    hopeFeature: { name: 'Patron’s Boon', description: 'When you fail a roll, you can spend 3 Hope to reroll with advantage.' },
    classFeatures: [
      { name: 'Patron’s Pact', description: 'You’ve committed to a supernatural entity in exchange for power. Name them and work with your GM to determine their sphere of influence. Before an action roll relating to that sphere, spend a Favor to roll your Patron Die and add its result. Your Patron Die starts at d6 and increases to d8 at level 5.' },
      { name: 'Favor', description: 'You start with 3 Favor. Use a downtime move to show tribute to your patron and gain Favor equal to your Spellcast trait. Additionally, when you succeed on an action roll with Hope, you can gain a Favor instead of a Hope.' },
    ],
  },
  'Witch': {
    domains: ['Sage', 'Dread'],
    baseEvasion: 10,
    baseHp: 6,
    description: 'Magical practitioners who commune with the forces of nature and entities from realms beyond, treading the boundary between light and shadow.',
    features: 'Hex, Commune, coven craft',
    hopeFeature: { name: 'Witch’s Charm', description: 'When you or an ally within Far range fails an action roll, you can spend 3 Hope to change it into a success with Fear instead.' },
    classFeatures: [
      { name: 'Hex', description: 'Mark a Stress to temporarily Hex a target within Far range. While Hexed, the target gains a penalty to their damage rolls and Difficulty equal to your tier. The maximum number of creatures you can Hex at once equals your Spellcast trait.' },
      { name: 'Commune', description: 'Once per long rest during a moment of calm, commune with an ancestor, deity, spirit, or otherworldly being. Ask them a question, then roll a number of d6s equal to your Spellcast trait and choose one of the results to determine how helpful and truthful their answer is.' },
    ],
  },
};

// ── Subclasses ── same shape as SUBCLASSES: className → [{ name, description,
// spellcastTrait?, foundation: {name, description}, specialization: {...},
// mastery: {...} }]
export const HF_SUBCLASSES = {
  'Assassin': [
    {
      name: 'Executioners Guild',
      description: 'Play the Executioners Guild if you want to strike down your targets with lethal precision.',
      spellcastTrait: 'Agility',
      foundation: { name: 'First Strike / Ambush', description: 'First Strike: The first time in a scene you succeed on an attack, you deal double damage. Ambush: Your "Marked for Death" feature uses d6s instead of d4s.' },
      specialization: { name: 'Death Strike / Scorpion’s Poise', description: 'Death Strike: When you deal Severe damage to a creature, mark a Stress to force them to mark an additional Hit Point. Scorpion’s Poise: You gain a +2 bonus to Evasion against attacks made by a creature you’ve Marked for Death.' },
      mastery: { name: 'True Strike / Backstab', description: 'True Strike: Once per long rest when you fail an attack, spend a Hope to make it a success instead. Backstab: Your "Marked for Death" feature uses d8s instead of d6s.' },
    },
    {
      name: 'Poisoners Guild',
      description: 'Play the Poisoners Guild if you want to debilitate your targets with punishing afflictions.',
      spellcastTrait: 'Knowledge',
      foundation: { name: 'Toxic Concoctions', description: 'Mark a Stress to place 1d4+1 tokens on this card. On a successful weapon attack, spend a token to afflict the target with a poison you know — Ghost Petal (temporarily Vulnerable), Grave Spore (also mark a Stress), or Leech Weed (deal an extra 1d6 damage). Clear unspent tokens on a long rest.' },
      specialization: { name: 'Poison Compendium / Twin Fang', description: 'Poison Compendium: You also know Midnight Vine (disadvantage on attacks until it marks a Stress to clear) and Gorgon Root (temporarily Restrained). Twin Fang: When you afflict a target Marked for Death, spend an additional token to also inflict a second poison you know.' },
      mastery: { name: 'Venomancer / Adder’s Blessing', description: 'Venomancer: You also know Blight Seed (−3 to damage thresholds until end of scene, no stacking), Fear Leaf (extra damage equal to your Fear Die), and Corpse Thorn (disadvantage on reaction rolls until end of scene). Adder’s Blessing: You are immune to poisons and other toxins.' },
    },
  ],
  'Brawler': [
    {
      name: 'Juggernaut',
      description: 'Play the Juggernaut if you want to pulverize your opponents with crushing blows.',
      foundation: { name: 'Rugged / Overwhelm', description: 'Rugged: Gain a permanent +3 bonus to your Severe damage threshold. Overwhelm: When you succeed on an attack, spend a Hope to throw the target within Close range or force them to mark a Stress.' },
      specialization: { name: 'Surrounded / Eye for an Eye', description: 'Surrounded: When you attack with a Melee weapon, spend any number of Hope to target an equal number of additional creatures within Melee range. Eye for an Eye: Once per rest when an adversary within Melee range forces you to mark Hit Points, mark a Stress to force them to mark the same number.' },
      mastery: { name: 'Pummeljoy', description: 'When you critically succeed on a Melee weapon attack, gain an additional Hope, clear an additional Stress, and gain a +1 bonus to Proficiency for that attack.' },
    },
    {
      name: 'Martial Artist',
      description: 'Play the Martial Artist if you want to use a variety of fighting styles to eliminate your foes.',
      foundation: { name: 'Stance Fighter', description: 'Shift into martial stances that grant combat benefits, fueled by Focus (once per rest, clear your Focus track and roll d6s equal to Instinct, gaining Focus equal to the highest; max 6). Take the Martial Stances sheet and choose two Tier 1 stances; gain another of your tier or lower each level. Tier 1: Favored (+damage equal to a chosen trait), Invigorating (roll d4 on a hit, gain Focus on a 4), Quick (spend Focus or mark Stress to hit another creature in range), Reliable (+1 attack rolls).' },
      specialization: { name: 'Keen Defenses / Focus Cannon', description: 'Keen Defenses: When targeted by an attack, spend a Focus to gain a bonus to Evasion equal to your tier against it. Focus Cannon: Spend a Focus to make an Instinct Roll against an adversary within Far range; on a success, deal d20+3 magic damage using your Proficiency.' },
      mastery: { name: 'Limit Breaker / Flow State', description: 'Limit Breaker: Once per rest, perform an unbelievable athletic feat without rolling; gain a Hope and clear a Stress. Flow State: Mark a Stress instead of spending Focus to shift stances, or spend a Focus instead of marking a Stress to start a combo strike.' },
    },
  ],
  'Warlock': [
    {
      name: 'Pact of the Endless',
      description: 'Play the Pact of the Endless if you want to stand strong against enemies and avoid death.',
      spellcastTrait: 'Presence',
      foundation: { name: 'Patron’s Mantle / Deathless Embrace', description: 'Patron’s Mantle: Spend a Favor to cloak yourself in a terrifying aspect of your Patron until you take Severe damage or the scene ends; gain a bonus to damage thresholds equal to your tier and advantage on rolls to intimidate. Deathless Embrace: Once per rest, spend any number of Favor to roll an equal number of Patron Dice; for each 4+, clear a Hit Point.' },
      specialization: { name: 'Harrowing Invocation / Damage Sink', description: 'Harrowing Invocation: When an adversary targets you or an ally within Very Close range, spend a Favor to give them disadvantage; if they fail, they also mark a Stress. Damage Sink: Once per rest, spend a Favor to halve incoming damage.' },
      mastery: { name: 'Dark Aegis / Draining Bane', description: 'Dark Aegis: Once per long rest when you would take damage, spend a Favor instead of marking Hit Points. Draining Bane: When an adversary targets you or an ally within Very Close range, spend a Favor to Drain them — they mark a Stress, you clear a Stress, and while Drained they use a d12 instead of a d20 for attack rolls until they fail a roll.' },
    },
    {
      name: 'Pact of the Wrathful',
      description: 'Play the Pact of the Wrathful if you want to destroy those who act against you.',
      spellcastTrait: 'Presence',
      foundation: { name: 'Patron’s Fury / Deadly Vengeance', description: 'Patron’s Fury: Spend a Favor to imbue your attacks with your Patron’s power until you deal Severe damage or the scene ends; when you roll damage, also roll Patron Dice equal to your tier and add their total. Deadly Vengeance: When you mark Hit Points from an attack, spend a Favor to roll an equal number of Patron Dice; for each 4+, the attacker marks a Hit Point.' },
      specialization: { name: 'Menacing Reach / Diminish My Foes', description: 'Menacing Reach: Spend a Favor to increase your primary weapon’s range by one step (max Very Far) until you make a successful attack with it. Diminish My Foes: When you succeed with Hope against a target, spend any number of Favor to force them to mark an equal number of Stress.' },
      mastery: { name: 'Fearsome Attack / Otherworldly Ire', description: 'Fearsome Attack: Spend a Favor to reroll any number of your damage dice; keep spending Favor to reroll again. Otherworldly Ire: Once per rest when you take damage, spend any number of Favor to roll that many Patron Dice and target creatures within Close range equal to the highest result; each marks a Hit Point.' },
    },
  ],
  'Witch': [
    {
      name: 'Hedge',
      description: 'Play the Hedge if you want to use your craft to empower yourself and your party.',
      spellcastTrait: 'Knowledge',
      foundation: { name: 'Herbal Remedies / Enchanted Talisman', description: 'Herbal Remedies: When you or an ally clears 1+ Hit Points or Stress from a consumable, increase the number cleared by 1. Enchanted Talisman: Once per rest, imbue a small item — spend any number of Hope to place an equal number of tokens; when the holder takes damage, spend a token to reduce Hit Points marked by one. Clear tokens on a rest.' },
      specialization: { name: 'Walk Between Worlds / Vexing Malison', description: 'Walk Between Worlds: During a moment of calm, make a Spellcast Roll (13); once per rest on a success, mark a Stress to converse with nearby spirits (tokens equal to Spellcast trait, one removed per answer). Vexing Malison: You have advantage on attacks against Hexed creatures.' },
      mastery: { name: 'Circle of Power', description: 'Once per rest, mark a Very Close circle around you and place tokens equal to your Spellcast trait. While within it, you and allies gain +2 to damage thresholds, attack rolls, and Evasion. Remove a token each time you or an ally in the circle makes an action roll or evades an attack; lasts until the last token is removed or you exit.' },
    },
    {
      name: 'Moon',
      description: 'Play the Moon if you want to embody celestial power to amplify your magic.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Night’s Glamour', description: 'Make a Spellcast Roll (13) to Glamour yourself in a bewitching facade. While Glamoured, you have advantage on rolls leveraging your illusory appearance, and adversaries within Close range must mark a Stress to attack you. Unless you mark a Stress to maintain it, it drops when you mark a Hit Point or deal damage.' },
      specialization: { name: 'Moonbeam / Ire of Pale Light', description: 'Moonbeam: Once per session, conjure a column of moonlight within Close range until end of scene; you and allies gain +1 to Spellcast Rolls and can see through illusions. Ire of Pale Light: When a Hexed creature within Very Far range fails an attack, they must mark a Stress.' },
      mastery: { name: 'Lunar Phases', description: 'At the start of each session, roll a d6 and place it on this card for a phase effect until end of session — 1 New (spend a Hope to negate Minor damage), 2–3 Waxing (+2 damage rolls), 4 Full (+3 damage thresholds), 5–6 Waning (+1 Evasion). Once per rest, spend a Hope to increase the die by one (a 6 becomes a 1).' },
    },
  ],
};

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
