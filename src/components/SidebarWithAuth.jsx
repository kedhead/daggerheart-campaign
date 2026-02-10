import { useState, useEffect } from 'react';
import { Home, Users, BookOpen, ScrollText, Wrench, Crown, User, LogOut, FolderOpen, UserCog, FolderUp, UsersRound, Calendar, Map, Swords, StickyNote, Wand2, Settings, ChevronDown, ChevronRight, Gamepad2, Globe, Scroll, Menu, X, HelpCircle, MessageSquare, Shield, Package, Backpack, Zap, Target, Monitor, Skull, Grid, TreePine, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGameSystem } from '../data/systems/index.js';
import { applyTheme } from '../config/themes.js';
import './Sidebar.css';

export default function SidebarWithAuth({ currentView, setCurrentView, isDM, userRole, currentCampaign, onSwitchCampaign, presenceIndicator }) {
  const { logout, currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [expandedGroups, setExpandedGroups] = useState(['superadmin', 'campaign', 'players', 'world', 'adventure', 'resources', 'settings']);

  // Apply theme based on campaign's game system
  useEffect(() => {
    if (currentCampaign?.gameSystem) {
      applyTheme(currentCampaign.gameSystem);
    }
  }, [currentCampaign?.gameSystem]);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get game system name for title
  const gameSystem = currentCampaign ? getGameSystem(currentCampaign.gameSystem) : null;
  const systemName = gameSystem?.name || 'Lorelich';

  // Check if current user is superadmin
  const SUPER_ADMIN_IDS = ['DnZPlvutotbHwsalwMsBG7kEWCu1', 'PdOFs3FvC7WXl1QfB9i2EijyaxI2'];
  const isSuperAdmin = SUPER_ADMIN_IDS.includes(currentUser?.uid);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const navGroups = [
    // SuperAdmin section - only visible to superadmin
    ...(isSuperAdmin ? [{
      id: 'superadmin',
      label: 'SuperAdmin',
      icon: Shield,
      items: [
        { id: 'superadmin', label: 'All Campaigns', icon: Shield }
      ]
    }] : []),
    {
      id: 'campaign',
      label: 'Campaign',
      icon: Home,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home }
      ]
    },
    {
      id: 'players',
      label: 'Players',
      icon: Users,
      items: [
        { id: 'characters', label: 'Characters', icon: Users },
        { id: 'partyInventory', label: 'Party Stash', icon: Backpack },
        { id: 'notes', label: 'My Notes', icon: StickyNote },
        { id: 'messaging', label: 'Messages', icon: MessageSquare }
      ]
    },
    {
      id: 'world',
      label: 'World',
      icon: Globe,
      items: [
        { id: 'npcs', label: 'NPCs', icon: UsersRound },
        { id: 'locations', label: 'Locations', icon: Map },
        { id: 'lore', label: 'Lore', icon: BookOpen },
        { id: 'timeline', label: 'Timeline', icon: Calendar }
      ]
    },
    {
      id: 'adventure',
      label: 'Adventure',
      icon: Scroll,
      items: [
        { id: 'quests', label: 'Quests', icon: Target },
        { id: 'sessions', label: 'Sessions', icon: ScrollText },
        ...(isDM ? [
          { id: 'encounters', label: 'Encounters', icon: Swords },
          { id: 'initiative', label: 'Initiative', icon: Zap }
        ] : [])
      ]
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: FolderUp,
      items: [
        { id: 'items', label: 'Item Catalog', icon: Package },
        { id: 'adversaries', label: 'Adversary Catalog', icon: Skull },
        { id: 'environments', label: 'Environment Catalog', icon: TreePine },
        { id: 'files', label: 'Maps & Files', icon: FolderUp },
        { id: 'tools', label: 'Tools', icon: Wrench },
        { id: 'help', label: 'Features & Help', icon: HelpCircle }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      items: [
        ...(isDM ? [
          { id: 'playerDisplay', label: 'Player Display', icon: Monitor },
          { id: 'battleMapStudio', label: 'Battle Map Studio', icon: Grid },
          { id: 'campaignBuilder', label: 'Campaign Builder', icon: Wand2 },
          { id: 'members', label: 'Members', icon: UserCog }
        ] : []),
        { id: 'apiSettings', label: 'API Settings', icon: Settings }
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      <button
        className="fixed top-4 left-4 z-[60] p-2 rounded-xl bg-arcane-glass backdrop-blur-md border border-white/10 text-white md:hidden shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-[55] 
          flex flex-col
          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          bg-[#0d1126]/40 backdrop-blur-2xl border-r border-white/5 shadow-2xl
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isDM ? 'ring-1 ring-red-500/10' : 'ring-1 ring-blue-500/10'}
        `}
      >
        {/* Sidebar Header */}
        <div className="relative p-6 flex flex-col gap-1 overflow-hidden">
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/40 font-serif lowercase italic">
                {systemName}
              </h1>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Campaign Manager</p>
            </div>
          )}
          <button
            className={`
              absolute top-6 right-6 p-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300
              ${isCollapsed ? 'static mt-2 self-center rotate-180' : ''}
            `}
            onClick={toggleCollapsed}
          >
            {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Campaign Info Card */}
        {currentCampaign && !isCollapsed && (
          <div className="mx-4 mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 cursor-pointer" onClick={onSwitchCampaign}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500">
                <FolderOpen size={20} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white/90 truncate leading-tight tracking-tight uppercase">{currentCampaign.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {isDM ? <Crown size={10} className="text-amber-400" /> : <User size={10} className="text-blue-400" />}
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">
                    {isDM ? 'Dungeon Master' : 'Adventurer'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-6 py-4 custom-scrollbar">
          {navGroups.map(group => (
            <div key={group.id} className="space-y-1.5">
              {!isCollapsed && (
                <div className="px-3 flex items-center justify-between group cursor-pointer" onClick={() => toggleGroup(group.id)}>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] group-hover:text-white/40 transition-colors">
                    {group.label}
                  </span>
                  <div className={`transition-transform duration-300 text-white/10 group-hover:text-white/30 ${expandedGroups.includes(group.id) ? 'rotate-180' : ''}`}>
                    <ChevronDown size={12} />
                  </div>
                </div>
              )}

              {expandedGroups.includes(group.id) && (
                <div className="space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group/item
                          ${isActive
                            ? 'bg-white/10 text-white border border-white/10 shadow-[0_4px_12px_rgba(255,255,255,0.05)]'
                            : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
                          }
                          ${isCollapsed ? 'justify-center' : ''}
                        `}
                      >
                        <div className={`
                          relative transition-all duration-300
                          ${isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] scale-110' : 'group-hover/item:scale-110'}
                        `}>
                          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                          {isActive && (
                            <div className="absolute inset-0 bg-indigo-400/20 blur-lg rounded-full animate-pulse" />
                          )}
                        </div>

                        {!isCollapsed && (
                          <span className={`text-[13px] font-bold tracking-tight ${isActive ? 'translate-x-0.5' : ''} transition-transform`}>
                            {item.label}
                          </span>
                        )}

                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-r-full shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                        )}

                        {isCollapsed && (
                          <div className="absolute left-full ml-4 px-2 py-1 bg-arcane-navy border border-white/10 rounded-md text-[10px] font-bold text-white opacity-0 group-hover/item:opacity-100 translate-x-1 group-hover/item:translate-x-0 transition-all z-50 pointer-events-none whitespace-nowrap shadow-2xl">
                            {item.label}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-white/5 space-y-4">
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
            </button>
          )}

          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1.5 group cursor-pointer overflow-hidden">
              <img src="/lorelichlogo.png" alt="Lorelich" className="w-full h-full object-contain filter group-hover:brightness-125 transition-all grayscale contrast-125" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase leading-none">Lorelich</span>
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.1em] mt-0.5 leading-none">Enterprise OS</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
