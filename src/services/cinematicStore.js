// The DM's saved cinematics.
//
// Kept in the campaign's battleMapDisplay collection, one document each,
// marked kind: 'cinematic'. Only the DM can write there, and the app shows
// these to nobody else. (They were first kept in the DM-only gmScreen
// collection, but the live database refused it: its rules for that
// collection are in firestore.rules but were never deployed, and the rules
// for battleMapDisplay are, since every monitor cue is written there.)
// Playing one copies what it needs into the monitor's cue, so the monitor
// never reads these documents itself.

import { collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const KIND = 'cinematic';
const PLACE = 'battleMapDisplay';
const colRef = (campaignId) => collection(db, `campaigns/${campaignId}/${PLACE}`);
const docRef = (campaignId, id) => doc(db, `campaigns/${campaignId}/${PLACE}`, id);

// Firestore refuses `undefined` anywhere in a document.
const plain = (value) => JSON.parse(JSON.stringify(value ?? {}));

/** Follow the campaign's cinematics, newest first. Returns the unsubscribe function. */
export function watchCinematics(campaignId, onList, onError = () => {}) {
  if (!campaignId) { onList([]); return () => {}; }
  return onSnapshot(
    query(colRef(campaignId), where('kind', '==', KIND)),
    snap => onList(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))),
    onError
  );
}

/** Start a new cinematic; returns its id. */
export async function createCinematic(campaignId, fields = {}) {
  const now = new Date().toISOString();
  const id = `cinematic_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await setDoc(docRef(campaignId, id), plain({ title: '', prompt: '', ...fields, kind: KIND, createdAt: now, updatedAt: now }));
  return id;
}

/** Replace the given top-level fields of a cinematic. */
export function updateCinematic(campaignId, id, fields) {
  return updateDoc(docRef(campaignId, id), plain({ ...fields, updatedAt: new Date().toISOString() }));
}

export function deleteCinematic(campaignId, id) {
  return deleteDoc(docRef(campaignId, id));
}
