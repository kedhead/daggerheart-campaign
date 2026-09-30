// Every change to the GM's Fear pool goes through here, inside a transaction.
//
// Fear lives on campaigns/{id}/playerDisplay/current, which only the DM may
// write. It used to be changed by computing `fearCount + 1` from the DM's LOCAL
// copy and writing the whole display document back without merge, so:
//   · two quick taps, or two DM devices, lost an increment;
//   · any unrelated display change (toggling names, pushing a handout) re-sent
//     the local fearCount and could silently revert a Fear added elsewhere;
//   · nothing capped it at 12, the rulebook maximum.
//
// Reading the current value inside a transaction and writing with merge fixes
// all three, and lets the automatic Fear-from-rolls path keep a ledger of the
// rolls it has already counted.

import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { nextFearState, clampFear } from '../utils/dualityAutomation';

const displayRef = (campaignId) => doc(db, `campaigns/${campaignId}/playerDisplay/current`);

/**
 * Change Fear by a function of its current value, clamped to 0–12.
 * @returns {Promise<number|null>} the new value
 */
export async function changeFear(campaignId, fn) {
  if (!campaignId) return null;
  return runTransaction(db, async (tx) => {
    const ref = displayRef(campaignId);
    const snap = await tx.get(ref);
    const current = snap.exists() ? Number(snap.data().fearCount) || 0 : 0;
    const next = clampFear(fn(current));
    tx.set(ref, { fearCount: next, updatedAt: serverTimestamp() }, { merge: true });
    return next;
  });
}

/**
 * Add one Fear for a roll with Fear — once, however many DM devices see it.
 * @returns {Promise<boolean>} true if this call added the Fear
 */
export async function applyFearFromRoll(campaignId, rollId) {
  if (!campaignId || !rollId) return false;
  return runTransaction(db, async (tx) => {
    const ref = displayRef(campaignId);
    const snap = await tx.get(ref);
    const next = nextFearState(snap.exists() ? snap.data() : {}, rollId);
    if (!next) return false;
    tx.set(ref, { ...next, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  });
}
