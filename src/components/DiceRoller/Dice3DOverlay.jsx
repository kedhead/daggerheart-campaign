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

      let diceConfig = [];

      if (rollData.system === 'daggerheart') {
        // Daggerheart: 2d12 with distinct colors
        diceConfig = [
          {
            sides: 12,
            theme: 'default',
            themeColor: '#fbbf24', // Hope (Gold)
            groupId: 'hope'
          },
          {
            sides: 12,
            theme: 'default',
            themeColor: '#a855f7', // Fear (Purple)
            groupId: 'fear'
          }
        ];
      } else if (rollData.system === 'dnd5e') {
        // D&D 5e
        // For D&D we roll random if we don't have visual results yet
        // But if we passed data, we might want to respect it?
        // Actually, let's switch to Visuals-As-Truth for DnD too.

        diceConfig.push({
          sides: 20,
          themeColor: '#3b82f6',
          groupId: 'd20'
        });

        if (rollData.mode === 'advantage' || rollData.mode === 'disadvantage') {
          diceConfig.push({
            sides: 20,
            themeColor: '#3b82f6', // Second die
            groupId: 'd20Second'
          });
        }
      } else if (rollData.system === 'generic') {
        const quantity = rollData.quantity || 1;
        const sides = rollData.dieType || 20;

        for (let i = 0; i < quantity; i++) {
          diceConfig.push({
            sides: sides,
            themeColor: '#3b82f6',
            groupId: `die_${i}`
          });
        }
      } else if (rollData.system === 'starwarsd6') {
        // Star Wars - Keeping original logic because of complexity of exploding dice
        // We will TRY to just roll random and let the user handle the math mentally? 
        // No, that breaks the "Wild Die" mechanic calculation.
        // For now, we will roll visual dice matching the quantity.
        // The results won't trigger re-rolls visually, but we will pass the INITIAL results back.
        // This means visual = truth for the base roll. Exploding dice won't be visualized.

        // Wild Die
        diceConfig.push({
          sides: 6,
          themeColor: '#fbbf24',
          groupId: 'wild'
        });

        // Normal Dice
        // rollData.pendingNumDice should be passed via rollData
        const count = rollData.numDice || 3;
        for (let i = 0; i < count - 1; i++) {
          diceConfig.push({
            sides: 6,
            themeColor: '#3b82f6',
            groupId: `normal_${i}`
          });
        }
      }

      const results = await diceBoxRef.current.roll(diceConfig);

      // Process results to send back
      const rawResults = {};

      // dice-box return format is array of { groupId, value, ... }
      results.forEach(res => {
        if (res.groupId) {
          rawResults[res.groupId] = res.value;
        } else {
          // Fallback for generic without IDs
          // rawResults.push(res.value); 
        }
      });

      // For generic/star wars which use array indices
      if (rollData.system === 'generic') {
        rawResults.rolls = results.map(r => r.value);
      }
      if (rollData.system === 'starwarsd6') {
        // Map back to expected structure
        const wild = results.find(r => r.groupId === 'wild')?.value || 0;
        const others = results.filter(r => r.groupId.startsWith('normal_')).map(r => r.value);
        rawResults.wildDie = wild;
        rawResults.dice = [wild, ...others];
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
      // Fallback
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
