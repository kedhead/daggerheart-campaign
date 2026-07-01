import { lazy, Suspense } from 'react';
import { useCampaignData } from '../contexts/CampaignDataContext';
import { useStorybook } from '../hooks/useStorybook';

const DashboardView = lazy(() => import('./Dashboard/DashboardView'));
const CharactersView = lazy(() => import('./Characters/CharactersView'));
const MySheetView = lazy(() => import('./Characters/MySheetView'));
const LoreView = lazy(() => import('./Lore/LoreView'));
const SessionsView = lazy(() => import('./Sessions/SessionsView'));
const FilesView = lazy(() => import('./Files/FilesView'));
const ToolsView = lazy(() => import('./Tools/ToolsView'));
const HelpView = lazy(() => import('./Help/HelpView'));
const GMCheatsheetView = lazy(() => import('./GMCheatsheet/GMCheatsheetView'));
const GMScreenView = lazy(() => import('./GMScreen/GMScreenView'));
const NPCsView = lazy(() => import('./NPCs/NPCsView'));
const TimelineView = lazy(() => import('./Timeline/TimelineView'));
const LocationsView = lazy(() => import('./Locations/LocationsView'));
const EncountersView = lazy(() => import('./Encounters/EncountersView'));
const NotesView = lazy(() => import('./Notes/NotesView'));
const MessagingView = lazy(() => import('./Messaging/MessagingView'));
const CampaignBuilderView = lazy(() => import('./CampaignBuilder/CampaignBuilderView'));
const SuperAdminView = lazy(() => import('./SuperAdmin/SuperAdminView'));
const APISettings = lazy(() => import('./Settings/APISettings'));
const ItemsView = lazy(() => import('./Items/ItemsView'));
const AdversariesView = lazy(() => import('./Adversaries/AdversariesView'));
const EnvironmentsView = lazy(() => import('./Environments/EnvironmentsView'));
const PartyInventoryView = lazy(() => import('./Inventory/PartyInventoryView'));
const InitiativeTracker = lazy(() => import('./Initiative/InitiativeTracker'));
const QuestsView = lazy(() => import('./Quests/QuestsView'));
const DMDisplayControl = lazy(() => import('./PlayerDisplay/DMDisplayControl'));
const BattleMapStudio = lazy(() => import('./BattleMapStudio/BattleMapStudio'));
const StorybookView = lazy(() => import('./Storybook/StorybookView'));
const GraveyardView = lazy(() => import('./Graveyard/GraveyardView'));
const CampaignMembers = lazy(() => import('./Campaigns/CampaignMembers'));
const AICoGMHub = lazy(() => import('./AICoGM/AICoGMHub'));

function ViewFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-10 h-10 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

/**
 * Renders the active view based on currentView string.
 * All campaign data is consumed from CampaignDataContext — no prop drilling needed.
 *
 * @param {object} props
 * @param {string}   props.currentView
 * @param {function} props.setCurrentView
 * @param {boolean}  props.isDM
 * @param {string}   props.currentUserId
 * @param {string}   props.currentCampaignId
 * @param {string}   props.userRole
 * @param {function} props.onChangeUserRole
 */
export default function AppRouter({
  currentView,
  setCurrentView,
  isDM,
  currentUserId,
  currentCampaignId,
  userRole,
  onChangeUserRole,
}) {
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
    items,
    addItem,
    updateItem,
    deleteItem,
    adversaries,
    addAdversary,
    updateAdversary,
    deleteAdversary,
    environments,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    addToCharacterInventory,
    removeFromCharacterInventory,
    toggleEquipped,
    partyInventory,
    addToPartyInventory,
    removeFromPartyInventory,
    updatePartyInventoryItem,
    transferToParty,
    transferToCharacter,
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
    quests,
    addQuest,
    updateQuest,
    deleteQuest,
    toggleQuestObjective,
    maps,
    battleMaps,
    loading,
  } = useCampaignData();

  const { chapters: storybookChapters } = useStorybook(currentCampaignId);
  const publishedStorybookChapters = storybookChapters?.filter(c => c.status === 'published') || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-arcane-navy flex flex-col items-center justify-center p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
          <div className="relative w-20 h-20 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
        </div>
        <div className="text-center space-y-2 relative">
          <h2 className="font-serif text-2xl font-black text-white/90 italic lowercase tracking-tighter">Loading...</h2>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Gathering your campaign data</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<ViewFallback />}>
      {renderView()}
    </Suspense>
  );

  function renderView() {
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
          currentUserId={currentUserId}
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
          currentUserId={currentUserId}
          items={items}
          partyInventory={partyInventory}
          addToCharacterInventory={addToCharacterInventory}
          removeFromCharacterInventory={removeFromCharacterInventory}
          toggleEquipped={toggleEquipped}
          transferToParty={transferToParty}
          onGoToGraveyard={() => setCurrentView('graveyard')}
        />
      );

    case 'graveyard':
      return (
        <GraveyardView
          characters={characters}
          updateCharacter={updateCharacter}
          isDM={isDM}
        />
      );

    case 'my-sheet':
      if ((campaign?.gameSystem || 'daggerheart') !== 'daggerheart') {
        return (
          <CharactersView
            campaign={campaign}
            characters={characters}
            addCharacter={addCharacter}
            updateCharacter={updateCharacter}
            deleteCharacter={deleteCharacter}
            isDM={isDM}
            currentUserId={currentUserId}
            items={items}
            partyInventory={partyInventory}
            addToCharacterInventory={addToCharacterInventory}
            removeFromCharacterInventory={removeFromCharacterInventory}
            toggleEquipped={toggleEquipped}
            transferToParty={transferToParty}
          />
        );
      }
      return (
        <MySheetView
          characters={characters}
          currentUserId={currentUserId}
          campaign={campaign}
          addCharacter={addCharacter}
          updateCharacter={updateCharacter}
          deleteCharacter={deleteCharacter}
          isDM={isDM}
          items={items}
          addToCharacterInventory={addToCharacterInventory}
          removeFromCharacterInventory={removeFromCharacterInventory}
          toggleEquipped={toggleEquipped}
          onGoToRoster={() => setCurrentView('characters')}
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
          campaignFrame={campaignFrame}
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
          characters={characters}
          npcs={npcs}
          adversaries={adversaries}
          locations={locations}
          lore={lore}
          timelineEvents={timelineEvents}
          encounters={encounters}
          notes={notes}
          campaignFrame={campaignFrame}
          currentUserId={currentUserId}
          addEncounter={addEncounter}
          addAdversary={addAdversary}
          addNPC={addNPC}
          addLocation={addLocation}
          addLore={addLore}
          items={items}
          maps={maps}
          battleMaps={battleMaps}
          storybookChapters={publishedStorybookChapters}
          onEncounterClick={() => setCurrentView('encounters')}
        />
      );

    case 'ai-cogm':
      return (
        <AICoGMHub
          campaign={campaign}
          campaignFrame={campaignFrame}
          characters={characters}
          npcs={npcs}
          adversaries={adversaries}
          locations={locations}
          lore={lore}
          sessions={sessions}
          encounters={encounters}
          items={items}
          maps={maps}
          battleMaps={battleMaps}
          storybookChapters={publishedStorybookChapters}
          isDM={isDM}
          currentUserId={currentUserId}
          addSession={addSession}
          addEncounter={addEncounter}
          addAdversary={addAdversary}
          addNPC={addNPC}
          addLocation={addLocation}
          addLore={addLore}
          addItem={addItem}
          updateItem={updateItem}
          setCurrentView={setCurrentView}
        />
      );

    case 'files':
      return (
        <FilesView
          campaign={campaign}
          isDM={isDM}
          userId={currentUserId}
          locations={locations}
          updateCampaign={updateCampaign}
        />
      );

    case 'tools':
      return <ToolsView campaign={campaign} />;

    case 'help':
      return <HelpView campaign={campaign} />;

    case 'gm-screen':
      return (
        <GMScreenView
          campaign={campaign}
          characters={characters}
          npcs={npcs}
          encounters={encounters}
          addEncounter={addEncounter}
          updateEncounter={updateEncounter}
          deleteEncounter={deleteEncounter}
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
          sessions={sessions}
          isDM={isDM}
          adversaries={adversaries}
          setCurrentView={setCurrentView}
        />
      );

    case 'gm-cheatsheet':
      return <GMCheatsheetView />;

    case 'members':
      return <CampaignMembers campaign={campaign} currentUserId={currentUserId} />;

    case 'npcs':
      return (
        <NPCsView
          campaign={campaign}
          campaignFrame={campaignFrame}
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
          adversaries={adversaries}
          characters={characters}
          items={items}
          maps={maps}
          battleMaps={battleMaps}
          storybookChapters={publishedStorybookChapters}
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
          campaignFrame={campaignFrame}
          locations={locations}
          updateCampaign={updateCampaign}
          addLocation={addLocation}
          updateLocation={updateLocation}
          deleteLocation={deleteLocation}
          isDM={isDM}
          userId={currentUserId}
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
          addAdversary={addAdversary}
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
          currentUserId={currentUserId}
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
          currentUserId={currentUserId}
          isDM={isDM}
        />
      );

    case 'campaignBuilder':
      return (
        <CampaignBuilderView
          userId={currentUserId}
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
      return (
        <APISettings
          userId={currentUserId}
          userRole={userRole}
          onChangeUserRole={onChangeUserRole}
        />
      );

    case 'items':
      return (
        <ItemsView
          campaign={campaign}
          items={items}
          addItem={addItem}
          updateItem={updateItem}
          deleteItem={deleteItem}
          isDM={isDM}
          userId={currentUserId}
          campaignFrame={campaignFrame}
          npcs={npcs}
          locations={locations}
          lore={lore}
          sessions={sessions}
          characters={characters}
          adversaries={adversaries}
          timelineEvents={timelineEvents}
          encounters={encounters}
          notes={notes}
          maps={maps}
          battleMaps={battleMaps}
          storybookChapters={publishedStorybookChapters}
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
          userId={currentUserId}
          campaignFrame={campaignFrame}
          npcs={npcs}
          locations={locations}
          lore={lore}
          sessions={sessions}
          characters={characters}
          encounters={encounters}
          items={items}
          maps={maps}
          battleMaps={battleMaps}
          storybookChapters={publishedStorybookChapters}
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
          currentUserId={currentUserId}
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
      return <BattleMapStudio campaign={campaign} isDM={isDM} />;

    case 'storybook':
      return (
        <StorybookView
          campaign={campaign}
          campaignId={currentCampaignId}
          sessions={sessions}
          characters={characters}
          npcs={npcs}
          adversaries={adversaries}
          locations={locations}
          lore={lore}
          encounters={encounters}
          campaignFrame={campaignFrame}
          updateCampaign={updateCampaign}
          isDM={isDM}
          currentUserId={currentUserId}
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
  }
}
