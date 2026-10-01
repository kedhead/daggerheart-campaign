// Which GM countdowns the players may see.
//
// Countdowns live in campaigns/{id}/gmScreen/countdowns, which only the DM can
// read — and that stays true. A countdown the DM marks "show players" is
// copied, trimmed to what a player needs, into playerDisplay/current, which
// every member can read. So nothing private becomes readable and no Firestore
// rule changes.

/** The public countdowns, in the DM's order, with only display fields. */
export function publicCountdowns(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(c => c && c.public === true)
    .map(({ id, name, value, max, kind }) => ({
      id,
      name: typeof name === 'string' ? name : '',
      value: Number(value) || 0,
      max: Math.max(1, Number(max) || 1),
      kind: kind || 'standard',
    }));
}
