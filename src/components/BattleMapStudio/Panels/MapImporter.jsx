import { useState, useRef, useCallback } from 'react';
import { Upload, Grid, Square, Youtube, Link, Play } from 'lucide-react';
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
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const fileInputRef = useRef(null);

  const { setMapImage, setGridSize } = useBattleMapStore();

  // Extract YouTube video ID from various URL formats
  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Handle YouTube URL submission
  const handleYoutubeSubmit = useCallback(() => {
    setUrlError('');
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setUrlError('Invalid YouTube URL. Paste a link like youtube.com/watch?v=...');
      return;
    }

    // Standard 16:9 dimensions for the embed
    setMapImage({
      url: `https://www.youtube.com/embed/${videoId}`,
      width: 1920,
      height: 1080,
      name: `YouTube Map (${videoId})`,
      isYouTube: true,
      youtubeId: videoId
    });
  }, [youtubeUrl, setMapImage]);

  // Handle direct video URL
  const handleVideoUrlSubmit = useCallback(async () => {
    setUrlError('');
    if (!videoUrl.trim()) {
      setUrlError('Please enter a video URL');
      return;
    }

    setIsLoading(true);
    try {
      setMapImage({
        url: videoUrl.trim(),
        width: 1920,
        height: 1080,
        name: 'External Video Map',
        isVideo: true,
        isExternal: true
      });
    } catch (error) {
      setUrlError('Failed to load video. Check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [videoUrl, setMapImage]);

  const processFile = useCallback(async (file) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!file || (!isImage && !isVideo)) {
      alert('Please select a valid image or video file (PNG, JPG, WebP, GIF, MP4, WebM)');
      return;
    }

    setIsLoading(true);

    try {
      // Create object URL for the file
      const url = URL.createObjectURL(file);

      let width, height;

      if (isVideo) {
        // Get video dimensions
        const video = document.createElement('video');
        video.preload = 'metadata';
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = reject;
          video.src = url;
        });
        width = video.videoWidth;
        height = video.videoHeight;
      } else {
        // Get image dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        width = img.width;
        height = img.height;
      }

      setMapImage({
        url,
        width,
        height,
        name: file.name,
        isVideo,
        mimeType: file.type
      });
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load file');
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
              Supports PNG, JPG, WebP, GIF, MP4, WebM
            </p>
            <p style={{ marginTop: '0.25rem', opacity: 0.5, fontSize: '0.8rem' }}>
              🎬 Upload animated maps (video/GIF) for dynamic backgrounds
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/webm"
          onChange={handleFileChange}
        />
      </div>

      {/* YouTube URL Section */}
      <div className="youtube-section">
        <p className="section-divider">— or paste a YouTube URL —</p>
        <div className="url-input-group">
          <div className="url-input-wrapper">
            <Youtube size={18} className="url-icon" />
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => { setYoutubeUrl(e.target.value); setUrlError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
              placeholder="https://youtube.com/watch?v=..."
              className="url-input"
            />
            <button
              className="url-submit-btn"
              onClick={handleYoutubeSubmit}
              disabled={!youtubeUrl.trim()}
            >
              <Play size={16} />
              Load
            </button>
          </div>
          <p className="url-hint">Works with animated battle map channels like Warbux, Dynamic Dungeons, etc.</p>
        </div>

        <p className="section-divider" style={{ marginTop: '0.75rem' }}>— or paste a direct video URL —</p>
        <div className="url-input-group">
          <div className="url-input-wrapper">
            <Link size={18} className="url-icon" />
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => { setVideoUrl(e.target.value); setUrlError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVideoUrlSubmit()}
              placeholder="https://example.com/map.mp4"
              className="url-input"
            />
            <button
              className="url-submit-btn"
              onClick={handleVideoUrlSubmit}
              disabled={!videoUrl.trim()}
            >
              <Play size={16} />
              Load
            </button>
          </div>
          <p className="url-hint">MP4 or WebM URLs from Patreon, Google Drive, etc.</p>
        </div>

        {urlError && <p className="url-error">{urlError}</p>}
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

        .youtube-section {
          margin-top: 1.5rem;
          text-align: center;
        }

        .url-input-group {
          max-width: 400px;
          margin: 0 auto;
        }

        .url-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.25rem 0.5rem;
          transition: border-color 0.2s;
        }

        .url-input-wrapper:focus-within {
          border-color: #ef4444;
        }

        .url-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .url-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          padding: 0.5rem 0;
          outline: none;
          min-width: 0;
        }

        .url-input::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .url-submit-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          background: #ef4444;
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .url-submit-btn:hover:not(:disabled) {
          background: #dc2626;
        }

        .url-submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .url-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          opacity: 0.6;
          margin-top: 0.5rem;
        }

        .url-error {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
