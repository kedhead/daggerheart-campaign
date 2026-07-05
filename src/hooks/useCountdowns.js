import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * GM countdowns (SRD "Countdowns" — progress/consequence clocks).
 * Stored in a single DM-only doc: campaigns/{id}/gmScreen/countdowns
 * Each item: { id, name, value, max, kind: 'standard'|'progress'|'consequence'|'long-term' }
 */
export function useCountdowns(campaignId) {
  const [countdowns, setCountdowns] = useState([]);
  const [loading, setLoading] = useState(true);

  const path = campaignId ? `campaigns/${campaignId}/gmScreen/countdowns` : null;

  useEffect(() => {
    if (!path) { setLoading(false); return; }
    const unsubscribe = onSnapshot(
      doc(db, path),
      (snap) => {
        setCountdowns(snap.exists() ? (snap.data().items || []) : []);
        setLoading(false);
      },
      (err) => {
        console.warn('Countdowns unavailable:', err?.code || err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [path]);

  const save = useCallback(async (items) => {
    if (!path) return;
    await setDoc(doc(db, path), { items, updatedAt: serverTimestamp() });
  }, [path]);

  const addCountdown = useCallback((name, max, kind = 'standard') => {
    const item = {
      id: `cd_${Date.now()}`,
      name: name.trim(),
      max: Math.max(1, Number(max) || 4),
      value: Math.max(1, Number(max) || 4),
      kind,
    };
    return save([...countdowns, item]);
  }, [countdowns, save]);

  const tick = useCallback((id, delta) => {
    return save(countdowns.map(c =>
      c.id === id ? { ...c, value: Math.max(0, Math.min(c.max, c.value + delta)) } : c
    ));
  }, [countdowns, save]);

  const resetCountdown = useCallback((id) => {
    return save(countdowns.map(c => (c.id === id ? { ...c, value: c.max } : c)));
  }, [countdowns, save]);

  const removeCountdown = useCallback((id) => {
    return save(countdowns.filter(c => c.id !== id));
  }, [countdowns, save]);

  return { countdowns, loading, addCountdown, tick, resetCountdown, removeCountdown };
}
