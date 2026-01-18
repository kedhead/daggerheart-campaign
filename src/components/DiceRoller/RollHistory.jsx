import { formatRollResult } from '../../hooks/useDiceRolls';
import './RollHistory.css';

export default function RollHistory({ rolls, loading, onClear, isDM, currentUserId }) {
  if (loading) {
    return (
      <div className="roll-history">
        <div className="roll-history-loading">Loading roll history...</div>
      </div>
    );
  }

  if (rolls.length === 0) {
    return (
      <div className="roll-history">
        <div className="roll-history-empty">
          No rolls yet. Roll some dice!
        </div>
      </div>
    );
  }

  const formatTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="roll-history">
      <div className="roll-history-header">
        <h4>Roll History</h4>
        {isDM && rolls.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <div className="roll-history-list">
        {rolls.map(roll => {
          const formatted = formatRollResult(roll);
          const isOwnRoll = roll.rollerId === currentUserId;

          return (
            <div
              key={roll.id}
              className={`roll-entry ${isOwnRoll ? 'own-roll' : ''} ${roll.isPrivate ? 'private-roll' : ''}`}
            >
              <div className="roll-entry-header">
                <span className="roller-name">{roll.rollerName}</span>
                <span className="roll-time">{formatTime(roll.timestamp)}</span>
              </div>

              {roll.label && (
                <div className="roll-label">{roll.label}</div>
              )}

              <div className="roll-result">
                <span className="roll-total">{formatted.primary}</span>
                <span className="roll-details">{formatted.secondary}</span>
              </div>

              {formatted.badge && (
                <span className={`roll-badge ${formatted.badgeClass}`}>
                  {formatted.badge}
                </span>
              )}

              {roll.isPrivate && (
                <span className="roll-private-badge">🔒 Private</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
