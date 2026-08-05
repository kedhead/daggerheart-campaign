// 2D fallback for the dice tray.
//
// Renders the canonical roll document directly: one shape per die, each
// showing the value the RNG already decided. No physics, no WebGL, no
// download beyond this file.
//
// Worth noting what this path can do that the 3D one can't. The 3D tray
// wears rune faces because dice-box decides a die's result by ray-casting
// whichever face lands up, so its faces can never be made to agree with the
// canonical total (see the header of DiceTray.jsx). These dice are drawn
// FROM the document, so they show the real numbers — this is the honest
// view, and the flashy one is the approximation.

import { useEffect, useState } from 'react';

// Polygon silhouettes, so a d20 doesn't read as a d6 at a glance. Values are
// percentage points on a 100x100 viewBox.
const SHAPES = {
  4:   '50,4 96,92 4,92',                                  // triangle
  6:   null,                                               // rounded square
  8:   '50,3 93,50 50,97 7,50',                            // diamond
  10:  '50,3 95,38 78,92 22,92 5,38',                      // pentagon-ish
  12:  '50,2 84,16 98,50 84,84 50,98 16,84 2,50 16,16',    // octagon
  20:  '50,3 93,27 93,73 50,97 7,73 7,27',                 // hexagon
};

function Die({ die, index, settled }) {
  const sides = die.sides || 20;
  const points = SHAPES[sides] ?? SHAPES[20];
  const color = die.color || '#6366f1';
  // Stagger so a handful of dice cascade in rather than popping at once.
  const delay = `${Math.min(index, 8) * 45}ms`;

  return (
    <div
      className={`d2d-die ${settled ? 'is-settled' : ''}`}
      style={{ animationDelay: delay, '--d2d-color': color }}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {points
          ? <polygon points={points} />
          : <rect x="6" y="6" width="88" height="88" rx="16" />}
      </svg>
      <span className="d2d-value">{die.value}</span>
      <span className="d2d-sides">d{sides}</span>
    </div>
  );
}

/**
 * One roll's dice. Mounts in a "tumbling" state for a beat so the result
 * still feels rolled rather than simply printed, then settles.
 *
 * @param {object} roll     canonical roll document
 * @param {number} duration ms before the dice settle
 * @param {function} onSettled called once, after the settle
 */
export default function Dice2DRoll({ roll, duration = 700, onSettled }) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSettled(true);
      if (onSettled) onSettled();
    }, duration);
    return () => clearTimeout(t);
    // onSettled is called exactly once per roll; re-running on identity
    // change would settle the same roll twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll?.id, duration]);

  const dice = roll?.dice || [];
  if (dice.length === 0) return null;

  return (
    <div className={`d2d-roll ${dice.length > 6 ? 'is-dense' : ''}`}>
      {dice.map((d, i) => (
        <Die key={`${roll.id}-${i}`} die={d} index={i} settled={settled} />
      ))}
    </div>
  );
}
