// Keeping the turn with the right person when the initiative order changes.
// Pure, so the smoke tests cover it; useFirestoreCampaign does the saving.
//
// The turn is stored as an index into the list, so adding someone (the list
// re-sorts), moving someone, or removing someone earlier in the order used to
// hand the turn to whoever ended up at that index.

/** Highest initiative first; ties keep their order. */
export function sortByInitiative(participants = []) {
  return participants
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (Number(b.p.initiative) || 0) - (Number(a.p.initiative) || 0) || a.i - b.i)
    .map(x => x.p);
}

/**
 * Where the turn is in `next`, given it was at `turn` in `prev`.
 * The same person keeps it; if they left, it passes to whoever came after
 * them, wrapping to the top (and then `wrapped` is true, a new round).
 */
export function keepTurn(prev = [], turn = 0, next = []) {
  if (!next.length) return { turn: 0, wrapped: false };
  const current = prev[turn];
  if (!current) return { turn: Math.min(Math.max(0, turn), next.length - 1), wrapped: false };
  const stay = next.findIndex(p => p.id === current.id);
  if (stay >= 0) return { turn: stay, wrapped: false };
  // They left: the first of those after them who is still here.
  for (let k = turn + 1; k < prev.length; k++) {
    const at = next.findIndex(p => p.id === prev[k].id);
    if (at >= 0) return { turn: at, wrapped: false };
  }
  return { turn: 0, wrapped: true };
}
