// Can this device actually run the 3D tray?
//
// Matters most inside the mobile app's WebView. @3d-dice/dice-box pulls in
// ~2MB of physics and renderer, and on a device that can't run it the old
// behaviour was silent: init() rejected, readyRef stayed false, and every
// incoming roll queued into pendingRef forever. The player saw their dice
// button do nothing while the rest of the table watched the roll land.
//
// Probing first lets the tray choose the 2D path BEFORE paying for the
// download, rather than discovering the problem after it.

let cached = null;

/**
 * True when a WebGL context can actually be created. Cached — the answer
 * can't change within a page lifetime, and the probe allocates a context.
 */
export function hasWebGL() {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2')
      || canvas.getContext('webgl')
      || canvas.getContext('experimental-webgl');
    if (!gl) {
      cached = false;
      return cached;
    }
    // Losing the context immediately keeps the probe from holding a GPU
    // resource for the life of the page.
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    cached = true;
  } catch (err) {
    cached = false;
  }
  return cached;
}

/**
 * Devices that report WebGL but will chug through a rigid-body simulation.
 * deviceMemory is Chrome/Android only; absent on iOS, where even old
 * hardware handles the tray fine, so absence must not count as "weak".
 */
export function isLowPowerDevice() {
  if (typeof navigator === 'undefined') return false;
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  if (typeof mem === 'number' && mem <= 2) return true;
  if (typeof cores === 'number' && cores <= 2) return true;
  return false;
}

/** Honour a player's OS-level "reduce motion" setting. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The tray's decision. `override` comes from the user-facing setting, so a
 * player on a capable phone who just wants speed can force 2D.
 *
 * @param {'auto'|'2d'|'3d'} override
 */
export function shouldUse3D(override = 'auto') {
  if (override === '2d') return false;
  if (override === '3d') return hasWebGL();
  return hasWebGL() && !isLowPowerDevice() && !prefersReducedMotion();
}
