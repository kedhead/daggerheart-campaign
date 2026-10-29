/**
 * Turn a still image into a short AI video clip (Replicate image-to-video via
 * /api/generate-image). Starting a job returns at once; the clip is polled
 * until it is ready, then downloaded so the caller can store it — a clip is
 * paid for once and replayed from Storage after that.
 *
 * Shared by the storybook Motion Comic (animating a scene) and the table
 * cinematics (animating a boss portrait or a recap slide).
 */

import { apiFetch } from './apiClient';

const post = (body) => apiFetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

/**
 * @param {object} opts
 * @param {string} opts.imageUrl - the still to animate
 * @param {string} [opts.prompt] - how it should move
 * @param {(label: string) => void} [opts.onStatus] - progress for the UI
 * @returns {Promise<Blob>} the mp4
 */
export async function animateStill({ imageUrl, prompt, onStatus = () => {} }) {
  onStatus('Starting…');
  const createResp = await post({ type: 'scene-video', imageUrl, prompt });
  const created = await createResp.json().catch(() => ({}));
  if (!createResp.ok || !created.predictionId) {
    throw new Error(created.error || `Could not start animation (HTTP ${createResp.status})`);
  }

  onStatus('Animating… (~1–3 min)');
  const deadline = Date.now() + 8 * 60 * 1000;
  let videoUrl = null;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 8000));
    const st = await post({ type: 'video-status', predictionId: created.predictionId });
    const data = await st.json().catch(() => ({}));
    if (!st.ok) throw new Error(data.error || `Status check failed (HTTP ${st.status})`);
    if (data.status === 'succeeded' && data.videoUrl) { videoUrl = data.videoUrl; break; }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(data.error || 'Video generation failed.');
    }
  }
  if (!videoUrl) throw new Error('Video generation timed out — try again in a minute.');

  onStatus('Saving clip…');
  // Fetch the clip: replicate.delivery allows CORS; fall back to the proxy.
  let blob = null;
  try {
    const direct = await fetch(videoUrl);
    if (direct.ok) blob = await direct.blob();
  } catch { /* CORS or network — use the proxy below */ }
  if (!blob) {
    const pr = await apiFetch('/api/download-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: videoUrl })
    });
    if (pr.ok) {
      const { dataUrl } = await pr.json();
      blob = await (await fetch(dataUrl)).blob();
    }
  }
  if (!blob || blob.size < 1000) throw new Error('Could not download the generated clip.');
  return blob;
}
