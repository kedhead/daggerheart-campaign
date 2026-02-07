import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2, VolumeX, Play, Pause, Square, Music, Swords, Sparkles,
  Trees, Castle, Skull, Heart, Upload, Wand2, Search, Trash2,
  ChevronDown, ChevronUp, Radio, Loader2, Download, RefreshCw, Gem
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { generateSoundEffect, generateBackgroundMusic, SOUND_PRESETS } from '../../services/audioGenerator';
import { MUSIC_LIBRARY, getTrackUrl, getTrackDisplayName } from '../../data/musicLibrary';
import './DMSoundboard.css';

// Background music themes
const MUSIC_THEMES = {
  battle: {
    name: 'Epic Battle',
    icon: Swords,
    color: '#ef4444',
    description: 'Intense combat music',
    prompt: 'epic intense battle, war drums, dramatic orchestral, fast-paced combat'
  },
  exploration: {
    name: 'Exploration',
    icon: Trees,
    color: '#22c55e',
    description: 'Calm adventure music',
    prompt: 'peaceful exploration, gentle adventure, nature sounds, wandering melody'
  },
  mystery: {
    name: 'Mystery',
    icon: Sparkles,
    color: '#8b5cf6',
    description: 'Suspenseful atmosphere',
    prompt: 'mysterious suspenseful, dark ambient, eerie investigation, haunting melody'
  },
  tavern: {
    name: 'Tavern',
    icon: Castle,
    color: '#f59e0b',
    description: 'Cheerful inn music',
    prompt: 'cheerful medieval tavern, festive lute and fiddle, merry celebration, folk music'
  },
  tension: {
    name: 'Tension',
    icon: Skull,
    color: '#64748b',
    description: 'Building dread',
    prompt: 'ominous tension building, dark brooding, approaching danger, suspenseful drone'
  },
  victory: {
    name: 'Victory',
    icon: Heart,
    color: '#ec4899',
    description: 'Triumphant fanfare',
    prompt: 'triumphant heroic victory, celebratory fanfare, uplifting orchestral, achievement'
  },
  mystical: {
    name: 'Mystical',
    icon: Gem,
    color: '#06b6d4',
    description: 'Arcane & ethereal',
    prompt: 'mystical ethereal, arcane energy, magical ambience, otherworldly fantasy'
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
  const [currentMusic, setCurrentMusic] = useState(null); // { themeKey, trackId, source: 'curated'|'ai' } or null
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
  const [generatingMusic, setGeneratingMusic] = useState(null);
  const [cachedMusic, setCachedMusic] = useState({});
  const [expandedTheme, setExpandedTheme] = useState(null);

  const effectsAudioRef = useRef(new Audio());
  const musicAudioRef = useRef(new Audio());

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

    const savedMusic = localStorage.getItem('dm_cached_music');
    if (savedMusic) {
      try {
        setCachedMusic(JSON.parse(savedMusic));
      } catch (e) {
        console.error('Failed to load cached music:', e);
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
    // Check if we have a cached version
    if (cachedSounds[sound.id]) {
      const played = await playAudioUrl(cachedSounds[sound.id], sound.name);
      if (played) return;
      // Cached URL expired/broken - clear it and regenerate
      console.warn('Cached sound expired, regenerating:', sound.id);
      clearCachedSound(sound.id);
    }

    setGeneratingSound(sound.id);

    try {
      const audioUrl = await generateSoundEffect(sound.prompt, null, {
        duration: sound.duration || 5,
        promptInfluence: 0.4
      });

      // Cache the generated sound
      saveCachedSound(sound.id, audioUrl);

      // Play the sound
      await playAudioUrl(audioUrl, sound.name);
    } catch (error) {
      console.error('Failed to generate sound:', error);
      alert(`Failed to generate sound: ${error.message}`);
    } finally {
      setGeneratingSound(null);
    }
  };

  // Play an audio URL - returns true if successful, false if failed
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
      return true;
    } catch (error) {
      console.error('Failed to play audio:', error);
      return false;
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

  // Play a curated track from the CDN
  const playCuratedTrack = async (themeKey, trackId) => {
    const music = musicAudioRef.current;

    // If this exact track is already playing, stop it
    if (currentMusic && currentMusic.source === 'curated' && currentMusic.trackId === trackId) {
      stopMusic();
      return;
    }

    const url = getTrackUrl(trackId);
    const displayName = getTrackDisplayName(trackId);
    const theme = MUSIC_THEMES[themeKey];

    music.src = url;
    music.volume = isMuted ? 0 : musicVolume / 100;
    music.loop = true;

    try {
      await music.play();
      setCurrentMusic({ themeKey, trackId, source: 'curated' });

      if (broadcastEnabled && campaignId) {
        broadcastAudioState({
          type: 'music',
          action: 'play',
          url,
          name: `${theme.name} - ${displayName}`,
          volume: musicVolume,
          loop: true
        });
      }
    } catch (error) {
      console.error('Failed to play curated track:', error);
    }
  };

  // Generate and play background music for a theme (AI)
  const generateAndPlayMusic = async (themeKey) => {
    const theme = MUSIC_THEMES[themeKey];
    if (!theme) return;

    // If AI music for this theme is already playing, stop it
    if (currentMusic && currentMusic.source === 'ai' && currentMusic.themeKey === themeKey) {
      stopMusic();
      return;
    }

    const music = musicAudioRef.current;

    // Check if we have a cached version
    if (cachedMusic[themeKey]) {
      music.src = cachedMusic[themeKey];
      music.volume = isMuted ? 0 : musicVolume / 100;
      music.loop = true;

      try {
        await music.play();
        setCurrentMusic({ themeKey, trackId: null, source: 'ai' });
        if (broadcastEnabled && campaignId) {
          broadcastAudioState({
            type: 'music',
            action: 'play',
            url: cachedMusic[themeKey],
            name: `${theme.name} (AI)`,
            volume: musicVolume,
            loop: true
          });
        }
        return;
      } catch (error) {
        // Cached URL expired, clear and regenerate
        console.warn('Cached music expired, regenerating:', themeKey);
        const updated = { ...cachedMusic };
        delete updated[themeKey];
        setCachedMusic(updated);
        localStorage.setItem('dm_cached_music', JSON.stringify(updated));
      }
    }

    // Generate new music
    setGeneratingMusic(themeKey);

    try {
      const audioUrl = await generateBackgroundMusic(theme.prompt, null, {
        duration: 30,
        promptInfluence: 0.5
      });

      // Cache it
      const updated = { ...cachedMusic, [themeKey]: audioUrl };
      setCachedMusic(updated);
      localStorage.setItem('dm_cached_music', JSON.stringify(updated));

      // Play it
      music.src = audioUrl;
      music.volume = isMuted ? 0 : musicVolume / 100;
      music.loop = true;
      await music.play();
      setCurrentMusic({ themeKey, trackId: null, source: 'ai' });

      if (broadcastEnabled && campaignId) {
        broadcastAudioState({
          type: 'music',
          action: 'play',
          url: audioUrl,
          name: `${theme.name} (AI)`,
          volume: musicVolume,
          loop: true
        });
      }
    } catch (error) {
      console.error('Failed to generate music:', error);
      alert(`Failed to generate music: ${error.message}`);
    } finally {
      setGeneratingMusic(null);
    }
  };

  // Stop background music
  const stopMusic = () => {
    musicAudioRef.current.pause();
    musicAudioRef.current.currentTime = 0;
    setCurrentMusic(null);

    if (broadcastEnabled && campaignId) {
      broadcastAudioState({ type: 'music', action: 'stop' });
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

    setAiGenerating(true);

    try {
      const audioUrl = await generateSoundEffect(aiPrompt, null, {
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

  // Get the "Now Playing" display string
  const getNowPlayingLabel = () => {
    if (!currentMusic) return null;
    const theme = MUSIC_THEMES[currentMusic.themeKey];
    if (currentMusic.source === 'curated') {
      return `${theme.name} - ${getTrackDisplayName(currentMusic.trackId)}`;
    }
    return `${theme.name} (AI Generated)`;
  };

  const filteredSounds = getFilteredSounds();

  return (
    <div className="dm-soundboard">
      {/* Header */}
      <div className="soundboard-header">
        <div className="soundboard-title">
          <Volume2 size={20} />
          <span>DM Soundboard</span>
          <span className="ai-badge">AI</span>
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
        {filteredSounds.map(sound => {
          const isGenerating = generatingSound === sound.id;
          const isCached = !!cachedSounds[sound.id];

          return (
            <button
              key={sound.id}
              className={`sound-btn ${playingSound === sound.name ? 'playing' : ''} ${isCached ? 'cached' : ''}`}
              onClick={() => generateAndPlaySound(sound)}
              disabled={isGenerating}
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
            {currentMusic && (
              <div className="music-now-playing">
                <Music size={14} className="pulse-icon" />
                <span>Now playing: {getNowPlayingLabel()}</span>
                <button className="stop-music-btn" onClick={stopMusic} title="Stop Music">
                  <Square size={12} />
                </button>
              </div>
            )}
            <div className="theme-accordion-list">
              {Object.entries(MUSIC_THEMES).map(([key, theme]) => {
                const Icon = theme.icon;
                const isExpanded = expandedTheme === key;
                const isThemePlaying = currentMusic && currentMusic.themeKey === key;
                const tracks = MUSIC_LIBRARY[key] || [];
                const isGenerating = generatingMusic === key;
                const isCached = !!cachedMusic[key];

                return (
                  <div key={key} className="theme-accordion">
                    <button
                      className={`theme-accordion-header ${isThemePlaying ? 'playing' : ''}`}
                      onClick={() => setExpandedTheme(isExpanded ? null : key)}
                      style={{ '--theme-color': theme.color }}
                    >
                      <Icon size={16} />
                      <div className="theme-info">
                        <span className="theme-name">{theme.name}</span>
                        <span className="theme-desc">
                          {theme.description} &middot; {tracks.length} tracks
                        </span>
                      </div>
                      {isThemePlaying && <span className="theme-playing-dot" />}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="theme-track-list">
                        {tracks.map(trackId => {
                          const isTrackPlaying = currentMusic
                            && currentMusic.source === 'curated'
                            && currentMusic.trackId === trackId;

                          return (
                            <button
                              key={trackId}
                              className={`track-btn ${isTrackPlaying ? 'playing' : ''}`}
                              onClick={() => playCuratedTrack(key, trackId)}
                              style={{ '--theme-color': theme.color }}
                            >
                              {isTrackPlaying ? <Pause size={12} /> : <Play size={12} />}
                              <span>{getTrackDisplayName(trackId)}</span>
                            </button>
                          );
                        })}

                        {/* AI Generate button at bottom of each theme */}
                        <button
                          className={`track-btn ai-generate-track ${currentMusic && currentMusic.source === 'ai' && currentMusic.themeKey === key ? 'playing' : ''} ${isCached ? 'cached' : ''}`}
                          onClick={() => generateAndPlayMusic(key)}
                          disabled={isGenerating}
                          style={{ '--theme-color': '#8b5cf6' }}
                        >
                          {isGenerating ? (
                            <Loader2 size={12} className="spinning" />
                          ) : (
                            <Wand2 size={12} />
                          )}
                          <span>{isGenerating ? 'Generating...' : 'AI Generate'}</span>
                          {isCached && !isGenerating && (
                            <button
                              className="refresh-cache-inline"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = { ...cachedMusic };
                                delete updated[key];
                                setCachedMusic(updated);
                                localStorage.setItem('dm_cached_music', JSON.stringify(updated));
                              }}
                              title="Regenerate AI music"
                            >
                              <RefreshCw size={10} />
                            </button>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="music-hint">
              Click a theme to browse curated tracks. Use "AI Generate" for custom music (~30s wait).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
