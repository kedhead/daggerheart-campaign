import { create } from 'zustand';

const initialState = {
  // Map Configuration
  mapId: null,
  mapName: 'Untitled Map',
  mapImage: null,           // { url, width, height }

  // Grid
  gridType: 'square',       // 'square' | 'hex' | 'none'
  gridSize: 50,             // pixels per cell
  gridColor: 'rgba(255,255,255,0.3)',
  gridVisible: true,
  snapToGrid: true,

  // Canvas
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  selectedTool: 'select',   // 'select' | 'pan' | 'place' | 'fog-erase' | 'fog-paint'
  stageSize: { width: 800, height: 600 },

  // Tokens
  tokens: [],               // { id, src, x, y, width, height, rotation, layer, name }
  selectedTokenIds: [],

  // Fog of War
  fogEnabled: true,
  fogRevealed: [],          // Array of revealed polygon paths
  fogBrushSize: 50,

  // Layer visibility
  layers: {
    background: { visible: true },
    tokens: { visible: true },
    fog: { visible: true },
    drawings: { visible: true }
  },

  // Drawings
  drawings: [],
  drawingSettings: {
    tool: 'brush', // brush, line, rect, circle, eraser
    color: '#e2e8f0', // slate-200
    width: 3,
    opacity: 1
  },

  // Animation effects
  animationEffects: [],     // Array of effect IDs: ['rain', 'fog', etc.]
  animationIntensity: 1,    // 0-2 multiplier
  animationEnabled: false,  // Global toggle

  // Saved maps list (for the map browser)
  savedMaps: [],

  // Dirty state (unsaved changes)
  isDirty: false
};

export const useBattleMapStore = create((set, get) => ({
  ...initialState,

  // Map actions
  setMapImage: (mapImage) => set({ mapImage, isDirty: true }),
  setMapName: (mapName) => set({ mapName, isDirty: true }),
  setMapId: (mapId) => set({ mapId }),

  // Grid actions
  setGridType: (gridType) => set({ gridType, isDirty: true }),
  setGridSize: (gridSize) => set({ gridSize, isDirty: true }),
  setGridColor: (gridColor) => set({ gridColor, isDirty: true }),
  toggleGridVisible: () => set((state) => ({ gridVisible: !state.gridVisible })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  // Canvas actions
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  zoomIn: () => set((state) => ({ zoom: Math.min(5, state.zoom * 1.2) })),
  zoomOut: () => set((state) => ({ zoom: Math.max(0.1, state.zoom / 1.2) })),
  resetZoom: () => set({ zoom: 1, panOffset: { x: 0, y: 0 } }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setSelectedTool: (selectedTool) => set({ selectedTool }),
  setStageSize: (stageSize) => set({ stageSize }),

  // Drawing actions
  addDrawing: (drawing) => set((state) => ({
    drawings: [...state.drawings, {
      ...drawing,
      id: drawing.id || `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }],
    isDirty: true
  })),

  removeDrawing: (drawingId) => set((state) => ({
    drawings: state.drawings.filter(d => d.id !== drawingId),
    isDirty: true
  })),

  clearDrawings: () => set({ drawings: [], isDirty: true }),

  undoLastDrawing: () => set((state) => ({
    drawings: state.drawings.slice(0, -1),
    isDirty: true
  })),

  setDrawingSettings: (settings) => set((state) => ({
    drawingSettings: { ...state.drawingSettings, ...settings }
  })),

  // Token actions
  addToken: (token) => set((state) => ({
    tokens: [...state.tokens, {
      id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      layer: 'tokens',
      rotation: 0,
      width: state.gridSize,
      height: state.gridSize,
      ...token
    }],
    isDirty: true
  })),

  updateToken: (tokenId, updates) => set((state) => ({
    tokens: state.tokens.map(t => t.id === tokenId ? { ...t, ...updates } : t),
    isDirty: true
  })),

  removeToken: (tokenId) => set((state) => ({
    tokens: state.tokens.filter(t => t.id !== tokenId),
    selectedTokenIds: state.selectedTokenIds.filter(id => id !== tokenId),
    isDirty: true
  })),

  selectToken: (tokenId, addToSelection = false) => set((state) => ({
    selectedTokenIds: addToSelection
      ? [...state.selectedTokenIds, tokenId]
      : [tokenId]
  })),

  deselectAll: () => set({ selectedTokenIds: [] }),

  deleteSelectedTokens: () => set((state) => ({
    tokens: state.tokens.filter(t => !state.selectedTokenIds.includes(t.id)),
    selectedTokenIds: [],
    isDirty: true
  })),

  // Fog of War actions
  toggleFogEnabled: () => set((state) => ({ fogEnabled: !state.fogEnabled })),

  addFogReveal: (path) => set((state) => ({
    fogRevealed: [...state.fogRevealed, path],
    isDirty: true
  })),

  clearFogReveals: () => set({ fogRevealed: [], isDirty: true }),

  setFogBrushSize: (fogBrushSize) => set({ fogBrushSize }),

  revealAllFog: () => set((state) => {
    if (!state.mapImage) return state;
    return {
      fogRevealed: [{
        type: 'rect',
        x: 0,
        y: 0,
        width: state.mapImage.width,
        height: state.mapImage.height
      }],
      isDirty: true
    };
  }),

  hideAllFog: () => set({ fogRevealed: [], isDirty: true }),

  // Layer actions
  toggleLayerVisibility: (layerId) => set((state) => {
    const isVisible = !state.layers[layerId].visible;
    const updates = {
      layers: {
        ...state.layers,
        [layerId]: { ...state.layers[layerId], visible: isVisible }
      },
      isDirty: true
    };

    // Sync fogEnabled with fog layer visibility
    if (layerId === 'fog') {
      updates.fogEnabled = isVisible;
    }

    return updates;
  }),

  // Animation actions
  toggleAnimationEnabled: () => set((state) => ({
    animationEnabled: !state.animationEnabled,
    isDirty: true
  })),

  setAnimationEffects: (effects) => set({
    animationEffects: effects,
    isDirty: true
  }),

  toggleAnimationEffect: (effectId) => set((state) => ({
    animationEffects: state.animationEffects.includes(effectId)
      ? state.animationEffects.filter(e => e !== effectId)
      : [...state.animationEffects, effectId],
    isDirty: true
  })),

  setAnimationIntensity: (intensity) => set({
    animationIntensity: Math.max(0, Math.min(2, intensity)),
    isDirty: true
  }),

  clearAnimationEffects: () => set({
    animationEffects: [],
    animationEnabled: false,
    isDirty: true
  }),

  // Load/Save state
  loadMapState: (mapState) => set({
    ...mapState,
    drawings: mapState.drawings || [],
    isDirty: false
  }),

  resetMap: () => set({ ...initialState }),

  markClean: () => set({ isDirty: false }),

  // Get serializable state for saving
  getSerializableState: () => {
    const state = get();
    return {
      mapName: state.mapName,
      mapImage: state.mapImage,
      gridType: state.gridType,
      gridSize: state.gridSize,
      gridColor: state.gridColor,
      gridVisible: state.gridVisible,
      snapToGrid: state.snapToGrid,
      snapToGrid: state.snapToGrid,
      tokens: state.tokens,
      drawings: state.drawings,
      fogEnabled: state.fogEnabled,
      fogRevealed: state.fogRevealed,
      layers: state.layers,
      animationEffects: state.animationEffects,
      animationIntensity: state.animationIntensity,
      animationEnabled: state.animationEnabled
    };
  },

  // Get state for player display (without fog editing capabilities)
  getPlayerViewState: () => {
    const state = get();
    return {
      mapImage: state.mapImage,
      gridType: state.gridType,
      gridSize: state.gridSize,
      gridColor: state.gridColor,
      gridVisible: state.gridVisible,
      tokens: state.tokens.filter(t => state.layers[t.layer]?.visible !== false),
      drawings: state.drawings,
      fogEnabled: state.fogEnabled,
      fogRevealed: state.fogRevealed,
      animationEffects: state.animationEffects,
      animationIntensity: state.animationIntensity,
      animationEnabled: state.animationEnabled
    };
  }
}));
