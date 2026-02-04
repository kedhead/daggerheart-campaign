import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Text, Shape } from 'react-konva';
import useImage from 'use-image';
import { Maximize, Minimize, Grid } from 'lucide-react';
import './BattleMapDisplayWindow.css';

/**
 * Token component for rendering tokens on the display
 */
function DisplayToken({ token, gridSize }) {
  const [image] = useImage(token.src, 'anonymous');

  if (token.src && image) {
    return (
      <KonvaImage
        x={token.x}
        y={token.y}
        width={token.width}
        height={token.height}
        image={image}
        rotation={token.rotation || 0}
        offsetX={token.width / 2}
        offsetY={token.height / 2}
      />
    );
  }

  // Colored token (no image)
  if (token.color) {
    const size = token.width || gridSize;
    return (
      <>
        <Circle
          x={token.x}
          y={token.y}
          radius={size / 2}
          fill={token.color}
          stroke="white"
          strokeWidth={2}
        />
        {token.name && (
          <Text
            x={token.x - size / 2}
            y={token.y + size / 2 + 4}
            width={size}
            text={token.name}
            fontSize={12}
            fill="white"
            align="center"
          />
        )}
      </>
    );
  }

  return null;
}

/**
 * Grid overlay component
 */
function GridOverlay({ width, height, gridSize, gridColor }) {
  const lines = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={gridColor}
        strokeWidth={1}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={gridColor}
        strokeWidth={1}
      />
    );
  }

  return <>{lines}</>;
}

/**
 * Fog of War layer - shows unexplored areas as black
 */
function FogOfWarLayer({ width, height, revealed }) {
  const drawFog = (context, shape) => {
    // Fill entire area with fog
    context.fillStyle = 'rgba(0, 0, 0, 0.95)';
    context.fillRect(0, 0, width, height);

    // Use destination-out to cut holes for revealed areas
    context.globalCompositeOperation = 'destination-out';

    revealed.forEach(area => {
      if (area.type === 'circle') {
        context.beginPath();
        context.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
        context.fill();
      } else if (area.type === 'rect') {
        context.fillRect(area.x, area.y, area.width, area.height);
      } else if (area.type === 'polygon' && area.points) {
        context.beginPath();
        context.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
          context.lineTo(area.points[i].x, area.points[i].y);
        }
        context.closePath();
        context.fill();
      }
    });

    // Reset composite operation
    context.globalCompositeOperation = 'source-over';
    context.fillStrokeShape(shape);
  };

  return (
    <Shape
      sceneFunc={drawFog}
      listening={false}
    />
  );
}

/**
 * Main map canvas component
 */
function MapCanvas({ mapState }) {
  const [mapImage] = useImage(mapState?.mapImage?.url, 'anonymous');

  if (!mapState?.mapImage) {
    return (
      <div className="no-map-message">
        <Grid size={64} />
        <h2>No Battle Map</h2>
        <p>Waiting for DM to broadcast a map...</p>
      </div>
    );
  }

  const {
    mapImage: mapData,
    tokens = [],
    gridSize = 50,
    gridVisible = true,
    gridColor = 'rgba(255,255,255,0.3)',
    fogRevealed = [],
    fogEnabled = true
  } = mapState;

  // Check if fog should be shown (enabled and has revealed areas to cut)
  const showFog = fogEnabled && fogRevealed.length > 0;

  return (
    <Stage
      width={mapData.width}
      height={mapData.height}
      style={{ background: '#000' }}
    >
      {/* Background layer - map image */}
      <Layer>
        {mapImage && (
          <KonvaImage
            image={mapImage}
            width={mapData.width}
            height={mapData.height}
          />
        )}
      </Layer>

      {/* Grid layer */}
      {gridVisible && (
        <Layer listening={false}>
          <GridOverlay
            width={mapData.width}
            height={mapData.height}
            gridSize={gridSize}
            gridColor={gridColor}
          />
        </Layer>
      )}

      {/* Tokens layer */}
      <Layer>
        {tokens.map(token => (
          <DisplayToken key={token.id} token={token} gridSize={gridSize} />
        ))}
      </Layer>

      {/* Fog of War layer - on top of everything */}
      {showFog && (
        <Layer listening={false}>
          <FogOfWarLayer
            width={mapData.width}
            height={mapData.height}
            revealed={fogRevealed}
          />
        </Layer>
      )}
    </Stage>
  );
}

/**
 * Battle Map Display Window
 * Standalone display for battle maps, separate from the main Player Display
 */
export default function BattleMapDisplayWindow({ campaignId }) {
  const [mapState, setMapState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [scale, setScale] = useState(1);

  // Subscribe to battle map display state
  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, `campaigns/${campaignId}/battleMapDisplay/current`),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setMapState(docSnapshot.data());
        } else {
          setMapState(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Battle map display subscription error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [campaignId]);

  // Auto-scale map to fit window
  useEffect(() => {
    if (!mapState?.mapImage) return;

    const updateScale = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const mapWidth = mapState.mapImage.width;
      const mapHeight = mapState.mapImage.height;

      const scaleX = windowWidth / mapWidth;
      const scaleY = windowHeight / mapHeight;
      setScale(Math.min(scaleX, scaleY, 1)); // Don't scale up, only down
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [mapState?.mapImage]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Mouse move to show controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="battle-map-display-window loading">
        <div className="loading-spinner" />
        <p>Loading battle map...</p>
      </div>
    );
  }

  return (
    <div
      className="battle-map-display-window"
      onMouseMove={handleMouseMove}
    >
      {/* Controls overlay */}
      <div className={`display-controls ${showControls ? 'visible' : ''}`}>
        <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>

      {/* Map container with scaling */}
      <div
        className="map-container"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        <MapCanvas mapState={mapState} />
      </div>

      {/* Campaign ID display (for debugging) */}
      {!mapState && (
        <div className="campaign-id-hint">
          Campaign: {campaignId || 'Not specified'}
        </div>
      )}
    </div>
  );
}
