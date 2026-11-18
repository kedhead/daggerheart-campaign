// The last frame of a clip, as a picture.
//
// A cinematic shot that "carries on from the shot before" is animated from
// the final frame of the previous clip, so the movement continues across the
// cut instead of jumping to a freshly drawn picture.

const once = (el, event, ms = 15000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`the clip did not ${event === 'seeked' ? 'seek' : 'load'} in time`)), ms);
  el.addEventListener(event, () => { clearTimeout(timer); resolve(); }, { once: true });
  el.addEventListener('error', () => { clearTimeout(timer); reject(new Error('the clip could not be read')); }, { once: true });
});

/**
 * Read the last frame of the clip at `url` and return it as a PNG Blob.
 * The clip is downloaded first and read from memory, so the canvas is not
 * blocked by the storage host's cross-origin rules.
 */
export async function lastFrameOf(url, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`the clip could not be downloaded (HTTP ${res.status})`);
  const address = URL.createObjectURL(await res.blob());
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = address;
    await once(video, 'loadedmetadata');
    // Some recordings report no length until asked for a point past their end.
    const end = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1e6;
    video.currentTime = Math.max(0, end - 0.08);
    await once(video, 'seeked');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!canvas.width || !canvas.height) throw new Error('the clip has no picture to read');
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('the frame could not be saved');
    return blob;
  } finally {
    URL.revokeObjectURL(address);
  }
}
