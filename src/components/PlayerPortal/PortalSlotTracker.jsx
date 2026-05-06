// Sequential slot track matching the Lorelich design.
// `filled` = number of active slots (integer), `max` = total slots.
// Clicking a filled slot un-fills from there; clicking empty fills up to it.

const PALETTE = {
  gold:   { fg: '#eab308', on: 'linear-gradient(135deg, #f5c543, #d69e2e)', glow: 'rgba(234,179,8,0.45)',  border: 'rgba(234,179,8,0.95)',  off: 'rgba(255,255,255,0.06)' },
  hp:     { fg: '#f5c543', on: 'linear-gradient(135deg, #f5c543, #c8881d)', glow: 'rgba(234,179,8,0.4)',   border: 'rgba(234,179,8,0.95)',  off: 'rgba(255,255,255,0.06)' },
  stress: { fg: '#a78bfa', on: 'linear-gradient(135deg, #a78bfa, #7c3aed)', glow: 'rgba(139,92,246,0.45)', border: 'rgba(139,92,246,0.95)', off: 'rgba(255,255,255,0.06)' },
  armor:  { fg: '#60a5fa', on: 'linear-gradient(135deg, #60a5fa, #2563eb)', glow: 'rgba(59,130,246,0.45)', border: 'rgba(59,130,246,0.95)',  off: 'rgba(59,130,246,0.06)' },
};

export default function PortalSlotTracker({ label, filled, max, color = 'gold', right, onToggle }) {
  const p = PALETTE[color] || PALETTE.gold;

  return (
    <div>
      <div className="lrp-slot-track-label-row">
        <span className="lrp-slot-track-label" style={{ color: p.fg }}>
          {label}
        </span>
        <span className="lrp-slot-track-count">
          {right || `${filled}/${max}`}
        </span>
      </div>
      <div className="lrp-slot-track-row">
        {Array.from({ length: max }, (_, i) => {
          const on = i < filled;
          return (
            <button
              key={i}
              className="lrp-slot"
              onClick={() => onToggle && onToggle(i, on)}
              aria-label={`${label} slot ${i + 1}: ${on ? 'filled' : 'empty'}`}
              aria-pressed={on}
              style={{
                background: on ? p.on : p.off,
                boxShadow: on
                  ? `0 0 8px ${p.glow}, inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 1px ${p.border}`
                  : `inset 0 0 0 1.5px ${color === 'armor' ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.13)'}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
