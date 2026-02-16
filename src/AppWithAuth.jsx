import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import AuthPage from './components/Auth/AuthPage';
import TermsOfService from './components/Auth/TermsOfService';
import CampaignSelector from './components/Campaigns/CampaignSelector';
import CampaignMembers from './components/Campaigns/CampaignMembers';
import JoinCampaignPage from './components/Campaigns/JoinCampaignPage';
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
import MessagingView from './components/Messaging/MessagingView';
import CampaignBuilderView from './components/CampaignBuilder/CampaignBuilderView';
import SuperAdminView from './components/SuperAdmin/SuperAdminView';
import APISettings from './components/Settings/APISettings';
import ItemsView from './components/Items/ItemsView';
import AdversariesView from './components/Adversaries/AdversariesView';
import EnvironmentsView from './components/Environments/EnvironmentsView';
import PartyInventoryView from './components/Inventory/PartyInventoryView';
import InitiativeTracker from './components/Initiative/InitiativeTracker';
import QuestsView from './components/Quests/QuestsView';
import PlayerDisplay from './components/PlayerDisplay/PlayerDisplay';
import DMDisplayControl from './components/PlayerDisplay/DMDisplayControl';
import BattleMapStudio from './components/BattleMapStudio/BattleMapStudio';
import BattleMapDisplayWindow from './components/BattleMapDisplay/BattleMapDisplayWindow';
import { DiceRollerFloat } from './components/DiceRoller/index';
import { useFirestoreCampaign } from './hooks/useFirestoreCampaign';
import { usePendingInvites } from './hooks/usePendingInvites';
import ChatWidget from './components/DaggerheartChat/ChatWidget';
import CommandPalette from './components/CommandPalette/CommandPalette';
import PresenceIndicator from './components/PresenceIndicator/PresenceIndicator';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { usePresence } from './hooks/usePresence';
import { getGameSystem } from './data/systems/index.js';
import TopBar from './components/Layout/TopBar';
import './App.css';

function CampaignApp() {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { currentUser } = useAuth();
  const { checking, joinedCampaigns } = usePendingInvites();
  const { success } = useToast();
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentCampaignId, setCurrentCampaignId] = useState(
    localStorage.getItem('lastCampaignId') || null
  );
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
    // Items
    items,
    addItem,
    updateItem,
    deleteItem,
    // Adversaries
    adversaries,
    addAdversary,
    updateAdversary,
    deleteAdversary,
    // Environments
    environments,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    // Character Inventory
    addToCharacterInventory,
    removeFromCharacterInventory,
    updateCharacterInventoryItem,
    toggleEquipped,
    // Party Inventory
    partyInventory,
    addToPartyInventory,
    removeFromPartyInventory,
    updatePartyInventoryItem,
    // Transfers
    transferToParty,
    transferToCharacter,
    // Initiative
    initiative,
    startInitiative,
    updateInitiative,
    nextTurn,
    previousTurn,
    addParticipant,
    removeParticipant,
    updateParticipant,
    reorderParticipants,
    endInitiative,
    // Quests
    quests,
    addQuest,
    updateQuest,
    deleteQuest,
    toggleQuestObjective,
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

  // Ctrl+/ or Cmd+/ to open command palette (Ctrl+K conflicts with Chrome)
  useKeyboardShortcut('/', () => setIsCommandPaletteOpen(true), { ctrl: true });

  // Presence tracking
  const { presenceList } = usePresence(currentCampaignId, currentView);

  // Show notification when user joins campaigns
  useEffect(() => {
    if (joinedCampaigns.length > 0) {
      const names = joinedCampaigns.map(c => c.name).join(', ');
      success(`Welcome! You've been added to: ${names}`);
    }
  }, [joinedCampaigns, success]);

  // Handler functions
  const handleRoleSelection = (role) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  };

  const handleSelectCampaign = (campaignId) => {
    setCurrentCampaignId(campaignId);
    localStorage.setItem('lastCampaignId', campaignId);
  };

  const handleCommandNavigate = (view, options = {}) => {
    setCurrentView(view);
  };

  // CONDITIONAL RETURNS - these must come AFTER all hooks
  // Show role selection if user hasn't chosen yet
  if (!userRole) {
    return <RoleSelection onSelectRole={handleRoleSelection} />;
  }

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

  // Determine if current user is DM based on campaign data
  // Check multiple sources: dmId, createdBy, member role, super admin
  const SUPER_ADMIN_IDS = ['DnZPlvutotbHwsalwMsBG7kEWCu1', 'PdOFs3FvC7WXl1QfB9i2EijyaxI2'];
  const isSuperAdmin = SUPER_ADMIN_IDS.includes(currentUser?.uid);
  const campaignRole = campaign?.members?.[currentUser?.uid]?.role || 'dm'; // Default to dm for legacy campaigns
  const isDM = isSuperAdmin ||
    campaign?.dmId === currentUser?.uid ||
    campaign?.createdBy === currentUser?.uid ||
    campaignRole === 'dm' ||
    (campaign && !campaign.dmId); // If no dmId at all, assume DM for backwards compatibility

  const renderView = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-arcane-navy flex flex-col items-center justify-center p-6 space-y-6 relative overflow-hidden">
          {/* Background Flair for Loading State */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse delay-700" />

          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
            <div className="relative w-20 h-20 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
          </div>

          <div className="text-center space-y-2 relative">
            <h2 className="font-serif text-2xl font-black text-white/90 italic lowercase tracking-tighter">Syncing Archives...</h2>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Establishing uplink to campaign nodes</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'superadmin':
        return <SuperAdminView />;
      case 'dashboard':
        return (
          <DashboardView
            campaign={campaign}
            updateCampaign={updateCampaign}
            characters={characters}
            lore={lore}
            sessions={sessions}
            isDM={isDM}
            npcs={npcs}
            locations={locations}
            timelineEvents={timelineEvents}
            encounters={encounters}
            notes={notes}
            currentUserId={currentUser.uid}
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
            items={items}
            partyInventory={partyInventory}
            addToCharacterInventory={addToCharacterInventory}
            removeFromCharacterInventory={removeFromCharacterInventory}
            toggleEquipped={toggleEquipped}
            transferToParty={transferToParty}
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
            currentUserId={currentUser.uid}
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
            adversaries={adversaries}
            environments={environments}
            characters={characters}
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
      case 'messaging':
        return (
          <MessagingView
            campaign={campaign}
            currentUserId={currentUser.uid}
            isDM={isDM}
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
            addQuest={addQuest}
            addAdversary={addAdversary}
            addEnvironment={addEnvironment}
          />
        );
      case 'apiSettings':
        return <APISettings userId={currentUser.uid} />;
      case 'items':
        return (
          <ItemsView
            campaign={campaign}
            items={items}
            addItem={addItem}
            updateItem={updateItem}
            deleteItem={deleteItem}
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
      case 'adversaries':
        return (
          <AdversariesView
            campaign={campaign}
            adversaries={adversaries}
            addAdversary={addAdversary}
            updateAdversary={updateAdversary}
            deleteAdversary={deleteAdversary}
            isDM={isDM}
          />
        );
      case 'environments':
        return (
          <EnvironmentsView
            campaign={campaign}
            environments={environments}
            addEnvironment={addEnvironment}
            updateEnvironment={updateEnvironment}
            deleteEnvironment={deleteEnvironment}
            isDM={isDM}
          />
        );
      case 'partyInventory':
        return (
          <PartyInventoryView
            campaign={campaign}
            items={items}
            partyInventory={partyInventory}
            addToPartyInventory={addToPartyInventory}
            removeFromPartyInventory={removeFromPartyInventory}
            updatePartyInventoryItem={updatePartyInventoryItem}
            transferToCharacter={transferToCharacter}
            characters={characters}
            isDM={isDM}
            currentUserId={currentUser.uid}
          />
        );
      case 'initiative':
        return (
          <InitiativeTracker
            campaign={campaign}
            initiative={initiative}
            startInitiative={startInitiative}
            updateInitiative={updateInitiative}
            nextTurn={nextTurn}
            previousTurn={previousTurn}
            addParticipant={addParticipant}
            removeParticipant={removeParticipant}
            updateParticipant={updateParticipant}
            reorderParticipants={reorderParticipants}
            endInitiative={endInitiative}
            characters={characters}
            npcs={npcs}
            isDM={isDM}
          />
        );
      case 'quests':
        return (
          <QuestsView
            campaign={campaign}
            quests={quests}
            addQuest={addQuest}
            updateQuest={updateQuest}
            deleteQuest={deleteQuest}
            toggleQuestObjective={toggleQuestObjective}
            isDM={isDM}
            npcs={npcs}
            locations={locations}
            items={items}
            lore={lore}
            encounters={encounters}
            sessions={sessions}
            timelineEvents={timelineEvents}
            notes={notes}
          />
        );
      case 'playerDisplay':
        return (
          <DMDisplayControl
            campaign={campaign}
            characters={characters}
            npcs={npcs}
            locations={locations}
            adversaries={adversaries}
            initiative={initiative}
          />
        );
      case 'battleMapStudio':
        return (
          <BattleMapStudio
            campaign={campaign}
            isDM={isDM}
          />
        );
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

  // Check if current campaign is Daggerheart for the chat widget
  // Default to daggerheart if gameSystem is missing (legacy support)
  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';

  // Inside CampaignApp return...
  return (
    <div className={`app min-h-screen flex bg-arcane-navy selection:bg-indigo-500/30 font-sans relative overflow-hidden ${isDM ? 'dm-mode' : 'player-mode'}`}>
      {/* Global Background Visuals */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full animate-pulse delay-1000" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-500/5 blur-[80px] rounded-full animate-pulse delay-500" />
      </div>

      <div className="relative z-10 flex flex-1">
        <SidebarWithAuth
          currentView={currentView}
          setCurrentView={setCurrentView}
          isDM={isDM}
          userRole={campaignRole}
          currentCampaign={campaign}
          onSwitchCampaign={() => setCurrentCampaignId(null)}
        />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
          <TopBar currentView={currentView} presenceList={presenceList} />
          <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
            {renderView()}
          </main>
        </div>
      </div>

      {isDaggerheart && <ChatWidget userId={currentUser?.uid} />}

      <DiceRollerFloat
        campaignId={currentCampaignId}
        gameSystem={campaign?.gameSystem || 'daggerheart'}
        isDM={isDM}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleCommandNavigate}
        npcs={npcs}
        characters={characters}
        locations={locations}
        quests={quests}
        isDM={isDM}
      />
    </div>
  );
}

function AppContent() {
  const { currentUser, logout } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(null);

  // Check for player display URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const campaignIdParam = urlParams.get('campaign');
  const joinCampaignId = urlParams.get('join');

  useEffect(() => {
    if (currentUser) {
      // Check if user has accepted terms
      const accepted = localStorage.getItem(`terms_accepted_${currentUser.uid}`);
      setTermsAccepted(accepted === 'true');
    }
  }, [currentUser]);

  const handleAcceptTerms = () => {
    if (currentUser) {
      localStorage.setItem(`terms_accepted_${currentUser.uid}`, 'true');
      localStorage.setItem(`terms_accepted_date_${currentUser.uid}`, new Date().toISOString());
      setTermsAccepted(true);
    }
  };

  const handleDeclineTerms = async () => {
    // If user declines, log them out
    await logout();
  };

  if (!currentUser) {
    return <AuthPage />;
  }

  // Handle player display window (skip terms check for dedicated display window)
  if (viewParam === 'playerDisplay' && campaignIdParam) {
    return <PlayerDisplay campaignId={campaignIdParam} />;
  }

  // Handle battle map display window (separate screen for battle maps)
  if (viewParam === 'battleMapDisplay' && campaignIdParam) {
    return <BattleMapDisplayWindow campaignId={campaignIdParam} />;
  }

  // Handle join campaign link (?join=campaignId)
  if (joinCampaignId) {
    const handleJoinSuccess = (campaignId) => {
      // Clear URL params and go to main app with the campaign
      window.history.replaceState({}, '', window.location.origin);
      localStorage.setItem('lastCampaignId', campaignId);
      window.location.reload();
    };

    return <JoinCampaignPage campaignId={joinCampaignId} onJoinSuccess={handleJoinSuccess} />;
  }

  // Show terms if user hasn't accepted yet
  if (termsAccepted === false) {
    return <TermsOfService onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />;
  }

  // Show loading while checking terms acceptance
  if (termsAccepted === null) {
    return (
      <div className="loading-view">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return <CampaignApp />;
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
