// Helpers for api/render-book.js, kept free of Chromium so the smoke tests can
// exercise them directly.
//
// The browser sends the book it has already laid out (the Book Press's own
// HTML and CSS); the server only prints it. That HTML comes from a user, so
// the headless browser that prints it runs with JavaScript off and may fetch
// nothing but images from the app's own storage — otherwise a crafted "book"
// could make the server fetch internal addresses and print what came back.

export const MAX_HTML_BYTES = 3_000_000; // Vercel caps request bodies at 4.5 MB
export const MAX_CSS_BYTES = 1_000_000;  // fonts arrive inline as data: URLs

// Firebase Storage download URLs, and Google-hosted avatars.
const ALLOWED_HOSTS = [
  /^firebasestorage\.googleapis\.com$/,
  /^storage\.googleapis\.com$/,
  /^[a-z0-9-]+\.googleusercontent\.com$/
];

/** May the print browser fetch this URL? data: URLs, and https to the hosts above. */
export function isAllowedAssetUrl(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol === 'data:' || u.protocol === 'about:') return true;
  if (u.protocol !== 'https:' || u.port || u.username || u.password) return false;
  return ALLOWED_HOSTS.some(re => re.test(u.hostname));
}

const CAMPAIGN_ID = /^[A-Za-z0-9_-]{1,128}$/;

/** Validate the request body. Returns { error } or the cleaned fields. */
export function readBookRequest(body) {
  const { campaignId, html, css, title } = body || {};
  if (typeof campaignId !== 'string' || !CAMPAIGN_ID.test(campaignId)) return { error: 'A valid campaignId is required.' };
  if (typeof html !== 'string' || !html.includes('bp-book')) return { error: 'The book is missing.' };
  if (Buffer.byteLength(html) > MAX_HTML_BYTES) return { error: 'This book is too large to print in one go. Leave some chapters out and print it in parts.' };
  if (typeof css !== 'string' || Buffer.byteLength(css) > MAX_CSS_BYTES) return { error: 'The book styles are missing or too large.' };
  return { campaignId, html, css, title: typeof title === 'string' ? title.slice(0, 120) : '' };
}

/**
 * The page the print browser loads. The book's own CSS comes first, then a
 * strict content policy as a second wall behind the request filter: no
 * scripts, no frames, images and fonts only from data: or https.
 */
export function buildBookDocument({ html, css }) {
  const csp = "default-src 'none'; img-src data: https:; font-src data:; style-src 'unsafe-inline'";
  // A literal </style> inside the CSS would end the style element early.
  const safeCss = css.replace(/<\/style/gi, '<\\/style');
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>${safeCss}</style></head><body>${html}</body></html>`;
}

/** Page count of a PDF, from its page objects. Good enough for a status line. */
export function countPdfPages(buffer) {
  const text = Buffer.isBuffer(buffer) ? buffer.toString('latin1') : String(buffer || '');
  return (text.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}

/** Where the finished PDF goes: the campaign's storybook media, which members may already upload to. */
export function bookStoragePath(campaignId, title, now = Date.now()) {
  const slug = String(title || 'book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'book';
  return `campaigns/${campaignId}/storybook/media/${slug}-${now}.pdf`;
}

/**
 * Upload to Firebase Storage over its REST API, as the signed-in user — the
 * same storage rules apply as for an upload from the app, and no service
 * account is needed. Returns a download URL.
 */
export async function uploadToStorage({ bucket, path, bytes, idToken, fetchImpl = fetch }) {
  const endpoint = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${encodeURIComponent(path)}`;
  const res = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf', Authorization: `Firebase ${idToken}` },
    body: bytes
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw Object.assign(new Error(`Storage upload failed (${res.status}). ${detail.slice(0, 200)}`), { status: res.status });
  }
  const meta = await res.json();
  const token = String(meta.downloadTokens || '').split(',')[0];
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}?alt=media${token ? `&token=${token}` : ''}`;
}
