// The single writer in the dice system. Every roll in the entire app —
// from the floating roller, from a character-sheet quick-roll button, from
// an adversary card, from anywhere — calls publishRoll() and writes ONE
// canonical document to campaigns/{campaignId}/rolls/{rollId}. All viewers
// (including the roller's own DiceTray) read display values from that
// single document. Numbers are never re-derived anywhere else.

import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { rollForSystem } from './systems.js';
import { applyDiceColors } from './playerColor.js';
import { scriptedRng } from './scriptedRng.js';

export const ROLLS_PATH = (campaignId) => `campaigns/${campaignId}/rolls`;

// The battle map display claims this while it is open. When a live claim
// exists, rolls are published unresolved and that screen rolls real 3D dice
// to decide the numbers — so the faces players watch land on ARE the result.
// dice-box cannot be told what to land on (it ray-casts the settled die), so
// letting the dice decide is the only way the two can agree.
export const DICE_AUTHORITY_PATH = (campaignId) =>
  `campaigns/${campaignId}/battleMapDisplay/diceAuthority`;

// A claim older than this is treated as dead (display closed or crashed).
const AUTHORITY_TTL_MS = 30000;
// How long a roller waits for the display to resolve its roll before
// deciding the display isn't coming and resolving it locally.
const PENDING_RESCUE_MS = 12000;

function sanitizeRoller(rollerInfo = {}) {
  return {
    rollerId: rollerInfo.rollerId || null,
    rollerName: rollerInfo.rollerName || 'Player',
    rollerColor: rollerInfo.rollerColor || '#6366f1',
    duality: rollerInfo.duality || null, // { hope, fear } from the chosen set
  };
}



// ── Dice authority ────────────────────────────────────────────────────────

/** Called by the display window while it is open, on a heartbeat. */
export async function claimDiceAuthority(campaignId, claimedBy = null) {
  if (!campaignId) return;
  await setDoc(doc(db, DICE_AUTHORITY_PATH(campaignId)), {
    claimedBy,
    // Wall-clock from the claiming device. serverTimestamp() is null until
    // the write lands, which would make a fresh claim look expired.
    clientTime: Date.now(),
    updatedAt: serverTimestamp(),
  });
}

export async function releaseDiceAuthority(campaignId) {
  if (!campaignId) return;
  try {
    await deleteDoc(doc(db, DICE_AUTHORITY_PATH(campaignId)));
  } catch (err) {
    console.warn('[dice] could not release authority:', err);
  }
}

async function hasLiveDiceAuthority(campaignId) {
  try {
    const snap = await getDoc(doc(db, DICE_AUTHORITY_PATH(campaignId)));
    if (!snap.exists()) return false;
    const t = snap.data()?.clientTime;
    return typeof t === 'number' && Date.now() - t < AUTHORITY_TTL_MS;
  } catch (err) {
    // Never block a roll on this check — fall back to rolling locally.
    console.warn('[dice] authority check failed, rolling locally:', err);
    return false;
  }
}

/**
 * Fill in a pending roll from the faces the physical dice landed on.
 * Called by the display window once its 3D dice settle.
 *
 * `shape` is the dice array from the pending doc. Its colours were computed
 * at publish time from the roller's chosen duality set, which isn't stored on
 * the doc — so reuse them rather than re-deriving and losing the player's
 * Hope/Fear colours.
 */
export async function resolveRoll(campaignId, rollId, { system, config = {}, values, rollerInfo, shape }) {
  if (!campaignId || !rollId) return null;
  const roller = sanitizeRoller(rollerInfo);
  const result = rollForSystem(system, config, scriptedRng(values));
  result.dice = Array.isArray(shape) && shape.length === result.dice.length
    ? result.dice.map((d, i) => ({ ...d, color: shape[i]?.color ?? d.color, label: shape[i]?.label ?? d.label }))
    : applyDiceColors(result.dice, roller);
  const patch = {
    dice: result.dice,
    modifier: result.modifier,
    total: result.total,
    outcome: result.outcome ?? null,
    mode: result.mode ?? null,
    flags: result.flags,
    pending: false,
    resolvedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, ROLLS_PATH(campaignId), rollId), patch);
  return patch;
}

// If the display claimed authority and then died mid-roll, the doc would sit
// unresolved forever. The roller watches its own roll and finishes it locally.
function scheduleRescue(campaignId, rollId, { system, config, roller }) {
  setTimeout(async () => {
    try {
      const snap = await getDoc(doc(db, ROLLS_PATH(campaignId), rollId));
      if (!snap.exists() || snap.data()?.pending !== true) return;
      console.warn('[dice] display never resolved roll, rolling locally:', rollId);
      // No physics values — scriptedRng falls back to crypto for every draw.
      await resolveRoll(campaignId, rollId, { system, config, values: [], rollerInfo: roller });
    } catch (err) {
      console.warn('[dice] rescue of pending roll failed:', err);
    }
  }, PENDING_RESCUE_MS);
}

// Write the canonical record and return it. This is the ONLY place rolls are
// published. When the display window is live it decides the numbers; when it
// isn't, they are rolled here with the crypto RNG exactly as before.
export async function publishRoll({ campaignId, system, config = {}, rollerInfo, label = '', isPrivate = false }) {
  if (!campaignId) throw new Error('publishRoll: campaignId required');
  const roller = sanitizeRoller(rollerInfo);
  const authoritative = await hasLiveDiceAuthority(campaignId);

  // Rolled locally either way: with an authority this only supplies the SHAPE
  // of the roll (which dice, what colour) for the display to throw. Its values
  // are stripped so nothing shows a number the dice haven't produced yet.
  const result = rollForSystem(system, config);
  result.dice = applyDiceColors(result.dice, roller);

  const base = {
    system: result.system,
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

  const docData = authoritative
    ? {
        ...base,
        pending: true,
        // What to throw, without any outcome attached.
        dice: result.dice.map(({ value, ...shape }) => shape),
        modifier: result.modifier,
        total: null,
        outcome: null,
        mode: result.mode ?? null,
        flags: null,
        // The display replays these through the same roll logic.
        rollConfig: { system, config },
      }
    : {
        ...base,
        pending: false,
        dice: result.dice,
        modifier: result.modifier,
        total: result.total,
        outcome: result.outcome ?? null,
        mode: result.mode ?? null,
        flags: result.flags,
      };

  const ref = await addDoc(collection(db, ROLLS_PATH(campaignId)), docData);
  if (authoritative) scheduleRescue(campaignId, ref.id, { system, config, roller });
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
