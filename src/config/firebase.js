import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services.
// Firestore gets two resilience upgrades for flaky mobile/venue networks:
//  - auto-detected long polling: falls back from WebChannel streaming when a
//    carrier or proxy silently blocks it (the classic "stuck on Loading…")
//  - persistent local cache: listeners answer instantly from IndexedDB while
//    the network catches up, and reads keep working through brief dropouts.
export const auth = getAuth(app);

let firestore;
try {
  firestore = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (err) {
  // Private-mode browsers without IndexedDB, or double-init in HMR — fall
  // back to the default memory-backed instance rather than failing to boot.
  console.warn('Firestore persistent cache unavailable, using defaults:', err?.message);
  firestore = getFirestore(app);
}
export const db = firestore;

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
