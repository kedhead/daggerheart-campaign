import { useState, useEffect } from 'react';
import { Dices, X, Sun, Moon, Plus, Minus, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { doc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
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

export default function PlayerDicePanel({ campaignId, playerName: propPlayerName }) {
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

  // Load player color preference from localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('daggerheart_dice_color');
    const savedName = localStorage.getItem('daggerheart_player_name');
    if (savedColor) setPlayerColor(savedColor);
    if (savedName && !propPlayerName) setPlayerName(savedName);
  }, [propPlayerName]);

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

  // Roll the dice
  const handleRoll = async () => {
    let data;

    if (rollMode === 'daggerheart') {
      const hopeDie = Math.floor(Math.random() * 12) + 1;
      const fearDie = Math.floor(Math.random() * 12) + 1;
      const total = Math.max(hopeDie, fearDie) + modifier;
      const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';

      data = {
        system: 'daggerheart',
        hopeDie,
        fearDie,
        modifier,
        total,
        outcome
      };
    } else {
      const rolls = [];
      const diceResults = {};
      let total = 0;

      DICE_TYPES.forEach(die => {
        const count = selectedDice[die.id] || 0;
        if (count > 0) {
          diceResults[die.id] = [];
          for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * die.sides) + 1;
            diceResults[die.id].push(roll);
            rolls.push({ type: die.id, sides: die.sides, result: roll, color: die.color });
            total += roll;
          }
        }
      });

      total += modifier;

      const d20Rolls = diceResults.d20 || [];
      const isCrit = d20Rolls.includes(20);
      const isCritFail = d20Rolls.length > 0 && d20Rolls.every(r => r === 1);

      data = {
        system: 'generic',
        diceResults,
        rolls,
        modifier,
        total,
        isCrit,
        isCritFail,
        dieType: Object.keys(selectedDice).find(k => selectedDice[k] > 0)?.replace('d', '') || 20,
        quantity: totalDice
      };
    }

    // Add player info
    data.playerName = playerName || 'Player';
    data.playerColor = playerColor;
    data.playerId = currentUser?.uid;
    data.timestamp = serverTimestamp();
    data.rollId = Date.now().toString();

    // Broadcast to display
    if (campaignId) {
      const rollDoc = doc(db, `campaigns/${campaignId}/battleMapDisplay/diceRoll`);
      await setDoc(rollDoc, data);

      // Also add to history
      const historyRef = collection(db, `campaigns/${campaignId}/battleMapDisplay/rolls/history`);
      await addDoc(historyRef, data);
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
        <h4>Roll History</h4>
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
                  <span className="total-mini">{roll.total}</span>
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

        .roll-history-sidebar h4 {
          margin: 0 0 0.75rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
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
      `}</style>
    </>
  );
}
