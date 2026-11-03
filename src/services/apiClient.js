// fetch() for our own /api endpoints, with the signed-in user's token.
//
// The serverless functions now refuse requests without a Firebase ID token
// (api/_lib/auth.js), so every call to /api goes through here. Same signature
// as fetch. Firebase refreshes the token itself when it's close to expiry.
//
// Firebase is imported lazily so modules that call the API stay importable in
// the node smoke tests, which never load the Firebase app.

import { contentHeaders } from './contentRating';

export async function authHeaders() {
  try {
    const { auth } = await import('../config/firebase');
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const auth = await authHeaders();
  if (auth.Authorization && !headers.has('Authorization')) headers.set('Authorization', auth.Authorization);
  // A mature campaign's rating rides along with every AI request (services/contentRating.js).
  for (const [k, v] of Object.entries(contentHeaders())) if (!headers.has(k)) headers.set(k, v);
  return fetch(path, { ...init, headers });
}
