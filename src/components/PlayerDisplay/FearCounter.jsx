import { useEffect, useState } from 'react';
import './PlayerDisplay.css';

export default function FearCounter({ fearCount, animate = true }) {
  const [prevCount, setPrevCount] = useState(fearCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(null);

  useEffect(() => {
    if (animate && fearCount !== prevCount) {
      setDirection(fearCount > prevCount ? 'up' : 'down');
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setDirection(null);
      }, 500);
      setPrevCount(fearCount);
      return () => clearTimeout(timer);
    }
  }, [fearCount, prevCount, animate]);

  return (
    <div className={`fear-counter-display ${isAnimating ? `animating-${direction}` : ''}`}>
      <span className="fear-label">FEAR</span>
      <span className="fear-number">{fearCount}</span>
    </div>
  );
}
