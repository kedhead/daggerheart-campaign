import { useEffect, useRef, useState } from 'react';
import DiceBox from '@3d-dice/dice-box';
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

      // Roll dice with per-die coloring where needed
      let results;

      if (rollData.system === 'daggerheart') {
        // Hope die (Gold) first, then add Fear die (Purple)
        diceBoxRef.current.updateConfig({ themeColor: '#fbbf24' });
        console.log('[Dice3D] Rolling Hope d12 (gold)');
        await diceBoxRef.current.roll('1d12');
        console.log('[Dice3D] Adding Fear d12 (purple)');
        diceBoxRef.current.updateConfig({ themeColor: '#a855f7' });
        results = await diceBoxRef.current.add('1d12');
      } else if (rollData.system === 'starwarsd6') {
        const count = rollData.numDice || 3;
        // Wild die (Gold) first, then add normal dice (Blue)
        diceBoxRef.current.updateConfig({ themeColor: '#fbbf24' });
        await diceBoxRef.current.roll('1d6');
        if (count > 1) {
          diceBoxRef.current.updateConfig({ themeColor: '#3b82f6' });
          results = await diceBoxRef.current.add(`${count - 1}d6`);
        } else {
          results = await diceBoxRef.current.roll('1d6');
        }
      } else {
        // Standard notation for other systems
        let notation;
        if (rollData.system === 'dnd5e') {
          notation = (rollData.mode === 'advantage' || rollData.mode === 'disadvantage') ? '2d20' : '1d20';
        } else if (rollData.system === 'generic') {
          const quantity = rollData.diceQuantity || rollData.quantity || 1;
          const sides = rollData.selectedDie || rollData.dieType || 20;
          notation = `${quantity}d${sides}`;
        } else {
          notation = '2d12';
        }
        diceBoxRef.current.updateConfig({ themeColor: '#3b82f6' });
        results = await diceBoxRef.current.roll(notation);
      }

      console.log('[Dice3D] Final results:', JSON.stringify(results));
      console.log('[Dice3D] Values:', results.map(r => ({ value: r.value, sides: r.sides })));

      // Process results into rawResults for parent AND local rollResult for banner
      const values = results.map(r => r.value);
      const rawResults = {};
      let localResult = { system: rollData.system };

      if (rollData.system === 'daggerheart') {
        const hopeDie = values[0];
        const fearDie = values[1];
        const modifier = parseInt(rollData.modifier) || 0;
        const total = hopeDie + fearDie + modifier;
        const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope';

        rawResults.hope = hopeDie;
        rawResults.fear = fearDie;

        localResult = { ...localResult, hopeDie, fearDie, modifier, total, outcome };
      } else if (rollData.system === 'dnd5e') {
        rawResults.d20 = values[0];
        if (values.length > 1) rawResults.d20Second = values[1];
        const modifier = parseInt(rollData.modifier) || 0;
        let finalD20 = values[0];
        if (values.length > 1) {
          finalD20 = rollData.mode === 'advantage'
            ? Math.max(values[0], values[1])
            : Math.min(values[0], values[1]);
        }
        localResult = { ...localResult, d20: values[0], d20Second: values[1], total: finalD20 + modifier, isCrit: finalD20 === 20, isCritFail: finalD20 === 1 };
      } else if (rollData.system === 'generic') {
        rawResults.rolls = values;
        const modifier = parseInt(rollData.modifier) || 0;
        const total = values.reduce((a, b) => a + b, 0) + modifier;
        localResult = { ...localResult, rolls: values, total };
      } else if (rollData.system === 'starwarsd6') {
        rawResults.wildDie = values[0];
        rawResults.dice = values;
        const modifier = parseInt(rollData.modifier) || 0;
        const total = values.reduce((a, b) => a + b, 0) + modifier;
        localResult = { ...localResult, wildDie: values[0], dice: values, total, complication: values[0] === 1 };
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
    </div>
  );
}

