import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Text, Shape } from 'react-konva';
import useImage from 'use-image';
import { Maximize, Minimize, RotateCw, Grid } from 'lucide-react';
import MapAnimationOverlay from '../BattleMapStudio/Canvas/MapAnimationOverlay';
import Dice3DOverlay from '../DiceRoller/Dice3DOverlay';
import DiceRollerFloat from '../DiceRoller/DiceRollerFloat';
import AudioReceiver from '../Soundboard/AudioReceiver';
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
  const isVideo = mapState?.mapImage?.isVideo;
  const isYouTube = mapState?.mapImage?.isYouTube;
  const isStaticImage = !isVideo && !isYouTube;
  const [mapImage] = useImage(isStaticImage ? mapState?.mapImage?.url : null, 'anonymous');

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
    fogEnabled = true,
    animationEffects = [],
    animationIntensity = 1,
    animationEnabled = false
  } = mapState;

  // Check if fog should be shown (enabled and has revealed areas to cut)
  const showFog = fogEnabled && fogRevealed.length > 0;

  return (
    <div style={{ position: 'relative', width: mapData.width, height: mapData.height }}>
      {/* YouTube iframe background */}
      {isYouTube && mapData.youtubeId && (
        <iframe
          src={`https://www.youtube.com/embed/${mapData.youtubeId}?autoplay=1&loop=1&controls=0&mute=1&playlist=${mapData.youtubeId}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            pointerEvents: 'none',
            zIndex: 0
          }}
          title="Battle Map Background"
        />
      )}
      {/* Video background for animated maps */}
      {isVideo && !isYouTube && (
        <video
          src={mapData.url}
          autoPlay
          loop
          muted
          playsInline
          crossOrigin={mapData.isExternal ? 'anonymous' : undefined}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      )}
      <Stage
        width={mapData.width}
        height={mapData.height}
        style={{ background: isStaticImage ? '#000' : 'transparent', position: 'relative', zIndex: 1 }}
      >
        {/* Background layer - only for static images */}
        {isStaticImage && (
          <Layer>
            {mapImage && (
              <KonvaImage
                image={mapImage}
                width={mapData.width}
                height={mapData.height}
              />
            )}
          </Layer>
        )}

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

      {/* Animation overlay */}
      {animationEnabled && animationEffects.length > 0 && (
        <MapAnimationOverlay
          width={mapData.width}
          height={mapData.height}
          effects={animationEffects}
          intensity={animationIntensity}
          enabled={animationEnabled}
        />
      )}
    </div>
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
  const [rotation, setRotation] = useState(0);
  const [diceRoll, setDiceRoll] = useState(null);
  const [showDiceOverlay, setShowDiceOverlay] = useState(false);
  const lastRollIdRef = useRef(null);

  // Rotate map by 90 degrees
  const rotateMap = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

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

  // Subscribe to dice rolls
  useEffect(() => {
    if (!campaignId) return;

    let isFirstSnapshot = true;

    const unsubscribe = onSnapshot(
      doc(db, `campaigns/${campaignId}/battleMapDisplay/diceRoll`),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();

          // On first snapshot, just record the current rollId without triggering animation
          if (isFirstSnapshot) {
            isFirstSnapshot = false;
            lastRollIdRef.current = data.rollId || null;
            return;
          }

          // Only show if it's a new roll (different rollId)
          if (data.rollId && data.rollId !== lastRollIdRef.current) {
            lastRollIdRef.current = data.rollId;
            setDiceRoll(data);
            setShowDiceOverlay(true);
          }
        } else {
          isFirstSnapshot = false;
        }
      },
      (error) => {
        console.error('Dice roll subscription error:', error);
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
      setScale(Math.max(scaleX, scaleY)); // Cover: fill screen, clip overflow
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
        <button onClick={rotateMap} title={`Rotate Map (${rotation}°)`}>
          <RotateCw size={24} />
        </button>
        <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>

      {/* Map container with scaling and rotation */}
      <div
        className="map-container"
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
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

      {/* 3D Dice Roll Overlay — passive display only.
          History is written by the originating client (DiceRollerFloat /
          useQuickRoll); this window never re-derives or re-writes numbers
          from its own physics animation. */}
      <Dice3DOverlay
        show={showDiceOverlay}
        rollData={diceRoll}
        onComplete={() => setShowDiceOverlay(false)}
        onClose={() => setShowDiceOverlay(false)}
      />

      {/* Single unified dice roller — the same pop-out used elsewhere in the app */}
      <DiceRollerFloat campaignId={campaignId} />

      {/* Audio Receiver for DM Soundboard */}
      <AudioReceiver campaignId={campaignId} />
    </div>
  );
}
