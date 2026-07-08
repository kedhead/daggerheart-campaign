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
import { buildTimeline, timelineDuration } from '../src/components/Storybook/cinematicTimeline.js';
import { marksForDamage } from '../src/utils/thresholdDamage.js';
import { splitCardFeatures } from '../src/utils/domainCardText.js';
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
assert(DAGGERHEART_ADVERSARIES.length === 129, `129 adversaries (got ${DAGGERHEART_ADVERSARIES.length})`);
{
  const roles = new Set(['minion', 'horde', 'standard', 'bruiser', 'skulk', 'ranged', 'support', 'social', 'leader', 'solo']);
  const bad = DAGGERHEART_ADVERSARIES.filter(a =>
    !roles.has(a.role) || ![1, 2, 3, 4].includes(a.tier) || !a.attackDamage || !a.features?.length ||
    (a.role === 'minion' && (a.hp !== 1 || a.thresholds.minor !== 0))
  );
  assert(bad.length === 0, `all adversaries valid (bad: ${bad.map(a => a.name).join(', ') || 'none'})`);
}
assert(DOMAIN_CARDS.length === 189, `189 domain cards (got ${DOMAIN_CARDS.length})`);
assert(DOMAIN_CARDS.every(c => Number.isInteger(c.recallCost) && c.recallCost >= 0 && c.recallCost <= 4),
  'every domain card has a recall cost 0-4');
assert(DAGGERHEART_ENVIRONMENTS.length === 19, `19 environments (got ${DAGGERHEART_ENVIRONMENTS.length})`);

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

console.log(failures === 0 ? '\nAll smoke tests passed.' : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
