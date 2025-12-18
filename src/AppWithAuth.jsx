import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import CampaignSelector from './components/Campaigns/CampaignSelector';
import CampaignMembers from './components/Campaigns/CampaignMembers';
import RoleSelection from './components/RoleSelection/RoleSelection';
import SidebarWithAuth from './components/SidebarWithAuth';
import DashboardView from './components/Dashboard/DashboardView';
import CharactersView from './components/Characters/CharactersView';
import LoreView from './components/Lore/LoreView';
import SessionsView from './components/Sessions/SessionsView';
import FilesView from './components/Files/FilesView';
import ToolsView from './components/Tools/ToolsView';
import HelpView from './components/Help/HelpView';
import NPCsView from './components/NPCs/NPCsView';
import TimelineView from './components/Timeline/TimelineView';
import LocationsView from './components/Locations/LocationsView';
import EncountersView from './components/Encounters/EncountersView';
import NotesView from './components/Notes/NotesView';
import CampaignBuilderView from './components/CampaignBuilder/CampaignBuilderView';
import APISettings from './components/Settings/APISettings';
import { useFirestoreCampaign } from './hooks/useFirestoreCampaign';
import { usePendingInvites } from './hooks/usePendingInvites';
import { getGameSystem } from './data/systems/index.js';
import './App.css';

function CampaignApp() {
  const { currentUser } = useAuth();
  const { checking, joinedCampaigns } = usePendingInvites();
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

  // Show notification when user joins campaigns
  useEffect(() => {
    if (joinedCampaigns.length > 0) {
      const names = joinedCampaigns.map(c => c.name).join(', ');
      alert(`Welcome! You've been added to: ${names}`);
    }
  }, [joinedCampaigns]);

  const handleRoleSelection = (role) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  };

  // Show role selection if user hasn't chosen yet
  if (!userRole) {
    return <RoleSelection onSelectRole={handleRoleSelection} />;
  }

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
    npcs,
    addNPC,
    updateNPC,
    deleteNPC,
    timelineEvents,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    encounters,
    addEncounter,
    updateEncounter,
    deleteEncounter,
    notes,
    addNote,
    updateNote,
    deleteNote,
    campaignFrame,
    campaignFrameDraft,
    saveCampaignFrameDraft,
    completeCampaignFrame,
    deleteCampaignFrameDraft,
    loading
  } = useFirestoreCampaign(currentCampaignId);

  // Apply theme based on campaign's game system
  useEffect(() => {
    if (campaign?.gameSystem) {
      const gameSystem = getGameSystem(campaign.gameSystem);
      if (gameSystem?.theme) {
        // Apply CSS variables for theming - map to the actual CSS variables used in the app
        document.documentElement.style.setProperty('--fear-color', gameSystem.theme.primary);
        document.documentElement.style.setProperty('--fear-secondary', gameSystem.theme.primary);
        
        if (gameSystem.theme.secondary) {
          document.documentElement.style.setProperty('--hope-color', gameSystem.theme.secondary);
          document.documentElement.style.setProperty('--hope-secondary', gameSystem.theme.secondary);
        }
        
        // For non-Daggerheart systems, also update background colors for fuller theme
        if (gameSystem.id !== 'daggerheart') {
          // Shift backgrounds to be more neutral/grey
          document.documentElement.style.setProperty('--bg-primary', '#1a1a1a');
          document.documentElement.style.setProperty('--bg-secondary', '#2d2d2d');
          document.documentElement.style.setProperty('--bg-tertiary', '#3a3a3a');
        }
      }
    }

    // Cleanup: reset to default Daggerheart theme when unmounting
    return () => {
      document.documentElement.style.setProperty('--fear-color', '#8b5cf6');
      document.documentElement.style.setProperty('--fear-secondary', '#a78bfa');
      document.documentElement.style.setProperty('--hope-color', '#eab308');
      document.documentElement.style.setProperty('--hope-secondary', '#f59e0b');
      document.documentElement.style.setProperty('--bg-primary', '#0f0f1a');
      document.documentElement.style.setProperty('--bg-secondary', '#1a1a2e');
      document.documentElement.style.setProperty('--bg-tertiary', '#16213e');
    };
  }, [campaign?.gameSystem]);

  // Determine if current user is DM based on campaign data
  // For legacy campaigns without dmId, assume current user is DM
  const isDM = campaign?.dmId === currentUser?.uid ||
               (campaign && !campaign.dmId && campaign.createdBy === currentUser?.uid) ||
               (campaign && !campaign.dmId); // If no dmId at all, assume DM for backwards compatibility
  const campaignRole = campaign?.members?.[currentUser?.uid]?.role || 'dm'; // Default to dm for legacy campaigns

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
          userRole={userRole}
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
            campaign={campaign}
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
            campaign={campaign}
            npcs={npcs}
            locations={locations}
            sessions={sessions}
            timelineEvents={timelineEvents}
            encounters={encounters}
            notes={notes}
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
            campaign={campaign}
            npcs={npcs}
            locations={locations}
            lore={lore}
            timelineEvents={timelineEvents}
            encounters={encounters}
            notes={notes}
          />
        );
      case 'files':
        return (
          <FilesView
            campaign={campaign}
            isDM={isDM}
            userId={currentUser.uid}
            locations={locations}
            updateCampaign={updateCampaign}
          />
        );
      case 'tools':
        return <ToolsView campaign={campaign} />;
      case 'help':
        return <HelpView campaign={campaign} />;
      case 'members':
        return <CampaignMembers campaign={campaign} currentUserId={currentUser.uid} />;
      case 'npcs':
        return (
          <NPCsView
            campaign={campaign}
            npcs={npcs}
            addNPC={addNPC}
            updateNPC={updateNPC}
            deleteNPC={deleteNPC}
            isDM={isDM}
            locations={locations}
            lore={lore}
            sessions={sessions}
            timelineEvents={timelineEvents}
            encounters={encounters}
            notes={notes}
          />
        );
      case 'timeline':
        return (
          <TimelineView
            campaign={campaign}
            events={timelineEvents}
            addEvent={addTimelineEvent}
            updateEvent={updateTimelineEvent}
            deleteEvent={deleteTimelineEvent}
            isDM={isDM}
            npcs={npcs}
            locations={locations}
            lore={lore}
            sessions={sessions}
            encounters={encounters}
            notes={notes}
          />
        );
      case 'locations':
        return (
          <LocationsView
            campaign={campaign}
            locations={locations}
            updateCampaign={updateCampaign}
            addLocation={addLocation}
            updateLocation={updateLocation}
            deleteLocation={deleteLocation}
            isDM={isDM}
            userId={currentUser.uid}
            npcs={npcs}
            lore={lore}
            sessions={sessions}
            timelineEvents={timelineEvents}
            encounters={encounters}
            notes={notes}
          />
        );
      case 'encounters':
        return (
          <EncountersView
            campaign={campaign}
            encounters={encounters}
            addEncounter={addEncounter}
            updateEncounter={updateEncounter}
            deleteEncounter={deleteEncounter}
            isDM={isDM}
            npcs={npcs}
            locations={locations}
            lore={lore}
            sessions={sessions}
            timelineEvents={timelineEvents}
            notes={notes}
          />
        );
      case 'notes':
        return (
          <NotesView
            campaign={campaign}
            addNote={addNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            currentUserId={currentUser.uid}
            isDM={isDM}
            npcs={npcs}
            locations={locations}
            lore={lore}
            sessions={sessions}
            timelineEvents={timelineEvents}
            encounters={encounters}
            notes={notes}
          />
        );
      case 'campaignBuilder':
        return (
          <CampaignBuilderView
            userId={currentUser.uid}
            campaign={campaign}
            campaignFrame={campaignFrame}
            campaignFrameDraft={campaignFrameDraft}
            saveCampaignFrameDraft={saveCampaignFrameDraft}
            completeCampaignFrame={completeCampaignFrame}
            deleteCampaignFrameDraft={deleteCampaignFrameDraft}
            updateCampaign={updateCampaign}
            onBack={() => setCurrentView('dashboard')}
            addNPC={addNPC}
            addLocation={addLocation}
            addLore={addLore}
            addEncounter={addEncounter}
            addTimelineEvent={addTimelineEvent}
          />
        );
      case 'apiSettings':
        return <APISettings userId={currentUser.uid} />;
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
        userRole={campaignRole}
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
