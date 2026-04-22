const SIZES = {
  sm: { h: 32, px: 12, fs: 13 },
  md: { h: 40, px: 16, fs: 14 },
  lg: { h: 48, px: 20, fs: 15 },
};

const VARIANTS = {
  primary: {
    background: 'var(--primary)',
    color: '#fff',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--line-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--danger)',
    color: '#fff',
    border: '1px solid transparent',
  },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  onClick,
  style = {},
  title,
  type = 'button',
  disabled = false,
  className = '',
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={className}
      style={{
        height: s.h,
        padding: `0 ${s.px}px`,
        fontSize: s.fs,
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'filter 0.15s',
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.filter = 'brightness(1.1)';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.filter = 'brightness(1)';
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
