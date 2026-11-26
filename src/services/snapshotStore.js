// The DM's scene pictures: stills of the campaign's characters in a moment
// the DM describes ("everyone around the tavern table"), ready to show on
// the battle map monitor.
//
// Kept beside the cinematics in the campaign's battleMapDisplay collection,
// one document each, marked kind: 'snapshot' (see cinematicStore.js for why
// that collection). Showing one copies its picture into the monitor's cue.

import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const KIND = 'snapshot';
const PLACE = 'battleMapDisplay';
const colRef = (campaignId) => collection(db, `campaigns/${campaignId}/${PLACE}`);
const docRef = (campaignId, id) => doc(db, `campaigns/${campaignId}/${PLACE}`, id);

// Firestore refuses `undefined` anywhere in a document.
const plain = (value) => JSON.parse(JSON.stringify(value ?? {}));

/** Follow the campaign's scene pictures, newest first. Returns the unsubscribe function. */
export function watchSnapshots(campaignId, onList, onError = () => {}) {
  if (!campaignId) { onList([]); return () => {}; }
  return onSnapshot(
    query(colRef(campaignId), where('kind', '==', KIND)),
    snap => onList(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))),
    onError
  );
}

/** Save a new scene picture; returns its id. */
export async function createSnapshot(campaignId, fields = {}) {
  const now = new Date().toISOString();
  const id = `snapshot_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await setDoc(docRef(campaignId, id), plain({ title: '', prompt: '', ...fields, kind: KIND, createdAt: now, updatedAt: now }));
  return id;
}

export function deleteSnapshot(campaignId, id) {
  return deleteDoc(docRef(campaignId, id));
}
