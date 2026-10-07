// The throw, computed up front.
//
// Runs the whole physics simulation in one go at a fixed 1/60 s step, records
// every frame, and reports which face each die comes to rest on. The screen
// then just plays the recording back by the clock (renderer.js), so a slow
// machine can drop frames but the dice never tumble in slow motion — the
// problem with the engine this replaces, whose physics advanced at most
// 22 ms per rendered frame.
//
// Deterministic for a given seed and arena: the seeded generator decides
// every random choice, and cannon-es itself has none. Pure apart from
// cannon-es — no DOM, no three.js — so it runs in a worker, on the main
// thread as a fallback, and in node for the tests.

import * as CANNON from 'cannon-es';
import { dieShape, topIndex, rotate } from './dice.js';
import { mulberry32, STEP, FRAME_STRIDE } from './seed.js';

export { mulberry32, seedFrom, STEP, FRAME_STRIDE } from './seed.js';

export const MAX_STEPS = 240; // 4 s: a throw that hasn't settled by then stops where it is

const GRAVITY = 60;
const WALL_HEIGHT = 12;

function randomQuaternion(rand) {
  // Uniform over rotations (Shoemake).
  const u1 = rand(), u2 = rand() * Math.PI * 2, u3 = rand() * Math.PI * 2;
  const a = Math.sqrt(1 - u1), b = Math.sqrt(u1);
  return new CANNON.Quaternion(a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3), b * Math.cos(u3));
}

function polyhedron(shape) {
  return new CANNON.ConvexPolyhedron({
    vertices: shape.vertices.map(([x, y, z]) => new CANNON.Vec3(x, y, z)),
    faces: shape.faces.map(f => [...f]),
  });
}

function addWalls(world, material, { width, depth }) {
  const floor = new CANNON.Body({ mass: 0, material, shape: new CANNON.Plane() });
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // plane normal +Z → +Y
  world.addBody(floor);
  const t = 1;
  const walls = [
    [width / 2 + t, 0, t, depth / 2 + t],
    [-width / 2 - t, 0, t, depth / 2 + t],
    [0, depth / 2 + t, width / 2 + t, t],
    [0, -depth / 2 - t, width / 2 + t, t],
  ];
  for (const [x, z, hx, hz] of walls) {
    const body = new CANNON.Body({ mass: 0, material, shape: new CANNON.Box(new CANNON.Vec3(hx, WALL_HEIGHT, hz)) });
    body.position.set(x, WALL_HEIGHT, z);
    world.addBody(body);
  }
}

// How squarely a die's top face (d4: top vertex) points up: 1 is flat.
function flatness(shape, landed, q) {
  const v = shape.readAtVertex ? shape.vertices[landed] : shape.normals[landed];
  const l = Math.hypot(v[0], v[1], v[2]);
  return rotate(q, [v[0] / l, v[1] / l, v[2] / l])[1];
}

// A die resting this far off flat (about 14 degrees) is leaning on a wall or
// another die; its number would sit at a slant.
const FLAT_ENOUGH = 0.97;
const MAX_ATTEMPTS = 6;

/**
 * Simulate one throw. If any die would end up cocked or still moving, the
 * throw is re-run from the next seed (seed + 1, + 2 …) — still deterministic
 * — and the first clean one is used, or the best of the attempts.
 *
 * @param {object}   opts
 * @param {number[]} opts.dice  - sides of each die, e.g. [12, 12, 6]
 * @param {number}   opts.seed  - 32-bit seed; same seed + arena → same throw
 * @param {{width:number, depth:number}} opts.arena - the table in die units
 *        (x across the screen, z down it), matching the screen's shape
 * @param {number}   [opts.lane=0] and [opts.lanes=1] - which strip of the
 *        table the dice start in, so throws on screen together keep apart
 * @param {Array}    [opts.obstacles] - dice already on the table, as
 *        { dice: [sides…], frames, steps, from }: earlier throws' recordings,
 *        `from` being how far into its playback each one is now. They follow
 *        their recorded paths as immovable bodies, so new dice bounce off
 *        them instead of passing through. (They don't react in turn — their
 *        playback is already fixed — but nobody notices a die that holds its
 *        ground.)
 * @returns {{ frames: Float32Array, steps: number, settled: boolean,
 *             landed: number[], dice: number[] }}
 *          frames holds (steps + 1) poses per die; `landed` is the face (d4:
 *          vertex) on top at the end.
 */
export function simulateThrow(opts) {
  let best = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = runThrow({ ...opts, seed: ((opts.seed >>> 0) + attempt) >>> 0 });
    const score = Math.min(...result.flat) - (result.settled ? 0 : 1);
    if (!best || score > best.score) best = { result, score };
    if (result.settled && score >= FLAT_ENOUGH) break;
  }
  const { flat, ...result } = best.result;
  return result;
}

function runThrow({ dice, seed, arena, lane = 0, lanes = 1, obstacles = [], maxSteps = MAX_STEPS }) {
  const rand = mulberry32(seed);
  const width = Math.max(6, arena?.width || 16);
  const depth = Math.max(6, arena?.depth || 10);
  const shapes = dice.map(sides => dieShape(sides));
  if (shapes.some(s => !s)) throw new Error(`simulateThrow: unsupported die in [${dice}]`);

  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -GRAVITY, 0), allowSleep: true });
  world.solver.iterations = 12;
  const tableMat = new CANNON.Material('table');
  const diceMat = new CANNON.Material('dice');
  world.addContactMaterial(new CANNON.ContactMaterial(tableMat, diceMat, { friction: 0.3, restitution: 0.35 }));
  world.addContactMaterial(new CANNON.ContactMaterial(diceMat, diceMat, { friction: 0.15, restitution: 0.4 }));
  addWalls(world, tableMat, { width, depth });

  // Dice enter from the bottom of the screen in their lane and are flung up it.
  const laneWidth = width / Math.max(1, lanes);
  const laneX = -width / 2 + laneWidth * (Math.min(lane, lanes - 1) + 0.5);
  const spread = Math.min(laneWidth * 0.6, 1.4 * dice.length);
  const bodies = shapes.map((shape, i) => {
    const body = new CANNON.Body({
      mass: 1,
      material: diceMat,
      shape: polyhedron(shape),
      linearDamping: 0.1,
      angularDamping: 0.12,
      sleepSpeedLimit: 0.12,
      sleepTimeLimit: 0.2,
    });
    const offset = dice.length > 1 ? (i / (dice.length - 1) - 0.5) * spread : 0;
    body.position.set(
      laneX + offset + (rand() - 0.5) * 0.6,
      2.5 + rand() * 1.5 + i * 0.4,
      depth / 2 - 1.8 - rand() * 0.8,
    );
    body.quaternion.copy(randomQuaternion(rand));
    const reach = Math.sqrt(depth) * (2.3 + rand() * 1.0);
    body.velocity.set((rand() - 0.5) * 6 - offset * 0.8, 2 + rand() * 4, -reach);
    body.angularVelocity.set((rand() - 0.5) * 36, (rand() - 0.5) * 36, (rand() - 0.5) * 36);
    world.addBody(body);
    return body;
  });

  // Earlier throws' dice, replayed along their recordings.
  const replayed = [];
  for (const ob of obstacles || []) {
    const count = ob.dice?.length || 0;
    if (!count || !ob.frames) continue;
    ob.dice.forEach((sides, i) => {
      const shape = dieShape(sides);
      if (!shape) return;
      const body = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material: diceMat, shape: polyhedron(shape) });
      world.addBody(body);
      replayed.push({ body, frames: ob.frames, n: count, i, last: ob.steps, from: Math.max(0, Math.min(ob.steps, ob.from | 0)) });
    });
  }
  const placeReplayed = (step) => {
    for (const r of replayed) {
      const k = Math.min(r.last, r.from + step);
      const k2 = Math.min(r.last, k + 1);
      const a = (k * r.n + r.i) * FRAME_STRIDE, b = (k2 * r.n + r.i) * FRAME_STRIDE;
      const f = r.frames;
      r.body.position.set(f[a], f[a + 1], f[a + 2]);
      r.body.quaternion.set(f[a + 3], f[a + 4], f[a + 5], f[a + 6]);
      r.body.velocity.set((f[b] - f[a]) / STEP, (f[b + 1] - f[a + 1]) / STEP, (f[b + 2] - f[a + 2]) / STEP);
    }
  };

  const n = bodies.length;
  const frames = new Float32Array((maxSteps + 1) * n * FRAME_STRIDE);
  const record = (frame) => {
    bodies.forEach((b, i) => {
      const o = (frame * n + i) * FRAME_STRIDE;
      frames[o] = b.position.x; frames[o + 1] = b.position.y; frames[o + 2] = b.position.z;
      frames[o + 3] = b.quaternion.x; frames[o + 4] = b.quaternion.y; frames[o + 5] = b.quaternion.z; frames[o + 6] = b.quaternion.w;
    });
  };

  record(0);
  let steps = 0;
  let settled = false;
  while (steps < maxSteps) {
    placeReplayed(steps);
    world.step(STEP);
    steps += 1;
    record(steps);
    if (bodies.every(b => b.sleepState === CANNON.Body.SLEEPING)) { settled = true; break; }
  }

  const quats = bodies.map(b => [b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w]);
  const landed = quats.map((q, i) => topIndex(shapes[i], q));
  const flat = quats.map((q, i) => flatness(shapes[i], landed[i], q));
  return { frames: frames.slice(0, (steps + 1) * n * FRAME_STRIDE), steps, settled, landed, flat, dice: [...dice], seed };
}
