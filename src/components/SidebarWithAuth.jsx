import { useState } from 'react';
import { Home, Users, BookOpen, ScrollText, Wrench, Crown, User, LogOut, FolderOpen, UserCog, FolderUp, UsersRound, Calendar, Map, Swords, StickyNote, Wand2, Settings, ChevronDown, ChevronRight, Gamepad2, Globe, Scroll, Menu, X, HelpCircle, MessageSquare, Shield, Package, Backpack, Zap, Target, Monitor } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGameSystem } from '../data/systems/index.js';
import './Sidebar.css';

export default function SidebarWithAuth({ currentView, setCurrentView, isDM, userRole, currentCampaign, onSwitchCampaign, presenceIndicator }) {
  const { logout, currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(['superadmin', 'campaign', 'players', 'world', 'adventure', 'resources', 'settings']);

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
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${isDM ? 'dm-mode' : 'player-mode'} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <h1 className="sidebar-title">{systemName}</h1>
        <p className="sidebar-subtitle">Campaign Manager</p>
      </div>

      {currentCampaign && (
        <div className="current-campaign">
          <div className="campaign-header-row">
            <button className="campaign-switcher" onClick={onSwitchCampaign}>
              <FolderOpen size={16} />
              <span className="campaign-name">{currentCampaign.name}</span>
            </button>
            {presenceIndicator}
          </div>
          <div className="user-role-badge">
            {isDM ? (
              <>
                <Crown size={16} />
                <span>Dungeon Master</span>
              </>
            ) : (
              <>
                <User size={16} />
                <span>Player</span>
              </>
            )}
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {navGroups.map(group => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups.includes(group.id);
          const hasActiveItem = group.items.some(item => item.id === currentView);

          return (
            <div key={group.id} className="nav-group">
              <button
                className={`nav-group-header ${hasActiveItem ? 'has-active' : ''}`}
                onClick={() => toggleGroup(group.id)}
              >
                <div className="nav-group-title">
                  <GroupIcon size={18} />
                  <span>{group.label}</span>
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isExpanded && (
                <div className="nav-group-items">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => handleNavClick(item.id)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Sign Out
        </button>

        <div className="sidebar-branding">
          <img src="/lorelichlogo.png" alt="Lorelich" className="sidebar-logo" />
        </div>
      </div>
    </aside>
    </>
  );
}
