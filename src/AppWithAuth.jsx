import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import CampaignSelector from './components/Campaigns/CampaignSelector';
import SidebarWithAuth from './components/SidebarWithAuth';
import DashboardView from './components/Dashboard/DashboardView';
import CharactersView from './components/Characters/CharactersView';
import LoreView from './components/Lore/LoreView';
import SessionsView from './components/Sessions/SessionsView';
import ToolsView from './components/Tools/ToolsView';
import { useFirestoreCampaign } from './hooks/useFirestoreCampaign';
import './App.css';

function CampaignApp() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentCampaignId, setCurrentCampaignId] = useState(
    localStorage.getItem('lastCampaignId') || null
  );
  const [isDM, setIsDM] = useState(false);

  const {
    campaign,
    updateCampaign,
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    lore,
    addLore,
    updateLore,
    deleteLore,
    sessions,
    addSession,
    updateSession,
    deleteSession,
    loading
  } = useFirestoreCampaign(currentCampaignId);

  const handleSelectCampaign = (campaignId) => {
    setCurrentCampaignId(campaignId);
    localStorage.setItem('lastCampaignId', campaignId);
  };

  // Show campaign selector if no campaign selected
  if (!currentCampaignId || !campaign) {
    return (
      <div className="app">
        <CampaignSelector
          currentCampaignId={currentCampaignId}
          onSelectCampaign={handleSelectCampaign}
        />
      </div>
    );
  }

  const renderView = () => {
    if (loading) {
      return (
        <div className="loading-view">
          <div className="loading-spinner"></div>
          <p>Loading campaign...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            campaign={campaign}
            updateCampaign={updateCampaign}
            characters={characters}
            lore={lore}
            sessions={sessions}
            isDM={isDM}
          />
        );
      case 'characters':
        return (
          <CharactersView
            characters={characters}
            addCharacter={addCharacter}
            updateCharacter={updateCharacter}
            deleteCharacter={deleteCharacter}
            isDM={isDM}
          />
        );
      case 'lore':
        return (
          <LoreView
            lore={lore}
            addLore={addLore}
            updateLore={updateLore}
            deleteLore={deleteLore}
            isDM={isDM}
          />
        );
      case 'sessions':
        return (
          <SessionsView
            sessions={sessions}
            addSession={addSession}
            updateSession={updateSession}
            deleteSession={deleteSession}
            isDM={isDM}
          />
        );
      case 'tools':
        return <ToolsView />;
      default:
        return (
          <DashboardView
            campaign={campaign}
            updateCampaign={updateCampaign}
            characters={characters}
            lore={lore}
            sessions={sessions}
            isDM={isDM}
          />
        );
    }
  };

  return (
    <div className={`app ${isDM ? 'dm-mode' : 'player-mode'}`}>
      <SidebarWithAuth
        currentView={currentView}
        setCurrentView={setCurrentView}
        isDM={isDM}
        setIsDM={setIsDM}
        currentCampaign={campaign}
        onSwitchCampaign={() => setCurrentCampaignId(null)}
      />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <AuthPage />;
  }

  return <CampaignApp />;
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
