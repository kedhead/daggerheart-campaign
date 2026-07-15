import { useState } from 'react';
import {
  LayoutDashboard, X, Columns2, Columns3,
  Flame, Swords, Users, BookOpen, ScrollText, Activity, Hourglass, Tent, Dices,
} from 'lucide-react';
import RollHistory from '../../dice/RollHistory';
import { usePlayerDisplay } from '../../hooks/usePlayerDisplay';
import FearControl from '../PlayerDisplay/FearControl';
import InitiativeTracker from '../Initiative/InitiativeTracker';
import CountdownsPanel from './panels/CountdownsPanel';
import PartyRestPanel from './panels/PartyRestPanel';
import EncountersPanelMini from './panels/EncountersPanelMini';
import NPCsPanelMini from './panels/NPCsPanelMini';
import PartyStatusPanel from './panels/PartyStatusPanel';
import SessionPanelMini from './panels/SessionPanelMini';
import './GMScreenView.css';

const ALL_PANELS = [
  { id: 'fear',       label: 'Fear',       icon: Flame,      daggerheartOnly: true },
  { id: 'countdowns', label: 'Countdowns',  icon: Hourglass },
  { id: 'partyrest',  label: 'Party Rest',  icon: Tent,       daggerheartOnly: true },
  { id: 'initiative', label: 'Initiative',  icon: Swords },
  { id: 'encounters', label: 'Encounters',  icon: Activity },
  { id: 'npcs',       label: 'NPCs',        icon: Users },
  { id: 'session',    label: 'Session',     icon: ScrollText },
  { id: 'party',      label: 'Party',       icon: BookOpen },
  { id: 'dice',       label: 'Dice Rolls',  icon: Dices },
];

export default function GMScreenView({
  campaign,
  characters = [],
  npcs = [],
  encounters = [],
  addEncounter,
  updateEncounter,
  deleteEncounter,
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
  sessions = [],
  isDM,
  adversaries = [],
  setCurrentView,
  updateCharacter,
}) {
  const isDaggerheart = campaign?.gameSystem === 'daggerheart' || !campaign?.gameSystem;
  const storageKey = `gmscreen_${campaign?.id}`;

  const [enabledPanels, setEnabledPanels] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return isDaggerheart
      ? ['fear', 'dice', 'encounters', 'npcs']
      : ['initiative', 'dice', 'encounters', 'npcs'];
  });

  const [cols, setCols] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_cols`);
      if (saved) return saved;
    } catch { /* ignore */ }
    return '2';
  });

  const {
    fearCount,
    showFear,
    incrementFear,
    decrementFear,
    setFearCount,
    resetFear,
    toggleFear,
  } = usePlayerDisplay(campaign?.id);

  const togglePanel = (id) => {
    setEnabledPanels(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const changeCols = (c) => {
    setCols(c);
    try { localStorage.setItem(`${storageKey}_cols`, c); } catch { /* ignore */ }
  };

  const availablePanels = ALL_PANELS.filter(p => !p.daggerheartOnly || isDaggerheart);

  return (
    <div className="gm-screen-view">
      {/* ── Toolbar ── */}
      <div className="gm-screen-toolbar">
        <div className="gm-screen-toolbar-left">
          <LayoutDashboard size={16} />
          <span className="gm-screen-title">GM Screen</span>
        </div>

        <div className="gm-screen-toolbar-panels">
          {availablePanels.map(p => {
            const Icon = p.icon;
            const active = enabledPanels.includes(p.id);
            return (
              <button
                key={p.id}
                className={`gm-screen-toggle${active ? ' active' : ''}`}
                onClick={() => togglePanel(p.id)}
                title={active ? `Hide ${p.label}` : `Show ${p.label}`}
              >
                <Icon size={13} />
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="gm-screen-toolbar-right">
          <button
            className={`gm-screen-col-btn${cols === '2' ? ' active' : ''}`}
            onClick={() => changeCols('2')}
            title="2 columns"
          >
            <Columns2 size={16} />
          </button>
          <button
            className={`gm-screen-col-btn${cols === '3' ? ' active' : ''}`}
            onClick={() => changeCols('3')}
            title="3 columns"
          >
            <Columns3 size={16} />
          </button>
        </div>
      </div>

      {/* ── Panel grid ── */}
      {enabledPanels.length === 0 ? (
        <div className="gm-screen-empty">
          <LayoutDashboard size={40} />
          <p>No panels selected. Use the toolbar above to add panels to your screen.</p>
        </div>
      ) : (
        <div className="gm-screen-grid" style={{ '--cols': cols }}>
          {enabledPanels.map(id => {
            const meta = ALL_PANELS.find(p => p.id === id);
            if (!meta || (meta.daggerheartOnly && !isDaggerheart)) return null;
            const Icon = meta.icon;
            return (
              <div key={id} className="gm-screen-panel">
                <div className="gm-screen-panel-header">
                  <span className="gm-screen-panel-title">
                    <Icon size={13} />
                    {meta.label}
                  </span>
                  <button
                    className="gm-screen-panel-close"
                    onClick={() => togglePanel(id)}
                    title="Remove panel"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="gm-screen-panel-body">
                  {id === 'fear' && (
                    <FearControl
                      fearCount={fearCount}
                      showFear={showFear}
                      onIncrement={incrementFear}
                      onDecrement={decrementFear}
                      onReset={resetFear}
                      onToggleShow={toggleFear}
                    />
                  )}

                  {id === 'countdowns' && (
                    <CountdownsPanel campaign={campaign} />
                  )}

                  {id === 'partyrest' && (
                    <PartyRestPanel
                      characters={characters}
                      updateCharacter={updateCharacter}
                      fearCount={fearCount}
                      setFearCount={setFearCount}
                    />
                  )}

                  {id === 'initiative' && (
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
                  )}

                  {id === 'encounters' && (
                    <EncountersPanelMini
                      encounters={encounters}
                      addEncounter={addEncounter}
                      updateEncounter={updateEncounter}
                      deleteEncounter={deleteEncounter}
                      campaign={campaign}
                      adversaries={adversaries}
                      isDM={isDM}
                      onViewAll={() => setCurrentView?.('encounters')}
                    />
                  )}

                  {id === 'npcs' && (
                    <NPCsPanelMini
                      npcs={npcs}
                      campaign={campaign}
                      isDM={isDM}
                      onViewAll={() => setCurrentView?.('npcs')}
                    />
                  )}

                  {id === 'session' && (
                    <SessionPanelMini
                      sessions={sessions}
                      campaign={campaign}
                      onViewAll={() => setCurrentView?.('sessions')}
                    />
                  )}

                  {id === 'party' && (
                    <PartyStatusPanel
                      characters={characters}
                      campaign={campaign}
                      onViewAll={() => setCurrentView?.('characters')}
                    />
                  )}

                  {id === 'dice' && (
                    <div className="gm-dice-panel">
                      <RollHistory campaignId={campaign?.id} count={30} isDM={isDM} compact />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
