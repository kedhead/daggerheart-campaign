import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Mic, Film, Loader2, Play, Monitor, ExternalLink, ImageIcon, Wand2, RefreshCw, Clapperboard } from 'lucide-react';
import Modal from '../Modal';
import CinematicStage from './CinematicStage';
import { playedSessions, sessionNumberOf, recapSources, pickRecapArt, narrationScript, recapPlan, recapCast, recapStarring, recapArtChapters, recapGallery, featuredInLine, recapShotPrompt } from './cinematicPlan';
import { regenerateScene, DEFAULT_STYLE_KEY } from '../../services/storybookGenerator';
import { playOnMonitor, openMonitorWindow } from './cinematicChannel';
import { audioContext } from './cinematicSfx';
import { ensureSoundSet } from './cinematicSounds';
import { useOptionalCampaignData } from '../../contexts/CampaignDataContext';
import { writeRecapScript, narrate, animateToClip, textProvider } from '../../services/cinematicsGenerator';
import { NARRATOR_VOICES, RECAP_VOICE_KEY } from '../Storybook/narratorVoices';
import { MUSIC_LIBRARY, getTrackUrl, getTrackDisplayName } from '../../data/musicLibrary';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useNotify } from '../../contexts/ToastContext';

const DEFAULT_TRACK = 'LegendsofMagic';
const MUSIC_THEMES = ['mystical', 'exploration', 'tension', 'battle', 'victory', 'mystery'];

// One animated shot: about six seconds on the first video model, at roughly three cents a second.
const CLIP_COST = 0.18;
const SHOT_MOTION = 'Slow cinematic camera push-in while the characters move and act out the moment, keep the exact art style, no text.';

/**
 * The music volume. It keeps its own value while it is dragged and saves a
 * moment after the last move. (It used to save only on "pointer up", which a
 * phone or tablet does not always send for a slider, so the setting was lost.)
 */
function VolumeSlider({ label = 'Volume', level, onCommit }) {
  const [value, setValue] = useState(Math.round(level * 100));
  const timer = useRef(null);
  const commit = useRef(onCommit);
  commit.current = onCommit;
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = (next) => {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit.current(next / 100), 350);
  };
  return (
    <label className="flex items-center gap-2 mt-2 text-[11px] text-lr-text-dim">
      <span className="w-12 shrink-0">{label}</span>
      <input type="range" min="0" max="100" step="5" value={value} onChange={(e) => change(Number(e.target.value))} className="flex-1" />
      <span className="w-9 text-right tabular-nums">{value}%</span>
    </label>
  );
}

const sessionLabel = (s, n) => `${n ? `Session ${n}` : 'Session'}${s?.title ? `: ${s.title}` : ''}`;

/**
 * "Previously on…": the AI writes a short, dramatic recap of the last
 * session, picks art for each beat from the story chapters and portraits,
 * a narrator reads it, and it plays on the battle map monitor. Saved on the
 * session, so replaying it next time costs nothing.
 */
export default function RecapStudio({ isOpen, onClose, campaign, sessions = [], updateSession, chapters: chaptersProp = [], characters = [], npcs = [], adversaries = [], locations = [] }) {
  // Every chapter, drafts included: the Session Log is handed published ones
  // only, and a draft still shows the session was played.
  const campaignData = useOptionalCampaignData();
  const chapters = campaignData?.storybookChapters?.length ? campaignData.storybookChapters : chaptersProp;
  const notify = useNotify();
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const played = useMemo(() => playedSessions(sessions, chapters), [sessions, chapters]);
  const [sessionId, setSessionId] = useState(() => played[played.length - 1]?.id || '');
  const session = played.find(s => s.id === sessionId) || null;
  const number = session ? sessionNumberOf(session, played) : 0;
  const saved = session?.recap || null;

  const [busy, setBusy] = useState(null); // what is running, for the buttons
  const [voiceKey, setVoiceKey] = useState(saved?.narration?.voiceKey || RECAP_VOICE_KEY);
  const [picking, setPicking] = useState(null); // slide index whose picture is being chosen
  const [preview, setPreview] = useState(null);
  const [shooting, setShooting] = useState(null); // { index, text }: a new shot being described

  const campaignId = campaign?.id;
  const slides = saved?.slides || [];
  const endLabel = saved?.endLabel ?? `Session ${number + 1}`;
  const musicTrack = saved?.musicTrack ?? DEFAULT_TRACK;
  const musicLevel = saved?.musicLevel ?? 0.6;
  const sfxLevel = saved?.sfxLevel ?? 1;
  // Film is the look unless this recap was set to the comic one.
  const style = saved?.style === 'comic' ? 'comic' : 'film';
  const cast = useMemo(() => recapCast(characters), [characters]);
  // Players who are away tonight sit the roll out; it is remembered per recap.
  const castAway = saved?.castAway || [];
  const starring = recapStarring(cast, castAway);
  const castRoll = (saved?.castRoll ?? true) && starring.length > 0;
  const toggleStar = (id) => save({
    castAway: castAway.includes(id) ? castAway.filter(x => x !== id) : [...castAway, id],
    castRoll: true
  });

  // The pictures a slide can use: this session's scenes first, then
  // portraits, and older sessions' scenes only when the DM picks one.
  const artChapters = useMemo(() => recapArtChapters(session, chapters), [session, chapters]);
  const galleryGroups = useMemo(
    () => recapGallery({ session, chapters, npcs, characters, adversaries }),
    [session, chapters, npcs, characters, adversaries]
  );
  const artOptions = { chapters: artChapters, npcs, characters, adversaries, locations };

  const save = (fields) => updateSession(session.id, { recap: { ...(saved || {}), ...fields } });

  const run = async (label, fn) => {
    setBusy(label);
    try { await fn(); } catch (err) { notify.error(err.message || 'Something went wrong.'); } finally { setBusy(null); }
  };

  const write = () => run('write', async () => {
    const sources = recapSources({ session, sessions, chapters });
    if (!sources.sessions.some(s => (s.summary || s.notes || '').trim())) {
      throw new Error('This session has no summary yet. Add one in the Session Log first.');
    }
    const { beats, question } = await writeRecapScript({ campaign, sources, characters, ...textProvider(getEffectiveKey) });
    // Pictures from this session only: the script reads the session before
    // it too, but its art belongs to last week's recap.
    const art = pickRecapArt(beats, artOptions);
    await save({
      slides: beats.map((b, i) => ({ line: b.line, imageUrl: art[i]?.imageUrl || '', videoUrl: art[i]?.videoUrl || '' })),
      question,
      narration: null,
      endLabel,
      musicTrack
    });
  });

  const editQuestion = (question) => {
    // Its narration no longer matches; the beats' narration still does.
    const narration = saved?.narration ? { ...saved.narration, questionUrl: '', questionDuration: 0 } : null;
    save({ question, narration });
  };

  const editLine = (i, line) => {
    const next = slides.map((s, j) => (j === i ? { ...s, line } : s));
    // The narration no longer matches the words, so it has to be read again.
    save({ slides: next, narration: null });
  };

  const setPicture = (i, url) => {
    save({ slides: slides.map((s, j) => (j === i ? { ...s, imageUrl: url, videoUrl: '' } : s)) });
    setPicking(null);
  };

  // Recaps written before the art was limited to their own session.
  const repickArt = () => run('repick', async () => {
    const art = pickRecapArt(slides.map(s => ({ line: s.line, focus: '' })), artOptions);
    await save({ slides: slides.map((s, i) => ({ ...s, imageUrl: art[i]?.imageUrl || s.imageUrl, videoUrl: art[i]?.videoUrl || '' })) });
  });

  // A fresh picture for one slide, drawn in the campaign's storybook style with
  // the portraits of whoever the line names as references.
  const newShot = (i, text) => run(`shot-${i}`, async () => {
    const description = (text || slides[i]?.line || '').trim();
    if (!description) throw new Error('Describe the shot first.');
    const chapter = artChapters[0] || null;
    const scene = await regenerateScene({
      scene: { id: `recap_${session.id}_${i}_${Date.now()}`, prompt: recapShotPrompt(description), featuredEntityIds: featuredInLine(description, { characters, npcs, adversaries }) },
      chapter,
      entities: { characters, npcs, adversaries },
      campaignId,
      apiKey: getEffectiveKey?.('openai')?.key || null,
      gameSystem: campaign?.gameSystem || 'daggerheart',
      styleKey: chapter?.styleKey || campaign?.storybookStyle || DEFAULT_STYLE_KEY,
      styleCustom: chapter?.styleCustom || campaign?.storybookStyleCustom || '',
      imageModel: 'nano-banana-2'
    });
    await save({ slides: slides.map((s, j) => (j === i ? { ...s, imageUrl: scene.imageUrl, videoUrl: '' } : s)) });
    setShooting(null);
    notify.success('New shot ready.');
  });

  // Three reads: "Previously on…" over the title card, the beats, and the
  // cliffhanger question after the silence.
  const readAloud = () => run('narrate', async () => {
    const stamp = Date.now();
    const title = campaign?.name || 'our story';
    const intro = await narrate({ campaignId, text: `Previously on… ${title}.`, voiceKey, fileName: `recap-${session.id}-intro-${stamp}` });
    const body = await narrate({ campaignId, text: narrationScript(slides, { trailer: voiceKey === RECAP_VOICE_KEY }), voiceKey, fileName: `recap-${session.id}-${stamp}` });
    const ask = saved?.question
      ? await narrate({ campaignId, text: saved.question, voiceKey, fileName: `recap-${session.id}-question-${stamp}` })
      : null;
    await save({
      narration: {
        ...body,
        introUrl: intro.url,
        questionUrl: ask?.url || '',
        questionDuration: ask?.duration || 0
      }
    });
  });

  const animateSlide = (i) => run(`animate-${i}`, async () => {
    const slide = slides[i];
    const clip = await animateToClip({
      campaignId,
      imageUrl: slide.imageUrl,
      prompt: `${SHOT_MOTION} ${slide.line}`.slice(0, 480),
      fileName: `recap-${session.id}-${i}-${Date.now()}`,
      onStatus: label => setBusy(`animate-${i}:${label}`)
    });
    await save({ slides: slides.map((s, j) => (j === i ? { ...s, videoUrl: clip.url } : s)) });
  });

  // Every still shot, one after another. Each is saved as it lands, so a
  // failure part-way keeps the clips already made.
  const still = slides.map((s, i) => (s.imageUrl && !s.videoUrl ? i : -1)).filter(i => i >= 0);
  const animateAll = () => run('animate-all', async () => {
    let next = slides;
    const failed = [];
    for (let n = 0; n < still.length; n++) {
      const i = still[n];
      try {
        const clip = await animateToClip({
          campaignId,
          imageUrl: next[i].imageUrl,
          prompt: `${SHOT_MOTION} ${next[i].line}`.slice(0, 480),
          fileName: `recap-${session.id}-${i}-${Date.now()}`,
          onStatus: label => setBusy(`animate-all:Shot ${n + 1} of ${still.length}, ${label}`)
        });
        next = next.map((s, j) => (j === i ? { ...s, videoUrl: clip.url } : s));
        await save({ slides: next });
      } catch (err) {
        failed.push(`shot ${i + 1} (${err.message || 'failed'})`);
      }
    }
    if (failed.length) notify.warning(`Animated ${still.length - failed.length} of ${still.length}. Not animated: ${failed.join('; ')}.`);
    else notify.success(`All ${still.length} shots animated.`);
  });

  const reel = {
    title: campaign?.name || 'Our Story',
    style,
    cast: castRoll ? starring : [],
    endLabel,
    slides,
    question: saved?.question || '',
    narration: saved?.narration || null,
    musicUrl: musicTrack ? getTrackUrl(musicTrack) : '',
    musicLevel,
    sfxLevel
  };
  const seconds = Math.round(recapPlan(reel).total);

  // The reel with its trailer sounds (made once, the first time).
  const withSounds = async () => {
    try {
      return { ...reel, sounds: await ensureSoundSet(campaignId, 'epic', label => setBusy(`sounds:${label}`)) };
    } catch (err) {
      notify.warning(`Cinematic sounds could not be made (${err.message}); playing with simple sounds.`);
      return reel;
    }
  };

  const showPreview = () => {
    audioContext()?.resume?.().catch(() => {});
    run('preview', async () => setPreview({ id: `preview-${Date.now()}`, kind: 'recap', data: await withSounds() }));
  };

  const sendToMonitor = () => run('send', async () => {
    await playOnMonitor(campaignId, 'recap', await withSounds());
    notify.success('"Previously on…" is playing on the monitor.');
  });

  const busyAnimating = (i) => busy && busy.startsWith(`animate-${i}`);

  const thumbs = (items) => items.map(g => (
    <button key={g.url} type="button" title={g.label} onClick={() => setPicture(picking, g.url)} className="w-20 h-12 shrink-0 rounded overflow-hidden border border-white/10 hover:border-white/50">
      <img src={g.url} alt="" className="w-full h-full object-cover" />
    </button>
  ));

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Previously on…" size="large">
        <div className="space-y-5">
          <p className="text-sm text-lr-text-muted leading-relaxed">
            A narrated, animated recap to open the session on the battle map monitor: the AI writes it from your session summary and
            story chapter, picks art for each beat, and a narrator reads it over music. Edit anything before you play it.
          </p>

          {played.length === 0 ? (
            <p className="text-sm text-amber-300">Log a played session with a summary first, then come back here.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim mb-1">Recap of</label>
                  <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="w-full p-2.5 rounded-lg bg-black/20 border border-white/10 text-white">
                    {[...played].reverse().map(s => (
                      <option key={s.id} value={s.id}>{sessionLabel(s, sessionNumberOf(s, played))}</option>
                    ))}
                  </select>
                </div>
                <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={write} disabled={!!busy}>
                  {busy === 'write' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {slides.length ? 'Rewrite recap' : 'Write recap'}
                </button>
              </div>

              {slides.length > 0 && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-lr-text-dim">Tap a picture to change it. Art comes from this session; older sessions are there if you pick them.</p>
                    {still.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm inline-flex items-center gap-1"
                        onClick={animateAll}
                        disabled={!!busy}
                        title={`Turns every still shot into a moving clip, one after another (about a minute each). Costs about $${CLIP_COST.toFixed(2)} a shot.`}
                      >
                        {busy?.startsWith('animate-all') ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
                        {busy?.startsWith('animate-all')
                          ? (busy.slice('animate-all:'.length) || 'Animating…')
                          : `Animate all ${still.length} shots (about $${(still.length * CLIP_COST).toFixed(2)})`}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm inline-flex items-center gap-1"
                      onClick={repickArt}
                      disabled={!!busy}
                      title="Swap every picture for this session's art, keeping the words"
                    >
                      {busy === 'repick' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Use this session&apos;s art
                    </button>
                  </div>
                  <div className="space-y-2">
                    {slides.map((s, i) => (
                      // Keyed by the text too, so a rewrite replaces the uncontrolled fields.
                      <div key={`${sessionId}-${i}-${s.line}`} className="flex gap-3 items-start p-2 rounded-lg border border-white/10 bg-black/20">
                        <button
                          type="button"
                          title="Change picture"
                          onClick={() => setPicking(picking === i ? null : i)}
                          className="w-24 h-14 shrink-0 rounded-md overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center"
                        >
                          {s.videoUrl ? <video src={s.videoUrl} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                            : s.imageUrl ? <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                            : <ImageIcon size={18} className="text-lr-text-dim" />}
                        </button>
                        <div className="flex-1 min-w-0 space-y-1">
                          <textarea
                            defaultValue={s.line}
                            onBlur={(e) => { if (e.target.value.trim() !== s.line) editLine(i, e.target.value.trim()); }}
                            rows={2}
                            className="w-full p-2 rounded bg-black/20 border border-white/10 text-white text-sm resize-y"
                          />
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <button
                              type="button"
                              className="text-[11px] text-lr-text-dim hover:text-white inline-flex items-center gap-1 disabled:opacity-40"
                              onClick={() => setShooting(shooting?.index === i ? null : { index: i, text: s.line })}
                              disabled={!!busy}
                            >
                              {busy === `shot-${i}` ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                              {busy === `shot-${i}` ? 'Drawing… (~30s)' : 'New shot (AI image)'}
                            </button>
                            <button
                              type="button"
                              className="text-[11px] text-lr-text-dim hover:text-white inline-flex items-center gap-1 disabled:opacity-40"
                              onClick={() => animateSlide(i)}
                              disabled={!!busy || !s.imageUrl}
                            >
                              {busyAnimating(i) ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
                              {busyAnimating(i) ? (busy.split(':')[1] || 'Animating…') : s.videoUrl ? 'Re-animate (AI video)' : 'Animate (AI video, optional)'}
                            </button>
                          </div>
                          {shooting?.index === i && (
                            <div className="space-y-1.5 p-2 rounded border border-white/10 bg-black/30">
                              <label className="block text-[11px] text-lr-text-dim">Describe the shot (characters named here are drawn from their portraits)</label>
                              <textarea
                                value={shooting.text}
                                onChange={(e) => setShooting({ index: i, text: e.target.value })}
                                rows={2}
                                className="w-full p-2 rounded bg-black/20 border border-white/10 text-white text-sm resize-y"
                              />
                              <div className="flex gap-2 justify-end">
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShooting(null)} disabled={busy === `shot-${i}`}>Cancel</button>
                                <button type="button" className="btn btn-primary btn-sm inline-flex items-center gap-1" onClick={() => newShot(i, shooting.text)} disabled={!!busy}>
                                  {busy === `shot-${i}` ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                  Draw it
                                </button>
                              </div>
                            </div>
                          )}
                          {picking === i && (
                            <div className="space-y-1.5">
                              {galleryGroups.session.length > 0 && (
                                <>
                                  <p className="text-[10px] uppercase tracking-widest text-lr-text-dim">This session</p>
                                  <div className="flex gap-1.5 overflow-x-auto pb-1">{thumbs(galleryGroups.session)}</div>
                                </>
                              )}
                              {galleryGroups.portraits.length > 0 && (
                                <>
                                  <p className="text-[10px] uppercase tracking-widest text-lr-text-dim">Portraits</p>
                                  <div className="flex gap-1.5 overflow-x-auto pb-1">{thumbs(galleryGroups.portraits)}</div>
                                </>
                              )}
                              {galleryGroups.older.length > 0 && (
                                <>
                                  <p className="text-[10px] uppercase tracking-widest text-lr-text-dim">Older sessions</p>
                                  <div className="flex gap-1.5 overflow-x-auto pb-1">{thumbs(galleryGroups.older)}</div>
                                </>
                              )}
                              {!galleryGroups.session.length && !galleryGroups.portraits.length && !galleryGroups.older.length && (
                                <span className="text-xs text-lr-text-dim">No art yet: use New shot, or generate chapter scenes or portraits first.</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim mb-1">Cliffhanger</label>
                    <input
                      key={`${sessionId}-q-${saved?.question || ''}`}
                      type="text"
                      defaultValue={saved?.question || ''}
                      maxLength={80}
                      placeholder="e.g. Will the elders trust a ghost?"
                      onBlur={(e) => { if (e.target.value.trim() !== (saved?.question || '')) editQuestion(e.target.value.trim()); }}
                      className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
                    />
                    <p className="text-[11px] mt-1 text-lr-text-dim">The music cuts, a beat of silence, then this slams on screen. Leave empty to skip it.</p>
                  </div>

                  <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim mb-1">Look</label>
                      <select value={style} onChange={(e) => save({ style: e.target.value })} className="p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm">
                        <option value="film">Film trailer</option>
                        <option value="comic">Comic book</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pb-1.5">
                      <label className={`flex items-center gap-2 text-sm ${cast.length ? 'text-white' : 'text-lr-text-dim'}`}>
                        <input type="checkbox" checked={castRoll} disabled={!starring.length} onChange={(e) => save({ castRoll: e.target.checked })} />
                        {cast.length ? 'Cast roll, starring:' : 'Cast roll (needs player characters with portraits)'}
                      </label>
                      {/* Tap a character to leave them out when their player is away. */}
                      {cast.map(c => {
                        const here = !castAway.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            aria-pressed={here}
                            title={here ? `Leave ${c.name} out tonight` : `Put ${c.name} back in`}
                            onClick={() => toggleStar(c.id)}
                            className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border text-xs transition ${here
                              ? 'border-lr-accent bg-lr-accent-soft text-white'
                              : 'border-white/10 bg-black/20 text-lr-text-dim line-through opacity-60'}`}
                          >
                            <img src={c.imageUrl} alt="" className={`w-5 h-5 rounded-full object-cover ${here ? '' : 'grayscale'}`} />
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="basis-full text-[11px] text-lr-text-dim">
                      {style === 'film'
                        ? 'Widescreen with film grain, dissolves and subtitles; short lines become big text cards, and every shot flashes by again before the cliffhanger.'
                        : 'Comic panels with ink wipes, speed lines and caption boxes.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim mb-1">Narrator</label>
                      <div className="flex gap-2">
                        <select value={voiceKey} onChange={(e) => setVoiceKey(e.target.value)} className="flex-1 min-w-0 p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm">
                          {NARRATOR_VOICES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                        </select>
                        <button type="button" className="btn btn-secondary btn-sm inline-flex items-center gap-1" onClick={readAloud} disabled={!!busy}>
                          {busy === 'narrate' ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
                          {saved?.narration ? 'Re-read' : 'Narrate'}
                        </button>
                      </div>
                      <p className="text-[11px] mt-1 text-lr-text-dim">{saved?.narration ? `Narrated (${Math.round(saved.narration.duration)}s).` : 'Not narrated yet: it plays with captions only.'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim mb-1">Music</label>
                      <select value={musicTrack} onChange={(e) => save({ musicTrack: e.target.value })} className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm">
                        <option value="">No music</option>
                        {MUSIC_THEMES.filter(t => MUSIC_LIBRARY[t]).map(theme => (
                          <optgroup key={theme} label={theme[0].toUpperCase() + theme.slice(1)}>
                            {MUSIC_LIBRARY[theme].map(track => <option key={track} value={track}>{getTrackDisplayName(track)}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      {musicTrack && (
                        <VolumeSlider key={sessionId} label="Music" level={musicLevel} onCommit={(musicLevel) => save({ musicLevel })} />
                      )}
                      <VolumeSlider key={`${sessionId}-sfx`} label="Effects" level={sfxLevel} onCommit={(sfxLevel) => save({ sfxLevel })} />
                      <p className="text-[11px] mt-1 text-lr-text-dim">Effects are the booms, whooshes and slams. Both drop under the narrator on their own.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim mb-1">End card</label>
                      <input
                        key={`${sessionId}-${endLabel}`}
                        type="text"
                        defaultValue={endLabel}
                        maxLength={40}
                        onBlur={(e) => { if (e.target.value !== endLabel) save({ endLabel: e.target.value }); }}
                        className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <span className="text-xs text-lr-text-dim mr-auto">{busy?.startsWith('sounds:') ? busy.slice(7) : `About ${seconds} seconds`}</span>
                    <button type="button" className="btn btn-ghost inline-flex items-center gap-2" onClick={() => openMonitorWindow(campaignId)}>
                      <ExternalLink size={16} /> Open monitor
                    </button>
                    <button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={showPreview} disabled={!!busy}>
                      <Play size={16} /> Preview here
                    </button>
                    <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={sendToMonitor} disabled={!!busy || !campaignId}>
                      {busy === 'send' ? <Loader2 size={16} className="animate-spin" /> : <Monitor size={16} />}
                      Play on monitor
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Modal>
      {preview && <CinematicStage key={preview.id} cue={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
