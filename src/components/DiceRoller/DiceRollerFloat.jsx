import { useState } from 'react';
import { Dices, X, Sun, Moon, Swords, Star, ChevronDown, ChevronUp, Lock, Sparkles } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useDiceRolls } from '../../hooks/useDiceRolls';
import { useAuth } from '../../contexts/AuthContext';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import { playRollSound, playCritSound, playDoublesSound, initAudio } from '../../utils/diceAudio';
import RollHistory from './RollHistory';
import SpecialResultOverlay from './SpecialResultOverlay';
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
  const [overlay, setOverlay] = useState(null); // Special result overlay state

  // Roll configuration state
  const [modifier, setModifier] = useState(0);
  const [numDice, setNumDice] = useState(3); // Star Wars D6
  const [selectedDie, setSelectedDie] = useState(20); // Generic
  const [diceQuantity, setDiceQuantity] = useState(1); // Generic
  const [rollLabel, setRollLabel] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [rollMode, setRollMode] = useState('normal'); // D&D 5e: normal, advantage, disadvantage

  // Broadcast to the map display window — sends pre-computed values so the map
  // shows the physics animation AND displays the exact same result the player saw.
  const broadcastRoll = async (system, rollData, mod) => {
    if (!campaignId) return;
    const playerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Player';
    const playerColor = localStorage.getItem('daggerheart_dice_color') || '#6366f1';

    const payload = {
      system,
      modifier: parseInt(mod) || 0,
      playerName,
      playerColor,
      playerId: currentUser?.uid,
      rollId: Date.now().toString(),
      timestamp: serverTimestamp(),
    };

    if (system === 'daggerheart') {
      payload.hopeDie = rollData.hopeDie;
      payload.fearDie = rollData.fearDie;
    } else if (system === 'generic') {
      payload.rolls = rollData.rolls;
      payload.dieType = rollData.dieType;
      payload.diceConfig = { [`d${rollData.dieType}`]: rollData.quantity };
    }

    try {
      await setDoc(doc(db, `campaigns/${campaignId}/battleMapDisplay/diceRoll`), payload);
    } catch (err) {
      console.error('[DiceRollerFloat] Failed to broadcast roll:', err);
    }
  };

  // Dice rolling functions - modified to accept overrides or generate random
  const rollDaggerheart = (overrides = null) => {
    const hopeDie = overrides?.hopeDie ?? (Math.floor(Math.random() * 12) + 1);
    const fearDie = overrides?.fearDie ?? (Math.floor(Math.random() * 12) + 1);
    const total = hopeDie + fearDie + parseInt(modifier);
    const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';
    const isDoubles = hopeDie === fearDie;

    return {
      hopeDie,
      fearDie,
      modifier: parseInt(modifier),
      total,
      outcome,
      isDoubles
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

  const handleRollSingleDie = async (dieType) => {
    if (isRolling) return;
    setIsRolling(true);
    initAudio();
    playRollSound();

    const mod = parseInt(modifier) || 0;
    const rollValue = Math.floor(Math.random() * dieType) + 1;
    const rollData = {
      dieType,
      quantity: 1,
      rolls: [rollValue],
      modifier: mod,
      total: rollValue + mod,
      isDoubles: false
    };

    await addRoll({
      system: 'generic',
      rollData,
      label: rollLabel || `d${dieType}`,
      isPrivate: isDM ? isPrivate : false
    });

    await broadcastRoll('generic', rollData, mod);

    setCurrentRoll({ system: 'generic', rollData });

    if (use3DDice) {
      setPending3DRoll({
        system: 'generic',
        rolls: rollData.rolls,
        dieType,
        diceConfig: { [`d${dieType}`]: 1 },
        modifier: mod,
      });
      setShow3DOverlay(true);
    }

    setRollLabel('');
    setIsRolling(false);
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
    const isDoubles = rolls.length > 1 && rolls.every(val => val === rolls[0]);

    return {
      dieType,
      quantity,
      rolls,
      modifier: parseInt(modifier),
      total,
      isDoubles
    };
  };

  const handleRoll = async () => {
    if (isRolling) return;

    setIsRolling(true);
    initAudio(); // Unlock audio

    // Always pre-compute RNG on the rolling device, then broadcast + save history
    // BEFORE showing any animation. Every viewer (including the 3D overlay on this
    // device) reads the same pre-computed values — no physics-derived RNG, no
    // divergence between screens.
    playRollSound();
    let rollData;
    switch (gameSystem) {
      case 'dnd5e': rollData = rollDnD5e(); break;
      case 'starwarsd6': rollData = rollStarWarsD6(); break;
      case 'generic': rollData = rollGeneric(); break;
      case 'daggerheart': default: rollData = rollDaggerheart(); break;
    }

    const mod = parseInt(modifier) || 0;

    // Write to shared history (authoritative)
    await addRoll({
      system: gameSystem,
      rollData,
      label: rollLabel,
      isPrivate: isDM ? isPrivate : false
    });

    // Broadcast pre-computed values to the map display — every viewer animates
    // to the SAME numbers.
    await broadcastRoll(gameSystem, rollData, mod);

    // Special-result overlays (local only)
    if (rollData.isCrit) {
      playCritSound();
      setOverlay({ type: 'crit', value: 20 });
      setTimeout(() => setOverlay(null), 2500);
    } else if (rollData.isCritFail) {
      setOverlay({ type: 'critfail', value: 1 });
      setTimeout(() => setOverlay(null), 2500);
    } else if (rollData.isDoubles || (gameSystem === 'daggerheart' && rollData.hopeDie === rollData.fearDie)) {
      playDoublesSound();
      const firstRoll = rollData.rolls?.[0];
      setOverlay({ type: 'doubles', value: rollData.hopeDie || (typeof firstRoll === 'object' ? firstRoll.result : firstRoll) });
      setTimeout(() => setOverlay(null), 2500);
    }

    setCurrentRoll({ system: gameSystem, rollData });

    if (use3DDice) {
      // Show the 3D animation pinned to the pre-computed values. The overlay
      // uses its pre-computed path (because rollData has the values) and never
      // derives new numbers from physics.
      const overlayData = {
        system: gameSystem,
        modifier: mod,
      };
      if (gameSystem === 'daggerheart') {
        overlayData.hopeDie = rollData.hopeDie;
        overlayData.fearDie = rollData.fearDie;
      } else if (gameSystem === 'dnd5e') {
        overlayData.d20 = rollData.d20;
        overlayData.d20Second = rollData.d20Second;
        overlayData.mode = rollData.mode;
      } else if (gameSystem === 'generic') {
        overlayData.rolls = rollData.rolls;
        overlayData.dieType = rollData.dieType;
        overlayData.diceConfig = { [`d${rollData.dieType}`]: rollData.quantity };
      } else if (gameSystem === 'starwarsd6') {
        overlayData.dice = rollData.dice;
        overlayData.wildDie = rollData.wildDie;
      }
      setPending3DRoll(overlayData);
      setShow3DOverlay(true);
    }

    setRollLabel('');
    setIsRolling(false);
  };

  // The 3D overlay is now purely visual — it animates the pre-computed values
  // that were already written to Firestore by handleRoll. Nothing to save.
  const handle3DRollComplete = () => {
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
    <>
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
              {gameSystem === 'daggerheart' && (
                <div className="control-row">
                  <div className="control-group">
                    <label>Extra Dice</label>
                    <div className="extra-dice-buttons">
                      {[4, 6, 8, 10, 12, 20].map(dieType => (
                        <button
                          key={dieType}
                          type="button"
                          className="die-btn"
                          style={{ borderColor: getDieColor(dieType), color: getDieColor(dieType) }}
                          onClick={() => handleRollSingleDie(dieType)}
                          disabled={isRolling}
                          title={`Roll d${dieType}`}
                        >
                          d{dieType}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                      <span className="other-dice">[{currentRoll.rollData.rolls.map(r => typeof r === 'object' ? r.result : r).join(', ')}]</span>
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
      {/* Special Result Overlay (2D) */}
      {overlay && (
        <SpecialResultOverlay
          type={overlay.type}
          value={overlay.value}
          onClose={() => setOverlay(null)}
        />
      )}
    </>
  );
}
