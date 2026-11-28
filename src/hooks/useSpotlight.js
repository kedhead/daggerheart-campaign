import { useEffect, useRef, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { newScene, giveSpotlight, undoSpotlight } from '../utils/spotlight';

/**
 * The campaign's spotlight for Daggerheart, kept beside the initiative at
 * campaigns/{id}/initiative/spotlight (members may write there already).
 */
export function useSpotlight(campaignId) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  // Edits start from the latest state, so quick taps never undo each other.
  const latest = useRef(null);

  useEffect(() => {
    if (!campaignId) { setLoading(false); return undefined; }
    const ref = doc(db, `campaigns/${campaignId}/initiative`, 'spotlight');
    return onSnapshot(ref, snap => {
      const data = snap.exists() ? snap.data() : null;
      latest.current = data;
      setState(data);
      setLoading(false);
    }, () => setLoading(false));
  }, [campaignId]);

  const save = useCallback(async (next) => {
    if (!campaignId) return;
    latest.current = next;
    setState(next);
    await setDoc(doc(db, `campaigns/${campaignId}/initiative`, 'spotlight'), { ...next, updatedAt: Date.now() });
  }, [campaignId]);

  return {
    spotlight: state,
    loading,
    // `cast` (see spotlightCast) goes with each change, so the TV can name and show the party.
    startScene: (name, cast) => save({ ...newScene(name), ...(cast ? { cast } : {}) }),
    give: (to, reason, cast) => save({ ...giveSpotlight(latest.current || newScene(), to, reason), ...(cast ? { cast } : {}) }),
    undo: () => save(undoSpotlight(latest.current || newScene())),
    renameScene: (name) => save({ ...(latest.current || newScene()), scene: String(name || '').slice(0, 80) })
  };
}
