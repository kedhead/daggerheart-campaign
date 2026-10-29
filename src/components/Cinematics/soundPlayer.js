// Playback for a cinematic's sound set (see cinematicSounds.js for how the
// set is made). Kept free of Firebase so the monitor's stage loads it alone.

import { playSlam, playWhoosh, playRiser } from './cinematicSfx';

export const SOUND_CUES = ['whoosh', 'impact', 'slam', 'riser'];

/**
 * Plays a sound set. Loads every sound before the cinematic starts (or gives
 * up after `timeoutMs`), and falls back to the synthesised hit for any sound
 * that is missing or will not play, so a cinematic is never silent.
 */
export function createSoundPlayer(urls = {}, { timeoutMs = 4000 } = {}) {
  const els = {};
  const loads = Object.entries(urls || {})
    .filter(([cue, url]) => SOUND_CUES.includes(cue) && url)
    .map(([cue, url]) => new Promise(resolve => {
      const a = new Audio();
      a.preload = 'auto';
      const done = () => resolve();
      a.addEventListener('canplaythrough', done, { once: true });
      a.addEventListener('error', () => { delete els[cue]; done(); }, { once: true });
      a.src = url;
      a.load();
      els[cue] = a;
    }));
  const ready = Promise.race([Promise.all(loads), new Promise(r => setTimeout(r, timeoutMs))]);

  const synth = { whoosh: () => playWhoosh(0.4), impact: () => playSlam(0.8), slam: () => playSlam(0.9), riser: () => playRiser(0.25) };
  let onBlocked = () => {};

  return {
    ready,
    /** Called when the browser refuses to play sound until someone clicks. */
    set onBlocked(fn) { onBlocked = fn || (() => {}); },
    play(cue, volume = 1) {
      const a = els[cue];
      if (!a) { synth[cue]?.(); return; }
      try {
        a.currentTime = 0;
        a.volume = Math.max(0, Math.min(1, volume));
        const p = a.play();
        if (p?.catch) p.catch(err => { if (err?.name === 'NotAllowedError') onBlocked(true); else synth[cue]?.(); });
      } catch {
        synth[cue]?.();
      }
    },
    stop() {
      Object.values(els).forEach(a => { try { a.pause(); } catch { /* gone */ } });
    },
    /** Retry after the click that unlocks sound. */
    unlock() {
      // A silent play from inside the click is what lets later plays through.
      Object.values(els).forEach(a => {
        a.muted = true;
        const p = a.play();
        const reset = () => { a.pause(); a.currentTime = 0; a.muted = false; };
        if (p?.then) p.then(reset).catch(() => { a.muted = false; });
        else reset();
      });
    }
  };
}
