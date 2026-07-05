import { useState } from 'react';
import { Plus, Minus, RotateCcw, Trash2, Hourglass } from 'lucide-react';
import { useCountdowns } from '../../../hooks/useCountdowns';

const KINDS = [
  { id: 'standard', label: 'Standard' },
  { id: 'progress', label: 'Progress' },
  { id: 'consequence', label: 'Consequence' },
  { id: 'long-term', label: 'Long-Term' },
];

const KIND_COLORS = {
  standard: '#94a3b8',
  progress: '#4ade80',
  consequence: '#f87171',
  'long-term': '#c8a44e',
};

export default function CountdownsPanel({ campaign }) {
  const { countdowns, loading, addCountdown, tick, resetCountdown, removeCountdown } = useCountdowns(campaign?.id);
  const [name, setName] = useState('');
  const [max, setMax] = useState(4);
  const [kind, setKind] = useState('standard');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCountdown(name, max, kind);
    setName('');
    setMax(4);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Countdown name…"
          style={{ flex: '2 1 120px', minWidth: 0, padding: '0.35rem 0.5rem', fontSize: '0.8rem', background: 'var(--bg-tertiary, rgba(0,0,0,0.25))', border: '1px solid var(--border, rgba(255,255,255,0.1))', borderRadius: 6, color: 'inherit' }}
        />
        <input
          type="number"
          min={1}
          max={20}
          value={max}
          onChange={e => setMax(e.target.value)}
          title="Starting value"
          style={{ width: 52, padding: '0.35rem 0.4rem', fontSize: '0.8rem', background: 'var(--bg-tertiary, rgba(0,0,0,0.25))', border: '1px solid var(--border, rgba(255,255,255,0.1))', borderRadius: 6, color: 'inherit' }}
        />
        <select
          value={kind}
          onChange={e => setKind(e.target.value)}
          style={{ flex: '1 1 90px', padding: '0.35rem 0.4rem', fontSize: '0.8rem', background: 'var(--bg-tertiary, rgba(0,0,0,0.25))', border: '1px solid var(--border, rgba(255,255,255,0.1))', borderRadius: 6, color: 'inherit' }}
        >
          {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <button type="submit" className="gm-mini-filter-btn" style={{ padding: '0.35rem 0.6rem' }} title="Add countdown">
          <Plus size={14} />
        </button>
      </form>

      {/* List */}
      <div className="gm-mini-list" style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div className="gm-mini-empty">Loading…</div>
        ) : countdowns.length === 0 ? (
          <div className="gm-mini-empty">
            <Hourglass size={22} style={{ opacity: 0.4 }} />
            <span>No countdowns. Add one for a looming threat or long-term project.</span>
          </div>
        ) : (
          countdowns.map(cd => {
            const color = KIND_COLORS[cd.kind] || KIND_COLORS.standard;
            const done = cd.value === 0;
            return (
              <div key={cd.id} className="gm-mini-item" style={{ alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="gm-mini-item-name" style={done ? { color: '#f87171' } : undefined}>
                    {cd.name} {done && '— TRIGGERED!'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 3 }}>
                    <span style={{ fontSize: '0.68rem', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cd.kind}</span>
                    {/* Segment pips */}
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: cd.max }, (_, i) => (
                        <span
                          key={i}
                          style={{
                            width: 9, height: 9, borderRadius: 2,
                            background: i < cd.value ? color : 'transparent',
                            border: `1px solid ${color}`,
                            opacity: i < cd.value ? 1 : 0.35,
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.72rem', opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{cd.value}/{cd.max}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button className="gm-mini-filter-btn" onClick={() => tick(cd.id, -1)} title="Tick down" disabled={cd.value === 0}>
                    <Minus size={12} />
                  </button>
                  <button className="gm-mini-filter-btn" onClick={() => tick(cd.id, 1)} title="Tick up" disabled={cd.value >= cd.max}>
                    <Plus size={12} />
                  </button>
                  <button className="gm-mini-filter-btn" onClick={() => resetCountdown(cd.id)} title="Reset">
                    <RotateCcw size={12} />
                  </button>
                  <button className="gm-mini-filter-btn" onClick={() => removeCountdown(cd.id)} title="Delete" style={{ color: '#f87171' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
