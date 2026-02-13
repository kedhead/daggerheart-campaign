import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Dices, Plus, Minus, Palette, Monitor, RotateCcw } from 'lucide-react';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { playRollSound, playCritSound, playDoublesSound, initAudio } from '../utils/diceAudio';
import SpecialResultOverlay from './DiceRoller/SpecialResultOverlay';
import './DiceRoller.css';

const DICE_TYPES = [
  { id: 'd4', sides: 4, color: '#10b981', label: 'D4' },
  { id: 'd6', sides: 6, color: '#3b82f6', label: 'D6' },
  { id: 'd8', sides: 8, color: '#8b5cf6', label: 'D8' },
  { id: 'd10', sides: 10, color: '#ec4899', label: 'D10' },
  { id: 'd12', sides: 12, color: '#f59e0b', label: 'D12' },
  { id: 'd20', sides: 20, color: '#ef4444', label: 'D20' }
];

const PLAYER_COLORS = [
  { id: 'red', color: '#ef4444' },
  { id: 'orange', color: '#f97316' },
  { id: 'amber', color: '#f59e0b' },
  { id: 'lime', color: '#84cc16' },
  { id: 'green', color: '#22c55e' },
  { id: 'teal', color: '#14b8a6' },
  { id: 'cyan', color: '#06b6d4' },
  { id: 'blue', color: '#3b82f6' },
  { id: 'purple', color: '#a855f7' },
  { id: 'pink', color: '#ec4899' },
];

const QUICK_PRESETS = [
  { label: '1d20', dice: { d20: 1 } },
  { label: '2d6', dice: { d6: 2 } },
  { label: '1d8', dice: { d8: 1 } },
  { label: '1d10', dice: { d10: 1 } },
  { label: '4d6', dice: { d6: 4 } },
];

export default function DiceRoller({ isDM, campaignId, characters = [], currentUserId }) {
  const { currentUser } = useAuth();
  const [rollMode, setRollMode] = useState('daggerheart'); // 'daggerheart' | 'custom'
  const [selectedDice, setSelectedDice] = useState({});
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [rollHistory, setRollHistory] = useState([]);
  const [broadcastEnabled, setBroadcastEnabled] = useState(false);
  const [playerColor, setPlayerColor] = useState('#3b82f6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [overlay, setOverlay] = useState(null); // { type: 'crit' | 'critfail' | 'doubles', value?: number }

  // Auto-detect player name
  useEffect(() => {
    const myCharacter = characters.find(c => c.playerId === currentUserId || c.playerId === currentUser?.uid);
    if (myCharacter?.name) {
      setPlayerName(myCharacter.name);
    } else if (currentUser?.displayName) {
      setPlayerName(currentUser.displayName);
    } else if (currentUser?.email) {
      setPlayerName(currentUser.email.split('@')[0]);
    }
  }, [characters, currentUserId, currentUser]);

  // Load saved color
  useEffect(() => {
    const savedColor = localStorage.getItem('daggerheart_dice_color');
    if (savedColor) setPlayerColor(savedColor);
  }, []);

  const handleColorChange = (color) => {
    setPlayerColor(color);
    localStorage.setItem('daggerheart_dice_color', color);
    setShowColorPicker(false);
  };

  // Update dice count
  const updateDiceCount = (dieId, delta) => {
    setSelectedDice(prev => ({
      ...prev,
      [dieId]: Math.max(0, Math.min(10, (prev[dieId] || 0) + delta))
    }));
  };

  // Apply preset
  const applyPreset = (preset) => {
    setSelectedDice(preset.dice);
    setRollMode('custom');
  };

  // Clear all dice
  const clearDice = () => {
    setSelectedDice({});
    setModifier(0);
  };

  // Get total dice count
  const totalDice = Object.values(selectedDice).reduce((sum, count) => sum + count, 0);

  // Get roll formula string
  const getFormula = () => {
    const parts = [];
    DICE_TYPES.forEach(die => {
      const count = selectedDice[die.id] || 0;
      if (count > 0) parts.push(`${count}${die.id}`);
    });
    if (modifier !== 0) {
      parts.push(modifier > 0 ? `+${modifier}` : `${modifier}`);
    }
    return parts.join(' + ') || 'Select dice';
  };

  // Roll Daggerheart dice
  const rollDaggerheart = () => {
    const hopeDie = Math.floor(Math.random() * 12) + 1;
    const fearDie = Math.floor(Math.random() * 12) + 1;
    const total = hopeDie + fearDie + modifier;
    const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';
    const isDoubles = hopeDie === fearDie;

    return {
      system: 'daggerheart',
      hopeDie,
      fearDie,
      modifier,
      total,
      outcome,
      isDoubles,
      timestamp: new Date().toLocaleTimeString()
    };
  };

  // Roll custom dice
  const rollCustom = () => {
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

    return {
      system: 'generic',
      diceResults,
      rolls,
      modifier,
      total,
      isCrit,
      isCritFail,
      formula: getFormula(),
      timestamp: new Date().toLocaleTimeString()
    };
  };

  // Show overlay helper
  const showOverlayEffect = useCallback((type, value) => {
    setOverlay({ type, value });
    setTimeout(() => setOverlay(null), 2500);
  }, []);

  // Main roll function
  const rollDice = async () => {
    if (isRolling) return;
    if (rollMode === 'custom' && totalDice === 0) return;

    setIsRolling(true);
    playRollSound();

    setTimeout(async () => {
      const roll = rollMode === 'daggerheart' ? rollDaggerheart() : rollCustom();

      setCurrentRoll(roll);
      setRollHistory([roll, ...rollHistory.slice(0, 9)]);
      setIsRolling(false);

      // Check for special results and trigger effects
      if (roll.isCrit) {
        playCritSound();
        showOverlayEffect('crit', 20);
      } else if (roll.isCritFail) {
        showOverlayEffect('critfail', 1);
      } else if (roll.isDoubles) {
        playDoublesSound();
        showOverlayEffect('doubles', roll.hopeDie);
      }

      // Broadcast if enabled
      if (broadcastEnabled && campaignId) {
        try {
          const rollData = {
            ...roll,
            playerName: playerName || 'Player',
            playerColor,
            playerId: currentUser?.uid,
            timestamp: serverTimestamp(),
            rollId: Date.now().toString()
          };

          const rollDoc = doc(db, `campaigns/${campaignId}/battleMapDisplay/diceRoll`);
          await setDoc(rollDoc, rollData);

          const historyRef = collection(db, `campaigns/${campaignId}/battleMapDisplay/rolls/history`);
          await addDoc(historyRef, rollData);
        } catch (error) {
          console.error('Failed to broadcast:', error);
        }
      }
    }, 800);
  };

  return (
    <div className="dice-roller-v2">
      {/* Header with broadcast toggle */}
      <div className="dr-header">
        <div className="dr-title">Dice Roller</div>
        {campaignId && (
          <button
            className={`dr-broadcast-btn ${broadcastEnabled ? 'active' : ''}`}
            onClick={() => setBroadcastEnabled(!broadcastEnabled)}
          >
            <Monitor size={14} />
            {broadcastEnabled ? 'Live' : 'Broadcast'}
          </button>
        )}
      </div>

      {/* Player identity when broadcasting */}
      {broadcastEnabled && (
        <div className="dr-player-bar">
          <span className="dr-player-name" style={{ color: playerColor }}>
            {playerName || 'Player'}
          </span>
          <button
            className="dr-color-btn"
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{ backgroundColor: playerColor }}
          >
            <Palette size={12} />
          </button>
        </div>
      )}

      {showColorPicker && (
        <div className="dr-color-picker">
          {PLAYER_COLORS.map(c => (
            <button
              key={c.id}
              className={`dr-color-swatch ${playerColor === c.color ? 'active' : ''}`}
              style={{ backgroundColor: c.color }}
              onClick={() => handleColorChange(c.color)}
            />
          ))}
        </div>
      )}

      {/* Mode tabs */}
      <div className="dr-mode-tabs">
        <button
          className={`dr-mode-tab ${rollMode === 'daggerheart' ? 'active' : ''}`}
          onClick={() => setRollMode('daggerheart')}
        >
          <Sun size={14} />
          <Moon size={14} />
          Hope & Fear
        </button>
        <button
          className={`dr-mode-tab ${rollMode === 'custom' ? 'active' : ''}`}
          onClick={() => setRollMode('custom')}
        >
          <Dices size={14} />
          Custom Dice
        </button>
      </div>

      {/* Daggerheart mode */}
      {rollMode === 'daggerheart' && (
        <div className="dr-daggerheart-mode">
          <div className="dr-duality-preview">
            <div className="dr-duality-die hope">
              <Sun size={20} />
              <span>d12</span>
            </div>
            <span className="dr-vs">+</span>
            <div className="dr-duality-die fear">
              <Moon size={20} />
              <span>d12</span>
            </div>
          </div>
          <div className="dr-modifier-row">
            <span>Modifier</span>
            <div className="dr-modifier-controls">
              <button onClick={() => setModifier(m => m - 1)}><Minus size={14} /></button>
              <span className="dr-modifier-value">{modifier >= 0 ? `+${modifier}` : modifier}</span>
              <button onClick={() => setModifier(m => m + 1)}><Plus size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Custom dice mode */}
      {rollMode === 'custom' && (
        <div className="dr-custom-mode">
          {/* Quick presets */}
          <div className="dr-presets">
            {QUICK_PRESETS.map((preset, i) => (
              <button key={i} className="dr-preset-btn" onClick={() => applyPreset(preset)}>
                {preset.label}
              </button>
            ))}
          </div>

          {/* Dice grid */}
          <div className="dr-dice-grid">
            {DICE_TYPES.map(die => (
              <div key={die.id} className="dr-die-row">
                <div className="dr-die-icon" style={{ backgroundColor: die.color }}>
                  {die.label}
                </div>
                <div className="dr-die-controls">
                  <button
                    onClick={() => updateDiceCount(die.id, -1)}
                    disabled={!selectedDice[die.id]}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="dr-die-count">{selectedDice[die.id] || 0}</span>
                  <button onClick={() => updateDiceCount(die.id, 1)}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modifier */}
          <div className="dr-modifier-row">
            <span>Modifier</span>
            <div className="dr-modifier-controls">
              <button onClick={() => setModifier(m => m - 1)}><Minus size={14} /></button>
              <span className="dr-modifier-value">{modifier >= 0 ? `+${modifier}` : modifier}</span>
              <button onClick={() => setModifier(m => m + 1)}><Plus size={14} /></button>
            </div>
          </div>

          {/* Formula display */}
          {totalDice > 0 && (
            <div className="dr-formula">
              {getFormula()}
              <button className="dr-clear-btn" onClick={clearDice} title="Clear">
                <RotateCcw size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Roll button */}
      <button
        className={`dr-roll-btn ${isRolling ? 'rolling' : ''}`}
        onClick={rollDice}
        disabled={isRolling || (rollMode === 'custom' && totalDice === 0)}
      >
        <Dices size={20} className={isRolling ? 'spin' : ''} />
        {isRolling ? 'Rolling...' : rollMode === 'daggerheart' ? 'Roll Hope & Fear' : 'Roll Dice'}
      </button>

      {/* Result display */}
      {currentRoll && (
        <div className={`dr-result ${currentRoll.outcome || ''} ${currentRoll.isCrit ? 'crit' : ''} ${currentRoll.isCritFail ? 'critfail' : ''}`}>
          {currentRoll.system === 'daggerheart' ? (
            <>
              <div className="dr-result-dice">
                <div className="dr-result-die hope">
                  <Sun size={16} />
                  <span className="dr-result-value">{currentRoll.hopeDie}</span>
                </div>
                <span className="dr-result-plus">+</span>
                <div className="dr-result-die fear">
                  <Moon size={16} />
                  <span className="dr-result-value">{currentRoll.fearDie}</span>
                </div>
                {currentRoll.modifier !== 0 && (
                  <>
                    <span className="dr-result-plus">{currentRoll.modifier > 0 ? '+' : ''}</span>
                    <span className="dr-result-mod">{currentRoll.modifier}</span>
                  </>
                )}
              </div>
              <div className="dr-result-total">{currentRoll.total}</div>
              <div className={`dr-result-outcome ${currentRoll.outcome}`}>
                {currentRoll.outcome === 'hope' ? (
                  <><Sun size={14} /> With Hope</>
                ) : (
                  <><Moon size={14} /> With Fear</>
                )}
              </div>
              {currentRoll.isDoubles && (
                <div className="dr-result-doubles">⚡ Doubles! ({currentRoll.hopeDie} & {currentRoll.fearDie})</div>
              )}
            </>
          ) : (
            <>
              <div className="dr-result-formula">{currentRoll.formula}</div>
              <div className="dr-result-rolls">
                {currentRoll.rolls.map((roll, i) => (
                  <span
                    key={i}
                    className="dr-result-roll"
                    style={{ backgroundColor: roll.color }}
                  >
                    {roll.result}
                  </span>
                ))}
                {currentRoll.modifier !== 0 && (
                  <span className="dr-result-mod-badge">
                    {currentRoll.modifier > 0 ? '+' : ''}{currentRoll.modifier}
                  </span>
                )}
              </div>
              <div className="dr-result-total">{currentRoll.total}</div>
              {currentRoll.isCrit && <div className="dr-result-crit">Critical!</div>}
              {currentRoll.isCritFail && <div className="dr-result-critfail">Critical Fail!</div>}
            </>
          )}
        </div>
      )}

      {/* Roll history */}
      {rollHistory.length > 0 && (
        <div className="dr-history">
          <div className="dr-history-title">Recent Rolls</div>
          <div className="dr-history-list">
            {rollHistory.map((roll, i) => (
              <div key={i} className={`dr-history-item ${roll.outcome || ''}`}>
                <span className="dr-history-time">{roll.timestamp}</span>
                <span className="dr-history-info">
                  {roll.system === 'daggerheart' ? (
                    <><Sun size={12} />{roll.hopeDie} <Moon size={12} />{roll.fearDie}</>
                  ) : (
                    roll.formula
                  )}
                </span>
                <span className="dr-history-total">{roll.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen overlay for CRIT / DOUBLES */}
      {/* Full-screen overlay for CRIT / DOUBLES */}
      {overlay && (
        <SpecialResultOverlay
          type={overlay.type}
          value={overlay.value}
          onClose={() => setOverlay(null)}
        />
      )}
    </div>
  );
}
