// OpenAI image calls, newest model first.
//
// OpenAI retires image models ("The model 'gpt-image-1' does not exist"), and
// a hard-coded model name then breaks every portrait at once. Every OpenAI
// image request here walks the same chain the battle maps use: the newest
// model first, and on "no such model" or "size not supported" the next one.
// Real errors (a refusal, a bad key, a rate limit) stop the chain and are
// reported as they are.

import { MAP_MODELS, runModelChain } from './battleMap.js';

export const IMAGE_MODELS = [MAP_MODELS.standard, 'gpt-image-2', 'gpt-image-1'];

/** The sizes every model in the chain accepts. Legacy DALL-E sizes map to the nearest. */
export function openaiImageSize(size) {
  if (size === '1792x1024') return '1536x1024';
  if (size === '1024x1792') return '1024x1536';
  return ['1024x1024', '1536x1024', '1024x1536'].includes(size) ? size : '1024x1024';
}

const readBody = async (res) => {
  const text = await res.text().catch(() => '');
  try { return JSON.parse(text); } catch { return { error: { message: text || res.statusText } }; }
};

/**
 * Run `send(model)` down the model chain. `send` makes one request and
 * returns the fetch Response. Resolves to { ok, status, body, model }.
 */
export async function runImageChain(send, models = IMAGE_MODELS) {
  const result = await runModelChain(models.map(model => ({ model })), async ({ model }) => {
    const res = await send(model);
    return { ok: res.ok, status: res.status, body: await readBody(res) };
  });
  return { ok: result.ok, status: result.status, body: result.body, model: result.step.model };
}

/** A text-to-image request, down the chain. */
export function generateOpenAIImage({ apiKey, prompt, size, quality, extra = {}, fetchImpl = fetch }) {
  return runImageChain(model => fetchImpl('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, prompt, n: 1, size: openaiImageSize(size), quality, ...extra })
  }));
}

/** The image in a successful OpenAI response, as a URL the app can show. */
export function imageFromBody(body) {
  const b64 = body?.data?.[0]?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  return body?.data?.[0]?.url || null;
}

/** A short, safe message for a failed OpenAI response. */
export function imageErrorMessage(result) {
  const msg = result?.body?.error?.message || `HTTP ${result?.status}`;
  return `${result?.model || 'OpenAI'} image error: ${String(msg).slice(0, 300)}`;
}
