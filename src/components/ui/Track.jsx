export default function Track({
  value,
  max,
  color = 'var(--primary)',
  label,
  showCount = true,
  height = 10,
}) {
  const safeMax = Math.max(1, max);
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
          {showCount && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
              <span style={{ color: 'var(--text-dim)' }}>/{max}</span>
            </span>
          )}
        </div>
      )}
      <div
        style={{
          height,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: height / 2,
          overflow: 'hidden',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}
