import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import CampaignSelector from './components/Campaigns/CampaignSelector';
import CampaignMembers from './components/Campaigns/CampaignMembers';
import SidebarWithAuth from './components/SidebarWithAuth';
import DashboardView from './components/Dashboard/DashboardView';
import CharactersView from './components/Characters/CharactersView';
import LoreView from './components/Lore/LoreView';
import SessionsView from './components/Sessions/SessionsView';
import ToolsView from './components/Tools/ToolsView';
import { useFirestoreCampaign } from './hooks/useFirestoreCampaign';
import { usePendingInvites } from './hooks/usePendingInvites';
import './App.css';

function CampaignApp() {
  const { currentUser } = useAuth();
  const { checking, joinedCampaigns } = usePendingInvites();

  // Show notification when user joins campaigns
  useEffect(() => {
    if (joinedCampaigns.length > 0) {
      const names = joinedCampaigns.map(c => c.name).join(', ');
      alert(`Welcome! You've been added to: ${names}`);
    }
  }, [joinedCampaigns]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentCampaignId, setCurrentCampaignId] = useState(
    localStorage.getItem('lastCampaignId') || null
  );

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

  // Determine if current user is DM based on campaign data
  // For legacy campaigns without dmId, assume current user is DM
  const isDM = campaign?.dmId === currentUser?.uid ||
               (campaign && !campaign.dmId && campaign.createdBy === currentUser?.uid) ||
               (campaign && !campaign.dmId); // If no dmId at all, assume DM for backwards compatibility
  const userRole = campaign?.members?.[currentUser?.uid]?.role || 'dm'; // Default to dm for legacy campaigns

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
            currentUserId={currentUser.uid}
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
      case 'members':
        return <CampaignMembers campaign={campaign} currentUserId={currentUser.uid} />;
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
        userRole={userRole}
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
