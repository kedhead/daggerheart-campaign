// Per-player dice color. Stored on the device; falls back to a stable
// palette pick derived from the user id, so two players who never touch
// the picker still get different colors at the table.

export const PLAYER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ffffff',
];

const STORAGE_KEY = 'daggerheart_dice_color';

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
