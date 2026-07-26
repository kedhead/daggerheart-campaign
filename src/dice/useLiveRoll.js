// Subscribes to the latest roll in campaigns/{campaignId}/rolls and emits
// it to a callback exactly once per roll, only when the roll happened
// AFTER this hook mounted. Used by DiceTray to trigger animations.
//
// Why clientTime > mountTime instead of orderBy(createdAt) alone? Because
// serverTimestamp() is null while a write is pending, so the originating
// client briefly sees its own doc with createdAt=null. Filtering on
// clientTime (set on the writing device) gives us a stable monotonic
// ordering that includes pending writes.

import { useEffect, useRef } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { ROLLS_PATH } from './service.js';

export function useLiveRoll(campaignId, onRoll) {
  const onRollRef = useRef(onRoll);
  onRollRef.current = onRoll;

  useEffect(() => {
    if (!campaignId) return undefined;
    const mountTime = Date.now();
    // id -> 'pending' | 'complete'. A roll is emitted once per state, so a
    // roll the display window resolves is emitted twice: once unresolved (the
    // display throws the dice for it) and once with the faces they landed on.
    const seen = new Map();

    // limit(10), not limit(1): when several players roll at once, a
    // limit(1) window only ever surfaces the newest doc and the rest of
    // the burst is silently dropped. Ten covers any realistic same-second
    // flurry; `seen` keeps each roll emitted exactly once.
    const q = query(
      collection(db, ROLLS_PATH(campaignId)),
      orderBy('clientTime', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fresh = [];
      snap.docChanges().forEach(change => {
        if (change.type !== 'added' && change.type !== 'modified') return;
        const data = change.doc.data();
        const id = change.doc.id;
        const state = data.pending === true ? 'pending' : 'complete';
        if (seen.get(id) === state) return;
        const clientTime = typeof data.clientTime === 'number' ? data.clientTime : 0;
        if (clientTime <= mountTime) {
          // Existing roll loaded as part of initial snapshot — record it but
          // don't animate. The hook only triggers for NEW rolls.
          seen.set(id, state);
          return;
        }
        seen.set(id, state);
        fresh.push({ id, ...data });
      });
      // Emit bursts oldest-first so viewers see rolls in table order.
      fresh.sort((a, b) => (a.clientTime || 0) - (b.clientTime || 0));
      fresh.forEach(roll => { if (onRollRef.current) onRollRef.current(roll); });
    }, (err) => {
      console.error('[useLiveRoll] subscription error:', err);
    });

    return unsub;
  }, [campaignId]);
}
