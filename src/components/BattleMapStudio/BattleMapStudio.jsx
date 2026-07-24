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
  Volume2,
  Film,
  Grid,
  Boxes,
  FolderInput,
  CloudRain,
  Undo2,
  Redo2,
  MoreHorizontal,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useBattleMapStore } from '../../stores/battleMapStore';
import { useBattleMap } from '../../hooks/useBattleMap';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useToast } from '../../contexts/ToastContext';
import CanvasLayers from './Canvas/MapCanvas'; // Using existing MapCanvas component
import FloatingToolbar from './Toolbar/FloatingToolbar';
import SelectionToolbar from './Toolbar/SelectionToolbar';
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
import AssetPackImporter from './Panels/AssetPackImporter';
import AnimatedMapLibrary from './Panels/AnimatedMapLibrary';
import DMSoundboard from '../Soundboard/DMSoundboard';

export default function BattleMapStudio({ campaign, isDM }) {
  const campaignId = campaign?.id;
  const [activePanel, setActivePanel] = useState('assets'); // 'assets' | 'ai-assets' | 'maps' | 'grid'
  const [canvasMode, setCanvasMode] = useState('import'); // 'import' | 'ai-generate'
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [isLive, setIsLive] = useState(false); // Live broadcast mode
  const [showSoundboard, setShowSoundboard] = useState(false); // Soundboard modal
  const [showMobilePanels, setShowMobilePanels] = useState(false); // Bottom sheet
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Overflow menu
  const containerRef = useRef(null);
  const toast = useToast();
  const isMobile = useIsMobile();

  const {
    mapId,
    mapName,
    mapImage,
    tokens,
    drawings,
    fogRevealed,
    gridSize,
    gridVisible,
    gridColor,
    fogEnabled,
    showTokenLabels,
    isDirty,
    past,
    future,
    setMapName,
    resetMap,
    loadMapState,
    getSerializableState,
    markClean,
    undo,
    redo,
    duplicateSelectedTokens,
    deleteSelectedTokens,
    selectedTokenIds
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

    // Debounce broadcasts to avoid overwhelming Firestore. 100ms meant a token
    // drag published a document per frame; broadcastToPlayers additionally
    // skips writes whose payload is unchanged.
    const timeoutId = setTimeout(() => {
      broadcastToPlayers();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [isLive, mapImage, tokens, drawings, fogRevealed, gridSize, gridVisible, gridColor, fogEnabled, showTokenLabels, broadcastToPlayers]);

  // Save current map
  const handleSave = async () => {
    const state = getSerializableState();
    try {
      await saveMap(mapId, state);
      markClean();
      toast.success('Map saved');
    } catch (err) {
      // Firestore caps documents at 1MB. Without this the rejection was an
      // unhandled promise and the user was told nothing.
      const tooBig = /longer than|exceeds maximum|invalid-argument/i.test(err?.message || '');
      toast.error(
        tooBig
          ? 'Map too large to save. Remove some placed assets, or use an uploaded/AI-generated background instead of embedded images.'
          : `Could not save map: ${err?.message || 'unknown error'}`,
        { duration: 8000 }
      );
    }
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
    try {
      const mapData = await loadMap(selectedMapId);
      if (mapData) {
        const { id, ...mapState } = mapData;
        loadMapState({
          mapId: selectedMapId,
          ...mapState
        });
        // Maps saved before imports were uploaded to Storage carry a dead
        // blob: URL. Say so rather than showing an empty canvas.
        if (mapState.mapImage?.url?.startsWith('blob:')) {
          toast.warning(
            'This map was saved before uploads were fixed, so its background image is gone. Re-import the image to repair it.',
            { duration: 10000 }
          );
        }
      } else {
        toast.error('That map could not be found.');
      }
    } catch (err) {
      toast.error(`Could not load map: ${err?.message || 'unknown error'}`);
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
      'width=2560,height=1440,menubar=no,toolbar=no,location=no,status=no'
    );
  }, [campaignId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't hijack keys while the map-name field or any other input has focus.
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

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
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'd':
            e.preventDefault();
            duplicateSelectedTokens();
            break;
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedTokens();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, mapId, undo, redo, duplicateSelectedTokens, deleteSelectedTokens]);

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
        <div className={`relative w-full h-full flex flex-col ${isMobile ? '' : 'items-center justify-center p-4'}`}>
          {isMobile ? (
            /* Phone: the generator is the whole screen with a normal header
               row, rather than a floating card behind a corner button. */
            <>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
                <button
                  onClick={() => setCanvasMode('import')}
                  className="p-2 -ml-1 rounded-md text-zinc-400 active:bg-zinc-800"
                  aria-label="Back"
                >
                  <X size={20} />
                </button>
                <span className="text-sm font-medium text-zinc-300">Generate a map</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <AIMapGenerator campaignId={campaignId} />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      );
    }

    // 'importing' mode or fallback: show the MapImporter
    return <MapImporter campaignId={campaignId} />;
  };

  // Tab bar + active panel. Shared by the desktop right rail and the mobile
  // bottom sheet so the two can't drift.
  const renderPanelStack = () => (
    <>
      <div className="flex items-center overflow-x-auto p-1 border-b border-zinc-800 gap-1 scrollbar-hide shrink-0">
        {[
          { id: 'assets', icon: Layers, label: 'Tokens' },
          { id: 'import', icon: FolderInput, label: 'Packs' },
          { id: 'animated-maps', icon: Film, label: 'Animated' },
          { id: 'ai-assets', icon: Wand2, label: 'AI' }
        ].map(tab => {
          // The AI tab covers both the single-asset and pack generators.
          const isActive = tab.id === 'ai-assets'
            ? (activePanel === 'ai-assets' || activePanel === 'ai-packs')
            : activePanel === tab.id;
          return (
            <button
              key={tab.id}
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] uppercase font-medium tracking-wide transition-colors ${isActive ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
              onClick={() => setActivePanel(tab.id)}
              title={tab.label}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
        <button
          className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] uppercase font-medium tracking-wide transition-colors ${activePanel === 'maps' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
          onClick={() => setActivePanel('maps')}
        >
          <FolderOpen size={16} />
          Maps
        </button>
        {/* Grid and effects have no tab on desktop (they live on the left
            toolbar), but the mobile sheet is the only way to reach them. */}
        {isMobile && (
          <>
            <button
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] uppercase font-medium tracking-wide transition-colors ${activePanel === 'grid' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
              onClick={() => setActivePanel('grid')}
            >
              <Grid size={16} />
              Grid
            </button>
            <button
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] uppercase font-medium tracking-wide transition-colors ${activePanel === 'animate' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
              onClick={() => setActivePanel('animate')}
            >
              <CloudRain size={16} />
              Weather
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activePanel === 'assets' && (
          <AssetLibrary campaignId={campaignId} />
        )}
        {activePanel === 'import' && (
          <AssetPackImporter campaignId={campaignId} />
        )}
        {(activePanel === 'ai-assets' || activePanel === 'ai-packs') && (
          <>
            <div className="flex gap-1 p-1 mb-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${activePanel === 'ai-assets' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => setActivePanel('ai-assets')}
              >
                <Wand2 size={14} />
                Single
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${activePanel === 'ai-packs' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => setActivePanel('ai-packs')}
              >
                <Boxes size={14} />
                Pack
              </button>
            </div>
            {activePanel === 'ai-assets'
              ? <AIAssetGenerator campaignId={campaignId} />
              : <AIAssetPackGenerator campaignId={campaignId} />}
          </>
        )}
        {activePanel === 'grid' && (
          <GridCalibrator />
        )}
        {activePanel === 'animate' && (
          <AnimationControls />
        )}
        {activePanel === 'animated-maps' && (
          <AnimatedMapLibrary />
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
    </>
  );

  return (
    <div
      // On mobile the studio takes over the viewport above the fixed bottom
      // nav. In flow it inherited a TopBar offset plus the nav's reserved
      // padding, so h-screen overflowed and put the toolbar under the nav.
      className={isMobile
        ? 'fixed inset-x-0 top-0 z-40 flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden font-sans'
        : 'flex flex-col h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden font-sans'}
      style={isMobile ? { bottom: 'var(--lr-main-pad, 0px)' } : undefined}
    >
      {/* Header */}
      <div className={`border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm shrink-0 ${
        // pl-14 clears the app's hamburger button, which is fixed at top-4 left-4.
        isMobile ? 'h-14 pl-14 pr-2 gap-1' : 'h-16 px-6'
      }`}>
        <div className="flex items-center gap-4 min-w-0">
          {!isMobile && (
            <>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Battle Map Studio</h2>
              <div className="h-6 w-px bg-zinc-800" />
            </>
          )}
          <input
            type="text"
            className={`bg-transparent border-none text-zinc-300 placeholder-zinc-600 focus:ring-0 text-sm hover:bg-zinc-800/50 rounded px-2 py-1 transition-colors ${isMobile ? 'w-full min-w-0' : 'w-48'}`}
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder="Map name..."
          />
          {isDirty && !isMobile && <span className="text-amber-500 text-xs font-medium px-2 py-0.5 bg-amber-500/10 rounded-full">Unsaved</span>}
          {isDirty && isMobile && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />}
        </div>

        {isMobile ? (
          /* Phone header: only the actions you need mid-session. The rest
             live in the overflow menu. */
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="p-2 rounded-md text-zinc-400 active:bg-zinc-800 disabled:opacity-30"
              onClick={undo}
              disabled={past.length === 0}
              aria-label="Undo"
            >
              <Undo2 size={20} />
            </button>
            <button
              className="p-2 bg-indigo-600 active:bg-indigo-500 text-white rounded-md"
              onClick={handleSave}
              aria-label="Save map"
            >
              <Save size={20} />
            </button>
            <button
              className={`p-2 rounded-md ${showMobileMenu ? 'bg-zinc-800 text-white' : 'text-zinc-400 active:bg-zinc-800'}`}
              onClick={() => setShowMobileMenu(v => !v)}
              aria-label="More actions"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        ) : (
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            className="p-2 rounded-md transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={18} />
          </button>

          <div className="h-6 w-px bg-zinc-800 mx-1" />

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
        )}
      </div>

      {/* Mobile overflow menu */}
      {isMobile && showMobileMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute right-2 top-14 z-50 w-56 py-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
            {[
              { label: 'New map', icon: Plus, onClick: handleNewMap },
              { label: 'Open a saved map', icon: FolderOpen, onClick: () => { setActivePanel('maps'); setShowMobilePanels(true); } },
              { label: 'Redo', icon: Redo2, onClick: redo, disabled: future.length === 0 },
              { label: isLive ? 'Stop broadcasting' : 'Go live', icon: Radio, onClick: () => setIsLive(!isLive) },
              { label: 'Push to display once', icon: Monitor, onClick: handleBroadcast, disabled: isLive },
              { label: 'Soundboard', icon: Volume2, onClick: () => setShowSoundboard(true) }
            ].map(({ label, icon: Icon, onClick, disabled }) => (
              <button
                key={label}
                disabled={disabled}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 active:bg-zinc-800 disabled:opacity-30 text-left"
                onClick={() => { setShowMobileMenu(false); onClick(); }}
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main workspace */}
      <div className={`flex-1 overflow-hidden min-h-0 ${
        // 60px + 320px of chrome left ~10px of canvas on a 390px phone.
        isMobile ? 'flex' : 'grid grid-cols-[60px_1fr_320px]'
      }`}>
        {/* Left toolbar (Mini) — desktop only */}
        {!isMobile && (
        <div className="bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-4 z-10">
          <ZoomControls />
          <div className="w-8 h-px bg-zinc-800" />
          <LayerControls />
          <div className="w-8 h-px bg-zinc-800" />
          {/* Grid and effects open in the right rail; they live here to keep the
              tab bar readable at 320px. */}
          <button
            className={`p-2 rounded-md transition-colors ${activePanel === 'grid' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
            onClick={() => setActivePanel('grid')}
            title="Grid & Fog settings"
          >
            <Grid size={18} />
          </button>
          <button
            className={`p-2 rounded-md transition-colors ${activePanel === 'animate' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
            onClick={() => setActivePanel('animate')}
            title="Weather & effects"
          >
            <CloudRain size={18} />
          </button>
        </div>
        )}

        {/* Canvas area */}
        <div className="relative flex-1 min-w-0 bg-zinc-950 overflow-hidden flex items-center justify-center">

          <FloatingToolbar />
          {mapImage && <SelectionToolbar />}

          {/* Mode selector - only show when no map loaded AND in import mode */}
          {!mapImage && canvasMode === 'import' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-6">
              <div className={`gap-4 w-full max-w-sm ${isMobile ? 'flex flex-col' : 'flex'}`}>
                <button
                  className={`flex items-center justify-center gap-3 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all ${isMobile ? 'w-full flex-row' : 'flex-col'}`}
                  onClick={() => setCanvasMode('importing')}
                >
                  <Upload size={isMobile ? 24 : 32} className="text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-300">Import Map</span>
                </button>
                <button
                  className={`flex items-center justify-center gap-3 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all ${isMobile ? 'w-full flex-row' : 'flex-col'} ${canvasMode === 'ai-generate' ? 'ring-2 ring-indigo-500' : ''}`}
                  onClick={() => setCanvasMode('ai-generate')}
                >
                  <Wand2 size={isMobile ? 24 : 32} className="text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-300">AI Generate</span>
                </button>
              </div>
            </div>
          )}
          <div className="w-full h-full" ref={containerRef}>
            {renderCanvasContent()}
          </div>
        </div>

        {/* Right panel (desktop only — on mobile these live in a bottom sheet) */}
        {!isMobile && (
          <div className="bg-zinc-900 border-l border-zinc-800 flex flex-col w-[320px]">
            {renderPanelStack()}
          </div>
        )}
      </div>

      {/* Mobile: tools open in a bottom sheet so the canvas keeps the screen */}
      {isMobile && mapImage && !showMobilePanels && (
        <button
          // Sits above the drawing toolbar, which is centred and ~353px wide —
          // at bottom-4 the two overlapped on a 390px screen.
          className="absolute right-4 bottom-24 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-zinc-200 shadow-2xl"
          onClick={() => setShowMobilePanels(true)}
        >
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Tools</span>
        </button>
      )}

      {isMobile && showMobilePanels && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobilePanels(false)} />
          <div className="relative bg-zinc-900 border-t border-zinc-700 rounded-t-2xl flex flex-col h-[70%] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-700 absolute left-1/2 -translate-x-1/2 top-2" />
              <span className="text-sm font-medium text-zinc-300 mt-2">Tools</span>
              <button
                className="p-2 -mr-2 mt-2 text-zinc-400 active:bg-zinc-800 rounded-md"
                onClick={() => setShowMobilePanels(false)}
                aria-label="Close tools"
              >
                <X size={20} />
              </button>
            </div>
            {renderPanelStack()}
          </div>
        </div>
      )}

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
