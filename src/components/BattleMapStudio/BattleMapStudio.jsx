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
  Volume2,
  X
} from 'lucide-react';
import { useBattleMapStore } from '../../stores/battleMapStore';
import { useBattleMap } from '../../hooks/useBattleMap';
import CanvasLayers from './Canvas/MapCanvas'; // Using existing MapCanvas component
import FloatingToolbar from './Toolbar/FloatingToolbar';
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
      <div className="flex flex-col items-center justify-center p-8 text-center h-full text-zinc-400">
        <h2 className="text-xl font-bold mb-2">Battle Map Studio</h2>
        <p>This feature is only available to DMs</p>
      </div>
    );
  }

  // Render canvas content based on mode
  const renderCanvasContent = () => {
    if (mapImage) {
      return <CanvasLayers />;
    }

    if (canvasMode === 'ai-generate') {
      return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <button
            onClick={() => setCanvasMode('import')}
            className="absolute top-8 left-8 z-50 p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-2"
          >
            <X size={16} />
            <span className="text-sm">Cancel</span>
          </button>
          <div className="w-full max-w-lg p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl h-[90%] overflow-y-auto relative z-10">
            <AIMapGenerator campaignId={campaignId} />
          </div>
        </div>
      );
    }

    // 'importing' mode or fallback: show the MapImporter
    return <MapImporter />;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Battle Map Studio</h2>
          <div className="h-6 w-px bg-zinc-800" />
          <input
            type="text"
            className="bg-transparent border-none text-zinc-300 placeholder-zinc-600 focus:ring-0 text-sm w-48 hover:bg-zinc-800/50 rounded px-2 py-1 transition-colors"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder="Map name..."
          />
          {isDirty && <span className="text-amber-500 text-xs font-medium px-2 py-0.5 bg-amber-500/10 rounded-full">Unsaved</span>}
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" onClick={handleNewMap} title="New Map (Ctrl+N)">
            <Plus size={18} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" onClick={() => setActivePanel('maps')} title="Open Map">
            <FolderOpen size={18} />
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2" onClick={handleSave} title="Save Map (Ctrl+S)">
            <Save size={16} />
            Save
          </button>

          <div className="h-6 w-px bg-zinc-800 mx-2" />

          <button
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isLive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-zinc-400 hover:bg-zinc-800'}`}
            onClick={() => setIsLive(!isLive)}
          >
            <Radio size={16} />
            {isLive ? 'Live' : 'Go Live'}
          </button>

          <button className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors" onClick={handleBroadcast} title="Broadcast" disabled={isLive}>
            <Monitor size={18} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors" onClick={openBattleMapDisplay} title="Open Display">
            <ExternalLink size={18} />
          </button>
          <button
            className={`p-2 rounded-md transition-colors ${showSoundboard ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            onClick={() => setShowSoundboard(!showSoundboard)}
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 grid grid-cols-[60px_1fr_320px] overflow-hidden">
        {/* Left toolbar (Mini) */}
        <div className="bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-4 z-10">
          <ZoomControls />
          <div className="w-8 h-px bg-zinc-800" />
          <LayerControls />
        </div>

        {/* Canvas area */}
        <div className="relative bg-zinc-950 overflow-hidden flex items-center justify-center">

          <FloatingToolbar />

          {/* Mode selector - only show when no map loaded AND in import mode */}
          {!mapImage && canvasMode === 'import' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
              <div className="flex gap-4">
                <button
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                  onClick={() => setCanvasMode('importing')}
                >
                  <Upload size={32} className="text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-300">Import Map</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all ${canvasMode === 'ai-generate' ? 'ring-2 ring-indigo-500' : ''}`}
                  onClick={() => setCanvasMode('ai-generate')}
                >
                  <Wand2 size={32} className="text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-300">AI Generate</span>
                </button>
              </div>
            </div>
          )}
          <div className="w-full h-full" ref={containerRef}>
            {renderCanvasContent()}
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-zinc-900 border-l border-zinc-800 flex flex-col w-[320px]">
          <div className="flex items-center overflow-x-auto p-1 border-b border-zinc-800 gap-1 scrollbar-hide">
            {[
              { id: 'assets', icon: Layers, label: 'Tokens' },
              { id: 'tiles', icon: Grid, label: 'Tiles' },
              { id: 'overlays', icon: Route, label: 'Overlays' },
              { id: 'ai-assets', icon: Wand2, label: 'AI' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] uppercase font-medium tracking-wide transition-colors ${activePanel === tab.id ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                onClick={() => setActivePanel(tab.id)}
                title={tab.label}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
            <button
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] uppercase font-medium tracking-wide transition-colors ${activePanel === 'maps' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
              onClick={() => setActivePanel('maps')}
            >
              <FolderOpen size={16} />
              Maps
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowSoundboard(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-[90%] max-w-5xl h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-100">Soundboard</h3>
              <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors" onClick={() => setShowSoundboard(false)} title="Close">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <DMSoundboard campaignId={campaignId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
