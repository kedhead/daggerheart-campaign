const TONES = {
  neutral: { bg: 'transparent', color: 'var(--text-muted)', border: 'var(--line-strong)' },
  primary: { bg: 'var(--primary-soft)', color: 'var(--primary)', border: 'var(--primary)' },
  accent: { bg: 'var(--accent-soft)', color: 'var(--accent)', border: 'var(--accent)' },
  success: { bg: 'rgba(52,211,153,0.12)', color: 'var(--success)', border: 'var(--success)' },
  danger: { bg: 'rgba(248,113,113,0.12)', color: 'var(--danger)', border: 'var(--danger)' },
  info: { bg: 'rgba(96,165,250,0.12)', color: 'var(--info)', border: 'var(--info)' },
};

export default function Chip({ children, tone = 'neutral', style = {}, className = '' }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height: 22,
        padding: '0 8px',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
        color: t.color,
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: 6,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
