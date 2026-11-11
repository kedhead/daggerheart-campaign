import { useEffect, useMemo, useRef, useState } from 'react';
import { recapPlan, panelImages, recapArtFills, recapCardLine, recapMusicFactor, recapCueVolume, RECAP_INTRO_VOICE_AT, RECAP_QUESTION_VOICE_DELAY } from './cinematicPlan';
import { playWhoosh, playRiser, playSlam, audioContext, loadMusicBuffer } from './cinematicSfx';
import './RecapReel.css';

// Slow drifts for full-screen pictures, and the wipes that bring a beat in,
// both cycled so neighbouring beats differ.
const DRIFTS = ['rr-drift-a', 'rr-drift-b', 'rr-drift-c'];
const WIPES = ['ink', 'slash', 'shutter', 'ink-b'];
// How long the title card will wait for "Previously on…" to finish.
const MAX_TITLE_HOLD = 6;

/**
 * "Previously on…" as a comic-book cold open: a title card, then each beat
 * as a comic panel that wipes in with speed lines and a flash (wide art
 * full-screen, square or tall art whole in a tilted frame with the caption
 * beside it), the narrator's line landing word by word, then the cliffhanger (the music cuts, a beat
 * of silence, the question slams on) and the slam card for tonight.
 *
 * With `style: 'film'` the same reel plays as a movie trailer instead:
 * widescreen bars, film grain and a colour grade, dissolves between shots,
 * the line as a subtitle (a short line as a big text card), and every shot
 * again in a quick-cut montage before the cliffhanger. A `cast` list adds a
 * "Starring…" card for each player character after the title.
 *
 * @param {object} props
 * @param {{title: string, endLabel: string, question?: string, style?: 'film'|'comic',
 *   cast?: Array<{name: string, playerName?: string, imageUrl: string}>,
 *   slides: Array<{line: string, imageUrl?: string, videoUrl?: string}>,
 *   narration?: {url: string, duration: number, introUrl?: string, questionUrl?: string, questionDuration?: number},
 *   musicUrl?: string, musicLevel?: number, sfxLevel?: number}} props.recap
 * @param {() => void} [props.onDone]
 * @param {(blocked: boolean) => void} [props.onSoundBlocked] - the browser refused to play sound until a click
 * @param {object} [props.sfx] - a createSoundPlayer() player; without one the reel uses synthesised hits
 */
export default function RecapReel({ recap, onDone, onSoundBlocked, sfx }) {
  const slides = useMemo(() => recap?.slides || [], [recap]);
  const question = recap?.question || '';
  const film = recap?.style === 'film';
  const cast = useMemo(() => recap?.cast || [], [recap]);
  const timing = useMemo(() => recapPlan(recap), [recap]);
  const panels = useMemo(() => panelImages(slides), [slides]);
  const [t, setT] = useState(0);
  const [ratios, setRatios] = useState({}); // picture url → width / height, once loaded
  const narrationRef = useRef(null);
  const introRef = useRef(null);
  const questionRef = useRef(null);
  const musicRef = useRef(null);
  const musicGain = useRef(null); // the music's volume control
  const musicLevelRef = useRef(0); // what that volume should be right now
  // How the music is played: as decoded sound through a gain ('buffer'), or,
  // if that cannot be done, by an audio element ('element').
  const [musicMode, setMusicMode] = useState('loading');
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
    let held = 0; // time the title card waited for "Previously on…" to finish
    let lastWall = 0;
    const tick = () => {
      const rawWall = (performance.now() - start) / 1000;
      // A long campaign name makes "Previously on… <name>" outlast the title
      // card, and the narrator used to start talking over it. Wait for it.
      const intro = introRef.current;
      if (!narrationStarted && intro && !intro.paused && !intro.ended
        && rawWall - held >= timing.titleEnd - 0.7 && held < MAX_TITLE_HOLD) held += rawWall - lastWall;
      lastWall = rawWall;
      const wall = rawWall - held;
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
    return () => cancelAnimationFrame(raf);
  }, [timing]);

  // The music. An audio element's volume is only a request: iPhones, iPads
  // and some TV browsers ignore it and play at full blast, so the narrator
  // was drowned whatever the slider said. The track is decoded and played
  // through a Web Audio gain instead, which every device obeys.
  const musicUrl = recap?.musicUrl || '';
  useEffect(() => {
    if (!musicUrl) return undefined;
    const ctx = audioContext();
    if (!ctx) { setMusicMode('element'); return undefined; }
    // On iPhone, let this sound play with the silent switch on, as the narrator does.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* not supported */ }
    let live = true;
    let source = null;
    const began = performance.now();
    const gain = ctx.createGain();
    gain.gain.value = musicLevelRef.current;
    gain.connect(ctx.destination);
    loadMusicBuffer(ctx, musicUrl).then(buffer => {
      if (!live) return;
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      gain.gain.value = musicLevelRef.current;
      musicGain.current = gain;
      // Join the track where it would be had it started with the reel.
      source.start(0, ((performance.now() - began) / 1000) % buffer.duration);
      ctx.resume?.().catch(() => {});
      if (ctx.state === 'suspended') blockedRef.current?.(true);
      setMusicMode('buffer');
    }).catch(() => { if (live) setMusicMode('element'); });
    return () => {
      live = false;
      try { source?.stop(); } catch { /* never started */ }
      gain.disconnect();
      musicGain.current = null;
    };
  }, [musicUrl]);

  // The fallback, when the track could not be decoded: an audio element,
  // through a gain where the device ignores the element's own volume.
  useEffect(() => {
    const music = musicRef.current;
    if (musicMode !== 'element' || !music) return;
    music.volume = 0.5;
    const volumeLocked = music.volume !== 0.5;
    const ctx = audioContext();
    if (volumeLocked && ctx && !musicGain.current) {
      try {
        const gain = ctx.createGain();
        gain.gain.value = musicLevelRef.current;
        ctx.createMediaElementSource(music).connect(gain).connect(ctx.destination);
        musicGain.current = gain;
        ctx.resume?.().catch(() => {});
      } catch { /* stays on element volume */ }
    }
    music.volume = musicLevelRef.current;
    music.play().catch(() => blockedRef.current?.(true));
  }, [musicMode]);

  const index = timing.slides.findIndex(s => t >= s.start && t < s.start + s.duration);
  const cliff = timing.cliff;
  const inCliff = !!cliff && t >= cliff.start && t < timing.endStart;
  const showQuestion = inCliff && t >= cliff.questionAt;
  const onEnd = t >= timing.endStart;
  // The "Starring…" cards, between the title and the first beat.
  const castAt = timing.cast && t >= timing.cast.start && t < timing.narrationStart
    ? Math.min(timing.cast.count - 1, Math.floor((t - timing.cast.start) / timing.cast.each)) : -1;
  // The quick-cut montage, between the last beat and the cliffhanger.
  const quick = timing.montage;
  const cutAt = quick && t >= quick.start && t < quick.start + quick.duration
    ? quick.cuts.findIndex(c => t - quick.start < c.start + c.duration) : -1;
  const shots = useMemo(() => slides.filter(s => s.imageUrl).map(s => s.imageUrl), [slides]);

  // The previous beat stays under the new one while the ink wipe reveals it.
  const [beats, setBeats] = useState({ current: -1, previous: -1 });
  useEffect(() => {
    setBeats(b => (index === b.current ? b : { current: index, previous: b.current }));
  }, [index]);

  // Sound: a boom and "Previously on…" under the title card, a whoosh on
  // every cut, silence for the cliffhanger, a hit on the question, then a
  // riser into the slam of tonight's card.
  //
  // The effects are loud trailer hits several seconds long, and they used to
  // land right on top of the voice: the boom over "Previously on…", a whoosh
  // on every cut under the narrator, the slam over the spoken question. Now
  // each voice line waits for its hit, and effects under a voice play quiet.
  const cued = useRef({ open: false, intro: false, question: false, questionVoice: false, riser: false, slam: false, last: -2, cast: -1, cut: -1 });
  const effects = Math.max(0, Math.min(1, recap?.sfxLevel ?? 1));
  const narrated = !!recap?.narration?.url;
  const questionVoiced = !!recap?.narration?.questionUrl;
  useEffect(() => {
    const play = (cue, moment, voiced = false) => {
      const volume = recapCueVolume(moment, voiced) * effects;
      if (volume <= 0) return;
      if (sfx) { sfx.play(cue, volume); return; }
      if (cue === 'whoosh') playWhoosh(0.5 * volume, 0.5);
      else if (cue === 'riser') playRiser(0.37 * volume, 1.6);
      else playSlam(0.85 * volume);
    };
    const c = cued.current;
    if (!c.open && t >= 0.15) { c.open = true; play('impact', 'open'); }
    if (!c.intro && t >= RECAP_INTRO_VOICE_AT && introRef.current) { c.intro = true; introRef.current.play().catch(() => {}); }
    if (index !== c.last && index >= 0) play(index === 0 ? 'slam' : 'whoosh', index === 0 ? 'firstBeat' : 'cut', narrated);
    c.last = index;
    if (castAt !== c.cast && castAt >= 0) play('whoosh', 'cast');
    c.cast = castAt;
    if (cutAt !== c.cut && cutAt >= 0) play(cutAt === 0 ? 'impact' : 'whoosh', cutAt === 0 ? 'montageStart' : 'montageCut');
    c.cut = cutAt;
    if (!c.question && showQuestion) { c.question = true; play('slam', 'question'); }
    if (!c.questionVoice && showQuestion && t >= cliff.questionAt + RECAP_QUESTION_VOICE_DELAY) {
      c.questionVoice = true;
      questionRef.current?.play().catch(() => {});
    }
    if (!c.riser && t >= timing.endStart - (sfx ? 2.8 : 1.6)) { c.riser = true; play('riser', 'riser', questionVoiced); }
    if (!c.slam && onEnd) { c.slam = true; play('impact', 'end'); }
  }, [index, castAt, cutAt, t, onEnd, showQuestion, cliff, timing.endStart, sfx, effects, narrated, questionVoiced]);

  // Music: well under the narrator, up a little over the title card, cut dead
  // for the cliffhanger. Music tracks are mastered far louder than speech, so
  // under the voice it drops to about a fifth of its title-card level.
  const level = Math.max(0, Math.min(1, recap?.musicLevel ?? 0.6));
  const speaking = !!recap?.narration && t >= timing.narrationStart && cutAt < 0;
  // "Previously on…" is a voice line too: the music opens the reel, then
  // drops under it for the rest of the title card.
  const introSpeaking = !!recap?.narration?.introUrl && t >= RECAP_INTRO_VOICE_AT - 0.3 && t < timing.titleEnd;
  // The montage has no narrator over it, so the music swells for it.
  const target = inCliff || onEnd ? 0 : level * recapMusicFactor({ speaking: speaking || introSpeaking, montage: cutAt >= 0 });
  musicLevelRef.current = target;
  useEffect(() => {
    const gain = musicGain.current;
    if (gain) gain.gain.setTargetAtTime(target, gain.context.currentTime, 0.12);
    else if (musicRef.current) musicRef.current.volume = target;
  }, [target, musicMode]);

  // Wide art fills the screen; square or tall art is shown whole in a frame.
  const framedAt = (i) => {
    const ratio = ratios[panels[i]?.[0]];
    const screen = typeof window !== 'undefined' && window.innerHeight ? window.innerWidth / window.innerHeight : 16 / 9;
    return ratio && !recapArtFills(ratio, screen) ? ratio : 0;
  };

  const renderBeat = (i, entering) => {
    const s = slides[i];
    if (!s) return null;
    const url = panels[i][0];
    const seconds = timing.slides[i]?.duration || 4;
    const ratio = framedAt(i);
    // Film: art that would be cropped sits whole and centred, its edges
    // melting into the blurred copy behind it; no frame, no tilt.
    const look = !ratio ? 'rr-full' : film ? 'rr-fit' : `rr-framed rr-side-${i % 2 ? 'right' : 'left'}`;
    const dim = film && recapCardLine(s.line) ? 'rr-dim' : '';
    return (
      <div key={`beat-${i}`} className={`rr-beat ${look} ${dim} rr-wipe-${film ? 'dissolve' : WIPES[i % WIPES.length]} ${entering ? 'is-entering' : ''}`}
        style={{ '--ratio': ratio || 1, '--beat': `${seconds}s` }}>
        {!!ratio && <img src={url} alt="" className="rr-backdrop" />}
        {url || s.videoUrl ? (
          <div className="rr-panel">
            {s.videoUrl ? (
              // A clip longer than its beat is sped up to fit, so the action
              // lands before the cut instead of being chopped off mid-move.
              <video src={s.videoUrl} muted loop playsInline autoPlay className="rr-media"
                onLoadedMetadata={(e) => {
                  const rate = e.currentTarget.duration / seconds;
                  if (Number.isFinite(rate)) e.currentTarget.playbackRate = Math.max(1, Math.min(1.75, rate));
                }} />
            ) : (
              <img src={url} alt="" className={`rr-media ${ratio ? 'rr-push' : DRIFTS[i % DRIFTS.length]}`} style={{ animationDuration: `${seconds + 2}s` }} />
            )}
          </div>
        ) : (
          <div className="rr-panel rr-media-empty" />
        )}
        {!film && <div className="rr-halftone" />}
        {!film && entering && <div className="rr-speed" />}
        {!film && entering && <div className="rr-cut-flash" />}
        {/* The last beat sinks to black, into the cliffhanger's silence (a montage cuts in hard instead). */}
        {entering && i === slides.length - 1 && !quick && <div className="rr-fade-out" style={{ animationDelay: `${Math.max(0, seconds - 0.9)}s` }} />}
      </div>
    );
  };

  const renderCaption = (i) => {
    const words = String(slides[i]?.line || '').split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    const seconds = timing.slides[i]?.duration || 4;
    if (film) {
      // A short punch of a line is a trailer text card; the rest are subtitles.
      const card = recapCardLine(slides[i].line);
      return <div key={`cap-${i}`} className={card ? 'rr-card' : 'rr-sub'} style={{ '--beat': `${seconds}s` }}>{slides[i].line}</div>;
    }
    const ratio = framedAt(i);
    // Words land roughly as the narrator says them, done well before the cut.
    const step = Math.max(0.05, Math.min(0.3, (seconds * 0.7 - 0.3) / words.length));
    const place = ratio ? `rr-cap-beside rr-cap-${i % 2 ? 'left' : 'right'}` : 'rr-cap-under';
    return (
      <div key={`cap-${i}`} className={`rr-caption ${place}`} style={{ '--ratio': ratio || 1 }}>
        {words.map((w, k) => (
          <span key={k} className="rr-word" style={{ animationDelay: `${0.3 + k * step}s` }}>{w}</span>
        ))}
      </div>
    );
  };

  return (
    <div className={`recap-reel ${film ? 'rr-film' : ''}`}>
      {recap?.narration?.url && <audio ref={narrationRef} src={recap.narration.url} preload="auto" />}
      {recap?.narration?.introUrl && <audio ref={introRef} src={recap.narration.introUrl} preload="auto" />}
      {recap?.narration?.questionUrl && <audio ref={questionRef} src={recap.narration.questionUrl} preload="auto" />}
      {musicUrl && musicMode === 'element' && <audio ref={musicRef} src={musicUrl} preload="auto" loop crossOrigin="anonymous" />}

      {/* Load every picture up front, so no panel slams in half-loaded. */}
      <div className="rr-preload" aria-hidden>
        {[...new Set(panels.flat())].map(url => (
          <img key={url} src={url} alt="" onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (w && h) setRatios(r => (r[url] ? r : { ...r, [url]: w / h }));
          }} />
        ))}
        {cast.map(c => <img key={`cast-${c.imageUrl}`} src={c.imageUrl} alt="" />)}
      </div>

      {!inCliff && !onEnd && cutAt < 0 && (
        <>
          {beats.previous >= 0 && beats.previous !== beats.current && renderBeat(beats.previous, false)}
          {beats.current >= 0 && renderBeat(beats.current, true)}
          <div className="rr-letterbox rr-letterbox-top" />
          <div className="rr-letterbox rr-letterbox-bottom" />
          <div className="rr-vignette" />
          {index >= 0 && renderCaption(index)}
        </>
      )}

      {castAt >= 0 && cast[castAt] && (
        <div key={`cast-${castAt}`} className={`rr-cast ${castAt % 2 ? 'rr-cast-flip' : ''}`} style={{ '--beat': `${timing.cast.each}s` }}>
          <img src={cast[castAt].imageUrl} alt="" className="rr-cast-portrait" />
          <div className="rr-cast-text">
            <div className="rr-cast-kicker">{castAt === 0 ? 'Starring' : 'And'}</div>
            <div className="rr-cast-name">{cast[castAt].name}</div>
            {cast[castAt].playerName && <div className="rr-cast-player">played by {cast[castAt].playerName}</div>}
          </div>
        </div>
      )}

      {cutAt >= 0 && (
        <div className="rr-montage">
          <img key={`cut-${cutAt}`} src={shots[quick.cuts[cutAt].shot]} alt="" className="rr-mcut" style={{ animationDuration: `${quick.cuts[cutAt].duration}s` }} />
          <div className="rr-letterbox rr-letterbox-top" />
          <div className="rr-letterbox rr-letterbox-bottom" />
        </div>
      )}

      {t < timing.titleEnd && (
        <div className={`rr-title ${t > timing.titleEnd - 0.45 ? 'is-leaving' : ''}`}>
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

      {film && <div className="rr-grade" />}
      {film && <div className="rr-grain" />}
    </div>
  );
}
