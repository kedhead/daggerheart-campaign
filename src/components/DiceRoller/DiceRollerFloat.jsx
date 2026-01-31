import { useState } from 'react';
import { Dices, X, Sun, Moon, Swords, Star, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useDiceRolls } from '../../hooks/useDiceRolls';
import { useAuth } from '../../contexts/AuthContext';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import RollHistory from './RollHistory';
import './DiceRollerFloat.css';

export default function DiceRollerFloat({ campaignId, gameSystem = 'daggerheart', isDM = false }) {
  const { currentUser } = useAuth();
  const { rolls, loading, addRoll, clearHistory } = useDiceRolls(campaignId, isDM);

  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape
  useEscapeKey(() => setIsOpen(false), isOpen);
  const [showHistory, setShowHistory] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState(null);

  // Roll configuration state
  const [modifier, setModifier] = useState(0);
  const [numDice, setNumDice] = useState(3); // Star Wars D6
  const [selectedDie, setSelectedDie] = useState(20); // Generic
  const [diceQuantity, setDiceQuantity] = useState(1); // Generic
  const [rollLabel, setRollLabel] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [rollMode, setRollMode] = useState('normal'); // D&D 5e: normal, advantage, disadvantage

  // Dice rolling functions
  const rollDaggerheart = () => {
    const hopeDie = Math.floor(Math.random() * 12) + 1;
    const fearDie = Math.floor(Math.random() * 12) + 1;
    const total = Math.max(hopeDie, fearDie) + parseInt(modifier);
    const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';

    return {
      hopeDie,
      fearDie,
      modifier: parseInt(modifier),
      total,
      outcome
    };
  };

  const rollDnD5e = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    let d20Second = undefined;
    let finalD20 = d20;

    if (rollMode === 'advantage' || rollMode === 'disadvantage') {
      d20Second = Math.floor(Math.random() * 20) + 1;
      finalD20 = rollMode === 'advantage'
        ? Math.max(d20, d20Second)
        : Math.min(d20, d20Second);
    }

    const total = finalD20 + parseInt(modifier);
    const isCrit = finalD20 === 20;
    const isCritFail = finalD20 === 1;

    return {
      d20,
      d20Second,
      modifier: parseInt(modifier),
      total,
      mode: rollMode,
      isCrit,
      isCritFail
    };
  };

  const rollStarWarsD6 = () => {
    const diceCount = parseInt(numDice) || 3;
    const dice = [];
    let wildDie = 0;
    let total = 0;
    let complication = false;

    // Roll all dice
    for (let i = 0; i < diceCount; i++) {
      let roll = Math.floor(Math.random() * 6) + 1;

      if (i === 0) {
        // First die is wild die
        wildDie = roll;
        if (roll === 6) {
          // Explode on 6
          const extraRoll = Math.floor(Math.random() * 6) + 1;
          roll += extraRoll;
        } else if (roll === 1) {
          complication = true;
        }
      }

      dice.push(roll);
      total += roll;
    }

    total += parseInt(modifier);

    return {
      dice,
      wildDie,
      modifier: parseInt(modifier),
      total,
      complication
    };
  };

  const rollGeneric = () => {
    const dieType = parseInt(selectedDie);
    const quantity = parseInt(diceQuantity) || 1;
    const rolls = [];
    let total = 0;

    for (let i = 0; i < quantity; i++) {
      const roll = Math.floor(Math.random() * dieType) + 1;
      rolls.push(roll);
      total += roll;
    }

    total += parseInt(modifier);

    return {
      dieType,
      quantity,
      rolls,
      modifier: parseInt(modifier),
      total
    };
  };

  const handleRoll = async () => {
    if (isRolling) return;

    setIsRolling(true);

    // Simulate rolling animation
    setTimeout(async () => {
      let rollData;

      switch (gameSystem) {
        case 'dnd5e':
          rollData = rollDnD5e();
          break;
        case 'starwarsd6':
          rollData = rollStarWarsD6();
          break;
        case 'generic':
          rollData = rollGeneric();
          break;
        case 'daggerheart':
        default:
          rollData = rollDaggerheart();
          break;
      }

      setCurrentRoll({ system: gameSystem, rollData });

      // Save to shared history
      await addRoll({
        system: gameSystem,
        rollData,
        label: rollLabel,
        isPrivate: isDM ? isPrivate : false
      });

      setRollLabel('');
      setIsRolling(false);
    }, 800);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all roll history? This cannot be undone.')) {
      await clearHistory();
    }
  };

  const getSystemLabel = () => {
    switch (gameSystem) {
      case 'dnd5e': return 'D&D 5e';
      case 'starwarsd6': return 'Star Wars D6';
      case 'generic': return 'Generic';
      case 'daggerheart':
      default: return 'Daggerheart';
    }
  };

  const getDieColor = (dieType) => {
    const colors = {
      4: '#10b981',
      6: '#3b82f6',
      8: '#8b5cf6',
      10: '#ec4899',
      12: '#f59e0b',
      20: '#ef4444'
    };
    return colors[dieType] || '#6366f1';
  };

  return (
    <div className={`dice-roller-float ${isOpen ? 'open' : ''}`}>
      {/* Floating Action Button */}
      <button
        className={`dice-fab ${isRolling ? 'rolling' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close dice roller' : 'Open dice roller'}
      >
        {isOpen ? <X size={24} /> : <Dices size={24} />}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="dice-panel">
          <div className="dice-panel-header">
            <h3>
              <Dices size={18} />
              {getSystemLabel()} Dice
            </h3>
            <button
              className="history-toggle"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              History
            </button>
          </div>

          {/* Roll History (collapsible) */}
          {showHistory && (
            <RollHistory
              rolls={rolls}
              loading={loading}
              onClear={handleClearHistory}
              isDM={isDM}
              currentUserId={currentUser?.uid}
            />
          )}

          {/* Dice Controls */}
          <div className="dice-controls">
            {/* System-specific controls */}
            {gameSystem === 'generic' && (
              <div className="control-row">
                <div className="control-group">
                  <label>Die</label>
                  <select
                    value={selectedDie}
                    onChange={(e) => setSelectedDie(e.target.value)}
                  >
                    <option value={4}>d4</option>
                    <option value={6}>d6</option>
                    <option value={8}>d8</option>
                    <option value={10}>d10</option>
                    <option value={12}>d12</option>
                    <option value={20}>d20</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Qty</label>
                  <input
                    type="number"
                    value={diceQuantity}
                    onChange={(e) => setDiceQuantity(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            )}

            {gameSystem === 'starwarsd6' && (
              <div className="control-row">
                <div className="control-group">
                  <label>Dice Pool</label>
                  <input
                    type="number"
                    value={numDice}
                    onChange={(e) => setNumDice(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            )}

            {gameSystem === 'dnd5e' && (
              <div className="control-row">
                <div className="control-group roll-mode-group">
                  <label>Mode</label>
                  <div className="roll-mode-buttons">
                    <button
                      className={`mode-btn ${rollMode === 'disadvantage' ? 'active dis' : ''}`}
                      onClick={() => setRollMode('disadvantage')}
                      title="Disadvantage"
                    >
                      Dis
                    </button>
                    <button
                      className={`mode-btn ${rollMode === 'normal' ? 'active' : ''}`}
                      onClick={() => setRollMode('normal')}
                      title="Normal"
                    >
                      Norm
                    </button>
                    <button
                      className={`mode-btn ${rollMode === 'advantage' ? 'active adv' : ''}`}
                      onClick={() => setRollMode('advantage')}
                      title="Advantage"
                    >
                      Adv
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="control-row">
              <div className="control-group">
                <label>Modifier</label>
                <input
                  type="number"
                  value={modifier}
                  onChange={(e) => setModifier(e.target.value)}
                  min="-10"
                  max="20"
                />
              </div>
              {isDM && (
                <div className="control-group private-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                    <Lock size={14} />
                    Private
                  </label>
                </div>
              )}
            </div>

            <div className="control-row">
              <input
                type="text"
                className="roll-label-input"
                placeholder="Roll for... (optional)"
                value={rollLabel}
                onChange={(e) => setRollLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
              />
            </div>

            <button
              className={`btn btn-primary roll-btn ${isRolling ? 'rolling' : ''}`}
              onClick={handleRoll}
              disabled={isRolling}
            >
              <Dices size={20} className={isRolling ? 'spin' : ''} />
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </button>
          </div>

          {/* Current Roll Result */}
          {currentRoll && (
            <div className={`roll-result-mini ${currentRoll.rollData.outcome || ''} ${currentRoll.rollData.isCrit ? 'crit' : ''} ${currentRoll.rollData.isCritFail ? 'critfail' : ''} ${currentRoll.rollData.complication ? 'complication' : ''}`}>
              {currentRoll.system === 'daggerheart' && (
                <>
                  <div className="mini-dice">
                    <span className="hope-die">
                      <Sun size={14} /> {currentRoll.rollData.hopeDie}
                    </span>
                    <span className="fear-die">
                      <Moon size={14} /> {currentRoll.rollData.fearDie}
                    </span>
                  </div>
                  <div className="mini-total">{currentRoll.rollData.total}</div>
                  <div className={`mini-outcome ${currentRoll.rollData.outcome}`}>
                    {currentRoll.rollData.outcome === 'hope' ? '✨ Hope' : '💀 Fear'}
                  </div>
                </>
              )}

              {currentRoll.system === 'dnd5e' && (
                <>
                  <div className="mini-dice">
                    <span className="d20-roll">
                      <Swords size={14} />
                      {currentRoll.rollData.d20Second !== undefined
                        ? `${currentRoll.rollData.d20}, ${currentRoll.rollData.d20Second}`
                        : currentRoll.rollData.d20
                      }
                    </span>
                  </div>
                  <div className="mini-total">{currentRoll.rollData.total}</div>
                  {currentRoll.rollData.isCrit && (
                    <div className="mini-outcome crit"><Star size={14} /> Crit!</div>
                  )}
                  {currentRoll.rollData.isCritFail && (
                    <div className="mini-outcome critfail">Crit Fail!</div>
                  )}
                </>
              )}

              {currentRoll.system === 'starwarsd6' && (
                <>
                  <div className="mini-dice">
                    <span className="wild-die">Wild: {currentRoll.rollData.wildDie}</span>
                    <span className="other-dice">[{currentRoll.rollData.dice.join(', ')}]</span>
                  </div>
                  <div className="mini-total">{currentRoll.rollData.total}</div>
                  {currentRoll.rollData.complication && (
                    <div className="mini-outcome complication">⚠️ Complication</div>
                  )}
                </>
              )}

              {currentRoll.system === 'generic' && (
                <>
                  <div className="mini-dice">
                    <span style={{ color: getDieColor(currentRoll.rollData.dieType) }}>
                      {currentRoll.rollData.quantity}d{currentRoll.rollData.dieType}
                    </span>
                    <span className="other-dice">[{currentRoll.rollData.rolls.join(', ')}]</span>
                  </div>
                  <div className="mini-total">{currentRoll.rollData.total}</div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
