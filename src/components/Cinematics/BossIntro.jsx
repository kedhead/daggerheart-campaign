import { useEffect, useRef } from 'react';
import { playSlam, playWhoosh } from './cinematicSfx';
import './BossIntro.css';

// The beats, in milliseconds from the start. The CSS animations use the same
// delays (see BossIntro.css), so sound and picture land together.
export const BOSS_INTRO_BEATS = { whoosh: 120, artSlam: 420, nameSlam: 900, out: 6200, done: 7000 };

/**
 * A Borderlands-style character intro: the scene freezes, the creature slams
 * in, its name stamps across the screen and a cheeky subtitle sits under it.
 *
 * @param {object} props
 * @param {{name: string, subtitle?: string, tag?: string, imageUrl?: string, videoUrl?: string, accent?: string}} props.intro
 * @param {() => void} [props.onDone]
 */
export default function BossIntro({ intro, onDone }) {
  // By ref, so a parent re-render never restarts the intro.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    const timers = [
      setTimeout(() => playWhoosh(0.4), BOSS_INTRO_BEATS.whoosh),
      setTimeout(() => playSlam(0.7), BOSS_INTRO_BEATS.artSlam),
      setTimeout(() => playSlam(0.9), BOSS_INTRO_BEATS.nameSlam),
      setTimeout(() => playWhoosh(0.3, 0.45), BOSS_INTRO_BEATS.out),
      setTimeout(() => doneRef.current?.(), BOSS_INTRO_BEATS.done)
    ];
    return () => timers.forEach(clearTimeout);
  }, [intro]);

  const accent = intro?.accent || '#ef4444';
  return (
    <div className="boss-intro" style={{ '--accent': accent }}>
      <div className="bi-shake">
        <div className="bi-flash" />
        <div className="bi-bars bi-bars-top" />
        <div className="bi-bars bi-bars-bottom" />
        <div className="bi-halftone" />
        <div className="bi-slash" />
        <div className="bi-slash bi-slash-thin" />

        <div className="bi-art">
          {intro?.videoUrl ? (
            <video src={intro.videoUrl} autoPlay muted loop playsInline />
          ) : intro?.imageUrl ? (
            <img src={intro.imageUrl} alt="" />
          ) : (
            <div className="bi-art-empty">?</div>
          )}
        </div>

        <div className="bi-card">
          {intro?.tag && <div className="bi-tag">{intro.tag}</div>}
          <div className="bi-name">{intro?.name}</div>
          {intro?.subtitle && <div className="bi-subtitle">{intro.subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
