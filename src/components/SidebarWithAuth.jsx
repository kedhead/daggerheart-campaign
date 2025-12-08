import { Home, Users, BookOpen, ScrollText, Wrench, Crown, User, LogOut, FolderOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

export default function SidebarWithAuth({ currentView, setCurrentView, isDM, setIsDM, currentCampaign, onSwitchCampaign }) {
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'lore', label: 'Lore', icon: BookOpen },
    { id: 'sessions', label: 'Sessions', icon: ScrollText },
    { id: 'tools', label: 'Tools', icon: Wrench }
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
        <h1 className="sidebar-title">Daggerheart</h1>
        <p className="sidebar-subtitle">Campaign Manager</p>
      </div>

      {currentCampaign && (
        <div className="current-campaign">
          <button className="campaign-switcher" onClick={onSwitchCampaign}>
            <FolderOpen size={16} />
            <span className="campaign-name">{currentCampaign.name}</span>
          </button>
        </div>
      )}

      <div className="mode-toggle">
        <button
          className={`mode-btn ${!isDM ? 'active' : ''}`}
          onClick={() => setIsDM(false)}
        >
          <User size={18} />
          Player
        </button>
        <button
          className={`mode-btn ${isDM ? 'active' : ''}`}
          onClick={() => setIsDM(true)}
        >
          <Crown size={18} />
          DM
        </button>
      </div>

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
