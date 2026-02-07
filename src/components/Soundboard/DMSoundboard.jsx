import { useState, useEffect, useRef } from 'react';
import {
  Volume2, VolumeX, Play, Pause, Square, Music, Swords, Sparkles,
  CloudRain, Trees, Castle, Flame, Wind, Skull, Heart, Upload,
  Wand2, Search, Plus, Trash2, ChevronDown, ChevronUp, Radio
} from 'lucide-react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './DMSoundboard.css';

// Free sound effect URLs from Pixabay (CC0 license, CORS-friendly)
// Note: These are direct MP3 links that work in browsers
const SOUND_CATEGORIES = {
  combat: {
    name: 'Combat',
    icon: Swords,
    color: '#ef4444',
    sounds: [
      { id: 'sword-clash', name: 'Sword Clash', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9d5a7e.mp3' },
      { id: 'sword-swing', name: 'Sword Swing', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_e984e63e19.mp3' },
      { id: 'arrow-hit', name: 'Arrow Hit', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3' },
      { id: 'punch', name: 'Punch Hit', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_6ed65c5d45.mp3' },
      { id: 'explosion', name: 'Explosion', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_dc39bba008.mp3' },
      { id: 'scream', name: 'Battle Scream', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3' },
    ]
  },
  magic: {
    name: 'Magic',
    icon: Sparkles,
    color: '#8b5cf6',
    sounds: [
      { id: 'spell-cast', name: 'Spell Cast', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb749a945.mp3' },
      { id: 'magic-whoosh', name: 'Magic Whoosh', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_c518b18b99.mp3' },
      { id: 'power-up', name: 'Power Up', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3' },
      { id: 'heal', name: 'Healing', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb749a945.mp3' },
      { id: 'teleport', name: 'Teleport', url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_a6de6cc1af.mp3' },
      { id: 'electric', name: 'Electric Zap', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_c6ccf3232f.mp3' },
    ]
  },
  nature: {
    name: 'Nature',
    icon: Trees,
    color: '#22c55e',
    sounds: [
      { id: 'rain', name: 'Rain', url: 'https://cdn.pixabay.com/audio/2022/05/16/audio_1808fbf07a.mp3', loop: true },
      { id: 'thunder', name: 'Thunder', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_a6d2c0aa6f.mp3' },
      { id: 'wind', name: 'Wind', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c25d4c51.mp3', loop: true },
      { id: 'forest', name: 'Forest Birds', url: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3', loop: true },
      { id: 'ocean', name: 'Ocean Waves', url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3', loop: true },
      { id: 'fire-crackle', name: 'Fire Crackle', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc39a71a9a.mp3', loop: true },
    ]
  },
  ambient: {
    name: 'Ambient',
    icon: Castle,
    color: '#f59e0b',
    sounds: [
      { id: 'crowd', name: 'Crowd Chatter', url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_a7f547c518.mp3', loop: true },
      { id: 'church-bell', name: 'Church Bell', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_48d6c9a6d4.mp3' },
      { id: 'clock-tick', name: 'Clock Tick', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_ea4098d11e.mp3', loop: true },
      { id: 'footsteps', name: 'Footsteps', url: 'https://cdn.pixabay.com/audio/2022/03/19/audio_b4268d9ec5.mp3' },
      { id: 'door-creak', name: 'Door Creak', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_82faad216d.mp3' },
      { id: 'heartbeat', name: 'Heartbeat', url: 'https://cdn.pixabay.com/audio/2022/07/25/audio_3c48e2b0de.mp3', loop: true },
    ]
  },
  creatures: {
    name: 'Creatures',
    icon: Skull,
    color: '#64748b',
    sounds: [
      { id: 'wolf-howl', name: 'Wolf Howl', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_6dfaf42e82.mp3' },
      { id: 'crow', name: 'Crow Caw', url: 'https://cdn.pixabay.com/audio/2022/03/09/audio_3d13c970bd.mp3' },
      { id: 'horse', name: 'Horse Whinny', url: 'https://cdn.pixabay.com/audio/2022/03/17/audio_86f37f3e3c.mp3' },
      { id: 'dog-bark', name: 'Dog Bark', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_e8ff6e7a39.mp3' },
      { id: 'owl', name: 'Owl Hoot', url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_946dd47ed9.mp3' },
      { id: 'monster', name: 'Monster Growl', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_f60bcf93d4.mp3' },
    ]
  },
  ui: {
    name: 'Game UI',
    icon: Heart,
    color: '#ec4899',
    sounds: [
      { id: 'level-up', name: 'Level Up', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3' },
      { id: 'coin', name: 'Coin Collect', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_29af4db75e.mp3' },
      { id: 'notification', name: 'Notification', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_88d527c77f.mp3' },
      { id: 'success', name: 'Success', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_c6ccf3232f.mp3' },
      { id: 'fail', name: 'Failure', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_06b25e6384.mp3' },
      { id: 'click', name: 'UI Click', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3' },
    ]
  }
};

// Background music themes
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
  const [currentAmbient, setCurrentAmbient] = useState(null);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);
  const [customSounds, setCustomSounds] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const effectsAudioRef = useRef(new Audio());
  const ambientAudioRef = useRef(new Audio());
  const musicAudioRef = useRef(new Audio());

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

  // Update volumes
  useEffect(() => {
    const vol = isMuted ? 0 : effectsVolume / 100;
    effectsAudioRef.current.volume = vol;
    ambientAudioRef.current.volume = vol;
    musicAudioRef.current.volume = isMuted ? 0 : musicVolume / 100;
  }, [effectsVolume, musicVolume, isMuted]);

  // Play a sound effect
  const playSound = async (sound) => {
    const audio = sound.loop ? ambientAudioRef.current : effectsAudioRef.current;

    if (sound.loop && currentAmbient === sound.id) {
      // Stop current ambient
      audio.pause();
      audio.currentTime = 0;
      setCurrentAmbient(null);
      broadcastAudioState({ type: 'ambient', action: 'stop' });
      return;
    }

    audio.src = sound.url;
    audio.loop = sound.loop || false;
    audio.volume = isMuted ? 0 : effectsVolume / 100;

    try {
      await audio.play();
      if (sound.loop) {
        setCurrentAmbient(sound.id);
      }

      // Broadcast to players
      if (broadcastEnabled && campaignId) {
        broadcastAudioState({
          type: sound.loop ? 'ambient' : 'effect',
          action: 'play',
          sound: {
            id: sound.id,
            name: sound.name,
            url: sound.url,
            loop: sound.loop
          },
          volume: effectsVolume
        });
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  // Stop all audio
  const stopAll = () => {
    effectsAudioRef.current.pause();
    effectsAudioRef.current.currentTime = 0;
    ambientAudioRef.current.pause();
    ambientAudioRef.current.currentTime = 0;
    musicAudioRef.current.pause();
    musicAudioRef.current.currentTime = 0;
    setCurrentAmbient(null);
    setIsPlaying(false);

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

  // AI sound generation (placeholder - would need actual API)
  const generateAISound = async () => {
    if (!aiPrompt.trim()) return;

    setAiGenerating(true);
    // TODO: Integrate with ElevenLabs or similar API for sound generation
    // For now, show a placeholder message
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

  const CategoryIcon = SOUND_CATEGORIES[activeCategory]?.icon || Swords;
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
            className={`sound-btn ${currentAmbient === sound.id ? 'playing' : ''} ${sound.loop ? 'loopable' : ''}`}
            onClick={() => playSound(sound)}
            style={{ '--sound-color': SOUND_CATEGORIES[activeCategory]?.color || '#6366f1' }}
          >
            {sound.loop && currentAmbient === sound.id ? <Pause size={14} /> : <Play size={14} />}
            <span>{sound.name}</span>
            {sound.loop && <span className="loop-badge">Loop</span>}
          </button>
        ))}

        {/* Show custom sounds in their own section when not searching */}
        {!searchQuery && customSounds.length > 0 && activeCategory === 'combat' && (
          <>
            <div className="custom-sounds-divider">Custom Sounds</div>
            {customSounds.map(sound => (
              <button
                key={sound.id}
                className="sound-btn custom"
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
                      // TODO: Play music from API
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
