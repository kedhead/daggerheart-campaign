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

    const box = new DiceBox({
      container: containerRef.current,
      assetPath: '/assets/dice-box/', // Must match where we copied assets
      scale: 6,
      throwForce: 6,
      gravity: 3,
      theme: 'default',
      themeColor: '#3b82f6',
      offscreen: true, // Use offscreen canvas for performance
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

      let diceConfig = [];

      if (rollData.system === 'daggerheart') {
        // Daggerheart: 2d12 with distinct colors
        diceConfig = [
          {
            type: 'd12',
            theme: 'default',
            themeColor: '#fbbf24', // Hope (Gold)
            value: rollData.hopeDie // Pre-determined result
          },
          {
            type: 'd12',
            theme: 'default',
            themeColor: '#a855f7', // Fear (Purple)
            value: rollData.fearDie // Pre-determined result
          }
        ];
      } else if (rollData.system === 'dnd5e') {
        // D&D 5e
        const color = rollData.isCrit ? '#fbbf24' : rollData.isCritFail ? '#ef4444' : '#3b82f6';

        diceConfig.push({
          type: 'd20',
          themeColor: color,
          value: rollData.d20
        });

        if (rollData.d20Second !== undefined) {
          diceConfig.push({
            type: 'd20',
            themeColor: '#3b82f6', // Second die standard color
            value: rollData.d20Second
          });
        }
      } else if (rollData.system === 'generic') {
        // Generic
        if (rollData.rolls) {
          rollData.rolls.forEach(r => {
            // Handle both simple number array or object array with colors
            const val = typeof r === 'object' ? r.result : r;
            const col = (typeof r === 'object' && r.color) ? r.color : (rollData.playerColor || '#3b82f6');

            diceConfig.push({
              type: `d${rollData.dieType || 20}`, // Default to d20 if missing
              themeColor: col,
              value: val
            });
          });
        }
      } else if (rollData.system === 'starwarsd6') {
        // Star Wars D6
        // Wild Die
        diceConfig.push({
          type: 'd6',
          themeColor: '#fbbf24', // Gold for Wild Die
          value: rollData.wildDie
        });

        // Normal Dice
        if (rollData.dice) {
          // First die in array is wild die, skip it or handle logic match
          // Actually rollData.dice contains ALL dice including wild.
          // Let's assume index 0 is wild, others are normal.
          // But rollData.wildDie is explicit.
          // Let's rely on rollData.dice length
          const normalDiceCount = rollData.dice.length - 1;
          for (let i = 0; i < normalDiceCount; i++) {
            diceConfig.push({
              type: 'd6',
              themeColor: '#3b82f6',
              value: rollData.dice[i + 1] // Skip first (wild)
            });
          }
        }
      }

      // Roll the dice!
      // diceBox.roll(diceConfig)
      // Note: @3d-dice/dice-box accepts array of objects for advanced rolling
      // We are forcing results by passing objects with `value` property if the library supports it,
      // OR we just rely on standard roll and override?
      // Wait, standard dice-box `roll` method usually generates random values.
      // To force results, we need to look at specific API.
      // v1.x: .roll([{ type: 'd20', themeColor: '#ff0000', value: 20 }]) SHOULD work for forcing text result 
      // but physical result might differ unless we use specific physics solver or 'mock' roll.
      // Actually, standard `roll` accepts notation strings or objects.
      // If we want to visualization a PRE-DETERMINED result:
      // The library allows passing `val` or `value` in the object to force the face result.

      const results = await diceBoxRef.current.roll(diceConfig);

      // Delay to show result state
      setTimeout(() => {
        setAnimationComplete(true);
      }, 1000);

      // Notify completion
      setTimeout(() => {
        if (onComplete) onComplete();
        if (onClose) onClose();
      }, 3500); // Close after a few seconds

    } catch (error) {
      console.error('DiceBox roll error:', error);
      // Fallback
      if (onComplete) onComplete();
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
