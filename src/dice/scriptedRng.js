// Replays a known sequence of die results through the ordinary roll
// functions in systems.js.
//
// Every roll function takes an injectable `rng(sides)`. Feeding it the faces
// the physical dice actually landed on means the canonical record — total,
// outcome, crit/doubles flags, advantage handling — is computed by exactly
// the same code that computes a crypto-RNG roll. No second implementation to
// keep in sync.

import { uniformDie as defaultUniformDie } from './rng.js';

/**
 * @param {number[]} values Die faces, in the order the roll function draws them.
 * @param {(sides:number)=>number} fallback Used once `values` runs out.
 *
 * Running out is expected in one case: Star Wars D6 explodes the wild die on a
 * 6, a draw that only exists once the wild is known, so it can't have been
 * rolled physically up front. That die falls back to the crypto RNG.
 */
export function scriptedRng(values = [], fallback = defaultUniformDie) {
  let i = 0;
  return (sides) => {
    if (i < values.length) {
      const v = values[i++];
      if (Number.isInteger(v) && v >= 1 && v <= sides) return v;
      // A value that can't belong to this die means the physics results and
      // the draw order disagree. Fall back rather than persist nonsense.
      console.warn(`[scriptedRng] value ${v} out of range for d${sides}; using fallback`);
    }
    return fallback(sides);
  };
}

/**
 * Pull face values out of a dice-box result set in the order the dice were
 * created, which is the order the roll functions drew them.
 */
export function valuesFromPhysics(results = []) {
  return [...results]
    .filter(r => r && Number.isInteger(r.value))
    .sort((a, b) => (a.rollId ?? 0) - (b.rollId ?? 0))
    .map(r => r.value);
}
