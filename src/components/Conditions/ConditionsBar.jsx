import { useMemo, useRef, useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { CORE_CONDITIONS, UNIQUE_CONDITIONS, conditionInfo, conditionLabel, addCondition, removeCondition } from '../../data/daggerheartConditions';
import { useDialogFocus } from '../../hooks/useDialogFocus';

/**
 * A character's or adversary's conditions: chips, each opening what it does
 * and how it ends, and a picker with the three core conditions, every unique
 * condition the catalog's features impose, and any other by name.
 *
 * @param {object} props
 * @param {string[]} props.conditions
 * @param {(next: string[]) => void} [props.onChange] - absent: read only
 * @param {boolean} [props.forAdversary] - also offer conditions only adversaries get
 */
export default function ConditionsBar({ conditions = [], onChange, forAdversary = false, emptyText = 'No conditions' }) {
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [openChip, setOpenChip] = useState(null);
  const panel = useRef(null);
  useDialogFocus(panel, picking, () => setPicking(false));
  const list = (conditions || []).filter(Boolean);
  const has = (name) => list.some(c => conditionLabel(c).toLowerCase() === name.toLowerCase());

  const q = query.trim().toLowerCase();
  const match = (c) => !q || c.name.toLowerCase().includes(q) || (c.source || '').toLowerCase().includes(q) || c.effect.toLowerCase().includes(q);
  const core = CORE_CONDITIONS.filter(c => !has(c.name) && match(c));
  const unique = useMemo(() => UNIQUE_CONDITIONS.filter(c => (forAdversary || !c.adversary) && !has(c.name) && match(c)), [q, list.join('|'), forAdversary]); // eslint-disable-line react-hooks/exhaustive-deps
  // Offer the typed name as a new condition only when no listed name matches it,
  // so "pois" picks Poisoned rather than adding "Pois".
  const named = [...core, ...unique].filter(c => c.name.toLowerCase().includes(q));
  const custom = query.trim() && !named.length && !conditionInfo(query) && !has(query.trim()) ? query.trim() : '';

  const add = (name) => { onChange?.(addCondition(list, name)); setQuery(''); setPicking(false); };
  const remove = (name) => { onChange?.(removeCondition(list, name)); if (openChip === name) setOpenChip(null); };

  const Option = ({ c }) => (
    <button type="button" onClick={() => add(c.name)}
      className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 transition-colors">
      <span className="text-sm text-white font-medium">{c.name}</span>
      {c.source && <span className="text-[11px] text-lr-text-dim"> · {c.source}</span>}
      <span className="block text-[11px] text-lr-text-muted leading-snug">{c.effect}</span>
    </button>
  );

  const info = openChip ? conditionInfo(openChip) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {list.length === 0 && !onChange && <span className="text-xs text-lr-text-dim">{emptyText}</span>}
        {list.map(c => {
          const label = conditionLabel(c);
          const known = conditionInfo(c);
          return (
            <span key={label} className={`inline-flex items-center rounded-md text-xs border ${known?.core ? 'bg-sky-500/15 text-sky-200 border-sky-500/30' : 'bg-purple-500/20 text-purple-200 border-purple-500/30'}`}>
              <button type="button" className="pl-2 pr-1 py-0.5" onClick={() => setOpenChip(openChip === label ? null : label)}
                title={known ? `${known.effect} Ends: ${known.clear}` : 'A condition from a feature: see its text'} aria-expanded={openChip === label}>
                {label}
              </button>
              {onChange && (
                <button type="button" className="pr-1.5 pl-0.5 py-0.5 hover:text-white" onClick={() => remove(label)} aria-label={`Clear ${label}`}>
                  <X size={11} />
                </button>
              )}
            </span>
          );
        })}
        {onChange && (
          <button type="button" onClick={() => setPicking(p => !p)} aria-expanded={picking}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-dashed border-white/20 text-lr-text-dim hover:text-white hover:border-white/40">
            <Plus size={11} /> Condition
          </button>
        )}
      </div>

      {openChip && (
        <div className="text-[11px] leading-snug p-2 rounded bg-black/30 border border-white/10 text-lr-text-muted">
          <b className="text-white">{openChip}</b>
          {info ? (
            <>
              {info.source && <span className="text-lr-text-dim"> · {info.source}</span>}
              <span className="block">{info.effect}</span>
              <span className="block"><span className="text-lr-text-dim">Ends:</span> {info.clear}</span>
            </>
          ) : <span className="block">A condition from a feature: its effect is in that feature's text.</span>}
        </div>
      )}

      {picking && (
        <div ref={panel} className="p-2 rounded-lg border border-white/10 bg-[var(--bg-secondary,#15121f)] shadow-xl space-y-2 max-w-md">
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-lr-text-dim" />
            <input
              autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const first = named[0] || core[0] || unique[0]; if (first) add(first.name); else if (custom) add(custom); } }}
              placeholder="Search, or type a condition's name"
              aria-label="Search conditions"
              className="w-full pl-7 pr-2 py-1.5 rounded bg-black/30 border border-white/10 text-sm text-white focus:outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {custom && (
              <button type="button" onClick={() => add(custom)} className="w-full text-left px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-sm text-white">
                + Add &ldquo;{conditionLabel(custom)}&rdquo; <span className="text-[11px] text-lr-text-dim">(from a feature not listed here)</span>
              </button>
            )}
            {core.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-lr-text-dim font-bold px-2">Core</div>
                {core.map(c => <Option key={c.name} c={c} />)}
              </div>
            )}
            {unique.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-lr-text-dim font-bold px-2">Unique (from features)</div>
                {unique.map(c => <Option key={c.name} c={c} />)}
              </div>
            )}
            {!custom && core.length === 0 && unique.length === 0 && <p className="text-xs text-lr-text-dim px-2">Nothing matches.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
