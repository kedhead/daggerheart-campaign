import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { usePlayerDisplay } from '../../hooks/usePlayerDisplay';
import FearCounter from './FearCounter';
import InitiativeDisplay from './InitiativeDisplay';
import SpotlightDisplay from './SpotlightDisplay';
import ContentDisplay from './ContentDisplay';
import ContentGrid from './ContentGrid';
import { Maximize, Minimize } from 'lucide-react';
import './PlayerDisplay.css';

export default function PlayerDisplay({ campaignId, gameSystem: givenSystem = null }) {
  const {
    loading,
    fearCount,
    showFear,
    showInitiative,
    showNames,
    contentType,
    content,
    contentItems,
    videoMuted
  } = usePlayerDisplay(campaignId);

  const [initiative, setInitiative] = useState(null);
  const [spotlight, setSpotlight] = useState(null);
  // The TV is opened by link, so it reads the campaign's game system itself
  // (it used to assume Daggerheart, and showed Fear for every system).
  const [campaignSystem, setCampaignSystem] = useState(null);
  useEffect(() => {
    if (!campaignId || givenSystem) return undefined;
    return onSnapshot(doc(db, 'campaigns', campaignId), snap => setCampaignSystem(snap.exists() ? snap.data().gameSystem || 'daggerheart' : 'daggerheart'), () => setCampaignSystem('daggerheart'));
  }, [campaignId, givenSystem]);
  const gameSystem = givenSystem || campaignSystem || 'daggerheart';

  // Daggerheart's spotlight (see SpotlightTracker), shown in place of initiative.
  useEffect(() => {
    if (!campaignId) return undefined;
    return onSnapshot(doc(db, `campaigns/${campaignId}/initiative/spotlight`), snap => setSpotlight(snap.exists() ? snap.data() : null), () => setSpotlight(null));
  }, [campaignId]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Subscribe to initiative for this campaign
  useEffect(() => {
    if (!campaignId) return;

    const unsubscribe = onSnapshot(
      doc(db, `campaigns/${campaignId}/initiative/current`),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setInitiative({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          setInitiative(null);
        }
      },
      (error) => {
        console.warn('Initiative subscription error:', error.code);
        setInitiative(null);
      }
    );

    return unsubscribe;
  }, [campaignId]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  }, []);

  // Keyboard shortcut for fullscreen (F key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      // ESC is handled by browser for exiting fullscreen
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  // Update fullscreen state when it changes externally
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Show/hide controls on mouse move
  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const isDaggerheart = !gameSystem || gameSystem === 'daggerheart';

  if (loading) {
    return (
      <div className="player-display-container loading">
        <div className="loading-spinner"></div>
        <p>Connecting to display...</p>
      </div>
    );
  }

  return (
    <div
      className={`player-display-container ${isFullscreen ? 'fullscreen' : ''}`}
      onClick={() => setShowControls(prev => !prev)}
    >
      <div className="player-display-header">
        {isDaggerheart && showFear && (
          <FearCounter fearCount={fearCount} />
        )}
        {showInitiative && isDaggerheart && spotlight?.current && (
          <SpotlightDisplay spotlight={spotlight} />
        )}
        {showInitiative && !isDaggerheart && initiative?.active && (
          <InitiativeDisplay initiative={initiative} />
        )}
      </div>

      <div className="player-display-content">
        {contentItems && contentItems.length > 0 ? (
          <ContentGrid items={contentItems} showNames={showNames} videoMuted={videoMuted} />
        ) : (
          <ContentDisplay contentType={contentType} content={content} showNames={showNames} videoMuted={videoMuted} />
        )}
      </div>

      {/* Fullscreen Control */}
      <button
        className={`fullscreen-toggle ${showControls ? 'visible' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
      >
        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>

      {/* Instructions overlay (shows briefly on load) */}
      <div className={`display-hint ${showControls ? 'visible' : ''}`}>
        Press F for fullscreen
      </div>
    </div>
  );
}
