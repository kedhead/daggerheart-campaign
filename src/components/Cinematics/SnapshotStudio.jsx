import { useEffect, useMemo, useState } from 'react';
import { Camera, Download, ExternalLink, Eye, Loader2, Monitor, RotateCcw, Trash2, Wand2 } from 'lucide-react';
import Modal from '../Modal';
import CinematicStage from './CinematicStage';
import useShotArt from './useShotArt';
import { defaultSnapshotCast, snapshotPrompt } from './cinematicPlan';
import { playOnMonitor, openMonitorWindow } from './cinematicChannel';
import { watchSnapshots, createSnapshot, deleteSnapshot } from '../../services/snapshotStore';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useNotify } from '../../contexts/ToastContext';

const input = 'w-full p-2 rounded-lg bg-black/25 border border-white/10 text-white text-sm';
const IDEAS = [
  'Everyone sitting around a candlelit tavern table, laughing over drinks and a half-eaten feast',
  'The party resting around a campfire under the stars, sharing stories',
  'Everyone posing triumphantly over the defeated monster, like a victory portrait',
  'The party crammed into a tiny rowboat in a storm, soaked and arguing'
];

/**
 * Scene pictures: pick who is in it, describe the moment, and get one
 * illustrated still of the campaign's own characters, drawn from their
 * portraits (and any transformation they carry). Each picture is saved in
 * a gallery and can be shown full screen on the battle map monitor.
 */
export default function SnapshotStudio({ isOpen, onClose, campaign, characters = [], npcs = [], adversaries = [], locations = [] }) {
  const campaignId = campaign?.id;
  const notify = useNotify();
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const { drawScene } = useShotArt({ campaign, characters, npcs, adversaries, getEffectiveKey });

  const [list, setList] = useState(null);
  const [listError, setListError] = useState('');
  useEffect(() => watchSnapshots(campaignId, setList, err => { setList([]); setListError(err.message || 'Could not load the scene pictures.'); }), [campaignId]);

  const [castIds, setCastIds] = useState(() => defaultSnapshotCast(characters));
  const [description, setDescription] = useState('');
  const [where, setWhere] = useState('');
  const [mood, setMood] = useState('');
  const [title, setTitle] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const everyone = useMemo(() => [
    ...characters.filter(e => e?.id && e.name).map(e => ({ ...e, group: 'Player characters', portrait: e.avatarUrl })),
    ...npcs.filter(e => e?.id && e.name).map(e => ({ ...e, group: 'NPCs', portrait: e.avatarUrl })),
    ...adversaries.filter(e => e?.id && e.name).map(e => ({ ...e, group: 'Adversaries', portrait: e.imageUrl }))
  ], [characters, npcs, adversaries]);
  const byId = (id) => everyone.find(e => e.id === id);
  // Up to eight people, each drawn from their own portrait.
  const MAX_PEOPLE = 8;
  const toggle = (id) => setCastIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : ids.length >= MAX_PEOPLE ? ids : [...ids, id]));
  const groups = ['Player characters', 'NPCs', 'Adversaries'].map(g => [g, everyone.filter(e => e.group === g)]).filter(([, l]) => l.length);
  const crowded = castIds.length > 6;
  const full = castIds.length >= MAX_PEOPLE;

  const draw = async (from = null) => {
    const ask = from || { prompt: description, castIds, where, mood, title };
    if (!String(ask.prompt || '').trim()) { notify.error('Describe the scene first.'); return; }
    setDrawing(true);
    try {
      let told = null;
      const imageUrl = await drawScene({
        id: `snapshot_${Date.now().toString(36)}`,
        prompt: snapshotPrompt(ask.prompt, { where: ask.where, locations, mood: ask.mood }),
        about: ask.prompt,
        cast: ask.castIds,
        room: 8,
        scenery: ask.castIds.length === 0,
        onTold: (info) => { told = info; }
      });
      await createSnapshot(campaignId, { title: String(ask.title || '').trim(), prompt: ask.prompt.trim(), castIds: ask.castIds, where: ask.where || '', mood: ask.mood || '', imageUrl, drawnWith: told });
      notify.success('Scene drawn and saved.');
    } catch (err) {
      notify.error(err.message || 'Could not draw that scene.');
    } finally {
      setDrawing(false);
    }
  };

  const reuse = (s) => {
    setDescription(s.prompt || ''); setCastIds(s.castIds || []); setWhere(s.where || ''); setMood(s.mood || ''); setTitle(s.title || '');
    document.getElementById('snapshot-form')?.scrollIntoView({ behavior: 'smooth' });
  };
  const show = async (s) => {
    try {
      await playOnMonitor(campaignId, 'still', { imageUrl: s.imageUrl, title: s.title || '' });
      notify.success('Showing on the monitor. Press Skip there, or stop it from here, to take it down.');
    } catch (err) {
      notify.error(err.message || 'Could not reach the monitor.');
    }
  };
  const remove = async (s) => {
    setConfirming(null);
    try { await deleteSnapshot(campaignId, s.id); } catch (err) { notify.error(err.message || 'Could not delete it.'); }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Scene pictures" size="large">
        <div className="space-y-5">
          <form id="snapshot-form" className="space-y-3 p-3 rounded-xl border border-white/10 bg-black/20" onSubmit={(e) => { e.preventDefault(); draw(); }}>
            <p className="text-xs text-lr-text-dim">
              Pick who is in it, say what is happening, and get one illustrated still of your own characters, drawn from their portraits.
              Show it on the monitor whenever you like.
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">Who is in it</span>
                <span className="text-[11px] text-lr-text-dim">
                  {castIds.length === 0 ? 'Nobody: just the place' : `${castIds.length} of ${MAX_PEOPLE} chosen`}
                  {' · '}
                  <button type="button" className="underline hover:text-white" onClick={() => setCastIds(defaultSnapshotCast(characters))}>The party</button>
                  {' · '}
                  <button type="button" className="underline hover:text-white" onClick={() => setCastIds([])}>Nobody</button>
                </span>
              </div>
              {groups.map(([group, people]) => (
                <div key={group} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-lr-text-dim w-full sm:w-auto sm:mr-1">{group}</span>
                  {people.map(e => {
                    const on = castIds.includes(e.id);
                    return (
                      <button key={e.id} type="button" onClick={() => toggle(e.id)} aria-pressed={on}
                        title={e.portrait ? undefined : `${e.name} has no portrait, so they are drawn from their description and can look different each time.`}
                        className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border text-xs ${on ? 'border-lr-accent/60 bg-lr-accent/15 text-white' : 'border-white/10 bg-black/20 text-lr-text-dim hover:text-white'}`}>
                        {e.portrait
                          ? <img src={e.portrait} alt="" className="w-5 h-5 rounded-full object-cover" />
                          : <span className="w-5 h-5 rounded-full bg-white/10 inline-flex items-center justify-center text-[10px]">{e.name[0]}</span>}
                        {e.name}{e.deceased ? ' †' : ''}
                      </button>
                    );
                  })}
                </div>
              ))}
              {full && <p className="text-[11px] text-amber-300">That&apos;s the most a picture can hold: take someone out to add someone else.</p>}
              {crowded && !full && <p className="text-[11px] text-lr-text-dim">A big group: everyone is drawn from their own portrait, but faces get smaller. A wide scene (a long table, a camp) suits it best.</p>}
            </div>

            <label className="block text-xs text-lr-text-dim">
              What is happening
              <textarea className={`${input} mt-1`} rows={3} maxLength={800} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Everyone sitting around a candlelit tavern table, Pippin standing on his chair telling a story" />
            </label>
            {!description && (
              <div className="flex flex-wrap gap-1.5">
                {IDEAS.map(idea => (
                  <button key={idea} type="button" onClick={() => setDescription(idea)} className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 text-lr-text-dim hover:text-white">
                    {idea.split(',')[0]}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="block text-xs text-lr-text-dim">
                Where (optional)
                <input className={`${input} mt-1`} list="snapshot-places" maxLength={120} value={where} onChange={(e) => setWhere(e.target.value)} placeholder="The Gilded Goose tavern" />
              </label>
              <label className="block text-xs text-lr-text-dim">
                Mood (optional)
                <input className={`${input} mt-1`} maxLength={120} value={mood} onChange={(e) => setMood(e.target.value)} placeholder="warm, cozy, golden candlelight" />
              </label>
              <label className="block text-xs text-lr-text-dim">
                Title (optional)
                <input className={`${input} mt-1`} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Shown on the monitor" />
              </label>
            </div>
            <datalist id="snapshot-places">
              {locations.filter(l => l?.name).map(l => <option key={l.id || l.name} value={l.name} />)}
            </datalist>

            <button type="submit" className="w-full btn btn-primary inline-flex items-center justify-center gap-2" disabled={drawing || !description.trim()}>
              {drawing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {drawing ? 'Drawing… (about 30 seconds)' : 'Draw it'}
            </button>
          </form>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Camera size={16} /> Gallery</h3>
              <button type="button" className="text-xs text-lr-text-dim hover:text-white inline-flex items-center gap-1" onClick={() => openMonitorWindow(campaignId)}>
                <ExternalLink size={12} /> Open the monitor
              </button>
            </div>
            {listError && <p className="text-xs text-red-300">{listError}</p>}
            {list === null && <p className="text-xs text-lr-text-dim">Loading…</p>}
            {list?.length === 0 && <p className="text-xs text-lr-text-dim">No scene pictures yet.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(list || []).map(s => (
                <figure key={s.id} className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                  <button type="button" className="block w-full" onClick={() => setPreview({ id: `pv-${s.id}-${Date.now()}`, kind: 'still', data: { imageUrl: s.imageUrl, title: s.title } })} aria-label="Preview full screen">
                    <img src={s.imageUrl} alt={s.title || s.prompt} className="w-full aspect-video object-cover" loading="lazy" />
                  </button>
                  <figcaption className="p-2 space-y-1.5">
                    {s.title && <div className="text-sm font-bold text-white">{s.title}</div>}
                    <div className="text-[11px] text-lr-text-dim line-clamp-2" title={s.prompt}>{s.prompt}</div>
                    {(s.castIds || []).length > 0 && (
                      <div className="text-[11px] text-lr-text-dim">{(s.castIds || []).map(id => byId(id)?.name).filter(Boolean).join(', ')}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" className="btn btn-primary btn-sm inline-flex items-center gap-1" onClick={() => show(s)}><Monitor size={13} /> Show on monitor</button>
                      <button type="button" className="btn btn-ghost btn-sm inline-flex items-center gap-1" onClick={() => setPreview({ id: `pv-${s.id}-${Date.now()}`, kind: 'still', data: { imageUrl: s.imageUrl, title: s.title } })}><Eye size={13} /> Preview</button>
                      <button type="button" className="btn btn-ghost btn-sm inline-flex items-center gap-1" onClick={() => draw({ prompt: s.prompt, castIds: s.castIds || [], where: s.where, mood: s.mood, title: s.title })} disabled={drawing}
                        title="Draw the same scene again; the new one is added to the gallery"><RotateCcw size={13} /> Again</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => reuse(s)} title="Put its settings back in the form to change them">Edit</button>
                      <a className="btn btn-ghost btn-sm inline-flex items-center gap-1" href={s.imageUrl} target="_blank" rel="noreferrer" download><Download size={13} /></a>
                      {confirming === s.id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-300">
                          Delete?
                          <button type="button" className="btn btn-sm bg-red-500/80 hover:bg-red-500 text-white" onClick={() => remove(s)}>Yes</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(null)}>No</button>
                        </span>
                      ) : (
                        <button type="button" className="btn btn-ghost btn-sm text-lr-text-dim hover:text-red-300" onClick={() => setConfirming(s.id)} aria-label="Delete"><Trash2 size={13} /></button>
                      )}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>
      </Modal>
      {preview && <CinematicStage key={preview.id} cue={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
