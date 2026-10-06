// Sign-in check for the serverless API.
//
// Every endpoint here spends money on someone's behalf — OpenAI images,
// Anthropic text, ElevenLabs audio, Replicate video — and until now none of
// them checked who was asking. Anyone who found a URL could run up the bill.
//
// The browser already holds a Firebase sign-in; it now sends that user's ID
// token as `Authorization: Bearer <token>` (src/services/apiClient.js). Here
// the token is verified against Google's published signing keys — no service
// account or new secret needed, only the Firebase project id, which Vercel
// already has as VITE_FIREBASE_PROJECT_ID.
//
// Files under api/_lib are not deployed as endpoints (underscore prefix).

import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let googleKeys = null; // fetched once per warm function instance, then cached by jose

export function firebaseProjectId() {
  return process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
}

/**
 * Verify a Firebase ID token. Throws if it is missing, malformed, expired,
 * signed by anyone but Google, or issued for a different Firebase project.
 *
 * @param {string} token
 * @param {{ projectId?: string, keys?: Function }} [opts] - `keys` is injectable for tests
 * @returns {Promise<{ uid: string, email: string|null }>}
 */
export async function verifyIdToken(token, { projectId = firebaseProjectId(), keys } = {}) {
  if (!projectId) throw Object.assign(new Error('Server sign-in check is not configured (no Firebase project id).'), { status: 500 });
  if (!token) throw Object.assign(new Error('Sign in to use this feature.'), { status: 401 });
  if (!keys) {
    googleKeys ||= createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
    keys = googleKeys;
  }
  const { payload } = await jwtVerify(token, keys, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  });
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Token has no user.');
  return { uid: payload.sub, email: typeof payload.email === 'string' ? payload.email : null };
}

/** The bearer token from a request, or ''. */
export function bearerToken(req) {
  const header = req?.headers?.authorization || req?.headers?.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(header).trim());
  return m ? m[1].trim() : '';
}

// Tests swap the verifier so handlers can be exercised without Google's keys.
let verifier = verifyIdToken;
export function setTokenVerifierForTests(fn) { verifier = fn || verifyIdToken; }

/**
 * Gate a handler: returns the signed-in user, or sends 401/500 and returns
 * null. Call it after answering OPTIONS:
 *
 *   const user = await requireUser(req, res);
 *   if (!user) return;
 */
export async function requireUser(req, res) {
  try {
    return await verifier(bearerToken(req));
  } catch (err) {
    const status = err?.status === 500 ? 500 : 401;
    if (status === 500) console.error('[auth]', err.message);
    res.status(status).json({
      error: status === 500 ? err.message : 'Sign in to use this feature. If you are signed in, refresh the page and try again.',
    });
    return null;
  }
}

/** The CORS header list every endpoint allows (it now includes Authorization). */
export const ALLOWED_HEADERS = 'Content-Type, Authorization';
