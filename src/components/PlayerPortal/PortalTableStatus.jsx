import { Skull, Hourglass } from 'lucide-react';
import { FEAR_MAX } from '../../utils/dualityAutomation';

/**
 * What the table can see, on the player's phone: the GM's Fear and any
 * countdowns the DM chose to show.
 *
 * Both come from playerDisplay/current — the document the TV display already
 * reads — so the DM's existing "show Fear" toggle governs this too, and
 * countdowns appear only once the DM marks them public (see utils/countdowns).
 * Renders nothing when there's nothing to show.
 *
 * @param {object} display - usePlayerDisplay().displayState
 */
export default function PortalTableStatus({ display }) {
  const showFear = display?.showFear !== false;
  const fear = Math.max(0, Math.min(FEAR_MAX, Number(display?.fearCount) || 0));
  const countdowns = Array.isArray(display?.publicCountdowns) ? display.publicCountdowns : [];

  if (!showFear && countdowns.length === 0) return null;

  return (
    <div
      aria-label="Table status"
      style={{
        margin: '12px 18px 0', padding: '10px 12px', borderRadius: 14,
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center',
        fontSize: '0.8rem',
      }}
    >
      {showFear && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#d8b4fe' }} title="The GM's Fear pool">
          <Skull size={14} aria-hidden="true" />
          <span>GM Fear</span>
          <strong style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem' }}>{fear}</strong>
        </span>
      )}
      {countdowns.map(cd => (
        <span
          key={cd.id}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: cd.value === 0 ? '#fca5a5' : '#e5e7eb' }}
          title={`${cd.name}: ${cd.value} of ${cd.max}`}
        >
          <Hourglass size={13} aria-hidden="true" />
          <span>{cd.name}</span>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {cd.value === 0 ? 'triggered' : `${cd.value}/${cd.max}`}
          </strong>
        </span>
      ))}
    </div>
  );
}
