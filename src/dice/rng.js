// Single source of randomness for the dice system. Every face value rolled
// in the entire app comes from this module. Uses crypto.getRandomValues with
// rejection sampling so the distribution is exactly uniform over [1, sides].

export function uniformDie(sides) {
  if (!Number.isInteger(sides) || sides < 2) {
    throw new Error(`uniformDie: invalid sides=${sides}`);
  }
  const cap = Math.floor(0xFFFFFFFF / sides) * sides;
  const buf = new Uint32Array(1);
  let n;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= cap);
  return (n % sides) + 1;
}

export function rollNDice(qty, sides) {
  const out = new Array(qty);
  for (let i = 0; i < qty; i++) out[i] = uniformDie(sides);
  return out;
}
