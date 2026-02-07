import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2, VolumeX, Play, Pause, Square, Music, Swords, Sparkles,
  Trees, Castle, Skull, Heart, Upload, Wand2, Search, Trash2,
  ChevronDown, ChevronUp, Radio
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './DMSoundboard.css';

// Web Audio API synthesized sounds - no external dependencies!
const createAudioContext = () => {
  return new (window.AudioContext || window.webkitAudioContext)();
};

// Sound synthesis functions
const synthesizeSounds = {
  // Combat sounds
  'sword-clash': (ctx, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();

    // Create noise buffer
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
    noiseGain.gain.exponentialDecayTo = volume * 0.01;

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
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
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
    frequencies.forEach((freq, i) => {
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

// Sound categories with synthesized sounds
const SOUND_CATEGORIES = {
  combat: {
    name: 'Combat',
    icon: Swords,
    color: '#ef4444',
    sounds: [
      { id: 'sword-clash', name: 'Sword Clash', synth: true },
      { id: 'sword-swing', name: 'Sword Swing', synth: true },
      { id: 'arrow-hit', name: 'Arrow Hit', synth: true },
      { id: 'punch', name: 'Punch Hit', synth: true },
      { id: 'explosion', name: 'Explosion', synth: true },
      { id: 'battle-cry', name: 'Battle Cry', synth: true },
    ]
  },
  magic: {
    name: 'Magic',
    icon: Sparkles,
    color: '#8b5cf6',
    sounds: [
      { id: 'spell-cast', name: 'Spell Cast', synth: true },
      { id: 'magic-whoosh', name: 'Magic Whoosh', synth: true },
      { id: 'power-up', name: 'Power Up', synth: true },
      { id: 'heal', name: 'Healing', synth: true },
      { id: 'teleport', name: 'Teleport', synth: true },
      { id: 'electric', name: 'Electric Zap', synth: true },
    ]
  },
  nature: {
    name: 'Nature',
    icon: Trees,
    color: '#22c55e',
    sounds: [
      { id: 'thunder', name: 'Thunder', synth: true },
    ]
  },
  ambient: {
    name: 'Ambient',
    icon: Castle,
    color: '#f59e0b',
    sounds: [
      { id: 'church-bell', name: 'Church Bell', synth: true },
      { id: 'footsteps', name: 'Footsteps', synth: true },
      { id: 'door-creak', name: 'Door Creak', synth: true },
      { id: 'heartbeat', name: 'Heartbeat', synth: true },
    ]
  },
  creatures: {
    name: 'Creatures',
    icon: Skull,
    color: '#64748b',
    sounds: [
      { id: 'wolf-howl', name: 'Wolf Howl', synth: true },
      { id: 'monster-growl', name: 'Monster Growl', synth: true },
    ]
  },
  ui: {
    name: 'Game UI',
    icon: Heart,
    color: '#ec4899',
    sounds: [
      { id: 'level-up', name: 'Level Up', synth: true },
      { id: 'coin', name: 'Coin Collect', synth: true },
      { id: 'success', name: 'Success', synth: true },
      { id: 'fail', name: 'Failure', synth: true },
      { id: 'click', name: 'UI Click', synth: true },
    ]
  }
};

// Background music themes (placeholder)
const MUSIC_THEMES = [
  { id: 'battle', name: 'Epic Battle', icon: Swords, color: '#ef4444' },
  { id: 'exploration', name: 'Exploration', icon: Trees, color: '#22c55e' },
  { id: 'mystery', name: 'Mystery', icon: Sparkles, color: '#8b5cf6' },
  { id: 'tavern', name: 'Tavern Music', icon: Castle, color: '#f59e0b' },
  { id: 'tension', name: 'Tension', icon: Skull, color: '#64748b' },
  { id: 'victory', name: 'Victory', icon: Heart, color: '#ec4899' },
];

export default function DMSoundboard({ campaignId }) {
  const [activeCategory, setActiveCategory] = useState('combat');
  const [effectsVolume, setEffectsVolume] = useState(70);
  const [musicVolume, setMusicVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);
  const [customSounds, setCustomSounds] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSound, setPlayingSound] = useState(null);

  const audioContextRef = useRef(null);
  const customAudioRef = useRef(new Audio());

  // Initialize audio context on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Load custom sounds from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dm_custom_sounds');
    if (saved) {
      try {
        setCustomSounds(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom sounds:', e);
      }
    }
  }, []);

  // Save custom sounds
  const saveCustomSounds = (sounds) => {
    setCustomSounds(sounds);
    localStorage.setItem('dm_custom_sounds', JSON.stringify(sounds));
  };

  // Play a synthesized sound
  const playSynthSound = useCallback((soundId) => {
    const ctx = getAudioContext();
    const volume = isMuted ? 0 : effectsVolume / 100;

    if (synthesizeSounds[soundId]) {
      setPlayingSound(soundId);
      synthesizeSounds[soundId](ctx, volume);
      setTimeout(() => setPlayingSound(null), 500);
    }
  }, [getAudioContext, isMuted, effectsVolume]);

  // Play a sound (synthesized or custom)
  const playSound = async (sound) => {
    if (sound.synth) {
      playSynthSound(sound.id);

      // Broadcast to players
      if (broadcastEnabled && campaignId) {
        broadcastAudioState({
          type: 'synth',
          action: 'play',
          soundId: sound.id,
          soundName: sound.name,
          volume: effectsVolume
        });
      }
    } else if (sound.url) {
      // Custom uploaded sound
      const audio = customAudioRef.current;
      audio.src = sound.url;
      audio.volume = isMuted ? 0 : effectsVolume / 100;

      try {
        await audio.play();
        setPlayingSound(sound.id);
        audio.onended = () => setPlayingSound(null);

        if (broadcastEnabled && campaignId) {
          broadcastAudioState({
            type: 'custom',
            action: 'play',
            sound: {
              id: sound.id,
              name: sound.name,
              url: sound.url
            },
            volume: effectsVolume
          });
        }
      } catch (error) {
        console.error('Failed to play sound:', error);
      }
    }
  };

  // Stop all audio
  const stopAll = () => {
    customAudioRef.current.pause();
    customAudioRef.current.currentTime = 0;
    setPlayingSound(null);

    if (broadcastEnabled && campaignId) {
      broadcastAudioState({ type: 'all', action: 'stop' });
    }
  };

  // Broadcast audio state to players
  const broadcastAudioState = async (state) => {
    if (!campaignId) return;

    try {
      const audioDoc = doc(db, `campaigns/${campaignId}/battleMapDisplay/audio`);
      await setDoc(audioDoc, {
        ...state,
        timestamp: serverTimestamp(),
        stateId: Date.now().toString()
      });
    } catch (error) {
      console.error('Failed to broadcast audio:', error);
    }
  };

  // Handle custom sound upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newSound = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: event.target.result,
        isCustom: true
      };
      saveCustomSounds([...customSounds, newSound]);
    };
    reader.readAsDataURL(file);
  };

  // Delete custom sound
  const deleteCustomSound = (id) => {
    saveCustomSounds(customSounds.filter(s => s.id !== id));
  };

  // AI sound generation (placeholder)
  const generateAISound = async () => {
    if (!aiPrompt.trim()) return;

    setAiGenerating(true);
    setTimeout(() => {
      setAiGenerating(false);
      alert('AI sound generation coming soon! This will use ElevenLabs or similar APIs to generate custom sound effects.');
    }, 1500);
  };

  // Filter sounds based on search
  const getFilteredSounds = () => {
    if (!searchQuery.trim()) {
      return SOUND_CATEGORIES[activeCategory]?.sounds || [];
    }

    const query = searchQuery.toLowerCase();
    const allSounds = [];

    Object.values(SOUND_CATEGORIES).forEach(category => {
      category.sounds.forEach(sound => {
        if (sound.name.toLowerCase().includes(query)) {
          allSounds.push({ ...sound, category: category.name });
        }
      });
    });

    customSounds.forEach(sound => {
      if (sound.name.toLowerCase().includes(query)) {
        allSounds.push({ ...sound, category: 'Custom' });
      }
    });

    return allSounds;
  };

  const filteredSounds = getFilteredSounds();

  return (
    <div className="dm-soundboard">
      {/* Header */}
      <div className="soundboard-header">
        <div className="soundboard-title">
          <Volume2 size={20} />
          <span>DM Soundboard</span>
        </div>
        <div className="soundboard-controls">
          <button
            className={`broadcast-toggle ${broadcastEnabled ? 'active' : ''}`}
            onClick={() => setBroadcastEnabled(!broadcastEnabled)}
            title={broadcastEnabled ? 'Broadcasting to players' : 'Click to broadcast'}
          >
            <Radio size={14} />
            {broadcastEnabled ? 'Live' : 'Off'}
          </button>
          <button className="stop-all-btn" onClick={stopAll} title="Stop All">
            <Square size={14} />
          </button>
          <button
            className={`mute-btn ${isMuted ? 'muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* Volume Controls */}
      <div className="volume-controls">
        <div className="volume-row">
          <span><Swords size={12} /> Effects</span>
          <input
            type="range"
            min="0"
            max="100"
            value={effectsVolume}
            onChange={(e) => setEffectsVolume(parseInt(e.target.value))}
          />
          <span className="volume-value">{effectsVolume}%</span>
        </div>
        <div className="volume-row">
          <span><Music size={12} /> Music</span>
          <input
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={(e) => setMusicVolume(parseInt(e.target.value))}
          />
          <span className="volume-value">{musicVolume}%</span>
        </div>
      </div>

      {/* Search */}
      <div className="soundboard-search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search sounds..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="category-tabs">
          {Object.entries(SOUND_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <button
                key={key}
                className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
                style={{ '--cat-color': category.color }}
              >
                <Icon size={14} />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sound Grid */}
      <div className="sound-grid">
        {filteredSounds.map(sound => (
          <button
            key={sound.id}
            className={`sound-btn ${playingSound === sound.id ? 'playing' : ''}`}
            onClick={() => playSound(sound)}
            style={{ '--sound-color': SOUND_CATEGORIES[activeCategory]?.color || '#6366f1' }}
          >
            <Play size={14} />
            <span>{sound.name}</span>
          </button>
        ))}

        {/* Show custom sounds in their own section when not searching */}
        {!searchQuery && customSounds.length > 0 && activeCategory === 'combat' && (
          <>
            <div className="custom-sounds-divider">Custom Sounds</div>
            {customSounds.map(sound => (
              <button
                key={sound.id}
                className={`sound-btn custom ${playingSound === sound.id ? 'playing' : ''}`}
                onClick={() => playSound(sound)}
              >
                <Play size={14} />
                <span>{sound.name}</span>
                <button
                  className="delete-sound"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomSound(sound.id);
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Upload Custom Sound */}
      <div className="upload-section">
        <label className="upload-btn">
          <Upload size={14} />
          <span>Upload Sound</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* AI Generation Panel */}
      <div className="ai-section">
        <button
          className="ai-toggle"
          onClick={() => setShowAIPanel(!showAIPanel)}
        >
          <Wand2 size={14} />
          <span>AI Sound Generator</span>
          {showAIPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAIPanel && (
          <div className="ai-panel">
            <p className="ai-hint">
              Describe the sound you want to create:
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., 'A deep rumbling earthquake', 'Magical fairy chimes', 'Ominous dungeon whispers'"
              rows={2}
            />
            <button
              className="generate-btn"
              onClick={generateAISound}
              disabled={aiGenerating || !aiPrompt.trim()}
            >
              {aiGenerating ? (
                <>Generating...</>
              ) : (
                <><Wand2 size={14} /> Generate Sound</>
              )}
            </button>
            <p className="ai-note">
              Uses AI to create custom sound effects. Requires API configuration.
            </p>
          </div>
        )}
      </div>

      {/* Quick Music Themes */}
      <div className="music-section">
        <button
          className="music-toggle"
          onClick={() => setShowMusicPanel(!showMusicPanel)}
        >
          <Music size={14} />
          <span>Background Music</span>
          {showMusicPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showMusicPanel && (
          <div className="music-panel">
            <p className="music-hint">
              Background music themes (coming soon - will integrate with royalty-free music APIs)
            </p>
            <div className="music-themes">
              {MUSIC_THEMES.map(theme => {
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.id}
                    className={`music-theme-btn ${currentMusic === theme.id ? 'active' : ''}`}
                    style={{ '--theme-color': theme.color }}
                    onClick={() => {
                      alert(`${theme.name} music coming soon!`);
                    }}
                  >
                    <Icon size={16} />
                    <span>{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
