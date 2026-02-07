import { useState, useRef, useEffect } from 'react';
import { Dices, X, Sun, Moon, Plus, Minus } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import Dice3DOverlay from '../../DiceRoller/Dice3DOverlay';

const DICE_TYPES = [
  { id: 'd4', sides: 4, color: '#10b981', label: 'D4' },
  { id: 'd6', sides: 6, color: '#3b82f6', label: 'D6' },
  { id: 'd8', sides: 8, color: '#8b5cf6', label: 'D8' },
  { id: 'd10', sides: 10, color: '#ec4899', label: 'D10' },
  { id: 'd12', sides: 12, color: '#f59e0b', label: 'D12' },
  { id: 'd20', sides: 20, color: '#ef4444', label: 'D20' }
];

export default function BattleMapDice({ campaignId, onRollComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDice, setSelectedDice] = useState({}); // { d4: 0, d6: 2, etc }
  const [modifier, setModifier] = useState(0);
  const [rollMode, setRollMode] = useState('normal'); // normal, daggerheart
  const [show3D, setShow3D] = useState(false);
  const [rollData, setRollData] = useState(null);
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update dice count
  const updateDiceCount = (dieType, delta) => {
    setSelectedDice(prev => ({
      ...prev,
      [dieType]: Math.max(0, Math.min(10, (prev[dieType] || 0) + delta))
    }));
  };

  // Set dice count directly
  const setDiceCount = (dieType, count) => {
    setSelectedDice(prev => ({
      ...prev,
      [dieType]: Math.max(0, Math.min(10, count))
    }));
  };

  // Quick presets
  const presets = [
    { label: 'Hope & Fear', dice: {}, mode: 'daggerheart' },
    { label: '1d20', dice: { d20: 1 }, mode: 'normal' },
    { label: '2d6', dice: { d6: 2 }, mode: 'normal' },
    { label: '1d8', dice: { d8: 1 }, mode: 'normal' },
    { label: '1d12', dice: { d12: 1 }, mode: 'normal' },
  ];

  const applyPreset = (preset) => {
    setSelectedDice(preset.dice);
    setRollMode(preset.mode);
  };

  // Calculate total dice selected
  const totalDice = Object.values(selectedDice).reduce((sum, count) => sum + count, 0);

  // Roll the dice
  const handleRoll = () => {
    let data;

    if (rollMode === 'daggerheart') {
      // Roll Hope and Fear dice
      const hopeDie = Math.floor(Math.random() * 12) + 1;
      const fearDie = Math.floor(Math.random() * 12) + 1;
      const total = hopeDie + fearDie + modifier; // Both dice added together
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
      // Roll generic dice
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

      // Check for crits on d20
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
        // For 3D overlay compatibility
        dieType: Object.keys(selectedDice).find(k => selectedDice[k] > 0)?.replace('d', '') || 20,
        quantity: totalDice
      };
    }

    setRollData(data);
    setShow3D(true);
    setIsOpen(false);

    // Broadcast to Battle Map Display
    if (campaignId) {
      const rollDoc = doc(db, `campaigns/${campaignId}/battleMapDisplay/diceRoll`);
      setDoc(rollDoc, {
        ...data,
        timestamp: serverTimestamp(),
        rollId: Date.now().toString()
      }).catch(err => console.error('Failed to broadcast dice roll:', err));
    }
  };

  // Handle 3D animation complete
  const handle3DComplete = () => {
    setShow3D(false);
    if (onRollComplete && rollData) {
      onRollComplete(rollData);
    }
    setRollData(null);
  };

  // Get roll button text
  const getRollButtonText = () => {
    if (rollMode === 'daggerheart') {
      return 'Roll Hope & Fear';
    }
    if (totalDice === 0) {
      return 'Select Dice';
    }
    const parts = [];
    DICE_TYPES.forEach(die => {
      const count = selectedDice[die.id] || 0;
      if (count > 0) {
        parts.push(`${count}${die.id}`);
      }
    });
    return `Roll ${parts.join(' + ')}`;
  };

  return (
    <>
      {/* Toolbar Button */}
      <button
        className={`toolbar-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Roll Dice (R)"
      >
        <Dices size={18} />
      </button>

      {/* Dice Selection Panel */}
      {isOpen && (
        <div className="battle-dice-panel" ref={panelRef}>
          <div className="dice-panel-header">
            <h4><Dices size={16} /> Battle Map Dice</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="dice-presets">
            {presets.map((preset, i) => (
              <button
                key={i}
                className={`preset-btn ${rollMode === preset.mode && JSON.stringify(selectedDice) === JSON.stringify(preset.dice) ? 'active' : ''}`}
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Daggerheart Mode Indicator */}
          {rollMode === 'daggerheart' && (
            <div className="daggerheart-mode">
              <div className="hope-fear-preview">
                <span className="hope-die"><Sun size={16} /> Hope (d12)</span>
                <span className="fear-die"><Moon size={16} /> Fear (d12)</span>
              </div>
            </div>
          )}

          {/* Dice Type Selection */}
          {rollMode !== 'daggerheart' && (
            <div className="dice-grid">
              {DICE_TYPES.map(die => (
                <div key={die.id} className="dice-row">
                  <span className="dice-label" style={{ color: die.color }}>
                    {die.label}
                  </span>
                  <div className="dice-counter">
                    <button
                      className="counter-btn"
                      onClick={() => updateDiceCount(die.id, -1)}
                      disabled={(selectedDice[die.id] || 0) === 0}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={selectedDice[die.id] || 0}
                      onChange={(e) => setDiceCount(die.id, parseInt(e.target.value) || 0)}
                      min="0"
                      max="10"
                    />
                    <button
                      className="counter-btn"
                      onClick={() => updateDiceCount(die.id, 1)}
                      disabled={(selectedDice[die.id] || 0) >= 10}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modifier */}
          <div className="modifier-row">
            <span className="modifier-label">Modifier</span>
            <div className="dice-counter">
              <button
                className="counter-btn"
                onClick={() => setModifier(m => m - 1)}
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
              />
              <button
                className="counter-btn"
                onClick={() => setModifier(m => m + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Roll Button */}
          <button
            className="roll-dice-btn"
            onClick={handleRoll}
            disabled={rollMode !== 'daggerheart' && totalDice === 0}
          >
            <Dices size={18} />
            {getRollButtonText()}
          </button>

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${rollMode === 'daggerheart' ? 'active' : ''}`}
              onClick={() => setRollMode('daggerheart')}
            >
              <Sun size={12} /><Moon size={12} /> Daggerheart
            </button>
            <button
              className={`mode-btn ${rollMode === 'normal' ? 'active' : ''}`}
              onClick={() => setRollMode('normal')}
            >
              Custom Dice
            </button>
          </div>
        </div>
      )}

      {/* 3D Dice Overlay */}
      <Dice3DOverlay
        show={show3D}
        rollData={rollData}
        onComplete={handle3DComplete}
        onClose={() => {
          setShow3D(false);
          setRollData(null);
        }}
      />

      <style>{`
        .battle-dice-panel {
          position: absolute;
          left: 60px;
          top: 0;
          width: 260px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 100;
          overflow: hidden;
        }

        .dice-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
        }

        .dice-panel-header h4 {
          margin: 0;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .dice-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          padding: 0.75rem;
          border-bottom: 1px solid var(--border);
        }

        .preset-btn {
          padding: 0.35rem 0.6rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-btn:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }

        .preset-btn.active {
          border-color: var(--hope-color);
          color: var(--hope-color);
          background: rgba(234, 179, 8, 0.1);
        }

        .daggerheart-mode {
          padding: 1rem;
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border-bottom: 1px solid var(--border);
        }

        .hope-fear-preview {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
        }

        .hope-die {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--hope-color);
          font-weight: 600;
        }

        .fear-die {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--fear-color);
          font-weight: 600;
        }

        .dice-grid {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dice-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dice-label {
          font-weight: 600;
          font-size: 0.9rem;
          min-width: 40px;
        }

        .dice-counter {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .counter-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .counter-btn:hover:not(:disabled) {
          border-color: var(--text-primary);
          color: var(--text-primary);
        }

        .counter-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .dice-counter input {
          width: 40px;
          height: 28px;
          text-align: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .dice-counter input:focus {
          outline: none;
          border-color: var(--hope-color);
        }

        .modifier-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--border);
          background: var(--bg-tertiary);
        }

        .modifier-label {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .roll-dice-btn {
          width: calc(100% - 1.5rem);
          margin: 0.75rem;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, var(--hope-color) 0%, var(--fear-color) 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .roll-dice-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .roll-dice-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem;
          border-top: 1px solid var(--border);
          background: var(--bg-tertiary);
        }

        .mode-toggle .mode-btn {
          flex: 1;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-toggle .mode-btn:hover {
          border-color: var(--text-muted);
        }

        .mode-toggle .mode-btn.active {
          border-color: var(--fear-color);
          color: var(--fear-color);
          background: rgba(139, 92, 246, 0.1);
        }
      `}</style>
    </>
  );
}
