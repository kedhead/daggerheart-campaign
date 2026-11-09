// Storybook images on Google's nano-banana models (via Replicate), sturdier.
//
// When Replicate has a bad moment it answers with an HTML error page instead
// of JSON, and the app used to show that page's source as the error
// ("<!DOCTYPE html> <!--[if lt IE 7]>…"). Now a hiccup like that (a 5xx, a
// 429, an HTML page or a dropped connection) is tried once more, then on the
// other nano-banana version, which also takes the portraits as references.
// A real refusal or bad input stops at once, and whatever error is left is
// told in a sentence, not as a web page.

/** Whether a failed Replicate answer is worth another try. */
export function isTransientReplicateError(status, body = '') {
  return status === 429 || status >= 500 || looksLikeHtml(body);
}

export function looksLikeHtml(text) {
  return /^\s*(<!doctype html|<html|<!--)/i.test(String(text || ''));
}

/** A one-line reason from a Replicate error body: its JSON message, or for an HTML page its title. */
export function replicateErrorReason(status, body) {
  const text = String(body || '');
  if (looksLikeHtml(text)) {
    const title = (text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
    return `Replicate is having trouble right now (HTTP ${status}${title ? `: ${title.slice(0, 80)}` : ''}). Try again in a minute.`;
  }
  try {
    const parsed = JSON.parse(text);
    const msg = parsed?.detail || parsed?.error?.message || parsed?.error || parsed?.title || parsed?.message;
    if (msg) return String(typeof msg === 'string' ? msg : JSON.stringify(msg)).slice(0, 240);
  } catch { /* plain text */ }
  return (text || `HTTP ${status}`).replace(/\s+/g, ' ').trim().slice(0, 240);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Make one image on the first nano-banana model that manages it.
 *
 * @param {object} opts
 * @param {string} opts.apiKey - Replicate token
 * @param {string[]} opts.models - e.g. ['google/nano-banana-2', 'google/nano-banana']
 * @param {object} opts.input - the prediction input
 * @param {number} [opts.budgetMs] - stop starting new work after this long (the function has 60s)
 * @returns {Promise<{ok: true, url: string, model: string} | {ok: false, status: number, error: string, model: string}>}
 */
export async function runNanoBanana({ apiKey, models, input, budgetMs = 52000, fetchImpl = fetch, wait = sleep, now = Date.now }) {
  const started = now();
  const left = () => budgetMs - (now() - started);
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  let last = { ok: false, status: 500, error: 'Replicate did not answer.', model: models[0] };

  // Each model gets two tries; a transient failure moves on, a real one stops.
  const attempts = models.flatMap(model => [model, model]);
  for (let i = 0; i < attempts.length; i++) {
    const model = attempts[i];
    if (left() < 8000) break;
    if (i > 0) await wait(1500);

    let res;
    try {
      res = await fetchImpl(`https://api.replicate.com/v1/models/${model}/predictions`, {
        method: 'POST',
        // Hold the request open for the result, but not past the budget.
        headers: { ...headers, Prefer: `wait=${Math.max(5, Math.min(30, Math.floor(left() / 1000) - 10))}` },
        body: JSON.stringify({ input })
      });
    } catch (err) {
      last = { ok: false, status: 502, error: `Could not reach Replicate (${err.message}). Try again in a minute.`, model };
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      last = { ok: false, status: res.status || 500, error: replicateErrorReason(res.status, body), model };
      if (isTransientReplicateError(res.status, body)) continue;
      return last;
    }

    let prediction = await res.json().catch(() => ({}));
    const pollUrl = prediction.urls?.get || (prediction.id && `https://api.replicate.com/v1/predictions/${prediction.id}`);
    while (pollUrl && !['succeeded', 'failed', 'canceled'].includes(prediction.status) && left() > 3000) {
      await wait(2000);
      try {
        const poll = await fetchImpl(pollUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (poll.ok) prediction = await poll.json();
      } catch { /* keep polling until the budget runs out */ }
    }

    if (prediction.status === 'succeeded') {
      const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      if (url) return { ok: true, url, model };
      return { ok: false, status: 500, error: `${model} returned no image.`, model };
    }
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const reason = replicateErrorReason(500, typeof prediction.error === 'string' ? prediction.error : JSON.stringify(prediction.error || 'unknown reason'));
      last = { ok: false, status: 500, error: `${model} could not make the image: ${reason}`, model };
      // A refusal (safety filter, bad input) will fail the same way on a retry.
      if (/safety|sensitive|flagged|nsfw|policy|invalid/i.test(reason)) return last;
      continue;
    }
    return { ok: false, status: 504, error: `${model} is taking too long right now. Try again in a minute.`, model };
  }
  return last;
}
