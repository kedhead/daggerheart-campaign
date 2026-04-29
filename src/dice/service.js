// The single writer in the dice system. Every roll in the entire app —
// from the floating roller, from a character-sheet quick-roll button, from
// an adversary card, from anywhere — calls publishRoll() and writes ONE
// canonical document to campaigns/{campaignId}/rolls/{rollId}. All viewers
// (including the roller's own DiceTray) read display values from that
// single document. Numbers are never re-derived anywhere else.

import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { rollForSystem } from './systems.js';

export const ROLLS_PATH = (campaignId) => `campaigns/${campaignId}/rolls`;

function sanitizeRoller(rollerInfo = {}) {
  return {
    rollerId: rollerInfo.rollerId || null,
    rollerName: rollerInfo.rollerName || 'Player',
    rollerColor: rollerInfo.rollerColor || '#6366f1',
  };
}

// Roll on the local device, write the canonical record, and return it.
// This is the ONLY place rolls are published.
export async function publishRoll({ campaignId, system, config = {}, rollerInfo, label = '', isPrivate = false }) {
  if (!campaignId) throw new Error('publishRoll: campaignId required');
  const result = rollForSystem(system, config);
  const roller = sanitizeRoller(rollerInfo);
  const docData = {
    system: result.system,
    dice: result.dice,
    modifier: result.modifier,
    total: result.total,
    outcome: result.outcome ?? null,
    mode: result.mode ?? null,
    flags: result.flags,
    label: String(label || ''),
    isPrivate: !!isPrivate,
    rollerId: roller.rollerId,
    rollerName: roller.rollerName,
    rollerColor: roller.rollerColor,
    // clientTime is the originating device's clock at roll time. Used by
    // useLiveRoll to decide which docs are "new since I mounted." Doesn't
    // affect canonical numbers, only animation triggering.
    clientTime: Date.now(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, ROLLS_PATH(campaignId)), docData);
  return { id: ref.id, ...docData };
}

// DM-only utility used by the history sidebar's "clear" action.
export async function clearRollHistory(campaignId) {
  if (!campaignId) return false;
  const ref = collection(db, ROLLS_PATH(campaignId));
  const snap = await getDocs(ref);
  if (snap.empty) return true;
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(doc(db, ROLLS_PATH(campaignId), d.id)));
  await batch.commit();
  return true;
}

export async function deleteRoll(campaignId, rollId) {
  if (!campaignId || !rollId) return;
  await deleteDoc(doc(db, ROLLS_PATH(campaignId), rollId));
}
