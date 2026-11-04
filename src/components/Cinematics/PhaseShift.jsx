import { useEffect, useRef, useState } from 'react';
import { playSlam, playWhoosh } from './cinematicSfx';
import { PHASE_STILL_SECONDS, PHASE_VIDEO_MAX_SECONDS, PHASE_HOLD_SECONDS } from './cinematicPlan';
import './PhaseShift.css';

/**
 * A boss phase transition on the monitor: the boss's transformation clip
 * plays big (or its portrait shakes, when there is no clip), then the new
 * phase's name slams in over the last frame.
 *
 * @param {object} props
 * @param {{name: string, bossName?: string, tag?: string, line?: string, imageUrl?: string, videoUrl?: string, accent?: string}} props.shift
 * @param {() => void} [props.onDone]
 * @param {object} [props.sfx] - a createSoundPlayer() player
 */
export default function PhaseShift({ shift, onDone, sfx }) {
  const [stage, setStage] = useState('rising'); // rising → stamped → leaving
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const playRef = useRef(null);
  playRef.current = sfx
    ? (cue, volume) => sfx.play(cue, volume)
    : (cue) => ({ whoosh: () => playWhoosh(0.4), impact: () => playSlam(0.8), slam: () => playSlam(0.9) })[cue]?.();

  const hasVideo = !!shift?.videoUrl;

  // The opening hit, and a cut-off in case the clip never reports its end.
  useEffect(() => {
    const limit = hasVideo ? PHASE_VIDEO_MAX_SECONDS : PHASE_STILL_SECONDS;
    const timers = [
      setTimeout(() => playRef.current?.('impact', 1), 150),
      setTimeout(() => setStage(s => (s === 'rising' ? 'stamped' : s)), limit * 1000)
    ];
    return () => timers.forEach(clearTimeout);
  }, [hasVideo]);

  // The name lands, holds, and the whole thing sweeps out. Keyed on whether
  // the name has landed, not on the stage, so moving on to 'leaving' does
  // not cancel the timer that ends it.
  const stamped = stage !== 'rising';
  useEffect(() => {
    if (!stamped) return undefined;
    playRef.current?.('slam', 0.95);
    const timers = [
      setTimeout(() => { setStage('leaving'); playRef.current?.('whoosh', 0.5); }, PHASE_HOLD_SECONDS * 1000),
      setTimeout(() => doneRef.current?.(), (PHASE_HOLD_SECONDS + 0.8) * 1000)
    ];
    return () => timers.forEach(clearTimeout);
  }, [stamped]);

  const stamp = () => setStage(s => (s === 'rising' ? 'stamped' : s));

  return (
    <div className={`phase-shift ps-${stage}`} style={{ '--accent': shift?.accent || '#ef4444' }}>
      <div className="ps-flash" />
      <div className="ps-media">
        {hasVideo ? (
          <video src={shift.videoUrl} autoPlay muted playsInline onEnded={stamp} onError={stamp} />
        ) : shift?.imageUrl ? (
          <img src={shift.imageUrl} alt="" className="ps-still" />
        ) : null}
      </div>
      <div className="ps-vignette" />
      <div className="ps-bars ps-bars-top" />
      <div className="ps-bars ps-bars-bottom" />

      {stamped && (
        <div className="ps-card">
          {shift?.tag && <div className="ps-tag">{shift.tag}</div>}
          <div className="ps-name">{shift?.name}</div>
          {(shift?.bossName || shift?.line) && (
            <div className="ps-line">
              {shift?.bossName && <strong>{shift.bossName}</strong>}
              {shift?.bossName && shift?.line && ' · '}
              {shift?.line}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
