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
  selectedTool: 'select',   // 'select' | 'pan' | 'fog-erase' | 'fog-paint' | drawing tools
  stageSize: { width: 800, height: 600 },

  // Tokens
  tokens: [],               // { id, src, x, y, width, height, rotation, layer, name, locked, showLabel }
  selectedTokenIds: [],
  showTokenLabels: true,    // Global toggle for the name caption under tokens

  // Fog of War
  fogEnabled: true,
  // Ordered list of fog edits. Each entry is a circle/rect/polygon; entries with
  // mode: 'hide' paint fog back on instead of cutting it away.
  fogRevealed: [],
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

  // Undo/redo stacks of { tokens, drawings, fogRevealed } snapshots
  past: [],
  future: [],

  // Dirty state (unsaved changes)
  isDirty: false
};

const HISTORY_LIMIT = 50;

// The three collections a user can meaningfully undo.
const snapshot = (state) => ({
  tokens: state.tokens,
  drawings: state.drawings,
  fogRevealed: state.fogRevealed
});

// Wrap a mutation so it records an undo point and invalidates the redo stack.
const withHistory = (state, updates) => ({
  past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
  future: [],
  ...updates,
  isDirty: true
});

export const useBattleMapStore = create((set, get) => ({
  ...initialState,

  // History
  // Record an undo point without changing anything. Used to coalesce
  // continuous operations (a fog brush stroke) into a single undo step.
  pushHistory: () => set((state) => ({
    past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
    future: []
  })),

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      ...previous,
      past: state.past.slice(0, -1),
      future: [snapshot(state), ...state.future].slice(0, HISTORY_LIMIT),
      selectedTokenIds: state.selectedTokenIds.filter(
        id => previous.tokens.some(t => t.id === id)
      ),
      isDirty: true
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    return {
      ...next,
      past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
      selectedTokenIds: state.selectedTokenIds.filter(
        id => next.tokens.some(t => t.id === id)
      ),
      isDirty: true
    };
  }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

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
  addDrawing: (drawing) => set((state) => withHistory(state, {
    drawings: [...state.drawings, {
      ...drawing,
      id: drawing.id || crypto.randomUUID()
    }]
  })),

  removeDrawing: (drawingId) => set((state) => withHistory(state, {
    drawings: state.drawings.filter(d => d.id !== drawingId)
  })),

  clearDrawings: () => set((state) => withHistory(state, { drawings: [] })),

  setDrawingSettings: (settings) => set((state) => ({
    drawingSettings: { ...state.drawingSettings, ...settings }
  })),

  // Token actions
  addToken: (token) => set((state) => withHistory(state, {
    tokens: [...state.tokens, {
      id: crypto.randomUUID(),
      layer: 'tokens',
      rotation: 0,
      width: state.gridSize,
      height: state.gridSize,
      ...token
    }]
  })),

  updateToken: (tokenId, updates) => set((state) => withHistory(state, {
    tokens: state.tokens.map(t => t.id === tokenId ? { ...t, ...updates } : t)
  })),

  removeToken: (tokenId) => set((state) => withHistory(state, {
    tokens: state.tokens.filter(t => t.id !== tokenId),
    selectedTokenIds: state.selectedTokenIds.filter(id => id !== tokenId)
  })),

  selectToken: (tokenId, addToSelection = false) => set((state) => ({
    selectedTokenIds: addToSelection
      ? (state.selectedTokenIds.includes(tokenId)
          ? state.selectedTokenIds.filter(id => id !== tokenId)
          : [...state.selectedTokenIds, tokenId])
      : [tokenId]
  })),

  deselectAll: () => set({ selectedTokenIds: [] }),

  deleteSelectedTokens: () => set((state) => {
    // Locked tokens are skipped so a stray Delete can't wipe scenery.
    const doomed = state.tokens.filter(
      t => state.selectedTokenIds.includes(t.id) && !t.locked
    );
    if (doomed.length === 0) return state;
    const doomedIds = new Set(doomed.map(t => t.id));
    return withHistory(state, {
      tokens: state.tokens.filter(t => !doomedIds.has(t.id)),
      selectedTokenIds: []
    });
  }),

  duplicateSelectedTokens: () => set((state) => {
    const originals = state.tokens.filter(t => state.selectedTokenIds.includes(t.id));
    if (originals.length === 0) return state;
    const offset = state.gridSize;
    const copies = originals.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      x: t.x + offset,
      y: t.y + offset
    }));
    return withHistory(state, {
      tokens: [...state.tokens, ...copies],
      selectedTokenIds: copies.map(t => t.id)
    });
  }),

  // Z-order is render order, so front/back is a reorder of the tokens array.
  bringSelectedToFront: () => set((state) => {
    if (state.selectedTokenIds.length === 0) return state;
    const selected = state.tokens.filter(t => state.selectedTokenIds.includes(t.id));
    const rest = state.tokens.filter(t => !state.selectedTokenIds.includes(t.id));
    return withHistory(state, { tokens: [...rest, ...selected] });
  }),

  sendSelectedToBack: () => set((state) => {
    if (state.selectedTokenIds.length === 0) return state;
    const selected = state.tokens.filter(t => state.selectedTokenIds.includes(t.id));
    const rest = state.tokens.filter(t => !state.selectedTokenIds.includes(t.id));
    return withHistory(state, { tokens: [...selected, ...rest] });
  }),

  toggleSelectedLocked: () => set((state) => {
    if (state.selectedTokenIds.length === 0) return state;
    const selected = state.tokens.filter(t => state.selectedTokenIds.includes(t.id));
    // Mixed selection locks everything; an all-locked selection unlocks.
    const lock = selected.some(t => !t.locked);
    return withHistory(state, {
      tokens: state.tokens.map(t =>
        state.selectedTokenIds.includes(t.id) ? { ...t, locked: lock } : t
      )
    });
  }),

  // Send selected tokens to the background layer (scenery) or back to tokens.
  setSelectedTokensLayer: (layer) => set((state) => {
    if (state.selectedTokenIds.length === 0) return state;
    return withHistory(state, {
      tokens: state.tokens.map(t =>
        state.selectedTokenIds.includes(t.id) ? { ...t, layer } : t
      )
    });
  }),

  toggleTokenLabels: () => set((state) => ({ showTokenLabels: !state.showTokenLabels })),

  // Fog of War actions
  toggleFogEnabled: () => set((state) => ({ fogEnabled: !state.fogEnabled })),

  // No history push here — a brush stroke fires this per pointer move.
  // MapCanvas calls pushHistory() once on stroke start instead.
  addFogReveal: (path) => set((state) => ({
    fogRevealed: [...state.fogRevealed, path],
    isDirty: true
  })),

  clearFogReveals: () => set((state) => withHistory(state, { fogRevealed: [] })),

  setFogBrushSize: (fogBrushSize) => set({ fogBrushSize }),

  revealAllFog: () => set((state) => {
    if (!state.mapImage) return state;
    return withHistory(state, {
      fogRevealed: [{
        type: 'rect',
        x: 0,
        y: 0,
        width: state.mapImage.width,
        height: state.mapImage.height
      }]
    });
  }),

  hideAllFog: () => set((state) => withHistory(state, { fogRevealed: [] })),

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
    past: [],
    future: [],
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
      tokens: state.tokens,
      showTokenLabels: state.showTokenLabels,
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
      showTokenLabels: state.showTokenLabels,
      drawings: state.drawings,
      fogEnabled: state.fogEnabled,
      fogRevealed: state.fogRevealed,
      animationEffects: state.animationEffects,
      animationIntensity: state.animationIntensity,
      animationEnabled: state.animationEnabled
    };
  }
}));
