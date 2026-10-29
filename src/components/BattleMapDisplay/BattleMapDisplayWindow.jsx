import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Maximize, Minimize, RotateCw, Map as MapIcon, Expand, Shrink } from 'lucide-react';
import MapAnimationOverlay from '../BattleMapStudio/Canvas/MapAnimationOverlay';
import { DiceTray, DiceRoller, RollHistory } from '../../dice';
import AudioReceiver from '../Soundboard/AudioReceiver';
import MonitorCinematics from '../Cinematics/MonitorCinematics';
import { useWakeLock } from '../../hooks/useWakeLock';
import './BattleMapDisplayWindow.css';

// How the map meets the screen: 'fill' covers it edge to edge (a 16:9 map on
// a 16:9 monitor loses nothing), 'fit' shows the whole map with bars if the
// shapes differ. Remembered per screen.
const FIT_KEY = 'battleMapDisplay.fit';
const readFit = () => { try { return localStorage.getItem(FIT_KEY) === 'fit' ? 'fit' : 'fill'; } catch { return 'fill'; } };

/**
 * The map itself, sized to the screen rather than to the map's stored pixel
 * size. It used to draw onto a canvas at the map's resolution and stretch it
 * with a CSS transform, which went soft on a 1440p monitor and left gaps
 * whenever the stored size was missing or wrong.
 */
function MapView({ mapState, fit }) {
  const map = mapState?.mapImage;
  if (!map) {
    return (
      <div className="no-map-message">
        <MapIcon size={64} />
        <h2>No Battle Map</h2>
        <p>Waiting for the DM to show a map...</p>
      </div>
    );
  }
  const objectFit = fit === 'fit' ? 'contain' : 'cover';
  const { animationEffects = [], animationIntensity = 1, animationEnabled = false } = mapState;

  return (
    <div className="bmd-map">
      {map.isYouTube && map.youtubeId ? (
        <iframe
          className={`bmd-youtube ${objectFit}`}
          src={`https://www.youtube.com/embed/${map.youtubeId}?autoplay=1&loop=1&controls=0&mute=1&playlist=${map.youtubeId}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
          allow="autoplay; encrypted-media"
          title="Battle map"
        />
      ) : map.isVideo ? (
        <video
          className="bmd-media"
          src={map.url}
          autoPlay
          loop
          muted
          playsInline
          crossOrigin={map.isExternal ? 'anonymous' : undefined}
          style={{ objectFit }}
        />
      ) : map.url && !map.isBlank ? (
        <img className="bmd-media" src={map.url} alt="" style={{ objectFit }} />
      ) : (
        <div className="bmd-media" style={{ background: map.bgColor || '#1a1a2e' }} />
      )}

      <MapAnimationOverlay
        effects={animationEffects}
        intensity={animationIntensity}
        enabled={animationEnabled}
      />
    </div>
  );
}

/**
 * Battle Map Display Window — the screen the players look at.
 */
export default function BattleMapDisplayWindow({ campaignId }) {
  const [mapState, setMapState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [fit, setFit] = useState(readFit);
  const hideTimer = useRef(null);

  // A map screen runs for a whole session; don't let it sleep.
  useWakeLock(true);

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(
      doc(db, `campaigns/${campaignId}/battleMapDisplay/current`),
      (snap) => {
        setMapState(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (error) => {
        console.error('Battle map display subscription error:', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [campaignId]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(err => console.error('Fullscreen error:', err));
    else document.exitFullscreen?.();
  }, []);

  const toggleFit = useCallback(() => {
    setFit(prev => {
      const next = prev === 'fill' ? 'fit' : 'fill';
      try { localStorage.setItem(FIT_KEY, next); } catch { /* per-screen nicety only */ }
      return next;
    });
  }, []);

  // Show the controls while the mouse moves, hide them 3s after it stops.
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  if (loading) {
    return (
      <div className="battle-map-display-window loading">
        <div className="loading-spinner" />
        <p>Loading battle map...</p>
      </div>
    );
  }

  // Turned sideways, the frame swaps width and height so it still fills the screen.
  const sideways = rotation % 180 !== 0;

  return (
    <div className="battle-map-display-window" onMouseMove={handleMouseMove}>
      <div className={`display-controls ${showControls ? 'visible' : ''}`}>
        <button onClick={toggleFit} title={fit === 'fill' ? 'Show the whole map' : 'Fill the screen'}>
          {fit === 'fill' ? <Shrink size={24} /> : <Expand size={24} />}
        </button>
        <button onClick={() => setRotation(r => (r + 90) % 360)} title={`Rotate map (${rotation}°)`}>
          <RotateCw size={24} />
        </button>
        <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>

      <div
        className={`bmd-frame ${sideways ? 'sideways' : ''}`}
        style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
      >
        <MapView mapState={mapState} fit={fit} />
      </div>

      {!mapState && (
        <div className="campaign-id-hint">Campaign: {campaignId || 'Not specified'}</div>
      )}

      {/* Unified dice system: every viewer reads canonical roll docs from
          campaigns/{id}/rolls. Numbers are never derived from physics. */}
      <DiceTray campaignId={campaignId} animateRemote />
      <RollHistory campaignId={campaignId} variant="sidebar" />
      <DiceRoller campaignId={campaignId} variant="fab" />

      <AudioReceiver campaignId={campaignId} />

      {/* Boss intros and "Previously on…" recaps the DM sends to the table. */}
      <MonitorCinematics campaignId={campaignId} />
    </div>
  );
}
