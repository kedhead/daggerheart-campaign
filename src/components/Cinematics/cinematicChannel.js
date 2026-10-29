// The battle map monitor's cinematic channel.
//
// The DM starts a cinematic (a boss intro or a "Previously on…" recap) and
// the monitor plays it full screen over the map, for the whole table —
// including the players who never open the app. A cue is one document,
// campaigns/{id}/battleMapDisplay/cinematic, which only the DM may write
// (the battleMapDisplay rules already say so).

import { useEffect, useState } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const cueRef = (campaignId) => doc(db, `campaigns/${campaignId}/battleMapDisplay/cinematic`);

export { isFreshCue } from './cinematicPlan';

export function playOnMonitor(campaignId, kind, data) {
  const id = `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return setDoc(cueRef(campaignId), { id, kind, data, sentAt: Date.now(), stopped: false }).then(() => id);
}

export function stopOnMonitor(campaignId) {
  return setDoc(cueRef(campaignId), { stopped: true, sentAt: Date.now() }, { merge: true });
}

/** The latest cue for this campaign's monitor. */
export function useMonitorCue(campaignId) {
  const [cue, setCue] = useState(null);
  useEffect(() => {
    if (!campaignId) return undefined;
    return onSnapshot(cueRef(campaignId), snap => setCue(snap.exists() ? snap.data() : null), () => setCue(null));
  }, [campaignId]);
  return cue;
}

/** Open the battle map monitor window (the same page Battle Map Studio opens). */
export function openMonitorWindow(campaignId) {
  window.open(
    `${window.location.origin}?view=battleMapDisplay&campaign=${campaignId}`,
    'BattleMapDisplay',
    'width=2560,height=1440,menubar=no,toolbar=no,location=no,status=no'
  );
}
