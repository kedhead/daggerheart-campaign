import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DiceBox from '@3d-dice/dice-box';
import { playRollSound, playCritSound, playDoublesSound, initAudio } from '../../utils/diceAudio';
import SpecialResultOverlay from './SpecialResultOverlay';
import './Dice3DOverlay.css';

export default function Dice3DOverlay({
  show,
  rollData,
  onComplete,
  onClose
}) {
  const containerRef = useRef(null);
  const diceBoxRef = useRef(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isBoxReady, setIsBoxReady] = useState(false);
  const [rollResult, setRollResult] = useState(null); // Local computed result for banner display
  const [specialOverlay, setSpecialOverlay] = useState(null); // For crit/doubles full-screen effect
  const [isPrecomputed, setIsPrecomputed] = useState(false); // True when rollData has pre-rolled values

  // Initialize DiceBox on mount
  useEffect(() => {
    if (diceBoxRef.current) return;
    if (!containerRef.current) return;

    const box = new DiceBox({
      container: '#dice-box-canvas',
      assetPath: '/assets/dice-box/',
      scale: 6,
      throwForce: 6,
      gravity: 3,
      theme: 'magic',
      themeColor: '#3b82f6',
      offscreen: false,
    });

    box.init().then(() => {
      diceBoxRef.current = box;
      setIsBoxReady(true);
      console.log('DiceBox initialized');
    });

    return () => { };
  }, []);

  // Handle rolling when `show` becomes true and we have data
  useEffect(() => {
    if (show && isBoxReady && rollData && !animationComplete) {
      performRoll();
    }
  }, [show, isBoxReady, rollData, animationComplete]);

  // Reset state when closed
  useEffect(() => {
    if (!show) {
      setAnimationComplete(false);
      setRollResult(null);
      setIsPrecomputed(false);
      if (diceBoxRef.current) {
        diceBoxRef.current.clear();
      }
    }
  }, [show]);

  const performRoll = async () => {
    if (!rollData) return;

    // --- Pre-computed display mode ---
    // When the broadcaster already calculated the dice values, use them directly
    // instead of re-rolling with physics (which would produce different numbers).
    const hasPrecomputed =
      (rollData.system === 'daggerheart' &&
        rollData.hopeDie !== undefined && rollData.fearDie !== undefined) ||
      (rollData.system === 'generic' &&
        Array.isArray(rollData.rolls) && rollData.rolls.length > 0) ||
      (rollData.system === 'dnd5e' && rollData.d20 !== undefined);

    if (hasPrecomputed) {
      initAudio();
      playRollSound();

      const mod = parseInt(rollData.modifier) || 0;
      let rawResults = {};
      let localResult = { system: rollData.system, modifier: mod };

      // Compute the correct pre-determined result from broadcaster values
      if (rollData.system === 'daggerheart') {
        const { hopeDie, fearDie } = rollData;
        const total = hopeDie + fearDie + mod;
        const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';
        const isDoubles = hopeDie === fearDie;
        rawResults = { hope: hopeDie, fear: fearDie };
        localResult = { ...localResult, hopeDie, fearDie, total, outcome, isDoubles };
        if (isDoubles) {
          playDoublesSound();
          setSpecialOverlay({ type: 'doubles', value: hopeDie });
          setTimeout(() => setSpecialOverlay(null), 2500);
        }
      } else if (rollData.system === 'generic') {
        const rawRolls = rollData.rolls;
        const values = rawRolls.map(r => (typeof r === 'object' && r !== null) ? r.result : r);
        const total = values.reduce((a, b) => a + b, 0) + mod;
        rawResults = {
          rolls: values,
          rollDetails: rawRolls.map(r => (typeof r === 'object' && r !== null)
            ? { value: r.result, sides: r.sides }
            : { value: r, sides: rollData.dieType || 20 }
          ),
        };
        const allSides = rawRolls.map(r => (typeof r === 'object' && r !== null) ? r.sides : (rollData.dieType || 20));
        const d20Values = values.filter((v, i) => allSides[i] === 20);
        localResult = {
          ...localResult, rolls: values, total,
          isCrit: d20Values.includes(20),
          isCritFail: d20Values.length > 0 && d20Values.every(v => v === 1),
        };
        if (localResult.isCrit) {
          playCritSound();
          setSpecialOverlay({ type: 'crit', value: 20 });
          setTimeout(() => setSpecialOverlay(null), 2500);
        } else if (localResult.isCritFail) {
          setSpecialOverlay({ type: 'critfail', value: 1 });
          setTimeout(() => setSpecialOverlay(null), 2500);
        }
      } else if (rollData.system === 'dnd5e') {
        const { d20, d20Second, mode } = rollData;
        let finalD20 = d20;
        if (d20Second !== undefined) {
          finalD20 = mode === 'advantage'
            ? Math.max(d20, d20Second) : Math.min(d20, d20Second);
        }
        rawResults = { d20, d20Second };
        localResult = {
          ...localResult, d20, d20Second, total: finalD20 + mod,
          isCrit: finalD20 === 20, isCritFail: finalD20 === 1,
        };
        if (localResult.isCrit) {
          playCritSound();
          setSpecialOverlay({ type: 'crit', value: 20 });
          setTimeout(() => setSpecialOverlay(null), 2500);
        }
      }

      // Build roll input so physics animation uses the right dice types (visuals only)
      const DICE_COLORS_P = { 4: '#10b981', 6: '#3b82f6', 8: '#8b5cf6', 10: '#ec4899', 12: '#f59e0b', 20: '#ef4444' };
      let rollInput;
      if (rollData.system === 'daggerheart') {
        rollInput = [
          { qty: 1, sides: 12, theme: 'magic', themeColor: '#fbbf24', value: [localResult.hopeDie] },
          { qty: 1, sides: 12, theme: 'magic', themeColor: '#a855f7', value: [localResult.fearDie] },
        ];
      } else if (rollData.system === 'generic') {
        if (rollData.diceConfig) {
          // If we only have config counts, we might not map exact values to colors correctly 
          // if there are multiple types, but we'll try to map the raw roll values in order.
          rollInput = [];
          let valueIdx = 0;
          Object.entries(rollData.diceConfig).forEach(([dieKey, count]) => {
            const sides = parseInt(dieKey.replace('d', ''));
            if (count > 0 && sides) {
              const dieValues = rawResults.rolls ? rawResults.rolls.slice(valueIdx, valueIdx + count) : [];
              if (dieValues.length === count) {
                // If it supports arrays of values or single values
                rollInput.push({ qty: count, sides, theme: 'magic', themeColor: DICE_COLORS_P[sides] || '#3b82f6', value: dieValues });
                valueIdx += count;
              } else {
                rollInput.push({ qty: count, sides, theme: 'magic', themeColor: DICE_COLORS_P[sides] || '#3b82f6' });
              }
            }
          });
          if (rollInput.length === 0) rollInput = [{ qty: 1, sides: 20, theme: 'magic', themeColor: '#3b82f6', value: rawResults.rolls?.[0] }];
        } else {
          const dieType = rollData.dieType || 20;
          const qty = (rawResults.rolls || []).length || 1;
          rollInput = [{ qty, sides: dieType, theme: 'magic', themeColor: DICE_COLORS_P[dieType] || '#3b82f6', value: rawResults.rolls }];
        }
      } else if (rollData.system === 'dnd5e') {
        rollInput = rollData.d20Second !== undefined
          ? [{ qty: 1, sides: 20, theme: 'magic', themeColor: '#3b82f6', value: [rawResults.d20] }, { qty: 1, sides: 20, theme: 'magic', themeColor: '#60a5fa', value: [rawResults.d20Second] }]
          : [{ qty: 1, sides: 20, theme: 'magic', themeColor: '#3b82f6', value: [rawResults.d20] }];
      } else {
        rollInput = [{ qty: 1, sides: 12, theme: 'magic', themeColor: '#fbbf24', value: [localResult.hopeDie] }, { qty: 1, sides: 12, theme: 'magic', themeColor: '#a855f7', value: [localResult.fearDie] }];
      }

      // Run physics animation for visuals — the dice tumble on screen while we ignore physics results
      setAnimationComplete(false);
      setRollResult(null);
      if (diceBoxRef.current) {
        try {
          diceBoxRef.current.clear();
          await diceBoxRef.current.roll(rollInput); // physics result intentionally discarded
        } catch (e) {
          console.warn('[Dice3D] Physics animation failed for pre-computed roll:', e);
        }
      }

      // After animation, reveal the CORRECT pre-computed result
      setRollResult(localResult);
      setTimeout(() => setAnimationComplete(true), 500);
      setTimeout(() => {
        if (onComplete) onComplete(rawResults);
        if (onClose) onClose();
      }, 3500);
      return;
    }

    // --- Physics path (PlayerDicePanel — no pre-computed values) ---
    if (!diceBoxRef.current) return;

    try {
      setAnimationComplete(false);
      setRollResult(null);
      diceBoxRef.current.clear();
      initAudio(); // Unlock audio context
      playRollSound();

      // Roll all dice at once using array of {qty, sides, themeColor} objects
      // This gives us per-die coloring AND simultaneous rolling
      let rollInput;

      if (rollData.system === 'daggerheart') {
        // Always let physics determine the result
        rollInput = [
          { qty: 1, sides: 12, themeColor: '#fbbf24' },
          { qty: 1, sides: 12, themeColor: '#a855f7' },
        ];
      } else if (rollData.system === 'dnd5e') {
        if (rollData.mode === 'advantage' || rollData.mode === 'disadvantage') {
          rollInput = [
            { qty: 1, sides: 20, themeColor: '#3b82f6' },
            { qty: 1, sides: 20, themeColor: '#60a5fa' },
          ];
        } else {
          rollInput = [{ qty: 1, sides: 20, themeColor: '#3b82f6' }];
        }
      } else if (rollData.system === 'generic') {
        const DICE_COLORS = { 4: '#10b981', 6: '#3b82f6', 8: '#8b5cf6', 10: '#ec4899', 12: '#f59e0b', 20: '#ef4444' };
        if (rollData.diceConfig) {
          // Mixed dice from BattleMapDice/PlayerDicePanel - just counts, no values
          rollInput = [];
          Object.entries(rollData.diceConfig).forEach(([dieKey, count]) => {
            const sides = parseInt(dieKey.replace('d', ''));
            if (count > 0 && sides) {
              rollInput.push({
                qty: count,
                sides,
                themeColor: DICE_COLORS[sides] || '#3b82f6',
              });
            }
          });
          if (rollInput.length === 0) rollInput = '1d20'; // Fallback
        } else if (rollData.diceResults) {
          // Legacy path - use counts from diceResults but let physics determine values
          rollInput = [];
          Object.entries(rollData.diceResults).forEach(([dieKey, results]) => {
            const sides = parseInt(dieKey.replace('d', ''));
            if (results.length > 0 && sides) {
              rollInput.push({
                qty: results.length,
                sides,
                themeColor: DICE_COLORS[sides] || '#3b82f6',
              });
            }
          });
          if (rollInput.length === 0) rollInput = '1d20'; // Fallback
        } else {
          // Simple single-type from DiceRollerFloat
          const quantity = rollData.diceQuantity || rollData.quantity || 1;
          const sides = parseInt(rollData.selectedDie || rollData.dieType) || 20;
          rollInput = [{ qty: parseInt(quantity), sides: sides, themeColor: '#3b82f6' }];
        }
      } else if (rollData.system === 'starwarsd6') {
        const count = rollData.numDice || 3;
        rollInput = [
          { qty: 1, sides: 6, themeColor: '#fbbf24' }, // Wild die (Gold)
          ...(count > 1 ? [{ qty: count - 1, sides: 6, themeColor: '#3b82f6' }] : []),
        ];
      } else {
        rollInput = '2d12';
      }

      console.log('[Dice3D] Rolling:', JSON.stringify(rollInput));
      const results = await diceBoxRef.current.roll(rollInput);
      console.log('[Dice3D] Results:', JSON.stringify(results));

      // Extract values - results is a flat array of individual die results
      // Use groupId to correctly identify which die is which (array order is NOT guaranteed)
      console.log('[Dice3D] Raw results:', JSON.stringify(results));

      const rawResults = {};
      let localResult = { system: rollData.system };
      const modifier = parseInt(rollData.modifier) || 0;

      if (rollData.system === 'daggerheart') {
        // Always use physics results - what the dice visually show
        const hopeResult = (results || []).find(r => r.groupId === 0);
        const fearResult = (results || []).find(r => r.groupId === 1);
        const hopeDie = hopeResult?.value || 0;
        const fearDie = fearResult?.value || 0;
        const total = hopeDie + fearDie + modifier;
        const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';
        const isDoubles = hopeDie === fearDie;

        rawResults.hope = hopeDie;
        rawResults.fear = fearDie;
        localResult = { ...localResult, hopeDie, fearDie, modifier, total, outcome, isDoubles };
      } else if (rollData.system === 'dnd5e') {
        // groupId 0 = first d20, groupId 1 = second d20 (adv/dis)
        const d20Result = (results || []).find(r => r.groupId === 0);
        const d20SecondResult = (results || []).find(r => r.groupId === 1);
        rawResults.d20 = d20Result?.value || 0;
        if (d20SecondResult) rawResults.d20Second = d20SecondResult.value;
        let finalD20 = rawResults.d20;
        if (rawResults.d20Second !== undefined) {
          finalD20 = rollData.mode === 'advantage'
            ? Math.max(rawResults.d20, rawResults.d20Second)
            : Math.min(rawResults.d20, rawResults.d20Second);
        }
        localResult = { ...localResult, d20: rawResults.d20, d20Second: rawResults.d20Second, total: finalD20 + modifier, isCrit: finalD20 === 20, isCritFail: finalD20 === 1 };
      } else if (rollData.system === 'generic') {
        // Always use physics results - what the dice visually show
        const values = (results || []).map(r => r.value);
        rawResults.rolls = values;
        // Include per-die details (value + sides) for history reconstruction
        rawResults.rollDetails = (results || []).map(r => ({
          value: r.value,
          sides: r.sides,
        }));
        const total = values.reduce((a, b) => a + b, 0) + modifier;
        localResult = { ...localResult, rolls: values, total };
      } else if (rollData.system === 'starwarsd6') {
        // groupId 0 = wild die, groupId 1 = other dice
        const wildResult = (results || []).find(r => r.groupId === 0);
        const otherResults = (results || []).filter(r => r.groupId === 1).map(r => r.value);
        const wildDie = wildResult?.value || 0;
        const allDice = [wildDie, ...otherResults];
        rawResults.wildDie = wildDie;
        rawResults.dice = allDice;
        const total = allDice.reduce((a, b) => a + b, 0) + modifier;
        localResult = { ...localResult, wildDie, dice: allDice, total, complication: wildDie === 1 };
      }

      // Play special sounds based on result
      if (localResult.isCrit) {
        playCritSound();
        setSpecialOverlay({ type: 'crit', value: 20 });
        setTimeout(() => setSpecialOverlay(null), 2500);
      } else if (localResult.isDoubles) {
        playDoublesSound();
        setSpecialOverlay({ type: 'doubles', value: localResult.hopeDie });
        setTimeout(() => setSpecialOverlay(null), 2500);
      } else if (localResult.isCritFail) {
        setSpecialOverlay({ type: 'critfail', value: 1 });
        setTimeout(() => setSpecialOverlay(null), 2500);
      }

      // Store result locally for the banner
      setRollResult(localResult);

      // Delay to show result state
      setTimeout(() => {
        setAnimationComplete(true);
      }, 1000);

      // Notify parent with RAW RESULTS, then close
      setTimeout(() => {
        if (onComplete) onComplete(rawResults);
        if (onClose) onClose();
      }, 3500);

    } catch (error) {
      console.error('DiceBox roll error:', error);
      if (onComplete) onComplete(null);
      if (onClose) onClose();
    }
  };

  const outcomeClass = rollResult?.outcome ||
    (rollResult?.isCrit ? 'crit' : '') ||
    (rollResult?.isCritFail ? 'critfail' : '');

  return createPortal(
    <div className={`dice-3d-overlay ${outcomeClass} ${show ? 'visible' : ''}`} onClick={onClose}>

      {/* Container for the 3D Canvas — always visible */}
      <div
        id="dice-box-canvas"
        ref={containerRef}
        className={`dice-box-canvas ${animationComplete && isPrecomputed ? 'fade-out' : ''} ${isPrecomputed ? 'precomputed-glow' : ''}`}
      />

      {/* Result Banner (Overlay on top) */}
      {animationComplete && rollResult && (
        <div className={`dice-result-banner ${outcomeClass} animate-in`}>
          {rollResult.system === 'daggerheart' && (
            <>
              <div className="dice-breakdown">
                <span className="hope-value">
                  <span className="die-label">Hope</span>
                  <span className="die-value">{rollResult.hopeDie}</span>
                </span>
                <span className="vs">vs</span>
                <span className="fear-value">
                  <span className="die-label">Fear</span>
                  <span className="die-value">{rollResult.fearDie}</span>
                </span>
              </div>
              <div className="result-total">
                {rollResult.total}
                {rollResult.modifier !== 0 && (
                  <span className="modifier-display">
                    ({rollResult.hopeDie}+{rollResult.fearDie}{rollResult.modifier >= 0 ? '+' : ''}{rollResult.modifier})
                  </span>
                )}
              </div>
              {rollResult.outcome && (
                <div className={`result-outcome ${rollResult.outcome}`}>
                  {rollResult.outcome === 'hope' ? '✨ WITH HOPE' : '💀 WITH FEAR'}
                </div>
              )}
            </>
          )}

          {/* Generic / Other Layouts */}
          {rollResult.system !== 'daggerheart' && (
            <div className="result-total">
              {rollResult.total}
            </div>
          )}

          <div className="result-hint">Click anywhere to close</div>
        </div>
      )}

      {/* Special Full Screen Overlay (Crit/Doubles) */}
      {specialOverlay && (
        <SpecialResultOverlay
          type={specialOverlay.type}
          value={specialOverlay.value}
          onClose={() => setSpecialOverlay(null)}
        />
      )}
    </div>,
    document.body
  );
}

