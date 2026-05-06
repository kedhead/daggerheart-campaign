export default function PortalSlotTracker({ slots, label, activeColor, inactiveColor, onToggle }) {
  const activeCount = slots.filter(Boolean).length;

  return (
    <div className="lrp-slots-section">
      <div className="lrp-slots-label-row">
        <span className="lrp-slots-label">{label}</span>
        <span className="lrp-slots-count">{activeCount}/{slots.length}</span>
      </div>
      <div className="lrp-slots-row">
        {slots.map((marked, i) => (
          <button
            key={i}
            className={`lrp-slot${marked ? ' lrp-slot-marked' : ''}`}
            onClick={() => onToggle(i)}
            aria-label={`${label} slot ${i + 1}: ${marked ? 'marked' : 'clear'}`}
            aria-pressed={marked}
            style={{
              background: marked ? inactiveColor : activeColor,
              borderColor: marked ? 'rgba(255,255,255,0.08)' : activeColor,
              boxShadow: marked ? 'none' : `0 0 10px ${activeColor}50`,
              color: marked ? 'rgba(255,255,255,0.4)' : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  );
}
