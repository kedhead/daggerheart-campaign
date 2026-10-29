// Sound effects for the cinematics, synthesised with Web Audio so there are
// no files to host: the boss-intro slam, a whoosh for transitions and a riser
// for the end card. Every function is a no-op without an AudioContext.

let shared = null;

/** The page's AudioContext, made on first use. Resume it from a click to unlock sound. */
export function audioContext() {
  if (shared) return shared;
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  try { shared = new Ctx(); } catch { shared = null; }
  return shared;
}

function noiseBuffer(ctx, seconds) {
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** A heavy hit: sub drop, a crack of noise and a metallic ring. */
export function playSlam(volume = 0.8) {
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = volume;
  out.connect(ctx.destination);

  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(140, t);
  sub.frequency.exponentialRampToValueAtTime(38, t + 0.5);
  subGain.gain.setValueAtTime(1, t);
  subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  sub.connect(subGain).connect(out);
  sub.start(t);
  sub.stop(t + 1);

  const crack = ctx.createBufferSource();
  crack.buffer = noiseBuffer(ctx, 0.35);
  const crackFilter = ctx.createBiquadFilter();
  crackFilter.type = 'bandpass';
  crackFilter.frequency.value = 1800;
  const crackGain = ctx.createGain();
  crackGain.gain.setValueAtTime(0.9, t);
  crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  crack.connect(crackFilter).connect(crackGain).connect(out);
  crack.start(t);

  const ring = ctx.createOscillator();
  const ringGain = ctx.createGain();
  ring.type = 'triangle';
  ring.frequency.setValueAtTime(660, t);
  ringGain.gain.setValueAtTime(0.18, t);
  ringGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  ring.connect(ringGain).connect(out);
  ring.start(t);
  ring.stop(t + 1.5);
}

/** A quick air whoosh. */
export function playWhoosh(volume = 0.35, seconds = 0.55) {
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, seconds);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(3200, t + seconds * 0.7);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + seconds * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
}

/** A rising tension sweep that lands on the next slam. */
export function playRiser(volume = 0.25, seconds = 1.6) {
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + seconds);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.exponentialRampToValueAtTime(4000, t + seconds);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + seconds * 0.9);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.05);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.1);
}
