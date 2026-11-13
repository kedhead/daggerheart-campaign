import { useEffect, useMemo, useRef, useState } from 'react';
import { cartoonPlan, recapArtFills, recapMusicFactor, recapCueVolume, RECAP_INTRO_VOICE_AT } from './cinematicPlan';
import { playWhoosh, playRiser, playSlam } from './cinematicSfx';
import useReelMusic from './useReelMusic';
import './RecapReel.css';

// How long the title card will wait for "Previously on…" to finish.
const MAX_TITLE_HOLD = 6;

/**
 * "Previously on…" as an animated cartoon: a title card, then the recap's
 * storyboard played shot after shot. The narrator is recorded one beat at a
 * time, so each beat lasts exactly as long as his words and the picture
 * changes when he moves on; a character's spoken line plays over a close-up
 * of them. Then the cliffhanger question and tonight's card, as in the other
 * looks. The timeline comes from cartoonPlan().
 *
 * @param {object} props
 * @param {object} props.recap - a recap with `cartoon: { shots, voice }` (see cinematicPlan.js)
 * @param {() => void} [props.onDone]
 * @param {(blocked: boolean) => void} [props.onSoundBlocked] - the browser refused to play sound until a click
 * @param {object} [props.sfx] - a createSoundPlayer() player; without one the reel uses synthesised hits
 */
export default function CartoonReel({ recap, onDone, onSoundBlocked, sfx }) {
  const plan = useMemo(() => cartoonPlan(recap), [recap]);
  const question = recap?.question || '';
  const introUrl = recap?.cartoon?.voice?.introUrl || '';
  const [t, setT] = useState(0);
  const [ratios, setRatios] = useState({}); // picture url → width / height, once loaded
  // Callbacks by ref, so a parent re-render never restarts the reel.
  const doneRef = useRef(onDone);
  const blockedRef = useRef(onSoundBlocked);
  doneRef.current = onDone;
  blockedRef.current = onSoundBlocked;

  // One clock for the whole reel, and every voice started on it. The voices
  // are Audio objects, not elements on the page, so the stage's "click for
  // sound" cannot set them all talking at once.
  useEffect(() => {
    const make = (url) => { const a = new Audio(); a.preload = 'auto'; a.src = url; return a; };
    const intro = introUrl ? make(introUrl) : null;
    const voices = plan.voices.map(v => ({ ...v, audio: make(v.url), started: false }));
    const say = (audio) => audio.play().catch(err => { if (err?.name === 'NotAllowedError') blockedRef.current?.(true); });
    const start = performance.now();
    let raf = 0;
    let held = 0; // time the title card waited for "Previously on…" to finish
    let lastWall = 0;
    let introStarted = false;
    const tick = () => {
      const rawWall = (performance.now() - start) / 1000;
      // A long campaign name makes "Previously on… <name>" outlast the title card. Wait for it.
      if (intro && introStarted && !intro.paused && !intro.ended
        && rawWall - held >= plan.titleEnd - 0.7 && held < MAX_TITLE_HOLD) held += rawWall - lastWall;
      lastWall = rawWall;
      const now = rawWall - held;
      if (intro && !introStarted && now >= RECAP_INTRO_VOICE_AT) { introStarted = true; say(intro); }
      voices.forEach(v => { if (!v.started && now >= v.start) { v.started = true; say(v.audio); } });
      setT(now);
      if (now >= plan.total) { doneRef.current?.(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      [intro, ...voices.map(v => v.audio)].forEach(a => { try { a?.pause(); } catch { /* gone */ } });
    };
  }, [plan, introUrl]);

  const at = plan.shots.findIndex(s => t >= s.start && t < s.start + s.duration);
  const shot = plan.shots[at] || null;
  const caption = plan.captions.find(c => t >= c.start && t < c.start + c.duration) || null;
  const cliff = plan.cliff;
  const inCliff = !!cliff && t >= cliff.start && t < plan.endStart;
  const showQuestion = inCliff && t >= cliff.questionAt;
  const onEnd = t >= plan.endStart;

  // The shot before stays under the new one while it dissolves in.
  const [layers, setLayers] = useState({ current: -1, previous: -1 });
  useEffect(() => {
    setLayers(l => (at === l.current ? l : { current: at, previous: l.current }));
  }, [at]);

  // Sound effects: a boom under the title, a soft whoosh as each beat
  // begins (quiet, because the narrator is talking), the slam the question
  // lands on, then a riser into tonight's card.
  const cued = useRef({ open: false, beat: -1, question: false, riser: false, slam: false });
  const effects = Math.max(0, Math.min(1, recap?.sfxLevel ?? 1));
  const voiced = plan.voices.length > 0;
  const beat = caption ? caption.beat : -1;
  useEffect(() => {
    const play = (cue, moment, under = false) => {
      const volume = recapCueVolume(moment, under) * effects;
      if (volume <= 0) return;
      if (sfx) { sfx.play(cue, volume); return; }
      if (cue === 'whoosh') playWhoosh(0.5 * volume, 0.5);
      else if (cue === 'riser') playRiser(0.37 * volume, 1.6);
      else playSlam(0.85 * volume);
    };
    const c = cued.current;
    if (!c.open && t >= 0.15) { c.open = true; play('impact', 'open'); }
    if (beat !== c.beat && beat >= 0) play(beat === 0 ? 'slam' : 'whoosh', beat === 0 ? 'firstBeat' : 'cut', voiced);
    if (beat >= 0) c.beat = beat;
    if (!c.question && showQuestion) { c.question = true; play('slam', 'question'); }
    if (!c.riser && t >= plan.endStart - (sfx ? 2.8 : 1.6)) { c.riser = true; play('riser', 'riser', voiced); }
    if (!c.slam && onEnd) { c.slam = true; play('impact', 'end'); }
  }, [beat, t, onEnd, showQuestion, plan.endStart, sfx, effects, voiced]);

  // Music: up for the opening, under every voice after that, gone for the cliffhanger.
  const level = Math.max(0, Math.min(1, recap?.musicLevel ?? 0.6));
  const speaking = (voiced || !!introUrl) && t >= RECAP_INTRO_VOICE_AT - 0.3;
  const musicFallback = useReelMusic(recap?.musicUrl || '', inCliff || onEnd ? 0 : level * recapMusicFactor({ speaking }), blockedRef);

  const pictures = useMemo(() => [...new Set(plan.shots.map(s => s.imageUrl).filter(Boolean))], [plan]);
  const clips = useMemo(() => [...new Set(plan.shots.map(s => s.videoUrl).filter(Boolean))], [plan]);

  const renderShot = (i, entering) => {
    const s = plan.shots[i];
    if (!s) return null;
    const known = ratios[s.imageUrl];
    const screen = typeof window !== 'undefined' && window.innerHeight ? window.innerWidth / window.innerHeight : 16 / 9;
    // Art shaped unlike the screen sits whole and centred over a blurred copy of itself.
    const ratio = known && !recapArtFills(known, screen) ? known : 0;
    return (
      <div key={`shot-${i}`} className={`rr-beat ${ratio ? 'rr-fit' : 'rr-full'} ${entering ? 'is-entering' : ''}`}
        style={{ '--ratio': ratio || 1, '--beat': `${s.duration}s` }}>
        {!!ratio && <img src={s.imageUrl} alt="" className="rr-backdrop" />}
        {s.videoUrl || s.imageUrl ? (
          <div className="rr-panel">
            {s.videoUrl ? (
              // A clip is longer than its shot; nudge it along so more of the move lands before the cut.
              <video src={s.videoUrl} poster={s.imageUrl || undefined} muted playsInline autoPlay className="rr-media"
                onLoadedMetadata={(e) => {
                  const rate = e.currentTarget.duration / s.duration / 1.5;
                  if (Number.isFinite(rate)) e.currentTarget.playbackRate = Math.max(1, Math.min(1.35, rate));
                }} />
            ) : (
              <img src={s.imageUrl} alt="" className="rr-media rr-push" style={{ animationDuration: `${s.duration + 1}s` }} />
            )}
          </div>
        ) : (
          <div className="rr-panel rr-media-empty" />
        )}
      </div>
    );
  };

  return (
    <div className="recap-reel rr-film rr-cartoon">
      {musicFallback}

      {/* Load every picture and clip up front, so each cut is instant. */}
      <div className="rr-preload" aria-hidden>
        {pictures.map(url => (
          <img key={url} src={url} alt="" onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (w && h) setRatios(r => (r[url] ? r : { ...r, [url]: w / h }));
          }} />
        ))}
        {clips.map(url => <video key={url} src={url} muted playsInline preload="auto" />)}
      </div>

      {!inCliff && !onEnd && (
        <>
          {layers.previous >= 0 && layers.previous !== layers.current && renderShot(layers.previous, false)}
          {layers.current >= 0 && renderShot(layers.current, true)}
          <div className="rr-letterbox rr-letterbox-top" />
          <div className="rr-letterbox rr-letterbox-bottom" />
          <div className="rr-vignette" />
          {shot?.kind === 'line' ? (
            <div key={`say-${at}`} className="rr-say">
              <span className="rr-say-who">{shot.speaker}</span>
              <span className="rr-say-line">“{shot.line}”</span>
            </div>
          ) : caption?.line ? (
            <div key={`cap-${caption.beat}`} className="rr-sub">{caption.line}</div>
          ) : null}
        </>
      )}

      {t < plan.titleEnd && (
        <div className={`rr-title ${t > plan.titleEnd - 0.45 ? 'is-leaving' : ''}`}>
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
