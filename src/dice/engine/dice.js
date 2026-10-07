// Die shapes for the dice engine: d4, d6, d8, d10, d12 and d20.
//
// Pure data and maths — no three.js, no physics — so the shapes can be checked
// in node. Every die is a convex polyhedron with a circumradius of about 1,
// Y up. Each face lists its vertex indices counter-clockwise seen from
// outside, which is what both cannon-es and the renderer expect, plus its
// outward unit normal.
//
// Values. Faces (or, for the d4, vertices) carry the numbers 1..N. The
// default layout pairs opposite faces so they add up to N + 1, as on real
// dice. Which number a face shows is decided per throw by labels.js; this file
// only says what is opposite what.

const PHI = (1 + Math.sqrt(5)) / 2;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

// Scale a vertex list so the furthest vertex sits at `radius`.
function toRadius(vertices, radius = 1) {
  const r = Math.max(...vertices.map(len));
  return vertices.map(v => scale(v, radius / r));
}

// Faces of a convex polyhedron from its face directions: for each direction,
// the vertices furthest along it, ordered counter-clockwise around it.
function facesFromNormals(vertices, normals) {
  return normals.map((n0) => {
    const n = norm(n0);
    const dots = vertices.map(v => dot(v, n));
    const max = Math.max(...dots);
    const idx = dots.map((d, i) => (Math.abs(d - max) < 1e-6 ? i : -1)).filter(i => i >= 0);
    const centre = scale(idx.reduce((acc, i) => [acc[0] + vertices[i][0], acc[1] + vertices[i][1], acc[2] + vertices[i][2]], [0, 0, 0]), 1 / idx.length);
    // A basis in the face plane to sort the corners by angle.
    const u = norm(sub(vertices[idx[0]], centre));
    const w = cross(n, u);
    idx.sort((a, b) => {
      const pa = sub(vertices[a], centre), pb = sub(vertices[b], centre);
      return Math.atan2(dot(pa, w), dot(pa, u)) - Math.atan2(dot(pb, w), dot(pb, u));
    });
    return idx;
  });
}

function faceNormal(vertices, face) {
  const [a, b, c] = face.map(i => vertices[i]);
  return norm(cross(sub(b, a), sub(c, a)));
}

// Pair each face with the one facing the opposite way.
function oppositeFaces(normals) {
  return normals.map((n) => {
    let best = -1, bestDot = 2;
    normals.forEach((m, j) => { const d = dot(n, m); if (d < bestDot) { bestDot = d; best = j; } });
    return best;
  });
}

// Default labels: opposite faces add to N + 1.
function pairedLabels(opposite) {
  const labels = new Array(opposite.length).fill(0);
  let next = 1;
  const n = opposite.length;
  for (let i = 0; i < n; i++) {
    if (labels[i]) continue;
    labels[i] = next;
    labels[opposite[i]] = n + 1 - next;
    next += 1;
  }
  return labels;
}

function build(sides, vertices, faces) {
  const normals = faces.map(f => faceNormal(vertices, f));
  const opposite = sides === 4 ? null : oppositeFaces(normals);
  return {
    sides,
    vertices,
    faces,
    normals,
    opposite,
    // The d4 is read at its top vertex: labels belong to vertices.
    labels: sides === 4 ? [1, 2, 3, 4] : pairedLabels(opposite),
    readAtVertex: sides === 4,
  };
}

function d4() {
  const v = toRadius([[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]], 1.2);
  // Each face is opposite one vertex; its direction is minus that vertex.
  return build(4, v, facesFromNormals(v, v.map(p => scale(p, -1))));
}

function d6() {
  const v = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
  const verts = toRadius(v, 1.05);
  const normals = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  return build(6, verts, facesFromNormals(verts, normals));
}

function d8() {
  const verts = toRadius([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], 1.1);
  const normals = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) normals.push([x, y, z]);
  return build(8, verts, facesFromNormals(verts, normals));
}

// Pentagonal trapezohedron. Ring vertices alternate a little above and below
// the equator; the apex height is what makes every kite exactly planar:
// H = c (1 + cos 36°) / (1 - cos 36°).
function d10() {
  const c = 0.1;
  const cos36 = Math.cos(Math.PI / 5);
  const H = c * (1 + cos36) / (1 - cos36);
  const v = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    v.push([Math.cos(a), i % 2 === 0 ? c : -c, Math.sin(a)]);
  }
  v.push([0, H, 0]); // 10: top apex
  v.push([0, -H, 0]); // 11: bottom apex
  const faces = [];
  for (let k = 0; k < 5; k++) {
    const e = 2 * k;
    faces.push([10, (e + 2) % 10, e + 1, e]); // upper kite
    faces.push([11, e + 1, (e + 2) % 10, (e + 3) % 10]); // lower kite
  }
  const verts = toRadius(v, 1.1);
  // Wind every face counter-clockwise from outside.
  const fixed = faces.map((f) => {
    const n = faceNormal(verts, f);
    const centre = scale(f.reduce((acc, i) => [acc[0] + verts[i][0], acc[1] + verts[i][1], acc[2] + verts[i][2]], [0, 0, 0]), 1 / f.length);
    return dot(n, centre) < 0 ? [...f].reverse() : f;
  });
  return build(10, verts, fixed);
}

function icosahedronVertices() {
  const v = [];
  for (const a of [-1, 1]) for (const b of [-PHI, PHI]) {
    v.push([0, a, b], [a, b, 0], [b, 0, a]);
  }
  return v;
}

function dodecahedronVertices() {
  const v = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
  const p = 1 / PHI;
  // Oriented as the dual of icosahedronVertices(), so each one's faces point
  // at the other's vertices.
  for (const a of [-p, p]) for (const b of [-PHI, PHI]) v.push([0, b, a], [a, 0, b], [b, a, 0]);
  return v;
}

function d12() {
  const verts = toRadius(dodecahedronVertices(), 1.15);
  // Dodecahedron faces point at the icosahedron's vertices.
  return build(12, verts, facesFromNormals(verts, icosahedronVertices()));
}

function d20() {
  const verts = toRadius(icosahedronVertices(), 1.2);
  // Icosahedron faces point at the dodecahedron's vertices.
  return build(20, verts, facesFromNormals(verts, dodecahedronVertices()));
}

const BUILDERS = { 4: d4, 6: d6, 8: d8, 10: d10, 12: d12, 20: d20 };
const cache = {};

export const SUPPORTED_SIDES = Object.keys(BUILDERS).map(Number);

/** The shape for an N-sided die, or null if we don't draw that die. */
export function dieShape(sides) {
  if (!BUILDERS[sides]) return null;
  if (!cache[sides]) cache[sides] = BUILDERS[sides]();
  return cache[sides];
}

/** Rotate a vector by a unit quaternion [x, y, z, w]. */
export function rotate([x, y, z, w], v) {
  const u = [x, y, z];
  const t = scale(cross(u, v), 2);
  return [v[0] + w * t[0] + (u[1] * t[2] - u[2] * t[1]),
    v[1] + w * t[1] + (u[2] * t[0] - u[0] * t[2]),
    v[2] + w * t[2] + (u[0] * t[1] - u[1] * t[0])];
}

/**
 * Which face (or, for the d4, which vertex) ends up on top for a die at
 * orientation `q`: the one pointing most nearly straight up.
 */
export function topIndex(shape, q) {
  const dirs = shape.readAtVertex ? shape.vertices : shape.normals;
  let best = 0, bestY = -Infinity;
  dirs.forEach((d, i) => {
    const y = rotate(q, shape.readAtVertex ? norm(d) : d)[1];
    if (y > bestY) { bestY = y; best = i; }
  });
  return best;
}
