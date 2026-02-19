import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/Dashboard/DashboardView';
import CharactersView from './components/Characters/CharactersView';
import LoreView from './components/Lore/LoreView';
import SessionsView from './components/Sessions/SessionsView';
import ToolsView from './components/Tools/ToolsView';
import GMCheatsheetView from './components/GMCheatsheet/GMCheatsheetView';
import { useCampaign } from './hooks/useCampaign';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
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
    deleteSession
  } = useCampaign();

  const renderView = () => {
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
      case 'gm-cheatsheet':
        return <GMCheatsheetView />;
      default:
        return <DashboardView campaign={campaign} updateCampaign={updateCampaign} characters={characters} lore={lore} sessions={sessions} isDM={isDM} />;
    }
  };

  return (
    <div className={`app ${isDM ? 'dm-mode' : 'player-mode'}`}>
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isDM={isDM}
        setIsDM={setIsDM}
      />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
