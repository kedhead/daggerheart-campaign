// Runs simulate.js off the main thread. A throw takes a few milliseconds to
// compute, but on an old phone that is still worth keeping away from the UI.

import { simulateThrow } from './simulate.js';

self.onmessage = (event) => {
  const { id, ...opts } = event.data || {};
  try {
    const result = simulateThrow(opts);
    self.postMessage({ id, ok: true, result }, [result.frames.buffer]);
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message || err) });
  }
};
