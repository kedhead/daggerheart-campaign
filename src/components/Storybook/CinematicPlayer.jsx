import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, SkipBack, SkipForward, Music, Volume2, VolumeX, Sparkles, Download, Loader2, Wand2, Film, Clapperboard } from 'lucide-react';
import { buildTimeline, timelineDuration } from './cinematicTimeline';
import { createFX } from './cinematicFX';
import { getTrackUrl } from '../../data/musicLibrary';
import { persistAudio, persistVideo } from '../../services/audioStorage';
import { exportCinematicWebM } from './cinematicExporter';
import './CinematicPlayer.css';

// A calm, atmospheric default score for recaps (exists in the curated library).
const DEFAULT_MUSIC = 'CampfireMemories';

// Curated narrator presets. `id` is an ElevenLabs premade voice; `style` steers
// the OpenAI fallback (gpt-4o-mini-tts instructions) toward the same delivery.
const NARRATOR_VOICES = [
  {
    key: 'wizard', label: '🧙 Wizened Wizard', id: 'N2lVS1w4EtoT3dr4eOWO', // Callum — raspy, weathered
    style: 'Speak as a wise, ancient wizard telling an epic tale by firelight: unhurried, warm and gravelly, with gentle dramatic pauses and quiet wonder.',
  },
  {
    key: 'elder', label: '📖 Old Storyteller', id: 'pqHfZKP75CvOlQylNhV4', // Bill — aged, warm
    style: 'Speak as a kindly old storyteller by the hearth: slow, warm, weathered voice with fond amusement.',
  },
  {
    key: 'herald', label: '📯 Deep Herald', id: 'onwK4e9ZLuTAKqWW03F9', // Daniel — deep British
    style: 'Speak as a solemn royal herald: deep, formal, resonant delivery with gravity and precision.',
  },
  {
    key: 'bard', label: '🎻 Warm Bard', id: 'JBFqnCBsd6RMkjVDRZzb', // George — warm narrator
    style: 'Speak as a warm travelling bard: rich, engaging storytelling voice with easy charm.',
  },
];
const DEFAULT_VOICE_KEY = 'wizard';

export default function CinematicPlayer({ chapter, campaignId, isDM, updateChapter, narrationClientKey = '', onClose }) {
  const timeline = useMemo(() => buildTimeline(chapter, chapter?.narration), [chapter]);
  const total = useMemo(() => timelineDuration(timeline), [timeline]);
  const trackUrl = useMemo(() => getTrackUrl(DEFAULT_MUSIC), []);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [narrationOn, setNarrationOn] = useState(true);
  const [fxOn, setFxOn] = useState(true);
  const [voiceKey, setVoiceKey] = useState(
    () => (NARRATOR_VOICES.some(v => v.key === chapter?.narrationVoice) && chapter.narrationVoice) || DEFAULT_VOICE_KEY
  );
  const [generating, setGenerating] = useState(null); // {done,total} while generating narration
  const [exporting, setExporting] = useState(null);    // {done,total} while exporting
  const [animating, setAnimating] = useState(null);    // {label} while a scene clip generates
  const [showTools, setShowTools] = useState(false);   // DM studio drawer
  const [error, setError] = useState(null);
  const busy = !!(animating || generating || exporting);

  const musicRef = useRef(null);
  const narrationRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const slide = timeline[index];
  const hasNarration = timeline.some(s => s.narrationUrl);

  // Advance / schedule each slide. Narration (when present & enabled) drives the
  // duration via its `ended` event; otherwise a timer of slide.duration seconds.
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!playing || !slide) return;

    const narrationUrl = narrationOn ? slide.narrationUrl : null;
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      if (index + 1 < timeline.length) setIndex(i => i + 1);
      else setPlaying(false);
    };

    if (narrationUrl && narrationRef.current) {
      const a = narrationRef.current;
      a.src = narrationUrl;
      a.currentTime = 0;
      a.play().catch(() => {});
      a.onended = advance;
      timerRef.current = setTimeout(advance, (slide.duration + 3) * 1000); // stall safety
    } else {
      timerRef.current = setTimeout(advance, slide.duration * 1000);
    }

    return () => {
      clearTimeout(timerRef.current);
      if (narrationRef.current) narrationRef.current.onended = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing, narrationOn, timeline]);

  // Music: play/pause with the player, duck while narration is audible.
  useEffect(() => {
    const m = musicRef.current;
    if (!m) return;
    if (playing && musicOn) {
      m.volume = (narrationOn && hasNarration) ? 0.12 : 0.28;
      m.play().catch(() => {});
    } else {
      m.pause();
    }
  }, [playing, musicOn, narrationOn, hasNarration]);

  // Animated slides: keep the clip's playback in step with the player.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing, index]);

  useEffect(() => () => { clearTimeout(timerRef.current); }, []);

  const restart = useCallback(() => { setIndex(0); setPlaying(true); }, []);
  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(timeline.length - 1, i + 1)), [timeline.length]);

  // ── DM: generate narration for every text-bearing slide, cache on the chapter ──
  const generateNarration = useCallback(async () => {
    if (!isDM || !updateChapter) return;
    setError(null);
    const voice = NARRATOR_VOICES.find(v => v.key === voiceKey) || NARRATOR_VOICES[0];
    const jobs = timeline
      .map((s, i) => ({ i, text: s.text }))
      .filter(s => s.text && s.text.trim().length > 1);
    setGenerating({ done: 0, total: jobs.length });
    const narration = [];
    try {
      for (const job of jobs) {
        const resp = await fetch('/api/generate-narration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: job.text,
            voiceId: voice.id,
            style: voice.style,
            apiKey: narrationClientKey || '__shared__'
          })
        });
        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}));
          throw new Error(e.error || `Narration failed (HTTP ${resp.status})`);
        }
        const { audio } = await resp.json();
        const fileName = `narration-${chapter.id}-${job.i}`;
        const url = await persistAudio(campaignId, audio, fileName);
        const duration = await probeDuration(url);
        // Mirror persistAudio's path/sanitisation so deleteChapter can clean up.
        const safeName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
        narration.push({ index: job.i, url, duration, storagePath: `campaigns/${campaignId}/audio/${safeName}.mp3` });
        setGenerating(g => ({ ...g, done: g.done + 1 }));
      }
      await updateChapter(chapter.id, { narration, narrationVoice: voice.key });
    } catch (err) {
      console.error('Narration generation failed:', err);
      setError(err.message || 'Narration generation failed.');
    } finally {
      setGenerating(null);
    }
  }, [isDM, updateChapter, timeline, campaignId, chapter, narrationClientKey, voiceKey]);

  // ── DM: animate the current scene's still into a short AI video clip ──
  // Replicate image→video (server route). The finished mp4 is copied into
  // Firebase Storage and cached on the chapter, so it generates (and costs)
  // exactly once, then plays for everyone on every replay.
  const animateScene = useCallback(async () => {
    if (!isDM || !updateChapter || !slide?.sceneKey || !slide.imageUrl) return;
    setError(null);
    setAnimating({ label: 'Starting…' });
    const post = (body) => fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    try {
      const motionPrompt = slide.text
        ? `Subtle cinematic motion, preserve the art style of the source image. ${slide.text}`.slice(0, 480)
        : undefined;
      const createResp = await post({ type: 'scene-video', imageUrl: slide.imageUrl, prompt: motionPrompt });
      const created = await createResp.json().catch(() => ({}));
      if (!createResp.ok || !created.predictionId) {
        throw new Error(created.error || `Could not start animation (HTTP ${createResp.status})`);
      }

      setAnimating({ label: 'Animating… (~1–3 min)' });
      const deadline = Date.now() + 8 * 60 * 1000;
      let videoUrl = null;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 8000));
        const st = await post({ type: 'video-status', predictionId: created.predictionId });
        const data = await st.json().catch(() => ({}));
        if (!st.ok) throw new Error(data.error || `Status check failed (HTTP ${st.status})`);
        if (data.status === 'succeeded' && data.videoUrl) { videoUrl = data.videoUrl; break; }
        if (data.status === 'failed' || data.status === 'canceled') {
          throw new Error(data.error || 'Video generation failed.');
        }
      }
      if (!videoUrl) throw new Error('Video generation timed out — try again in a minute.');

      setAnimating({ label: 'Saving clip…' });
      // Fetch the clip: replicate.delivery allows CORS; fall back to the proxy.
      let blob = null;
      try {
        const direct = await fetch(videoUrl);
        if (direct.ok) blob = await direct.blob();
      } catch { /* CORS or network — use the proxy below */ }
      if (!blob) {
        const pr = await fetch('/api/download-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: videoUrl })
        });
        if (pr.ok) {
          const { dataUrl } = await pr.json();
          blob = await (await fetch(dataUrl)).blob();
        }
      }
      if (!blob || blob.size < 1000) throw new Error('Could not download the generated clip.');

      const saved = await persistVideo(campaignId, blob, `scene-${chapter.id}-${slide.sceneKey}`);
      await updateChapter(chapter.id, {
        sceneVideos: { ...(chapter.sceneVideos || {}), [slide.sceneKey]: saved }
      });
    } catch (err) {
      console.error('Scene animation failed:', err);
      setError(err.message || 'Scene animation failed.');
    } finally {
      setAnimating(null);
    }
  }, [isDM, updateChapter, slide, campaignId, chapter]);

  // ── DM: export the recap as a WebM video file ──
  const exportVideo = useCallback(async () => {
    setError(null);
    setPlaying(false);
    setExporting({ done: 0, total: timeline.length });
    try {
      await exportCinematicWebM({
        timeline,
        musicUrl: musicOn ? trackUrl : null,
        title: chapter.title || 'recap',
        onProgress: (done) => setExporting({ done, total: timeline.length }),
      });
    } catch (err) {
      console.error('Video export failed:', err);
      setError(err.message || 'Video export needs desktop Chrome/Edge.');
    } finally {
      setExporting(null);
    }
  }, [timeline, musicOn, trackUrl, chapter]);

  if (!slide) return null;

  const elapsed = timeline.slice(0, index).reduce((s, x) => s + x.duration, 0);
  const progressPct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
  const panStyle = kenBurnsStyle(slide, playing);

  return createPortal(
    <div className="cine-overlay">
      <div className="cine-stage">
        {slide.videoUrl ? (
          <video
            key={`v-${index}`}
            ref={videoRef}
            src={slide.videoUrl}
            className="cine-img cine-video"
            autoPlay={playing}
            muted
            loop
            playsInline
            crossOrigin="anonymous"
          />
        ) : slide.imageUrl ? (
          <img key={index} src={slide.imageUrl} alt="" className="cine-img" style={panStyle} />
        ) : (
          <div className="cine-img cine-img-empty" />
        )}
        <div className="cine-vignette" />
        {fxOn && slide.fx && slide.fx !== 'none' && (
          <FXCanvas effect={slide.fx} playing={playing} />
        )}

        {slide.kind === 'title' ? (
          <div className="cine-title-card">
            <div className="cine-eyebrow">A Chronicle Recap</div>
            <h1 className="cine-title">{slide.text}</h1>
          </div>
        ) : (
          slide.text && (
            <div className={`cine-lower ${slide.kind === 'prose' ? 'cine-lower-prose' : ''}`} key={`t-${index}`}>
              {slide.text}
            </div>
          )
        )}
      </div>

      <audio ref={musicRef} src={trackUrl} loop preload="auto" crossOrigin="anonymous" />
      <audio ref={narrationRef} preload="auto" crossOrigin="anonymous" />

      <div className="cine-topbar">
        <span className="cine-chapter-label">{chapter.title}</span>
        <button className="cine-icon-btn" onClick={onClose} title="Close"><X size={20} /></button>
      </div>

      <div className="cine-dots">
        {timeline.map((_, i) => (
          <button
            key={i}
            className={`cine-dot ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="cine-controls">
        <div className="cine-progress-bar"><div className="cine-progress-fill" style={{ width: `${progressPct}%` }} /></div>
        <div className="cine-buttons">
          <button className="cine-icon-btn" onClick={prev} disabled={index === 0}><SkipBack size={20} /></button>
          <button className="cine-play-btn" onClick={() => (index === timeline.length - 1 && !playing ? restart() : setPlaying(p => !p))}>
            {playing ? <Pause size={26} /> : <Play size={26} />}
          </button>
          <button className="cine-icon-btn" onClick={next} disabled={index === timeline.length - 1}><SkipForward size={20} /></button>

          <div className="cine-spacer" />

          <button className={`cine-toggle ${musicOn ? 'on' : ''}`} onClick={() => setMusicOn(v => !v)} title="Background music">
            <Music size={16} />
          </button>
          <button className={`cine-toggle ${fxOn ? 'on' : ''}`} onClick={() => setFxOn(v => !v)} title="Ambient effects (embers, fog, rain…)">
            <Wand2 size={16} />
          </button>
          {hasNarration && (
            <button className={`cine-toggle ${narrationOn ? 'on' : ''}`} onClick={() => setNarrationOn(v => !v)} title="Voice narration">
              {narrationOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
          {isDM && (
            <button
              className={`cine-toggle ${showTools || busy ? 'on' : ''}`}
              onClick={() => setShowTools(v => !v)}
              title="Studio — animate scenes, narration, export"
              aria-label="Studio tools"
            >
              {busy ? <Loader2 size={16} className="cine-spin" /> : <Clapperboard size={16} />}
            </button>
          )}
        </div>

        {isDM && showTools && (
          <div className="cine-tools-sheet">
            <div className="cine-tools-title"><Clapperboard size={12} /> Studio</div>

            {slide.kind === 'scene' && slide.sceneKey && slide.imageUrl && !slide.videoUrl && updateChapter ? (
              <button className="cine-dm-btn cine-tools-row" onClick={animateScene} disabled={!!animating || !!exporting} title="Generate a short AI video clip from this scene's image (runs once, then saved)">
                {animating
                  ? <><Loader2 size={14} className="cine-spin" /> {animating.label}</>
                  : <><Film size={14} /> Animate this scene</>}
              </button>
            ) : slide.videoUrl ? (
              <div className="cine-tools-note"><Film size={12} /> This scene is already animated</div>
            ) : (
              <div className="cine-tools-note"><Film size={12} /> Step to a scene image to animate it</div>
            )}

            <div className="cine-tools-voice">
              <select
                className="cine-voice-select"
                value={voiceKey}
                onChange={(e) => setVoiceKey(e.target.value)}
                disabled={!!generating}
                title="Narrator voice"
                aria-label="Narrator voice"
              >
                {NARRATOR_VOICES.map(v => (
                  <option key={v.key} value={v.key}>{v.label}</option>
                ))}
              </select>
              <button className="cine-dm-btn" onClick={generateNarration} disabled={!!generating}>
                {generating
                  ? <><Loader2 size={14} className="cine-spin" /> {generating.done}/{generating.total}…</>
                  : <><Sparkles size={14} /> {hasNarration ? 'Re-narrate' : 'Narrate'}</>}
              </button>
            </div>

            <button className="cine-dm-btn cine-tools-row" onClick={exportVideo} disabled={!!exporting}>
              {exporting
                ? <><Loader2 size={14} className="cine-spin" /> Rendering {exporting.done}/{exporting.total}…</>
                : <><Download size={14} /> Export video (.webm)</>}
            </button>
            {exporting && <span className="cine-hint">Keep this tab in front while it records.</span>}
          </div>
        )}

        {error && <div className="cine-error">{error}</div>}
      </div>
    </div>,
    document.body
  );
}

// Ambient particle overlay (embers / rain / snow / sparkles / fog / dust).
// Runs its own rAF loop; freezes (but stays visible) while paused. The engine
// lives in cinematicFX.js and is shared with the WebM exporter.
function FXCanvas({ effect, playing }) {
  const canvasRef = useRef(null);
  const playingRef = useRef(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const w = (canvas.width = parent?.clientWidth || window.innerWidth);
    const h = (canvas.height = parent?.clientHeight || window.innerHeight);
    const ctx = canvas.getContext('2d');
    const fx = createFX(effect, w, h);

    let raf;
    let last = performance.now();
    let alive = true;
    const frame = (now) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playingRef.current) fx.update(dt);
      ctx.clearRect(0, 0, w, h);
      fx.draw(ctx);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [effect]);

  return <canvas ref={canvasRef} className="cine-fx-canvas" aria-hidden="true" />;
}

// Ken Burns: start at the "from" transform, animate to "to" over slide.duration.
// Re-keyed per slide (key={index}) so the transition restarts each slide.
function kenBurnsStyle(slide, playing) {
  const p = slide.pan || { fromScale: 1.05, toScale: 1.12, fromX: 0, fromY: 0, toX: 0, toY: 0 };
  return {
    transform: `scale(${playing ? p.toScale : p.fromScale}) translate(${playing ? p.toX : p.fromX}%, ${playing ? p.toY : p.fromY}%)`,
    transition: `transform ${slide.duration}s linear`,
  };
}

// Probe an mp3's duration client-side.
function probeDuration(url) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = 'metadata';
    a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : 5);
    a.onerror = () => resolve(5);
    a.src = url;
  });
}
