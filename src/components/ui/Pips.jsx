export default function Pips({
  filled,
  total,
  color = 'var(--primary)',
  emptyColor = 'rgba(255,255,255,0.05)',
  size = 18,
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            background: i < filled ? color : emptyColor,
            border: '1px solid var(--line-strong)',
            borderRadius: 4,
            transform: 'rotate(45deg)',
            boxShadow: i < filled ? `0 0 8px ${color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}
