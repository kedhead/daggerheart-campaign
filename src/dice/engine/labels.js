// Relabelling: make the face a die actually landed on show the rolled number.
//
// The throw is simulated before anyone sees it (simulate.js), so we know which
// face will end up on top. Swapping two labels moves the rolled number onto
// that face; swapping their opposite faces too keeps "opposite faces add to
// N + 1", so the die still looks like a real one from every side. Pure — the
// renderer only draws whatever this returns.

/**
 * Face labels (vertex labels for a d4) for one die so that `landed` shows
 * `value`. Returns a new array; the shape's default labels are untouched.
 *
 * @param {object} shape  - from dieShape()
 * @param {number} landed - the face (or d4 vertex) index that ends up on top
 * @param {number} value  - the canonical rolled value, 1..N
 */
export function labelsFor(shape, landed, value) {
  const labels = [...shape.labels];
  const at = labels.indexOf(value);
  if (at < 0 || at === landed) return labels;

  const swap = (i, j) => { const t = labels[i]; labels[i] = labels[j]; labels[j] = t; };
  swap(landed, at);
  if (shape.opposite) {
    const oLanded = shape.opposite[landed];
    const oAt = shape.opposite[at];
    // When the rolled number was on the opposite face, the one swap already
    // kept the pair adding up; otherwise swap the opposites as well.
    if (oLanded !== at) swap(oLanded, oAt);
  }
  return labels;
}
