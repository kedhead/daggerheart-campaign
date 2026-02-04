import { Image, Users, Cloud, Eye, EyeOff } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

const layerConfig = [
  { id: 'background', icon: Image, label: 'Background' },
  { id: 'tokens', icon: Users, label: 'Tokens' },
  { id: 'fog', icon: Cloud, label: 'Fog of War' }
];

export default function LayerControls() {
  const { layers, toggleLayerVisibility, fogBrushSize, setFogBrushSize, selectedTool } = useBattleMapStore();

  return (
    <div className="layer-controls">
      {layerConfig.map(layer => {
        const Icon = layer.icon;
        const isVisible = layers[layer.id]?.visible;
        return (
          <button
            key={layer.id}
            className={`layer-btn ${isVisible ? 'visible' : 'hidden'}`}
            onClick={() => toggleLayerVisibility(layer.id)}
            title={`${layer.label} (${isVisible ? 'Visible' : 'Hidden'})`}
          >
            <Icon size={18} />
            {!isVisible && (
              <EyeOff
                size={10}
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  color: 'var(--danger)'
                }}
              />
            )}
          </button>
        );
      })}

      {/* Fog brush size control - only show when fog tool is selected */}
      {(selectedTool === 'fog-erase' || selectedTool === 'fog-paint') && (
        <div className="fog-brush-control">
          <label>Brush</label>
          <input
            type="range"
            min="10"
            max="200"
            value={fogBrushSize}
            onChange={(e) => setFogBrushSize(Number(e.target.value))}
            title={`Brush size: ${fogBrushSize}px`}
          />
        </div>
      )}
    </div>
  );
}
