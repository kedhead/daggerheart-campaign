import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, SkipBack, SkipForward, Music, Volume2, VolumeX, Sparkles, Download, Loader2 } from 'lucide-react';
import { buildTimeline, timelineDuration } from './cinematicTimeline';
import { getTrackUrl } from '../../data/musicLibrary';
import { persistAudio } from '../../services/audioStorage';
import { exportCinematicWebM } from './cinematicExporter';
import './CinematicPlayer.css';

// A calm, atmospheric default score for recaps (exists in the curated library).
const DEFAULT_MUSIC = 'CampfireMemories';

export default function CinematicPlayer({ chapter, campaignId, isDM, updateChapter, narrationClientKey = '', onClose }) {
  const timeline = useMemo(() => buildTimeline(chapter, chapter?.narration), [chapter]);
  const total = useMemo(() => timelineDuration(timeline), [timeline]);
  const trackUrl = useMemo(() => getTrackUrl(DEFAULT_MUSIC), []);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [narrationOn, setNarrationOn] = useState(true);
  const [generating, setGenerating] = useState(null); // {done,total} while generating narration
  const [exporting, setExporting] = useState(null);    // {done,total} while exporting
  const [error, setError] = useState(null);

  const musicRef = useRef(null);
  const narrationRef = useRef(null);
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

  useEffect(() => () => { clearTimeout(timerRef.current); }, []);

  const restart = useCallback(() => { setIndex(0); setPlaying(true); }, []);
  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(timeline.length - 1, i + 1)), [timeline.length]);

  // ── DM: generate narration for every text-bearing slide, cache on the chapter ──
  const generateNarration = useCallback(async () => {
    if (!isDM || !updateChapter) return;
    setError(null);
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
          body: JSON.stringify({ text: job.text, apiKey: narrationClientKey || '__shared__' })
        });
        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}));
          throw new Error(e.error || `Narration failed (HTTP ${resp.status})`);
        }
        const { audio } = await resp.json();
        const url = await persistAudio(campaignId, audio, `narration-${chapter.id}-${job.i}`);
        const duration = await probeDuration(url);
        narration.push({ index: job.i, url, duration });
        setGenerating(g => ({ ...g, done: g.done + 1 }));
      }
      await updateChapter(chapter.id, { narration });
    } catch (err) {
      console.error('Narration generation failed:', err);
      setError(err.message || 'Narration generation failed.');
    } finally {
      setGenerating(null);
    }
  }, [isDM, updateChapter, timeline, campaignId, chapter, narrationClientKey]);

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
        {slide.imageUrl ? (
          <img key={index} src={slide.imageUrl} alt="" className="cine-img" style={panStyle} />
        ) : (
          <div className="cine-img cine-img-empty" />
        )}
        <div className="cine-vignette" />

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
          {hasNarration && (
            <button className={`cine-toggle ${narrationOn ? 'on' : ''}`} onClick={() => setNarrationOn(v => !v)} title="Voice narration">
              {narrationOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
        </div>

        {isDM && (
          <div className="cine-dm-row">
            {!hasNarration && (
              <button className="cine-dm-btn" onClick={generateNarration} disabled={!!generating}>
                {generating
                  ? <><Loader2 size={14} className="cine-spin" /> Narrating {generating.done}/{generating.total}…</>
                  : <><Sparkles size={14} /> Add AI narration</>}
              </button>
            )}
            <button className="cine-dm-btn" onClick={exportVideo} disabled={!!exporting}>
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
