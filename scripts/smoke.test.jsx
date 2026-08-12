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
  filterGraphByTypes,
  filterIsolatedNodes,
  buildGraphEdges,
  entityTextsFor,
  isInferrableMention,
  selectOpeningView,
  hubLimitFor,
  layoutLabels,
  truncateLabel,
  LABEL_MAX_CHARS,
  worldSizeForScreenPx,
  screenSizeForWorld,
  MIN_TAP_RADIUS_PX
} from '../src/utils/graphCalculations.js';
import { ENVIRONMENT_FEATURE_TYPES } from '../src/data/daggerheartEnvironments.js';
import {
  ENVIRONMENT_TIER_BENCHMARKS,
  normalizeGeneratedEnvironment,
  fallbackEnvironmentStats,
  resolveAdversarySlots,
  fitRosterToBudget
} from '../src/services/environmentGenerator.js';
import {
  buildStoryGraph,
  sortSessionsByDate,
  sessionRecapTexts,
  hasRecap,
  STORY_MIN_GAP
} from '../src/utils/storyGraph.js';
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
import { isTrashed, partitionCharacters, trashFields, nameMatches, formatDeletedAt } from '../src/utils/characterTrash.js';
import { DeleteCharacterPrompt } from '../src/components/Characters/ConfirmDeleteCharacterModal.jsx';
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

  // Counter-scaling fixed label SIZE and thereby caused a label COLLISION
  // problem: constant-size names over crowded nodes pile on top of each other.
  // A zoom threshold controlled how many appeared but nothing about where, so
  // placement is now packed in screen space.
  {
    const opts = { zoom: 1, pan: { x: 0, y: 0 }, viewport: { w: 800, h: 600 } };

    // Two nodes on the same spot: one label, not two stacked.
    const stacked = [
      { id: 'a', name: 'Thornwood Bridge', x: 400, y: 300, radius: 8, importance: 9 },
      { id: 'b', name: 'Thornwood Bridge Approach', x: 402, y: 302, radius: 8, importance: 2 },
    ];
    const shown = layoutLabels(stacked, opts);
    assert(shown.size === 1, `overlapping labels collapse to one (got ${shown.size})`);
    assert(shown.has('a'), 'and the better-connected node is the one that keeps its name');

    // Far apart: both fit.
    const apart = [
      { id: 'a', name: 'Alpha', x: 100, y: 100, radius: 8, importance: 5 },
      { id: 'b', name: 'Beta', x: 600, y: 500, radius: 8, importance: 5 },
    ];
    assert(layoutLabels(apart, opts).size === 2, 'labels far apart are both drawn');

    // The budget is a hard cap regardless of room.
    const many = Array.from({ length: 40 }, (_, i) => ({
      id: `n${i}`, name: `Node ${i}`, x: 20 + i * 19, y: 40 + (i % 8) * 70, radius: 6, importance: 40 - i,
    }));
    assert(layoutLabels(many, { ...opts, maxLabels: 12 }).size <= 12, 'the label budget is respected');

    // Offscreen labels must not eat the budget.
    const offscreen = [
      { id: 'far', name: 'Way Off Screen', x: 90000, y: 90000, radius: 8, importance: 99 },
      { id: 'near', name: 'On Screen', x: 400, y: 300, radius: 8, importance: 1 },
    ];
    const culled = layoutLabels(offscreen, { ...opts, maxLabels: 1 });
    assert(culled.has('near') && !culled.has('far'),
      'an offscreen label is skipped so a visible one can use the budget');

    assert(layoutLabels([], opts).size === 0, 'an empty graph draws no labels');
    assert(layoutLabels(stacked, { ...opts, zoom: 0 }).size >= 1, 'a degenerate zoom still places labels');

    // Truncation at 20 chars made "THE SAGEWILDS CORRUP…" and "THE CORRUPTED
    // HEART…" near-indistinguishable on a real campaign.
    assert(truncateLabel('Short') === 'Short', 'a short name is left alone');
    assert(truncateLabel('The Sagewilds Corruption Spreads').length === LABEL_MAX_CHARS + 1,
      'a long name is cut to the limit plus an ellipsis');
    assert(LABEL_MAX_CHARS > 20, 'and the limit is looser than the old 20 characters');
  }

  // Opening view. A hundred stars never fit a phone, and over a year a flat
  // "top N by connections" is worse than it looks: core NPCs are named in
  // every session and pile up degree, while each session links to a handful of
  // things — so events would never appear at all. Draft round-robin by type.
  {
    const nodes = [
      ...Array.from({ length: 20 }, (_, i) => ({ id: `npc${i}`, type: 'npc', name: `NPC ${i}`, importance: 50 - i })),
      { id: 's0', type: 'session', name: 'Session One', importance: 3 },
      { id: 's1', type: 'session', name: 'Session Two', importance: 2 },
      { id: 't0', type: 'timelineEvent', name: 'The Siege', importance: 4 },
    ];
    const edges = [
      { id: 'e1', source: 'npc0', target: 't0' },     // both survive
      { id: 'e2', source: 'npc0', target: 'npc19' },  // npc19 is trimmed
    ];

    const view = selectOpeningView(nodes, edges, 6);
    const types = view.nodes.map(n => n.type);
    assert(view.nodes.length === 6, 'the opening view honours its limit');
    assert(types.includes('session') && types.includes('timelineEvent'),
      'sessions and events appear even though every NPC out-ranks them');
    assert(view.nodes.some(n => n.id === 'npc0'), 'the strongest NPC is still there');
    assert(view.edges.length === 1, 'edges to trimmed nodes are dropped, leaving no dangling ends');
    assert(view.trimmedCount === nodes.length - 6, 'and the remainder is counted for the "show all" chip');

    // Regression against the flat-ranking behaviour this replaced.
    const flatTop6 = [...nodes].sort((a, b) => b.importance - a.importance).slice(0, 6);
    assert(flatTop6.every(n => n.type === 'npc'),
      'sanity: ranking by connections alone really would have shown only NPCs');

    // A type that runs out hands its slots back rather than wasting them.
    const wide = selectOpeningView(nodes, edges, 10);
    assert(wide.nodes.length === 10, 'slots from exhausted types are redistributed, not lost');

    const small = selectOpeningView(nodes.slice(0, 3), [], 20);
    assert(small.nodes.length === 3 && small.trimmedCount === 0,
      'a campaign smaller than the limit is left completely alone');

    assert(selectOpeningView(nodes, edges, 6).nodes.map(n => n.id).join() ===
           selectOpeningView(nodes, edges, 6).nodes.map(n => n.id).join(),
      'the selection is deterministic between renders');
  }

  // The limit scales, because a fixed one ages badly in both directions.
  {
    assert(hubLimitFor(12) === 12, 'a campaign under the floor is shown whole');
    assert(hubLimitFor(99) === 35, `a 99-entity campaign opens on 35 (got ${hubLimitFor(99)})`);
    assert(hubLimitFor(500) === 60, 'a year-long campaign is capped so a phone stays legible');
    assert(hubLimitFor(0) > 0 && hubLimitFor(NaN) > 0, 'degenerate counts still yield a usable limit');
    assert(hubLimitFor(200) > hubLimitFor(60), 'a bigger campaign always opens on at least as much');
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

// ── Inference had to be tightened after seeing it on a real campaign ──
section('Relationship graph — inference strictness');
{
  const node = (type, id, name, data) => ({ id: `${type}-${id}`, type, name, data: { id, name, ...data } });

  // autoLinkText's 3-character floor suits a button you can undo. Silent
  // inference hung a spoke off every passing mention.
  {
    assert(isInferrableMention('Thornwood Bridge', 'Met at Thornwood Bridge once.'),
      'a multi-word name is distinctive enough on a single mention');
    assert(!isInferrableMention('Sagewilds', 'The Sagewilds are burning.'),
      'a single-word name mentioned once is not enough');
    assert(isInferrableMention('Sagewilds', 'The Sagewilds burn. Nobody leaves the Sagewilds.'),
      'the same name twice earns the edge');
    assert(!isInferrableMention('Jeff', 'Jeff. Jeff. Jeff.'),
      'a name under the length floor never qualifies, however often it appears');
    assert(!isInferrableMention(null, 'text') && !isInferrableMention('Name', null),
      'missing name or text is handled');
  }

  // The end-to-end effect: a one-off mention no longer creates a spoke, but a
  // deliberate [[link]] is untouched by any of this.
  {
    const nodes = [
      node('location', 'l1', 'Sagewilds', {}),
      node('encounter', 'e1', 'Border Skirmish', { description: 'A raid in the Sagewilds.' }),
    ];
    assert(buildGraphEdges(nodes).edges.length === 0, 'a single mention of a one-word place infers nothing');

    const typed = [
      node('location', 'l1', 'Sagewilds', {}),
      node('encounter', 'e1', 'Border Skirmish', { description: 'A raid in the [[Sagewilds]].' }),
    ];
    const edges = buildGraphEdges(typed).edges;
    assert(edges.length === 1 && edges[0].inferred === false,
      'tightening inference never touches a link you typed');
  }

}

// ── Why encounters floated unconnected ──
section('Relationship graph — edge inference & unlinked nodes');
{
  const node = (type, id, name, data) => ({ id: `${type}-${id}`, type, name, data: { id, name, ...data } });

  // The bug that started this: the graph only ever drew an edge from a typed
  // [[link]], and the Encounter Builder stores opponents as structured
  // adversarySlots, so builder-made encounters had almost no prose to link from.
  {
    const nodes = [
      node('location', 'l1', 'Thornwood Bridge', {}),
      node('npc', 'n1', 'Captain Vale', {}),
      node('encounter', 'e1', 'Bridge Ambush', {
        description: 'Bandits strike at Thornwood Bridge before dawn.',
        adversarySlots: [{ adversaryId: 'adv-3', quantity: 2 }],
      }),
    ];
    const { edges } = buildGraphEdges(nodes);
    const bridge = edges.find(e => e.id.includes('location-l1'));
    assert(!!bridge, 'an encounter naming a location in prose now links to it');
    assert(bridge.inferred === true, 'and that edge is marked as inferred, not typed');
    assert(!edges.some(e => e.id.includes('npc-n1')), 'an unmentioned NPC gets no edge');
  }

  // A typed link is a decision, not a guess — it must never be downgraded,
  // whichever pass sees the pair first.
  {
    const nodes = [
      node('location', 'l1', 'Thornwood Bridge', {}),
      node('encounter', 'e1', 'Bridge Ambush', {
        description: 'Fought at [[Thornwood Bridge]].',
        tactics: 'Archers hold Thornwood Bridge from the north bank.',
      }),
    ];
    const { edges } = buildGraphEdges(nodes);
    assert(edges.length === 1, 'a pair linked from two fields still yields one edge');
    assert(edges[0].inferred === false, 'a typed link beats a mention of the same pair');
  }

  // Short names are where inference goes wrong; autoLinkText's 3-char floor is
  // what stops "Al" matching half the campaign.
  {
    const nodes = [
      node('npc', 'n1', 'Al', {}),
      node('note', 'x1', 'Ledger', { content: 'Al paid the toll. Also owed.' }),
    ];
    const { edges } = buildGraphEdges(nodes);
    assert(edges.length === 0, 'a two-character name is never inferred');
  }

  // Self-reference and the encounter Environment field, which was silently
  // dropped because getEntityTexts never read it.
  {
    const texts = entityTextsFor(
      { description: 'd', enemies: 'e', environment: 'env', tactics: 't', rewards: 'r' },
      'encounter'
    );
    assert(texts.includes('env'), 'the encounter Environment field is read for links');
    assert(entityTextsFor({ adversarySlots: [{ adversaryId: 'a' }] }, 'encounter').length === 0,
      'structured adversarySlots are never treated as linkable text');

    const nodes = [node('npc', 'n1', 'Captain Vale', { notes: 'Captain Vale trusts nobody.' })];
    assert(buildGraphEdges(nodes).edges.length === 0, 'an entity naming itself gets no self-edge');
  }

  // Hiding unlinked nodes must be judged against what is actually on screen —
  // running it before the type filter would strand nodes whose only partner
  // had just been filtered away.
  {
    const nodes = [
      { id: 'npc-1', type: 'npc', name: 'A' },
      { id: 'location-1', type: 'location', name: 'B' },
      { id: 'encounter-1', type: 'encounter', name: 'C' },
    ];
    const edges = [{ id: 'e', source: 'npc-1', target: 'location-1' }];

    const all = filterIsolatedNodes(nodes, edges);
    assert(all.nodes.length === 2 && all.hiddenCount === 1,
      'the unconnected encounter is hidden and counted');

    // Now drop locations: the NPC's only partner is gone, so it is unlinked too.
    const typed = filterGraphByTypes(nodes, edges, ['npc', 'encounter']);
    const pruned = filterIsolatedNodes(typed.nodes, typed.edges);
    assert(pruned.nodes.length === 0 && pruned.hiddenCount === 2,
      'filtering out a partner makes the survivor unlinked too (order matters)');

    assert(filterIsolatedNodes([], []).hiddenCount === 0, 'an empty graph hides nothing');
  }

  // Cost guard: inference builds a regex per name per text field, and this runs
  // on every entities change alongside the existing force simulation.
  {
    const many = [];
    for (let i = 0; i < 200; i++) {
      many.push(node('npc', `n${i}`, `Wanderer ${i} of the Vale`, {
        description: `Travelled with Wanderer ${(i + 1) % 200} of the Vale through the pass.`,
        notes: 'No further record survives in the ledgers of the old city.',
      }));
    }
    const t0 = Date.now();
    const { edges } = buildGraphEdges(many);
    const ms = Date.now() - t0;
    assert(edges.length > 0, `a 200-entity campaign infers ${edges.length} edges`);
    assert(ms < 8000, `and builds in ${ms}ms (budget 8000ms)`);
    console.log(`  info: 200 entities -> ${edges.length} edges in ${ms}ms`);
  }
}

// ── The story map: the campaign as its recaps report it ──
section('Story map — recap-driven graph');
{
  const session = (id, date, fields) => ({
    id: `session-${id}`, type: 'session', name: `Session ${id}`,
    data: { id, name: `Session ${id}`, date, ...fields },
  });
  const ent = (type, id, name) => ({ id: `${type}-${id}`, type, name, data: { id, name } });

  // Chronology is the whole point, so ordering has to be right — including the
  // undated sessions that must not silently lead the campaign.
  {
    const sorted = sortSessionsByDate([
      session('c', '2026-03-01', {}), session('a', '2026-01-15', {}),
      session('z', '', {}), session('b', '2026-02-20', {}),
    ]);
    assert(sorted.map(s => s.data.id).join() === 'a,b,c,z',
      `sessions run oldest to newest with undated ones last (got ${sorted.map(s => s.data.id).join()})`);
  }

  // A recap is only a recap if something was written up.
  {
    assert(hasRecap({ summary: 'We fought.' }), 'a summary counts as a recap');
    assert(hasRecap({ highlights: ['Vale betrayed us'] }), 'highlights alone count');
    assert(!hasRecap({ summary: '   ' }), 'whitespace is not a recap');
    assert(!hasRecap({ status: 'planned' }), 'a planned session with nothing written is not a chapter');
    assert(sessionRecapTexts({ summary: 's', highlights: ['h'], dmNotes: 'd' }).length === 3,
      'summary, highlights and dmNotes are all read');
  }

  // The graph itself: a spine, with what each recap named branching off it.
  {
    const nodes = [
      ent('npc', 'n1', 'Captain Vale'),
      ent('location', 'l1', 'Thornwood Bridge'),
      ent('npc', 'n2', 'Never Mentioned'),
      session('1', '2026-01-01', { summary: 'Captain Vale held Thornwood Bridge.' }),
      session('2', '2026-01-08', { summary: 'Captain Vale fell back.', highlights: ['Captain Vale wounded'] }),
      session('3', '2026-01-15', { status: 'planned' }),   // no recap, not a chapter
    ];
    const story = buildStoryGraph(nodes);

    assert(story.sessionCount === 2, `only written-up sessions become chapters (got ${story.sessionCount})`);
    assert(!story.nodes.some(n => n.id === 'npc-n2'), 'an entity no recap mentions is absent, with no filter needed');

    const spine = story.edges.filter(e => e.spine);
    assert(spine.length === 1, 'consecutive sessions are joined by a spine edge');
    assert(spine[0].source === 'session-1' && spine[0].target === 'session-2', 'and it runs forwards in time');

    const sessionNodes = story.nodes.filter(n => n.isSpine);
    assert(sessionNodes.every(n => n.x === 0), 'sessions sit on a single vertical line');
    assert(sessionNodes[0].y < sessionNodes[1].y, 'later sessions sit further down it');
    assert(story.nodes.filter(n => !n.isSpine).every(n => n.x !== 0), 'entities sit off the spine, never on it');

    // A recurring character is the point of the view: one node touching several
    // chapters, drawn larger, not a duplicate per session.
    const vale = story.nodes.filter(n => n.id === 'npc-n1');
    assert(vale.length === 1, 'an entity in two recaps appears once, not twice');
    assert(vale[0].importance === 2, 'and its importance is how many chapters it spans');
    const bridge = story.nodes.find(n => n.id === 'location-l1');
    assert(vale[0].radius > bridge.radius, 'a recurring entity is drawn larger than a one-off');
  }

  // Typed links still beat inference here, and the strict rule still applies.
  {
    const nodes = [
      ent('location', 'l1', 'Sagewilds'),
      session('1', '2026-01-01', { summary: 'A raid in the Sagewilds.' }),
    ];
    assert(buildStoryGraph(nodes).nodes.filter(n => !n.isSpine).length === 0,
      'a single mention of a one-word name is still too weak to infer');

    const typed = [
      ent('location', 'l1', 'Sagewilds'),
      session('1', '2026-01-01', { summary: 'A raid in the [[Sagewilds]].' }),
    ];
    const built = buildStoryGraph(typed);
    const link = built.edges.find(e => !e.spine);
    assert(link && link.inferred === false, 'a typed link in a recap is honoured as deliberate');
  }

  // Layout must not stack entities on top of each other, and must be stable —
  // a map that reshuffles every render is unreadable however well it is packed.
  {
    const nodes = [session('1', '2026-01-01', {
      summary: Array.from({ length: 12 }, (_, i) => `Waystation Number ${i}`).join(', '),
    })];
    for (let i = 0; i < 12; i++) nodes.push(ent('location', `l${i}`, `Waystation Number ${i}`));

    const story = buildStoryGraph(nodes);
    const placed = story.nodes.filter(n => !n.isSpine);
    assert(placed.length === 12, `every mentioned entity is placed, none dropped (got ${placed.length})`);

    const collisions = placed.filter((a, i) =>
      placed.some((b, j) => j !== i && a.x === b.x && Math.abs(a.y - b.y) < STORY_MIN_GAP)
    );
    assert(collisions.length === 0, `no two entities overlap in a lane (${collisions.length} collisions)`);

    const again = buildStoryGraph(nodes);
    assert(JSON.stringify(story.nodes.map(n => [n.id, n.x, n.y])) ===
           JSON.stringify(again.nodes.map(n => [n.id, n.x, n.y])),
      'the layout is identical between builds — no simulation, no drift');
  }

  // A year is ~50 sessions; the map opens on the recent ones.
  {
    // Genuinely increasing dates — one session a week for 40 weeks. Trimming
    // is by date, not array order, so the fixture has to be honest about that.
    const nodes = [];
    for (let i = 0; i < 40; i++) {
      const day = new Date(Date.UTC(2026, 0, 4) + i * 7 * 86400000).toISOString().slice(0, 10);
      nodes.push(session(String(i).padStart(2, '0'), day, { summary: 'The company marched on.' }));
    }
    const limited = buildStoryGraph(nodes, { sessionLimit: 12 });
    assert(limited.sessionCount === 12, 'the opening view holds the session limit');
    assert(limited.trimmedSessions === 28, 'and reports the rest for the "all sessions" chip');

    const all = buildStoryGraph(nodes, { sessionLimit: Infinity });
    assert(all.sessionCount === 40 && all.trimmedSessions === 0, 'asking for all of them shows all of them');

    // The tail, not the head: recent sessions are what "what's happening" means.
    const keptIds = limited.nodes.filter(n => n.isSpine).map(n => n.id);
    assert(keptIds.includes('session-39') && !keptIds.includes('session-00'),
      'the most recent sessions are kept and the oldest trimmed');
  }

  // Degenerate inputs must not throw — this runs on every campaign, including
  // brand new ones.
  {
    assert(buildStoryGraph([]).sessionCount === 0, 'an empty campaign yields an empty story');
    assert(buildStoryGraph([ent('npc', 'n1', 'Nobody')]).sessionCount === 0,
      'a campaign with no sessions yields an empty story');
    assert(buildStoryGraph(null).nodes.length === 0, 'a missing node list is handled');
  }
}

// ── Environment builder ──
section('Environment generator');
{
  // Benchmarks must match the SRD content actually shipped in this repo, or the
  // prompt teaches the model numbers the rest of the app disagrees with.
  {
    const srdByTier = {};
    DAGGERHEART_ENVIRONMENTS.forEach(e => {
      if (e.difficulty > 0) (srdByTier[e.tier] ||= []).push(e.difficulty);
    });
    Object.entries(ENVIRONMENT_TIER_BENCHMARKS).forEach(([tier, b]) => {
      const actual = srdByTier[tier] || [];
      const lo = Math.min(...actual);
      const hi = Math.max(...actual);
      assert(b.difficulty[0] === lo && b.difficulty[1] === hi,
        `tier ${tier} benchmark ${b.difficulty.join('-')} matches the SRD's ${lo}-${hi}`);
    });
    assert(ENVIRONMENT_TIER_BENCHMARKS[4].difficulty[0] > ENVIRONMENT_TIER_BENCHMARKS[1].difficulty[1],
      'tier 4 is unambiguously harder than tier 1');
  }

  // Every feature type the official data uses must be renderable and selectable.
  {
    const used = new Set();
    DAGGERHEART_ENVIRONMENTS.forEach(e => (e.features || []).forEach(f => used.add(f.type)));
    const missing = [...used].filter(t => !ENVIRONMENT_FEATURE_TYPES.includes(t));
    assert(missing.length === 0,
      `the feature type list covers everything the SRD uses (missing: ${missing.join(', ') || 'none'})`);
    assert(ENVIRONMENT_FEATURE_TYPES.includes('reaction') && ENVIRONMENT_FEATURE_TYPES.includes('countdown'),
      'including reaction and countdown, which the form and card used to drop');
  }

  // Parsing model output is where the bugs live — the network call is not.
  {
    const env = normalizeGeneratedEnvironment({
      name: 'The Drowned Archive',
      tier: 2, type: 'exploration', difficulty: 14,
      description: 'Flooded stacks of a sunken library.',
      impulses: ['Swallow the careless', '  ', 'Offer forbidden knowledge'],
      features: [
        { name: 'Rising Water', type: 'countdown', description: 'A clock ticks toward full submersion.' },
        { name: 'Grasping Current', type: 'reaction', description: 'Anyone who swims must make a Difficulty 14 Spirit save or be pulled under.' },
        { name: 'Invented', type: 'sorcery', description: 'Nonsense type.' },
        { name: 'Costly', type: 'action', cost: '  ', description: 'No real cost.' },
      ],
      potentialAdversaries: ['Drowned Scribe', ''],
    }, { tier: 2, type: 'exploration' });

    assert(env.features[0].type === 'countdown' && env.features[1].type === 'reaction',
      'countdown and reaction features survive validation');
    assert(env.features[2].type === 'passive', 'an invented feature type falls back to passive');
    assert(!('cost' in env.features[3]), 'a blank Fear cost is dropped rather than stored');
    assert(env.impulses.length === 2, 'blank impulses are stripped');
    assert(env.potentialAdversaries.length === 1, 'blank adversary suggestions are stripped');

    // The same D&D-ism sanitizer the adversary generator uses, applied here too:
    // hazard and reaction text is exactly where "Spirit save" creeps in.
    assert(!/save/i.test(env.features[1].description) && /Reaction Roll/.test(env.features[1].description),
      `the sanitizer rewrites saves in feature text (got "${env.features[1].description}")`);
  }

  // difficulty 0 is meaningful for events — two official tier 1 entries use it,
  // and `|| fallback` would silently overwrite a correct answer.
  {
    const event = normalizeGeneratedEnvironment({ name: 'Ambushed', type: 'event', difficulty: 0 }, { tier: 1, type: 'event' });
    assert(event.difficulty === 0, 'an event may keep difficulty 0 rather than being coerced');

    const missing = normalizeGeneratedEnvironment({ name: 'Nameless' }, { tier: 3, type: 'exploration' });
    assert(missing.difficulty === 17, `a missing difficulty falls back to the tier median (got ${missing.difficulty})`);

    const negative = normalizeGeneratedEnvironment({ name: 'Bad', difficulty: -5 }, { tier: 1, type: 'exploration' });
    assert(negative.difficulty > 0, 'a negative difficulty is rejected');
    assert(normalizeGeneratedEnvironment({}, {}).name === 'Unnamed Environment', 'empty output still yields a usable object');
  }

  // The model picks adversaries by name; ids are resolved here. A hallucinated
  // id would save as a dangling reference the encounter tracker skips silently.
  {
    const adversaries = [
      { id: 'a1', name: 'Dire Wolf', role: 'standard' },
      { id: 'a2', name: 'Bandit Minion', role: 'minion' },
      { id: 'a3', name: 'Bear', role: 'bruiser' },
    ];
    const { slots, unmatched } = resolveAdversarySlots([
      { name: 'Dire Wolf', quantity: 2 },
      { name: 'dire wolf', quantity: 1 },      // same adversary, different case
      { name: 'Kraken', quantity: 1 },         // not in this campaign
      { name: '', quantity: 3 },
    ], adversaries);

    assert(slots.length === 1 && slots[0].adversaryId === 'a1', 'names resolve to real campaign adversary ids');
    assert(slots[0].quantity === 3, 'the same adversary named twice merges into one slot');
    assert(unmatched.join() === 'Kraken', 'an adversary the campaign does not have is reported, not invented');
    assert(slots.every(s => adversaries.some(a => a.id === s.adversaryId)), 'no slot ever carries a dangling id');
    assert(resolveAdversarySlots(null, adversaries).slots.length === 0, 'missing model output yields no slots');
  }

  // Budget is enforced in code. The model is not asked to be a calculator.
  {
    const adversaries = [
      { id: 'solo', name: 'Kraken', role: 'solo' },       // 5 BP each
      { id: 'std', name: 'Soldier', role: 'standard' },   // 2 BP each
      { id: 'min', name: 'Rabble', role: 'minion' },      // 1 BP per party-size group
    ];
    const partySize = 4;
    const budget = calculateBPBudget(partySize);          // 14

    const over = [
      { adversaryId: 'solo', quantity: 3 },   // 15
      { adversaryId: 'std', quantity: 4 },    // 8  → 23 total
    ];
    const fitted = fitRosterToBudget(over, adversaries, partySize);
    assert(fitted.usedBP <= fitted.budget,
      `an over-budget roster is trimmed to fit (${fitted.usedBP} <= ${fitted.budget})`);
    assert(fitted.trimmed > 0, 'and reports that it trimmed something');
    assert(fitted.slots.length > 1, 'trimming keeps variety rather than collapsing to one adversary');

    const under = [{ adversaryId: 'std', quantity: 2 }];
    const kept = fitRosterToBudget(under, adversaries, partySize);
    assert(kept.trimmed === 0 && kept.usedBP === 4, 'a roster already within budget is left alone');

    // Minions cost per group of party-size, so trimming one at a time must not
    // loop forever on a slot whose cost does not change.
    const minions = [{ adversaryId: 'min', quantity: 200 }];
    const trimmedMinions = fitRosterToBudget(minions, adversaries, partySize);
    assert(trimmedMinions.usedBP <= trimmedMinions.budget,
      `a huge minion group is trimmed within budget (${trimmedMinions.usedBP} <= ${trimmedMinions.budget})`);

    assert(fitRosterToBudget([], adversaries, partySize).usedBP === 0, 'an empty roster costs nothing');
    assert(fitRosterToBudget(null, adversaries, partySize).slots.length === 0, 'a missing roster is handled');

    // The budget argument is honoured, so encounter adjustments flow through.
    const harder = fitRosterToBudget(over, adversaries, partySize, 2);
    assert(harder.budget === budget + 2, 'a difficulty adjustment raises the budget');
  }

  assert(typeof fallbackEnvironmentStats(9, 'nonsense').tier === 'number',
    'out-of-range tiers and unknown types still produce usable fallbacks');
  assert(fallbackEnvironmentStats(9, 'nonsense').type === 'exploration', 'an unknown type falls back to exploration');
}

// ── Character trash: a delete has to be recoverable ──
section('Character trash');
{
  const roster = [
    { id: 'a', name: 'Emmanita' },
    { id: 'b', name: 'Pippin', deletedAt: '2026-08-01T10:00:00.000Z' },
    { id: 'c', name: 'Bram', deceased: true },
    { id: 'd', name: 'Sela', deletedAt: '2026-08-11T10:00:00.000Z' },
    { id: 'e', name: 'Old Flag', deleted: true },
  ];
  const { active, trashed } = partitionCharacters(roster);

  assert(active.map(c => c.id).join(',') === 'a,c', 'the roster keeps living and fallen characters only');
  assert(trashed.length === 3, 'every trashed character is recoverable');
  assert(trashed[0].id === 'd' && trashed[1].id === 'b', 'trash is ordered newest deletion first');
  assert(trashed[2].id === 'e', 'a legacy `deleted: true` flag still counts as trashed');
  assert(!isTrashed({ name: 'Emmanita' }) && !isTrashed(null), 'an ordinary character is not trashed');
  assert(partitionCharacters().active.length === 0, 'a missing character list is handled');

  // The delete stamp has to be readable immediately — a pending serverTimestamp()
  // reads back as null locally and would flash the character back onto the roster.
  const stamp = trashFields({ uid: 'u1', displayName: 'Kendall' });
  assert(typeof stamp.deletedAt === 'string' && !Number.isNaN(Date.parse(stamp.deletedAt)),
    'the delete stamp is an immediately-readable ISO date');
  assert(isTrashed({ ...roster[0], ...stamp }), 'stamping a character moves it to the trash');
  assert(stamp.deletedBy === 'u1' && stamp.deletedByName === 'Kendall', 'the trash records who deleted it');
  assert(trashFields({ email: 'gm@example.com' }).deletedByName === 'gm@example.com',
    'a user without a display name is credited by email');
  assert(trashFields(undefined).deletedBy === null, 'a missing user does not break the delete');
  assert(formatDeletedAt(stamp.deletedAt) && !formatDeletedAt('not a date') && !formatDeletedAt(null),
    'deletion dates format, and junk dates are dropped');

  // Permanent deletion is gated on typing the name back.
  assert(nameMatches('emmanita ', 'Emmanita'), 'the confirmation ignores case and stray spaces');
  assert(!nameMatches('Emmanit', 'Emmanita') && !nameMatches('', 'Emmanita'),
    'a partial or empty name does not unlock a permanent delete');
}
{
  const character = { id: 'a', name: 'Emmanita', playerName: 'Kendall' };
  const soft = strip(renderToString(
    <DeleteCharacterPrompt character={character} onClose={() => {}} onConfirm={() => {}} />
  ));
  assert(soft.includes('Emmanita') && soft.includes('Move to Trash'), 'the delete prompt names the character');
  assert(soft.includes('restored'), 'and promises the sheet can be restored');
  assert(!soft.includes('disabled'), 'a recoverable delete needs no typed confirmation');

  const permanent = strip(renderToString(
    <DeleteCharacterPrompt character={character} permanent onClose={() => {}} onConfirm={() => {}} />
  ));
  assert(permanent.includes('to confirm') && permanent.includes('disabled'),
    'a permanent delete starts locked until the name is typed');
  assert(permanent.includes('cannot be undone'), 'and says plainly that it is final');
}

console.log(failures === 0 ? '\nAll smoke tests passed.' : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
