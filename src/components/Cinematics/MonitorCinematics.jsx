import { useEffect, useState } from 'react';
import CinematicStage from './CinematicStage';
import { useMonitorCue, isFreshCue } from './cinematicChannel';
import { audioContext } from './cinematicSfx';

/**
 * The battle map monitor's half of the cinematics: plays each new cue the DM
 * sends, once, and stops when the DM stops it.
 */
export default function MonitorCinematics({ campaignId }) {
  const cue = useMonitorCue(campaignId);
  const [playing, setPlaying] = useState(null);
  const [playedId, setPlayedId] = useState(null);

  useEffect(() => {
    if (!cue) return;
    if (cue.stopped) { setPlaying(null); return; }
    if (cue.id !== playedId && isFreshCue(cue)) {
      setPlayedId(cue.id);
      setPlaying(cue);
    }
  }, [cue, playedId]);

  // Any click on the monitor (fullscreen, rotate…) also unlocks cinematic sound.
  useEffect(() => {
    const unlock = () => { audioContext()?.resume?.().catch(() => {}); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return playing ? <CinematicStage key={playing.id} cue={playing} onClose={() => setPlaying(null)} /> : null;
}
