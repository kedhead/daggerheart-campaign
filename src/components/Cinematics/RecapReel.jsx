import { useEffect, useMemo, useRef, useState } from 'react';
import { recapTimings, RECAP_END_SECONDS } from './cinematicPlan';
import { playWhoosh, playRiser, playSlam } from './cinematicSfx';
import './RecapReel.css';

// Camera moves for the slides, cycled so neighbours never move the same way.
const MOVES = ['rr-move-in-left', 'rr-move-out', 'rr-move-in-right', 'rr-move-up'];

/**
 * "Previously on…": a title card, the recap's beats over the campaign's art
 * (camera moves, captions, narration, music), then a slam card for tonight.
 *
 * @param {object} props
 * @param {{title: string, endLabel: string, slides: Array<{line: string, imageUrl?: string, videoUrl?: string}>, narration?: {url: string, duration: number}, musicUrl?: string}} props.recap
 * @param {() => void} [props.onDone]
 * @param {(blocked: boolean) => void} [props.onSoundBlocked] - the browser refused to play sound until a click
 */
export default function RecapReel({ recap, onDone, onSoundBlocked }) {
  const slides = useMemo(() => recap?.slides || [], [recap]);
  const timing = useMemo(() => recapTimings(slides, recap?.narration?.duration || 0), [slides, recap]);
  const [t, setT] = useState(0);
  const narrationRef = useRef(null);
  const musicRef = useRef(null);
  // Callbacks by ref, so a parent re-render never restarts the reel.
  const doneRef = useRef(onDone);
  const blockedRef = useRef(onSoundBlocked);
  doneRef.current = onDone;
  blockedRef.current = onSoundBlocked;

  // One clock for the whole reel. Narration, once started, is the clock: if
  // it stalls to buffer, the pictures wait for it.
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let narrationStarted = false;
    let offset = 0; // narration time vs wall time
    const tick = () => {
      const wall = (performance.now() - start) / 1000;
      const narr = narrationRef.current;
      let now = wall;
      if (narr && !narrationStarted && wall >= timing.narrationStart) {
        narrationStarted = true;
        narr.play().catch(() => blockedRef.current?.(true));
      }
      if (narr && narrationStarted && !narr.paused && !narr.ended) {
        now = timing.narrationStart + narr.currentTime;
        offset = wall - now;
      } else if (narrationStarted) {
        now = wall - offset;
      }
      setT(now);
      if (now >= timing.total) { doneRef.current?.(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const music = musicRef.current;
    if (music) {
      music.volume = 0.32;
      music.play().catch(() => blockedRef.current?.(true));
    }
    return () => cancelAnimationFrame(raf);
  }, [timing]);

  const index = timing.slides.findIndex(s => t >= s.start && t < s.start + s.duration);
  const onEnd = t >= timing.total - RECAP_END_SECONDS;

  // Sound cues on each change of picture.
  const lastIndex = useRef(-2);
  const cued = useRef({ riser: false, slam: false });
  useEffect(() => {
    if (index !== lastIndex.current && index >= 0) playWhoosh(0.25, 0.5);
    lastIndex.current = index;
    if (!cued.current.riser && t >= timing.total - RECAP_END_SECONDS - 1.6) { cued.current.riser = true; playRiser(0.22, 1.6); }
    if (!cued.current.slam && onEnd) { cued.current.slam = true; playSlam(0.85); }
  }, [index, t, onEnd, timing.total]);

  // Duck the music under the narrator and fade it out at the end.
  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;
    const speaking = recap?.narration && t >= timing.narrationStart && !onEnd;
    const fade = Math.max(0, Math.min(1, (timing.total - t) / 2));
    music.volume = (speaking ? 0.14 : 0.32) * fade;
  }, [t, onEnd, timing, recap]);

  return (
    <div className="recap-reel">
      {recap?.narration?.url && <audio ref={narrationRef} src={recap.narration.url} preload="auto" />}
      {recap?.musicUrl && <audio ref={musicRef} src={recap.musicUrl} preload="auto" loop />}

      {slides.map((s, i) => {
        const at = timing.slides[i];
        const visible = i === index || (onEnd && i === slides.length - 1);
        return (
          <div key={i} className={`rr-slide ${visible ? 'is-on' : ''}`}>
            {s.videoUrl ? (
              <video src={s.videoUrl} muted loop playsInline autoPlay className="rr-media" />
            ) : s.imageUrl ? (
              <img
                src={s.imageUrl}
                alt=""
                className={`rr-media ${MOVES[i % MOVES.length]}`}
                style={{ animationDuration: `${(at?.duration || 4) + 1.2}s`, animationPlayState: visible ? 'running' : 'paused' }}
              />
            ) : (
              <div className="rr-media rr-media-empty" />
            )}
          </div>
        );
      })}
      <div className="rr-vignette" />
      <div className="rr-letterbox rr-letterbox-top" />
      <div className="rr-letterbox rr-letterbox-bottom" />

      {index >= 0 && slides[index]?.line && !onEnd && (
        <div key={index} className="rr-caption">{slides[index].line}</div>
      )}

      {t < timing.narrationStart && (
        <div className="rr-title">
          <div className="rr-title-kicker">Previously on</div>
          <div className="rr-title-name">{recap?.title}</div>
          <div className="rr-title-rule" />
        </div>
      )}

      {onEnd && (
        <div className="rr-end">
          <div className="rr-end-kicker">Tonight</div>
          <div className="rr-end-label">{recap?.endLabel || 'The story continues'}</div>
        </div>
      )}
    </div>
  );
}
