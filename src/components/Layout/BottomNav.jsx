import { Home, User, BookOpen, MoreHorizontal, Compass, ScrollText, Swords, UsersRound } from 'lucide-react';

const BASE_TABS = [
  { id: 'dashboard', label: 'Home',  icon: Home,          action: 'view' },
  { id: 'my-sheet',  label: 'Sheet', icon: User,          action: 'view' },
  { id: 'lore',      label: 'Lore',  icon: BookOpen,      action: 'view' },
];

// The DM has no character sheet, and at the table reaches for sessions,
// encounters and NPCs — not "Sheet" and "Lore", which is what they used to get.
const DM_TABS = [
  { id: 'dashboard',  label: 'Home',       icon: Home,       action: 'view' },
  { id: 'sessions',   label: 'Sessions',   icon: ScrollText, action: 'view' },
  { id: 'encounters', label: 'Combat',     icon: Swords,     action: 'view' },
  { id: 'npcs',       label: 'NPCs',       icon: UsersRound, action: 'view' },
];

const MORE_TAB    = { id: 'more',   label: 'More',   icon: MoreHorizontal, action: 'more'   };
const PORTAL_TAB  = { id: 'portal', label: 'Portal', icon: Compass,        action: 'portal' };

/** The phone tab bar for this viewer. Pure, so the choice can be tested. */
export function bottomTabsFor({ isDM = false, isDaggerheart = false } = {}) {
  if (isDM) return [...DM_TABS, MORE_TAB];
  return [...BASE_TABS, isDaggerheart ? PORTAL_TAB : MORE_TAB];
}

export default function BottomNav({ currentView, setCurrentView, onMore, isDM, isDaggerheart, onEnterPortal }) {
  const tabs = bottomTabsFor({ isDM, isDaggerheart });

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
        // The theme's surface, not a fixed navy, so other game systems' themes apply.
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
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
