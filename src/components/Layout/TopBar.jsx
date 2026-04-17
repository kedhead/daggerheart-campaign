import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Search, Bell, ChevronRight, Crown, User } from 'lucide-react';
import PresenceIndicator from '../PresenceIndicator/PresenceIndicator';
import NotificationPanel from '../Notifications/NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';

export default function TopBar({ currentView, presenceList, currentCampaignId, campaign, isDM, setCurrentView, onOpenCommandPalette }) {
    const { currentUser } = useAuth();
    const { info } = useToast();
    const [panelOpen, setPanelOpen] = useState(false);
    const bellRef = useRef(null);
    const panelRef = useRef(null);
    const prevUnreadIdsRef = useRef(null);

    const { unreadConversations, pendingJoinRequests, totalCount } = useNotifications(
        currentCampaignId,
        campaign,
        isDM
    );

    // Request browser notification permission on first load
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Alert when new unread messages arrive
    useEffect(() => {
        const currentIds = new Set(unreadConversations.map(c => c.id));

        // On first run, just initialise the ref — don't fire alerts for pre-existing unreads
        if (prevUnreadIdsRef.current === null) {
            prevUnreadIdsRef.current = currentIds;
            return;
        }

        const newConvs = unreadConversations.filter(c => !prevUnreadIdsRef.current.has(c.id));
        prevUnreadIdsRef.current = currentIds;

        if (newConvs.length === 0) return;

        // Don't toast if user is already looking at messaging
        if (currentView === 'messaging') return;

        newConvs.forEach(conv => {
            const senderName = conv.type === 'announcement'
                ? 'Announcement'
                : Object.entries(conv.participantNames || {})
                    .filter(([uid]) => uid !== currentUser?.uid)
                    .map(([, name]) => name)
                    .join(', ') || 'Someone';

            const preview = conv.lastMessage
                ? conv.lastMessage.substring(0, 60) + (conv.lastMessage.length > 60 ? '…' : '')
                : 'New message';

            // In-app toast
            info(`${senderName}: ${preview}`, {
                duration: 7000,
                action: { label: 'View', onClick: () => setCurrentView('messaging') }
            });

            // Browser / desktop notification when tab is not focused
            if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
                new Notification(`New message from ${senderName}`, {
                    body: preview,
                    icon: '/favicon.ico'
                });
            }
        });
    }, [unreadConversations]);

    // Close panel when clicking outside
    useEffect(() => {
        if (!panelOpen) return;
        const handleClick = (e) => {
            if (
                bellRef.current && !bellRef.current.contains(e.target) &&
                panelRef.current && !panelRef.current.contains(e.target)
            ) {
                setPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [panelOpen]);

    const getBreadcrumbs = () => {
        const views = {
            dashboard: 'Dashboard',
            characters: 'Characters',
            lore: 'Lore & World',
            npcs: 'Non-Player Characters',
            locations: 'Locations',
            timeline: 'World Timeline',
            quests: 'Quests & Objectives',
            sessions: 'Session Logs',
            encounters: 'Encounter Builder',
            initiative: 'Initiative Tracker',
            partyInventory: 'Party Stash',
            items: 'Item Catalog',
            adversaries: 'Adversary Catalog',
            environments: 'Environment Catalog',
            files: 'Maps & Files',
            tools: 'Utility Tools',
            help: 'Features & Help',
            members: 'Campaign Members',
            playerDisplay: 'Player Display',
            battleMapStudio: 'Battle Map Studio',
            campaignBuilder: 'Campaign Builder'
        };
        return views[currentView] || currentView.charAt(0).toUpperCase() + currentView.slice(1);
    };

    return (
        <header
            className="h-14 lr:h-14 desk:h-16 flex items-center justify-between px-3 desk:px-6 backdrop-blur-xl border-b sticky top-0 z-40 transition-all duration-300"
            style={{
                background: 'color-mix(in srgb, var(--surface) 78%, transparent)',
                borderBottomColor: 'var(--line)',
                fontFamily: 'var(--font-body)',
            }}
        >
            <div className="flex items-center gap-4 min-w-0">
                <nav className="flex items-center text-sm font-medium min-w-0">
                    <span className="hidden sm:inline text-[color:var(--text-dim)] hover:text-[color:var(--text-muted)] transition-colors cursor-default shrink-0" style={{ fontFamily: 'var(--font-display)' }}>Lorelich</span>
                    <ChevronRight size={14} className="hidden sm:inline mx-2 text-[color:var(--text-dim)] shrink-0" />
                    <span className="text-[color:var(--text)] font-semibold tracking-wide truncate">{getBreadcrumbs()}</span>
                </nav>
            </div>

            <div className="hidden desk:flex flex-1 max-w-2xl px-12">
                <button
                    type="button"
                    onClick={() => onOpenCommandPalette?.()}
                    className="relative group w-full text-left"
                    aria-label="Open command palette"
                >
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-dim)] group-hover:text-[color:var(--text-muted)] transition-colors" />
                    <div
                        className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm text-[color:var(--text-muted)] transition-all shadow-inner"
                        style={{
                            background: 'color-mix(in srgb, var(--surface-hi) 60%, transparent)',
                            border: '1px solid var(--line)',
                        }}
                    >
                        Search campaign, lore, or press <span className="text-[color:var(--text)]">⌘K</span> for commands…
                    </div>
                    <div
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{
                            border: '1px solid var(--line-strong)',
                            background: 'var(--surface-hi)',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                        }}
                    >
                        ⌘K
                    </div>
                </button>
            </div>

            <div className="flex items-center gap-2 desk:gap-4 shrink-0">
                {/* Role pill — mirrors Sidebar pill so the swap is always visible */}
                <div
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{
                        background: isDM ? 'rgba(139, 92, 246, 0.12)' : 'var(--primary-soft)',
                        borderColor: isDM ? 'var(--fear)' : 'var(--primary)',
                        color: isDM ? 'var(--fear)' : 'var(--primary)',
                    }}
                    aria-label={isDM ? 'GM view active' : 'Player view active'}
                >
                    {isDM ? <Crown size={11} strokeWidth={2.4} /> : <User size={11} strokeWidth={2.4} />}
                    <span>{isDM ? 'GM' : 'Player'}</span>
                </div>
                <div className="flex items-center gap-2 desk:gap-3 pl-2 desk:pl-4 border-l border-[color:var(--line)]">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-bold text-[color:var(--text)] tracking-tight">
                            {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)] shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                            <span className="text-[10px] font-medium text-[color:var(--text-muted)] uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                    <div
                        className="w-8 h-8 desk:w-9 desk:h-9 rounded-xl overflow-hidden p-0.5 ring-1"
                        style={{
                            background: 'var(--primary-soft)',
                            border: '1px solid var(--line-strong)',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
                        }}
                    >
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-black uppercase rounded-lg" style={{ background: 'var(--surface-hi)', color: 'var(--text)' }}>
                                {currentUser?.email?.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        ref={bellRef}
                        onClick={() => setPanelOpen(prev => !prev)}
                        className={`relative p-2 rounded-xl transition-all duration-200 ${
                            panelOpen
                                ? 'bg-[color:var(--primary-soft)] text-[color:var(--primary)]'
                                : 'hover:bg-white/5 text-[color:var(--text-muted)] hover:text-[color:var(--text)]'
                        }`}
                        aria-label="Notifications"
                    >
                        <Bell size={20} />
                        {totalCount > 0 && (
                            <span
                                className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full text-[9px] font-black text-white leading-none"
                                style={{
                                    background: 'var(--danger)',
                                    border: '2px solid var(--bg)',
                                }}
                            >
                                {totalCount > 9 ? '9+' : totalCount}
                            </span>
                        )}
                    </button>

                    {panelOpen && (
                        <div ref={panelRef}>
                            <NotificationPanel
                                unreadConversations={unreadConversations}
                                pendingJoinRequests={pendingJoinRequests}
                                onNavigate={(view) => setCurrentView && setCurrentView(view)}
                                onClose={() => setPanelOpen(false)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
