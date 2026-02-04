import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

export default function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetZoom } = useBattleMapStore();

  return (
    <div className="zoom-controls">
      <button
        className="toolbar-btn"
        onClick={zoomIn}
        title="Zoom In"
      >
        <ZoomIn size={18} />
      </button>
      <span className="zoom-level">{Math.round(zoom * 100)}%</span>
      <button
        className="toolbar-btn"
        onClick={zoomOut}
        title="Zoom Out"
      >
        <ZoomOut size={18} />
      </button>
      <button
        className="toolbar-btn"
        onClick={resetZoom}
        title="Reset View"
      >
        <Maximize size={18} />
      </button>
    </div>
  );
}
