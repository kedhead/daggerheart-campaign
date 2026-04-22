import { Home, User, Dices, BookOpen, MoreHorizontal } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: Home, action: 'view' },
  { id: 'my-sheet', label: 'Sheet', icon: User, action: 'view' },
  { id: 'roll', label: 'Roll', icon: Dices, action: 'roll' },
  { id: 'lore', label: 'Lore', icon: BookOpen, action: 'view' },
  { id: 'more', label: 'More', icon: MoreHorizontal, action: 'more' },
];

export default function BottomNav({ currentView, setCurrentView, onRoll, onMore }) {
  return (
    <nav
      className="lr-mobile-only lr-bottom-nav"
      aria-label="Primary mobile navigation"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        background: 'rgba(12, 14, 22, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid var(--line-strong)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.action === 'view' && currentView === tab.id;
        const handleClick = () => {
          if (tab.action === 'view') setCurrentView?.(tab.id);
          else if (tab.action === 'roll') onRoll?.();
          else if (tab.action === 'more') onMore?.();
        };
        return (
          <button
            key={tab.id}
            type="button"
            onClick={handleClick}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '8px 4px 10px',
              minHeight: 56,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
