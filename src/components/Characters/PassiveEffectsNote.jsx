/**
 * One line under a stat block saying which passive domain cards are counting
 * toward it — "Includes Fortified Armor (+2 thresholds)" — and which aren't and
 * why — "Fortified Armor: needs armor equipped".
 *
 * A card like Fortified Armor used to silently do nothing when its condition
 * wasn't met, so players couldn't tell a bug from a rule.
 *
 * @param {Array<{name, active, reason, summary}>} effects - computeDefenses().passiveEffects
 */
export default function PassiveEffectsNote({ effects = [], style }) {
  if (!Array.isArray(effects) || effects.length === 0) return null;
  const active = effects.filter(e => e.active);
  const inactive = effects.filter(e => !e.active);
  return (
    <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-muted)', margin: '0.35rem 0.25rem 0', ...style }}>
      {active.length > 0 && (
        <div>
          Includes {active.map((e, i) => (
            <span key={e.name}>{i > 0 ? ', ' : ''}<strong style={{ color: 'var(--text)' }}>{e.name}</strong>{e.summary ? ` (${e.summary})` : ''}</span>
          ))}
        </div>
      )}
      {inactive.map(e => (
        <div key={e.name} style={{ color: 'var(--text-dim)' }}>
          {e.name}: {e.reason}
        </div>
      ))}
    </div>
  );
}
