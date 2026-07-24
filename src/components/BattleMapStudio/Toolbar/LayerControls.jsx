import { Image, Users, Cloud, Eye, EyeOff, Tag } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

const layerConfig = [
  { id: 'background', icon: Image, label: 'Background' },
  { id: 'tokens', icon: Users, label: 'Tokens' },
  { id: 'fog', icon: Cloud, label: 'Fog of War' }
];

export default function LayerControls() {
  const {
    layers,
    toggleLayerVisibility,
    fogBrushSize,
    setFogBrushSize,
    selectedTool,
    showTokenLabels,
    toggleTokenLabels
  } = useBattleMapStore();

  return (
    <div className="layer-controls">
      {layerConfig.map(layer => {
        const Icon = layer.icon;
        const isVisible = layers[layer.id]?.visible;
        return (
          <button
            key={layer.id}
            className={`relative p-2 rounded-md transition-colors ${isVisible ? 'text-zinc-200 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50'}`}
            onClick={() => toggleLayerVisibility(layer.id)}
            title={`${layer.label} (${isVisible ? 'Visible' : 'Hidden'})`}
          >
            <Icon size={18} />
            {!isVisible && (
              <EyeOff
                size={10}
                className="absolute bottom-1 right-1 text-red-500 bg-zinc-900 rounded-full"
              />
            )}
          </button>
        );
      })}

      <button
        className={`relative p-2 rounded-md transition-colors ${showTokenLabels ? 'text-zinc-200 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50'}`}
        onClick={toggleTokenLabels}
        title={`Token names (${showTokenLabels ? 'Shown' : 'Hidden'})`}
      >
        <Tag size={18} />
        {!showTokenLabels && (
          <EyeOff
            size={10}
            className="absolute bottom-1 right-1 text-red-500 bg-zinc-900 rounded-full"
          />
        )}
      </button>

      {/* Fog Tools - Only show if Fog layer is visible */}
      {layers.fog?.visible && (
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-800 w-full items-center">
          <button
            className={`p-2 rounded-md transition-colors ${selectedTool === 'fog-paint' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
            onClick={() => useBattleMapStore.getState().setSelectedTool('fog-paint')}
            title="Fog Brush (Paint)"
          >
            <Cloud size={16} />
          </button>
          <button
            className={`p-2 rounded-md transition-colors ${selectedTool === 'fog-erase' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
            onClick={() => useBattleMapStore.getState().setSelectedTool('fog-erase')}
            title="Fog Eraser"
          >
            <Eye size={16} />
          </button>
        </div>
      )}

      {/* Fog brush size control - only show when fog tool is selected */}
      {(selectedTool === 'fog-erase' || selectedTool === 'fog-paint') && (
        <div className="flex flex-col items-center gap-1 py-2">
          <label className="text-[9px] text-zinc-500 uppercase font-bold">Size</label>
          <input
            type="range"
            min="10"
            max="200"
            value={fogBrushSize}
            onChange={(e) => setFogBrushSize(Number(e.target.value))}
            title={`Brush size: ${fogBrushSize}px`}
            className="w-1 h-16 appearance-none bg-zinc-700 rounded-full outline-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer vertical-range"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
          />
        </div>
      )}
    </div>
  );
}
