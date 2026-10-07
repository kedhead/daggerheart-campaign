// Build-time patch for @3d-dice/dice-box 1.1.x: dice tumble at real speed on
// slow frames, and laptops draw fewer pixels.
//
// Why: the physics worker (shipped inside dice-box.es.js as a base64 string)
// only steps when the render worker hands back its buffer — once per rendered
// frame — and each step is
//
//     stepSimulation(delta, 2, 1/90)
//
// i.e. at most two 1/90 s substeps, 22 ms of simulated time per frame. Below
// ~45 fps the dice therefore move in SLOW MOTION, not merely choppily: 0.67x
// speed at 30 fps (Chrome's Energy Saver cap on a laptop on battery), 0.44x at
// 20 fps. Phones hold 60-120 fps on a small canvas, which is why they looked
// fine while laptops — a full-screen canvas several times larger, often on an
// integrated GPU — crawled, and crawled more as more players' dice were on
// screen.
//
// The patch:
//   - physics: up to 5 substeps (real time down to 20 fps), with the frame
//     delta clamped to 50 ms so the first step after an idle gap neither jumps
//     the dice nor eats their settle timeout;
//   - render: no preserveDrawingBuffer (nothing reads the canvas back, and the
//     copy costs every frame), and canvases over ~1 megapixel render at a
//     lower internal resolution.
//
// Each edit fails loudly if its pattern is missing, so upgrading dice-box
// breaks the build instead of silently bringing the slow motion back.

const PHYSICS_FILE = /@3d-dice[\\/]dice-box[\\/]dist[\\/]dice-box\.es\.js$/;
const OFFSCREEN_FILE = /@3d-dice[\\/]dice-box[\\/]dist[\\/]world\.offscreen\.js$/;
const ONSCREEN_FILE = /@3d-dice[\\/]dice-box[\\/]dist[\\/]world\.onscreen\.js$/;

const MAX_SUBSTEPS = 5;
const MAX_FRAME_MS = 50;

function fail(what) {
  throw new Error(`[diceBoxPatch] ${what} not found — has @3d-dice/dice-box changed? Re-check vite/diceBoxPatch.js.`);
}

// Replace the base64 string assigned to `name` ("const ml = \"...\"") with
// the result of `edit(decodedSource)`. Decoded as latin1 to round-trip the
// bytes exactly as atob() would.
function patchInlineWorker(code, name, edit) {
  const re = new RegExp(`(\\b${name}\\s*=\\s*")([A-Za-z0-9+/=]{1000,})(")`);
  const m = code.match(re);
  if (!m) fail(`inline worker "${name}"`);
  const src = Buffer.from(m[2], 'base64').toString('latin1');
  const next = Buffer.from(edit(src), 'latin1').toString('base64');
  return code.slice(0, m.index) + m[1] + next + m[3] + code.slice(m.index + m[0].length);
}

/** The physics worker's step: more substeps, clamped frame delta. */
export function patchPhysicsWorker(src) {
  const re = /(\w+)=>\{const (\w+)=\1\/1e3;(\w+)\.stepSimulation\(\2,2,1\/90\)/;
  if (!re.test(src)) fail('physics step "stepSimulation(t,2,1/90)"');
  return src.replace(re, (_, ms, sec, world) =>
    `${ms}=>{${ms}=Math.min(${ms},${MAX_FRAME_MS});const ${sec}=${ms}/1e3;${world}.stepSimulation(${sec},${MAX_SUBSTEPS},1/90)`);
}

// Babylon engine creation: `return new X(canvas,!0,{preserveDrawingBuffer:!0,stencil:!0})`
// (minified in the worker, spaced out in world.onscreen.js).
const ENGINE_RE = /return\s+new\s+(\w+)\((\w+),\s*!0,\s*\{\s*preserveDrawingBuffer:\s*!0,\s*stencil:\s*!0\s*\}\)/;

/** Engine creation: no preserved buffer, capped internal resolution. */
export function patchEngineCreation(src) {
  if (!ENGINE_RE.test(src)) fail('engine creation "preserveDrawingBuffer:!0"');
  return src.replace(ENGINE_RE, (_, Engine, canvas) =>
    `const __e=new ${Engine}(${canvas},!0,{preserveDrawingBuffer:!1,stencil:!0});`
    + `const __px=(${canvas}.clientWidth||${canvas}.width)*(${canvas}.clientHeight||${canvas}.height);`
    + `__px>1e6&&__e.setHardwareScalingLevel(Math.min(2,Math.sqrt(__px/1e6)));`
    + `return __e`);
}

/** Apply the patch to one dice-box module, or return null if it isn't one. */
export function transformDiceBox(code, id) {
  if (PHYSICS_FILE.test(id)) return patchInlineWorker(code, 'ml', patchPhysicsWorker);
  if (OFFSCREEN_FILE.test(id)) return patchInlineWorker(code, 'p', patchEngineCreation);
  if (ONSCREEN_FILE.test(id)) return patchEngineCreation(code);
  return null;
}

export function diceBoxPatch() {
  return {
    name: 'dice-box-realtime',
    enforce: 'pre',
    transform(code, id) {
      const out = transformDiceBox(code, id.split('?')[0]);
      return out == null ? null : { code: out, map: null };
    },
  };
}
