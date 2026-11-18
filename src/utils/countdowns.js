// Which GM countdowns the players may see.
//
// Countdowns live in campaigns/{id}/battleMapDisplay/countdowns, which only
// the DM can write and the app shows to nobody else. A countdown the DM marks
// "show players" is copied, trimmed to what a player needs, into
// playerDisplay/current, which is what the players' screens read.

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
