import { useState } from 'react';
import { Eye, EyeOff, Filter, X, ZoomIn, ZoomOut, Maximize2, Download, ChevronUp, ChevronDown, Shuffle } from 'lucide-react';
import { getTypeLabel } from '../../utils/graphCalculations';
import './RelationshipGraph.css';

export default function GraphControls({
  header,
  selectedTypes,
  setSelectedTypes,
  showLabels,
  setShowLabels,
  focusNode,
  setFocusNode,
  onZoomIn,
  onZoomOut,
  onReset,
  onSpread,
  onExport
}) {
  const [showFilters, setShowFilters] = useState(false);
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
    <div className="graph-controls-container">
      {/* Main Control Bar */}
      <div className="graph-top-bar">
        {/* Left: Branding/Header */}
        {header && <div className="graph-bar-header">{header}</div>}

        {/* Center: View Controls & Toggles */}
        <div className="graph-bar-actions">
          {/* View Controls */}
          <div className="control-group">
            <button className="btn-icon-bar" onClick={onExport} title="Export Map">
              <Download size={18} />
            </button>
            <div className="divider" />
            <button className="btn-icon-bar" onClick={onZoomOut} title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <button className="btn-icon-bar" onClick={onReset} title="Reset View">
              <Maximize2 size={18} />
            </button>
            <button className="btn-icon-bar" onClick={onSpread} title="Spread Nodes">
              <Shuffle size={18} />
            </button>
            <button className="btn-icon-bar" onClick={onZoomIn} title="Zoom In">
              <ZoomIn size={18} />
            </button>
          </div>

          <div className="divider" />

          {/* Toggles */}
          <div className="control-group">
            <button
              className={`btn-toggle ${showLabels ? 'active' : ''}`}
              onClick={() => setShowLabels(!showLabels)}
              title="Toggle Labels"
            >
              {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
              <span className="btn-label">Labels</span>
            </button>

            <button
              className={`btn-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Filter Entities"
            >
              <Filter size={18} />
              <span className="btn-label">Filters</span>
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Right: Context/Focus Actions */}
        {focusNode && (
          <div className="control-group focus-group">
            <span className="focus-label">Focused View</span>
            <button className="btn-icon-bar btn-danger" onClick={() => setFocusNode(null)} title="Clear Focus">
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Filter Popover (The "Drawer") - Now drops DOWN */}
      {showFilters && (
        <div className="graph-filter-popover">
          <div className="graph-controls-header">
            <h3>
              <Filter size={16} />
              Filter Entities
            </h3>
            <button className="btn-close" onClick={() => setShowFilters(false)}>
              <X size={16} />
            </button>
          </div>

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
            <button className="btn btn-secondary btn-xs" onClick={selectAll}>All</button>
            <button className="btn btn-secondary btn-xs" onClick={deselectAll}>None</button>
          </div>
        </div>
      )}
    </div>
  );
}
