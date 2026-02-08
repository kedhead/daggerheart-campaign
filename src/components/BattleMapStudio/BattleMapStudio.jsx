import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  FolderOpen,
  Plus,
  Monitor,
  Upload,
  Wand2,
  Layers,
  ExternalLink,
  Radio,
  Sparkles,
  Grid,
  Route,
  Package,
  Boxes,
  Volume2
} from 'lucide-react';
import { useBattleMapStore } from '../../stores/battleMapStore';
import { useBattleMap } from '../../hooks/useBattleMap';
import MapCanvas from './Canvas/MapCanvas';
import CanvasToolbar from './Toolbar/CanvasToolbar';
import ZoomControls from './Toolbar/ZoomControls';
import LayerControls from './Toolbar/LayerControls';
import AssetLibrary from './Panels/AssetLibrary';
import MapImporter from './Panels/MapImporter';
import GridCalibrator from './Panels/GridCalibrator';
import MapBrowser from './Panels/MapBrowser';
import AIMapGenerator from './Panels/AIMapGenerator';
import AIAssetGenerator from './Panels/AIAssetGenerator';
import AIAssetPackGenerator from './Panels/AIAssetPackGenerator';
import AnimationControls from './Panels/AnimationControls';
import TileLibrary from './Panels/TileLibrary';
import OverlayLibrary from './Panels/OverlayLibrary';
import AssetPackImporter from './Panels/AssetPackImporter';
import DMSoundboard from '../Soundboard/DMSoundboard';
import './BattleMapStudio.css';

export default function BattleMapStudio({ campaign, isDM }) {
  const campaignId = campaign?.id;
  const [activePanel, setActivePanel] = useState('assets'); // 'assets' | 'ai-assets' | 'maps' | 'grid'
  const [canvasMode, setCanvasMode] = useState('import'); // 'import' | 'ai-generate'
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [isLive, setIsLive] = useState(false); // Live broadcast mode
  const [showSoundboard, setShowSoundboard] = useState(false); // Soundboard modal
  const containerRef = useRef(null);
  const lastBroadcastRef = useRef(null); // Track last broadcast to debounce

  const {
    mapId,
    mapName,
    mapImage,
    tokens,
    fogRevealed,
    gridSize,
    gridVisible,
    gridColor,
    fogEnabled,
    isDirty,
    setMapName,
    resetMap,
    loadMapState,
    getSerializableState,
    markClean
  } = useBattleMapStore();

  const {
    savedMaps,
    loading: mapsLoading,
    saveMap,
    loadMap,
    deleteMap,
    broadcastToPlayers
  } = useBattleMap(campaignId);

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        useBattleMapStore.getState().setStageSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-broadcast when live mode is enabled and map state changes
  useEffect(() => {
    if (!isLive || !mapImage) return;

    // Debounce broadcasts to avoid overwhelming Firestore
    const timeoutId = setTimeout(() => {
      broadcastToPlayers();
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [isLive, mapImage, tokens, fogRevealed, gridSize, gridVisible, gridColor, fogEnabled, broadcastToPlayers]);

  // Save current map
  const handleSave = async () => {
    const state = getSerializableState();
    await saveMap(mapId, state);
    markClean();
  };

  // Create new map
  const handleNewMap = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Create a new map anyway?')) {
        return;
      }
    }
    resetMap();
  };

  // Load a saved map
  const handleLoadMap = async (selectedMapId) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Load a different map anyway?')) {
        return;
      }
    }
    const mapData = await loadMap(selectedMapId);
    if (mapData) {
      loadMapState({
        mapId: selectedMapId,
        ...mapData
      });
    }
    setActivePanel('assets');
  };

  // Delete a map
  const handleDeleteMap = async (mapIdToDelete) => {
    if (confirm('Are you sure you want to delete this map?')) {
      await deleteMap(mapIdToDelete);
      if (mapId === mapIdToDelete) {
        resetMap();
      }
    }
  };

  // Broadcast to players
  const handleBroadcast = async () => {
    await broadcastToPlayers();
    setShowBroadcastConfirm(true);
    setTimeout(() => setShowBroadcastConfirm(false), 2000);
  };

  // Open battle map display in new window (for second monitor)
  const openBattleMapDisplay = useCallback(() => {
    const displayUrl = `${window.location.origin}?view=battleMapDisplay&campaign=${campaignId}`;
    window.open(
      displayUrl,
      'BattleMapDisplay',
      'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no'
    );
  }, [campaignId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'n':
            e.preventDefault();
            handleNewMap();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, mapId]);

  if (!isDM) {
    return (
      <div className="battle-map-studio">
        <div className="view-header">
          <div>
            <h2>Battle Map Studio</h2>
            <p className="view-subtitle">This feature is only available to DMs</p>
          </div>
        </div>
      </div>
    );
  }

  // Render canvas content based on mode
  const renderCanvasContent = () => {
    if (mapImage) {
      return <MapCanvas />;
    }

    if (canvasMode === 'ai-generate') {
      return (
        <div className="canvas-mode-panel">
          <AIMapGenerator campaignId={campaignId} />
        </div>
      );
    }

    return <MapImporter />;
  };

  return (
    <div className="battle-map-studio">
      {/* Header */}
      <div className="studio-header">
        <div className="studio-title-area">
          <h2>Battle Map Studio</h2>
          <input
            type="text"
            className="map-name-input"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder="Map name..."
          />
          {isDirty && <span className="unsaved-indicator">Unsaved changes</span>}
        </div>
        <div className="studio-actions">
          <button className="btn btn-secondary" onClick={handleNewMap} title="New Map (Ctrl+N)">
            <Plus size={18} />
            New
          </button>
          <button className="btn btn-secondary" onClick={() => setActivePanel('maps')} title="Open Map">
            <FolderOpen size={18} />
            Open
          </button>
          <button className="btn btn-primary" onClick={handleSave} title="Save Map (Ctrl+S)">
            <Save size={18} />
            Save
          </button>
          <button
            className={`btn ${isLive ? 'btn-live active' : 'btn-secondary'}`}
            onClick={() => setIsLive(!isLive)}
            title={isLive ? 'Stop Live Broadcast' : 'Start Live Broadcast'}
          >
            <Radio size={18} />
            {isLive ? 'Live' : 'Go Live'}
          </button>
          <button className="btn btn-primary broadcast-btn" onClick={handleBroadcast} title="Broadcast to Battle Map Display" disabled={isLive}>
            <Monitor size={18} />
            Broadcast
            {showBroadcastConfirm && <span className="broadcast-confirm">Sent!</span>}
          </button>
          <button className="btn btn-secondary" onClick={openBattleMapDisplay} title="Open Battle Map Display Window">
            <ExternalLink size={18} />
            Open Display
          </button>
          <button
            className={`btn ${showSoundboard ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowSoundboard(!showSoundboard)}
            title="Toggle Soundboard"
          >
            <Volume2 size={18} />
            Sounds
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="studio-workspace">
        {/* Left toolbar */}
        <div className="studio-toolbar">
          <CanvasToolbar campaignId={campaignId} />
          <div className="toolbar-divider" />
          <ZoomControls />
          <div className="toolbar-divider" />
          <LayerControls />
        </div>

        {/* Canvas area */}
        <div className="studio-canvas-area">
          {/* Mode selector - only show when no map loaded */}
          {!mapImage && (
            <div className="canvas-mode-selector">
              <button
                className={`mode-btn ${canvasMode === 'import' ? 'active' : ''}`}
                onClick={() => setCanvasMode('import')}
              >
                <Upload size={18} />
                Import Map
              </button>
              <button
                className={`mode-btn ${canvasMode === 'ai-generate' ? 'active' : ''}`}
                onClick={() => setCanvasMode('ai-generate')}
              >
                <Wand2 size={18} />
                AI Generate
              </button>
            </div>
          )}
          <div className="studio-canvas-container" ref={containerRef}>
            {renderCanvasContent()}
          </div>
        </div>

        {/* Right panel */}
        <div className="studio-panel">
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activePanel === 'assets' ? 'active' : ''}`}
              onClick={() => setActivePanel('assets')}
              title="Token Library"
            >
              <Layers size={14} />
              Tokens
            </button>
            <button
              className={`panel-tab ${activePanel === 'tiles' ? 'active' : ''}`}
              onClick={() => setActivePanel('tiles')}
              title="Map Tiles"
            >
              <Grid size={14} />
              Tiles
            </button>
            <button
              className={`panel-tab ${activePanel === 'overlays' ? 'active' : ''}`}
              onClick={() => setActivePanel('overlays')}
              title="Overlay Tiles (Roads, Rivers)"
            >
              <Route size={14} />
              Overlays
            </button>
            <button
              className={`panel-tab ${activePanel === 'import' ? 'active' : ''}`}
              onClick={() => setActivePanel('import')}
              title="Import Asset Packs"
            >
              <Package size={14} />
              Import
            </button>
            <button
              className={`panel-tab ${activePanel === 'ai-assets' ? 'active' : ''}`}
              onClick={() => setActivePanel('ai-assets')}
              title="AI Asset Generator"
            >
              <Wand2 size={14} />
              AI
            </button>
            <button
              className={`panel-tab ${activePanel === 'ai-packs' ? 'active' : ''}`}
              onClick={() => setActivePanel('ai-packs')}
              title="AI Asset Pack Generator"
            >
              <Boxes size={14} />
              Packs
            </button>
            <button
              className={`panel-tab ${activePanel === 'grid' ? 'active' : ''}`}
              onClick={() => setActivePanel('grid')}
              title="Grid Settings"
            >
              Grid
            </button>
            <button
              className={`panel-tab ${activePanel === 'animate' ? 'active' : ''}`}
              onClick={() => setActivePanel('animate')}
              title="Map Animations"
            >
              <Sparkles size={14} />
              FX
            </button>
            <button
              className={`panel-tab ${activePanel === 'maps' ? 'active' : ''}`}
              onClick={() => setActivePanel('maps')}
              title="Saved Maps"
            >
              Maps
            </button>
          </div>
          <div className="panel-content">
            {activePanel === 'assets' && (
              <AssetLibrary campaignId={campaignId} />
            )}
            {activePanel === 'tiles' && (
              <TileLibrary />
            )}
            {activePanel === 'overlays' && (
              <OverlayLibrary />
            )}
            {activePanel === 'import' && (
              <AssetPackImporter campaignId={campaignId} />
            )}
            {activePanel === 'ai-assets' && (
              <AIAssetGenerator campaignId={campaignId} />
            )}
            {activePanel === 'ai-packs' && (
              <AIAssetPackGenerator campaignId={campaignId} />
            )}
            {activePanel === 'grid' && (
              <GridCalibrator />
            )}
            {activePanel === 'animate' && (
              <AnimationControls />
            )}
            {activePanel === 'maps' && (
              <MapBrowser
                maps={savedMaps}
                loading={mapsLoading}
                currentMapId={mapId}
                onLoadMap={handleLoadMap}
                onDeleteMap={handleDeleteMap}
              />
            )}
          </div>
        </div>
      </div>

      {/* Soundboard Modal */}
      {showSoundboard && (
        <div className="soundboard-modal-overlay" onClick={() => setShowSoundboard(false)}>
          <div className="soundboard-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="soundboard-modal-header">
              <h3>Soundboard</h3>
              <button className="btn btn-icon" onClick={() => setShowSoundboard(false)} title="Close">
                ✕
              </button>
            </div>
            <div className="soundboard-modal-body">
              <DMSoundboard campaignId={campaignId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
