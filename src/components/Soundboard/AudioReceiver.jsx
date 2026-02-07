import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Volume2, VolumeX } from 'lucide-react';
import './AudioReceiver.css';

/**
 * AudioReceiver - Plays audio broadcast by the DM on the Battle Map Display
 * Supports AI-generated sounds (URLs) and custom uploaded sounds (base64)
 */
export default function AudioReceiver({ campaignId }) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [volume, setVolume] = useState(70);
  const lastStateIdRef = useRef(null);
  const audioRef = useRef(new Audio());

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
    const audio = audioRef.current;

    if (state.action === 'stop') {
      audio.pause();
      audio.currentTime = 0;
      setCurrentSound(null);
      return;
    }

    if (state.action === 'play') {
      let audioUrl = null;
      let soundName = null;

      // Handle URL-based sounds (AI-generated)
      if (state.type === 'url' && state.url) {
        audioUrl = state.url;
        soundName = state.name || 'Sound';
      }

      // Handle custom uploaded sounds (base64)
      if (state.type === 'custom' && state.sound?.url) {
        audioUrl = state.sound.url;
        soundName = state.sound.name || 'Custom Sound';
      }

      if (audioUrl) {
        audio.src = audioUrl;
        audio.volume = vol;
        audio.loop = state.loop || false;

        try {
          await audio.play();
          setCurrentSound(soundName);
          audio.onended = () => setCurrentSound(null);
        } catch (error) {
          console.error('Failed to play audio:', error);
        }
      }
    }
  };

  // Update volume when changed
  useEffect(() => {
    const vol = isMuted ? 0 : volume / 100;
    audioRef.current.volume = vol;
  }, [volume, isMuted]);

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      audioRef.current.pause();
      setCurrentSound(null);
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
