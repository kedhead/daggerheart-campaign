import { useMemo, useState } from 'react';
import { Sparkles, Mic, Film, Loader2, Play, Monitor, ExternalLink, ImageIcon } from 'lucide-react';
import Modal from '../Modal';
import CinematicStage from './CinematicStage';
import { playedSessions, sessionNumberOf, recapSources, pickRecapArt, narrationScript, recapTimings } from './cinematicPlan';
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

  const campaignId = campaign?.id;
  const slides = saved?.slides || [];
  const endLabel = saved?.endLabel ?? `Session ${number + 1}`;
  const musicTrack = saved?.musicTrack ?? DEFAULT_TRACK;

  // Every picture the DM can choose for a slide.
  const gallery = useMemo(() => {
    const seen = new Set();
    const out = [];
    const add = (url, label) => { if (url && !seen.has(url)) { seen.add(url); out.push({ url, label }); } };
    (chapters || []).forEach(c => (c.scenes || []).forEach(s => add(s.imageUrl, c.title)));
    [...npcs, ...characters].forEach(e => add(e.avatarUrl, e.name));
    adversaries.forEach(a => add(a.imageUrl, a.name));
    return out;
  }, [chapters, npcs, characters, adversaries]);

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
    const art = pickRecapArt(beats, { chapters: sources.chapters.length ? sources.chapters : chapters, npcs, characters, adversaries, locations });
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
      prompt: `Slow cinematic camera push-in with subtle motion in the scene, keep the exact art style, no text. ${slide.line}`.slice(0, 480),
      fileName: `recap-${session.id}-${i}-${Date.now()}`,
      onStatus: label => setBusy(`animate-${i}:${label}`)
    });
    await save({ slides: slides.map((s, j) => (j === i ? { ...s, videoUrl: clip.url } : s)) });
  });

  const reel = {
    title: campaign?.name || 'Our Story',
    endLabel,
    slides,
    question: saved?.question || '',
    // More of the campaign's art for the comic panels.
    extras: gallery.map(g => g.url).slice(0, 40),
    narration: saved?.narration || null,
    musicUrl: musicTrack ? getTrackUrl(musicTrack) : ''
  };
  const seconds = Math.round(recapTimings(slides, reel.narration?.duration || 0, { question: reel.question, questionSeconds: reel.narration?.questionDuration || 0 }).total);

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
                          <button
                            type="button"
                            className="text-[11px] text-lr-text-dim hover:text-white inline-flex items-center gap-1 disabled:opacity-40"
                            onClick={() => animateSlide(i)}
                            disabled={!!busy || !s.imageUrl}
                          >
                            {busyAnimating(i) ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
                            {busyAnimating(i) ? (busy.split(':')[1] || 'Animating…') : s.videoUrl ? 'Re-animate (AI video)' : 'Animate (AI video, optional)'}
                          </button>
                          {picking === i && (
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                              {gallery.map(g => (
                                <button key={g.url} type="button" title={g.label} onClick={() => setPicture(i, g.url)} className="w-20 h-12 shrink-0 rounded overflow-hidden border border-white/10 hover:border-white/50">
                                  <img src={g.url} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                              {gallery.length === 0 && <span className="text-xs text-lr-text-dim">No art yet: generate chapter scenes or portraits first.</span>}
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
