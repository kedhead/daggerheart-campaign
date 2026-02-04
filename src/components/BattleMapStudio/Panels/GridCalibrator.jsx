import { Grid, Hexagon, Square, EyeOff, Magnet } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

export default function GridCalibrator() {
  const {
    gridType,
    gridSize,
    gridColor,
    gridVisible,
    snapToGrid,
    fogEnabled,
    setGridType,
    setGridSize,
    setGridColor,
    toggleGridVisible,
    toggleSnapToGrid,
    toggleFogEnabled,
    revealAllFog,
    hideAllFog
  } = useBattleMapStore();

  return (
    <div className="grid-calibrator">
      {/* Grid Type */}
      <div className="calibrator-section">
        <h4>Grid Type</h4>
        <div className="grid-type-buttons">
          <button
            className={gridType === 'square' ? 'active' : ''}
            onClick={() => setGridType('square')}
          >
            <Square size={16} style={{ marginRight: 4 }} />
            Square
          </button>
          <button
            className={gridType === 'hex' ? 'active' : ''}
            onClick={() => setGridType('hex')}
          >
            <Hexagon size={16} style={{ marginRight: 4 }} />
            Hex
          </button>
          <button
            className={gridType === 'none' ? 'active' : ''}
            onClick={() => setGridType('none')}
          >
            <EyeOff size={16} style={{ marginRight: 4 }} />
            None
          </button>
        </div>
      </div>

      {/* Grid Size */}
      <div className="calibrator-section">
        <h4>Grid Size</h4>
        <div className="calibrator-row">
          <label>Pixels per cell</label>
          <input
            type="number"
            min="10"
            max="200"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
          />
        </div>
        <div className="calibrator-row">
          <input
            type="range"
            min="10"
            max="200"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Grid Color */}
      <div className="calibrator-section">
        <h4>Grid Appearance</h4>
        <div className="calibrator-row">
          <label>Color</label>
          <input
            type="color"
            value={gridColor.startsWith('rgba') ? '#ffffff' : gridColor}
            onChange={(e) => {
              const hex = e.target.value;
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              setGridColor(`rgba(${r},${g},${b},0.3)`);
            }}
          />
        </div>
        <div className="calibrator-row">
          <label>
            <input
              type="checkbox"
              checked={gridVisible}
              onChange={toggleGridVisible}
              style={{ marginRight: 8 }}
            />
            Show Grid
          </label>
        </div>
      </div>

      {/* Snap to Grid */}
      <div className="calibrator-section">
        <h4>Snapping</h4>
        <div className="calibrator-row">
          <label>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={toggleSnapToGrid}
              style={{ marginRight: 8 }}
            />
            <Magnet size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Snap tokens to grid
          </label>
        </div>
      </div>

      {/* Fog of War */}
      <div className="calibrator-section">
        <h4>Fog of War</h4>
        <div className="calibrator-row">
          <label>
            <input
              type="checkbox"
              checked={fogEnabled}
              onChange={toggleFogEnabled}
              style={{ marginRight: 8 }}
            />
            Enable Fog
          </label>
        </div>
        {fogEnabled && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
              onClick={revealAllFog}
            >
              Reveal All
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
              onClick={hideAllFog}
            >
              Hide All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
