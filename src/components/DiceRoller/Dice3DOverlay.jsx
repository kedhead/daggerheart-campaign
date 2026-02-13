import { useEffect, useRef, useState } from 'react';
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
      theme: 'default',
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
      if (diceBoxRef.current) {
        diceBoxRef.current.clear();
      }
    }
  }, [show]);

  const performRoll = async () => {
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
        if (rollData.hopeDie !== undefined && rollData.fearDie !== undefined) {
          // Forced roll (from pre-calculated source like Map)
          rollInput = [
            { qty: 1, sides: 12, themeColor: '#fbbf24', value: parseInt(rollData.hopeDie) },
            { qty: 1, sides: 12, themeColor: '#a855f7', value: parseInt(rollData.fearDie) },
          ];
        } else {
          // Random roll
          rollInput = [
            { qty: 1, sides: 12, themeColor: '#fbbf24' },
            { qty: 1, sides: 12, themeColor: '#a855f7' },
          ];
        }
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
        // Check if this is a mixed-dice roll from BattleMapDice
        if (rollData.diceResults) {
          // BattleMapDice passes diceResults: { d4: [...], d6: [...], d12: [...] }
          const DICE_COLORS = { 4: '#10b981', 6: '#3b82f6', 8: '#8b5cf6', 10: '#ec4899', 12: '#f59e0b', 20: '#ef4444' };
          rollInput = [];
          Object.entries(rollData.diceResults).forEach(([dieKey, results]) => {
            const sides = parseInt(dieKey.replace('d', ''));
            if (results.length > 0 && sides) {
              // Iterate through each result to support specific values
              results.forEach(val => {
                rollInput.push({
                  qty: 1,
                  sides,
                  themeColor: DICE_COLORS[sides] || '#3b82f6',
                  value: parseInt(val) // Pass the pre-calculated value
                });
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
        // Use pre-calculated values if available (SOURCE OF TRUTH)
        if (rollData.hopeDie !== undefined && rollData.fearDie !== undefined) {
          const hopeDie = parseInt(rollData.hopeDie);
          const fearDie = parseInt(rollData.fearDie);
          const total = hopeDie + fearDie + modifier;
          const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';
          const isDoubles = hopeDie === fearDie;

          rawResults.hope = hopeDie;
          rawResults.fear = fearDie;
          localResult = { ...localResult, hopeDie, fearDie, modifier, total, outcome, isDoubles };
        } else {
          // Fallback to physics results
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
        }
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
        let values;
        if (rollData.diceResults) {
          // Use pre-calculated values (SOURCE OF TRUTH)
          values = [];
          Object.values(rollData.diceResults).forEach(vArr => values.push(...vArr));
          // Flatten and match order if possible, but mainly just use the values for total
        } else {
          values = (results || []).map(r => r.value);
        }

        rawResults.rolls = values;
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

  return (
    <div className={`dice-3d-overlay ${outcomeClass} ${show ? 'visible' : ''}`} onClick={onClose}>

      {/* Container for the 3D Canvas */}
      <div id="dice-box-canvas" ref={containerRef} className="dice-box-canvas"></div>

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
    </div>
  );
}

