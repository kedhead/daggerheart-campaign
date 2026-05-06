import { Home, User, BookOpen, MoreHorizontal, Compass } from 'lucide-react';

const BASE_TABS = [
  { id: 'dashboard', label: 'Home',  icon: Home,          action: 'view' },
  { id: 'my-sheet',  label: 'Sheet', icon: User,          action: 'view' },
  { id: 'lore',      label: 'Lore',  icon: BookOpen,      action: 'view' },
];

const MORE_TAB    = { id: 'more',   label: 'More',   icon: MoreHorizontal, action: 'more'   };
const PORTAL_TAB  = { id: 'portal', label: 'Portal', icon: Compass,        action: 'portal' };

export default function BottomNav({ currentView, setCurrentView, onMore, isDM, isDaggerheart, onEnterPortal }) {
  const tabs = [
    ...BASE_TABS,
    (!isDM && isDaggerheart) ? PORTAL_TAB : MORE_TAB,
  ];

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
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.action === 'view' && currentView === tab.id;
        const handleClick = () => {
          if (tab.action === 'view')   setCurrentView?.(tab.id);
          else if (tab.action === 'more')   onMore?.();
          else if (tab.action === 'portal') onEnterPortal?.();
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
