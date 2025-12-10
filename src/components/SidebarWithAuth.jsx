import { Home, Users, BookOpen, ScrollText, Wrench, Crown, User, LogOut, FolderOpen, UserCog, FolderUp, UsersRound, Calendar, Map, Swords, StickyNote, Wand2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

export default function SidebarWithAuth({ currentView, setCurrentView, isDM, userRole, currentCampaign, onSwitchCampaign }) {
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'lore', label: 'Lore', icon: BookOpen },
    { id: 'sessions', label: 'Sessions', icon: ScrollText },
    { id: 'notes', label: 'My Notes', icon: StickyNote },
    { id: 'npcs', label: 'NPCs', icon: UsersRound },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'locations', label: 'Locations', icon: Map },
    { id: 'files', label: 'Maps & Files', icon: FolderUp },
    { id: 'tools', label: 'Tools', icon: Wrench }
  ];

  if (isDM) {
    navItems.splice(7, 0, { id: 'encounters', label: 'Encounters', icon: Swords });
    navItems.push({ id: 'campaignBuilder', label: 'Campaign Builder', icon: Wand2 });
    navItems.push({ id: 'members', label: 'Members', icon: UserCog });
  }

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
        <h1 className="sidebar-title">Daggerheart</h1>
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
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
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
