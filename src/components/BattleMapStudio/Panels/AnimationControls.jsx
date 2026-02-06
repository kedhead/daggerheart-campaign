import { useBattleMapStore } from '../../../stores/battleMapStore';
import { AVAILABLE_EFFECTS } from '../Canvas/MapAnimationOverlay';
import { Sparkles, CloudRain, Wind, Flame, Droplets, Snowflake, Leaf, Sun, X } from 'lucide-react';

// Icon mapping for effects
const effectIcons = {
  rain: CloudRain,
  heavyRain: CloudRain,
  snow: Snowflake,
  blizzard: Snowflake,
  fog: Wind,
  mist: Wind,
  dust: Wind,
  leaves: Leaf,
  embers: Flame,
  firelight: Flame,
  waterShimmer: Droplets
};

// Group effects by category
const groupedEffects = AVAILABLE_EFFECTS.reduce((acc, effect) => {
  if (!acc[effect.category]) acc[effect.category] = [];
  acc[effect.category].push(effect);
  return acc;
}, {});

export default function AnimationControls() {
  const {
    animationEffects,
    animationIntensity,
    animationEnabled,
    toggleAnimationEnabled,
    toggleAnimationEffect,
    setAnimationIntensity,
    clearAnimationEffects
  } = useBattleMapStore();

  const hasEffects = animationEffects.length > 0;

  return (
    <div className="animation-controls">
      <div className="controls-header">
        <Sparkles size={18} />
        <span>Map Animations</span>
        {hasEffects && (
          <button
            className="clear-btn"
            onClick={clearAnimationEffects}
            title="Clear all effects"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <p className="controls-description">
        Add subtle ambient effects to bring your map to life.
        Effects are rendered as an overlay on the static map.
      </p>

      {/* Master Toggle */}
      <div className="master-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={animationEnabled}
            onChange={toggleAnimationEnabled}
          />
          <span className="toggle-text">
            {animationEnabled ? 'Animations On' : 'Animations Off'}
          </span>
        </label>
        {hasEffects && !animationEnabled && (
          <span className="toggle-hint">
            {animationEffects.length} effect{animationEffects.length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      {/* Intensity Slider */}
      <div className="intensity-control">
        <label className="section-label">
          <Sun size={14} />
          Intensity
        </label>
        <div className="slider-row">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={animationIntensity}
            onChange={(e) => setAnimationIntensity(parseFloat(e.target.value))}
            disabled={!animationEnabled && !hasEffects}
          />
          <span className="intensity-value">{Math.round(animationIntensity * 100)}%</span>
        </div>
      </div>

      {/* Effect Categories */}
      {Object.entries(groupedEffects).map(([category, effects]) => (
        <div key={category} className="effect-category">
          <label className="section-label">{category}</label>
          <div className="effect-grid">
            {effects.map(effect => {
              const Icon = effectIcons[effect.id] || Sparkles;
              const isActive = animationEffects.includes(effect.id);

              return (
                <button
                  key={effect.id}
                  className={`effect-btn ${isActive ? 'active' : ''}`}
                  onClick={() => toggleAnimationEffect(effect.id)}
                  title={effect.label}
                >
                  <Icon size={16} />
                  <span>{effect.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Active Effects Summary */}
      {hasEffects && (
        <div className="active-effects">
          <label className="section-label">Active Effects</label>
          <div className="effect-tags">
            {animationEffects.map(effectId => {
              const effect = AVAILABLE_EFFECTS.find(e => e.id === effectId);
              const Icon = effectIcons[effectId] || Sparkles;
              return (
                <span key={effectId} className="effect-tag">
                  <Icon size={12} />
                  {effect?.label || effectId}
                  <button
                    className="tag-remove"
                    onClick={() => toggleAnimationEffect(effectId)}
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .animation-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .controls-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--hope-color);
        }

        .controls-header .clear-btn {
          margin-left: auto;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .controls-header .clear-btn:hover {
          background: var(--bg-tertiary);
          color: var(--danger);
        }

        .controls-description {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .master-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .toggle-label input {
          width: 18px;
          height: 18px;
          accent-color: var(--hope-color);
        }

        .toggle-text {
          font-weight: 500;
        }

        .toggle-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-left: auto;
        }

        .intensity-control {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .slider-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .slider-row input[type="range"] {
          flex: 1;
          height: 6px;
          -webkit-appearance: none;
          background: var(--bg-tertiary);
          border-radius: 3px;
        }

        .slider-row input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: var(--hope-color);
          border-radius: 50%;
          cursor: pointer;
        }

        .slider-row input[type="range"]:disabled {
          opacity: 0.5;
        }

        .intensity-value {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-primary);
          min-width: 45px;
          text-align: right;
        }

        .effect-category {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .effect-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .effect-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .effect-btn:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }

        .effect-btn.active {
          border-color: var(--hope-color);
          color: var(--hope-color);
          background: rgba(34, 197, 94, 0.1);
        }

        .active-effects {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
        }

        .effect-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .effect-tag {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.5rem;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid var(--hope-color);
          border-radius: 20px;
          color: var(--hope-color);
          font-size: 0.75rem;
        }

        .tag-remove {
          background: transparent;
          border: none;
          color: var(--hope-color);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-left: 2px;
        }

        .tag-remove:hover {
          background: rgba(34, 197, 94, 0.2);
        }
      `}</style>
    </div>
  );
}
