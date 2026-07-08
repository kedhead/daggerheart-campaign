/**
 * cinematicExporter — render a cinematic timeline to a downloadable WebM video.
 *
 * Draws each slide onto an offscreen canvas with the same Ken Burns motion and
 * lower-third text as CinematicPlayer, captures it via canvas.captureStream,
 * mixes narration + music through WebAudio into the recording, and saves the
 * result. Requires a browser with MediaRecorder + captureStream (desktop
 * Chrome/Edge); throws a friendly error otherwise.
 */

const W = 1280;
const H = 720;
const FPS = 30;

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

// Cover-fit an image into WxH, then apply scale+translate (% of frame) for pan.
function drawSlide(ctx, img, pan, t) {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);
  if (img) {
    const scale = pan.fromScale + (pan.toScale - pan.fromScale) * t;
    const tx = (pan.fromX + (pan.toX - pan.fromX) * t) / 100 * W;
    const ty = (pan.fromY + (pan.toY - pan.fromY) * t) / 100 * H;
    // cover fit
    const ir = img.width / img.height;
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

export async function exportCinematicWebM({ timeline, musicUrl, title, onProgress }) {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error('Video export needs desktop Chrome or Edge.');
  }
  const mimeType = pickMimeType();
  if (!mimeType) throw new Error('This browser cannot record WebM video.');

  // Preload images
  const images = await Promise.all(timeline.map(s => loadImage(s.imageUrl)));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Audio graph: narration buffers scheduled per slide + looped music, mixed
  // into a MediaStream track we combine with the canvas video track.
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  const dest = audioCtx.createMediaStreamDestination();

  const musicBuf = await fetchAudioBuffer(audioCtx, musicUrl);
  const narrationBufs = await Promise.all(
    timeline.map(s => fetchAudioBuffer(audioCtx, s.narrationUrl))
  );

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

  // Schedule audio relative to audioCtx start time.
  const audioStart = audioCtx.currentTime + 0.15;
  if (musicBuf) {
    const src = audioCtx.createBufferSource();
    src.buffer = musicBuf;
    src.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = narrationBufs.some(Boolean) ? 0.12 : 0.28;
    src.connect(gain).connect(dest);
    src.start(audioStart);
    src.stop(audioStart + totalSec + 0.2);
  }
  narrationBufs.forEach((buf, i) => {
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(dest);
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

  await new Promise((resolve) => {
    function frame() {
      const elapsed = (performance.now() - t0) / 1000;
      if (elapsed >= totalSec) return resolve();

      // Which slide are we in?
      let i = 0;
      while (i < starts.length - 1 && elapsed >= starts[i + 1]) i++;
      if (i !== lastSlide) { lastSlide = i; onProgress?.(i + 1); }

      const local = (elapsed - starts[i]) / (durations[i] || 1); // 0..1
      const slide = timeline[i];
      drawSlide(ctx, images[i], slide.pan, Math.min(1, local));

      // Text fade-in over first 0.6s of the slide
      const alpha = Math.min(1, local / (0.6 / (durations[i] || 1)));
      if (slide.kind === 'title') drawTitle(ctx, slide.text, alpha);
      else if (slide.text) drawLowerThird(ctx, slide.text, slide.kind === 'prose', alpha);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  recorder.stop();
  await finished;
  try { await audioCtx.close(); } catch { /* ignore */ }
}
