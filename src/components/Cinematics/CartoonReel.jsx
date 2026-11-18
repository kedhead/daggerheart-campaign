import { useEffect, useMemo, useRef, useState } from 'react';
import { cartoonPlan, screenplayPlan, recapArtFills, recapMusicFactor, recapCueVolume, RECAP_INTRO_VOICE_AT } from './cinematicPlan';
import { playWhoosh, playRiser, playSlam } from './cinematicSfx';
import useReelMusic from './useReelMusic';
import useReelMedia from './useReelMedia';
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
  // A cinematic written as a screenplay has its own timeline; everything else plays the same.
  const plan = useMemo(() => (recap?.screenplay ? screenplayPlan(recap) : cartoonPlan(recap)), [recap]);
  const question = recap?.question || '';
  const introUrl = recap?.cartoon?.voice?.introUrl || '';
  const [t, setT] = useState(0);
  const [ratios, setRatios] = useState({}); // picture url → width / height, once loaded
  // Every clip, picture and voice is downloaded before the reel starts and
  // played from memory, so a slow connection cannot stall it between shots.
  const mediaUrls = useMemo(
    () => [...plan.shots.flatMap(s => [s.videoUrl, s.imageUrl]), ...plan.voices.map(v => v.url), introUrl].filter(Boolean),
    [plan, introUrl]
  );
  const media = useReelMedia(mediaUrls);
  const { ready, local } = media;
  const videoEls = useRef({}); // shot index → its <video>, while it is on the page
  // Callbacks by ref, so a parent re-render never restarts the reel.
  const doneRef = useRef(onDone);
  const blockedRef = useRef(onSoundBlocked);
  doneRef.current = onDone;
  blockedRef.current = onSoundBlocked;

  // One clock for the whole reel, and every voice started on it. The voices
  // are Audio objects, not elements on the page, so the stage's "click for
  // sound" cannot set them all talking at once.
  useEffect(() => {
    if (!ready) return undefined;
    const make = (url) => { const a = new Audio(); a.preload = 'auto'; a.src = local(url); return a; };
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
    // `local` reads from a ref that is complete once `ready` is true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, introUrl, ready]);

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
  // The shot after is already on the page, hidden and loaded, so the cut to
  // it has nothing to wait for. Before the first shot, that is shot 0.
  const upNext = at >= 0 ? (at + 1 < plan.shots.length ? at + 1 : -1) : (ready && t < plan.titleEnd + 1 && plan.shots.length ? 0 : -1);
  // A shot's clip starts from the top the moment the shot does.
  useEffect(() => {
    const video = videoEls.current[at];
    if (!video) return;
    try { video.currentTime = 0; } catch { /* not loaded far enough to seek; it is at the start anyway */ }
    video.play().catch(() => {});
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

  // `role` is 'current', 'previous' (still showing underneath) or 'next' (hidden, getting ready).
  const renderShot = (i, role) => {
    const s = plan.shots[i];
    if (!s) return null;
    const entering = role === 'current';
    const known = ratios[s.imageUrl];
    const screen = typeof window !== 'undefined' && window.innerHeight ? window.innerWidth / window.innerHeight : 16 / 9;
    // Art shaped unlike the screen sits whole and centred over a blurred copy of itself.
    const ratio = known && !recapArtFills(known, screen) ? known : 0;
    return (
      <div key={`shot-${i}`} className={`rr-beat ${ratio ? 'rr-fit' : 'rr-full'} ${entering ? 'is-entering' : ''} ${role === 'next' ? 'rr-upnext' : ''} ${s.transition ? `rr-tr-${s.transition}` : ''}`}
        style={{ '--ratio': ratio || 1, '--beat': `${s.duration}s`, zIndex: role === 'current' ? 2 : role === 'previous' ? 1 : 0 }}>
        {!!ratio && <img src={local(s.imageUrl)} alt="" className="rr-backdrop" />}
        {s.videoUrl || s.imageUrl ? (
          <div className="rr-panel">
            {s.videoUrl ? (
              // A clip is longer than its shot; nudge it along so more of the move lands before the cut.
              // Played from the effect above, not autoplay: it waits, loaded, until its shot begins.
              <video src={local(s.videoUrl)} poster={s.imageUrl ? local(s.imageUrl) : undefined} muted playsInline preload="auto" className="rr-media"
                ref={(el) => { if (el) videoEls.current[i] = el; else delete videoEls.current[i]; }}
                onLoadedMetadata={(e) => {
                  // A shot the next one carries on from plays its clip right to the last
                  // frame by the cut, since that frame is where the next shot begins.
                  const rate = s.endsOnClip ? e.currentTarget.duration / s.duration : e.currentTarget.duration / s.duration / 1.5;
                  if (Number.isFinite(rate)) e.currentTarget.playbackRate = s.endsOnClip ? Math.max(0.75, Math.min(2, rate)) : Math.max(1, Math.min(1.35, rate));
                }} />
            ) : (
              <img src={local(s.imageUrl)} alt="" className={`rr-media ${entering || role === 'previous' ? 'rr-push' : ''}`} style={{ animationDuration: `${s.duration + 1}s` }} />
            )}
          </div>
        ) : (
          <div className="rr-panel rr-media-empty" />
        )}
        {entering && s.transition === 'fade' && <div className="rr-fade-black" />}
      </div>
    );
  };

  return (
    <div className="recap-reel rr-film rr-cartoon">
      {musicFallback}

      {/* Each picture's shape, read once it has arrived. */}
      {ready && (
        <div className="rr-preload" aria-hidden>
          {pictures.map(url => (
            <img key={url} src={local(url)} alt="" onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              if (w && h) setRatios(r => (r[url] ? r : { ...r, [url]: w / h }));
            }} />
          ))}
        </div>
      )}

      {!inCliff && !onEnd && (
        <>
          {/* In shot order, not by role: a clip that changed places on the page would stop playing. */}
          <div className="rr-shots">
            {/* `at` is the shot on screen now. `layers` catches up a moment later, so until it does its
                "current" is the shot just left. Going by `at` keeps the new shot's element, already loaded
                as the one up next, on the page through the cut. */}
            {[...new Set([layers.previous, layers.current, at, upNext])].filter(i => i >= 0).sort((a, b) => a - b)
              .map(i => renderShot(i, i === at ? 'current' : i === layers.current || i === layers.previous ? 'previous' : 'next'))}
          </div>
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
          <div className="rr-title-kicker">{recap?.kicker ?? 'Previously on'}</div>
          <div className="rr-title-name">{recap?.title}</div>
          <div className="rr-title-rule" />
          {/* Shown only while the clips are still arriving; a click starts with what is here. */}
          {!ready && (
            <button type="button" className="rr-loading" onClick={media.start} title="Start now with what has loaded">
              Getting the reel ready… {media.loaded} of {media.total}
            </button>
          )}
        </div>
      )}

      {inCliff && (
        <div className="rr-cliff">
          {showQuestion && <div className="rr-cliff-question">{question}</div>}
        </div>
      )}

      {/* A stand-alone cinematic has no end card: it fades out. */}
      {onEnd && recap?.noEnd && <div className="rr-cliff rr-fade-end" />}
      {onEnd && !recap?.noEnd && (
        <div className="rr-end">
          <div className="rr-end-kicker">Tonight</div>
          <div className="rr-end-label">{recap?.endLabel || 'The story continues'}</div>
        </div>
      )}
    </div>
  );
}
