import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

export default function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetZoom } = useBattleMapStore();

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
        onClick={zoomIn}
        title="Zoom In"
      >
        <ZoomIn size={18} />
      </button>
      <span className="text-[10px] text-zinc-500 font-medium">{Math.round(zoom * 100)}%</span>
      <button
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
        onClick={zoomOut}
        title="Zoom Out"
      >
        <ZoomOut size={18} />
      </button>
      <button
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
        onClick={resetZoom}
        title="Reset View"
      >
        <Maximize size={18} />
      </button>
    </div>
  );
}
