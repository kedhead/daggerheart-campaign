import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Volume2, VolumeX } from 'lucide-react';
import './AudioReceiver.css';

/**
 * AudioReceiver - Plays audio broadcast by the DM on the Battle Map Display
 * This component should be added to BattleMapDisplayWindow
 */
export default function AudioReceiver({ campaignId }) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [volume, setVolume] = useState(70);
  const lastStateIdRef = useRef(null);

  const effectsAudioRef = useRef(new Audio());
  const ambientAudioRef = useRef(new Audio());

  // Subscribe to audio state from DM
  useEffect(() => {
    if (!campaignId) return;

    const unsubscribe = onSnapshot(
      doc(db, `campaigns/${campaignId}/battleMapDisplay/audio`),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();

          // Only process new states
          if (data.stateId && data.stateId !== lastStateIdRef.current) {
            lastStateIdRef.current = data.stateId;
            handleAudioState(data);
          }
        }
      },
      (error) => {
        console.error('Audio subscription error:', error);
      }
    );

    return unsubscribe;
  }, [campaignId]);

  // Handle audio state changes
  const handleAudioState = async (state) => {
    if (isMuted) return;

    const vol = (state.volume || 70) / 100;

    if (state.action === 'stop') {
      if (state.type === 'all' || state.type === 'effect') {
        effectsAudioRef.current.pause();
        effectsAudioRef.current.currentTime = 0;
      }
      if (state.type === 'all' || state.type === 'ambient') {
        ambientAudioRef.current.pause();
        ambientAudioRef.current.currentTime = 0;
        setCurrentSound(null);
      }
      return;
    }

    if (state.action === 'play' && state.sound) {
      const audio = state.type === 'ambient' ? ambientAudioRef.current : effectsAudioRef.current;

      audio.src = state.sound.url;
      audio.loop = state.sound.loop || false;
      audio.volume = vol;

      try {
        await audio.play();
        if (state.type === 'ambient') {
          setCurrentSound(state.sound.name);
        }
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  };

  // Update volume when changed
  useEffect(() => {
    const vol = isMuted ? 0 : volume / 100;
    effectsAudioRef.current.volume = vol;
    ambientAudioRef.current.volume = vol;
  }, [volume, isMuted]);

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      effectsAudioRef.current.pause();
      ambientAudioRef.current.pause();
    }
  };

  return (
    <div className="audio-receiver">
      <button
        className={`audio-mute-btn ${isMuted ? 'muted' : ''}`}
        onClick={toggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      {currentSound && !isMuted && (
        <div className="audio-now-playing">
          <span className="audio-pulse" />
          {currentSound}
        </div>
      )}
    </div>
  );
}
