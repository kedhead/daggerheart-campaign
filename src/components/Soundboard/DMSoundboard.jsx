import { useState, useEffect, useRef } from 'react';
import {
  Volume2, VolumeX, Play, Pause, Square, Music, Swords, Sparkles,
  CloudRain, Trees, Castle, Flame, Wind, Skull, Heart, Upload,
  Wand2, Search, Plus, Trash2, ChevronDown, ChevronUp, Radio
} from 'lucide-react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './DMSoundboard.css';

// Free sound effect URLs (using freesound.org and other royalty-free sources)
const SOUND_CATEGORIES = {
  combat: {
    name: 'Combat',
    icon: Swords,
    color: '#ef4444',
    sounds: [
      { id: 'sword-clash', name: 'Sword Clash', url: 'https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3' },
      { id: 'sword-swing', name: 'Sword Swing', url: 'https://cdn.freesound.org/previews/588/588383_7724675-lq.mp3' },
      { id: 'arrow-fire', name: 'Arrow Fire', url: 'https://cdn.freesound.org/previews/321/321105_5488813-lq.mp3' },
      { id: 'shield-block', name: 'Shield Block', url: 'https://cdn.freesound.org/previews/319/319590_5436764-lq.mp3' },
      { id: 'punch', name: 'Punch Hit', url: 'https://cdn.freesound.org/previews/118/118513_2136023-lq.mp3' },
      { id: 'battle-cry', name: 'Battle Cry', url: 'https://cdn.freesound.org/previews/156/156031_2538033-lq.mp3' },
    ]
  },
  magic: {
    name: 'Magic',
    icon: Sparkles,
    color: '#8b5cf6',
    sounds: [
      { id: 'spell-cast', name: 'Spell Cast', url: 'https://cdn.freesound.org/previews/219/219566_4082826-lq.mp3' },
      { id: 'magic-hit', name: 'Magic Hit', url: 'https://cdn.freesound.org/previews/249/249300_3756348-lq.mp3' },
      { id: 'fireball', name: 'Fireball', url: 'https://cdn.freesound.org/previews/156/156031_2538033-lq.mp3' },
      { id: 'heal', name: 'Healing', url: 'https://cdn.freesound.org/previews/220/220173_1676145-lq.mp3' },
      { id: 'portal', name: 'Portal Open', url: 'https://cdn.freesound.org/previews/220/220184_1676145-lq.mp3' },
      { id: 'thunder-spell', name: 'Thunder Spell', url: 'https://cdn.freesound.org/previews/368/368691_4939433-lq.mp3' },
    ]
  },
  nature: {
    name: 'Nature',
    icon: Trees,
    color: '#22c55e',
    sounds: [
      { id: 'rain', name: 'Rain', url: 'https://cdn.freesound.org/previews/531/531947_6891782-lq.mp3', loop: true },
      { id: 'thunder', name: 'Thunder', url: 'https://cdn.freesound.org/previews/368/368691_4939433-lq.mp3' },
      { id: 'wind', name: 'Wind', url: 'https://cdn.freesound.org/previews/244/244944_4284968-lq.mp3', loop: true },
      { id: 'forest', name: 'Forest Ambience', url: 'https://cdn.freesound.org/previews/462/462087_9497060-lq.mp3', loop: true },
      { id: 'ocean', name: 'Ocean Waves', url: 'https://cdn.freesound.org/previews/527/527409_2074966-lq.mp3', loop: true },
      { id: 'fire-crackle', name: 'Fire Crackle', url: 'https://cdn.freesound.org/previews/346/346228_6267717-lq.mp3', loop: true },
    ]
  },
  ambient: {
    name: 'Ambient',
    icon: Castle,
    color: '#f59e0b',
    sounds: [
      { id: 'tavern', name: 'Tavern', url: 'https://cdn.freesound.org/previews/462/462405_7874866-lq.mp3', loop: true },
      { id: 'dungeon', name: 'Dungeon Drips', url: 'https://cdn.freesound.org/previews/467/467550_6565828-lq.mp3', loop: true },
      { id: 'city', name: 'City Streets', url: 'https://cdn.freesound.org/previews/571/571063_7037-lq.mp3', loop: true },
      { id: 'cave', name: 'Cave Echo', url: 'https://cdn.freesound.org/previews/352/352651_6549369-lq.mp3', loop: true },
      { id: 'crowd', name: 'Crowd Murmur', url: 'https://cdn.freesound.org/previews/398/398032_3429025-lq.mp3', loop: true },
      { id: 'creepy', name: 'Creepy Ambience', url: 'https://cdn.freesound.org/previews/474/474519_6891782-lq.mp3', loop: true },
    ]
  },
  creatures: {
    name: 'Creatures',
    icon: Skull,
    color: '#64748b',
    sounds: [
      { id: 'dragon-roar', name: 'Dragon Roar', url: 'https://cdn.freesound.org/previews/275/275154_5123451-lq.mp3' },
      { id: 'wolf-howl', name: 'Wolf Howl', url: 'https://cdn.freesound.org/previews/398/398032_3429025-lq.mp3' },
      { id: 'monster-growl', name: 'Monster Growl', url: 'https://cdn.freesound.org/previews/431/431174_8904933-lq.mp3' },
      { id: 'ghost-wail', name: 'Ghost Wail', url: 'https://cdn.freesound.org/previews/368/368692_4939433-lq.mp3' },
      { id: 'goblin-laugh', name: 'Goblin Laugh', url: 'https://cdn.freesound.org/previews/183/183635_3411227-lq.mp3' },
      { id: 'horse-neigh', name: 'Horse Neigh', url: 'https://cdn.freesound.org/previews/322/322889_5508598-lq.mp3' },
    ]
  },
  ui: {
    name: 'Game UI',
    icon: Heart,
    color: '#ec4899',
    sounds: [
      { id: 'level-up', name: 'Level Up', url: 'https://cdn.freesound.org/previews/270/270404_5123451-lq.mp3' },
      { id: 'coin', name: 'Coin Drop', url: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3' },
      { id: 'door-open', name: 'Door Open', url: 'https://cdn.freesound.org/previews/411/411461_5121236-lq.mp3' },
      { id: 'chest-open', name: 'Chest Open', url: 'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3' },
      { id: 'success', name: 'Success Fanfare', url: 'https://cdn.freesound.org/previews/270/270528_5123451-lq.mp3' },
      { id: 'fail', name: 'Failure Sound', url: 'https://cdn.freesound.org/previews/277/277021_5386447-lq.mp3' },
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
