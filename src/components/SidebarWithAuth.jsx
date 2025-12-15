import { useState } from 'react';
import { Home, Users, BookOpen, ScrollText, Wrench, Crown, User, LogOut, FolderOpen, UserCog, FolderUp, UsersRound, Calendar, Map, Swords, StickyNote, Wand2, Settings, ChevronDown, ChevronRight, Gamepad2, Globe, Scroll } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGameSystem } from '../data/systems/index.js';
import './Sidebar.css';

export default function SidebarWithAuth({ currentView, setCurrentView, isDM, userRole, currentCampaign, onSwitchCampaign }) {
  const { logout } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState(['campaign', 'players', 'world', 'adventure', 'resources', 'settings']);

  // Get game system name for title
  const gameSystem = currentCampaign ? getGameSystem(currentCampaign.gameSystem) : null;
  const systemName = gameSystem?.name || 'Daggerheart';

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const navGroups = [
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
        { id: 'notes', label: 'My Notes', icon: StickyNote }
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
        { id: 'sessions', label: 'Sessions', icon: ScrollText },
        ...(isDM ? [{ id: 'encounters', label: 'Encounters', icon: Swords }] : [])
      ]
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: FolderUp,
      items: [
        { id: 'files', label: 'Maps & Files', icon: FolderUp },
        { id: 'tools', label: 'Tools', icon: Wrench }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      items: [
        ...(isDM ? [
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

  return (
    <aside className={`sidebar ${isDM ? 'dm-mode' : 'player-mode'}`}>
      <div className="sidebar-header">
        <h1 className="sidebar-title">{systemName}</h1>
        <p className="sidebar-subtitle">Campaign Manager</p>
      </div>

      {currentCampaign && (
        <div className="current-campaign">
          <button className="campaign-switcher" onClick={onSwitchCampaign}>
            <FolderOpen size={16} />
            <span className="campaign-name">{currentCampaign.name}</span>
          </button>
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
                        onClick={() => setCurrentView(item.id)}
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

        <div className="powered-by">
          <p>Powered by</p>
          <a href="https://freshcutgrass.app" target="_blank" rel="noopener noreferrer">
            FreshCutGrass
          </a>
          <a href="https://app.demiplane.com/nexus/daggerheart" target="_blank" rel="noopener noreferrer">
            Demiplane
          </a>
        </div>
      </div>
    </aside>
  );
}
