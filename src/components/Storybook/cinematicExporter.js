/**
 * cinematicExporter — render a cinematic timeline to a downloadable WebM video.
 *
 * Draws each slide onto an offscreen canvas with the same Ken Burns motion and
 * lower-third text as CinematicPlayer, captures it via canvas.captureStream,
 * mixes narration + music through WebAudio into the recording, and saves the
 * result. Requires a browser with MediaRecorder + captureStream (desktop
 * Chrome/Edge); throws a friendly error otherwise.
 */

import { createFX } from './cinematicFX';

const W = 1280;
const H = 720;
const FPS = 30;

// Animated clips carry their own motion — hold them steady instead of panning.
const STATIC_PAN = { fromScale: 1, toScale: 1, fromX: 0, fromY: 0, toX: 0, toY: 0 };

function pickMimeType() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm',
  ];
  return candidates.find(t => window.MediaRecorder?.isTypeSupported?.(t)) || null;
}

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Preload an animated scene clip as a muted looping <video> we can draw
// frames from. Resolves null on failure so the exporter falls back to the
// slide's still image.
function loadVideo(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const v = document.createElement('video');
    let settled = false;
    const done = (ok) => { if (!settled) { settled = true; resolve(ok ? v : null); } };
    v.crossOrigin = 'anonymous';
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.oncanplaythrough = () => done(true);
    v.onerror = () => done(false);
    setTimeout(() => done(v.readyState >= 2), 8000); // slow network: take what we have
    v.src = url;
    v.load();
  });
}

async function fetchAudioBuffer(ctx, url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const arr = await res.arrayBuffer();
    return await ctx.decodeAudioData(arr);
  } catch {
    return null;
  }
}

// Cover-fit an image (or video frame) into WxH, then apply scale+translate
// (% of frame) for pan.
function drawSlide(ctx, img, pan, t) {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);
  if (img) {
    const iw = img.videoWidth || img.width;
    const ih = img.videoHeight || img.height;
    const scale = pan.fromScale + (pan.toScale - pan.fromScale) * t;
    const tx = (pan.fromX + (pan.toX - pan.fromX) * t) / 100 * W;
    const ty = (pan.fromY + (pan.toY - pan.fromY) * t) / 100 * H;
    // cover fit
    const ir = iw / ih;
    const fr = W / H;
    let dw, dh;
    if (ir > fr) { dh = H * scale; dw = dh * ir; } else { dw = W * scale; dh = dw / ir; }
    const dx = (W - dw) / 2 + tx;
    const dy = (H - dh) / 2 + ty;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  // vignette
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawTitle(ctx, text, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(234,179,8,0.9)';
  ctx.font = '600 22px Georgia, serif';
  ctx.fillText('A CHRONICLE RECAP', W / 2, H / 2 - 60);
  ctx.fillStyle = '#fff';
  ctx.font = '700 56px Georgia, serif';
  const lines = wrapText(ctx, text, W * 0.8);
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, H / 2 + 10 + i * 66));
  ctx.restore();
}

function drawLowerThird(ctx, text, isProse, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = isProse ? '400 30px Georgia, serif' : 'italic 400 28px Georgia, serif';
  const maxW = W * 0.82;
  const lines = wrapText(ctx, text, maxW);
  const lineH = 40;
  const boxH = lines.length * lineH + 48;
  const boxY = H - boxH - 40;
  // panel
  ctx.fillStyle = 'rgba(8,10,20,0.72)';
  ctx.fillRect((W - maxW) / 2 - 28, boxY, maxW + 56, boxH);
  ctx.fillStyle = '#f4efe6';
  ctx.textAlign = 'center';
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, boxY + 40 + i * lineH));
  ctx.restore();
}

export async function exportCinematicWebM({ timeline, musicUrl, musicPlan, mix, title, onProgress }) {
  // Same mixer model as the player: music sits under the narrator.
  const musicLevel = Math.min(1, Math.max(0, mix?.music ?? 0.45));
  const narrationLevel = Math.min(1, Math.max(0, mix?.narration ?? 1));
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error('Video export needs desktop Chrome or Edge.');
  }
  const mimeType = pickMimeType();
  if (!mimeType) throw new Error('This browser cannot record WebM video.');

  // Preload stills and any AI-animated clips (clips fall back to the still)
  const images = await Promise.all(timeline.map(s => loadImage(s.imageUrl)));
  const videos = await Promise.all(timeline.map(s => loadVideo(s.videoUrl)));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Audio graph: narration buffers scheduled per slide + looped music, mixed
  // into a MediaStream track we combine with the canvas video track.
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  const dest = audioCtx.createMediaStreamDestination();

  const narrationBufs = await Promise.all(
    timeline.map(s => fetchAudioBuffer(audioCtx, s.narrationUrl))
  );

  // Soundtrack: either a mood-matched plan of movements or one legacy track.
  const totalPlanned = timeline.reduce((a, s) => a + (s.duration || 0), 0);
  const plan = (musicPlan && musicPlan.length)
    ? musicPlan
    : (musicUrl ? [{ url: musicUrl, startSec: 0, durationSec: totalPlanned }] : []);
  const uniqueMusicUrls = [...new Set(plan.map(p => p.url).filter(Boolean))];
  const musicBufs = new Map(await Promise.all(
    uniqueMusicUrls.map(async (u) => [u, await fetchAudioBuffer(audioCtx, u)])
  ));

  const videoStream = canvas.captureStream(FPS);
  const mixed = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const recorder = new MediaRecorder(mixed, { mimeType, videoBitsPerSecond: 4_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const durations = timeline.map(s => s.duration);
  const starts = [];
  durations.reduce((acc, d, i) => { starts[i] = acc; return acc + d; }, 0);
  const totalSec = durations.reduce((a, b) => a + b, 0);

  // Schedule audio relative to audioCtx start time. Each soundtrack movement
  // gets its own looped source with a fade-in/out envelope so mood changes
  // crossfade instead of cutting hard.
  const audioStart = audioCtx.currentTime + 0.15;
  const musicVol = musicLevel * (narrationBufs.some(Boolean) ? 0.15 : 0.6);
  plan.forEach((seg) => {
    const buf = musicBufs.get(seg.url);
    if (!buf || !(seg.durationSec > 0)) return;
    const t0 = audioStart + (seg.startSec || 0);
    const t1 = Math.min(t0 + seg.durationSec, audioStart + totalSec + 0.2);
    const fade = Math.min(1.2, seg.durationSec / 4);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(musicVol, t0 + fade);
    gain.gain.setValueAtTime(musicVol, Math.max(t0 + fade, t1 - fade));
    gain.gain.linearRampToValueAtTime(0.0001, t1);
    src.connect(gain).connect(dest);
    src.start(t0);
    src.stop(t1 + 0.05);
  });
  narrationBufs.forEach((buf, i) => {
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.value = narrationLevel;
    src.connect(gain).connect(dest);
    src.start(audioStart + starts[i]);
  });

  const finished = new Promise((resolve, reject) => {
    recorder.onstop = () => {
      try {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(title || 'recap').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-recap.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        resolve();
      } catch (e) { reject(e); }
    };
    recorder.onerror = (e) => reject(e.error || new Error('Recorder error'));
  });

  recorder.start();
  const t0 = performance.now();
  let lastSlide = -1;
  let lastFrameTime = t0;
  let fx = null; // ambient particle effect for the current slide

  await new Promise((resolve) => {
    function frame() {
      const now = performance.now();
      const elapsed = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
      lastFrameTime = now;
      if (elapsed >= totalSec) return resolve();

      // Which slide are we in?
      let i = 0;
      while (i < starts.length - 1 && elapsed >= starts[i + 1]) i++;
      if (i !== lastSlide) {
        // Slide change: swap the playing clip and rebuild the particle effect.
        if (lastSlide >= 0 && videos[lastSlide]) videos[lastSlide].pause();
        if (videos[i]) { videos[i].currentTime = 0; videos[i].play().catch(() => {}); }
        fx = timeline[i].fx && timeline[i].fx !== 'none' ? createFX(timeline[i].fx, W, H) : null;
        lastSlide = i;
        onProgress?.(i + 1);
      }

      const local = (elapsed - starts[i]) / (durations[i] || 1); // 0..1
      const slide = timeline[i];
      const clip = videos[i];
      if (clip) drawSlide(ctx, clip, STATIC_PAN, 0);
      else drawSlide(ctx, images[i], slide.pan, Math.min(1, local));

      if (fx) { fx.update(dt); fx.draw(ctx); }

      // Text fade-in over first 0.6s of the slide
      const alpha = Math.min(1, local / (0.6 / (durations[i] || 1)));
      if (slide.kind === 'title') drawTitle(ctx, slide.text, alpha);
      else if (slide.text) drawLowerThird(ctx, slide.text, slide.kind === 'prose', alpha);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  recorder.stop();
  videos.forEach(v => { try { v?.pause(); } catch { /* ignore */ } });
  await finished;
  try { await audioCtx.close(); } catch { /* ignore */ }
}
