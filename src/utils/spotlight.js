// The Daggerheart spotlight: there is no initiative; the spotlight passes
// between the players and the GM. A player keeps acting until a roll with
// Fear or a failure hands it to the GM, or the GM spends a Fear to step in.
// This keeps track of who has had it this scene, so nobody is left out.
// Pure, so the smoke tests cover it; hooks/useSpotlight.js does the saving.

export const GM = 'gm';
export const MAX_LOG = 30;

// Why the spotlight moved: shown in the log.
export const REASONS = {
  pass: 'Spotlight passed',
  hope: 'A player rolled with Hope',
  fear: 'A player rolled with Fear',
  fail: 'A player failed a roll',
  spendFear: 'Spent a Fear to step in',
  gm: 'GM handed it over'
};

/** A fresh scene: nobody has had the spotlight yet. */
export function newScene(name = '') {
  return { scene: String(name || '').slice(0, 80), current: null, passes: 0, counts: {}, lastAt: {}, log: [] };
}

/** Give the spotlight to `to` (a character id, or GM). */
export function giveSpotlight(state, to, reason = 'pass', at = Date.now()) {
  const s = { ...newScene(), ...(state || {}) };
  if (!to) return s;
  const passes = (s.passes || 0) + 1;
  return {
    ...s,
    current: to,
    passes,
    counts: { ...s.counts, [to]: (s.counts?.[to] || 0) + 1 },
    lastAt: { ...s.lastAt, [to]: passes },
    log: [{ to, reason: REASONS[reason] ? reason : 'pass', at, prev: s.current || null }, ...(s.log || [])].slice(0, MAX_LOG)
  };
}

/** Take back the last pass (a mis-tap). */
export function undoSpotlight(state) {
  const s = { ...newScene(), ...(state || {}) };
  const [last, ...rest] = s.log || [];
  if (!last) return s;
  const counts = { ...s.counts, [last.to]: Math.max(0, (s.counts?.[last.to] || 0) - 1) };
  // When they last had it, from the passes that remain.
  const lastAt = { ...s.lastAt };
  const earlier = rest.findIndex(e => e.to === last.to);
  if (earlier >= 0) lastAt[last.to] = s.passes - 1 - earlier; else delete lastAt[last.to];
  return { ...s, current: last.prev || null, passes: Math.max(0, s.passes - 1), counts, lastAt, log: rest };
}

/**
 * The players in the order they should get the spotlight next: those who
 * have not had it this scene first, then whoever has waited longest.
 */
export function waitingOrder(state, ids = []) {
  const s = state || {};
  return [...ids].sort((a, b) => (s.lastAt?.[a] ?? -1) - (s.lastAt?.[b] ?? -1));
}
