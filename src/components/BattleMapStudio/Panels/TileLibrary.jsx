import { useState, useEffect, useRef, useCallback } from 'react';
import { Grid, Droplets, Trees, Mountain, Home, Footprints, Square, Loader2 } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

// Tile categories with procedural generation configs
const tileCategories = {
  terrain: {
    label: 'Terrain',
    icon: Mountain,
    tiles: [
      { id: 'grass', name: 'Grass', colors: ['#4a7c23', '#5a8c33', '#3a6c13'], pattern: 'noise' },
      { id: 'grass-dark', name: 'Dark Grass', colors: ['#2d5016', '#3d6026', '#1d4006'], pattern: 'noise' },
      { id: 'dirt', name: 'Dirt', colors: ['#8b7355', '#9b8365', '#7b6345'], pattern: 'noise' },
      { id: 'sand', name: 'Sand', colors: ['#d4b896', '#e4c8a6', '#c4a886'], pattern: 'noise' },
      { id: 'snow', name: 'Snow', colors: ['#f0f5ff', '#e0e8f0', '#ffffff'], pattern: 'noise' },
      { id: 'mud', name: 'Mud', colors: ['#5c4a3a', '#6c5a4a', '#4c3a2a'], pattern: 'noise' }
    ]
  },
  stone: {
    label: 'Stone & Floors',
    icon: Square,
    tiles: [
      { id: 'stone-gray', name: 'Gray Stone', colors: ['#6b6b6b', '#7b7b7b', '#5b5b5b'], pattern: 'brick' },
      { id: 'stone-dark', name: 'Dark Stone', colors: ['#3a3a3a', '#4a4a4a', '#2a2a2a'], pattern: 'brick' },
      { id: 'cobblestone', name: 'Cobblestone', colors: ['#5a5a5a', '#6a6a6a', '#4a4a4a'], pattern: 'cobble' },
      { id: 'dungeon-floor', name: 'Dungeon Floor', colors: ['#4a4a4a', '#3a3a3a', '#5a5a5a'], pattern: 'tiles' },
      { id: 'wood-floor', name: 'Wood Floor', colors: ['#8b6914', '#9b7924', '#7b5904'], pattern: 'planks' },
      { id: 'marble', name: 'Marble', colors: ['#e8e8e8', '#d0d0d0', '#f0f0f0'], pattern: 'tiles' }
    ]
  },
  water: {
    label: 'Water',
    icon: Droplets,
    tiles: [
      { id: 'water', name: 'Water', colors: ['#2e6b8a', '#3e7b9a', '#1e5b7a'], pattern: 'waves' },
      { id: 'water-deep', name: 'Deep Water', colors: ['#1a4a6a', '#2a5a7a', '#0a3a5a'], pattern: 'waves' },
      { id: 'water-shallow', name: 'Shallow Water', colors: ['#5a9bba', '#6aabca', '#4a8baa'], pattern: 'waves' },
      { id: 'swamp', name: 'Swamp', colors: ['#3a5a3a', '#4a6a4a', '#2a4a2a'], pattern: 'waves' },
      { id: 'lava', name: 'Lava', colors: ['#ff4500', '#ff6a00', '#cc3700'], pattern: 'waves' },
      { id: 'ice', name: 'Ice', colors: ['#a0d0e0', '#b0e0f0', '#90c0d0'], pattern: 'cracks' }
    ]
  },
  paths: {
    label: 'Roads & Paths',
    icon: Footprints,
    tiles: [
      { id: 'road-dirt', name: 'Dirt Road', colors: ['#7a6a5a', '#8a7a6a', '#6a5a4a'], pattern: 'road' },
      { id: 'road-stone', name: 'Stone Road', colors: ['#6a6a6a', '#7a7a7a', '#5a5a5a'], pattern: 'road' },
      { id: 'path', name: 'Forest Path', colors: ['#6a5a4a', '#5a4a3a', '#7a6a5a'], pattern: 'path' },
      { id: 'bridge-wood', name: 'Wood Bridge', colors: ['#6a5020', '#7a6030', '#5a4010'], pattern: 'planks' },
      { id: 'bridge-stone', name: 'Stone Bridge', colors: ['#5a5a5a', '#6a6a6a', '#4a4a4a'], pattern: 'brick' }
    ]
  },
  nature: {
    label: 'Nature',
    icon: Trees,
    tiles: [
      { id: 'forest-floor', name: 'Forest Floor', colors: ['#3a5020', '#4a6030', '#2a4010'], pattern: 'noise' },
      { id: 'leaves', name: 'Fallen Leaves', colors: ['#8a5a20', '#9a6a30', '#7a4a10'], pattern: 'scatter' },
      { id: 'moss', name: 'Moss', colors: ['#4a6a30', '#5a7a40', '#3a5a20'], pattern: 'noise' },
      { id: 'rocks', name: 'Rocky Ground', colors: ['#5a5a5a', '#6a6a6a', '#4a4a4a'], pattern: 'scatter' },
      { id: 'flowers', name: 'Flower Field', colors: ['#4a7c23', '#ff69b4', '#ffff00'], pattern: 'flowers' }
    ]
  },
  structures: {
    label: 'Structures',
    icon: Home,
    tiles: [
      { id: 'wall-stone', name: 'Stone Wall', colors: ['#4a4a4a', '#5a5a5a', '#3a3a3a'], pattern: 'wall' },
      { id: 'wall-brick', name: 'Brick Wall', colors: ['#8b4513', '#9b5523', '#7b3503'], pattern: 'wall' },
      { id: 'wall-wood', name: 'Wood Wall', colors: ['#6a5020', '#7a6030', '#5a4010'], pattern: 'wall' },
      { id: 'roof-thatch', name: 'Thatch Roof', colors: ['#a08060', '#b09070', '#907050'], pattern: 'diagonal' },
      { id: 'roof-tile', name: 'Tile Roof', colors: ['#8b4513', '#9b5523', '#7b3503'], pattern: 'tiles' },
      { id: 'carpet-red', name: 'Red Carpet', colors: ['#8b2020', '#9b3030', '#7b1010'], pattern: 'solid' }
    ]
  }
};

// Generate a tile image using canvas
function generateTileImage(tile, size = 100) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const [primary, secondary, tertiary] = tile.colors;

  // Fill background
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, size, size);

  switch (tile.pattern) {
    case 'noise':
      // Organic noise pattern for natural terrain
      for (let i = 0; i < size * size / 20; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 2 + Math.random() * 6;
        ctx.fillStyle = Math.random() > 0.5 ? secondary : tertiary;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'brick':
      // Brick/stone block pattern
      ctx.strokeStyle = tertiary;
      ctx.lineWidth = 2;
      const brickH = size / 4;
      const brickW = size / 2;
      for (let row = 0; row < 5; row++) {
        const offset = row % 2 === 0 ? 0 : brickW / 2;
        for (let col = -1; col < 3; col++) {
          ctx.strokeRect(col * brickW + offset, row * brickH, brickW, brickH);
          // Add slight color variation
          if (Math.random() > 0.7) {
            ctx.fillStyle = secondary;
            ctx.fillRect(col * brickW + offset + 2, row * brickH + 2, brickW - 4, brickH - 4);
          }
        }
      }
      break;

    case 'cobble':
      // Irregular cobblestone
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = 10 + Math.random() * 15;
        const h = 10 + Math.random() * 15;
        ctx.fillStyle = [primary, secondary, tertiary][Math.floor(Math.random() * 3)];
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, h / 2, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.stroke();
      }
      break;

    case 'tiles':
      // Grid tile pattern
      const tileSize = size / 4;
      ctx.strokeStyle = tertiary;
      ctx.lineWidth = 1;
      for (let x = 0; x < size; x += tileSize) {
        for (let y = 0; y < size; y += tileSize) {
          if (Math.random() > 0.7) {
            ctx.fillStyle = secondary;
            ctx.fillRect(x, y, tileSize, tileSize);
          }
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }
      break;

    case 'planks':
      // Wood plank pattern
      const plankW = size;
      const plankH = size / 5;
      ctx.strokeStyle = tertiary;
      ctx.lineWidth = 1;
      for (let y = 0; y < size; y += plankH) {
        ctx.fillStyle = Math.random() > 0.5 ? primary : secondary;
        ctx.fillRect(0, y, plankW, plankH);
        ctx.strokeRect(0, y, plankW, plankH);
        // Wood grain
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 3; i++) {
          const lineY = y + Math.random() * plankH;
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(size, lineY + (Math.random() - 0.5) * 5);
          ctx.stroke();
        }
        ctx.strokeStyle = tertiary;
      }
      break;

    case 'waves':
      // Water wave pattern
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2;
      for (let y = 0; y < size; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < size; x += 10) {
          ctx.quadraticCurveTo(x + 5, y + 5, x + 10, y);
        }
        ctx.stroke();
      }
      // Highlights
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.beginPath();
        ctx.arc(x, y, 3 + Math.random() * 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;

    case 'cracks':
      // Ice crack pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        let x = Math.random() * size;
        let y = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
          x += (Math.random() - 0.5) * 30;
          y += (Math.random() - 0.5) * 30;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;

    case 'road':
      // Road with edges
      ctx.fillStyle = tertiary;
      ctx.fillRect(0, 0, size * 0.15, size);
      ctx.fillRect(size * 0.85, 0, size * 0.15, size);
      // Road texture
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? secondary : primary;
        ctx.beginPath();
        ctx.arc(
          size * 0.15 + Math.random() * size * 0.7,
          Math.random() * size,
          2 + Math.random() * 3,
          0, Math.PI * 2
        );
        ctx.fill();
      }
      break;

    case 'path':
      // Narrow winding path
      ctx.strokeStyle = secondary;
      ctx.lineWidth = size * 0.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.quadraticCurveTo(size * 0.3, size / 2, size / 2, size);
      ctx.stroke();
      break;

    case 'scatter':
      // Scattered elements
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 3 + Math.random() * 8;
        ctx.fillStyle = Math.random() > 0.5 ? secondary : tertiary;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'flowers':
      // Grass with flowers
      for (let i = 0; i < size * size / 25; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Flowers
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = [secondary, tertiary][Math.floor(Math.random() * 2)];
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'wall':
      // Wall pattern (top-down view)
      ctx.fillStyle = tertiary;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = primary;
      ctx.fillRect(4, 4, size - 8, size - 8);
      // Bricks
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 1;
      for (let y = 4; y < size - 4; y += 12) {
        ctx.beginPath();
        ctx.moveTo(4, y);
        ctx.lineTo(size - 4, y);
        ctx.stroke();
      }
      break;

    case 'diagonal':
      // Diagonal stripe pattern
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 8;
      for (let i = -size; i < size * 2; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
      }
      break;

    case 'solid':
    default:
      // Already filled with primary
      break;
  }

  return canvas.toDataURL('image/png');
}

// Tile size presets
const tileSizePresets = [
  { id: '1x1', name: '1×1', multiplier: 1 },
  { id: '2x2', name: '2×2', multiplier: 2 },
  { id: '3x3', name: '3×3', multiplier: 3 },
  { id: '4x4', name: '4×4', multiplier: 4 }
];

export default function TileLibrary() {
  const [selectedSize, setSelectedSize] = useState('1x1');
  const [generatedTiles, setGeneratedTiles] = useState({});
  const [loading, setLoading] = useState(true);

  const { addToken, gridSize, setSelectedTool } = useBattleMapStore();

  const sizeMultiplier = tileSizePresets.find(s => s.id === selectedSize)?.multiplier || 1;

  // Generate all tile images on mount
  useEffect(() => {
    const tiles = {};
    Object.values(tileCategories).forEach(category => {
      category.tiles.forEach(tile => {
        tiles[tile.id] = generateTileImage(tile, 100);
      });
    });
    setGeneratedTiles(tiles);
    setLoading(false);
  }, []);

  const handleAddTile = useCallback((tile) => {
    const size = gridSize * sizeMultiplier;
    const dataUrl = generatedTiles[tile.id];
    if (!dataUrl) return;

    addToken({
      src: dataUrl,
      name: tile.name,
      x: 100,
      y: 100,
      width: size,
      height: size,
      layer: 'background' // Tiles go on background layer
    });
  }, [gridSize, sizeMultiplier, generatedTiles, addToken]);

  const handleDragStart = useCallback((e, tile) => {
    const size = gridSize * sizeMultiplier;
    const dataUrl = generatedTiles[tile.id];
    if (!dataUrl) return;

    e.dataTransfer.setData('application/json', JSON.stringify({
      src: dataUrl,
      name: tile.name,
      width: size,
      height: size,
      layer: 'background'
    }));
    setSelectedTool('place');
  }, [gridSize, sizeMultiplier, generatedTiles, setSelectedTool]);

  if (loading) {
    return (
      <div className="tile-library loading">
        <Loader2 className="spin" size={24} />
        <span>Generating tiles...</span>
      </div>
    );
  }

  return (
    <div className="tile-library">
      <div className="tile-header">
        <Grid size={18} />
        <span>Map Tiles</span>
      </div>

      <p className="tile-description">
        Drag tiles onto your map to build terrain. Tiles are placed on the background layer.
      </p>

      {/* Size selector */}
      <div className="tile-section">
        <label className="section-label">Tile Size</label>
        <div className="size-buttons">
          {tileSizePresets.map(size => (
            <button
              key={size.id}
              className={`size-btn ${selectedSize === size.id ? 'active' : ''}`}
              onClick={() => setSelectedSize(size.id)}
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tile categories */}
      {Object.entries(tileCategories).map(([catId, category]) => {
        const Icon = category.icon;
        return (
          <div key={catId} className="tile-section">
            <label className="section-label">
              <Icon size={14} />
              {category.label}
            </label>
            <div className="tile-grid">
              {category.tiles.map(tile => (
                <div
                  key={tile.id}
                  className="tile-item"
                  onClick={() => handleAddTile(tile)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tile)}
                  title={tile.name}
                >
                  <img src={generatedTiles[tile.id]} alt={tile.name} />
                  <span className="tile-name">{tile.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <style>{`
        .tile-library {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tile-library.loading {
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: var(--text-muted);
        }

        .tile-library.loading .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .tile-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--hope-color);
        }

        .tile-description {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .tile-section {
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

        .size-buttons {
          display: flex;
          gap: 0.25rem;
        }

        .size-btn {
          padding: 0.35rem 0.6rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .size-btn:hover {
          border-color: var(--text-muted);
        }

        .size-btn.active {
          border-color: var(--hope-color);
          color: var(--hope-color);
          background: rgba(34, 197, 94, 0.1);
        }

        .tile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .tile-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.35rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tile-item:hover {
          border-color: var(--hope-color);
          transform: translateY(-2px);
        }

        .tile-item img {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 4px;
          image-rendering: pixelated;
        }

        .tile-name {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
}
