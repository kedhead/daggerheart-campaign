export function Eyebrow({ children, style = {}, className = '' }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function H1({ children, style = {}, className = '' }) {
  return (
    <h1
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 36,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        color: 'var(--text)',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function H2({ children, style = {}, className = '' }) {
  return (
    <h2
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 22,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        color: 'var(--text)',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}
