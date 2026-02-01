import { Minus, Plus, RotateCcw } from 'lucide-react';
import './DMDisplayControl.css';

export default function FearControl({
  fearCount,
  showFear,
  onIncrement,
  onDecrement,
  onReset,
  onToggleShow
}) {
  return (
    <div className="fear-control">
      <div className="fear-control-header">
        <label className="checkbox-control">
          <input
            type="checkbox"
            checked={showFear}
            onChange={onToggleShow}
          />
          <span>Show Fear Counter</span>
        </label>
      </div>

      <div className="fear-control-buttons">
        <button
          className="btn btn-fear-control btn-decrement"
          onClick={onDecrement}
          disabled={fearCount <= 0}
          title="Decrease fear"
        >
          <Minus size={20} />
        </button>

        <div className="fear-value">
          <span className="fear-number">{fearCount}</span>
          <span className="fear-label">Fear</span>
        </div>

        <button
          className="btn btn-fear-control btn-increment"
          onClick={onIncrement}
          title="Increase fear"
        >
          <Plus size={20} />
        </button>

        <button
          className="btn btn-ghost btn-icon"
          onClick={onReset}
          disabled={fearCount === 0}
          title="Reset fear to 0"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
