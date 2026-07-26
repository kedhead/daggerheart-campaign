// Real-time subscription to the recent N rolls for a campaign. Used by
// the history sidebar / dropdown.

import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { ROLLS_PATH } from './service.js';

export function useRollHistory(campaignId, count = 50) {
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) {
      setRolls([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const q = query(
      collection(db, ROLLS_PATH(campaignId)),
      orderBy('clientTime', 'desc'),
      limit(count)
    );
    const unsub = onSnapshot(q, (snap) => {
      // Skip rolls whose dice are still deciding — they have no total yet and
      // would flash "= null" in the log for a second or two.
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.pending !== true);
      setRolls(list);
      setLoading(false);
    }, (err) => {
      console.error('[useRollHistory] subscription error:', err);
      setLoading(false);
    });
    return unsub;
  }, [campaignId, count]);

  return { rolls, loading };
}
