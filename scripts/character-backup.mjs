#!/usr/bin/env node
/**
 * Character backup / restore CLI.
 *
 * Signs in with the Firebase Web SDK as a real campaign member (same
 * credentials you use in the app), so it works without service-account keys
 * and obeys the same Firestore rules.
 *
 * Setup: put the VITE_FIREBASE_* values from .env.local in your environment,
 * plus the account to sign in as:
 *
 *   FIREBASE_EMAIL=you@example.com
 *   FIREBASE_PASSWORD=…
 *
 * Usage:
 *   node scripts/character-backup.mjs dump    <campaignId> [outFile]
 *   node scripts/character-backup.mjs restore <campaignId> <file.json> [docId]
 *
 * `dump` writes every character document (including trashed ones) to JSON —
 * run it before anything risky, or on a schedule.
 * `restore` writes one character document back. Pass the JSON for a single
 * character (as produced by `dump`, or recovered from a Firestore
 * point-in-time export). With a docId the original document id is reused;
 * without one a new character is created.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, collection, getDocs, doc, setDoc, addDoc,
} from 'firebase/firestore';
import 'dotenv/config';

const [, , command, campaignId, arg3, arg4] = process.argv;

const fail = (msg) => { console.error(`\n${msg}\n`); process.exit(1); };

if (!command || !campaignId) {
  fail('Usage:\n  node scripts/character-backup.mjs dump    <campaignId> [outFile]\n' +
       '  node scripts/character-backup.mjs restore <campaignId> <file.json> [docId]');
}

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!config.apiKey || !config.projectId) {
  fail('Missing VITE_FIREBASE_* environment variables (copy them from .env.local).');
}
if (!process.env.FIREBASE_EMAIL || !process.env.FIREBASE_PASSWORD) {
  fail('Set FIREBASE_EMAIL and FIREBASE_PASSWORD to a campaign member account.');
}

const app = initializeApp(config);
const db = getFirestore(app);

await signInWithEmailAndPassword(
  getAuth(app),
  process.env.FIREBASE_EMAIL.trim().toLowerCase(),
  process.env.FIREBASE_PASSWORD
).catch((err) => fail(`Sign-in failed: ${err.code || err.message}`));

const charactersPath = `campaigns/${campaignId}/characters`;

if (command === 'dump') {
  const outFile = arg3 || `characters-${campaignId}-${new Date().toISOString().slice(0, 10)}.json`;
  const snap = await getDocs(collection(db, charactersPath));
  const characters = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  await writeFile(outFile, JSON.stringify(characters, null, 2));
  console.log(`Wrote ${characters.length} character(s) to ${outFile}`);
  for (const c of characters) {
    console.log(`  ${c.id}  ${c.name}${c.deletedAt ? '  [trashed]' : ''}`);
  }
  process.exit(0);
}

if (command === 'restore') {
  if (!arg3) fail('restore needs a JSON file: node scripts/character-backup.mjs restore <campaignId> <file.json> [docId]');

  const parsed = JSON.parse(await readFile(arg3, 'utf8'));
  const character = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!character?.name) fail(`${arg3} does not look like a character (no "name" field).`);

  // Drop the trash stamp and the document id — neither belongs in the body.
  const { id, deleted, deletedAt, deletedBy, deletedByName, ...fields } = character;
  const payload = { ...fields, restoredAt: new Date().toISOString() };

  const docId = arg4 || id;
  if (docId) {
    await setDoc(doc(db, charactersPath, docId), payload);
    console.log(`Restored "${character.name}" to ${charactersPath}/${docId}`);
  } else {
    const ref = await addDoc(collection(db, charactersPath), payload);
    console.log(`Restored "${character.name}" as a new character: ${charactersPath}/${ref.id}`);
  }
  process.exit(0);
}

fail(`Unknown command "${command}". Expected "dump" or "restore".`);
