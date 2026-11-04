// The image-to-video models a still is animated with, newest first.
//
// Replicate's video models differ in name and input shape, and they come and
// go, so a scene-video request walks this list and uses the first model that
// accepts the job (api/generate-image.js). A model that rejects the input
// (404 not found, 422 bad input) just moves the request on to the next one.
//
// MiniMax H3 Highspeed goes first: 768P, about $0.03 a second, and it takes a
// last frame as well as a first. Pinning the last frame to the first makes a
// seamless loop, but H3 then plays it safe and barely moves (a boss whose
// torches flicker and nothing else), so that is off unless a caller asks for
// `loop: true`. H3 is tried a second time with only the basic inputs, in case
// it turns down the extras.

export const H3_VIDEO_MODEL = 'minimax/h3-highspeed';
export const H3_CLIP_SECONDS = 6;

/** The models to try, in order, each with the input it expects. */
export function videoCandidates({ imageUrl, prompt, loop = false, envModel = '' }) {
  const h3 = { first_frame_image: imageUrl, prompt };
  return [
    ...(envModel ? [{ path: envModel, input: { image: imageUrl, prompt } }] : []),
    { path: H3_VIDEO_MODEL, input: { ...h3, duration: H3_CLIP_SECONDS, ...(loop ? { last_frame_image: imageUrl } : {}) } },
    { path: H3_VIDEO_MODEL, input: h3 },
    { path: 'wan-video/wan-2.2-i2v-fast', input: { image: imageUrl, prompt } },
    { path: 'wan-video/wan-2.2-i2v-a14b', input: { image: imageUrl, prompt } },
    { path: 'kwaivgi/kling-v2.1', input: { start_image: imageUrl, prompt, duration: 5 } },
    { path: 'minimax/video-01-live', input: { first_frame_image: imageUrl, prompt } }
  ];
}

/** Whether a failed start should move on to the next model (not auth/billing, which fail for every model). */
export function shouldTryNextVideoModel(status) {
  return status !== 401 && status !== 402 && status !== 403;
}

/** The clip URL in a finished prediction's output: a string, a list of them, or an object holding one. */
export function videoUrlFromOutput(out) {
  if (typeof out === 'string') return out;
  if (Array.isArray(out)) return out.map(videoUrlFromOutput).find(Boolean) || null;
  if (out && typeof out === 'object') {
    const v = out.video ?? out.url ?? out.output;
    return typeof v === 'string' ? v : null;
  }
  return null;
}
