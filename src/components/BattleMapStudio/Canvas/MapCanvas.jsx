import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useBattleMapStore } from '../../../stores/battleMapStore';
import { useDrawingMode } from '../../../hooks/useDrawingMode';
import GridOverlay from './GridOverlay';
import TokenLayer from './TokenLayer';
import FogOfWarLayer from './FogOfWarLayer';
import DrawingLayer from './DrawingLayer';
import MapAnimationOverlay from './MapAnimationOverlay';

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
    snapToGrid,
    animationEffects,
    animationIntensity,
    animationEnabled,
    setZoom,
    setPanOffset,
    addFogReveal,
    addToken,
    selectToken,
    deselectAll,
    updateToken
  } = useBattleMapStore();

  const {
    isDrawing,
    currentShape,
    handleMouseDown: handleDrawingMouseDown,
    handleMouseMove: handleDrawingMouseMove,
    handleMouseUp: handleDrawingMouseUp
  } = useDrawingMode();

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
    // Handle Drawing
    if (['brush', 'eraser', 'line', 'rect', 'circle'].includes(selectedTool)) {
      handleDrawingMouseDown(e);
      return;
    }

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
  }, [selectedTool, panOffset, zoom, fogBrushSize, addFogReveal, handleDrawingMouseDown]);

  const handleMouseMove = useCallback((e) => {
    // Handle Drawing
    if (isDrawing) {
      handleDrawingMouseMove(e);
      return;
    }

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
  }, [selectedTool, panOffset, zoom, fogBrushSize, addFogReveal, isDrawing, handleDrawingMouseMove]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      handleDrawingMouseUp();
    }
    isPainting.current = false;
    lastPos.current = null;
  }, [isDrawing, handleDrawingMouseUp]);

  // Handle drag-and-drop of tokens from asset library
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const tokenData = JSON.parse(data);
      const stage = stageRef.current;
      if (!stage) return;

      // Get drop position relative to stage
      const stageRect = stage.container().getBoundingClientRect();
      let x = (e.clientX - stageRect.left - panOffset.x) / zoom;
      let y = (e.clientY - stageRect.top - panOffset.y) / zoom;

      // Snap to grid if enabled
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize + gridSize / 2;
        y = Math.round(y / gridSize) * gridSize + gridSize / 2;
      }

      addToken({
        ...tokenData,
        x,
        y
      });
    } catch (err) {
      console.error('Error handling token drop:', err);
    }
  }, [panOffset, zoom, gridSize, snapToGrid, addToken]);

  // Determine if stage is draggable
  const isDraggable = selectedTool === 'pan';

  if (!mapImage) return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {/* Video background for animated maps */}
      {mapImage.isVideo && (
        <video
          src={mapImage.url}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: mapImage.width,
            height: mapImage.height,
            transformOrigin: '0 0',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      )}
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
        style={{
          cursor: selectedTool === 'pan' ? 'grab' : 'default',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Background layer - only render image for static maps */}
        {layers.background.visible && !mapImage.isVideo && (
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

        {/* Drawing layer (New) */}
        {layers.drawings?.visible !== false && (
          <DrawingLayer
            currentDrawing={currentShape}
            isDrawing={isDrawing}
          />
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
              snapToGrid={snapToGrid}
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

      {/* Animation overlay - rendered on top of canvas */}
      {animationEnabled && animationEffects.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: stageSize.width,
            height: stageSize.height,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: mapImage.width,
              height: mapImage.height,
              position: 'relative'
            }}
          >
            <MapAnimationOverlay
              width={mapImage.width}
              height={mapImage.height}
              effects={animationEffects}
              intensity={animationIntensity}
              enabled={animationEnabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
