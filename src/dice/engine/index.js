// The dice engine: throws dice that land on the numbers we give them.
//
//   const engine = await createDiceEngine(container);
//   await engine.throw('roll-id', [{ sides: 12, value: 7, color: '#eab308' }, …], { seed });
//
// How (see each module):
//   simulate.js  — the throw is computed up front, frame by frame, in a worker;
//   labels.js    — the face each die lands on is relabelled with its value;
//   renderer.js  — the recording is played back by the clock with three.js.
//
// Several throws can be on the table at once. Each starts in its own lane so
// players rolling together don't pile their dice on top of each other.

import { dieShape } from './dice.js';
import { labelsFor } from './labels.js';
import { createRenderer } from './renderer.js';

const MAX_LANES = 3;

function createSimulator() {
  let worker = null;
  try {
    worker = new Worker(new URL('./physics.worker.js', import.meta.url), { type: 'module' });
  } catch {
    worker = null;
  }
  const pending = new Map();
  let nextId = 1;
  if (worker) {
    worker.onmessage = (e) => {
      const p = pending.get(e.data?.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data.result); else p.reject(new Error(e.data.error));
    };
    worker.onerror = () => {
      // A worker that can't load (old browser, blocked module workers) falls
      // back to the main thread for this and every later throw.
      const waiting = [...pending.values()];
      pending.clear();
      worker.terminate();
      worker = null;
      waiting.forEach(p => p.fallback());
    };
  }
  const local = async (opts) => (await import('./simulate.js')).simulateThrow(opts);
  return {
    run(opts) {
      if (!worker) return local(opts);
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject, fallback: () => local(opts).then(resolve, reject) });
        worker.postMessage({ id, ...opts });
      });
    },
    dispose() { worker?.terminate(); pending.clear(); },
  };
}

export async function createDiceEngine(container) {
  const renderer = createRenderer(container);
  const simulator = createSimulator();
  let lane = 0;
  let queue = Promise.resolve();

  // Simulate a throw and put it on the table. Returns (in an object, so the
  // caller doesn't wait for it here) the promise that resolves at rest.
  async function start(id, drawable, seed) {
    renderer.resize();
    const arena = renderer.arena;
    const lanes = Math.max(1, Math.min(MAX_LANES, Math.floor((arena.width - 2.4) / 7)));
    const myLane = renderer.activeCount === 0 ? Math.floor((lanes - 1) / 2) : (lane += 1) % lanes;
    // Dice already on the table — tumbling or at rest — are obstacles for
    // this throw, so players' dice knock into each other rather than overlap.
    const obstacles = renderer.obstacles();
    // The physics table sits a little inside the visible one: the camera
    // looks down in perspective, so a die resting against a wall would
    // otherwise poke past the edge of the screen.
    const sim = await simulator.run({
      dice: drawable.map(d => d.sides), seed, arena: { width: arena.width - 2.4, depth: arena.depth - 2.4 }, lane: myLane, lanes, obstacles,
    });
    const withLabels = drawable.map((d, i) => ({
      sides: d.sides,
      color: d.color,
      labels: labelsFor(dieShape(d.sides), sim.landed[i], d.value),
    }));
    return { settled: renderer.play(id, { dice: withLabels, frames: sim.frames, steps: sim.steps }) };
  }

  return {
    /**
     * Throw dice that land on the given values.
     * @param {string} id   - identifies the throw for remove()
     * @param {Array<{sides:number, value:number, color:string}>} dice
     * @param {{ seed:number }} opts - same seed and screen shape → same throw
     * @returns {Promise<void>} resolves when the dice come to rest
     */
    async throw(id, dice, { seed = 1 } = {}) {
      const drawable = dice.filter(d => dieShape(d.sides));
      if (drawable.length === 0) return;
      // Simulate one throw at a time, so a throw started in the same instant
      // as another still sees that one's dice as obstacles. Each takes a few
      // milliseconds, so nobody waits noticeably.
      const started = queue.then(() => start(id, drawable, seed));
      queue = started.catch(() => {});
      const { settled } = await started;
      await settled;
    },
    remove(id) { renderer.remove(id); },
    clear() { renderer.clear(); },
    resize() { renderer.resize(); },
    dispose() { simulator.dispose(); renderer.dispose(); },
  };
}
