import { useState } from 'react';
import { Dices, X, Sun, Moon, Swords, Star, ChevronDown, ChevronUp, Lock, Sparkles } from 'lucide-react';
import { useDiceRolls } from '../../hooks/useDiceRolls';
import { useAuth } from '../../contexts/AuthContext';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import RollHistory from './RollHistory';
import Dice3DOverlay from './Dice3DOverlay';
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
  const [use3DDice, setUse3DDice] = useState(true); // Enable 3D dice by default
  const [show3DOverlay, setShow3DOverlay] = useState(false);
  const [pending3DRoll, setPending3DRoll] = useState(null);

  // Roll configuration state
  const [modifier, setModifier] = useState(0);
  const [numDice, setNumDice] = useState(3); // Star Wars D6
  const [selectedDie, setSelectedDie] = useState(20); // Generic
  const [diceQuantity, setDiceQuantity] = useState(1); // Generic
  const [rollLabel, setRollLabel] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [rollMode, setRollMode] = useState('normal'); // D&D 5e: normal, advantage, disadvantage

  // Dice rolling functions - modified to accept overrides or generate random
  const rollDaggerheart = (overrides = null) => {
    const hopeDie = overrides?.hopeDie ?? (Math.floor(Math.random() * 12) + 1);
    const fearDie = overrides?.fearDie ?? (Math.floor(Math.random() * 12) + 1);
    const total = hopeDie + fearDie + parseInt(modifier);
    const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';

    return {
      hopeDie,
      fearDie,
      modifier: parseInt(modifier),
      total,
      outcome
    };
  };

  const rollDnD5e = (overrides = null) => {
    const d20 = overrides?.d20 ?? (Math.floor(Math.random() * 20) + 1);
    let d20Second = overrides?.d20Second;
    let finalD20 = d20;

    // If we are rolling freshly (no overrides) and mode is adv/dis, generate second
    if (!overrides && (rollMode === 'advantage' || rollMode === 'disadvantage')) {
      d20Second = Math.floor(Math.random() * 20) + 1;
    }

    if (rollMode === 'advantage' || rollMode === 'disadvantage') {
      if (d20Second !== undefined) {
        finalD20 = rollMode === 'advantage'
          ? Math.max(d20, d20Second)
          : Math.min(d20, d20Second);
      }
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

  const rollStarWarsD6 = (overrides = null) => {
    // If 3D dice used, we get raw values but maybe not exploding ones visualised
    // We will just calc stats from what we got + mimic explosion if needed logic-side

    // For 2D (no overrides), we do full logic
    let dice = overrides?.dice || [];
    let wildDie = overrides?.wildDie || 0;

    const diceCount = parseInt(numDice) || 3;

    if (!overrides) {
      dice = [];
      // Generate... (same as before)
      let total = 0;
      let complication = false;

      for (let i = 0; i < diceCount; i++) {
        let roll = Math.floor(Math.random() * 6) + 1;
        if (i === 0) {
          wildDie = roll;
          if (roll === 6) {
            const extra = Math.floor(Math.random() * 6) + 1;
            roll += extra; // Simple 1-level explosion for now
          }
        }
        dice.push(roll);
      }
      // ... (rest of logic duplicated, let's simplify)
      // Actually simpler to just rely on the pure function:
      // We will reconstruct this below.
    }

    // Recalculate totals from dice array (whether override or new)
    // NOTE: If override provided (3D), we accept those FACE values.
    // If wild die was 6 in 3D, we should theoretically explode it.
    // But we didn't roll a visual 3D extra die. 
    // So we add it legally but invisibly? Or just ignore explosion for 3D?
    // Let's add it invisibly to keep math fair.

    let total = 0;
    let complication = false;

    // If generating fresh:
    if (!overrides) {
      dice = [];
      for (let i = 0; i < diceCount; i++) {
        let r = Math.floor(Math.random() * 6) + 1;
        if (i === 0) wildDie = r;
        dice.push(r);
      }
    }

    // Now process dice (apply rules)
    const processedDice = [...dice];
    const finalWildDie = processedDice[0]; // Assume first is wild

    // Explode logic (apply to first die value if it was a 6)
    // Only if it's a "fresh" 6 (face value).
    // If passed from 3D, wildDie is face value.
    if (wildDie === 6) {
      // Add an extra random calc for explosion (invisible)
      const extra = Math.floor(Math.random() * 6) + 1;
      processedDice[0] += extra;
    } else if (wildDie === 1) {
      complication = true;
    }

    total = processedDice.reduce((a, b) => a + b, 0) + parseInt(modifier);

    return {
      dice: processedDice,
      wildDie, // Face value
      modifier: parseInt(modifier),
      total,
      complication
    };
  };

  const rollGeneric = (overrides = null) => {
    const dieType = parseInt(selectedDie);
    const quantity = parseInt(diceQuantity) || 1;
    let rolls = overrides?.rolls || [];

    if (!overrides) {
      for (let i = 0; i < quantity; i++) {
        rolls.push(Math.floor(Math.random() * dieType) + 1);
      }
    }

    const total = rolls.reduce((a, b) => a + b, 0) + parseInt(modifier);

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

    // If 3D dice enabled, defer calculation!
    if (use3DDice) {
      // Prepare config to pass to overlay
      const config = {
        system: gameSystem,
        // pass params needed for setup
        numDice,
        selectedDie,
        diceQuantity,
        mode: rollMode
      };

      setPending3DRoll(config);
      setShow3DOverlay(true);
      setIsRolling(false);
      return;
    }

    // 2D Logic (Immediate)
    let rollData;
    switch (gameSystem) {
      case 'dnd5e': rollData = rollDnD5e(); break;
      case 'starwarsd6': rollData = rollStarWarsD6(); break;
      case 'generic': rollData = rollGeneric(); break;
      case 'daggerheart': default: rollData = rollDaggerheart(); break;
    }

    setTimeout(async () => {
      setCurrentRoll({ system: gameSystem, rollData });
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

  // Handle 3D dice roll completion
  const handle3DRollComplete = async (rawResults) => {
    // rawResults contains { hope: X, fear: Y } etc from Dice3DOverlay

    if (!rawResults) {
      // Error or closed without rolling
      setShow3DOverlay(false);
      setPending3DRoll(null);
      return;
    }

    let rollData;
    const system = pending3DRoll.system; // Use saved system

    switch (system) {
      case 'daggerheart':
        rollData = rollDaggerheart({
          hopeDie: rawResults.hope,
          fearDie: rawResults.fear
        });
        break;
      case 'dnd5e':
        rollData = rollDnD5e({
          d20: rawResults.d20,
          d20Second: rawResults.d20Second
        });
        break;
      case 'generic':
        rollData = rollGeneric({
          rolls: rawResults.rolls
        });
        break;
      case 'starwarsd6':
        rollData = rollStarWarsD6({
          wildDie: rawResults.wildDie,
          dice: rawResults.dice
        });
        break;
      default:
        rollData = rollDaggerheart();
    }

    setCurrentRoll({ system, rollData });

    // Save
    await addRoll({
      system,
      rollData,
      label: rollLabel,
      isPrivate: isDM ? isPrivate : false
    });

    setRollLabel('');
    setShow3DOverlay(false);
    setPending3DRoll(null);
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
              <div className="control-group dice-3d-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={use3DDice}
                    onChange={(e) => setUse3DDice(e.target.checked)}
                  />
                  <Sparkles size={14} />
                  3D Dice Animation
                </label>
              </div>
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

      {/* 3D Dice Overlay */}
      <Dice3DOverlay
        show={show3DOverlay}
        rollData={pending3DRoll}
        onComplete={handle3DRollComplete}
        onClose={() => {
          setShow3DOverlay(false);
          setPending3DRoll(null);
        }}
      />
    </div>
  );
}
