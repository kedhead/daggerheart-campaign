import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useBattleMapStore } from '../../../stores/battleMapStore';
import GridOverlay from './GridOverlay';
import TokenLayer from './TokenLayer';
import FogOfWarLayer from './FogOfWarLayer';

function MapBackground({ url }) {
  const [image] = useImage(url, 'anonymous');
  return image ? <KonvaImage image={image} /> : null;
}

export default function MapCanvas() {
  const stageRef = useRef(null);
  const containerRef = useRef(null);

  const {
    mapImage,
    zoom,
    panOffset,
    selectedTool,
    stageSize,
    gridVisible,
    gridType,
    gridSize,
    gridColor,
    layers,
    fogEnabled,
    fogRevealed,
    fogBrushSize,
    tokens,
    selectedTokenIds,
    setZoom,
    setPanOffset,
    addFogReveal,
    selectToken,
    deselectAll,
    updateToken
  } = useBattleMapStore();

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - panOffset.x) / oldScale,
      y: (pointer.y - panOffset.y) / oldScale
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setZoom(clampedScale);
    setPanOffset({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    });
  }, [zoom, panOffset, setZoom, setPanOffset]);

  // Handle stage drag (pan)
  const handleDragEnd = useCallback((e) => {
    if (e.target === stageRef.current) {
      setPanOffset({
        x: e.target.x(),
        y: e.target.y()
      });
    }
  }, [setPanOffset]);

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      deselectAll();
    }
  }, [deselectAll]);

  // Handle fog painting
  const isPainting = useRef(false);
  const lastPos = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (selectedTool === 'fog-erase' || selectedTool === 'fog-paint') {
      isPainting.current = true;
      const pos = e.target.getStage().getPointerPosition();
      const scaledPos = {
        x: (pos.x - panOffset.x) / zoom,
        y: (pos.y - panOffset.y) / zoom
      };
      lastPos.current = scaledPos;

      // Add initial point
      if (selectedTool === 'fog-erase') {
        addFogReveal({
          type: 'circle',
          x: scaledPos.x,
          y: scaledPos.y,
          radius: fogBrushSize / 2
        });
      }
    }
  }, [selectedTool, panOffset, zoom, fogBrushSize, addFogReveal]);

  const handleMouseMove = useCallback((e) => {
    if (!isPainting.current || (selectedTool !== 'fog-erase' && selectedTool !== 'fog-paint')) return;

    const pos = e.target.getStage().getPointerPosition();
    const scaledPos = {
      x: (pos.x - panOffset.x) / zoom,
      y: (pos.y - panOffset.y) / zoom
    };

    if (selectedTool === 'fog-erase') {
      addFogReveal({
        type: 'circle',
        x: scaledPos.x,
        y: scaledPos.y,
        radius: fogBrushSize / 2
      });
    }

    lastPos.current = scaledPos;
  }, [selectedTool, panOffset, zoom, fogBrushSize, addFogReveal]);

  const handleMouseUp = useCallback(() => {
    isPainting.current = false;
    lastPos.current = null;
  }, []);

  // Determine if stage is draggable
  const isDraggable = selectedTool === 'pan';

  if (!mapImage) return null;

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      scaleX={zoom}
      scaleY={zoom}
      x={panOffset.x}
      y={panOffset.y}
      draggable={isDraggable}
      onWheel={handleWheel}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onTap={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: selectedTool === 'pan' ? 'grab' : 'default' }}
    >
      {/* Background layer */}
      {layers.background.visible && (
        <Layer>
          <MapBackground url={mapImage.url} />
        </Layer>
      )}

      {/* Grid layer */}
      {gridVisible && gridType !== 'none' && (
        <Layer listening={false}>
          <GridOverlay
            width={mapImage.width}
            height={mapImage.height}
            gridType={gridType}
            gridSize={gridSize}
            gridColor={gridColor}
          />
        </Layer>
      )}

      {/* Tokens layer */}
      {layers.tokens.visible && (
        <Layer>
          <TokenLayer
            tokens={tokens}
            selectedIds={selectedTokenIds}
            onSelect={selectToken}
            onUpdate={updateToken}
            gridSize={gridSize}
            snapToGrid={useBattleMapStore.getState().snapToGrid}
            isSelectable={selectedTool === 'select'}
          />
        </Layer>
      )}

      {/* Fog of War layer */}
      {layers.fog.visible && fogEnabled && (
        <Layer listening={false}>
          <FogOfWarLayer
            width={mapImage.width}
            height={mapImage.height}
            revealed={fogRevealed}
          />
        </Layer>
      )}
    </Stage>
  );
}
