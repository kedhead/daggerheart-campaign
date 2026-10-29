import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2 } from 'lucide-react';
import BossIntro from './BossIntro';
import RecapReel from './RecapReel';
import { audioContext } from './cinematicSfx';
import { createSoundPlayer } from './soundPlayer';
import './CinematicStage.css';

/**
 * Full-screen stage for one cinematic: { kind: 'boss' | 'recap', data }.
 * Used by the battle map monitor and by the DM's own preview.
 *
 * Browsers only play sound after someone has clicked the page. If the
 * monitor has not been clicked yet, the cinematic still plays and a small
 * "click for sound" chip appears; one click turns sound on for the rest of
 * the night.
 */
export default function CinematicStage({ cue, onClose }) {
  const [soundBlocked, setSoundBlocked] = useState(() => audioContext()?.state === 'suspended');
  // The cinematic's sounds load before it starts, so the first hit lands on
  // the first slam rather than a second late.
  const sfx = useMemo(() => createSoundPlayer(cue?.data?.sounds), [cue]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    sfx.onBlocked = setSoundBlocked;
    sfx.ready.then(() => { if (live) setReady(true); });
    return () => { live = false; sfx.stop(); };
  }, [sfx]);

  useEffect(() => {
    // Capture phase on window runs before the dialogs' own Escape handling,
    // so Escape skips the preview without also closing the dialog under it.
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const enableSound = useCallback(() => {
    audioContext()?.resume?.().catch(() => {});
    document.querySelectorAll('.cinematic-stage audio').forEach(a => { a.play().catch(() => {}); });
    sfx.unlock();
    setSoundBlocked(false);
  }, [sfx]);

  if (!cue) return null;
  return createPortal(
    <div className="cinematic-stage" onClick={soundBlocked ? enableSound : undefined}>
      {ready && cue.kind === 'boss' && <BossIntro intro={cue.data} onDone={onClose} sfx={sfx} />}
      {ready && cue.kind === 'recap' && <RecapReel recap={cue.data} onDone={onClose} onSoundBlocked={setSoundBlocked} sfx={sfx} />}

      {soundBlocked && (
        <button type="button" className="cs-sound" onClick={enableSound}>
          <Volume2 size={18} /> Click for sound
        </button>
      )}
      <button type="button" className="cs-close" onClick={(e) => { e.stopPropagation(); onClose?.(); }} aria-label="Skip">
        <X size={20} />
      </button>
    </div>,
    document.body
  );
}
