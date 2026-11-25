import { useState } from 'react';
import { FlaskConical, Plus, Minus, Sparkles, Loader2, Dices, Trash2, Sprout, Pencil, Check, X } from 'lucide-react';
import {
  normalizeSatchel, addIngredient, adjustIngredient, buildBrewPrompt, parseConcoction,
  keepConcoction, takeDose, updateIngredient, removeIngredient, updateConcoction, removeConcoction, clearLog, MAX_DOSES
} from '../../utils/alchemy';
import { aiService } from '../../services/aiService';
import { textProvider } from '../../services/cinematicsGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useNotify } from '../../contexts/ToastContext';

const OUTCOME_STYLE = {
  hope: { label: 'With Hope', cls: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
  fear: { label: 'With Fear', cls: 'text-purple-300 border-purple-400/30 bg-purple-400/10' },
  crit: { label: 'Critical!', cls: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' }
};

const input = 'w-full p-2 rounded-lg bg-black/25 border border-white/10 text-white text-sm';

/**
 * The Alchemy homebrew module on a character sheet: a satchel of ingredients,
 * AI-brewed concoctions with a Hope effect and a Fear effect, and taking a
 * dose with the Duality dice. Shared by the full sheet and the player portal.
 *
 * @param {object} props
 * @param {(opts) => Promise<object>} props.roll - the untagged Duality roller: a dose
 *   resolves itself, so it earns neither Hope nor Fear
 */
export default function AlchemySatchel({ character, campaign, canEdit, updateCharacter, roll }) {
  const notify = useNotify();
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const satchel = normalizeSatchel(character?.satchel);
  const started = !!character?.satchel;

  const [draft, setDraft] = useState({ name: '', qty: 1, notes: '' });
  const [picked, setPicked] = useState([]);
  const [brewing, setBrewing] = useState(false);
  const [brew, setBrew] = useState(null); // the concoction being reviewed
  const [taking, setTaking] = useState(null);
  const [lastResult, setLastResult] = useState(null); // { id, outcome, effect, hope, fear }
  const [editing, setEditing] = useState(null); // { id, kind: 'ingredient' | 'concoction', ...fields being changed }
  const [confirming, setConfirming] = useState(null); // id of what is about to be thrown out

  const save = (next) => updateCharacter?.(character.id, { satchel: next });

  if (!started) {
    return (
      <div className="p-5 rounded-xl border border-white/10 bg-black/20 text-center space-y-3">
        <FlaskConical className="mx-auto text-emerald-400" size={28} />
        <p className="text-sm text-lr-text-muted">
          This character doesn't carry an alchemy satchel. Start one to collect ingredients and brew concoctions that can go
          very right, or very wrong.
        </p>
        {canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => save({ ingredients: [], concoctions: [], log: [] })}>
            Start a satchel
          </button>
        )}
      </div>
    );
  }

  const add = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    save(addIngredient(satchel, draft));
    setDraft({ name: '', qty: 1, notes: '' });
  };

  const togglePick = (id) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : p.length >= 5 ? p : [...p, id]));
  const chosen = satchel.ingredients.filter(i => picked.includes(i.id));

  const combine = async () => {
    setBrewing(true);
    try {
      const { apiKey, provider } = textProvider(getEffectiveKey);
      const text = await aiService.generate(buildBrewPrompt(chosen, character), apiKey, provider);
      const result = parseConcoction(text, chosen);
      if (!result) throw new Error('The brew fizzled: the AI did not come back with a concoction. Try again.');
      setBrew(result);
    } catch (err) {
      notify.error(err.message || 'Could not brew that.');
    } finally {
      setBrewing(false);
    }
  };

  const keep = () => {
    save(keepConcoction(satchel, brew, picked));
    notify.success(`${brew.name} added to the satchel.`);
    setBrew(null);
    setPicked([]);
  };

  const dose = async (c) => {
    setTaking(c.id);
    try {
      const result = await roll({ label: `${character.name || 'Someone'} takes ${c.name}`, modifier: 0 });
      if (!result) throw new Error('The dice could not be rolled.');
      const { satchel: next, outcome, effect } = takeDose(satchel, c.id, result);
      await save(next);
      // The log entry's own id must not replace the concoction's: the card finds its result by it.
      setLastResult({ ...next.log[0], id: c.id, outcome, effect });
    } catch (err) {
      notify.error(err.message || 'Could not take a dose.');
    } finally {
      setTaking(null);
    }
  };

  const removeBrew = (id) => { save(removeConcoction(satchel, id)); setConfirming(null); if (lastResult?.id === id) setLastResult(null); };
  const removeIng = (id) => { save(removeIngredient(satchel, id)); setConfirming(null); setPicked(p => p.filter(x => x !== id)); };
  const startEdit = (kind, item) => { setConfirming(null); setEditing({ kind, ...item }); };
  const saveEdit = () => {
    if (!editing) return;
    const { kind, id, ...fields } = editing;
    save(kind === 'ingredient' ? updateIngredient(satchel, id, fields) : updateConcoction(satchel, id, fields));
    if (kind === 'ingredient' && !(Number(fields.qty) > 0)) setPicked(p => p.filter(x => x !== id));
    setEditing(null);
  };
  const field = (k) => ({ value: editing?.[k] ?? '', onChange: (e) => setEditing(d => ({ ...d, [k]: e.target.value })) });

  // "Throw out" asks once more before it goes.
  const ThrowOut = ({ id, name, onYes }) => (confirming === id ? (
    <span className="inline-flex items-center gap-1 text-xs text-red-300">
      Throw out {name}?
      <button type="button" className="btn btn-sm bg-red-500/80 hover:bg-red-500 text-white" onClick={onYes}>Yes</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(null)}>No</button>
    </span>
  ) : (
    <button type="button" className="btn btn-ghost btn-sm inline-flex items-center gap-1 text-lr-text-dim hover:text-red-300" onClick={() => setConfirming(id)} aria-label={`Throw out ${name}`}>
      <Trash2 size={14} /> Throw out
    </button>
  ));

  return (
    <div className="space-y-5">
      {/* ── Ingredients ── */}
      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Sprout size={16} className="text-emerald-400" /> Ingredients</h3>
        {satchel.ingredients.length === 0 && <p className="text-xs text-lr-text-dim">Empty. Add spores, herbs and reagents as you find them.</p>}
        <div className="space-y-1.5">
          {satchel.ingredients.map(i => {
            const on = picked.includes(i.id);
            if (editing?.kind === 'ingredient' && editing.id === i.id) {
              return (
                <div key={i.id} className="p-2 rounded-lg border border-emerald-400/40 bg-black/30 space-y-1.5">
                  <div className="grid grid-cols-[1fr_4rem] gap-2">
                    <input className={input} maxLength={80} aria-label="Ingredient name" {...field('name')} />
                    <input className={input} type="number" min="0" aria-label="Quantity" {...field('qty')} />
                  </div>
                  <input className={input} maxLength={300} placeholder="Notes (optional)" aria-label="Notes" {...field('notes')} />
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="btn btn-primary btn-sm inline-flex items-center gap-1" onClick={saveEdit} disabled={!String(editing.name || '').trim()}><Check size={14} /> Save</button>
                    <button type="button" className="btn btn-ghost btn-sm inline-flex items-center gap-1" onClick={() => setEditing(null)}><X size={14} /> Cancel</button>
                    <span className="flex-1" />
                    <ThrowOut id={i.id} name={i.name} onYes={() => { removeIng(i.id); setEditing(null); }} />
                  </div>
                </div>
              );
            }
            return (
              <div key={i.id} className={`flex items-start gap-2 p-2 rounded-lg border ${on ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/10 bg-black/20'}`}>
                {canEdit && (
                  <input type="checkbox" checked={on} onChange={() => togglePick(i.id)} className="mt-1" aria-label={`Use ${i.name} in a brew`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium">{i.name}</div>
                  {i.notes && <div className="text-xs text-lr-text-dim">{i.notes}</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canEdit && <button type="button" className="p-1 text-lr-text-dim hover:text-white" onClick={() => save(adjustIngredient(satchel, i.id, -1))} aria-label="One fewer"><Minus size={14} /></button>}
                  <span className="text-sm font-mono text-white w-6 text-center">{i.qty}</span>
                  {canEdit && <button type="button" className="p-1 text-lr-text-dim hover:text-white" onClick={() => save(adjustIngredient(satchel, i.id, 1))} aria-label="One more"><Plus size={14} /></button>}
                  {canEdit && (
                    <button type="button" className="p-1 ml-1 text-lr-text-dim hover:text-white" onClick={() => startEdit('ingredient', { id: i.id, name: i.name, qty: i.qty, notes: i.notes || '' })}
                      aria-label={`Edit or remove ${i.name}`} title="Edit or remove"><Pencil size={14} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canEdit && (
          <form onSubmit={add} className="grid grid-cols-[1fr_4rem] gap-2 pt-1">
            <input className={input} placeholder="Ingredient (e.g. Glowcap spores)" value={draft.name} maxLength={80}
              onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} />
            <input className={input} type="number" min="1" value={draft.qty} aria-label="Quantity"
              onChange={(e) => setDraft(d => ({ ...d, qty: e.target.value }))} />
            <input className={`${input} col-span-2`} placeholder="Notes: where it came from, what it seems to do (optional)" value={draft.notes} maxLength={300}
              onChange={(e) => setDraft(d => ({ ...d, notes: e.target.value }))} />
            <button type="submit" className="btn btn-secondary btn-sm col-span-2 inline-flex items-center justify-center gap-1" disabled={!draft.name.trim()}>
              <Plus size={14} /> Add to satchel
            </button>
          </form>
        )}

        {canEdit && satchel.ingredients.length > 1 && (
          <button
            type="button"
            className="w-full btn btn-primary inline-flex items-center justify-center gap-2"
            onClick={combine}
            disabled={brewing || chosen.length < 2}
          >
            {brewing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {brewing ? 'Brewing…' : chosen.length < 2 ? 'Tick 2–5 ingredients to combine' : `Combine ${chosen.length} ingredients`}
          </button>
        )}
      </section>

      {/* ── A fresh brew, to review before keeping ── */}
      {brew && (
        <section className="p-3 rounded-xl border border-emerald-400/40 bg-emerald-400/5 space-y-2">
          <div className="text-xs uppercase tracking-widest text-emerald-300 font-bold">Fresh brew: tweak anything, then keep it</div>
          <input className={`${input} font-bold`} value={brew.name} onChange={(e) => setBrew(b => ({ ...b, name: e.target.value }))} aria-label="Name" />
          <textarea className={input} rows={2} value={brew.description} onChange={(e) => setBrew(b => ({ ...b, description: e.target.value }))} aria-label="Description" />
          {[['hopeEffect', 'With Hope'], ['fearEffect', 'With Fear'], ['critEffect', 'Critical']].map(([k, label]) => (
            <label key={k} className="block text-xs text-lr-text-dim">
              {label}
              <textarea className={`${input} mt-1`} rows={2} value={brew[k]} onChange={(e) => setBrew(b => ({ ...b, [k]: e.target.value }))} />
            </label>
          ))}
          <label className="flex items-center gap-2 text-xs text-lr-text-dim">
            Doses
            <input className={`${input} w-16`} type="number" min="1" max="5" value={brew.doses}
              onChange={(e) => { const d = Math.max(1, Math.min(5, Number(e.target.value) || 1)); setBrew(b => ({ ...b, doses: d, maxDoses: d })); }} />
          </label>
          <p className="text-[11px] text-lr-text-dim">Keeping it uses one of each: {brew.ingredients.join(', ')}.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={keep}>Keep it</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={combine} disabled={brewing}>Brew again</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBrew(null)}>Discard</button>
          </div>
        </section>
      )}

      {/* ── Concoctions ── */}
      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><FlaskConical size={16} className="text-purple-300" /> Concoctions</h3>
        {satchel.concoctions.length === 0 && <p className="text-xs text-lr-text-dim">Nothing brewed yet.</p>}
        {satchel.concoctions.map(c => {
          const result = lastResult?.id === c.id ? lastResult : null;
          if (editing?.kind === 'concoction' && editing.id === c.id) {
            return (
              <div key={c.id} className="p-3 rounded-xl border border-purple-400/40 bg-black/30 space-y-2">
                <div className="text-xs uppercase tracking-widest text-purple-300 font-bold">Editing {c.name}</div>
                <input className={`${input} font-bold`} maxLength={80} aria-label="Name" {...field('name')} />
                <textarea className={input} rows={2} maxLength={400} aria-label="Description" placeholder="Description (optional)" {...field('description')} />
                {[['hopeEffect', 'With Hope'], ['fearEffect', 'With Fear'], ['critEffect', 'Critical (optional)']].map(([k, label]) => (
                  <label key={k} className="block text-xs text-lr-text-dim">
                    {label}
                    <textarea className={`${input} mt-1`} rows={2} maxLength={400} {...field(k)} />
                  </label>
                ))}
                <label className="flex items-center gap-2 text-xs text-lr-text-dim">
                  Doses left
                  <input className={`${input} w-16`} type="number" min="0" max={MAX_DOSES} {...field('doses')} />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn btn-primary btn-sm inline-flex items-center gap-1" onClick={saveEdit}
                    disabled={!String(editing.name || '').trim() || !String(editing.hopeEffect || '').trim() || !String(editing.fearEffect || '').trim()}>
                    <Check size={14} /> Save
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm inline-flex items-center gap-1" onClick={() => setEditing(null)}><X size={14} /> Cancel</button>
                  <span className="flex-1" />
                  <ThrowOut id={c.id} name={c.name} onYes={() => { removeBrew(c.id); setEditing(null); }} />
                </div>
              </div>
            );
          }
          return (
            <div key={c.id} className="p-3 rounded-xl border border-white/10 bg-black/20 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-white">{c.name}</div>
                  {c.description && <div className="text-xs text-lr-text-muted italic">{c.description}</div>}
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono ${c.doses > 0 ? 'bg-white/10 text-white' : 'bg-red-500/15 text-red-300'}`}>
                  {c.doses > 0 ? `${c.doses} dose${c.doses === 1 ? '' : 's'}` : 'Empty'}
                </span>
              </div>
              <div className="text-xs space-y-1 leading-relaxed">
                <p><span className="font-bold text-amber-300">With Hope:</span> <span className="text-lr-text-muted">{c.hopeEffect}</span></p>
                <p><span className="font-bold text-purple-300">With Fear:</span> <span className="text-lr-text-muted">{c.fearEffect}</span></p>
                {c.critEffect && <p><span className="font-bold text-emerald-300">Critical:</span> <span className="text-lr-text-muted">{c.critEffect}</span></p>}
              </div>
              {result && (
                <div className={`p-2 rounded-lg border text-sm ${OUTCOME_STYLE[result.outcome].cls}`}>
                  <div className="font-bold">
                    {OUTCOME_STYLE[result.outcome].label}
                    {result.hope != null && <span className="font-mono font-normal opacity-80"> · Hope {result.hope} / Fear {result.fear}</span>}
                  </div>
                  <div className="text-white/90">{result.effect}</div>
                </div>
              )}
              {canEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn btn-primary btn-sm inline-flex items-center gap-1" onClick={() => dose(c)}
                    disabled={!campaign?.id || taking === c.id || !(c.doses > 0)}>
                    {taking === c.id ? <Loader2 size={14} className="animate-spin" /> : <Dices size={14} />} Take a dose
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm inline-flex items-center gap-1"
                    onClick={() => startEdit('concoction', { id: c.id, name: c.name, description: c.description || '', hopeEffect: c.hopeEffect, fearEffect: c.fearEffect, critEffect: c.critEffect || '', doses: c.doses })}>
                    <Pencil size={14} /> Edit
                  </button>
                  <ThrowOut id={c.id} name={c.name} onYes={() => removeBrew(c.id)} />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {satchel.log.length > 0 && (
        <section className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-lr-text-dim font-bold">Recent doses</h3>
            {canEdit && (confirming === 'log' ? (
              <span className="inline-flex items-center gap-1 text-xs text-red-300">
                Clear the log?
                <button type="button" className="btn btn-sm bg-red-500/80 hover:bg-red-500 text-white" onClick={() => { save(clearLog(satchel)); setConfirming(null); setLastResult(null); }}>Yes</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(null)}>No</button>
              </span>
            ) : (
              <button type="button" className="text-xs text-lr-text-dim hover:text-white" onClick={() => setConfirming('log')}>Clear</button>
            ))}
          </div>
          {satchel.log.slice(0, 6).map(e => (
            <p key={e.id} className="text-xs text-lr-text-muted">
              <span className="text-white">{e.concoction}</span> · {OUTCOME_STYLE[e.outcome]?.label || e.outcome}: {e.effect}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
