import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  Undo,
  Redo,
  Monitor
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
import './BattleMapStudio.css';

export default function BattleMapStudio({ campaign, isDM }) {
  const campaignId = campaign?.id;
  const [activePanel, setActivePanel] = useState('assets'); // 'assets' | 'maps' | 'grid' | null
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const containerRef = useRef(null);

  const {
    mapId,
    mapName,
    mapImage,
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
          <button className="btn btn-primary broadcast-btn" onClick={handleBroadcast} title="Broadcast to Player Display">
            <Monitor size={18} />
            Broadcast
            {showBroadcastConfirm && <span className="broadcast-confirm">Sent!</span>}
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="studio-workspace">
        {/* Left toolbar */}
        <div className="studio-toolbar">
          <CanvasToolbar />
          <div className="toolbar-divider" />
          <ZoomControls />
          <div className="toolbar-divider" />
          <LayerControls />
        </div>

        {/* Canvas area */}
        <div className="studio-canvas-container" ref={containerRef}>
          {!mapImage ? (
            <MapImporter />
          ) : (
            <MapCanvas />
          )}
        </div>

        {/* Right panel */}
        <div className="studio-panel">
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activePanel === 'assets' ? 'active' : ''}`}
              onClick={() => setActivePanel('assets')}
            >
              Assets
            </button>
            <button
              className={`panel-tab ${activePanel === 'grid' ? 'active' : ''}`}
              onClick={() => setActivePanel('grid')}
            >
              Grid
            </button>
            <button
              className={`panel-tab ${activePanel === 'maps' ? 'active' : ''}`}
              onClick={() => setActivePanel('maps')}
            >
              Maps
            </button>
          </div>
          <div className="panel-content">
            {activePanel === 'assets' && (
              <AssetLibrary campaignId={campaignId} />
            )}
            {activePanel === 'grid' && (
              <GridCalibrator />
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
    </div>
  );
}
