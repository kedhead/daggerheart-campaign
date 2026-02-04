import { useState, useEffect } from 'react';
import { Upload, User, Users, Skull, Circle, Square, Diamond, Star, Shield } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';
import AssetUploader from './AssetUploader';

// Built-in token shapes/colors
const builtInTokens = [
  { id: 'player-blue', name: 'Player (Blue)', color: '#3b82f6', shape: 'circle' },
  { id: 'player-green', name: 'Player (Green)', color: '#22c55e', shape: 'circle' },
  { id: 'player-yellow', name: 'Player (Yellow)', color: '#eab308', shape: 'circle' },
  { id: 'player-red', name: 'Player (Red)', color: '#ef4444', shape: 'circle' },
  { id: 'player-purple', name: 'Player (Purple)', color: '#8b5cf6', shape: 'circle' },
  { id: 'enemy-red', name: 'Enemy (Red)', color: '#dc2626', shape: 'circle' },
  { id: 'enemy-orange', name: 'Enemy (Orange)', color: '#ea580c', shape: 'circle' },
  { id: 'npc-gray', name: 'NPC (Gray)', color: '#6b7280', shape: 'circle' },
  { id: 'npc-teal', name: 'NPC (Teal)', color: '#14b8a6', shape: 'circle' }
];

// Token size presets
const sizePresets = [
  { id: 'small', name: 'Small', multiplier: 0.5 },
  { id: 'medium', name: 'Medium', multiplier: 1 },
  { id: 'large', name: 'Large', multiplier: 2 },
  { id: 'huge', name: 'Huge', multiplier: 3 }
];

export default function AssetLibrary({ campaignId }) {
  const [selectedSize, setSelectedSize] = useState('medium');
  const [customAssets, setCustomAssets] = useState([]);
  const [showUploader, setShowUploader] = useState(false);

  const { addToken, gridSize, selectedTool, setSelectedTool } = useBattleMapStore();

  const sizeMultiplier = sizePresets.find(s => s.id === selectedSize)?.multiplier || 1;

  const handleAddToken = (tokenDef) => {
    const size = gridSize * sizeMultiplier;
    addToken({
      ...tokenDef,
      x: 100,
      y: 100,
      width: size,
      height: size
    });
  };

  const handleAssetUpload = (asset) => {
    setCustomAssets(prev => [...prev, asset]);
    setShowUploader(false);
  };

  const handleDragStart = (e, tokenDef) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...tokenDef,
      width: gridSize * sizeMultiplier,
      height: gridSize * sizeMultiplier
    }));
    setSelectedTool('place');
  };

  return (
    <div className="asset-library">
      {/* Size selector */}
      <div className="asset-category">
        <h4>Token Size</h4>
        <div className="grid-type-buttons" style={{ marginBottom: '0.5rem' }}>
          {sizePresets.map(size => (
            <button
              key={size.id}
              className={selectedSize === size.id ? 'active' : ''}
              onClick={() => setSelectedSize(size.id)}
              style={{ flex: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>

      {/* Player tokens */}
      <div className="asset-category">
        <h4>Player Tokens</h4>
        <div className="asset-grid">
          {builtInTokens.filter(t => t.id.startsWith('player')).map(token => (
            <div
              key={token.id}
              className="asset-item"
              onClick={() => handleAddToken(token)}
              draggable
              onDragStart={(e) => handleDragStart(e, token)}
              title={token.name}
            >
              <div
                className="asset-placeholder"
                style={{ backgroundColor: token.color }}
              >
                <User size={20} color="white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enemy tokens */}
      <div className="asset-category">
        <h4>Enemy Tokens</h4>
        <div className="asset-grid">
          {builtInTokens.filter(t => t.id.startsWith('enemy')).map(token => (
            <div
              key={token.id}
              className="asset-item"
              onClick={() => handleAddToken(token)}
              draggable
              onDragStart={(e) => handleDragStart(e, token)}
              title={token.name}
            >
              <div
                className="asset-placeholder"
                style={{ backgroundColor: token.color }}
              >
                <Skull size={20} color="white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NPC tokens */}
      <div className="asset-category">
        <h4>NPC Tokens</h4>
        <div className="asset-grid">
          {builtInTokens.filter(t => t.id.startsWith('npc')).map(token => (
            <div
              key={token.id}
              className="asset-item"
              onClick={() => handleAddToken(token)}
              draggable
              onDragStart={(e) => handleDragStart(e, token)}
              title={token.name}
            >
              <div
                className="asset-placeholder"
                style={{ backgroundColor: token.color }}
              >
                <Users size={20} color="white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom assets */}
      {customAssets.length > 0 && (
        <div className="asset-category">
          <h4>Custom Assets</h4>
          <div className="asset-grid">
            {customAssets.map(asset => (
              <div
                key={asset.id}
                className="asset-item"
                onClick={() => handleAddToken({ src: asset.url, name: asset.name })}
                draggable
                onDragStart={(e) => handleDragStart(e, { src: asset.url, name: asset.name })}
                title={asset.name}
              >
                <img src={asset.url} alt={asset.name} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="asset-uploader">
        {showUploader ? (
          <AssetUploader
            onUpload={handleAssetUpload}
            onCancel={() => setShowUploader(false)}
          />
        ) : (
          <button
            className="asset-upload-btn"
            onClick={() => setShowUploader(true)}
          >
            <Upload size={18} />
            Upload Custom Token
          </button>
        )}
      </div>
    </div>
  );
}
