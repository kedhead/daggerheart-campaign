import { getAllGameSystems } from '../../data/systems/index.js';
import './GameSystemSelector.css';

export default function GameSystemSelector({ selectedSystem, onSelect }) {
  const gameSystems = getAllGameSystems();
  console.log('GameSystemSelector rendering, found systems:', gameSystems);

  return (
    <div className="game-system-selector">
      <label className="form-label">Game System</label>
      <p className="form-help">Choose the game system for this campaign</p>

      <div className="game-system-grid">
        {gameSystems.map(system => (
          <button
            key={system.id}
            type="button"
            className={`game-system-card ${selectedSystem === system.id ? 'selected' : ''}`}
            onClick={() => onSelect(system.id)}
          >
            <div className="system-header">
              <h3>{system.name}</h3>
              {selectedSystem === system.id && (
                <span className="selected-badge">✓ Selected</span>
              )}
            </div>
            <p className="system-description">{system.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
// Force rebuild
