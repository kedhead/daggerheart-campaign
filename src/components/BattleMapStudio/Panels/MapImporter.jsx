import { useState, useRef, useCallback } from 'react';
import { Upload, Grid, Square } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

// Blank canvas size presets
const blankCanvasSizes = [
  { id: 'small', label: 'Small (20×20)', width: 1000, height: 1000, gridSquares: 20 },
  { id: 'medium', label: 'Medium (30×30)', width: 1500, height: 1500, gridSquares: 30 },
  { id: 'large', label: 'Large (40×40)', width: 2000, height: 2000, gridSquares: 40 },
  { id: 'wide', label: 'Wide (40×25)', width: 2000, height: 1250, gridSquares: 40 },
  { id: 'custom', label: 'QHD (2560×1440)', width: 2560, height: 1440, gridSquares: 51 }
];

export default function MapImporter() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBlankOptions, setShowBlankOptions] = useState(false);
  const fileInputRef = useRef(null);

  const { setMapImage, setGridSize } = useBattleMapStore();

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setIsLoading(true);

    try {
      // Create object URL for the image
      const url = URL.createObjectURL(file);

      // Get image dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      setMapImage({
        url,
        width: img.width,
        height: img.height,
        name: file.name
      });
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Failed to load image');
    } finally {
      setIsLoading(false);
    }
  }, [setMapImage]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const createBlankCanvas = useCallback((preset) => {
    // Create a canvas with the specified size
    const canvas = document.createElement('canvas');
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext('2d');

    // Fill with a dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, preset.width, preset.height);

    // Optional: Add subtle grid pattern
    const gridSize = preset.width / preset.gridSquares;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= preset.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, preset.height);
      ctx.stroke();
    }
    for (let y = 0; y <= preset.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(preset.width, y);
      ctx.stroke();
    }

    // Convert to data URL
    const url = canvas.toDataURL('image/png');

    setMapImage({
      url,
      width: preset.width,
      height: preset.height,
      name: `Blank Canvas (${preset.label})`,
      isBlank: true
    });

    // Set grid size to match
    setGridSize(Math.round(gridSize));
    setShowBlankOptions(false);
  }, [setMapImage, setGridSize]);

  return (
    <div className="map-importer">
      <div
        className={`import-dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {isLoading ? (
          <>
            <div className="loading-spinner" style={{ width: 48, height: 48 }}></div>
            <p>Loading map...</p>
          </>
        ) : (
          <>
            <Upload size={48} />
            <h3>Drop your map here</h3>
            <p>or click to browse</p>
            <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
              Supports PNG, JPG, WebP
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <div className="blank-canvas-section">
        <p className="section-divider">— or —</p>

        {showBlankOptions ? (
          <div className="blank-options">
            <h4>Choose Canvas Size</h4>
            <div className="blank-size-grid">
              {blankCanvasSizes.map(preset => (
                <button
                  key={preset.id}
                  className="blank-size-btn"
                  onClick={() => createBlankCanvas(preset)}
                >
                  <Square size={20} />
                  <span>{preset.label}</span>
                  <small>{preset.width}×{preset.height}</small>
                </button>
              ))}
            </div>
            <button
              className="cancel-btn"
              onClick={() => setShowBlankOptions(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="blank-canvas-btn"
            onClick={() => setShowBlankOptions(true)}
          >
            <Grid size={20} />
            Create Blank Canvas
          </button>
        )}
      </div>

      <style>{`
        .blank-canvas-section {
          margin-top: 1.5rem;
          text-align: center;
        }

        .section-divider {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin: 1rem 0;
        }

        .blank-canvas-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          padding: 0.75rem 1.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .blank-canvas-btn:hover {
          border-color: var(--fear-color);
          background: rgba(139, 92, 246, 0.1);
        }

        .blank-options {
          max-width: 400px;
          margin: 0 auto;
        }

        .blank-options h4 {
          margin: 0 0 1rem;
          color: var(--text-primary);
        }

        .blank-size-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .blank-size-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .blank-size-btn:hover {
          border-color: var(--fear-color);
          background: rgba(139, 92, 246, 0.1);
        }

        .blank-size-btn span {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .blank-size-btn small {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .cancel-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
