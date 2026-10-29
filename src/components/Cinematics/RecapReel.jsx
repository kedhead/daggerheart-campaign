import { useEffect, useMemo, useRef, useState } from 'react';
import { recapTimings, montageLayout, panelImages } from './cinematicPlan';
import { playWhoosh, playRiser, playSlam } from './cinematicSfx';
import './RecapReel.css';

// Slow drifts for the pictures inside a panel, cycled so neighbours differ.
const DRIFTS = ['rr-drift-a', 'rr-drift-b', 'rr-drift-c'];

/**
 * "Previously on…" as a comic-book cold open: a title card, then each beat
 * as a montage of comic panels that slam in with ink-splash cuts, a caption
 * box with the narrator's line, then the cliffhanger (the music cuts, a beat
 * of silence, the question slams on) and the slam card for tonight.
 *
 * @param {object} props
 * @param {{title: string, endLabel: string, question?: string, extras?: string[],
 *   slides: Array<{line: string, imageUrl?: string, videoUrl?: string}>,
 *   narration?: {url: string, duration: number, introUrl?: string, questionUrl?: string, questionDuration?: number},
 *   musicUrl?: string}} props.recap
 * @param {() => void} [props.onDone]
 * @param {(blocked: boolean) => void} [props.onSoundBlocked] - the browser refused to play sound until a click
 * @param {object} [props.sfx] - a createSoundPlayer() player; without one the reel uses synthesised hits
 */
export default function RecapReel({ recap, onDone, onSoundBlocked, sfx }) {
  const slides = useMemo(() => recap?.slides || [], [recap]);
  const question = recap?.question || '';
  const timing = useMemo(
    () => recapTimings(slides, recap?.narration?.duration || 0, { question, questionSeconds: recap?.narration?.questionDuration || 0 }),
    [slides, recap, question]
  );
  const panels = useMemo(() => panelImages(slides, recap?.extras || []), [slides, recap]);
  const [t, setT] = useState(0);
  const narrationRef = useRef(null);
  const introRef = useRef(null);
  const questionRef = useRef(null);
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
  const cliff = timing.cliff;
  const inCliff = !!cliff && t >= cliff.start && t < timing.endStart;
  const showQuestion = inCliff && t >= cliff.questionAt;
  const onEnd = t >= timing.endStart;

  // The previous beat stays under the new one while the ink wipe reveals it.
  const [beats, setBeats] = useState({ current: -1, previous: -1 });
  useEffect(() => {
    setBeats(b => (index === b.current ? b : { current: index, previous: b.current }));
  }, [index]);

  // Sound: a boom and "Previously on…" under the title card, a whoosh on
  // every cut, silence for the cliffhanger, a hit on the question, then a
  // riser into the slam of tonight's card.
  const cued = useRef({ open: false, intro: false, question: false, riser: false, slam: false, last: -2 });
  useEffect(() => {
    const play = (cue, volume) => {
      if (sfx) { sfx.play(cue, volume); return; }
      if (cue === 'whoosh') playWhoosh(0.25, 0.5);
      else if (cue === 'riser') playRiser(0.22, 1.6);
      else playSlam(0.85);
    };
    const c = cued.current;
    if (!c.open && t >= 0.15) { c.open = true; play('impact', 0.8); }
    if (!c.intro && t >= 0.6 && introRef.current) { c.intro = true; introRef.current.play().catch(() => {}); }
    if (index !== c.last && index >= 0) play(index === 0 ? 'slam' : 'whoosh', index === 0 ? 0.6 : 0.5);
    c.last = index;
    if (!c.question && showQuestion) {
      c.question = true;
      play('slam', 1);
      questionRef.current?.play().catch(() => {});
    }
    if (!c.riser && t >= timing.endStart - (sfx ? 2.8 : 1.6)) { c.riser = true; play('riser', 0.6); }
    if (!c.slam && onEnd) { c.slam = true; play('impact', 1); }
  }, [index, t, onEnd, showQuestion, timing.endStart, sfx]);

  // Music: ducked under the narrator, cut dead for the cliffhanger.
  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;
    if (inCliff || onEnd) { music.volume = 0; return; }
    const speaking = recap?.narration && t >= timing.narrationStart;
    music.volume = speaking ? 0.16 : 0.34;
  }, [t, inCliff, onEnd, timing, recap]);

  const renderBeat = (i, entering) => {
    const s = slides[i];
    if (!s) return null;
    const layout = montageLayout(i, slides.length, s.line);
    const at = timing.slides[i];
    // Split panels slam in one after another across the first part of the beat.
    const stagger = Math.min(0.9, (at?.duration || 4) / 4);
    return (
      <div key={`beat-${i}`} className={`rr-beat rr-${layout} ${entering ? 'is-entering' : ''}`}>
        {panels[i].map((url, k) => (
          <div key={k} className={`rr-panel rr-panel-${k}`} style={{ animationDelay: entering ? `${k * stagger}s` : '0s' }}>
            {k === 0 && s.videoUrl ? (
              <video src={s.videoUrl} muted loop playsInline autoPlay className="rr-media" />
            ) : (
              <img src={url} alt="" className={`rr-media ${DRIFTS[(i + k) % DRIFTS.length]}`} style={{ animationDuration: `${(at?.duration || 4) + 2}s` }} />
            )}
          </div>
        ))}
        {panels[i].length === 0 && <div className="rr-panel rr-panel-0 rr-media-empty" />}
        <div className="rr-halftone" />
        {entering && <div className="rr-cut-flash" />}
      </div>
    );
  };

  return (
    <div className="recap-reel">
      {recap?.narration?.url && <audio ref={narrationRef} src={recap.narration.url} preload="auto" />}
      {recap?.narration?.introUrl && <audio ref={introRef} src={recap.narration.introUrl} preload="auto" />}
      {recap?.narration?.questionUrl && <audio ref={questionRef} src={recap.narration.questionUrl} preload="auto" />}
      {recap?.musicUrl && <audio ref={musicRef} src={recap.musicUrl} preload="auto" loop />}

      {/* Load every picture up front, so no panel slams in half-loaded. */}
      <div className="rr-preload" aria-hidden>
        {[...new Set(panels.flat())].map(url => <img key={url} src={url} alt="" />)}
      </div>

      {!inCliff && !onEnd && (
        <>
          {beats.previous >= 0 && beats.previous !== beats.current && renderBeat(beats.previous, false)}
          {beats.current >= 0 && renderBeat(beats.current, true)}
          <div className="rr-letterbox rr-letterbox-top" />
          <div className="rr-letterbox rr-letterbox-bottom" />
          {index >= 0 && slides[index]?.line && (
            <div key={`cap-${index}`} className="rr-caption">{slides[index].line}</div>
          )}
        </>
      )}

      {t < timing.narrationStart && (
        <div className="rr-title">
          <div className="rr-title-kicker">Previously on</div>
          <div className="rr-title-name">{recap?.title}</div>
          <div className="rr-title-rule" />
        </div>
      )}

      {inCliff && (
        <div className="rr-cliff">
          {showQuestion && <div className="rr-cliff-question">{question}</div>}
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
