import { Eye, EyeOff, Filter, X } from 'lucide-react';
import { getTypeLabel } from '../../utils/graphCalculations';
import './RelationshipGraph.css';

export default function GraphControls({
  selectedTypes,
  setSelectedTypes,
  showLabels,
  setShowLabels,
  focusNode,
  setFocusNode
}) {
  const allTypes = ['npc', 'location', 'lore', 'session', 'timelineEvent', 'encounter', 'note'];

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const selectAll = () => {
    setSelectedTypes(allTypes);
  };

  const deselectAll = () => {
    setSelectedTypes([]);
  };

  return (
    <div className="graph-controls-panel card">
      <div className="graph-controls-header">
        <h3>
          <Filter size={18} />
          Graph Controls
        </h3>
      </div>

      <div className="graph-controls-section">
        <div className="graph-controls-title">Entity Types</div>
        <div className="graph-type-filters">
          {allTypes.map(type => (
            <label key={type} className="graph-type-checkbox">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => toggleType(type)}
              />
              <span>{getTypeLabel(type)}</span>
            </label>
          ))}
        </div>
        <div className="graph-controls-actions">
          <button className="btn btn-secondary btn-sm" onClick={selectAll}>
            Select All
          </button>
          <button className="btn btn-secondary btn-sm" onClick={deselectAll}>
            Deselect All
          </button>
        </div>
      </div>

      <div className="graph-controls-section">
        <div className="graph-controls-title">Display Options</div>
        <label className="graph-toggle">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          <span>
            {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
            Show Labels
          </span>
        </label>
      </div>

      {focusNode && (
        <div className="graph-controls-section">
          <div className="graph-controls-title">Focus Mode</div>
          <div className="focus-mode-active">
            <p>Showing only connected entities</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setFocusNode(null)}>
              <X size={16} />
              Clear Focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
