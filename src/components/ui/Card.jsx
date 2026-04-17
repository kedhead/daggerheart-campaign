export default function Card({
  children,
  padded = true,
  className = '',
  style = {},
  ...rest
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: padded ? 20 : 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
