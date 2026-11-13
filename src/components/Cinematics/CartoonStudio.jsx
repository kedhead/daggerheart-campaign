import { Clapperboard, Film, ImageIcon, Loader2, MessageSquare, PenLine, Trash2, Wand2 } from 'lucide-react';
import { cartoonNeeds, cartoonNarration, cartoonShotText, cartoonShotPrompt, cartoonMotionPrompt, narrationScript, recapSources, voiceForSpeaker } from './cinematicPlan';
import { writeStoryboard, narrate, animateToClip, textProvider } from '../../services/cinematicsGenerator';
import { CHARACTER_VOICES, RECAP_VOICE_KEY } from '../Storybook/narratorVoices';

// One animated shot: about six seconds on the first video model, at roughly three cents a second.
const CLIP_COST = 0.18;
// How many drawings or clips are made at once.
const AT_ONCE = 3;

/** Run `job` over `items`, a few at a time. */
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
 * The animated-cartoon half of the recap studio: storyboard the script into
 * shots, then "shoot" it (record the voices, draw each shot, animate each
 * shot). Everything it makes is kept in recap.cartoon, beside the slides the
 * film and comic looks use, and each shot can be rewritten, redrawn or
 * re-animated on its own.
 *
 * @param {object} props
 * @param {object} props.recap - { slides, question, cartoon } as saved
 * @param {(fields: object) => Promise} props.save - merges fields into the saved recap
 * @param {(label: string, fn: () => Promise) => Promise} props.run - runs a job with the studio's busy state and error toast
 * @param {(args: {id: string, prompt: string, about: string}) => Promise<string>} props.drawScene - draws a picture, returns its URL
 * @param {(text: string, about?: string) => string} [props.plainNames] - swaps character names in a prompt for plain labels
 */
export default function CartoonStudio({
  recap, save, run, busy, setBusy, notify, campaign, session, sessions, chapters,
  characters, npcs, adversaries = [], drawScene, plainNames = (t) => t, voiceKey, getEffectiveKey
}) {
  const campaignId = campaign?.id;
  const slides = recap.slides || [];
  const cartoon = recap.cartoon || null;
  const shots = cartoon?.shots || [];
  const needs = cartoonNeeds(recap);
  const todo = needs.voice + needs.draw + needs.animate;
  const minutes = Math.max(1, Math.ceil((needs.draw * 0.6 + needs.animate * 1.5) / AT_ONCE + needs.voice * 0.1));
  const voiceKeys = CHARACTER_VOICES.map(v => v.key);

  const storyboard = () => run('storyboard', async () => {
    const made = await writeStoryboard({
      campaign, beats: slides, sources: recapSources({ session, sessions, chapters }), characters, npcs, adversaries, ...textProvider(getEffectiveKey)
    });
    await save({ cartoon: { shots: made.map(s => (s.kind === 'line' ? { ...s, voiceKey: voiceForSpeaker(s.speaker, voiceKeys) } : s)), voice: cartoon?.voice || null } });
  });

  const stamp = () => Date.now().toString(36);
  const say = (text, key, name) => narrate({ campaignId, text, voiceKey: key, fileName: `recap-${session.id}-${name}-${stamp()}` });
  const draw = (shot) => drawScene({
    id: `recap_${session.id}_${shot.id}_${stamp()}`,
    prompt: cartoonShotPrompt(shot),
    about: cartoonShotText(shot)
  });
  // The video model is told what moves, by role, not by a name it might know from elsewhere.
  const animate = (shot, imageUrl, onStatus) => animateToClip({
    campaignId, imageUrl, prompt: plainNames(cartoonMotionPrompt(shot), cartoonShotText(shot)), fileName: `recap-${session.id}-${shot.id}-${stamp()}`, onStatus
  });

  // Voices, then drawings, then clips. Each result is saved as it lands, so a
  // failure part-way keeps what was made and the next run picks up from there.
  const shoot = () => run('shoot', async () => {
    // A different narrator than last time: his takes are all read again.
    let work = { shots: [...shots], voice: { ...cartoonNarration(recap), voiceKey } };
    let saving = Promise.resolve();
    const commit = () => { const snapshot = work; saving = saving.then(() => save({ cartoon: snapshot })); return saving; };
    const patchShot = (id, patch) => { work = { ...work, shots: work.shots.map(s => (s.id === id ? { ...s, ...patch } : s)) }; return commit(); };
    const failed = [];
    const attempt = async (what, job) => { try { await job(); } catch (err) { failed.push(`${what} (${err.message || 'failed'})`); } };

    // 1. Voices: "Previously on…", one take per beat, the question, and each spoken line.
    const trailer = voiceKey === RECAP_VOICE_KEY;
    const takes = [...(work.voice.beats || [])];
    const stale = slides.map((s, i) => i).filter(i => !(takes[i]?.url && takes[i].line === slides[i].line));
    const lines = work.shots.filter(s => s.kind === 'line' && !s.audioUrl);
    const voiceJobs = (work.voice.introUrl ? 0 : 1) + stale.length + lines.length + (recap.question && work.voice.question !== recap.question ? 1 : 0);
    let voiced = 0;
    const voiceStep = () => setBusy(`shoot:Recording voices ${++voiced} of ${voiceJobs}…`);
    if (!work.voice.introUrl) {
      voiceStep();
      await attempt('the "Previously on" line', async () => {
        const intro = await say(`Previously on… ${campaign?.name || 'our story'}.`, voiceKey, 'c-intro');
        work = { ...work, voice: { ...work.voice, introUrl: intro.url } };
        await commit();
      });
    }
    for (const i of stale) {
      voiceStep();
      await attempt(`the narrator's beat ${i + 1}`, async () => {
        const take = await say(narrationScript([slides[i]], { trailer }), voiceKey, `c-beat${i}`);
        takes[i] = { url: take.url, duration: take.duration, line: slides[i].line };
        work = { ...work, voice: { ...work.voice, beats: slides.map((s, k) => takes[k] || null) } };
        await commit();
      });
    }
    if (recap.question && work.voice.question !== recap.question) {
      voiceStep();
      await attempt('the cliffhanger question', async () => {
        const ask = await say(recap.question, voiceKey, 'c-question');
        work = { ...work, voice: { ...work.voice, question: recap.question, questionUrl: ask.url, questionDuration: ask.duration } };
        await commit();
      });
    }
    for (const shot of lines) {
      voiceStep();
      await attempt(`${shot.speaker}'s line`, async () => {
        const line = await say(shot.line, shot.voiceKey || voiceForSpeaker(shot.speaker, voiceKeys), `c-line-${shot.id}`);
        await patchShot(shot.id, { audioUrl: line.url, duration: line.duration });
      });
    }

    // 2. Drawings.
    const toDraw = work.shots.filter(s => !s.imageUrl);
    let drawn = 0;
    if (toDraw.length) setBusy(`shoot:Drawing shots 0 of ${toDraw.length}… (about 30 seconds each)`);
    await pool(toDraw, shot => attempt(`drawing shot ${work.shots.findIndex(s => s.id === shot.id) + 1}`, async () => {
      const imageUrl = await draw(shot);
      await patchShot(shot.id, { imageUrl, videoUrl: '' });
      setBusy(`shoot:Drawing shots ${++drawn} of ${toDraw.length}…`);
    }));

    // 3. Clips.
    const toAnimate = work.shots.filter(s => s.imageUrl && !s.videoUrl);
    let animated = 0;
    if (toAnimate.length) setBusy(`shoot:Animating shots 0 of ${toAnimate.length}… (a minute or two each)`);
    await pool(toAnimate, shot => attempt(`animating shot ${work.shots.findIndex(s => s.id === shot.id) + 1}`, async () => {
      const clip = await animate(shot, shot.imageUrl);
      await patchShot(shot.id, { videoUrl: clip.url });
      setBusy(`shoot:Animating shots ${++animated} of ${toAnimate.length}…`);
    }));

    await saving;
    if (failed.length) notify.warning(`Shot what it could. Still missing: ${failed.join('; ')}. Press "Shoot it" again to retry those.`);
    else notify.success('The cartoon is shot. Preview it below.');
  });

  // One shot at a time.
  const update = (id, patch) => save({ cartoon: { ...cartoon, shots: shots.map(s => (s.id === id ? { ...s, ...patch } : s)) } });
  const redraw = (shot) => run(`draw-${shot.id}`, async () => { await update(shot.id, { imageUrl: await draw(shot), videoUrl: '' }); });
  const reanimate = (shot) => run(`animate-${shot.id}`, async () => {
    const clip = await animate(shot, shot.imageUrl, label => setBusy(`animate-${shot.id}:${label}`));
    await update(shot.id, { videoUrl: clip.url });
  });
  const remove = (shot) => save({ cartoon: { ...cartoon, shots: shots.filter(s => s.id !== shot.id) } });

  const shooting = busy?.startsWith('shoot');
  const working = (shot) => busy === `draw-${shot.id}` || busy?.startsWith(`animate-${shot.id}`);
  const small = 'text-[11px] text-lr-text-dim hover:text-white inline-flex items-center gap-1 disabled:opacity-40';

  return (
    <div className="space-y-3 p-3 rounded-lg border border-white/10 bg-black/20">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 min-w-[220px] text-[11px] text-lr-text-dim leading-relaxed">
          The script above is storyboarded into short shots, each drawn and animated for this recap. The narrator is recorded beat by beat,
          so the picture changes on his words, and a character or two speaks a line. The film and comic looks keep their own pictures.
        </p>
        <button type="button" className="btn btn-secondary btn-sm inline-flex items-center gap-1" onClick={storyboard} disabled={!!busy}
          title={shots.length ? 'Writes a new shot list from the script. The shots below, and their art, are replaced.' : 'Writes the shot list from the script (text only, no art yet)'}>
          {busy === 'storyboard' ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />}
          {shots.length ? 'Re-storyboard' : 'Storyboard it'}
        </button>
        {shots.length > 0 && (
          <button type="button" className="btn btn-primary btn-sm inline-flex items-center gap-1" onClick={shoot} disabled={!!busy || !todo}
            title="Records the voices, then draws and animates every shot that is still missing. Safe to press again: it only makes what is not there yet.">
            {shooting ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
            {shooting ? 'Shooting…' : todo ? 'Shoot it' : 'All shot'}
          </button>
        )}
      </div>

      {shots.length > 0 && (
        <p className="text-[11px] text-lr-text-dim">
          {shooting
            ? busy.slice('shoot:'.length) || 'Starting…'
            : todo
              ? `Still to make: ${needs.voice} voice take${needs.voice === 1 ? '' : 's'}, ${needs.draw} drawing${needs.draw === 1 ? '' : 's'}, ${needs.animate} clip${needs.animate === 1 ? '' : 's'}. The clips cost about $${(needs.animate * CLIP_COST).toFixed(2)}, plus an image for each drawing; about ${minutes} minute${minutes === 1 ? '' : 's'}.`
              : `${shots.length} shots, all drawn, animated and voiced.`}
        </p>
      )}

      {slides.map((slide, i) => {
        const own = shots.filter(s => s.beat === i);
        if (!own.length) return null;
        return (
          <div key={i} className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-lr-text-dim truncate">Beat {i + 1}: {slide.line}</p>
            {own.map(shot => (
              <div key={shot.id} className="flex gap-2 items-start">
                <div className="w-24 h-14 shrink-0 rounded-md overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                  {shot.videoUrl ? <video src={shot.videoUrl} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                    : shot.imageUrl ? <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                    : shot.kind === 'line' ? <MessageSquare size={18} className="text-lr-text-dim" /> : <ImageIcon size={18} className="text-lr-text-dim" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  {shot.kind === 'line' ? (
                    <div className="flex flex-wrap gap-1.5">
                      <input
                        key={`${shot.id}-who-${shot.speaker}`}
                        type="text"
                        defaultValue={shot.speaker}
                        aria-label="Who speaks"
                        onBlur={(e) => { const speaker = e.target.value.trim(); if (speaker && speaker !== shot.speaker) update(shot.id, { speaker, featuring: [speaker] }); }}
                        className="w-28 p-1.5 rounded bg-black/20 border border-white/10 text-white text-xs"
                      />
                      <input
                        key={`${shot.id}-line-${shot.line}`}
                        type="text"
                        defaultValue={shot.line}
                        maxLength={140}
                        aria-label="What they say"
                        // New words need a new recording.
                        onBlur={(e) => { const line = e.target.value.trim(); if (line && line !== shot.line) update(shot.id, { line, audioUrl: '', duration: 0 }); }}
                        className="flex-1 min-w-[160px] p-1.5 rounded bg-black/20 border border-white/10 text-white text-xs"
                      />
                      <select
                        value={shot.voiceKey || voiceForSpeaker(shot.speaker, voiceKeys)}
                        aria-label="Voice"
                        onChange={(e) => update(shot.id, { voiceKey: e.target.value, audioUrl: '', duration: 0 })}
                        className="p-1.5 rounded bg-black/20 border border-white/10 text-white text-xs"
                      >
                        {CHARACTER_VOICES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <textarea
                      key={`${shot.id}-${shot.description}`}
                      defaultValue={shot.description}
                      rows={2}
                      aria-label="What the shot shows"
                      onBlur={(e) => { const description = e.target.value.trim(); if (description && description !== shot.description) update(shot.id, { description }); }}
                      className="w-full p-1.5 rounded bg-black/20 border border-white/10 text-white text-xs resize-y"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {shot.camera && shot.kind !== 'line' && <span className="text-[11px] text-lr-text-dim italic">{shot.camera}</span>}
                    {shot.kind === 'line' && <span className="text-[11px] text-lr-text-dim">{shot.audioUrl ? `Spoken (${Math.round(shot.duration || 0)}s)` : 'Not recorded yet'}</span>}
                    <button type="button" className={small} onClick={() => redraw(shot)} disabled={!!busy}>
                      {busy === `draw-${shot.id}` ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      {busy === `draw-${shot.id}` ? 'Drawing…' : shot.imageUrl ? 'Redraw' : 'Draw'}
                    </button>
                    <button type="button" className={small} onClick={() => reanimate(shot)} disabled={!!busy || !shot.imageUrl}>
                      {busy?.startsWith(`animate-${shot.id}`) ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
                      {busy?.startsWith(`animate-${shot.id}`) ? (busy.split(':')[1] || 'Animating…') : shot.videoUrl ? 'Re-animate' : 'Animate'}
                    </button>
                    <button type="button" className={small} onClick={() => remove(shot)} disabled={!!busy || working(shot)} title="Take this shot out of the cartoon">
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
