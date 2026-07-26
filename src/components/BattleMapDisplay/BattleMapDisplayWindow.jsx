import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';
import { Maximize, Minimize, RotateCw, Grid } from 'lucide-react';
import MapAnimationOverlay from '../BattleMapStudio/Canvas/MapAnimationOverlay';
// Shared with the studio so the two views cannot drift apart again.
import GridOverlay from '../BattleMapStudio/Canvas/GridOverlay';
import FogOfWarLayer from '../BattleMapStudio/Canvas/FogOfWarLayer';
import TokenLayer from '../BattleMapStudio/Canvas/TokenLayer';
import DrawingLayer from '../BattleMapStudio/Canvas/DrawingLayer';
import { DiceTray, DiceRoller, RollHistory, claimDiceAuthority, releaseDiceAuthority } from '../../dice';

// Re-claimed well inside the 30s TTL in service.js so a brief hiccup doesn't
// make the display look dead and send rolls back to the local RNG.
const DICE_AUTHORITY_HEARTBEAT_MS = 10000;
import AudioReceiver from '../Soundboard/AudioReceiver';
import './BattleMapDisplayWindow.css';

const noop = () => {};

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
    showTokenLabels = true,
    drawings = [],
    gridSize = 50,
    gridType = 'square',
    gridVisible = true,
    gridColor = 'rgba(255,255,255,0.3)',
    fogRevealed = [],
    fogEnabled = true,
    animationEffects = [],
    animationIntensity = 1,
    animationEnabled = false
  } = mapState;

  // Fog with nothing revealed means the DM has covered the whole map — that
  // must render as fully fogged, not as no fog at all.
  const showFog = fogEnabled;

  // Same split as the studio: scenery renders beneath creature tokens.
  const backgroundTokens = tokens.filter(t => t.layer === 'background');
  const foregroundTokens = tokens.filter(t => t.layer !== 'background');

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
            {/* Blank canvases carry no image, just a fill colour */}
            {(mapData.isBlank || !mapData.url) ? (
              <Rect
                x={0}
                y={0}
                width={mapData.width}
                height={mapData.height}
                fill={mapData.bgColor || '#1a1a2e'}
              />
            ) : mapImage && (
              <KonvaImage
                image={mapImage}
                width={mapData.width}
                height={mapData.height}
              />
            )}
          </Layer>
        )}

        {/* Scenery, beneath grid and creatures */}
        {backgroundTokens.length > 0 && (
          <Layer listening={false}>
            <TokenLayer
              tokens={backgroundTokens}
              selectedIds={[]}
              onSelect={noop}
              onUpdate={noop}
              gridSize={gridSize}
              snapToGrid={false}
              isSelectable={false}
              showLabels={showTokenLabels}
            />
          </Layer>
        )}

        {/* Grid layer */}
        {gridVisible && gridType !== 'none' && (
          <Layer listening={false}>
            <GridOverlay
              width={mapData.width}
              height={mapData.height}
              gridType={gridType}
              gridSize={gridSize}
              gridColor={gridColor}
            />
          </Layer>
        )}

        {/* DM annotations — broadcast all along but never rendered here */}
        <DrawingLayer drawings={drawings} />

        {/* Tokens layer */}
        <Layer listening={false}>
          <TokenLayer
            tokens={foregroundTokens}
            selectedIds={[]}
            onSelect={noop}
            onUpdate={noop}
            gridSize={gridSize}
            snapToGrid={false}
            isSelectable={false}
            showLabels={showTokenLabels}
          />
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

  // Claim the dice authority for as long as this screen is open. Rolls
  // published while the claim is live are left unresolved for this window to
  // throw real dice for — so the numbers players watch land are the result.
  useEffect(() => {
    if (!campaignId) return undefined;
    claimDiceAuthority(campaignId).catch(err =>
      console.warn('[BattleMapDisplay] could not claim dice authority:', err));
    const id = setInterval(() => {
      claimDiceAuthority(campaignId).catch(() => { /* next beat will retry */ });
    }, DICE_AUTHORITY_HEARTBEAT_MS);
    return () => {
      clearInterval(id);
      releaseDiceAuthority(campaignId);
    };
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

      {/* Unified dice system: every viewer reads canonical roll docs from
          campaigns/{id}/rolls. Numbers are never derived from physics. */}
      <DiceTray campaignId={campaignId} animateRemote isRollAuthority />
      <RollHistory campaignId={campaignId} variant="sidebar" />
      <DiceRoller campaignId={campaignId} variant="fab" />

      {/* Audio Receiver for DM Soundboard */}
      <AudioReceiver campaignId={campaignId} />
    </div>
  );
}
