import { useState, useEffect } from 'react';
import { Dices, X, Sun, Moon, Plus, Minus, Palette, ChevronLeft, ChevronRight, Archive, BookOpen, Trash2 } from 'lucide-react';
import { doc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const DICE_TYPES = [
  { id: 'd4', sides: 4, color: '#10b981', label: 'D4' },
  { id: 'd6', sides: 6, color: '#3b82f6', label: 'D6' },
  { id: 'd8', sides: 8, color: '#8b5cf6', label: 'D8' },
  { id: 'd10', sides: 10, color: '#ec4899', label: 'D10' },
  { id: 'd12', sides: 12, color: '#f59e0b', label: 'D12' },
  { id: 'd20', sides: 20, color: '#ef4444', label: 'D20' }
];

const PLAYER_COLORS = [
  { id: 'red', color: '#ef4444', name: 'Red' },
  { id: 'orange', color: '#f97316', name: 'Orange' },
  { id: 'amber', color: '#f59e0b', name: 'Amber' },
  { id: 'yellow', color: '#eab308', name: 'Yellow' },
  { id: 'lime', color: '#84cc16', name: 'Lime' },
  { id: 'green', color: '#22c55e', name: 'Green' },
  { id: 'teal', color: '#14b8a6', name: 'Teal' },
  { id: 'cyan', color: '#06b6d4', name: 'Cyan' },
  { id: 'blue', color: '#3b82f6', name: 'Blue' },
  { id: 'indigo', color: '#6366f1', name: 'Indigo' },
  { id: 'purple', color: '#a855f7', name: 'Purple' },
  { id: 'pink', color: '#ec4899', name: 'Pink' },
  { id: 'rose', color: '#f43f5e', name: 'Rose' },
  { id: 'white', color: '#ffffff', name: 'White' },
];

export default function PlayerDicePanel({ campaignId, playerName: propPlayerName, characters = [] }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [playerColor, setPlayerColor] = useState('#3b82f6');
  const [playerName, setPlayerName] = useState(propPlayerName || '');
  const [selectedDice, setSelectedDice] = useState({});
  const [modifier, setModifier] = useState(0);
  const [rollMode, setRollMode] = useState('daggerheart');
  const [rollHistory, setRollHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [battleLogEntries, setBattleLogEntries] = useState([]);
  const [isArchiving, setIsArchiving] = useState(false);

  // Load player color preference and auto-detect name
  useEffect(() => {
    const savedColor = localStorage.getItem('daggerheart_dice_color');
    if (savedColor) setPlayerColor(savedColor);

    // If propPlayerName is provided, use it
    if (propPlayerName) {
      setPlayerName(propPlayerName);
      return;
    }

    // Try to get from localStorage first
    const savedName = localStorage.getItem('daggerheart_player_name');
    if (savedName) {
      setPlayerName(savedName);
      return;
    }

    // Try to get character name
    const myCharacter = characters.find(c => c.playerId === currentUser?.uid);
    if (myCharacter?.name) {
      setPlayerName(myCharacter.name);
      return;
    }

    // Fall back to display name
    if (currentUser?.displayName) {
      setPlayerName(currentUser.displayName);
      return;
    }

    // Fall back to email prefix
    if (currentUser?.email) {
      setPlayerName(currentUser.email.split('@')[0]);
    }
  }, [propPlayerName, characters, currentUser]);

  // Save color preference
  const handleColorChange = (color) => {
    setPlayerColor(color);
    localStorage.setItem('daggerheart_dice_color', color);
  };

  // Save name preference
  const handleNameChange = (name) => {
    setPlayerName(name);
    localStorage.setItem('daggerheart_player_name', name);
  };

  // Subscribe to roll history
  useEffect(() => {
    if (!campaignId) return;

    const rollsRef = collection(db, `campaigns/${campaignId}/battleMapDisplay/rolls/history`);
    const q = query(rollsRef, orderBy('timestamp', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rolls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRollHistory(rolls);
    });

    return unsubscribe;
  }, [campaignId]);

  // Update dice count
  const updateDiceCount = (dieType, delta) => {
    setSelectedDice(prev => ({
      ...prev,
      [dieType]: Math.max(0, Math.min(10, (prev[dieType] || 0) + delta))
    }));
  };

  const totalDice = Object.values(selectedDice).reduce((sum, count) => sum + count, 0);

  // Roll the dice - let 3D physics determine values, save history after animation
  const handleRoll = async () => {
    let data;

    if (rollMode === 'daggerheart') {
      // Don't pre-calculate - let 3D physics decide
      data = {
        system: 'daggerheart',
        modifier,
      };
    } else {
      // Build dice config (counts only, no pre-calculated values)
      const diceConfig = {};
      DICE_TYPES.forEach(die => {
        const count = selectedDice[die.id] || 0;
        if (count > 0) {
          diceConfig[die.id] = count;
        }
      });

      data = {
        system: 'generic',
        diceConfig,
        modifier,
      };
    }

    // Add player info
    data.playerName = playerName || 'Player';
    data.playerColor = playerColor;
    data.playerId = currentUser?.uid;
    data.timestamp = serverTimestamp();
    data.rollId = Date.now().toString();

    // Broadcast to display (triggers 3D animation)
    // History will be saved by BattleMapDisplayWindow after 3D animation completes
    if (campaignId) {
      const rollDoc = doc(db, `campaigns/${campaignId}/battleMapDisplay/diceRoll`);
      await setDoc(rollDoc, data);
    }

    setIsOpen(false);
  };

  const getRollButtonText = () => {
    if (rollMode === 'daggerheart') return 'Roll Hope & Fear';
    if (totalDice === 0) return 'Select Dice';
    const parts = [];
    DICE_TYPES.forEach(die => {
      const count = selectedDice[die.id] || 0;
      if (count > 0) parts.push(`${count}${die.id}`);
    });
    return `Roll ${parts.join(' + ')}`;
  };

  // Archive current roll history to battle log
  const archiveHistory = async () => {
    if (!campaignId || rollHistory.length === 0) return;

    setIsArchiving(true);
    try {
      // Create a battle log entry with current rolls
      const battleLogRef = collection(db, `campaigns/${campaignId}/battleLog`);
      await addDoc(battleLogRef, {
        rolls: rollHistory,
        timestamp: serverTimestamp(),
        archivedBy: currentUser?.uid,
        archivedByName: playerName || currentUser?.displayName || 'Unknown',
        rollCount: rollHistory.length
      });

      // Clear the current history
      const historyRef = collection(db, `campaigns/${campaignId}/battleMapDisplay/rolls/history`);
      const historySnapshot = await getDocs(historyRef);

      const batch = writeBatch(db);
      historySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log('Roll history archived successfully');
    } catch (error) {
      console.error('Failed to archive roll history:', error);
      alert('Failed to archive history. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  // Load battle log entries
  useEffect(() => {
    if (!campaignId || !showBattleLog) return;

    const logRef = collection(db, `campaigns/${campaignId}/battleLog`);
    const q = query(logRef, orderBy('timestamp', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBattleLogEntries(entries);
    });

    return unsubscribe;
  }, [campaignId, showBattleLog]);

  return (
    <>
      {/* Floating dice button */}
      <button
        className="player-dice-fab"
        onClick={() => setIsOpen(!isOpen)}
        style={{ borderColor: playerColor, boxShadow: `0 0 20px ${playerColor}40` }}
      >
        <Dices size={24} />
      </button>

      {/* Roll History Sidebar */}
      <div className={`roll-history-sidebar ${showHistory ? 'open' : ''}`}>
        <button className="history-toggle-btn" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div className="history-header">
          <h4>Roll History</h4>
          <div className="history-actions">
            <button
              className="history-action-btn"
              onClick={() => setShowBattleLog(!showBattleLog)}
              title="View Battle Log"
            >
              <BookOpen size={14} />
            </button>
            <button
              className="history-action-btn"
              onClick={archiveHistory}
              disabled={rollHistory.length === 0 || isArchiving}
              title="Archive & Clear History"
            >
              {isArchiving ? <Archive size={14} className="spinning" /> : <Archive size={14} />}
            </button>
          </div>
        </div>
        <div className="roll-history-list">
          {rollHistory.map(roll => (
            <div
              key={roll.id}
              className={`roll-history-item ${roll.outcome || ''}`}
              style={{ borderLeftColor: roll.playerColor }}
            >
              <div className="roll-player" style={{ color: roll.playerColor }}>
                {roll.playerName || 'Unknown'}
              </div>
              <div className="roll-result">
                {roll.system === 'daggerheart' ? (
                  <>
                    <span className="hope-mini">{roll.hopeDie}</span>
                    <span className="vs-mini">/</span>
                    <span className="fear-mini">{roll.fearDie}</span>
                    <span className="total-mini">= {roll.total}</span>
                    <span className={`outcome-mini ${roll.outcome}`}>
                      {roll.outcome === 'hope' ? '✨' : '💀'}
                    </span>
                  </>
                ) : (
                  <>
                    {roll.rolls && roll.rolls.length > 0 && (
                      <>
                        <span className="dice-breakdown">
                          {roll.rolls.map((r, i) => (
                            <span key={i} style={{ color: r.color }}>
                              {r.result}{i < roll.rolls.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                        {roll.modifier !== 0 && (
                          <span className="modifier-mini">
                            {roll.modifier > 0 ? ' +' : ' '}{roll.modifier}
                          </span>
                        )}
                        <span className="equals-mini"> = </span>
                      </>
                    )}
                    <span className="total-mini">{roll.total}</span>
                    {roll.isCrit && <span className="crit-mini">🎯</span>}
                    {roll.isCritFail && <span className="critfail-mini">💥</span>}
                  </>
                )}
              </div>
            </div>
          ))}
          {rollHistory.length === 0 && (
            <div className="no-rolls">No rolls yet</div>
          )}
        </div>
      </div>

      {/* Dice Panel */}
      {isOpen && (
        <div className="player-dice-panel">
          <div className="panel-header">
            <h4><Dices size={16} /> Roll Dice</h4>
            <button onClick={() => setIsOpen(false)}><X size={16} /></button>
          </div>

          {/* Player Name & Color */}
          <div className="player-identity">
            <input
              type="text"
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Your name..."
              className="player-name-input"
              style={{ borderColor: playerColor }}
            />
            <button
              className="color-picker-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
              style={{ backgroundColor: playerColor }}
            >
              <Palette size={14} />
            </button>
          </div>

          {/* Color Picker */}
          {showColorPicker && (
            <div className="color-picker-grid">
              {PLAYER_COLORS.map(c => (
                <button
                  key={c.id}
                  className={`color-swatch ${playerColor === c.color ? 'active' : ''}`}
                  style={{ backgroundColor: c.color }}
                  onClick={() => {
                    handleColorChange(c.color);
                    setShowColorPicker(false);
                  }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              className={rollMode === 'daggerheart' ? 'active' : ''}
              onClick={() => setRollMode('daggerheart')}
            >
              <Sun size={12} /><Moon size={12} /> Hope & Fear
            </button>
            <button
              className={rollMode === 'custom' ? 'active' : ''}
              onClick={() => setRollMode('custom')}
            >
              Custom
            </button>
          </div>

          {/* Daggerheart Mode */}
          {rollMode === 'daggerheart' && (
            <div className="daggerheart-preview">
              <span className="hope"><Sun size={16} /> d12</span>
              <span className="fear"><Moon size={16} /> d12</span>
            </div>
          )}

          {/* Custom Dice */}
          {rollMode === 'custom' && (
            <div className="dice-grid">
              {DICE_TYPES.map(die => (
                <div key={die.id} className="dice-row">
                  <span style={{ color: die.color }}>{die.label}</span>
                  <div className="counter">
                    <button onClick={() => updateDiceCount(die.id, -1)} disabled={!selectedDice[die.id]}>
                      <Minus size={12} />
                    </button>
                    <span>{selectedDice[die.id] || 0}</span>
                    <button onClick={() => updateDiceCount(die.id, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modifier */}
          <div className="modifier-row">
            <span>Modifier</span>
            <div className="counter">
              <button onClick={() => setModifier(m => m - 1)}><Minus size={12} /></button>
              <span>{modifier >= 0 ? `+${modifier}` : modifier}</span>
              <button onClick={() => setModifier(m => m + 1)}><Plus size={12} /></button>
            </div>
          </div>

          {/* Roll Button */}
          <button
            className="roll-btn"
            onClick={handleRoll}
            disabled={rollMode === 'custom' && totalDice === 0}
            style={{ background: `linear-gradient(135deg, ${playerColor} 0%, ${playerColor}99 100%)` }}
          >
            <Dices size={18} />
            {getRollButtonText()}
          </button>
        </div>
      )}

      {/* Battle Log Modal */}
      {showBattleLog && (
        <div className="battle-log-modal" onClick={() => setShowBattleLog(false)}>
          <div className="battle-log-content" onClick={(e) => e.stopPropagation()}>
            <div className="battle-log-header">
              <h3><BookOpen size={20} /> Battle Log</h3>
              <button onClick={() => setShowBattleLog(false)}><X size={20} /></button>
            </div>
            <div className="battle-log-body">
              {battleLogEntries.length === 0 ? (
                <div className="no-battle-logs">
                  <Archive size={48} style={{ opacity: 0.3 }} />
                  <p>No archived battles yet</p>
                  <p className="hint">Use the archive button to save roll history</p>
                </div>
              ) : (
                battleLogEntries.map(entry => (
                  <div key={entry.id} className="battle-log-entry">
                    <div className="battle-log-entry-header">
                      <span className="battle-log-time">
                        {entry.timestamp?.toDate?.()?.toLocaleString() || 'Unknown time'}
                      </span>
                      <span className="battle-log-info">
                        {entry.rollCount} rolls • {entry.archivedByName}
                      </span>
                    </div>
                    <div className="battle-log-rolls">
                      {entry.rolls?.map((roll, i) => (
                        <div key={i} className="battle-log-roll" style={{ borderLeftColor: roll.playerColor }}>
                          <span className="battle-log-player" style={{ color: roll.playerColor }}>
                            {roll.playerName}
                          </span>
                          <span className="battle-log-result">
                            {roll.system === 'daggerheart' ? (
                              <>
                                <span style={{ color: '#fbbf24' }}>{roll.hopeDie}</span>
                                <span style={{ opacity: 0.4 }}>/</span>
                                <span style={{ color: '#a855f7' }}>{roll.fearDie}</span>
                                <span> = {roll.total}</span>
                              </>
                            ) : (
                              <>
                                {roll.rolls && roll.rolls.length > 0 && (
                                  <span className="log-dice-breakdown">
                                    {roll.rolls.map((r, j) => (
                                      <span key={j} style={{ color: r.color }}>
                                        {r.result}{j < roll.rolls.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                    {roll.modifier !== 0 && ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`}
                                    {' = '}
                                  </span>
                                )}
                                <span>{roll.total}</span>
                              </>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .player-dice-fab {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.8);
          border: 3px solid;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 100;
          transition: transform 0.2s;
        }

        .player-dice-fab:hover {
          transform: scale(1.1);
        }

        .roll-history-sidebar {
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%) translateX(100%);
          width: 200px;
          max-height: 400px;
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-right: none;
          border-radius: 12px 0 0 12px;
          padding: 1rem;
          z-index: 50;
          transition: transform 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .roll-history-sidebar.open {
          transform: translateY(-50%) translateX(0);
        }

        .history-toggle-btn {
          position: absolute;
          left: -24px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 48px;
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-right: none;
          border-radius: 8px 0 0 8px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .roll-history-sidebar h4 {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .history-actions {
          display: flex;
          gap: 0.25rem;
        }

        .history-action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 0.25rem;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .history-action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .history-action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .roll-history-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .roll-history-item {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          border-left: 3px solid;
        }

        .roll-history-item.hope {
          background: rgba(251, 191, 36, 0.1);
        }

        .roll-history-item.fear {
          background: rgba(168, 85, 247, 0.1);
        }

        .roll-player {
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .roll-result {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.9rem;
        }

        .hope-mini { color: #fbbf24; font-weight: 600; }
        .fear-mini { color: #a855f7; font-weight: 600; }
        .vs-mini { color: rgba(255,255,255,0.4); }
        .total-mini { color: white; font-weight: 700; }
        .outcome-mini { font-size: 0.8rem; }
        .dice-breakdown { font-size: 0.85rem; font-weight: 500; }
        .modifier-mini { color: rgba(255,255,255,0.7); font-size: 0.85rem; }
        .equals-mini { color: rgba(255,255,255,0.4); }
        .crit-mini { font-size: 0.9rem; }
        .critfail-mini { font-size: 0.9rem; }

        .no-rolls {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          text-align: center;
          padding: 1rem;
        }

        .player-dice-panel {
          position: fixed;
          bottom: 5rem;
          right: 1.5rem;
          width: 280px;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          z-index: 101;
          backdrop-filter: blur(10px);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .panel-header h4 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
        }

        .panel-header button {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
        }

        .player-identity {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .player-name-input {
          flex: 1;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid;
          border-radius: 6px;
          color: white;
          font-size: 0.9rem;
        }

        .player-name-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .color-picker-btn {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: 2px solid rgba(255,255,255,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .color-picker-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.35rem;
          margin-bottom: 0.75rem;
        }

        .color-swatch {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .color-swatch:hover {
          transform: scale(1.1);
        }

        .color-swatch.active {
          border-color: white;
          box-shadow: 0 0 10px currentColor;
        }

        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .mode-toggle button {
          flex: 1;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }

        .mode-toggle button.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
          color: white;
        }

        .daggerheart-preview {
          display: flex;
          justify-content: center;
          gap: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }

        .daggerheart-preview .hope {
          color: #fbbf24;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .daggerheart-preview .fear {
          color: #a855f7;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .dice-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .dice-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dice-row span:first-child {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .counter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .counter button {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .counter button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .counter span {
          min-width: 24px;
          text-align: center;
          color: white;
        }

        .modifier-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .roll-btn {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s;
        }

        .roll-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .roll-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Battle Log Modal */
        .battle-log-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          backdrop-filter: blur(4px);
        }

        .battle-log-content {
          background: rgba(0, 0, 0, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .battle-log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .battle-log-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
        }

        .battle-log-header button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .battle-log-header button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .battle-log-body {
          padding: 1rem;
          overflow-y: auto;
          flex: 1;
        }

        .no-battle-logs {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .no-battle-logs p {
          margin: 0.5rem 0;
        }

        .no-battle-logs .hint {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .battle-log-entry {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .battle-log-entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .battle-log-time {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
        }

        .battle-log-info {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .battle-log-rolls {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .battle-log-roll {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          border-left: 3px solid;
          font-size: 0.9rem;
        }

        .battle-log-player {
          font-weight: 600;
          font-size: 0.85rem;
        }

        .battle-log-result {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .log-dice-breakdown {
          opacity: 0.8;
          font-size: 0.85rem;
        }
      `}</style>
    </>
  );
}
