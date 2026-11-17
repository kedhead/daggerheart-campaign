import { useEffect, useRef, useState } from 'react';

/**
 * A volume slider for a reel's music or sound effects. It keeps its own value
 * while it is dragged and saves a moment after the last move. (Saving only on
 * "pointer up" lost the setting: a phone or tablet does not always send one
 * for a slider.)
 */
export default function VolumeSlider({ label = 'Volume', level, onCommit }) {
  const [value, setValue] = useState(Math.round(level * 100));
  const timer = useRef(null);
  const commit = useRef(onCommit);
  commit.current = onCommit;
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = (next) => {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit.current(next / 100), 350);
  };
  return (
    <label className="flex items-center gap-2 mt-2 text-[11px] text-lr-text-dim">
      <span className="w-12 shrink-0">{label}</span>
      <input type="range" min="0" max="100" step="5" value={value} onChange={(e) => change(Number(e.target.value))} className="flex-1" />
      <span className="w-9 text-right tabular-nums">{value}%</span>
    </label>
  );
}
