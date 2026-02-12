import { useEffect, useRef, useState, useMemo } from 'react';
import DiceBox from '@3d-dice/dice-box';
import './Dice3DOverlay.css';

// Helper to lighter color for text/details if needed
function lightenColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lighten = (c) => Math.min(255, c + 40);
  return `#${lighten(r).toString(16).padStart(2, '0')}${lighten(g).toString(16).padStart(2, '0')}${lighten(b).toString(16).padStart(2, '0')}`;
}

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

  // Initialize DiceBox on mount
  useEffect(() => {
    // Only initialize once
    if (diceBoxRef.current) return;

    // Ensure container is available
    if (!containerRef.current) return;

    // Updated API for v1.1.0: Constructor accepts a single config object
    const box = new DiceBox({
      container: '#dice-box-canvas',
      assetPath: '/assets/dice-box/', // Must match where we copied assets
      scale: 6,
      throwForce: 6,
      gravity: 3,
      theme: 'default',
      themeColor: '#3b82f6',
      offscreen: false, // Keep offscreen false for stability
    });

    box.init().then(() => {
      diceBoxRef.current = box;
      setIsBoxReady(true);
      console.log('DiceBox initialized');
    });

    // Cleanup
    return () => {
      // DiceBox cleanup if needed
    };
  }, []); // Run on mount

  // Handle rolling when `show` becomes true and we have data
  useEffect(() => {
    if (show && isBoxReady && rollData && !animationComplete) {
      rollUtils();
    }
  }, [show, isBoxReady, rollData, animationComplete]);

  // Reset state when closed
  useEffect(() => {
    if (!show) {
      setAnimationComplete(false);
      if (diceBoxRef.current) {
        diceBoxRef.current.clear();
      }
    }
  }, [show]);

  const rollUtils = async () => {
    if (!diceBoxRef.current) return;

    try {
      setAnimationComplete(false);
      diceBoxRef.current.clear();

      // dice-box v1.1 expects notation strings like "2d12", "1d20", etc.
      // NOT objects with {sides, groupId, themeColor}
      let notation;

      if (rollData.system === 'daggerheart') {
        // 2d12 for hope + fear
        notation = '2d12';
      } else if (rollData.system === 'dnd5e') {
        if (rollData.mode === 'advantage' || rollData.mode === 'disadvantage') {
          notation = '2d20';
        } else {
          notation = '1d20';
        }
      } else if (rollData.system === 'generic') {
        const quantity = rollData.diceQuantity || rollData.quantity || 1;
        const sides = rollData.selectedDie || rollData.dieType || 20;
        notation = `${quantity}d${sides}`;
      } else if (rollData.system === 'starwarsd6') {
        const count = rollData.numDice || 3;
        notation = `${count}d6`;
      } else {
        notation = '2d12'; // Default fallback
      }

      console.log('Rolling with notation:', notation);
      const results = await diceBoxRef.current.roll(notation);
      console.log('Roll results:', JSON.stringify(results));

      // Process results - dice-box returns an array of result objects
      // Each result has a .value property with the die face value
      const values = results.map(r => r.value);
      const rawResults = {};

      if (rollData.system === 'daggerheart') {
        // First die = hope, second die = fear
        rawResults.hope = values[0];
        rawResults.fear = values[1];
      } else if (rollData.system === 'dnd5e') {
        rawResults.d20 = values[0];
        if (values.length > 1) {
          rawResults.d20Second = values[1];
        }
      } else if (rollData.system === 'generic') {
        rawResults.rolls = values;
      } else if (rollData.system === 'starwarsd6') {
        // First die is the wild die
        rawResults.wildDie = values[0];
        rawResults.dice = values;
      }

      // Delay to show result state
      setTimeout(() => {
        setAnimationComplete(true);
      }, 1000);

      // Notify completion with RAW RESULTS
      setTimeout(() => {
        if (onComplete) onComplete(rawResults);
        if (onClose) onClose();
      }, 3500);

    } catch (error) {
      console.error('DiceBox roll error:', error);
      // Fallback: generate random results so the UI doesn't break
      if (onComplete) onComplete(null);
      if (onClose) onClose();
    }
  };

  const outcomeClass = rollData?.outcome ||
    (rollData?.isCrit ? 'crit' : '') ||
    (rollData?.isCritFail ? 'critfail' : '');

  return (
    <div className={`dice-3d-overlay ${outcomeClass} ${show ? 'visible' : ''}`} onClick={onClose}>

      {/* Container for the 3D Canvas */}
      <div id="dice-box-canvas" ref={containerRef} className="dice-box-canvas"></div>

      {/* Result Banner (Overlay on top) */}
      {animationComplete && rollData && (
        <div className={`dice-result-banner ${outcomeClass} animate-in`}>
          {rollData.system === 'daggerheart' && (
            <>
              <div className="dice-breakdown">
                <span className="hope-value">
                  <span className="die-label">Hope</span>
                  <span className="die-value">{rollData.hopeDie}</span>
                </span>
                <span className="vs">vs</span>
                <span className="fear-value">
                  <span className="die-label">Fear</span>
                  <span className="die-value">{rollData.fearDie}</span>
                </span>
              </div>
              <div className="result-total">
                {rollData.total}
                {rollData.modifier !== 0 && (
                  <span className="modifier-display">
                    ({rollData.hopeDie}+{rollData.fearDie}{rollData.modifier >= 0 ? '+' : ''}{rollData.modifier})
                  </span>
                )}
              </div>
              {rollData.outcome && (
                <div className={`result-outcome ${rollData.outcome}`}>
                  {rollData.outcome === 'hope' ? '✨ WITH HOPE' : '💀 WITH FEAR'}
                </div>
              )}
            </>
          )}

          {/* Generic / Other Layouts */}
          {rollData.system !== 'daggerheart' && (
            <div className="result-total">
              {rollData.total}
            </div>
          )}

          <div className="result-hint">Click anywhere to close</div>
        </div>
      )}
    </div>
  );
}
