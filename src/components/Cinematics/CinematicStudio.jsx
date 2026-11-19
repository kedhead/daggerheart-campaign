import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clapperboard, ExternalLink, Loader2, Monitor, Play, Plus, Sparkles, Trash2, X } from 'lucide-react';
import Modal from '../Modal';
import CinematicStage from './CinematicStage';
import CartoonStudio from './CartoonStudio';
import ScreenplayStudio from './ScreenplayStudio';
import VolumeSlider from './VolumeSlider';
import useShotArt from './useShotArt';
import { cinematicCastIds, cinematicReel, cartoonPlan, cartoonNeeds, screenplayPlan, screenplayNeeds, SCREENPLAY_LENGTHS, SCREENPLAY_NARRATION } from './cinematicPlan';
import { playOnMonitor, openMonitorWindow } from './cinematicChannel';
import { audioContext } from './cinematicSfx';
import { ensureSoundSet } from './cinematicSounds';
import { writeScreenplay, textProvider } from '../../services/cinematicsGenerator';
import { watchCinematics, createCinematic, updateCinematic, deleteCinematic } from '../../services/cinematicStore';
import { NARRATOR_VOICES, RECAP_VOICE_KEY } from '../Storybook/narratorVoices';
import { MUSIC_LIBRARY, getTrackUrl, getTrackDisplayName } from '../../data/musicLibrary';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useNotify } from '../../contexts/ToastContext';

const DEFAULT_TRACK = 'LegendsofMagic';
const MUSIC_THEMES = ['tension', 'battle', 'mystical', 'mystery', 'exploration', 'victory'];
const LENGTH_LABELS = { short: 'Short', medium: 'Medium', long: 'Long' };

const minutesAndSeconds = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/**
 * Cinematic Studio: stand-alone animated scenes for the big moments of the
 * game. The DM describes a moment and picks who is in it; the AI writes the
 * narration and storyboards it into shots and spoken lines; "Shoot it" draws,
 * animates and voices it, the same way as the animated recap. Each one is
 * saved, ready to play on the battle map monitor in one click.
 */
export default function CinematicStudio({ isOpen, onClose, campaign, characters = [], npcs = [], adversaries = [], locations = [] }) {
  const campaignId = campaign?.id;
  const notify = useNotify();
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const { castOf, plainNames, drawScene } = useShotArt({ campaign, characters, npcs, adversaries, getEffectiveKey });

  const [list, setList] = useState(null);
  const [listError, setListError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(null); // id of a cinematic about to be deleted

  useEffect(() => watchCinematics(campaignId, setList, err => setListError(err.message || 'Could not load your cinematics.')), [campaignId]);

  const current = (list || []).find(c => c.id === openId) || null;

  const run = async (label, fn) => {
    setBusy(label);
    try { await fn(); } catch (err) { notify.error(err.message || 'Something went wrong.'); } finally { setBusy(null); }
  };
  const save = (fields) => updateCinematic(campaignId, openId, fields);

  // Who is in a cinematic: the people its description names, unless the DM chose.
  const castIdsOf = (c) => (Array.isArray(c?.castIds) ? c.castIds : cinematicCastIds(c?.prompt || '', { characters, npcs, adversaries }));
  const castFor = (c) => {
    const ids = new Set(castIdsOf(c));
    const pick = (l) => (l || []).filter(e => e?.id && ids.has(e.id));
    return { characters: pick(characters), npcs: pick(npcs), adversaries: pick(adversaries) };
  };
  const everyone = useMemo(() => [...characters, ...npcs, ...adversaries].filter(e => e?.id && e.name), [characters, npcs, adversaries]);

  const reelOf = (c) => cinematicReel(c, { campaignName: campaign?.name, musicUrl: c?.musicTrack ? getTrackUrl(c.musicTrack) : '' });
  // A cinematic written before screenplays existed keeps its narration beats.
  const isScreenplay = (c) => c?.format === 'screenplay';
  const statusOf = (c) => {
    if (isScreenplay(c)) {
      const lines = c.screenplay?.lines || [];
      if (!lines.length) return 'Not written yet';
      const needs = screenplayNeeds(c.screenplay);
      const left = needs.voice + needs.draw + needs.animate;
      const length = minutesAndSeconds(screenplayPlan(reelOf(c)).total);
      return left ? `${lines.length} shots, ${left} things still to make · ${length}` : `${lines.length} shots, ready · ${length}`;
    }
    const shots = c?.cartoon?.shots || [];
    if (!c?.slides?.length) return 'Not written yet';
    if (!shots.length) return 'Written, not storyboarded';
    const needs = cartoonNeeds({ ...reelOf(c), voiceKey: c.voiceKey || RECAP_VOICE_KEY });
    const left = needs.voice + needs.draw + needs.animate;
    const length = minutesAndSeconds(cartoonPlan(reelOf(c)).total);
    return left ? `${shots.length} shots, ${left} things still to make · ${length}` : `${shots.length} shots, ready · ${length}`;
  };
  const playable = (c) => (isScreenplay(c) ? (c.screenplay?.lines || []).length : (c?.cartoon?.shots || []).length) > 0;

  const withSounds = async (data) => {
    try {
      return { ...data, sounds: await ensureSoundSet(campaignId, 'epic', label => setBusy(`sounds:${label}`)) };
    } catch (err) {
      notify.warning(`Cinematic sounds could not be made (${err.message}); playing with simple sounds.`);
      return data;
    }
  };
  const play = (c) => run(`play-${c.id}`, async () => {
    await playOnMonitor(campaignId, 'cinematic', await withSounds(reelOf(c)));
    notify.success(`"${c.title || 'Untitled'}" is playing on the monitor.`);
  });
  const showPreview = (c) => {
    audioContext()?.resume?.().catch(() => {});
    run(`preview-${c.id}`, async () => setPreview({ id: `preview-${Date.now()}`, kind: 'cinematic', data: await withSounds(reelOf(c)) }));
  };

  const startNew = () => run('new', async () => {
    const id = await createCinematic(campaignId, {
      title: '', prompt: '', castIds: null, setting: '', length: 'medium', narrator: 'some', voiceKey: RECAP_VOICE_KEY,
      musicTrack: DEFAULT_TRACK, musicLevel: 0.6, sfxLevel: 1, format: 'screenplay', screenplay: { lines: [] }, slides: [], cartoon: null
    });
    setOpenId(id);
  });

  const remove = (c) => run(`delete-${c.id}`, async () => {
    await deleteCinematic(campaignId, c.id);
    setConfirming(null);
    if (openId === c.id) setOpenId(null);
  });

  // The AI writes the scene as a screenplay: action, character lines (real
  // back-and-forth) and, if wanted, a little narration. An older cinematic
  // written as narration beats switches to a screenplay when it is rewritten.
  const write = () => run('write', async () => {
    const prompt = String(current?.prompt || '').trim();
    if (!prompt) throw new Error('Describe the moment first.');
    setBusy('write:Writing the screenplay…');
    const script = await writeScreenplay({
      campaign, prompt, cast: castFor(current), setting: current.setting, length: current.length || 'medium',
      narrator: current.narrator || 'some', ...textProvider(getEffectiveKey)
    });
    const where = String(current.setting || '').trim();
    const lines = where && script.lines.length ? [{ ...script.lines[0], where }, ...script.lines.slice(1)] : script.lines;
    await save({
      title: String(current.title || '').trim() || script.title,
      format: 'screenplay',
      screenplay: { lines },
      slides: [],
      cartoon: null
    });
    notify.success('Written. Read it through, change anything you like, then press Shoot it.');
  });

  const field = 'w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm';
  const label = 'block text-xs font-bold uppercase tracking-widest text-lr-text-dim mb-1';
  const small = 'text-[11px] text-lr-text-dim hover:text-white inline-flex items-center gap-1 disabled:opacity-40';

  const renderLibrary = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <p className="flex-1 min-w-[240px] text-sm text-lr-text-muted leading-relaxed">
          Animated scenes for the big moments: describe what happens and who is in it, and the AI writes it, storyboards it and voices your
          characters. Shoot it once, and it is ready to play on the monitor whenever the moment comes. Only you see these in the app.
        </p>
        <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={startNew} disabled={!!busy || !campaignId}>
          {busy === 'new' ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} New cinematic
        </button>
      </div>
      {listError && <p className="text-sm text-amber-300">{listError}</p>}
      {list === null && !listError && <p className="text-sm text-lr-text-dim inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading your cinematics…</p>}
      {list?.length === 0 && <p className="text-sm text-lr-text-dim">No cinematics yet. Press New cinematic to make your first.</p>}
      <div className="space-y-2">
        {(list || []).map(c => {
          const thumb = (c.cartoon?.shots || []).find(s => s.imageUrl)?.imageUrl;
          return (
            <div key={c.id} className="flex gap-3 items-center p-2 rounded-lg border border-white/10 bg-black/20">
              <div className="w-24 h-14 shrink-0 rounded-md overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <Clapperboard size={18} className="text-lr-text-dim" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{c.title || 'Untitled cinematic'}</p>
                <p className="text-[11px] text-lr-text-dim truncate">{statusOf(c)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {confirming === c.id ? (
                  <>
                    <span className="text-[11px] text-amber-300">Delete it?</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(c)} disabled={!!busy}>Delete</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(null)}>Keep</button>
                  </>
                ) : (
                  <>
                    <button type="button" className={small} onClick={() => setConfirming(c.id)} disabled={!!busy} title="Delete this cinematic" aria-label="Delete"><Trash2 size={14} /></button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenId(c.id)} disabled={!!busy}>Edit</button>
                    <button type="button" className="btn btn-secondary btn-sm inline-flex items-center gap-1" onClick={() => showPreview(c)} disabled={!!busy || !playable(c)}>
                      <Play size={14} /> Preview
                    </button>
                    <button type="button" className="btn btn-primary btn-sm inline-flex items-center gap-1" onClick={() => play(c)} disabled={!!busy || !playable(c)}>
                      {busy === `play-${c.id}` ? <Loader2 size={14} className="animate-spin" /> : <Monitor size={14} />} Play on monitor
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <button type="button" className="btn btn-ghost inline-flex items-center gap-2" onClick={() => openMonitorWindow(campaignId)}>
          <ExternalLink size={16} /> Open monitor
        </button>
      </div>
    </div>
  );

  const renderEditor = (c) => {
    const ids = castIdsOf(c);
    const inCast = everyone.filter(e => ids.includes(e.id));
    const others = everyone.filter(e => !ids.includes(e.id));
    const slides = c.slides || [];
    const writing = busy?.startsWith('write');
    const screenplay = isScreenplay(c);
    const written = screenplay ? (c.screenplay?.lines || []).length > 0 : slides.length > 0;
    return (
      <div className="space-y-4">
        <button type="button" className={small} onClick={() => setOpenId(null)} disabled={!!busy}><ArrowLeft size={14} /> All cinematics</button>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <div>
            <label className={label}>Title</label>
            <input key={`title-${c.id}-${c.title}`} type="text" defaultValue={c.title} maxLength={60} placeholder="The AI suggests one if you leave it empty"
              onBlur={(e) => { if (e.target.value.trim() !== (c.title || '')) save({ title: e.target.value.trim() }); }} className={field} />
          </div>
          <div>
            <label className={label}>Length</label>
            <select value={c.length || 'medium'} onChange={(e) => save({ length: e.target.value })} disabled={!!busy} className={field}>
              {Object.keys(SCREENPLAY_LENGTHS).map(k => <option key={k} value={k}>{LENGTH_LABELS[k]} (about {SCREENPLAY_LENGTHS[k]} shots)</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Narrator</label>
            <select value={c.narrator || 'some'} onChange={(e) => save({ narrator: e.target.value })} disabled={!!busy} className={field}>
              {Object.entries(SCREENPLAY_NARRATION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>What happens</label>
          <textarea key={`prompt-${c.id}-${c.prompt}`} defaultValue={c.prompt} rows={4} maxLength={2500}
            placeholder="e.g. Pippin finally confronts the Elder Vampire King in his throne room. Bubbles appears in a burst of light, and the king laughs as the doors slam shut behind them."
            onBlur={(e) => { if (e.target.value.trim() !== (c.prompt || '')) save({ prompt: e.target.value.trim() }); }} className={`${field} resize-y`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>Who is in it</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {inCast.map(e => (
                <button key={e.id} type="button" disabled={!!busy} title={`Leave ${e.name} out`} onClick={() => save({ castIds: ids.filter(id => id !== e.id) })}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full border border-lr-accent bg-lr-accent-soft text-white text-xs disabled:opacity-50">
                  {e.name} <X size={11} />
                </button>
              ))}
              {!inCast.length && <span className="text-xs text-lr-text-dim">Nobody yet: name them in the description, or add them here.</span>}
              {others.length > 0 && (
                <select value="" disabled={!!busy} aria-label="Add someone to the cinematic" onChange={(e) => { if (e.target.value) save({ castIds: [...ids, e.target.value] }); }}
                  className="p-1 rounded bg-black/20 border border-white/10 text-white text-xs">
                  <option value="">+ Add someone</option>
                  {others.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              )}
              {Array.isArray(c.castIds) && (
                <button type="button" className={`${small} underline`} disabled={!!busy} onClick={() => save({ castIds: null })} title="Go back to whoever the description names">reset</button>
              )}
            </div>
          </div>
          <div>
            <label className={label}>Where</label>
            <input key={`where-${c.id}-${c.setting}`} type="text" list="cinematic-places" defaultValue={c.setting} maxLength={120} placeholder="e.g. the vampire king's throne room (the AI picks if empty)"
              onBlur={(e) => { if (e.target.value.trim() !== (c.setting || '')) save({ setting: e.target.value.trim() }); }} className={field} />
            <datalist id="cinematic-places">{locations.filter(l => l?.name).map(l => <option key={l.id || l.name} value={l.name} />)}</datalist>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={write} disabled={!!busy || !String(c.prompt || '').trim()}>
            {writing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {writing ? (busy.split(':')[1] || 'Writing…') : written ? 'Rewrite it' : 'Write it'}
          </button>
          <span className="text-[11px] text-lr-text-dim">
            {written
              ? 'Rewriting replaces the screenplay, shots and recordings below.'
              : 'Writes the scene as a screenplay: what happens, and your characters talking to each other. Text only, so it is quick and cheap.'}
          </span>
        </div>

        {screenplay && (c.screenplay?.lines || []).length > 0 && (
          <ScreenplayStudio
            cinematic={c}
            save={save}
            run={run}
            busy={busy}
            setBusy={setBusy}
            notify={notify}
            campaign={campaign}
            characters={characters}
            npcs={npcs}
            adversaries={adversaries}
            cast={castFor(c)}
            locations={locations}
            drawScene={drawScene}
            plainNames={plainNames}
            castOf={castOf}
            narratorKey={c.voiceKey || RECAP_VOICE_KEY}
            textKeys={textProvider(getEffectiveKey)}
          />
        )}

        {!screenplay && slides.length > 0 && (
          <p className="text-[11px] text-amber-300">This cinematic was written before screenplays. Rewrite it to get character conversations and the new editor; until then it plays as it is.</p>
        )}

        {!screenplay && slides.length > 0 && (
          <div className="space-y-1.5">
            <label className={label}>Narration</label>
            {slides.map((s, i) => (
              <textarea key={`${c.id}-${i}-${s.line}`} defaultValue={s.line} rows={2} aria-label={`Beat ${i + 1}`}
                // A changed line is read again on the next Shoot it.
                onBlur={(e) => { const line = e.target.value.trim(); if (line && line !== s.line) save({ slides: slides.map((x, j) => (j === i ? { ...x, line } : x)) }); }}
                className={`${field} resize-y`} />
            ))}
          </div>
        )}

        {!screenplay && slides.length > 0 && (
          <CartoonStudio
            recap={{ slides, question: '', cartoon: c.cartoon || null, voiceKey: c.voiceKey || RECAP_VOICE_KEY, introText: '' }}
            save={save}
            run={run}
            busy={busy}
            setBusy={setBusy}
            notify={notify}
            campaign={campaign}
            characters={characters}
            npcs={npcs}
            adversaries={adversaries}
            cast={castFor(c)}
            locations={locations}
            drawScene={drawScene}
            plainNames={plainNames}
            castOf={castOf}
            voiceKey={c.voiceKey || RECAP_VOICE_KEY}
            getEffectiveKey={getEffectiveKey}
            fileKey={c.id}
            storyboardSources={{ scene: c.prompt || '' }}
            storyboardMode="scene"
            defaultTalk="lots"
            castLabel="In this cinematic"
            castHint="Add them under Who is in it, then re-storyboard."
            blurb="The narration above is storyboarded into short shots, each drawn and animated, with your characters speaking in their own voices. The narrator is recorded beat by beat, so the picture changes on his words."
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>Narrator</label>
            <select value={c.voiceKey || RECAP_VOICE_KEY} onChange={(e) => save({ voiceKey: e.target.value })} disabled={!!busy} className={field}>
              {NARRATOR_VOICES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
            </select>
            <p className="text-[11px] mt-1 text-lr-text-dim">A new narrator re-reads the narration on the next Shoot it.</p>
          </div>
          <div>
            <label className={label}>Music</label>
            <select value={c.musicTrack ?? DEFAULT_TRACK} onChange={(e) => save({ musicTrack: e.target.value })} disabled={!!busy} className={field}>
              <option value="">No music</option>
              {MUSIC_THEMES.filter(t => MUSIC_LIBRARY[t]).map(theme => (
                <optgroup key={theme} label={theme[0].toUpperCase() + theme.slice(1)}>
                  {MUSIC_LIBRARY[theme].map(track => <option key={track} value={track}>{getTrackDisplayName(track)}</option>)}
                </optgroup>
              ))}
            </select>
            {c.musicTrack && <VolumeSlider key={`${c.id}-music`} label="Music" level={c.musicLevel ?? 0.6} onCommit={(musicLevel) => save({ musicLevel })} />}
            <VolumeSlider key={`${c.id}-sfx`} label="Effects" level={c.sfxLevel ?? 1} onCommit={(sfxLevel) => save({ sfxLevel })} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <span className="text-xs text-lr-text-dim mr-auto">{busy?.startsWith('sounds:') ? busy.slice(7) : statusOf(c)}</span>
          <button type="button" className="btn btn-ghost inline-flex items-center gap-2" onClick={() => openMonitorWindow(campaignId)}>
            <ExternalLink size={16} /> Open monitor
          </button>
          <button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={() => showPreview(c)} disabled={!!busy || !playable(c)}>
            <Play size={16} /> Preview here
          </button>
          <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={() => play(c)} disabled={!!busy || !playable(c)}>
            {busy === `play-${c.id}` ? <Loader2 size={16} className="animate-spin" /> : <Monitor size={16} />} Play on monitor
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Cinematics" size="large">
        {openId && current ? renderEditor(current) : renderLibrary()}
      </Modal>
      {preview && <CinematicStage key={preview.id} cue={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
