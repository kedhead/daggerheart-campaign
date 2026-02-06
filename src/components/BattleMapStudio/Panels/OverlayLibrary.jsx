import { useState, useEffect, useCallback } from 'react';
import { Route, Waves, CornerDownRight, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

/**
 * Overlay tiles are transparent assets that can be placed ON TOP of base tiles
 * They include: road segments, river segments, path edges, cliff edges, etc.
 */

// Overlay categories with generation configs
const overlayCategories = {
  roads: {
    label: 'Road Segments',
    icon: Route,
    baseColor: '#6a5a4a',
    edgeColor: '#5a4a3a',
    overlays: [
      { id: 'road-straight-v', name: 'Straight (V)', type: 'straight', rotation: 0 },
      { id: 'road-straight-h', name: 'Straight (H)', type: 'straight', rotation: 90 },
      { id: 'road-curve-ne', name: 'Curve NE', type: 'curve', rotation: 0 },
      { id: 'road-curve-se', name: 'Curve SE', type: 'curve', rotation: 90 },
      { id: 'road-curve-sw', name: 'Curve SW', type: 'curve', rotation: 180 },
      { id: 'road-curve-nw', name: 'Curve NW', type: 'curve', rotation: 270 },
      { id: 'road-t-north', name: 'T-Junction N', type: 't-junction', rotation: 0 },
      { id: 'road-t-east', name: 'T-Junction E', type: 't-junction', rotation: 90 },
      { id: 'road-t-south', name: 'T-Junction S', type: 't-junction', rotation: 180 },
      { id: 'road-t-west', name: 'T-Junction W', type: 't-junction', rotation: 270 },
      { id: 'road-cross', name: 'Crossroad', type: 'cross', rotation: 0 },
      { id: 'road-end-n', name: 'End Cap N', type: 'end', rotation: 0 },
      { id: 'road-end-e', name: 'End Cap E', type: 'end', rotation: 90 },
      { id: 'road-end-s', name: 'End Cap S', type: 'end', rotation: 180 },
      { id: 'road-end-w', name: 'End Cap W', type: 'end', rotation: 270 }
    ]
  },
  rivers: {
    label: 'River Segments',
    icon: Waves,
    baseColor: '#3a7a9a',
    edgeColor: '#2a6a8a',
    overlays: [
      { id: 'river-straight-v', name: 'Straight (V)', type: 'straight', rotation: 0 },
      { id: 'river-straight-h', name: 'Straight (H)', type: 'straight', rotation: 90 },
      { id: 'river-curve-ne', name: 'Curve NE', type: 'curve', rotation: 0 },
      { id: 'river-curve-se', name: 'Curve SE', type: 'curve', rotation: 90 },
      { id: 'river-curve-sw', name: 'Curve SW', type: 'curve', rotation: 180 },
      { id: 'river-curve-nw', name: 'Curve NW', type: 'curve', rotation: 270 },
      { id: 'river-fork-n', name: 'Fork N', type: 't-junction', rotation: 0 },
      { id: 'river-fork-e', name: 'Fork E', type: 't-junction', rotation: 90 },
      { id: 'river-wide', name: 'Wide Section', type: 'wide', rotation: 0 },
      { id: 'river-narrow', name: 'Narrow Section', type: 'narrow', rotation: 0 }
    ]
  },
  paths: {
    label: 'Path Segments',
    icon: CornerDownRight,
    baseColor: '#7a6a5a',
    edgeColor: '#6a5a4a',
    overlays: [
      { id: 'path-straight-v', name: 'Straight (V)', type: 'path-straight', rotation: 0 },
      { id: 'path-straight-h', name: 'Straight (H)', type: 'path-straight', rotation: 90 },
      { id: 'path-curve-ne', name: 'Curve NE', type: 'path-curve', rotation: 0 },
      { id: 'path-curve-se', name: 'Curve SE', type: 'path-curve', rotation: 90 },
      { id: 'path-curve-sw', name: 'Curve SW', type: 'path-curve', rotation: 180 },
      { id: 'path-curve-nw', name: 'Curve NW', type: 'path-curve', rotation: 270 },
      { id: 'path-fork', name: 'Fork', type: 'path-fork', rotation: 0 }
    ]
  },
  edges: {
    label: 'Terrain Edges',
    icon: ArrowUp,
    baseColor: '#5a5a5a',
    edgeColor: '#3a3a3a',
    overlays: [
      { id: 'cliff-edge-n', name: 'Cliff North', type: 'edge', rotation: 0 },
      { id: 'cliff-edge-e', name: 'Cliff East', type: 'edge', rotation: 90 },
      { id: 'cliff-edge-s', name: 'Cliff South', type: 'edge', rotation: 180 },
      { id: 'cliff-edge-w', name: 'Cliff West', type: 'edge', rotation: 270 },
      { id: 'cliff-corner-ne', name: 'Cliff Corner NE', type: 'edge-corner', rotation: 0 },
      { id: 'cliff-corner-se', name: 'Cliff Corner SE', type: 'edge-corner', rotation: 90 },
      { id: 'cliff-corner-sw', name: 'Cliff Corner SW', type: 'edge-corner', rotation: 180 },
      { id: 'cliff-corner-nw', name: 'Cliff Corner NW', type: 'edge-corner', rotation: 270 },
      { id: 'water-edge-n', name: 'Water Edge N', type: 'water-edge', rotation: 0 },
      { id: 'water-edge-e', name: 'Water Edge E', type: 'water-edge', rotation: 90 },
      { id: 'water-edge-s', name: 'Water Edge S', type: 'water-edge', rotation: 180 },
      { id: 'water-edge-w', name: 'Water Edge W', type: 'water-edge', rotation: 270 }
    ]
  }
};

// Generate transparent overlay image
function generateOverlayImage(overlay, category, size = 100) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Start with transparent background
  ctx.clearRect(0, 0, size, size);

  const { baseColor, edgeColor } = category;
  const center = size / 2;
  const roadWidth = size * 0.4;
  const pathWidth = size * 0.25;

  // Apply rotation
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate((overlay.rotation * Math.PI) / 180);
  ctx.translate(-center, -center);

  switch (overlay.type) {
    case 'straight':
      // Straight road/river segment
      ctx.fillStyle = edgeColor;
      ctx.fillRect(center - roadWidth/2 - 3, 0, roadWidth + 6, size);
      ctx.fillStyle = baseColor;
      ctx.fillRect(center - roadWidth/2, 0, roadWidth, size);
      // Add texture
      addRoadTexture(ctx, center - roadWidth/2, 0, roadWidth, size, baseColor);
      break;

    case 'curve':
      // Curved road/river
      ctx.beginPath();
      ctx.arc(0, 0, center + roadWidth/2 + 3, 0, Math.PI/2);
      ctx.arc(0, 0, center - roadWidth/2 - 3, Math.PI/2, 0, true);
      ctx.closePath();
      ctx.fillStyle = edgeColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, center + roadWidth/2, 0, Math.PI/2);
      ctx.arc(0, 0, center - roadWidth/2, Math.PI/2, 0, true);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();
      break;

    case 't-junction':
      // T-junction
      ctx.fillStyle = edgeColor;
      ctx.fillRect(center - roadWidth/2 - 3, 0, roadWidth + 6, size);
      ctx.fillRect(center - 3, center - roadWidth/2 - 3, center + 3, roadWidth + 6);
      ctx.fillStyle = baseColor;
      ctx.fillRect(center - roadWidth/2, 0, roadWidth, size);
      ctx.fillRect(center, center - roadWidth/2, center, roadWidth);
      break;

    case 'cross':
      // Crossroad
      ctx.fillStyle = edgeColor;
      ctx.fillRect(center - roadWidth/2 - 3, 0, roadWidth + 6, size);
      ctx.fillRect(0, center - roadWidth/2 - 3, size, roadWidth + 6);
      ctx.fillStyle = baseColor;
      ctx.fillRect(center - roadWidth/2, 0, roadWidth, size);
      ctx.fillRect(0, center - roadWidth/2, size, roadWidth);
      break;

    case 'end':
      // Road end cap (rounded)
      ctx.fillStyle = edgeColor;
      ctx.beginPath();
      ctx.arc(center, center, roadWidth/2 + 3, Math.PI, 0);
      ctx.rect(center - roadWidth/2 - 3, center, roadWidth + 6, center);
      ctx.fill();
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(center, center, roadWidth/2, Math.PI, 0);
      ctx.rect(center - roadWidth/2, center, roadWidth, center);
      ctx.fill();
      break;

    case 'wide':
      // Wide river section
      const wideWidth = roadWidth * 1.5;
      ctx.fillStyle = edgeColor;
      ctx.fillRect(center - wideWidth/2 - 3, 0, wideWidth + 6, size);
      ctx.fillStyle = baseColor;
      ctx.fillRect(center - wideWidth/2, 0, wideWidth, size);
      // Water ripples
      addWaterRipples(ctx, center - wideWidth/2, 0, wideWidth, size);
      break;

    case 'narrow':
      // Narrow river section
      const narrowWidth = roadWidth * 0.6;
      ctx.fillStyle = edgeColor;
      ctx.fillRect(center - narrowWidth/2 - 3, 0, narrowWidth + 6, size);
      ctx.fillStyle = baseColor;
      ctx.fillRect(center - narrowWidth/2, 0, narrowWidth, size);
      addWaterRipples(ctx, center - narrowWidth/2, 0, narrowWidth, size);
      break;

    case 'path-straight':
      // Narrow winding path
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = pathWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.bezierCurveTo(
        center - 10, size * 0.3,
        center + 10, size * 0.7,
        center, size
      );
      ctx.stroke();
      break;

    case 'path-curve':
      // Curved path
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = pathWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(center, size);
      ctx.quadraticCurveTo(center, center, size, center);
      ctx.stroke();
      break;

    case 'path-fork':
      // Forking path
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = pathWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(center, size);
      ctx.lineTo(center, center);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(size, 0);
      ctx.stroke();
      break;

    case 'edge':
      // Cliff/terrain edge
      ctx.fillStyle = edgeColor;
      ctx.fillRect(0, 0, size, size * 0.3);
      // Shadow gradient
      const edgeGradient = ctx.createLinearGradient(0, 0, 0, size * 0.4);
      edgeGradient.addColorStop(0, 'rgba(0,0,0,0.4)');
      edgeGradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = edgeGradient;
      ctx.fillRect(0, size * 0.3, size, size * 0.1);
      break;

    case 'edge-corner':
      // Corner cliff edge
      ctx.fillStyle = edgeColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, 0);
      ctx.lineTo(size, size * 0.3);
      ctx.lineTo(size * 0.3, size * 0.3);
      ctx.lineTo(size * 0.3, size);
      ctx.lineTo(0, size);
      ctx.closePath();
      ctx.fill();
      break;

    case 'water-edge':
      // Water edge with foam
      const waterGradient = ctx.createLinearGradient(0, 0, 0, size * 0.4);
      waterGradient.addColorStop(0, '#3a7a9a');
      waterGradient.addColorStop(0.7, 'rgba(58, 122, 154, 0.5)');
      waterGradient.addColorStop(1, 'rgba(58, 122, 154, 0)');
      ctx.fillStyle = waterGradient;
      ctx.fillRect(0, 0, size, size * 0.4);
      // Foam
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * size;
        const y = size * 0.25 + Math.random() * size * 0.1;
        ctx.beginPath();
        ctx.arc(x, y, 3 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }

  ctx.restore();
  return canvas.toDataURL('image/png');
}

// Add road texture
function addRoadTexture(ctx, x, y, w, h, baseColor) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < 15; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    const r = 2 + Math.random() * 4;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Add water ripples
function addWaterRipples(ctx, x, y, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const py = y + (i / 5) * h + 10;
    ctx.beginPath();
    ctx.moveTo(x, py);
    for (let px = x; px < x + w; px += 8) {
      ctx.quadraticCurveTo(px + 4, py + 3, px + 8, py);
    }
    ctx.stroke();
  }
}

// Tile size presets
const overlaySizePresets = [
  { id: '1x1', name: '1×1', multiplier: 1 },
  { id: '2x2', name: '2×2', multiplier: 2 },
  { id: '3x3', name: '3×3', multiplier: 3 }
];

export default function OverlayLibrary() {
  const [selectedSize, setSelectedSize] = useState('1x1');
  const [generatedOverlays, setGeneratedOverlays] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState('roads');

  const { addToken, gridSize, setSelectedTool } = useBattleMapStore();

  const sizeMultiplier = overlaySizePresets.find(s => s.id === selectedSize)?.multiplier || 1;

  // Generate all overlay images on mount
  useEffect(() => {
    const overlays = {};
    Object.entries(overlayCategories).forEach(([catId, category]) => {
      category.overlays.forEach(overlay => {
        overlays[overlay.id] = generateOverlayImage(overlay, category, 100);
      });
    });
    setGeneratedOverlays(overlays);
    setLoading(false);
  }, []);

  const handleAddOverlay = useCallback((overlay) => {
    const size = gridSize * sizeMultiplier;
    const dataUrl = generatedOverlays[overlay.id];
    if (!dataUrl) return;

    addToken({
      src: dataUrl,
      name: overlay.name,
      x: 100,
      y: 100,
      width: size,
      height: size,
      layer: 'tokens' // Overlays go on tokens layer (above background)
    });
  }, [gridSize, sizeMultiplier, generatedOverlays, addToken]);

  const handleDragStart = useCallback((e, overlay) => {
    const size = gridSize * sizeMultiplier;
    const dataUrl = generatedOverlays[overlay.id];
    if (!dataUrl) return;

    e.dataTransfer.setData('application/json', JSON.stringify({
      src: dataUrl,
      name: overlay.name,
      width: size,
      height: size,
      layer: 'tokens'
    }));
    setSelectedTool('place');
  }, [gridSize, sizeMultiplier, generatedOverlays, setSelectedTool]);

  if (loading) {
    return (
      <div className="overlay-library loading">
        <Loader2 className="spin" size={24} />
        <span>Generating overlays...</span>
      </div>
    );
  }

  return (
    <div className="overlay-library">
      <div className="overlay-header">
        <Route size={18} />
        <span>Overlay Tiles</span>
      </div>

      <p className="overlay-description">
        Transparent overlays for roads, rivers, and edges. Place on top of base terrain tiles.
      </p>

      {/* Size selector */}
      <div className="overlay-section">
        <label className="section-label">Overlay Size</label>
        <div className="size-buttons">
          {overlaySizePresets.map(size => (
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

      {/* Overlay categories */}
      {Object.entries(overlayCategories).map(([catId, category]) => {
        const Icon = category.icon;
        const isExpanded = expandedCategory === catId;

        return (
          <div key={catId} className="overlay-category">
            <button
              className={`category-header ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedCategory(isExpanded ? null : catId)}
            >
              <Icon size={14} />
              <span>{category.label}</span>
              <span className="category-count">{category.overlays.length}</span>
            </button>

            {isExpanded && (
              <div className="overlay-grid">
                {category.overlays.map(overlay => (
                  <div
                    key={overlay.id}
                    className="overlay-item"
                    onClick={() => handleAddOverlay(overlay)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, overlay)}
                    title={overlay.name}
                  >
                    <div className="overlay-preview" style={{ backgroundColor: '#4a7c23' }}>
                      <img src={generatedOverlays[overlay.id]} alt={overlay.name} />
                    </div>
                    <span className="overlay-name">{overlay.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        .overlay-library {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .overlay-library.loading {
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: var(--text-muted);
        }

        .overlay-library.loading .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .overlay-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--fear-color);
        }

        .overlay-description {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .overlay-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .section-label {
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
          border-color: var(--fear-color);
          color: var(--fear-color);
          background: rgba(139, 92, 246, 0.1);
        }

        .overlay-category {
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.6rem 0.75rem;
          background: var(--bg-tertiary);
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .category-header:hover {
          background: var(--bg-secondary);
        }

        .category-header.expanded {
          border-bottom: 1px solid var(--border);
        }

        .category-count {
          margin-left: auto;
          font-size: 0.7rem;
          color: var(--text-muted);
          background: var(--bg-primary);
          padding: 0.15rem 0.4rem;
          border-radius: 10px;
        }

        .overlay-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          padding: 0.5rem;
        }

        .overlay-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .overlay-item:hover {
          transform: translateY(-2px);
        }

        .overlay-preview {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .overlay-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay-name {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
}
