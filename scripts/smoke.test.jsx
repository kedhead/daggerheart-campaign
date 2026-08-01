/**
 * Smoke tests — bundled with esbuild and run in node (see "npm test").
 * Covers: SRD data integrity, Battle Point math, adversary stat fallbacks,
 * and server-render checks for the character sheet's rules modals.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';

import { DAGGERHEART_ADVERSARIES } from '../src/data/daggerheartAdversaries.js';
import { DOMAIN_CARDS } from '../src/data/daggerheartDomainCards.js';
import { DAGGERHEART_ENVIRONMENTS } from '../src/data/daggerheartEnvironments.js';
import { getTierForLevel, getBaseProficiency, ADVANCEMENT_OPTIONS } from '../src/data/systems/daggerheart.js';
import { calculateBPBudget, calculateUsedBP, getSlotBPCost, calculateBPAdjustments } from '../src/components/Encounters/BPCalculator.jsx';
import { fallbackAdversaryStats, sanitizeDaggerheartText } from '../src/services/adversaryGenerator.js';
import { responseParser } from '../src/services/responseParser.js';
import { fuzzyMatchAdversary } from '../src/utils/adversaryNameMatch.js';
import { buildTimeline, timelineDuration, narratableSlides } from '../src/components/Storybook/cinematicTimeline.js';
import { marksForDamage } from '../src/utils/thresholdDamage.js';
import { splitCardFeatures } from '../src/utils/domainCardText.js';
import { pickEffectForText, createFX } from '../src/components/Storybook/cinematicFX.js';
import { pickThemeForText, buildScore, segmentAt, musicPlanFor } from '../src/components/Storybook/cinematicMusic.js';
import { computeDefenses } from '../src/utils/daggerheartDefenses.js';
import { useBattleMapStore } from '../src/stores/battleMapStore.js';
import { diceSpec, MAX_CONCURRENT_ROLLS, THEME_RUNES } from '../src/dice/diceSpec.js';
import { usableHopeMax, usableHopeFilled, normalizeHopeSlots, isScarredSlot } from '../src/utils/daggerheartHope.js';
import {
  findConnectedComponent,
  labelVisibleFor,
  worldSizeForScreenPx,
  screenSizeForWorld,
  MIN_TAP_RADIUS_PX
} from '../src/utils/graphCalculations.js';
import { applyDiceColors, DUALITY_SETS, PLAYER_COLORS } from '../src/dice/playerColor.js';
import { CLASSES, SUBCLASSES, ANCESTRIES, COMMUNITIES, DOMAINS } from '../src/data/systems/daggerheart.js';
import { CAMPAIGN_FRAME_TEMPLATES } from '../src/data/campaignFrameTemplates.js';
import { DAGGERHEART_WEAPONS, DAGGERHEART_ARMOR, DAGGERHEART_EQUIPMENT, DAGGERHEART_CONSUMABLES } from '../src/data/daggerheartItems.js';
import { HF_TRANSFORMATIONS, HF_DOMAIN_CARDS, HF_CAMPAIGN_FRAMES } from '../src/data/hopeFear.js';
import { sourceOf, isSourceEnabled, filterBySource, withSource, CONTENT_SOURCES } from '../src/data/sources.js';
import {
  validateAdversary, validateDomainCard, validateClass, validateSubclass,
  validateEnvironment, validateHeritage, validateTransformation, validateCampaignFrame,
} from '../src/data/schemas.js';
import LevelUpWizard from '../src/components/Characters/LevelUpWizard.jsx';
import RestModal from '../src/components/Characters/RestModal.jsx';
import DeathMoveModal from '../src/components/Characters/DeathMoveModal.jsx';

let failures = 0;
const assert = (cond, msg) => {
  if (!cond) { failures++; console.error('  FAIL:', msg); }
  else console.log('  ok:', msg);
};
const section = (name) => console.log(`\n== ${name}`);
const strip = (html) => html.replace(/<!-- -->/g, '');

// ── SRD data integrity ──
section('SRD data');
{
  const core = DAGGERHEART_ADVERSARIES.filter(a => sourceOf(a) === 'core');
  assert(core.length === 129, `129 core adversaries (got ${core.length})`);
}
{
  const roles = new Set(['minion', 'horde', 'standard', 'bruiser', 'skulk', 'ranged', 'support', 'social', 'leader', 'solo']);
  const bad = DAGGERHEART_ADVERSARIES.filter(a =>
    !roles.has(a.role) || ![1, 2, 3, 4].includes(a.tier) || !a.attackDamage || !a.features?.length ||
    (a.role === 'minion' && (a.hp !== 1 || a.thresholds.minor !== 0))
  );
  assert(bad.length === 0, `all adversaries valid (bad: ${bad.map(a => a.name).join(', ') || 'none'})`);
}
{
  const core = DOMAIN_CARDS.filter(c => sourceOf(c) === 'core');
  assert(core.length === 189, `189 core domain cards (got ${core.length})`);
}
assert(DOMAIN_CARDS.every(c => Number.isInteger(c.recallCost) && c.recallCost >= 0 && c.recallCost <= 4),
  'every domain card has a recall cost 0-4');
{
  const core = DAGGERHEART_ENVIRONMENTS.filter(e => sourceOf(e) === 'core');
  assert(core.length === 19, `19 core environments (got ${core.length})`);
}

// ── Leveling rules ──
section('Leveling');
assert(getTierForLevel(1) === 1 && getTierForLevel(4) === 2 && getTierForLevel(7) === 3 && getTierForLevel(10) === 4, 'tier boundaries 1 / 2-4 / 5-7 / 8-10');
assert(getBaseProficiency(1) === 1 && getBaseProficiency(2) === 2 && getBaseProficiency(5) === 3 && getBaseProficiency(8) === 4, 'proficiency 1/2/3/4 at levels 1/2/5/8');
{
  const t2 = Object.fromEntries(ADVANCEMENT_OPTIONS.tier2.map(o => [o.id, o.slots]));
  assert(t2.traits === 3 && t2.hp === 2 && t2.stress === 2 && t2.experiences === 1 && t2.domainCard === 1 && t2.evasion === 1,
    'tier 2 slot counts match the SRD sheet');
  const prof = ADVANCEMENT_OPTIONS.tier3.find(o => o.id === 'proficiency');
  const mc = ADVANCEMENT_OPTIONS.tier3.find(o => o.id === 'multiclass');
  assert(prof.cost === 2 && mc.cost === 2, 'proficiency and multiclass cost both level-up slots');
}

// ── Battle Points (SRD Battle Guide) ──
section('Battle Points');
assert(calculateBPBudget(4) === 14, 'budget = 3×PCs + 2');
assert(getSlotBPCost('minion', 8, 4) === 2, 'minions cost 1 BP per party-sized group');
assert(getSlotBPCost('support', 1, 4) === 1 && getSlotBPCost('social', 1, 4) === 1, 'social/support = 1 BP');
assert(getSlotBPCost('horde', 1, 4) === 2 && getSlotBPCost('standard', 1, 4) === 2, 'horde/standard = 2 BP');
assert(getSlotBPCost('leader', 1, 4) === 3 && getSlotBPCost('bruiser', 1, 4) === 4 && getSlotBPCost('solo', 1, 4) === 5, 'leader 3 / bruiser 4 / solo 5');
{
  // SRD worked example: 2 Bruisers + 2 Standards + 4 minions for a party of 4 = 13 BP
  const advs = [{ id: 'a', role: 'bruiser' }, { id: 'b', role: 'standard' }, { id: 'c', role: 'minion' }];
  const used = calculateUsedBP([
    { adversaryId: 'a', quantity: 2 }, { adversaryId: 'b', quantity: 2 }, { adversaryId: 'c', quantity: 4 }
  ], advs, 4);
  assert(used === 13, `SRD example encounter = 13 BP (got ${used})`);
}
assert(calculateBPAdjustments({ adjustments: { easier: true } }).total === -1, 'easier fight −1');
assert(calculateBPAdjustments({ adjustments: { harder: true, damageBoost: true }, soloCount: 2, hasMajorThreats: true, hasSlots: true }).total === -2, 'harder +2, dmg boost −2, 2 solos −2');
assert(calculateBPAdjustments({ adjustments: {}, soloCount: 0, hasMajorThreats: false, hasSlots: true }).total === 1, 'no major threats +1');

// ── Adversary generation fallbacks ──
section('Adversary fallbacks');
{
  const m = fallbackAdversaryStats(4, 'minion');
  assert(m.hp === 1 && m.thresholds.minor === 0 && /^\d+ phy$/.test(m.attackDamage), 'T4 minion: 1 HP, no thresholds, flat damage');
  const s = fallbackAdversaryStats(4, 'solo');
  assert(s.hp <= 12 && s.thresholds.major >= 45 && s.attackDamage.startsWith('4d'), 'T4 solo: role-sized HP, tier-scaled thresholds, 4-die damage');
  const t1 = fallbackAdversaryStats(1, 'standard');
  assert(t1.thresholds.minor <= 8 && t1.attackDamage.startsWith('1d'), 'T1 standard calibrated');
  const boss = fallbackAdversaryStats(4, 'boss');
  assert(boss.hp >= 10 && boss.hp <= 14, `T4 boss role-sized HP (${boss.hp})`);
}

// ── D&D-ism sanitizer: no invalid traits / saves survive ──
section('Adversary text sanitizer');
{
  const s = sanitizeDaggerheartText;
  // The exact bug from the report:
  const fixed = s('must make a Difficulty 18 Spirit save or take 2d10+6 dark damage and become Restrained');
  assert(fixed.includes('Presence Reaction Roll (18)'), `Spirit save → Presence Reaction Roll (${fixed})`);
  assert(!/save|Spirit/i.test(fixed), 'no "save" or "Spirit" remains');
  assert(s('DC 15 Wisdom saving throw').includes('Instinct Reaction Roll (15)'), 'DC-first Wisdom → Instinct');
  assert(s('a Dexterity saving throw (DC 14)').includes('Agility Reaction Roll (14)'), 'Dexterity (DC) → Agility');
  assert(s('make a Strength save').includes('Strength Reaction Roll'), 'Strength save → Strength Reaction Roll');
  // Flavor text left alone:
  assert(s('a vengeful spirit haunts the hall') === 'a vengeful spirit haunts the hall', 'flavor "spirit" untouched');
  assert(s('must succeed on an Agility Reaction Roll (16) or fall') === 'must succeed on an Agility Reaction Roll (16) or fall', 'already-correct text unchanged');
}

// ── Session planner: boss role + named-enemy reuse survive parsing ──
section('Session plan parsing');
{
  const raw = '```json\n' + JSON.stringify({
    sessionTitle: 'Finale', estimatedDurationHours: 3, partyLevel: 6, partySize: 4,
    encounters: [{
      name: 'Duel with Matu Palu', type: 'combat', summary: 'x', estimatedMinutes: 60,
      adversariesNeeded: [{ concept: 'Matu Palu, the tide-witch', tier: 3, role: 'boss', quantity: 1, reuseExistingName: 'Matu Palu' }],
      puzzleSpec: null, environment: '', bpEstimate: 8,
    }],
  }) + '\n```';
  const plan = responseParser.parse('session-plan', raw);
  const need = plan.encounters[0].adversariesNeeded[0];
  assert(need.role === 'boss', `boss role preserved through parser (got ${need.role})`);
  assert(need.reuseExistingName === 'Matu Palu', `reuseExistingName preserved (got ${need.reuseExistingName})`);
}

// ── Fuzzy adversary-name matching for reuse ──
section('Fuzzy adversary matching');
{
  const advs = [
    { id: 'a1', name: 'Matu Palu, the Tide-Witch' },
    { id: 'a2', name: 'Goblin Skirmisher' },
    { id: 'a3', name: 'Troll' },
  ];
  const m = (n, opts) => (fuzzyMatchAdversary(n, advs, opts) || {}).id;
  assert(m('Matu Palu') === 'a1', 'partial name matches full boss name');
  assert(m('matu  palu') === 'a1', 'case/space-insensitive match');
  assert(m('Matu Pallu') === 'a1', 'misspelling (extra letter) still matches');
  assert(m('Mattu Palu, the Tide Witch') === 'a1', 'misspelling within full name matches');
  assert(m('Goblin Skirmisher') === 'a2', 'exact match picks the right one');
  assert(!m('Ancient Red Dragon'), 'unrelated name does not match');
  // concept-fallback guardrail: generic short names only match in distinctive mode off
  assert(m('A lumbering troll of the deep', { distinctiveOnly: true }) === undefined, 'generic "troll" not reused in distinctive mode');
}

// ── Modal render checks ──
section('Modals');
const chr = {
  name: 'T', level: 5, class: 'Warrior', subclass: 'Call of the Brave',
  traits: {}, experiences: ['Soldier'], domainCards: [], primaryDomain: 'Blade', secondaryDomain: 'Bone',
  hpSlots: [true, false, false, true, true, true],
  stressSlots: [true, true, false, false, false, false],
  armorSlots: [true, false, false, false, false, false],
  hopeSlots: [true, false, false, false, false, false],
  markedTraits: [], levelHistory: [
    { level: 2, advancements: [{ id: 'hp' }, { id: 'stress' }] },
  ],
};
{
  let html = strip(renderToString(React.createElement(LevelUpWizard, { character: chr, items: [], onComplete: () => {}, onClose: () => {} })));
  assert(html.includes('Level Up to 6'), 'LevelUpWizard renders for level 5→6');
  html = strip(renderToString(React.createElement(RestModal, { character: chr, onApply: () => {}, onClose: () => {} })));
  assert(html.includes('Short Rest') && html.includes('Long Rest'), 'RestModal renders both rest types');
  html = strip(renderToString(React.createElement(DeathMoveModal, { character: chr, onApply: () => {}, onClose: () => {} })));
  assert(html.includes('Blaze of Glory') && html.includes('Avoid Death') && html.includes('Risk It All'), 'DeathMoveModal renders all three moves');
}

// ── Cinematic recap timeline ──
section('Cinematic recap timeline');
{
  const chapter = {
    title: 'The Siege of Korak',
    prose: 'The gates held through the night.\n\nAt dawn, the tide-witch arrived.\n\nOnly ash remained.',
    scenes: [
      { id: 's1', imageUrl: 'http://x/1.jpg', caption: 'The burning gate' },
      { id: 's2', imageUrl: 'http://x/2.jpg', caption: 'Matu Palu emerges' },
    ],
  };
  const slides = buildTimeline(chapter);
  assert(slides[0].kind === 'title' && slides[0].text === 'The Siege of Korak', 'first slide is the title card');
  assert(slides.some(s => s.kind === 'scene' && s.imageUrl === 'http://x/1.jpg'), 'scene images become slides');
  assert(slides.some(s => s.kind === 'prose'), 'prose paragraphs become slides');
  assert(slides.every(s => s.duration >= 3 && s.pan && typeof s.pan.toScale === 'number'), 'every slide has duration + pan');
  assert(timelineDuration(slides) > 0, 'timeline has positive runtime');

  // Narration overrides duration and attaches audio to the right slide index
  const withNarr = buildTimeline(chapter, [{ index: 1, url: 'http://x/n1.mp3', duration: 9 }]);
  assert(withNarr[1].narrationUrl === 'http://x/n1.mp3', 'narration attaches to slide by index');
  assert(withNarr[1].duration >= 9, 'narration duration drives slide length');

  // Ambient FX + AI scene clips
  assert(slides.every(s => typeof s.fx === 'string'), 'every slide carries an ambient effect');
  const burning = slides.find(s => s.text === 'The burning gate');
  assert(burning.fx === 'embers' && burning.sceneKey === 's1', 'fire caption → embers, scene keyed by id');
  const withVideo = buildTimeline({ ...chapter, sceneVideos: { s1: { url: 'http://x/clip1.mp4' } } });
  assert(withVideo.find(s => s.sceneKey === 's1').videoUrl === 'http://x/clip1.mp4', 'scene clip attaches by scene id');
  assert(withVideo[0].videoUrl === 'http://x/clip1.mp4', 'title card reuses the first scene clip');
  const afterScene = withVideo.findIndex(s => s.sceneKey === 's1');
  const nextProse = withVideo.slice(afterScene + 1).find(s => s.kind === 'prose');
  if (nextProse) assert(nextProse.videoUrl === 'http://x/clip1.mp4', 'prose after an animated scene keeps the clip');

  // Dramatis Personae → closing credits slide
  assert(!slides.some(s => s.kind === 'credits'), 'no credits slide without spotlights');
  const withCast = buildTimeline({
    ...chapter,
    spotlights: [
      { name: 'Emmanita', entityType: 'character', portraitUrl: 'http://x/em.png', moment: 'Communed with the treant' },
      { name: 'Pippin', entityType: 'character' },
      { name: 'Mata Palo', entityType: 'adversary' },
    ],
  });
  const credits = withCast[withCast.length - 1];
  assert(credits.kind === 'credits' && credits.cast.length === 3, 'spotlights append a closing credits slide');
  assert(credits.cast[0].name === 'Emmanita' && credits.cast[2].entityType === 'adversary', 'credits carry name + role');
  assert(credits.text === '', 'credits slide is silent (narration generator skips it)');
  assert(credits.duration >= 6 && credits.duration <= 15, `credits duration scales with cast (${credits.duration}s)`);

  // Narration voices the title and prose — never scene captions or credits
  const voiced = narratableSlides(withCast);
  assert(voiced.some(v => v.text === 'The Siege of Korak'), 'title card is narrated');
  assert(voiced.filter(v => v.kind === 'prose').length === 3, 'all prose paragraphs are narrated');
  assert(!voiced.some(v => v.kind === 'scene'), 'scene captions are never narrated');
  assert(!voiced.some(v => v.kind === 'credits'), 'credits stay silent');
  voiced.forEach(v => assert(withCast[v.i].text === v.text, `narration index ${v.i} maps back to its slide`));
}

// --- Defense calc: custom feature text bonuses (armor score / evasion) ---
{
  const character = { class: 'Warrior', level: 2, armor: 0 };
  const armor = {
    type: 'armor', name: 'Bogplate of Testing',
    systemData: { armorScore: 4, armorSlots: 4, features: [{ name: 'Sturdy', description: 'No bonus here.' }] },
  };
  const shield = {
    type: 'weapon', name: 'Bog-Song Aegis',
    systemData: {
      features: [
        { name: 'Ever Damp', description: '+1 evasion' },
        { name: 'Armor Slot', description: '+1 armor score' },
        { name: "The Choir's Croak", description: 'Once per Long Rest, when spending an Armor Slot to block, release a blast.' },
      ],
    },
  };
  const base = computeDefenses(character, [armor]);
  const withShield = computeDefenses(character, [armor, shield]);
  assert(withShield.armorScore === base.armorScore + 1, `"+1 armor score" feature text adds armor (${base.armorScore} → ${withShield.armorScore})`);
  assert(withShield.evasion === base.evasion + 1, `"+1 evasion" feature text adds evasion (${base.evasion} → ${withShield.evasion})`);

  const protectiveShield = {
    type: 'weapon', name: 'Test Buckler',
    systemData: { features: [{ name: 'Protective', description: '+1 to Armor Score' }] },
  };
  const withProtective = computeDefenses(character, [armor, protectiveShield]);
  assert(withProtective.armorScore === base.armorScore + (character.proficiency || 2),
    `named Protective feature is not double-counted from its description (got ${withProtective.armorScore})`);

  // Rogue's Dodge: active class Hope feature grants +2 Evasion (rogue only)
  const rogue = { class: 'Rogue', level: 1 };
  const idleRogue = computeDefenses(rogue, []);
  const dodging = computeDefenses({ ...rogue, hopeFeatureActive: true }, []);
  assert(idleRogue.evasion === 12, `rogue base evasion is 12 (got ${idleRogue.evasion})`);
  assert(dodging.evasion === 14, `active Rogue's Dodge adds +2 evasion (got ${dodging.evasion})`);
  const warriorActive = computeDefenses({ class: 'Warrior', level: 1, hopeFeatureActive: true }, []);
  assert(warriorActive.evasion === 11, 'non-rogue active Hope feature leaves evasion unchanged');
}

// --- Player dice colors (roller color + Duality sets) ---
{
  const dice = [
    { groupId: 'hope', sides: 12, color: '#eab308', value: 8 },
    { groupId: 'fear', sides: 12, color: '#7c3aed', value: 3 },
    { groupId: 'advantage', sides: 6, color: '#22c55e', value: 4 },
    { groupId: 'dmg-0', sides: 8, color: '#6366f1', value: 5 },
  ];
  const ember = DUALITY_SETS.find(d => d.key === 'ember');
  const out = applyDiceColors(dice, { rollerColor: '#ef4444', duality: { hope: ember.hope, fear: ember.fear } });
  assert(out[0].color === ember.hope && out[1].color === ember.fear, 'duality set recolors Hope and Fear dice');
  assert(out[2].color === '#22c55e', 'advantage die keeps its semantic green');
  assert(out[3].color === '#ef4444', 'damage die takes the player color');
  const noSet = applyDiceColors(dice, { rollerColor: '#ef4444', duality: null });
  assert(noSet[0].color === '#eab308' && noSet[1].color === '#7c3aed', 'no duality set → classic Hope/Fear colors kept');
  assert(DUALITY_SETS.length >= 8 && DUALITY_SETS.every(d => d.hope !== d.fear), 'every duality set keeps Hope and Fear distinct');
  assert(PLAYER_COLORS.length === 14, 'player palette intact');
}

// --- Mood-matched soundtrack (cinematicMusic) ---
{
  assert(pickThemeForText('Steel clashed as the battle raged') === 'battle', 'battle text → battle theme');
  assert(pickThemeForText('An ominous dread crept from the crypt') === 'tension', 'dread text → tension theme');
  assert(pickThemeForText('They toasted their victory at the tavern') === 'victory', 'victory beats tavern (first match wins)');
  assert(pickThemeForText('The party walked down the road') === null, 'neutral text → no explicit theme');

  const slides = [
    { text: 'The Journey Begins', duration: 4 },      // title — no explicit theme → exploration
    { text: 'They followed the river north.', duration: 6 },
    { text: 'Goblins attacked! Swords were drawn.', duration: 8 },  // battle
    { text: 'The fight was hard and bloody.', duration: 6 },        // battle-ish → stays
    { text: 'At last, they defeated the warband and rejoiced.', duration: 7 }, // victory
  ];
  const score = buildScore(slides, 'chapter-1');
  assert(score[0].theme === 'exploration' && score[0].start === 0, 'opens with exploration');
  assert(score.some(s => s.theme === 'battle'), 'battle movement appears when combat starts');
  assert(score[score.length - 1].theme === 'victory', 'closes on a victory movement');
  assert(score.every(s => s.url && s.url.endsWith('.mp3')), 'every movement resolves to a track URL');
  const again = buildScore(slides, 'chapter-1');
  assert(again.map(s => s.track).join() === score.map(s => s.track).join(), 'track choice is deterministic per chapter');
  assert(segmentAt(score, 3).theme === 'battle', 'segmentAt finds the movement covering a slide');
  const plan = musicPlanFor(score, slides);
  assert(plan.length === score.length && Math.abs(plan.reduce((a, p) => a + p.durationSec, 0) - 31) < 0.01,
    'export plan spans covers the full runtime');
}

// --- Cinematic ambient FX engine ---
{
  assert(pickEffectForText('The campfire crackled low') === 'embers', 'fire text → embers');
  assert(pickEffectForText('Rain lashed the parapets') === 'rain', 'storm text → rain');
  assert(pickEffectForText('Snow buried the pass') === 'snow', 'winter text → snow');
  assert(pickEffectForText('She began the ritual, arcane light rising') === 'sparkles', 'magic text → sparkles');
  assert(pickEffectForText('Mist crept through the crypt') === 'fog', 'mist text → fog');
  assert(pickEffectForText('They shook hands and parted ways') === 'dust', 'plain text → dust motes');
  const fx = createFX('embers', 640, 360);
  fx.update(0.016);
  assert(typeof fx.draw === 'function' && fx.effect === 'embers', 'createFX returns a live effect instance');
  assert(createFX('none', 640, 360).effect === 'none', 'none effect is a no-op instance');
}

// --- Threshold damage → HP marks (Daggerheart adversary damage model) ---
{
  const th = { major: 9, severe: 17 };
  assert(marksForDamage(5, th) === 1, 'damage below Major marks 1 HP');
  assert(marksForDamage(9, th) === 2, 'damage at Major threshold marks 2 HP');
  assert(marksForDamage(12, th) === 2, 'damage between Major and Severe marks 2 HP');
  assert(marksForDamage(17, th) === 3, 'damage at Severe threshold marks 3 HP');
  assert(marksForDamage(25, th) === 3, 'damage above Severe marks 3 HP');
  assert(marksForDamage(0, th) === 0, 'zero damage marks nothing');
  assert(marksForDamage(-4, th) === 0, 'negative damage marks nothing');
  assert(marksForDamage(1, { isMinion: true }) === 1, 'any damage defeats a minion');
  assert(marksForDamage(3, { isMinion: true, minionHp: 2 }) === 2, 'minion marks its full HP');
}

// --- Domain-card feature splitting (Grimoire & multi-ability cards) ---
{
  const ava = splitCardFeatures("Power Push: Spellcast vs Melee target, d10+2 magic damage and knocked to Far range. Tava's Armor: Spend Hope for +1 Armor Score on a touched target. Ice Spike: Spellcast Roll (12) to summon an ice spike within Far range, d6 physical damage.");
  assert(ava.length === 3, `Book of Ava splits into 3 features (got ${ava.length})`);
  assert(ava[0].name === 'Power Push' && ava[2].name === 'Ice Spike', 'feature names parsed in order');
  assert(!/\.$/.test(ava[2].text) && ava[2].text.includes('d6 physical damage'), 'trailing period trimmed, text preserved');

  const prose = splitCardFeatures('Mark a Stress to reroll any number of your damage dice on an attack.');
  assert(prose.length === 1 && prose[0].name === null, 'prose-only card stays a single unnamed block');

  const single = splitCardFeatures('Gifted Tracker: You have advantage on rolls to track a specific creature.');
  assert(single.length === 1 && single[0].name === 'Gifted Tracker', 'single named feature keeps its header');

  assert(splitCardFeatures('').length === 0 && splitCardFeatures(null).length === 0, 'empty/nullish description → no features');
}


// ── Hope & Fear expansion readiness ──
section('Hope & Fear readiness');
{
  // Content-source gating
  assert(CONTENT_SOURCES.some(s2 => s2.id === 'hope-fear'), 'Hope & Fear is registered as a content source');
  assert(isSourceEnabled({}, 'hope-fear') === true, 'expansion defaults to enabled');
  assert(isSourceEnabled({ contentSources: { 'hope-fear': false } }, 'hope-fear') === false, 'campaign can disable the expansion');
  assert(isSourceEnabled({ contentSources: { core: false } }, 'core') === true, 'core can never be disabled');
  const mixed = [{ name: 'a' }, { name: 'b', source: 'hope-fear' }];
  assert(filterBySource(mixed, { contentSources: { 'hope-fear': false } }).length === 1, 'filterBySource drops disabled-source entries');
  assert(withSource([{ name: 'x' }], 'hope-fear')[0].source === 'hope-fear', 'withSource tags entries');

  // Every entry of every merged catalog validates — pasted expansion data
  // fails here with a precise message instead of crashing a picker.
  const problems = [];
  DAGGERHEART_ADVERSARIES.forEach(a => problems.push(...validateAdversary(a)));
  DOMAIN_CARDS.forEach(c => problems.push(...validateDomainCard(c)));
  DAGGERHEART_ENVIRONMENTS.forEach(e => problems.push(...validateEnvironment(e)));
  Object.entries(CLASSES).forEach(([n, c]) => problems.push(...validateClass(n, c)));
  Object.entries(SUBCLASSES).forEach(([cls, list]) => list.forEach(sc => problems.push(...validateSubclass(cls, sc))));
  Object.entries(ANCESTRIES).forEach(([n, h]) => { if (h?.features) problems.push(...validateHeritage(n, h)); });
  Object.entries(COMMUNITIES).forEach(([n, h]) => { if (h?.features) problems.push(...validateHeritage(n, h)); });
  CAMPAIGN_FRAME_TEMPLATES.filter(f => f.id !== 'blank').forEach(f => problems.push(...validateCampaignFrame(f)));
  HF_TRANSFORMATIONS.forEach(t => problems.push(...validateTransformation(t)));
  assert(problems.length === 0, `all merged content passes schema validation (${problems.length ? problems.slice(0, 4).join(' | ') : 'clean'})`);

  // The validator actually catches garbage (guards against a silently-lax schema)
  const bad = validateAdversary({ name: 'Broken', tier: 7, role: 'dragon', hp: 0 });
  assert(bad.length >= 4, `validator flags malformed adversaries (${bad.length} problems found)`);
  assert(validateDomainCard({ name: 'Bad Card', domain: 'Dread', level: 99, type: 'Sorcery', recallCost: 9 }).length >= 3,
    'validator flags malformed domain cards');

  // The 9 core classes survive the merge untouched; Dread only appears once
  // its cards exist (nobody can pick an empty domain pre-release).
  assert(Object.keys(ANCESTRIES).filter(a => ['Aetheris','Earthkin','Emberkin','Skykin','Tidekin','Gnome'].includes(a)).length === 6, 'all 6 Hope & Fear ancestries merged');
  assert(Object.keys(COMMUNITIES).filter(c => ['Duneborne','Freeborne','Frostborne','Hearthborne','Reborne','Warborne'].includes(c)).length === 6, 'all 6 Hope & Fear communities merged');
  assert(HF_TRANSFORMATIONS.length === 6 && HF_TRANSFORMATIONS.every(t => t.key && t.features.length), 'all 6 transformations present with features');
  assert(HF_TRANSFORMATIONS.map(t => t.key).sort().join(',') === 'demigod,ghost,reanimated,shapeshifter,vampire,werewolf', 'transformation keys match the six announced');
  const hfClasses = ['Assassin', 'Brawler', 'Warlock', 'Witch'];
  assert(hfClasses.every(c => CLASSES[c]), 'all 4 Hope & Fear classes merged in');
  // Source-gating: expansion classes/heritages are tagged so pickers can hide them.
  assert(hfClasses.every(c => CLASSES[c].source === 'hope-fear'), 'H&F classes tagged source=hope-fear for picker gating');
  assert(['Aetheris', 'Gnome'].every(a => ANCESTRIES[a]?.source === 'hope-fear'), 'H&F ancestries tagged source=hope-fear');
  assert(CLASSES['Bard'].source === undefined || CLASSES['Bard'].source === 'core', 'core classes stay untagged (core source)');
  {
    const off = { contentSources: { 'hope-fear': false } };
    assert(!isSourceEnabled(off, CLASSES['Witch'].source), 'disabling H&F hides Witch from pickers');
    assert(isSourceEnabled(off, CLASSES['Bard'].source), 'core Bard stays available when H&F is off');
  }
  assert(hfClasses.every(c => (SUBCLASSES[c] || []).length === 2), 'each new class has 2 subclasses');
  assert(CLASSES['Assassin'].baseEvasion === 12 && CLASSES['Witch'].baseHp === 6, 'new class base stats transcribed (Assassin Ev12, Witch HP6)');
  assert(CLASSES['Warlock'].domains.includes('Dread') && CLASSES['Witch'].domains.includes('Dread'), 'Warlock & Witch carry the Dread domain');
  const coreClasses = ['Bard', 'Druid', 'Guardian', 'Ranger', 'Rogue', 'Seraph', 'Sorcerer', 'Warrior', 'Wizard'];
  assert(coreClasses.every(c => CLASSES[c]), 'all 9 core classes present after expansion merge');
  {
    const hfEnv = DAGGERHEART_ENVIRONMENTS.filter(e => sourceOf(e) === 'hope-fear');
    assert(hfEnv.length === 28, `28 Hope & Fear environments (got ${hfEnv.length})`);
  }
  {
    const hfAdv = DAGGERHEART_ADVERSARIES.filter(a => sourceOf(a) === 'hope-fear');
    assert(hfAdv.length === 138, `138 Hope & Fear adversaries (got ${hfAdv.length})`);
    assert(hfAdv.every(a => a.features.length > 0), 'every H&F adversary has features');
    assert(hfAdv.filter(a => a.tier === 4).length >= 20, 'H&F includes a full Tier 4 roster');
  }
  {
    const hfFrames = CAMPAIGN_FRAME_TEMPLATES.filter(f => sourceOf(f) === 'hope-fear');
    assert(hfFrames.length === 4, `4 Hope & Fear campaign frames (got ${hfFrames.length})`);
    assert(HF_CAMPAIGN_FRAMES.map(f => f.complexity).sort().join('') === '1234', 'H&F frames span complexity 1-4');
    assert(hfFrames.every(f => f.pitch && f.overview && f.incitingIncident), 'every H&F frame has pitch, overview & inciting incident');
    assert(hfFrames.every(f => f.playerPrinciples?.length && f.gmPrinciples?.length && f.distinctions?.length && f.sessionZeroQuestions?.length), 'every H&F frame has principles, distinctions & session-zero questions');
    assert(hfFrames.every(f => f.distinctions.every(d => d.name && d.description)), 'every H&F frame distinction has name + description');
  }
  {
    const hfW = DAGGERHEART_WEAPONS.filter(w => sourceOf(w) === 'hope-fear');
    const hfA = DAGGERHEART_ARMOR.filter(a => sourceOf(a) === 'hope-fear');
    const hfE = DAGGERHEART_EQUIPMENT.filter(e => sourceOf(e) === 'hope-fear');
    const hfC = DAGGERHEART_CONSUMABLES.filter(c => sourceOf(c) === 'hope-fear');
    assert(hfW.length === 73, `73 Hope & Fear weapons (got ${hfW.length})`);
    assert(hfA.length === 47, `47 Hope & Fear armor (got ${hfA.length})`);
    assert(hfE.length === 61, `61 Hope & Fear loot items (got ${hfE.length})`);
    assert(hfC.length === 60, `60 Hope & Fear consumables (got ${hfC.length})`);
    assert(hfW.every(w => w.systemData?.damageTier1Dice && w.systemData?.damageTier4Dice && w.systemData?.trait), 'every H&F weapon carries all 4 damage tiers + a trait');
    assert(hfA.every(a => a.systemData?.thresholds?.minor > 0 && typeof a.systemData?.armorScore === 'number'), 'every H&F armor has thresholds + a numeric score');
    const katana = hfW.find(w => w.name === 'Katana');
    assert(katana && katana.systemData.damageTier1Modifier === 3 && katana.systemData.damageTier4Modifier === 12, 'Katana scales d10+3 → d10+12 across tiers');
  }
  assert(DOMAIN_CARDS.filter(c => c.domain === 'Dread').length === 21, `21 Dread domain cards (got ${DOMAIN_CARDS.filter(c => c.domain === 'Dread').length})`);
  assert(HF_DOMAIN_CARDS.length > 0 ? DOMAINS.includes('Dread') : !DOMAINS.includes('Dread'),
    `Dread domain gated on card content (cards: ${HF_DOMAIN_CARDS.length}, listed: ${DOMAINS.includes('Dread')})`);
}

section('Battle Map store');
{
  const store = useBattleMapStore;
  const fresh = () => {
    store.getState().resetMap();
    store.setState({ past: [], future: [] });
  };

  // Undo/redo across the three collections history tracks.
  {
    fresh();
    const { addToken } = store.getState();
    addToken({ name: 'Goblin', x: 0, y: 0 });
    addToken({ name: 'Ogre', x: 50, y: 50 });
    assert(store.getState().tokens.length === 2, 'two tokens added');

    store.getState().undo();
    assert(store.getState().tokens.length === 1, 'undo removes the last token');
    assert(store.getState().tokens[0].name === 'Goblin', 'undo restores the prior token set');

    store.getState().redo();
    assert(store.getState().tokens.length === 2, 'redo re-adds the token');
    assert(store.getState().tokens[1].name === 'Ogre', 'redo restores the exact token');

    // A new edit after undo must clear the redo stack.
    store.getState().undo();
    store.getState().addToken({ name: 'Wolf' });
    assert(store.getState().future.length === 0, 'a fresh edit clears the redo stack');
  }

  // Undo must not leave selection pointing at tokens that no longer exist.
  {
    fresh();
    store.getState().addToken({ name: 'Goblin' });
    const id = store.getState().tokens[0].id;
    store.getState().selectToken(id);
    store.getState().undo();
    assert(store.getState().tokens.length === 0, 'undo removed the token');
    assert(store.getState().selectedTokenIds.length === 0, 'undo drops selection of removed tokens');
  }

  // Locked tokens survive a Delete aimed at the selection.
  {
    fresh();
    store.getState().addToken({ name: 'Scenery' });
    store.getState().addToken({ name: 'Goblin' });
    const [scenery, goblin] = store.getState().tokens;
    store.getState().selectToken(scenery.id);
    store.getState().toggleSelectedLocked();
    store.getState().selectToken(scenery.id);
    store.getState().selectToken(goblin.id, true);
    store.getState().deleteSelectedTokens();
    const names = store.getState().tokens.map(t => t.name);
    assert(names.length === 1 && names[0] === 'Scenery', 'delete skips locked tokens');
  }

  // Shift-clicking a selected token removes it from the selection.
  {
    fresh();
    store.getState().addToken({ name: 'A' });
    store.getState().addToken({ name: 'B' });
    const [a, b] = store.getState().tokens;
    store.getState().selectToken(a.id);
    store.getState().selectToken(b.id, true);
    assert(store.getState().selectedTokenIds.length === 2, 'shift-click adds to selection');
    store.getState().selectToken(b.id, true);
    assert(store.getState().selectedTokenIds.length === 1, 'shift-click again deselects');
  }

  // Z-order is render order.
  {
    fresh();
    store.getState().addToken({ name: 'bottom' });
    store.getState().addToken({ name: 'top' });
    const bottom = store.getState().tokens[0];
    store.getState().selectToken(bottom.id);
    store.getState().bringSelectedToFront();
    assert(store.getState().tokens[1].name === 'bottom', 'bring to front moves the token last');
    store.getState().sendSelectedToBack();
    assert(store.getState().tokens[0].name === 'bottom', 'send to back moves the token first');
  }

  // Duplicate offsets the copy and selects it, leaving the original alone.
  {
    fresh();
    store.getState().addToken({ name: 'Crate', x: 100, y: 100 });
    const original = store.getState().tokens[0];
    store.getState().selectToken(original.id);
    store.getState().duplicateSelectedTokens();
    const tokens = store.getState().tokens;
    assert(tokens.length === 2, 'duplicate adds one token');
    assert(tokens[1].id !== original.id, 'the copy gets a new id');
    assert(tokens[1].x === original.x + store.getState().gridSize, 'the copy is offset by one cell');
    assert(store.getState().selectedTokenIds[0] === tokens[1].id, 'the copy becomes the selection');
  }

  // History must never reach the saved document — it would multiply its size.
  {
    fresh();
    store.getState().addToken({ name: 'Goblin' });
    const saved = store.getState().getSerializableState();
    assert(!('past' in saved) && !('future' in saved), 'history is excluded from the saved map');
    assert(!('zoom' in saved) && !('panOffset' in saved), 'view state is excluded from the saved map');
  }

  // The 1MB Firestore document limit is what made tile maps unsaveable.
  {
    fresh();
    store.getState().loadMapState({
      mapImage: { isBlank: true, width: 2560, height: 1440, bgColor: '#1a1a2e' },
      tokens: Array.from({ length: 50 }, (_, i) => ({
        id: `t${i}`,
        src: `https://firebasestorage.example/token_${i}.png`,
        name: `Token ${i}`,
        x: i * 50, y: i * 50, width: 50, height: 50, rotation: 0, layer: 'tokens'
      }))
    });
    const bytes = JSON.stringify(store.getState().getSerializableState()).length;
    assert(bytes < 100 * 1024, `a blank map with 50 tokens serialises small (${bytes} bytes, limit 1MB)`);
  }

  // What the display window receives must carry everything it renders.
  {
    fresh();
    store.getState().loadMapState({
      mapImage: { url: 'https://firebasestorage.example/map.png', width: 1536, height: 1024 },
      tokens: [
        { id: 'a', name: 'Goblin', layer: 'tokens', x: 0, y: 0, width: 50, height: 50 },
        { id: 'b', name: 'Crate', layer: 'background', x: 50, y: 0, width: 50, height: 50 }
      ],
      drawings: [{ id: 'd1', type: 'line', points: [0, 0, 10, 10], color: '#fff', width: 3 }],
      fogEnabled: true,
      fogRevealed: []
    });
    const view = store.getState().getPlayerViewState();
    assert(view.drawings.length === 1, 'drawings reach the display');
    assert(typeof view.showTokenLabels === 'boolean', 'the label toggle reaches the display');
    assert(view.gridType === 'square', 'grid type reaches the display');
    assert(view.tokens.length === 2, 'both scenery and creature tokens are broadcast');
    assert(view.fogEnabled && view.fogRevealed.length === 0,
      'fog enabled with nothing revealed is broadcast as fully fogged');
  }

  // Hidden layers must not leak to players.
  {
    fresh();
    store.getState().loadMapState({
      mapImage: { url: 'https://firebasestorage.example/map.png', width: 100, height: 100 },
      tokens: [
        { id: 'a', name: 'Goblin', layer: 'tokens', x: 0, y: 0, width: 50, height: 50 },
        { id: 'b', name: 'Secret', layer: 'background', x: 0, y: 0, width: 50, height: 50 }
      ]
    });
    store.getState().toggleLayerVisibility('background');
    const view = store.getState().getPlayerViewState();
    assert(view.tokens.length === 1 && view.tokens[0].name === 'Goblin',
      'tokens on a hidden layer are withheld from players');
  }

  // Blank canvases are described, not baked into a PNG data URL.
  {
    fresh();
    store.getState().loadMapState({
      mapImage: { isBlank: true, width: 2560, height: 1440, bgColor: '#1a1a2e', url: null }
    });
    const { mapImage } = store.getState().getSerializableState();
    assert(!mapImage.url, 'a blank canvas carries no image URL');
    assert(mapImage.bgColor === '#1a1a2e', 'a blank canvas carries its fill colour');
  }

  fresh();
}

section('Dice tray (concurrent rolls)');
{
  // A Daggerheart duality roll: two d12s in different colours must stay in
  // separate groups so Hope and Fear keep their own dice.
  {
    const spec = diceSpec({ dice: [
      { groupId: 'hope', sides: 12, color: '#fbbf24', value: 9 },
      { groupId: 'fear', sides: 12, color: '#a855f7', value: 4 }
    ]});
    assert(spec.length === 2, `duality dice stay in two groups (got ${spec.length})`);
    assert(spec[0].themeColor === '#fbbf24' && spec[1].themeColor === '#a855f7',
      'each duality die keeps its own colour');
    // dice-box decides a die's result by ray-casting the settled face; a
    // `value` in the notation is ignored for rendered dice. Emitting one
    // implied a guarantee the engine does not honour, which is how the
    // numbers came to disagree with the dice in the first place.
    assert(spec.every(g => !('value' in g)),
      'no face values are passed to the engine — it cannot honour them');
  }

  // Same sides and colour collapse into one group carrying every face.
  {
    const spec = diceSpec({ dice: [
      { sides: 6, color: '#3b82f6', value: 3 },
      { sides: 6, color: '#3b82f6', value: 5 },
      { sides: 6, color: '#3b82f6', value: 1 }
    ]});
    assert(spec.length === 1, `matching dice collapse into one group (got ${spec.length})`);
    assert(spec[0].qty === 3, `group carries the full quantity (got ${spec[0].qty})`);
  }

  // The engine cannot be told what to land on, so the faces are meaningless.
  // Runes carry no number and therefore cannot contradict the real total; a
  // numbered theme here would print wrong digits next to the right answer.
  {
    const roll = { dice: [{ sides: 12, color: '#fbbf24', value: 9 }] };
    assert(diceSpec(roll)[0].theme === THEME_RUNES, 'dice always wear the rune theme');
    assert(THEME_RUNES === 'magic', 'the rune theme is the one shipped in public/assets');
  }

  // Grouping is by *consecutive* runs — a colour change splits, and changing
  // back opens a new group rather than rejoining the first.
  {
    const spec = diceSpec({ dice: [
      { sides: 6, color: '#aaa', value: 1 },
      { sides: 6, color: '#bbb', value: 2 },
      { sides: 6, color: '#aaa', value: 3 }
    ]});
    assert(spec.length === 3, `a colour change splits consecutive runs (got ${spec.length})`);
  }

  // Mixed sides never share a group, or dice would render with wrong faces.
  {
    const spec = diceSpec({ dice: [
      { sides: 20, color: '#fff', value: 18 },
      { sides: 6, color: '#fff', value: 4 }
    ]});
    assert(spec.length === 2, 'different sides never share a group');
    assert(spec[0].sides === 20 && spec[1].sides === 6, 'each group keeps its die size');
  }

  // Defensive: a malformed or empty roll must not throw into the animation.
  {
    assert(diceSpec({ dice: [] }).length === 0, 'an empty roll yields no dice groups');
    assert(diceSpec({}).length === 0, 'a roll with no dice field yields no groups');
    assert(diceSpec(null).length === 0, 'a null roll yields no groups');
  }

  assert(MAX_CONCURRENT_ROLLS >= 4 && MAX_CONCURRENT_ROLLS <= 12,
    `concurrency cap is a sane table size (got ${MAX_CONCURRENT_ROLLS})`);
}


section('Hope & scars');
{
  const full = [false, false, false, false, false, false];

  // Basic scar arithmetic.
  {
    assert(usableHopeMax({ scars: 0 }, full) === 6, 'no scars leaves all six Hope slots usable');
    assert(usableHopeMax({ scars: 2 }, full) === 4, 'two scars cross out two slots');
    assert(usableHopeMax({}, full) === 6, 'a character with no scars field is treated as unscarred');
    assert(usableHopeMax({ scars: 99 }, full) === 0, 'more scars than slots floors at zero, never negative');
  }

  // The DM sheet used to render the numerator over ALL filled slots while the
  // denominator subtracted scars, so a full track with one scar read "6/5".
  {
    const allHeld = [true, true, true, true, true, true];
    const c = { scars: 1 };
    assert(usableHopeFilled(c, allHeld) === 5 && usableHopeMax(c, allHeld) === 5,
      `a fully-held track with one scar reads 5/5, not 6/5 (got ${usableHopeFilled(c, allHeld)}/${usableHopeMax(c, allHeld)})`);
  }

  // Scarred slots are the trailing ones, matching how the sheet draws them.
  {
    const held = [true, true, false, false, false, true];
    assert(usableHopeFilled({ scars: 1 }, held) === 2,
      'Hope sitting in a scarred slot does not count as usable');
    assert(isScarredSlot(5, { scars: 1 }, held) && !isScarredSlot(4, { scars: 1 }, held),
      'the last slot is the scarred one');
  }

  // THE REGRESSION: the portal passed the scar-reduced track to the persist
  // path, so every Hope tap saved a shorter array and a scarred character's
  // maximum Hope ratcheted down a slot at a time. Simulate that loop.
  {
    const toBoolArray = (filled, max) => Array.from({ length: max }, (_, i) => i < filled);
    const scars = 1;
    let stored = [...full];
    for (let tap = 0; tap < 5; tap++) {
      const trueMax = normalizeHopeSlots(stored).length;      // what must be persisted
      const displayMax = Math.max(0, trueMax - scars);         // what the UI shows
      const filled = Math.min(1, displayMax);
      stored = toBoolArray(filled, trueMax);                   // the fixed behaviour
    }
    assert(stored.length === 6,
      `five Hope taps on a scarred character leave the track six long (got ${stored.length})`);
  }

  // Repairing characters already damaged by that bug.
  {
    assert(normalizeHopeSlots([true, false, true, false]).length === 6,
      'a track shortened to four is repaired back to six');
    assert(normalizeHopeSlots([true, false, true, false]).slice(0, 4).join() === 'true,false,true,false',
      'repairing preserves the Hope that was already held');
    assert(normalizeHopeSlots(undefined).length === 6, 'a missing track becomes a full empty one');
    assert(normalizeHopeSlots([]).length === 6, 'an empty track becomes a full empty one');
  }

  // Removing a scar must give the slot straight back — max Hope is derived,
  // never stored, which is what makes removal possible at all.
  {
    const before = usableHopeMax({ scars: 1 }, full);
    const after = usableHopeMax({ scars: 0 }, full);
    assert(before === 5 && after === 6, `removing a scar restores a slot (${before} -> ${after})`);
  }
}

// ── Constellation on small screens ──
section('Relationship graph — scale invariance & focus');
{
  // Everything inside the graph's <svg> lives in world units, so what the eye
  // gets is `world x zoom`. fitToView settles around 0.29 on a 390px phone and
  // clamps at a 0.15 floor for a big campaign — that turned a nominal 44px tap
  // target into 6.6px. The counter-scale has to hold across the whole range.
  const ZOOMS = [0.15, 0.29, 0.5, 1, 2];
  {
    const worst = ZOOMS.map(z => screenSizeForWorld(worldSizeForScreenPx(MIN_TAP_RADIUS_PX, z), z));
    assert(worst.every(px => Math.abs(px - MIN_TAP_RADIUS_PX) < 1e-9),
      `tap radius stays ${MIN_TAP_RADIUS_PX}px on screen at every zoom (${worst.map(v => v.toFixed(1)).join(', ')})`);
    assert(worst.every(px => px * 2 >= 44), 'that is a 44px diameter target, the accessible minimum');
  }

  // The render takes max(r * 2, counterScaled), so a big node keeps its own
  // hit area and only small ones get inflated.
  {
    const hit = (r, z) => Math.max(r * 2, worldSizeForScreenPx(MIN_TAP_RADIUS_PX, z));
    assert(hit(4, 0.15) === worldSizeForScreenPx(MIN_TAP_RADIUS_PX, 0.15),
      'a small node zoomed way out gets the counter-scaled hit area');
    assert(hit(400, 1) === 800, 'a large node keeps its own, larger hit area');
  }

  // Degenerate zooms must not produce NaN/Infinity radii — a bad viewBox blanks
  // the whole canvas.
  {
    [0, -1, NaN, undefined, null].forEach(bad => {
      const v = worldSizeForScreenPx(MIN_TAP_RADIUS_PX, bad);
      assert(Number.isFinite(v) && v > 0, `zoom ${String(bad)} still yields a finite radius (${v})`);
    });
  }

  // Counter-scaled labels stay readable but collide once zoomed out, so they
  // thin by importance rather than all-or-nothing.
  {
    const hub = { importance: 9 };
    const mid = { importance: 4 };
    const leaf = { importance: 1 };
    assert(labelVisibleFor(leaf, 1) && labelVisibleFor(hub, 1), 'zoomed in, everything is labelled');
    assert(labelVisibleFor(mid, 0.5) && !labelVisibleFor(leaf, 0.5), 'mid zoom keeps connected nodes only');
    assert(labelVisibleFor(hub, 0.2) && !labelVisibleFor(mid, 0.2), 'zoomed out, only the hubs keep names');
    assert(!labelVisibleFor(undefined, 0.2), 'a missing node never claims a label');
  }

  // Tap-to-focus feeds findConnectedComponent, which was imported and wired but
  // never actually reachable — nothing ever called setFocusNode with an id.
  {
    const nodes = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, name: id }));
    const edges = [
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'bc', source: 'b', target: 'c' },
      { id: 'de', source: 'd', target: 'e' },   // a separate island
    ];
    const comp = findConnectedComponent('a', nodes, edges);
    assert(comp.nodes.map(n => n.id).sort().join('') === 'abc',
      'focusing a node returns its whole component, not just direct neighbours');
    assert(comp.edges.length === 2, 'and only the edges inside that component');
    assert(!comp.nodes.some(n => n.id === 'd'), 'the unrelated island is excluded');

    const lone = findConnectedComponent('z', [{ id: 'z', name: 'z' }], []);
    assert(lone.nodes.length === 1 && lone.edges.length === 0, 'an isolated node focuses to just itself');
  }
}

console.log(failures === 0 ? '\nAll smoke tests passed.' : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
