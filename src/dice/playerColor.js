// Per-player dice color. Stored on the device; falls back to a stable
// palette pick derived from the user id, so two players who never touch
// the picker still get different colors at the table.

export const PLAYER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ffffff',
];

// Curated Duality (Hope/Fear d12) color sets. Every pair keeps the two dice
// clearly distinguishable so "with Hope / with Fear" stays readable at a
// glance — that's why this is a fixed list, not free-form pickers.
export const DUALITY_SETS = [
  { key: 'classic', label: 'Classic — Gold / Purple',   hope: '#eab308', fear: '#7c3aed' },
  { key: 'ember',   label: 'Ember — Flame / Coal',      hope: '#f97316', fear: '#7f1d1d' },
  { key: 'tide',    label: 'Tide — Foam / Depths',      hope: '#22d3ee', fear: '#1e3a8a' },
  { key: 'verdant', label: 'Verdant — Leaf / Moss',     hope: '#84cc16', fear: '#14532d' },
  { key: 'rose',    label: 'Rose — Petal / Thorn',      hope: '#f472b6', fear: '#881337' },
  { key: 'frost',   label: 'Frost — Ice / Midnight',    hope: '#e0f2fe', fear: '#312e81' },
  { key: 'shadow',  label: 'Shadow — Silver / Umbra',   hope: '#cbd5e1', fear: '#1f2937' },
  { key: 'sunset',  label: 'Sunset — Amber / Dusk',     hope: '#fbbf24', fear: '#9d174d' },
];

const STORAGE_KEY = 'daggerheart_dice_color';
const DUALITY_KEY = 'daggerheart_duality_set';

export function getDualitySet() {
  let key = 'classic';
  try { key = localStorage.getItem(DUALITY_KEY) || 'classic'; } catch { /* private mode */ }
  return DUALITY_SETS.find(s => s.key === key) || DUALITY_SETS[0];
}

export function setDualitySet(key) {
  try { localStorage.setItem(DUALITY_KEY, key); } catch { /* private mode */ }
}

export function getPlayerDiceColor(uid) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch { /* private mode */ }
  if (!uid) return '#6366f1';
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return PLAYER_COLORS[h % PLAYER_COLORS.length];
}

export function setPlayerDiceColor(color) {
  try { localStorage.setItem(STORAGE_KEY, color); } catch { /* private mode */ }
}

// Dice whose color carries rules meaning keep it; everything else — damage
// dice, d20s, generic rolls — takes the player's chosen color so the 3D dice
// themselves identify the roller. Hope/Fear stay semantic but honor the
// player's chosen Duality SET. Pure (no firebase) so smoke tests cover it.
const SEMANTIC_DICE_GROUPS = new Set(['hope', 'fear', 'advantage', 'disadvantage', 'wild', 'wildExplode']);

export function applyDiceColors(dice, roller) {
  return (dice || []).map(d => {
    if (d.groupId === 'hope' && roller.duality?.hope) return { ...d, color: roller.duality.hope };
    if (d.groupId === 'fear' && roller.duality?.fear) return { ...d, color: roller.duality.fear };
    if (SEMANTIC_DICE_GROUPS.has(d.groupId)) return d;
    return roller.rollerColor ? { ...d, color: roller.rollerColor } : d;
  });
}
