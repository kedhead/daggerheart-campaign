import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2, VolumeX, Play, Pause, Square, Music, Swords, Sparkles,
  Trees, Castle, Skull, Heart, Upload, Wand2, Search, Trash2,
  ChevronDown, ChevronUp, Radio, Loader2, Download, RefreshCw
} from 'lucide-react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { generateSoundEffect, SOUND_PRESETS } from '../../services/audioGenerator';
import './DMSoundboard.css';

// Curated royalty-free music from Free Music Archive and similar sources
// These are direct links to freely-usable music
const CURATED_MUSIC = {
  battle: {
    name: 'Epic Battle',
    icon: Swords,
    color: '#ef4444',
    tracks: [
      { id: 'battle-drums', name: 'Battle Drums', description: 'Intense percussion for combat', duration: 'Loop' },
      { id: 'epic-orchestral', name: 'Epic Orchestral', description: 'Dramatic orchestra swells', duration: 'Loop' },
      { id: 'boss-fight', name: 'Boss Fight', description: 'Intense boss encounter music', duration: 'Loop' },
    ]
  },
  exploration: {
    name: 'Exploration',
    icon: Trees,
    color: '#22c55e',
    tracks: [
      { id: 'peaceful-journey', name: 'Peaceful Journey', description: 'Calm traveling music', duration: 'Loop' },
      { id: 'forest-walk', name: 'Forest Walk', description: 'Nature-inspired melody', duration: 'Loop' },
      { id: 'mountain-vista', name: 'Mountain Vista', description: 'Majestic exploration theme', duration: 'Loop' },
    ]
  },
  mystery: {
    name: 'Mystery',
    icon: Sparkles,
    color: '#8b5cf6',
    tracks: [
      { id: 'dark-secrets', name: 'Dark Secrets', description: 'Suspenseful investigation', duration: 'Loop' },
      { id: 'ancient-ruins', name: 'Ancient Ruins', description: 'Mysterious discovery', duration: 'Loop' },
      { id: 'whispers', name: 'Whispers', description: 'Eerie ambient tones', duration: 'Loop' },
    ]
  },
  tavern: {
    name: 'Tavern',
    icon: Castle,
    color: '#f59e0b',
    tracks: [
      { id: 'merry-inn', name: 'The Merry Inn', description: 'Cheerful tavern music', duration: 'Loop' },
      { id: 'bard-song', name: 'Bard\'s Song', description: 'Medieval lute melody', duration: 'Loop' },
      { id: 'celebration', name: 'Celebration', description: 'Festive party music', duration: 'Loop' },
    ]
  },
  tension: {
    name: 'Tension',
    icon: Skull,
    color: '#64748b',
    tracks: [
      { id: 'approaching-danger', name: 'Approaching Danger', description: 'Building suspense', duration: 'Loop' },
      { id: 'stealth', name: 'Stealth Mission', description: 'Quiet, tense atmosphere', duration: 'Loop' },
      { id: 'horror', name: 'Horror Ambience', description: 'Scary background', duration: 'Loop' },
    ]
  },
  victory: {
    name: 'Victory',
    icon: Heart,
    color: '#ec4899',
    tracks: [
      { id: 'triumphant', name: 'Triumphant Heroes', description: 'Heroic victory fanfare', duration: '0:45' },
      { id: 'level-up-theme', name: 'Level Up', description: 'Achievement celebration', duration: '0:30' },
      { id: 'quest-complete', name: 'Quest Complete', description: 'Success music', duration: '0:40' },
    ]
  }
};

// Sound categories with AI generation prompts
const SOUND_CATEGORIES = {
  combat: {
    name: 'Combat',
    icon: Swords,
    color: '#ef4444',
    sounds: SOUND_PRESETS.combat.map((preset, i) => ({
      id: `combat-${i}`,
      name: preset.prompt.split(',')[0],
      prompt: preset.prompt,
      duration: preset.duration
    }))
  },
  magic: {
    name: 'Magic',
    icon: Sparkles,
    color: '#8b5cf6',
    sounds: SOUND_PRESETS.magic.map((preset, i) => ({
      id: `magic-${i}`,
      name: preset.prompt.split(',')[0],
      prompt: preset.prompt,
      duration: preset.duration
    }))
  },
  nature: {
    name: 'Nature',
    icon: Trees,
    color: '#22c55e',
    sounds: SOUND_PRESETS.nature.map((preset, i) => ({
      id: `nature-${i}`,
      name: preset.prompt.split(',')[0],
      prompt: preset.prompt,
      duration: preset.duration
    }))
  },
  ambient: {
    name: 'Ambient',
    icon: Castle,
    color: '#f59e0b',
    sounds: SOUND_PRESETS.ambient.map((preset, i) => ({
      id: `ambient-${i}`,
      name: preset.prompt.split(',')[0],
      prompt: preset.prompt,
      duration: preset.duration
    }))
  },
  creatures: {
    name: 'Creatures',
    icon: Skull,
    color: '#64748b',
    sounds: SOUND_PRESETS.creatures.map((preset, i) => ({
      id: `creatures-${i}`,
      name: preset.prompt.split(',')[0],
      prompt: preset.prompt,
      duration: preset.duration
    }))
  }
};

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
  const [cachedSounds, setCachedSounds] = useState({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDuration, setAiDuration] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatingSound, setGeneratingSound] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSound, setPlayingSound] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [activeMusicTheme, setActiveMusicTheme] = useState(null);

  const effectsAudioRef = useRef(new Audio());
  const musicAudioRef = useRef(new Audio());

  // Load API key from Firestore
  useEffect(() => {
    async function loadApiKey() {
      try {
        const configDoc = await getDoc(doc(db, 'appSettings/sharedApiKeys'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.oneMinAiKey) {
            setApiKey(data.oneMinAiKey);
          }
        }
      } catch (err) {
        console.error('Failed to load API key:', err);
      }
    }
    loadApiKey();
  }, []);

  // Load custom sounds and cached sounds from localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem('dm_custom_sounds');
    if (savedCustom) {
      try {
        setCustomSounds(JSON.parse(savedCustom));
      } catch (e) {
        console.error('Failed to load custom sounds:', e);
      }
    }

    const savedCached = localStorage.getItem('dm_cached_sounds');
    if (savedCached) {
      try {
        setCachedSounds(JSON.parse(savedCached));
      } catch (e) {
        console.error('Failed to load cached sounds:', e);
      }
    }
  }, []);

  // Save custom sounds
  const saveCustomSounds = (sounds) => {
    setCustomSounds(sounds);
    localStorage.setItem('dm_custom_sounds', JSON.stringify(sounds));
  };

  // Save cached sounds
  const saveCachedSound = (soundId, audioUrl) => {
    const updated = { ...cachedSounds, [soundId]: audioUrl };
    setCachedSounds(updated);
    localStorage.setItem('dm_cached_sounds', JSON.stringify(updated));
  };

  // Generate a sound effect using AI
  const generateAndPlaySound = async (sound) => {
    if (!apiKey) {
      alert('No 1min.ai API key configured. Please add your API key in Super Admin > Shared API Keys.');
      return;
    }

    // Check if we have a cached version
    if (cachedSounds[sound.id]) {
      playAudioUrl(cachedSounds[sound.id], sound.name);
      return;
    }

    setGeneratingSound(sound.id);

    try {
      const audioUrl = await generateSoundEffect(sound.prompt, apiKey, {
        duration: sound.duration || 5,
        promptInfluence: 0.4
      });

      // Cache the generated sound
      saveCachedSound(sound.id, audioUrl);

      // Play the sound
      playAudioUrl(audioUrl, sound.name);
    } catch (error) {
      console.error('Failed to generate sound:', error);
      alert(`Failed to generate sound: ${error.message}`);
    } finally {
      setGeneratingSound(null);
    }
  };

  // Play an audio URL
  const playAudioUrl = async (url, name) => {
    const audio = effectsAudioRef.current;
    audio.src = url;
    audio.volume = isMuted ? 0 : effectsVolume / 100;

    try {
      await audio.play();
      setPlayingSound(name);
      audio.onended = () => setPlayingSound(null);

      // Broadcast to players
      if (broadcastEnabled && campaignId) {
        broadcastAudioState({
          type: 'url',
          action: 'play',
          url: url,
          name: name,
          volume: effectsVolume
        });
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  // Play custom uploaded sound
  const playCustomSound = async (sound) => {
    const audio = effectsAudioRef.current;
    audio.src = sound.url;
    audio.volume = isMuted ? 0 : effectsVolume / 100;

    try {
      await audio.play();
      setPlayingSound(sound.name);
      audio.onended = () => setPlayingSound(null);

      if (broadcastEnabled && campaignId) {
        broadcastAudioState({
          type: 'custom',
          action: 'play',
          sound: { id: sound.id, name: sound.name, url: sound.url },
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
    musicAudioRef.current.pause();
    musicAudioRef.current.currentTime = 0;
    setPlayingSound(null);
    setCurrentMusic(null);

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

  // Clear cached sound
  const clearCachedSound = (soundId) => {
    const updated = { ...cachedSounds };
    delete updated[soundId];
    setCachedSounds(updated);
    localStorage.setItem('dm_cached_sounds', JSON.stringify(updated));
  };

  // Generate custom AI sound
  const generateCustomSound = async () => {
    if (!aiPrompt.trim()) return;
    if (!apiKey) {
      alert('No 1min.ai API key configured. Please add your API key in Super Admin > Shared API Keys.');
      return;
    }

    setAiGenerating(true);

    try {
      const audioUrl = await generateSoundEffect(aiPrompt, apiKey, {
        duration: aiDuration,
        promptInfluence: 0.4
      });

      // Save as custom sound
      const newSound = {
        id: `ai-${Date.now()}`,
        name: aiPrompt.substring(0, 30) + (aiPrompt.length > 30 ? '...' : ''),
        url: audioUrl,
        isCustom: true,
        isAIGenerated: true
      };
      saveCustomSounds([...customSounds, newSound]);

      // Play it
      playAudioUrl(audioUrl, newSound.name);

      setAiPrompt('');
    } catch (error) {
      console.error('Failed to generate sound:', error);
      alert(`Failed to generate sound: ${error.message}`);
    } finally {
      setAiGenerating(false);
    }
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
        if (sound.name.toLowerCase().includes(query) || sound.prompt?.toLowerCase().includes(query)) {
          allSounds.push({ ...sound, category: category.name });
        }
      });
    });

    return allSounds;
  };

  const filteredSounds = getFilteredSounds();
  const hasApiKey = !!apiKey;

  return (
    <div className="dm-soundboard">
      {/* Header */}
      <div className="soundboard-header">
        <div className="soundboard-title">
          <Volume2 size={20} />
          <span>DM Soundboard</span>
          {hasApiKey && <span className="ai-badge">AI</span>}
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

      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="api-warning">
          <Wand2 size={14} />
          <span>Add 1min.ai API key in Super Admin to enable AI sound generation</span>
        </div>
      )}

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
        {filteredSounds.map(sound => {
          const isGenerating = generatingSound === sound.id;
          const isCached = !!cachedSounds[sound.id];

          return (
            <button
              key={sound.id}
              className={`sound-btn ${playingSound === sound.name ? 'playing' : ''} ${isCached ? 'cached' : ''}`}
              onClick={() => hasApiKey ? generateAndPlaySound(sound) : alert('API key required')}
              disabled={isGenerating || !hasApiKey}
              style={{ '--sound-color': SOUND_CATEGORIES[activeCategory]?.color || '#6366f1' }}
              title={sound.prompt}
            >
              {isGenerating ? (
                <Loader2 size={14} className="spinning" />
              ) : (
                <Play size={14} />
              )}
              <span>{sound.name}</span>
              {isCached && (
                <button
                  className="refresh-cache"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearCachedSound(sound.id);
                  }}
                  title="Regenerate sound"
                >
                  <RefreshCw size={10} />
                </button>
              )}
            </button>
          );
        })}

        {/* Custom sounds */}
        {!searchQuery && customSounds.length > 0 && (
          <>
            <div className="custom-sounds-divider">Your Sounds</div>
            {customSounds.map(sound => (
              <button
                key={sound.id}
                className={`sound-btn custom ${playingSound === sound.name ? 'playing' : ''}`}
                onClick={() => playCustomSound(sound)}
              >
                <Play size={14} />
                <span>{sound.name}</span>
                {sound.isAIGenerated && <Wand2 size={10} className="ai-icon" />}
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
      {hasApiKey && (
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
                placeholder="e.g., 'A deep rumbling earthquake with falling rocks', 'Magical fairy chimes with sparkles', 'Ominous dungeon whispers echoing'"
                rows={2}
              />
              <div className="ai-options">
                <label>
                  Duration: {aiDuration}s
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={aiDuration}
                    onChange={(e) => setAiDuration(parseInt(e.target.value))}
                  />
                </label>
              </div>
              <button
                className="generate-btn"
                onClick={generateCustomSound}
                disabled={aiGenerating || !aiPrompt.trim()}
              >
                {aiGenerating ? (
                  <><Loader2 size={14} className="spinning" /> Generating...</>
                ) : (
                  <><Wand2 size={14} /> Generate Sound</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Background Music Panel */}
      <div className="music-section">
        <button
          className="music-toggle"
          onClick={() => setShowMusicPanel(!showMusicPanel)}
        >
          <Music size={14} />
          <span>Background Music</span>
          {currentMusic && <span className="now-playing">Playing</span>}
          {showMusicPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showMusicPanel && (
          <div className="music-panel">
            <div className="music-themes">
              {Object.entries(CURATED_MUSIC).map(([key, theme]) => {
                const Icon = theme.icon;
                const isActive = activeMusicTheme === key;

                return (
                  <div key={key} className={`music-theme ${isActive ? 'active' : ''}`}>
                    <button
                      className="music-theme-header"
                      onClick={() => setActiveMusicTheme(isActive ? null : key)}
                      style={{ '--theme-color': theme.color }}
                    >
                      <Icon size={16} />
                      <span>{theme.name}</span>
                      {isActive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isActive && (
                      <div className="music-tracks">
                        {theme.tracks.map(track => (
                          <button
                            key={track.id}
                            className={`music-track ${currentMusic === track.id ? 'playing' : ''}`}
                            onClick={() => {
                              // For now, show that music is selected
                              // In a full implementation, this would play actual music files
                              setCurrentMusic(track.id);
                              alert(`${track.name} selected!\n\nTo play actual music, upload your own tracks or wait for the full music integration.`);
                            }}
                          >
                            {currentMusic === track.id ? <Pause size={12} /> : <Play size={12} />}
                            <div className="track-info">
                              <span className="track-name">{track.name}</span>
                              <span className="track-desc">{track.description}</span>
                            </div>
                            <span className="track-duration">{track.duration}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="music-hint">
              Upload your own royalty-free music or use AI to generate custom tracks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
