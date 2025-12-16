import { useState } from 'react';
import { Home, Users, BookOpen, ScrollText, Wrench, Crown, User, Menu, X } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ currentView, setCurrentView, isDM, setIsDM }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'lore', label: 'Lore', icon: BookOpen },
    { id: 'sessions', label: 'Sessions', icon: ScrollText },
    { id: 'tools', label: 'Tools', icon: Wrench }
  ];

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
          <h1 className="sidebar-title">Daggerheart</h1>
          <p className="sidebar-subtitle">Campaign Manager</p>
        </div>

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
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p>Powered by</p>
        <a href="https://freshcutgrass.app" target="_blank" rel="noopener noreferrer">
          FreshCutGrass
        </a>
        <a href="https://app.demiplane.com/nexus/daggerheart" target="_blank" rel="noopener noreferrer">
          Demiplane
        </a>
      </div>
    </aside>
    </>
  );
}
