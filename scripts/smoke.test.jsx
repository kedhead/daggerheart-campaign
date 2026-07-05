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
import { fallbackAdversaryStats } from '../src/services/adversaryGenerator.js';
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

console.log(failures === 0 ? '\nAll smoke tests passed.' : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
