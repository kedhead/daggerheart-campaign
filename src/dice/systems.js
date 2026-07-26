// Pure roll logic for every supported game system. Given an `rng` with
// uniformDie(sides), each function returns a canonical roll record:
//   { dice: [{groupId, sides, color, label, value}], modifier, total,
//     outcome: 'hope'|'fear'|null, mode: string|null, flags: {...} }
// The shape is what gets persisted to Firestore and read back by every
// viewer. No side effects, no Firestore, no DOM.

import { uniformDie as defaultUniformDie } from './rng.js';

export const DICE_COLOR = {
  4: '#10b981',
  6: '#3b82f6',
  8: '#8b5cf6',
  10: '#ec4899',
  12: '#f59e0b',
  20: '#ef4444',
};

const HOPE_COLOR = '#fbbf24';
const FEAR_COLOR = '#a855f7';

function emptyFlags() {
  return { isCrit: false, isCritFail: false, isDoubles: false, complication: false };
}

// Daggerheart: 2d12 (Hope + Fear) + modifier, with optional advantage/disadvantage d6.
//   advantage: +1d6 added to total
//   disadvantage: -1d6 subtracted from total
export function rollDaggerheart({ modifier = 0, advantage = false, disadvantage = false } = {}, rng = defaultUniformDie) {
  const hope = rng(12);
  const fear = rng(12);
  const dice = [
    { groupId: 'hope', sides: 12, color: HOPE_COLOR, label: 'Hope', value: hope },
    { groupId: 'fear', sides: 12, color: FEAR_COLOR, label: 'Fear', value: fear },
  ];
  let total = hope + fear + (parseInt(modifier, 10) || 0);
  let mode = null;
  if (advantage && !disadvantage) {
    const bonus = rng(6);
    dice.push({ groupId: 'advantage', sides: 6, color: '#22c55e', label: 'Adv', value: bonus });
    total += bonus;
    mode = 'advantage';
  } else if (disadvantage && !advantage) {
    const penalty = rng(6);
    dice.push({ groupId: 'disadvantage', sides: 6, color: '#ef4444', label: 'Dis', value: penalty });
    total -= penalty;
    mode = 'disadvantage';
  }
  const outcome = hope === fear ? 'hope' : (hope > fear ? 'hope' : 'fear');
  const flags = { ...emptyFlags(), isDoubles: hope === fear };
  return { system: 'daggerheart', dice, modifier: parseInt(modifier, 10) || 0, total, outcome, mode, flags };
}

// D&D 5e: 1 d20 (or 2 with adv/dis) + modifier.
export function rollDnD5e({ modifier = 0, mode = 'normal' } = {}, rng = defaultUniformDie) {
  const a = rng(20);
  const dice = [{ groupId: 'd20-a', sides: 20, color: DICE_COLOR[20], label: 'd20', value: a }];
  let kept = a;
  let normalizedMode = 'normal';
  if (mode === 'advantage' || mode === 'disadvantage') {
    const b = rng(20);
    dice.push({ groupId: 'd20-b', sides: 20, color: '#60a5fa', label: 'd20', value: b });
    kept = mode === 'advantage' ? Math.max(a, b) : Math.min(a, b);
    normalizedMode = mode;
  }
  const mod = parseInt(modifier, 10) || 0;
  const total = kept + mod;
  const flags = { ...emptyFlags(), isCrit: kept === 20, isCritFail: kept === 1 };
  return { system: 'dnd5e', dice, modifier: mod, total, outcome: null, mode: normalizedMode, flags, kept };
}

// Star Wars D6: N d6 with first die being the wild die. Wild explodes on 6
// (roll an extra d6 and add). Wild rolling 1 sets a complication flag.
export function rollStarWarsD6({ modifier = 0, count = 3 } = {}, rng = defaultUniformDie) {
  const n = Math.max(1, Math.min(20, parseInt(count, 10) || 1));
  const wild = rng(6);
  const dice = [{ groupId: 'wild', sides: 6, color: HOPE_COLOR, label: 'Wild', value: wild }];
  for (let i = 1; i < n; i++) {
    dice.push({ groupId: `d6-${i}`, sides: 6, color: DICE_COLOR[6], label: 'd6', value: rng(6) });
  }
  let total = dice.reduce((s, d) => s + d.value, 0);
  if (wild === 6) {
    const explode = rng(6);
    dice.push({ groupId: 'wildExplode', sides: 6, color: '#fde047', label: 'Wild!', value: explode });
    total += explode;
  }
  const mod = parseInt(modifier, 10) || 0;
  total += mod;
  const flags = { ...emptyFlags(), complication: wild === 1 };
  return { system: 'starwarsd6', dice, modifier: mod, total, outcome: null, mode: null, flags, wild };
}

// Generic: arbitrary mix of d4..d20 from a counts object like { d6: 2, d20: 1 }
// or a simple { sides, quantity } pair. Crit semantics apply only when d20s are present.
export function rollGeneric({ modifier = 0, diceConfig, sides, quantity, label } = {}, rng = defaultUniformDie) {
  const dice = [];
  if (diceConfig && typeof diceConfig === 'object') {
    let idx = 0;
    for (const [key, count] of Object.entries(diceConfig)) {
      const s = parseInt(String(key).replace(/^d/, ''), 10);
      if (!s || !count) continue;
      for (let i = 0; i < count; i++) {
        dice.push({
          groupId: `${key}-${idx++}`,
          sides: s,
          color: DICE_COLOR[s] || '#6366f1',
          label: `d${s}`,
          value: rng(s),
        });
      }
    }
  } else if (sides) {
    const s = parseInt(sides, 10);
    const q = Math.max(1, parseInt(quantity, 10) || 1);
    for (let i = 0; i < q; i++) {
      // Draw through the injected rng like every other branch. This used to
      // call rollNDice directly, which ignored `rng` and so could not be
      // replayed from physics results.
      dice.push({
        groupId: `d${s}-${i}`,
        sides: s,
        color: DICE_COLOR[s] || '#6366f1',
        label: `d${s}`,
        value: rng(s),
      });
    }
  }
  const mod = parseInt(modifier, 10) || 0;
  const total = dice.reduce((s, d) => s + d.value, 0) + mod;
  const d20s = dice.filter(d => d.sides === 20);
  const flags = {
    ...emptyFlags(),
    isCrit: d20s.some(d => d.value === 20),
    isCritFail: d20s.length > 0 && d20s.every(d => d.value === 1),
    isDoubles: dice.length >= 2 && dice.every(d => d.value === dice[0].value && d.sides === dice[0].sides),
  };
  return { system: 'generic', dice, modifier: mod, total, outcome: null, mode: null, flags, label: label || '' };
}

export function rollForSystem(system, config, rng) {
  switch (system) {
    case 'dnd5e': return rollDnD5e(config, rng);
    case 'starwarsd6': return rollStarWarsD6(config, rng);
    case 'generic': return rollGeneric(config, rng);
    case 'daggerheart':
    default: return rollDaggerheart(config, rng);
  }
}

export const SYSTEM_LABELS = {
  daggerheart: 'Daggerheart',
  dnd5e: 'D&D 5e',
  starwarsd6: 'Star Wars D6',
  generic: 'Generic',
};

// Parses adversary damage strings like "2d6+4 phy", "1d8 physical", "d10 mag"
// into rollDamage() params. Returns null if the string is unparseable.
export function parseDamageNotation(str) {
  if (!str) return null;
  const match = String(str).match(/^(\d+)?d(\d+)(?:\s*\+\s*(\d+))?/i);
  if (!match) return null;
  return {
    quantity: parseInt(match[1] || '1', 10),
    dieType: parseInt(match[2], 10),
    modifier: parseInt(match[3] || '0', 10),
  };
}
