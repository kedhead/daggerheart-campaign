import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Clapperboard, Film, ImageIcon, Link2, Loader2, MapPin, MessageSquare, Mic, Trash2, Wand2 } from 'lucide-react';
import {
  screenplayShot, screenplayMotionPrompt, screenplayNeeds, lineWhere, cartoonShotPrompt, settingText,
  lineVoiceKey, lineIsVoiced, speakerVoiceKey, shotOutOfPlace, screenplayShotCast, lineReadsAsAction, ACCOUNT_VOICE_PREFIX,
  screenplayPlan, screenplayTransition, continuityStale, withShotNote, SCREENPLAY_TRANSITIONS, SCREENPLAY_TIMING
} from './cinematicPlan';
import { narrate, animateToClip, listAccountVoices, saveCharacterVoice } from '../../services/cinematicsGenerator';
import { persistImage } from '../../services/audioStorage';
import { lastFrameOf } from '../../utils/videoFrame';
import { CHARACTER_VOICES } from '../Storybook/narratorVoices';

// One animated shot: about six seconds on the first video model, at roughly three cents a second.
const CLIP_COST = 0.18;
// How many drawings or clips are made at once.
const AT_ONCE = 3;
const KIND_LABELS = { line: 'Character', action: 'Action', narrator: 'Narrator' };

async function pool(items, job) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      await job(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(AT_ONCE, items.length) }, worker));
}

/**
 * The screenplay editor of a cinematic: one ordered list of lines, each one
 * shot. A character line is filmed over the listener's shoulder (or close on
 * the speaker when they talk to no one); an action line shows what happens; a
 * narrator line is a voice over the picture. Lines can be added anywhere,
 * reordered, retyped and rewritten, and "Shoot it" records, draws and
 * animates whatever is missing.
 *
 * @param {object} props
 * @param {object} props.cinematic - the saved cinematic ({ id, screenplay: { lines, narrator }, voiceKey })
 * @param {(fields: object) => Promise} props.save
 * @param {object} props.cast - { characters, npcs, adversaries }: who is in the cinematic
 */
export default function ScreenplayStudio({
  cinematic, save, run, busy, setBusy, notify, campaign, characters = [], npcs = [], adversaries = [],
  cast, locations = [], drawScene, plainNames = (t) => t, castOf = () => [], narratorKey
}) {
  const campaignId = campaign?.id;
  const screenplay = cinematic.screenplay || { lines: [] };
  const lines = screenplay.lines || [];

  // The DM's own ElevenLabs voices, for the characters' lines.
  const [accountVoices, setAccountVoices] = useState(null);
  const [voicesError, setVoicesError] = useState('');
  useEffect(() => {
    let live = true;
    listAccountVoices()
      .then(list => { if (live) setAccountVoices(list); })
      .catch(err => { if (live) { setAccountVoices([]); setVoicesError(err.message || 'Could not list your ElevenLabs voices.'); } });
    return () => { live = false; };
  }, []);
  // Voices chosen in the list below, shown at once while the save reaches the character.
  const [chosen, setChosen] = useState({});
  const withChosen = (list) => list.map(e => (chosen[e.id] !== undefined ? { ...e, recapVoice: chosen[e.id] } : e));
  const voices = {
    characters: withChosen(characters), npcs: withChosen(npcs), adversaries: withChosen(adversaries),
    accountVoices: accountVoices || [], presetKeys: CHARACTER_VOICES.map(v => v.key)
  };

  // Whether a line's recording is still good: its words, and its voice.
  const voiced = (l) => {
    if (!l.audioUrl || l.spokenText !== l.text) return false;
    if (l.kind === 'narrator') return l.voicedWith === narratorKey;
    return accountVoices && !voicesError ? lineIsVoiced({ ...l, speaker: l.speaker }, voices) : true;
  };
  // A shot that carries on from the one before is remade when that shot's clip changed.
  const current = lines.map((l, i) => (continuityStale(lines, i) ? { ...l, imageUrl: '', videoUrl: '' } : l));
  const needs = screenplayNeeds({ ...screenplay, lines: current }, voiced);
  const plan = screenplayPlan({ screenplay });
  const [open, setOpen] = useState(() => new Set()); // lines whose shot settings are showing
  const toggle = (id) => setOpen(o => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const todo = needs.voice + needs.draw + needs.animate;
  const minutes = Math.max(1, Math.ceil((needs.draw * 0.6 + needs.animate * 1.5) / AT_ONCE + needs.voice * 0.1));

  const castList = cast ? [...cast.characters, ...cast.npcs, ...cast.adversaries].filter(e => e?.name) : [];
  const castNames = castList.map(e => e.name);
  const everyone = [...characters, ...npcs, ...adversaries].filter(e => e?.id && e.name);
  const otherNames = everyone.map(e => e.name).filter(n => !castNames.includes(n));
  const idOf = (name) => (castList.find(e => e.name === name) || everyone.find(e => e.name === name))?.id;

  // Edits read the latest saved lines, so a slow redraw finishing later never
  // undoes something changed while it ran (a note typed just before it, say).
  const latest = useRef(lines);
  latest.current = lines;
  const setLines = (next) => save({ screenplay: { ...screenplay, lines: next } });
  const update = (id, patch) => setLines(latest.current.map(l => (l.id === id ? { ...l, ...patch } : l)));
  // Changing what a line is about makes its picture, clip and recording stale.
  const fresh = { imageUrl: '', videoUrl: '', audioUrl: '', duration: 0 };
  const move = (i, step) => {
    const j = i + step;
    if (j < 0 || j >= lines.length) return;
    const next = [...lines];
    [next[i], next[j]] = [next[j], next[i]];
    setLines(next);
  };
  const insertAfter = (i, kind) => {
    const made = { id: `${Date.now().toString(36)}-n${lines.length}`, kind, text: '' };
    if (kind === 'line') {
      // A reply: the person who was just spoken to answers.
      const prev = [...lines.slice(0, i + 1)].reverse().find(l => l.kind === 'line');
      made.speaker = prev?.to || castNames[0] || '';
      made.to = prev?.speaker && prev.speaker !== made.speaker ? prev.speaker : '';
    }
    setLines([...lines.slice(0, i + 1), made, ...lines.slice(i + 1)]);
  };

  // Who a line's picture shows: whoever the DM picked; else the speaker and
  // listener, the cast an action names, or the party when it says "they".
  const partyIds = (cast?.characters?.length ? cast.characters : characters).filter(e => e?.id).map(e => e.id);
  const shotCastOf = (l) => {
    const named = new Set(castOf(l.text).map(c => c.id));
    const namedIds = [...castList, ...everyone].filter((e, k, all) => named.has(e.id) && all.findIndex(x => x.id === e.id) === k).map(e => e.id);
    return screenplayShotCast(l, { idOf, namedIds, partyIds });
  };
  const shotCastIds = (l) => shotCastOf(l).ids;
  const nameOf = (id) => everyone.find(e => e.id === id)?.name || castList.find(e => e.id === id)?.name || 'Someone';
  // Someone with no portrait is drawn from words alone, and comes out different each time.
  const hasPortrait = (id) => { const e = everyone.find(x => x.id === id) || castList.find(x => x.id === id); return !!(e?.avatarUrl || (adversaries.some(a => a.id === id) && e?.imageUrl)); };
  // A new choice of who is in it means a new picture and clip.
  const setShotCast = (l, ids) => update(l.id, { cast: ids, imageUrl: '', videoUrl: '' });
  const whereOf = (i) => lineWhere(lines, i);
  const outOfPlace = lines.filter((l, i) => shotOutOfPlace(l, whereOf(i)));

  const stamp = () => Date.now().toString(36);
  const key = cinematic.id;
  const draw = (l, i) => {
    const shot = screenplayShot(l);
    return drawScene({
      id: `scene_${key}_${l.id}_${stamp()}`,
      prompt: withShotNote(cartoonShotPrompt(shot, settingText(whereOf(i), locations)), l.note),
      about: `${shot.description} ${l.kind === 'line' ? '' : l.text}`.trim(),
      // Nobody picked for it: just the place.
      scenery: l.scenery || (Array.isArray(l.cast) && l.cast.length === 0),
      cast: shotCastIds(l)
    });
  };
  const animate = (l, imageUrl, onStatus) => {
    const shot = screenplayShot(l);
    return animateToClip({
      campaignId, imageUrl, onStatus,
      prompt: plainNames(withShotNote(screenplayMotionPrompt(shot), l.note), shot.description, shotCastIds(l)),
      fileName: `scene-${key}-${l.id}-${stamp()}`
    });
  };
  // The opening picture of a shot that carries on: the last frame of the clip before it.
  const frameAfter = async (prevClip, l) => {
    const blob = await lastFrameOf(prevClip);
    const { url } = await persistImage(campaignId, blob, `scene-${key}-${l.id}-from-${stamp()}`);
    return url;
  };
  const say = (text, voice, name) => narrate({ campaignId, text, voiceKey: voice, fileName: `scene-${key}-${name}-${stamp()}` });

  const shoot = () => run('shoot', async () => {
    let work = [...lines];
    let saving = Promise.resolve();
    const commit = () => { const snapshot = work; saving = saving.then(() => save({ screenplay: { ...screenplay, lines: snapshot } })); return saving; };
    const patch = (id, fields) => { work = work.map(l => (l.id === id ? { ...l, ...fields } : l)); return commit(); };
    const failed = [];
    const attempt = async (what, job) => { try { await job(); } catch (err) { failed.push(`${what} (${err.message || 'failed'})`); } };
    const label = (l) => `line ${work.findIndex(x => x.id === l.id) + 1}`;

    // 1. Voices.
    const toVoice = work.filter(l => (l.kind === 'line' || l.kind === 'narrator') && l.text && !voiced(l));
    let n = 0;
    for (const l of toVoice) {
      setBusy(`shoot:Recording voices ${++n} of ${toVoice.length}…`);
      await attempt(`the voice for ${label(l)}`, async () => {
        const voice = l.kind === 'narrator' ? narratorKey : lineVoiceKey(l, voices);
        const take = await say(l.text, voice, l.id);
        await patch(l.id, { audioUrl: take.url, duration: take.duration, voicedWith: voice, spokenText: l.text });
      });
    }
    // Shots that carry on from the one before wait for its clip; the rest are made a few at a time.
    work = work.map((l, i) => (continuityStale(work, i) ? { ...l, imageUrl: '', videoUrl: '' } : l));
    const carries = (l) => { const i = work.findIndex(x => x.id === l.id); return !!l.continues && i > 0; };

    // 2. Drawings.
    const toDraw = work.filter(l => !l.imageUrl && !carries(l));
    let drawn = 0;
    if (toDraw.length) setBusy(`shoot:Drawing shots 0 of ${toDraw.length}… (about 30 seconds each)`);
    await pool(toDraw, l => attempt(`drawing ${label(l)}`, async () => {
      const i = work.findIndex(x => x.id === l.id);
      const imageUrl = await draw(work[i], i);
      await patch(l.id, { imageUrl, videoUrl: '', drawnIn: whereOf(i) });
      setBusy(`shoot:Drawing shots ${++drawn} of ${toDraw.length}…`);
    }));
    // 3. Clips.
    const toAnimate = work.filter(l => l.imageUrl && !l.videoUrl && !carries(l));
    let animated = 0;
    if (toAnimate.length) setBusy(`shoot:Animating shots 0 of ${toAnimate.length}… (a minute or two each)`);
    await pool(toAnimate, l => attempt(`animating ${label(l)}`, async () => {
      const clip = await animate(work.find(x => x.id === l.id), l.imageUrl);
      await patch(l.id, { videoUrl: clip.url });
      setBusy(`shoot:Animating shots ${++animated} of ${toAnimate.length}…`);
    }));
    // 4. Shots that carry on, in order: each starts on the last frame of the clip before it.
    const chained = work.filter(l => carries(l) && (!l.imageUrl || !l.videoUrl));
    let carried = 0;
    for (const l of chained) {
      setBusy(`shoot:Carrying shots on ${++carried} of ${chained.length}… (one after another)`);
      await attempt(`carrying on ${label(l)}`, async () => {
        const i = work.findIndex(x => x.id === l.id);
        const prev = work[i - 1];
        let line = work[i];
        if (!line.imageUrl) {
          if (!prev?.videoUrl) throw new Error('the shot before it has no clip yet');
          try {
            const imageUrl = await frameAfter(prev.videoUrl, line);
            await patch(l.id, { imageUrl, videoUrl: '', fromClip: prev.videoUrl, drawnIn: whereOf(i) });
          } catch (err) {
            // The frame could not be read: draw this one fresh rather than leave a hole.
            notify.warning(`Line ${i + 1} could not carry on from the shot before (${err.message}); it was drawn fresh instead.`);
            const imageUrl = await draw(line, i);
            await patch(l.id, { imageUrl, videoUrl: '', fromClip: prev.videoUrl, drawnIn: whereOf(i) });
          }
          line = work[i];
        }
        const clip = await animate(line, line.imageUrl);
        await patch(l.id, { videoUrl: clip.url });
      });
    }
    await saving;
    if (failed.length) notify.warning(`Shot what it could. Still missing: ${failed.join('; ')}. Press "Shoot it" again to retry those.`);
    else notify.success('The scene is shot. Preview it below.');
  });

  const redraw = (l, i, extra = {}) => run(`draw-${l.id}`, async () => {
    const prev = lines[i - 1];
    if (l.continues && prev?.videoUrl) {
      await update(l.id, { ...extra, imageUrl: await frameAfter(prev.videoUrl, l), videoUrl: '', fromClip: prev.videoUrl, drawnIn: whereOf(i) });
      return;
    }
    await update(l.id, { ...extra, imageUrl: await draw(l, i), videoUrl: '', drawnIn: whereOf(i) });
  });
  const reanimate = (l) => run(`animate-${l.id}`, async () => {
    const clip = await animate(l, l.imageUrl, s => setBusy(`animate-${l.id}:${s}`));
    await update(l.id, { videoUrl: clip.url });
  });
  const redoOutOfPlace = () => {
    const ids = new Set(outOfPlace.map(l => l.id));
    setLines(lines.map(l => (ids.has(l.id) ? { ...l, imageUrl: '', videoUrl: '' } : l)));
  };

  // Who someone is (a character, NPC or adversary), to save their voice on them.
  const typeOf = (id) => (characters.some(e => e.id === id) ? 'character' : npcs.some(e => e.id === id) ? 'npc' : adversaries.some(e => e.id === id) ? 'adversary' : '');
  const voiceLabel = (key) => (key.startsWith(ACCOUNT_VOICE_PREFIX)
    ? (accountVoices || []).find(v => `${ACCOUNT_VOICE_PREFIX}${v.id}` === key)?.name || 'your ElevenLabs voice'
    : CHARACTER_VOICES.find(v => v.key === key)?.label || key);
  const savedValue = (e) => {
    const saved = chosen[e.id] !== undefined ? chosen[e.id] : e.recapVoice;
    return saved?.id ? `${ACCOUNT_VOICE_PREFIX}${saved.id}` : saved?.preset || '';
  };
  // A cast member's voice, saved on them: every line they speak, here and in the recaps, uses it.
  const setSpeakerVoice = (e, value) => {
    const account = value.startsWith(ACCOUNT_VOICE_PREFIX) ? (accountVoices || []).find(v => `${ACCOUNT_VOICE_PREFIX}${v.id}` === value) : null;
    const voice = account ? { id: account.id, name: account.name } : value ? { preset: value } : null;
    setChosen(c => ({ ...c, [e.id]: voice }));
    // Their lines follow their voice now, unless one was given its own.
    setLines(latest.current.map(l => (l.kind === 'line' && l.speaker === e.name && !l.voicePicked ? { ...l, voiceKey: '' } : l)));
    if (campaignId && typeOf(e.id)) {
      saveCharacterVoice(campaignId, e.id, voice, typeOf(e.id)).catch(err => notify.warning(`${e.name}'s voice could not be saved (${err.message}); it is used for this cinematic only.`));
    }
  };

  // A voice picked for one line only.
  const pickVoice = (l, value) => {
    update(l.id, { voiceKey: value, voicePicked: true, audioUrl: '' });
  };

  const shooting = busy?.startsWith('shoot');
  const small = 'text-[11px] text-lr-text-dim hover:text-white inline-flex items-center gap-1 disabled:opacity-40';
  const input = 'p-1.5 rounded bg-black/20 border border-white/10 text-white text-xs';
  const nameOptions = (
    <>
      {castNames.length > 0 && <optgroup label="In this cinematic">{castNames.map(n => <option key={n} value={n}>{n}</option>)}</optgroup>}
      {otherNames.length > 0 && <optgroup label="Everyone else">{otherNames.map(n => <option key={n} value={n}>{n}</option>)}</optgroup>}
    </>
  );

  return (
    <div className="space-y-3 p-3 rounded-lg border border-white/10 bg-black/20">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 min-w-[220px] text-[11px] text-lr-text-dim leading-relaxed">
          The screenplay plays top to bottom, one shot per line. A character talking to someone is filmed over that person&apos;s shoulder,
          so an exchange cuts between the two of them. Add lines anywhere, reorder them, or change what they are.
          <span className="block mt-1">
            {voicesError
              ? `Characters use the built-in voices: ${voicesError}`
              : accountVoices === null ? 'Looking for your ElevenLabs voices…'
                : accountVoices.length ? `${accountVoices.length} voices found in your ElevenLabs account; a character whose name matches one speaks in it.`
                  : 'Characters use the built-in voices: none of your own were found in the ElevenLabs account.'}
          </span>
        </p>
        <button type="button" className="btn btn-primary btn-sm inline-flex items-center gap-1" onClick={shoot} disabled={!!busy || !todo || !lines.length}
          title="Records the voices, then draws and animates every shot still missing. Safe to press again.">
          {shooting ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
          {shooting ? 'Shooting…' : todo ? 'Shoot it' : 'All shot'}
        </button>
      </div>

      <p className="text-[11px] text-lr-text-dim">
        {shooting
          ? busy.slice('shoot:'.length) || 'Starting…'
          : todo
            ? `Still to make: ${needs.voice} voice take${needs.voice === 1 ? '' : 's'}, ${needs.draw} drawing${needs.draw === 1 ? '' : 's'}, ${needs.animate} clip${needs.animate === 1 ? '' : 's'}. The clips cost about $${(needs.animate * CLIP_COST).toFixed(2)}, plus an image for each drawing; about ${minutes} minute${minutes === 1 ? '' : 's'}.`
            : `${lines.length} shots, all drawn, animated and voiced.`}
        {outOfPlace.length > 0 && !shooting && (
          <>
            {' '}{outOfPlace.length} drawn shot{outOfPlace.length === 1 ? ' was' : 's were'} made for somewhere else.{' '}
            <button type="button" className="underline text-white disabled:opacity-50" disabled={!!busy} onClick={redoOutOfPlace}>Redo {outOfPlace.length === 1 ? 'it' : 'them'} in the right place</button>
          </>
        )}
      </p>

      {/* The whole scene at a glance, in playing order. Tap a shot to jump to it. */}
      {lines.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1" aria-label="Filmstrip">
          {lines.map((l, i) => {
            const t = plan.shots[i];
            const how = t?.transition === 'cut' ? (l.continues && i > 0 ? 'carries on' : 'cut') : t?.transition === 'fade' ? 'fade' : 'dissolve';
            return (
              <button key={l.id} type="button" title={`${i + 1}. ${l.kind === 'line' ? `${l.speaker}: ` : ''}${l.text}`}
                onClick={() => document.getElementById(`sp-line-${l.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="shrink-0 w-16 text-left">
                <div className={`w-16 h-9 rounded overflow-hidden bg-black/40 border flex items-center justify-center ${current[i].imageUrl ? 'border-white/10' : 'border-amber-300/40'}`}>
                  {current[i].imageUrl ? <img src={l.imageUrl} alt="" className="w-full h-full object-cover" />
                    : l.kind === 'line' ? <MessageSquare size={12} className="text-lr-text-dim" /> : <ImageIcon size={12} className="text-lr-text-dim" />}
                </div>
                <div className="text-[9px] text-lr-text-dim leading-tight truncate">{i + 1} · {t ? `${t.duration.toFixed(1)}s` : ''}</div>
                <div className="text-[9px] text-lr-text-dim/70 leading-tight truncate">{how}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Each speaker's voice, the same every time they talk. */}
      {castList.length > 0 && (
        <div className="space-y-1 p-2 rounded border border-white/10 bg-black/30">
          <p className="text-[11px] text-lr-text-dim">
            <span className="text-white">Voices.</span> Each character speaks in the same voice every time, in cinematics and recaps.
            Set it once here and it is saved on them; leave it on Auto to use the ElevenLabs voice named after them.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {castList.map(e => (
              <label key={e.id} className="flex items-center gap-1.5 text-[11px] text-lr-text-dim min-w-0">
                <span className="text-white truncate w-28 shrink-0" title={e.name}>{e.name}</span>
                <select value={savedValue(e)} disabled={!!busy} aria-label={`Voice for ${e.name}`} onChange={(ev) => setSpeakerVoice(e, ev.target.value)} className={`${input} flex-1 min-w-0`}>
                  <option value="">Auto: {voiceLabel(speakerVoiceKey(e.name, { ...voices, ...{ characters: voices.characters.map(x => (x.id === e.id ? { ...x, recapVoice: null } : x)), npcs: voices.npcs.map(x => (x.id === e.id ? { ...x, recapVoice: null } : x)), adversaries: voices.adversaries.map(x => (x.id === e.id ? { ...x, recapVoice: null } : x)) } }))}</option>
                  {(accountVoices || []).length > 0 && (
                    <optgroup label="Your ElevenLabs voices">{accountVoices.map(v => <option key={v.id} value={`${ACCOUNT_VOICE_PREFIX}${v.id}`}>{v.name}</option>)}</optgroup>
                  )}
                  <optgroup label="Built-in voices">{CHARACTER_VOICES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}</optgroup>
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

      <datalist id="screenplay-places">{locations.filter(l => l?.name).map(l => <option key={l.id || l.name} value={l.name} />)}</datalist>

      {lines.map((l, i) => {
        const shot = screenplayShot(l);
        const working = busy === `draw-${l.id}` || busy?.startsWith(`animate-${l.id}`);
        const where = whereOf(i);
        return (
          <div key={l.id} id={`sp-line-${l.id}`} className="flex gap-2 items-start p-2 rounded-lg border border-white/5 bg-black/20">
            <div className="w-20 h-12 shrink-0 rounded overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
              {l.videoUrl ? <video src={l.videoUrl} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                : l.imageUrl ? <img src={l.imageUrl} alt="" className="w-full h-full object-cover" />
                  : l.kind === 'line' ? <MessageSquare size={16} className="text-lr-text-dim" />
                    : l.kind === 'narrator' ? <Mic size={16} className="text-lr-text-dim" /> : <ImageIcon size={16} className="text-lr-text-dim" />}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-lr-text-dim tabular-nums w-5">{i + 1}</span>
                <select value={l.kind} disabled={!!busy} aria-label={`Kind of line ${i + 1}`} className={input}
                  onChange={(e) => update(l.id, { kind: e.target.value, ...fresh, ...(e.target.value === 'line' ? { speaker: l.speaker || castNames[0] || '', to: l.to || '' } : {}) })}>
                  {Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {l.kind === 'line' && (
                  <>
                    <select value={l.speaker || ''} disabled={!!busy} aria-label={`Who speaks line ${i + 1}`} className={`${input} max-w-[9rem]`}
                      onChange={(e) => update(l.id, { speaker: e.target.value, to: l.to === e.target.value ? '' : l.to, voiceKey: '', voicePicked: false, ...fresh })}>
                      <option value="">Who speaks?</option>
                      {nameOptions}
                    </select>
                    <span className="text-[11px] text-lr-text-dim">to</span>
                    <select value={l.to || ''} disabled={!!busy} aria-label={`Who line ${i + 1} is said to`} className={`${input} max-w-[9rem]`}
                      onChange={(e) => update(l.id, { to: e.target.value, imageUrl: '', videoUrl: '' })}>
                      <option value="">nobody (close-up)</option>
                      {nameOptions}
                    </select>
                  </>
                )}
              </div>
              <textarea key={`${l.id}-${l.text}`} defaultValue={l.text} rows={2} disabled={!!busy}
                placeholder={l.kind === 'line' ? 'What they say' : l.kind === 'narrator' ? 'What the narrator says over the picture' : 'What we see happen'}
                aria-label={`Line ${i + 1}`}
                // New words: a new recording, and for an action a new picture.
                onBlur={(e) => { const text = e.target.value.trim(); if (text !== l.text) update(l.id, { text, audioUrl: '', ...(l.kind === 'line' ? {} : { imageUrl: '', videoUrl: '' }) }); }}
                className={`${input} w-full resize-y`} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <label className="inline-flex items-center gap-1 text-[11px] text-lr-text-dim">
                  <MapPin size={11} />
                  <input key={`${l.id}-where-${l.where || ''}`} type="text" list="screenplay-places" defaultValue={l.where || ''} maxLength={120} disabled={!!busy}
                    placeholder={where ? `Still: ${where}` : 'Where'} aria-label={`Where line ${i + 1} takes place`}
                    onBlur={(e) => { if (e.target.value.trim() !== (l.where || '')) update(l.id, { where: e.target.value.trim() }); }}
                    className="w-40 p-0.5 rounded bg-transparent border-b border-white/10 text-white text-[11px]" />
                </label>
                {l.kind === 'line' && (
                  <select value={lineVoiceKey(l, voices)} disabled={!!busy} aria-label={`Voice for line ${i + 1}`} onChange={(e) => pickVoice(l, e.target.value)} className={`${input} max-w-[10rem]`}>
                    {(accountVoices || []).length > 0 && (
                      <optgroup label="Your ElevenLabs voices">{accountVoices.map(v => <option key={v.id} value={`${ACCOUNT_VOICE_PREFIX}${v.id}`}>{v.name}</option>)}</optgroup>
                    )}
                    {lineVoiceKey(l, voices).startsWith(ACCOUNT_VOICE_PREFIX) && !(accountVoices || []).some(v => `${ACCOUNT_VOICE_PREFIX}${v.id}` === lineVoiceKey(l, voices)) && (
                      <option value={lineVoiceKey(l, voices)}>Your ElevenLabs voice</option>
                    )}
                    <optgroup label="Built-in voices">{CHARACTER_VOICES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}</optgroup>
                  </select>
                )}
                {shot.camera && <span className="text-[11px] text-lr-text-dim italic">{shot.camera}</span>}
                {shotOutOfPlace(l, where) && <span className="text-[11px] text-amber-300">Drawn somewhere else</span>}
              </div>
              {lineReadsAsAction(l) && (
                <div className="flex flex-wrap items-center gap-2 p-1.5 rounded border border-amber-400/40 bg-amber-500/10 text-[11px] text-amber-200">
                  This reads like something that happens, not something {l.speaker || 'they'} says, so it is filmed as an action. Make it one so nobody reads it aloud.
                  <button type="button" disabled={!!busy} onClick={() => update(l.id, { kind: 'action', speaker: '', to: '', voiceKey: '', voicePicked: false, ...fresh })}
                    className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-white hover:bg-amber-500/30">Make it an action</button>
                </div>
              )}
              {(() => {
                const { ids, how } = shotCastOf(l);
                const addable = (list) => list.filter(e => !ids.includes(e.id));
                const castIds = new Set(castList.map(e => e.id));
                return (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]" aria-label={`Who is in line ${i + 1}'s shot`}>
                    <span className="text-lr-text-dim">In this shot:</span>
                    {ids.length === 0 && <span className="text-lr-text-dim italic">nobody, just the place</span>}
                    {ids.map(id => (
                      <span key={id} title={hasPortrait(id) ? undefined : `${nameOf(id)} has no portrait, so they are drawn from their description and can look different each time. Give them a portrait to keep their look.`}
                        className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-white ${hasPortrait(id) ? 'bg-lr-accent/15 border border-lr-accent/40' : 'bg-amber-500/10 border border-dashed border-amber-400/60'}`}>
                        {nameOf(id)}{!hasPortrait(id) && <span className="text-amber-300">· no portrait</span>}
                        <button type="button" disabled={!!busy} onClick={() => setShotCast(l, ids.filter(x => x !== id))}
                          aria-label={`Take ${nameOf(id)} out of line ${i + 1}'s shot`} title="Take out of this shot" className="text-lr-text-dim hover:text-white px-0.5">×</button>
                      </span>
                    ))}
                    <select value="" disabled={!!busy} aria-label={`Add someone to line ${i + 1}'s shot`}
                      onChange={(e) => { if (e.target.value) setShotCast(l, [...ids, e.target.value]); }}
                      className="p-0.5 rounded bg-black/20 border border-white/10 text-lr-text-dim text-[11px]">
                      <option value="">+ Add someone</option>
                      {addable(castList).length > 0 && <optgroup label="In this cinematic">{addable(castList).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>}
                      {addable(everyone.filter(e => !castIds.has(e.id))).length > 0 && (
                        <optgroup label="Everyone else">{addable(everyone.filter(e => !castIds.has(e.id))).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>
                      )}
                    </select>
                    {how === 'guessed' && <span className="text-amber-300" title="This line names nobody, so the party is assumed. Pick who it really is.">guessed: the line names nobody</span>}
                    {how === 'chosen' ? (
                      <button type="button" className={small} disabled={!!busy} onClick={() => setLines(latest.current.map(x => { if (x.id !== l.id) return x; const { cast: _, ...rest } = x; return { ...rest, imageUrl: '', videoUrl: '' }; }))} title="Go back to who the line names">Reset</button>
                    ) : ids.length > 0 && (
                      <button type="button" className={small} disabled={!!busy} onClick={() => setShotCast(l, [])} title="No one, just the place">Nobody</button>
                    )}
                  </div>
                );
              })()}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <button type="button" className={small} onClick={() => redraw(l, i)} disabled={!!busy}>
                  {busy === `draw-${l.id}` ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {busy === `draw-${l.id}` ? 'Drawing…' : l.imageUrl ? 'Redraw' : 'Draw'}
                </button>
                <button type="button" className={small} onClick={() => reanimate(l)} disabled={!!busy || !l.imageUrl}>
                  {busy?.startsWith(`animate-${l.id}`) ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
                  {busy?.startsWith(`animate-${l.id}`) ? (busy.split(':')[1] || 'Animating…') : l.videoUrl ? 'Re-animate' : 'Animate'}
                </button>
                <button type="button" className={small} onClick={() => move(i, -1)} disabled={!!busy || i === 0} aria-label="Move up" title="Move up"><ArrowUp size={12} /></button>
                <button type="button" className={small} onClick={() => move(i, 1)} disabled={!!busy || i === lines.length - 1} aria-label="Move down" title="Move down"><ArrowDown size={12} /></button>
                <select value="" disabled={!!busy} aria-label={`Add a line after line ${i + 1}`} onChange={(e) => { if (e.target.value) insertAfter(i, e.target.value); }}
                  className="p-0.5 rounded bg-black/20 border border-white/10 text-lr-text-dim text-[11px]">
                  <option value="">+ Add after</option>
                  <option value="line">Character line</option>
                  <option value="action">Action</option>
                  <option value="narrator">Narrator</option>
                </select>
                <button type="button" className={small} onClick={() => setLines(lines.filter(x => x.id !== l.id))} disabled={!!busy || working} aria-label="Remove line" title="Remove line"><Trash2 size={12} /></button>
                <button type="button" className={small} onClick={() => toggle(l.id)} aria-expanded={open.has(l.id)} aria-label={`Shot settings for line ${i + 1}`}>
                  {open.has(l.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Shot
                  {(l.note || l.continues || l.transition || l.seconds || l.hold) && <span className="text-lr-accent">•</span>}
                </button>
              </div>
              {open.has(l.id) && (
                <div className="space-y-1.5 p-2 rounded border border-white/10 bg-black/30">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <label className="inline-flex items-center gap-1 text-[11px] text-lr-text-dim">
                      In
                      <select value={l.transition || ''} disabled={!!busy} aria-label={`Transition into line ${i + 1}`} className={input}
                        onChange={(e) => update(l.id, { transition: e.target.value })}>
                        <option value="">Auto ({SCREENPLAY_TRANSITIONS[screenplayTransition({ ...l, transition: '' }, lines[i - 1])].toLowerCase()})</option>
                        {Object.entries(SCREENPLAY_TRANSITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-1 text-[11px] text-lr-text-dim">
                      {l.kind === 'action' ? 'Length' : 'Hold after'}
                      <input type="number" min={l.kind === 'action' ? 1.5 : 0} max={l.kind === 'action' ? 8 : 6} step="any" disabled={!!busy}
                        key={`${l.id}-len-${l.kind === 'action' ? l.seconds : l.hold}`}
                        defaultValue={l.kind === 'action' ? (Number(l.seconds) > 0 ? l.seconds : SCREENPLAY_TIMING.action) : (Number(l.hold) > 0 ? l.hold : 0)}
                        aria-label={`${l.kind === 'action' ? 'Length' : 'Hold after'} for line ${i + 1}, in seconds`}
                        onBlur={(e) => {
                          // Empty or nonsense keeps what it was; anything else is kept in range.
                          const raw = e.target.value.trim();
                          const v = Number(raw);
                          if (!raw || !Number.isFinite(v)) { e.target.value = l.kind === 'action' ? (Number(l.seconds) > 0 ? l.seconds : SCREENPLAY_TIMING.action) : (Number(l.hold) > 0 ? l.hold : 0); return; }
                          const kept = l.kind === 'action' ? Math.min(8, Math.max(1.5, v)) : Math.min(6, Math.max(0, v));
                          e.target.value = kept;
                          update(l.id, l.kind === 'action' ? { seconds: kept } : { hold: kept });
                        }}
                        className={`${input} w-16`} />
                      s
                    </label>
                    {i > 0 && (
                      <label className="inline-flex items-center gap-1 text-[11px] text-lr-text-dim" title="Starts from the last frame of the clip before it, so the movement carries on across the cut. Made after that clip, one at a time.">
                        <input type="checkbox" checked={!!l.continues} disabled={!!busy} onChange={(e) => update(l.id, { continues: e.target.checked, imageUrl: '', videoUrl: '' })} />
                        <Link2 size={11} /> Carry on from the shot before
                      </label>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input key={`${l.id}-note-${l.note || ''}`} type="text" defaultValue={l.note || ''} maxLength={240} disabled={!!busy}
                      placeholder="Note for this shot, e.g. make it darker, Pippin on the left" aria-label={`Note for line ${i + 1}`}
                      onBlur={(e) => { if (e.target.value.trim() !== (l.note || '')) update(l.id, { note: e.target.value.trim() }); }}
                      className={`${input} flex-1 min-w-[180px]`} />
                    <button type="button" className={small} onClick={(e) => {
                      // Save what is typed, then redraw with it.
                      const typed = e.currentTarget.previousSibling?.value?.trim() ?? l.note ?? '';
                      redraw({ ...l, note: typed }, i, { note: typed });
                    }} disabled={!!busy}>
                      <Wand2 size={12} /> Redraw with note
                    </button>
                  </div>
                  {l.continues && i > 0 && <p className="text-[10px] text-lr-text-dim">Carried-on shots start from the clip before, so a note changes how it moves, not its first picture.</p>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <select value="" disabled={!!busy} aria-label="Add a line at the end" onChange={(e) => { if (e.target.value) insertAfter(lines.length - 1, e.target.value); }}
        className="p-1 rounded bg-black/20 border border-white/10 text-white text-xs">
        <option value="">+ Add a line at the end</option>
        <option value="line">Character line</option>
        <option value="action">Action</option>
        <option value="narrator">Narrator</option>
      </select>
    </div>
  );
}
