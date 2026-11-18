import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Clapperboard, Film, ImageIcon, Loader2, MapPin, MessageSquare, Mic, Trash2, Wand2 } from 'lucide-react';
import {
  screenplayShot, screenplayMotionPrompt, screenplayNeeds, lineWhere, cartoonShotPrompt, settingText,
  lineVoiceKey, lineIsVoiced, shotOutOfPlace, ACCOUNT_VOICE_PREFIX
} from './cinematicPlan';
import { narrate, animateToClip, listAccountVoices, saveCharacterVoice } from '../../services/cinematicsGenerator';
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
  const voices = { characters, npcs, accountVoices: accountVoices || [], presetKeys: CHARACTER_VOICES.map(v => v.key) };

  // Whether a line's recording is still good: its words, and its voice.
  const voiced = (l) => {
    if (!l.audioUrl || l.spokenText !== l.text) return false;
    if (l.kind === 'narrator') return l.voicedWith === narratorKey;
    return accountVoices && !voicesError ? lineIsVoiced({ ...l, speaker: l.speaker }, voices) : true;
  };
  const needs = screenplayNeeds(screenplay, voiced);
  const todo = needs.voice + needs.draw + needs.animate;
  const minutes = Math.max(1, Math.ceil((needs.draw * 0.6 + needs.animate * 1.5) / AT_ONCE + needs.voice * 0.1));

  const castList = cast ? [...cast.characters, ...cast.npcs, ...cast.adversaries].filter(e => e?.name) : [];
  const castNames = castList.map(e => e.name);
  const everyone = [...characters, ...npcs, ...adversaries].filter(e => e?.id && e.name);
  const otherNames = everyone.map(e => e.name).filter(n => !castNames.includes(n));
  const idOf = (name) => (castList.find(e => e.name === name) || everyone.find(e => e.name === name))?.id;

  const setLines = (next) => save({ screenplay: { ...screenplay, lines: next } });
  const update = (id, patch) => setLines(lines.map(l => (l.id === id ? { ...l, ...patch } : l)));
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

  // Who a line's picture shows: the speaker and listener, or the cast an action names.
  const shotCastIds = (l) => {
    if (l.kind === 'line') return [idOf(l.speaker), l.to ? idOf(l.to) : null].filter(Boolean);
    const named = new Set(castOf(l.text).map(c => c.id));
    return castList.filter(e => named.has(e.id)).map(e => e.id);
  };
  const whereOf = (i) => lineWhere(lines, i);
  const outOfPlace = lines.filter((l, i) => shotOutOfPlace(l, whereOf(i)));

  const stamp = () => Date.now().toString(36);
  const key = cinematic.id;
  const draw = (l, i) => {
    const shot = screenplayShot(l);
    return drawScene({
      id: `scene_${key}_${l.id}_${stamp()}`,
      prompt: cartoonShotPrompt(shot, settingText(whereOf(i), locations)),
      about: `${shot.description} ${l.kind === 'line' ? '' : l.text}`.trim(),
      scenery: l.scenery,
      cast: shotCastIds(l)
    });
  };
  const animate = (l, imageUrl, onStatus) => {
    const shot = screenplayShot(l);
    return animateToClip({
      campaignId, imageUrl, onStatus,
      prompt: plainNames(screenplayMotionPrompt(shot), shot.description, shotCastIds(l)),
      fileName: `scene-${key}-${l.id}-${stamp()}`
    });
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
    // 2. Drawings.
    const toDraw = work.filter(l => !l.imageUrl);
    let drawn = 0;
    if (toDraw.length) setBusy(`shoot:Drawing shots 0 of ${toDraw.length}… (about 30 seconds each)`);
    await pool(toDraw, l => attempt(`drawing ${label(l)}`, async () => {
      const i = work.findIndex(x => x.id === l.id);
      const imageUrl = await draw(work[i], i);
      await patch(l.id, { imageUrl, videoUrl: '', drawnIn: whereOf(i) });
      setBusy(`shoot:Drawing shots ${++drawn} of ${toDraw.length}…`);
    }));
    // 3. Clips.
    const toAnimate = work.filter(l => l.imageUrl && !l.videoUrl);
    let animated = 0;
    if (toAnimate.length) setBusy(`shoot:Animating shots 0 of ${toAnimate.length}… (a minute or two each)`);
    await pool(toAnimate, l => attempt(`animating ${label(l)}`, async () => {
      const clip = await animate(work.find(x => x.id === l.id), l.imageUrl);
      await patch(l.id, { videoUrl: clip.url });
      setBusy(`shoot:Animating shots ${++animated} of ${toAnimate.length}…`);
    }));
    await saving;
    if (failed.length) notify.warning(`Shot what it could. Still missing: ${failed.join('; ')}. Press "Shoot it" again to retry those.`);
    else notify.success('The scene is shot. Preview it below.');
  });

  const redraw = (l, i) => run(`draw-${l.id}`, async () => { await update(l.id, { imageUrl: await draw(l, i), videoUrl: '', drawnIn: whereOf(i) }); });
  const reanimate = (l) => run(`animate-${l.id}`, async () => {
    const clip = await animate(l, l.imageUrl, s => setBusy(`animate-${l.id}:${s}`));
    await update(l.id, { videoUrl: clip.url });
  });
  const redoOutOfPlace = () => {
    const ids = new Set(outOfPlace.map(l => l.id));
    setLines(lines.map(l => (ids.has(l.id) ? { ...l, imageUrl: '', videoUrl: '' } : l)));
  };

  // A voice picked for a line; one of the DM's own voices is remembered on a player character.
  const pickVoice = (l, value) => {
    update(l.id, { voiceKey: value, voicePicked: true, audioUrl: '' });
    if (!value.startsWith(ACCOUNT_VOICE_PREFIX)) return;
    const voice = (accountVoices || []).find(v => `${ACCOUNT_VOICE_PREFIX}${v.id}` === value);
    const who = characters.find(c => c.name === l.speaker);
    if (voice && who && campaignId) saveCharacterVoice(campaignId, who.id, voice).catch(() => {});
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

      <datalist id="screenplay-places">{locations.filter(l => l?.name).map(l => <option key={l.id || l.name} value={l.name} />)}</datalist>

      {lines.map((l, i) => {
        const shot = screenplayShot(l);
        const working = busy === `draw-${l.id}` || busy?.startsWith(`animate-${l.id}`);
        const where = whereOf(i);
        return (
          <div key={l.id} className="flex gap-2 items-start p-2 rounded-lg border border-white/5 bg-black/20">
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
                <span className="text-[11px] text-lr-text-dim italic">{shot.camera}</span>
                {shotOutOfPlace(l, where) && <span className="text-[11px] text-amber-300">Drawn somewhere else</span>}
              </div>
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
              </div>
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
