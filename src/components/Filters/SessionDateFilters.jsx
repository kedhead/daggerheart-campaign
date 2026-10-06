import { CalendarClock, ScrollText, ArrowDownUp, X } from 'lucide-react';
import { ADDED_RANGES } from '../../utils/sessionLinks';

const selectStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line-strong)',
  color: 'var(--text)',
  borderRadius: 12,
  padding: '0.55rem 0.75rem',
  fontSize: '0.85rem',
  minHeight: 40,
  maxWidth: '100%',
};

function Field({ icon: Icon, label, children }) {
  return (
    <label className="flex items-center gap-2 min-w-0" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      <Icon size={14} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}

/**
 * Session / Added / Sort filters, shared by the NPC and Encounter pages.
 * The matching rules live in utils/sessionLinks.js.
 *
 * @param {Array<{id,label}>} sessionOptions - from sessionFilterOptions()
 * @param {boolean} [showSort] - the Encounter page has its own sort control
 */
export default function SessionDateFilters({
  sessionOptions = [], session, onSession, added, onAdded,
  sort, onSort, showSort = true, shown, total, noun = 'items',
}) {
  const active = session !== 'all' || added !== 'any';
  return (
    <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filters">
      <Field icon={ScrollText} label="Session">
        <select value={session} onChange={e => onSession(e.target.value)} style={selectStyle} aria-label="Filter by session">
          <option value="all">Any session</option>
          <option value="none">Not linked to a session</option>
          {sessionOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </Field>
      <Field icon={CalendarClock} label="Added">
        <select value={added} onChange={e => onAdded(e.target.value)} style={selectStyle} aria-label="Filter by date added">
          {ADDED_RANGES.map(r => <option key={r.id} value={r.id}>{r.id === 'any' ? 'Added any time' : `Added in the ${r.label.toLowerCase()}`}</option>)}
        </select>
      </Field>
      {showSort && (
        <Field icon={ArrowDownUp} label="Sort">
          <select value={sort} onChange={e => onSort(e.target.value)} style={selectStyle} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </Field>
      )}
      {typeof shown === 'number' && typeof total === 'number' && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} aria-live="polite">
          {shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`}
        </span>
      )}
      {active && (
        <button
          type="button"
          onClick={() => { onSession('all'); onAdded('any'); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--line)' }}
        >
          <X size={12} aria-hidden="true" /> Clear filters
        </button>
      )}
    </div>
  );
}

/** "Session" picker for an add/edit dialog. Saves as the entity's `sessionId`. */
export function SessionTagSelect({ sessionOptions = [], value, onChange }) {
  return (
    <label className="flex flex-wrap items-center gap-2 mb-4" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      <ScrollText size={14} aria-hidden="true" />
      <span>Session</span>
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={selectStyle}>
        <option value="">Not tied to a session</option>
        {sessionOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}
