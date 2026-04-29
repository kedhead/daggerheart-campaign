// History list / sidebar. Reads from the canonical rolls collection.
// Variants:
//   "list"    — vertical list (default, used in popovers)
//   "sidebar" — pinned floating sidebar with toggle (used on battle map view)

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useRollHistory } from './useRollHistory.js';
import { clearRollHistory } from './service.js';

function summarize(roll) {
  if (roll.system === 'daggerheart') {
    const hope = roll.dice?.find(d => d.groupId === 'hope')?.value;
    const fear = roll.dice?.find(d => d.groupId === 'fear')?.value;
    return (
      <span className="rh-summary">
        <span className="rh-hope">{hope}</span>
        <span className="rh-vs">/</span>
        <span className="rh-fear">{fear}</span>
        <span className="rh-eq">= {roll.total}</span>
        <span className={`rh-outcome rh-outcome-${roll.outcome}`}>
          {roll.outcome === 'hope' ? '✨' : '💀'}
        </span>
      </span>
    );
  }
  if (roll.system === 'dnd5e') {
    const values = (roll.dice || []).map(d => d.value).join(', ');
    return (
      <span className="rh-summary">
        d20:{values} = <strong>{roll.total}</strong>
        {roll.flags?.isCrit && ' 🎯'}
        {roll.flags?.isCritFail && ' 💥'}
      </span>
    );
  }
  if (roll.system === 'starwarsd6') {
    const values = (roll.dice || []).map(d => d.value).join(',');
    return (
      <span className="rh-summary">
        [{values}] = <strong>{roll.total}</strong>
        {roll.flags?.complication && ' ⚠️'}
      </span>
    );
  }
  const values = (roll.dice || []).map(d => d.value).join(',');
  return (
    <span className="rh-summary">
      [{values}] = <strong>{roll.total}</strong>
      {roll.flags?.isCrit && ' 🎯'}
      {roll.flags?.isCritFail && ' 💥'}
    </span>
  );
}

export default function RollHistory({ campaignId, count = 50, variant = 'list', isDM = false, compact = false }) {
  const { currentUser } = useAuth();
  const { rolls, loading } = useRollHistory(campaignId, count);
  const [open, setOpen] = useState(true);
  const [clearing, setClearing] = useState(false);

  const visible = rolls.filter(r => !r.isPrivate || r.rollerId === currentUser?.uid || isDM);

  const handleClear = async () => {
    if (!isDM) return;
    if (!window.confirm('Clear all roll history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await clearRollHistory(campaignId);
    } finally {
      setClearing(false);
    }
  };

  const inner = (
    <>
      <div className="rh-header">
        <span>Roll History</span>
        {isDM && (
          <button
            type="button"
            className="rh-clear-btn"
            onClick={handleClear}
            disabled={clearing || visible.length === 0}
            title="Clear history"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <div className={`rh-list ${compact ? 'compact' : ''}`}>
        {loading && <div className="rh-empty">Loading…</div>}
        {!loading && visible.length === 0 && <div className="rh-empty">No rolls yet</div>}
        {visible.map(r => (
          <div
            key={r.id}
            className={`rh-item ${r.outcome ? `outcome-${r.outcome}` : ''}`}
            style={{ borderLeftColor: r.rollerColor || '#888' }}
          >
            <div className="rh-roller" style={{ color: r.rollerColor || undefined }}>
              {r.rollerName}{r.label ? ` — ${r.label}` : ''}
            </div>
            {summarize(r)}
          </div>
        ))}
      </div>
    </>
  );

  if (variant === 'sidebar') {
    return (
      <div className={`roll-history-sidebar ${open ? 'open' : ''}`}>
        <button
          type="button"
          className="roll-history-toggle"
          onClick={() => setOpen(o => !o)}
          title={open ? 'Hide history' : 'Show history'}
        >
          {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        {inner}
      </div>
    );
  }

  return <div className="roll-history">{inner}</div>;
}
