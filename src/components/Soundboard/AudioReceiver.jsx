import { useEffect, useRef, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Volume2, VolumeX } from 'lucide-react';
import './AudioReceiver.css';

// Create audio context for synthesized sounds
const createAudioContext = () => {
  return new (window.AudioContext || window.webkitAudioContext)();
};

// Sound synthesis functions (same as DMSoundboard)
const synthesizeSounds = {
  // Combat sounds
  'sword-clash': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();

    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(volume * 0.8, ctx.currentTime);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    noise.connect(noiseGain);
    gain.connect(ctx.destination);
    noiseGain.connect(ctx.destination);

    osc.start();
    noise.start();
    osc.stop(ctx.currentTime + 0.15);
    noise.stop(ctx.currentTime + 0.15);
  },

  'sword-swing': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  },

  'arrow-hit': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },

  'punch': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(volume * 0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  },

  'explosion': (ctx, volume) => {
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3) * Math.sin(t * 50);
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();

    source.buffer = buffer;
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(500, ctx.currentTime);
    lowpass.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1);

    gain.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + 1.5);
  },

  'battle-cry': (ctx, volume) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
    osc1.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.8);
    osc2.frequency.setValueAtTime(202, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(404, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
  },

  // Magic sounds
  'spell-cast': (ctx, volume) => {
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 400 + i * 200;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + i * 0.05);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, ctx.currentTime + i * 0.05 + 0.3);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(volume * 0.15, ctx.currentTime + i * 0.05 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.4);
    }
  },

  'magic-whoosh': (ctx, volume) => {
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.5;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.25);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.5);
    filter.Q.value = 5;

    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + 0.5);
  },

  'heal': (ctx, volume) => {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  },

  'teleport': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
    gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  },

  'electric': (ctx, volume) => {
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1000 + Math.random() * 500, ctx.currentTime + i * 0.03);

      gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.03 + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.03);
      osc.stop(ctx.currentTime + i * 0.03 + 0.05);
    }
  },

  'power-up': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
    gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  },

  // Nature sounds
  'thunder': (ctx, volume) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 1.5) * (1 + Math.sin(t * 20) * 0.3);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();

    source.buffer = buffer;
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 200;

    gain.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + 2);
  },

  // Creature sounds
  'wolf-howl': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();

    vibrato.frequency.value = 5;
    vibratoGain.gain.value = 20;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.5);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 2);

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    vibrato.start();
    osc.start();
    vibrato.stop(ctx.currentTime + 2);
    osc.stop(ctx.currentTime + 2);
  },

  'monster-growl': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.7);
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 1);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1);
  },

  // UI sounds
  'level-up': (ctx, volume) => {
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(volume * 0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  },

  'coin': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  },

  'success': (ctx, volume) => {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  },

  'fail': (ctx, volume) => {
    [400, 300].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  },

  'click': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1000;

    gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  },

  // Ambient sounds
  'door-creak': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.6);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  },

  'footsteps': (ctx, volume) => {
    for (let i = 0; i < 4; i++) {
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.2));
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime + i * 0.4);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(ctx.currentTime + i * 0.4);
      source.stop(ctx.currentTime + i * 0.4 + 0.1);
    }
  },

  'heartbeat': (ctx, volume) => {
    for (let beat = 0; beat < 3; beat++) {
      [0, 0.15].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 60;

        const startTime = ctx.currentTime + beat * 0.8 + offset;
        gain.gain.setValueAtTime(volume * (offset === 0 ? 0.4 : 0.25), startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.1);
      });
    }
  },

  'church-bell': (ctx, volume) => {
    const frequencies = [261.63, 329.63, 392, 523.25];
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2);
    });
  },
};

/**
 * AudioReceiver - Plays audio broadcast by the DM on the Battle Map Display
 * Supports both synthesized sounds and custom uploaded sounds
 */
export default function AudioReceiver({ campaignId }) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [volume, setVolume] = useState(70);
  const lastStateIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const customAudioRef = useRef(new Audio());

  // Get or create audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Play synthesized sound
  const playSynthSound = useCallback((soundId, vol) => {
    const ctx = getAudioContext();
    if (synthesizeSounds[soundId]) {
      synthesizeSounds[soundId](ctx, vol);
    }
  }, [getAudioContext]);

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
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
      setCurrentSound(null);
      return;
    }

    if (state.action === 'play') {
      // Handle synthesized sounds
      if (state.type === 'synth' && state.soundId) {
        playSynthSound(state.soundId, vol);
        setCurrentSound(state.soundName);
        setTimeout(() => setCurrentSound(null), 2000);
        return;
      }

      // Handle custom uploaded sounds
      if (state.type === 'custom' && state.sound?.url) {
        const audio = customAudioRef.current;
        audio.src = state.sound.url;
        audio.volume = vol;

        try {
          await audio.play();
          setCurrentSound(state.sound.name);
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
    customAudioRef.current.volume = vol;
  }, [volume, isMuted]);

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      customAudioRef.current.pause();
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
