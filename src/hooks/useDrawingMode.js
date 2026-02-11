import { useState, useRef, useCallback } from 'react';
import { useBattleMapStore } from '../stores/battleMapStore';

export function useDrawingMode() {
    const {
        selectedTool,
        drawingSettings,
        addDrawing,
        zoom,
        panOffset
    } = useBattleMapStore();

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState(null); // The shape currently being drawn
    const lastPointerPos = useRef(null);

    // Helper to get relative pointer position
    const getPointerPos = (stage) => {
        const pointer = stage.getPointerPosition();
        return {
            x: (pointer.x - panOffset.x) / zoom,
            y: (pointer.y - panOffset.y) / zoom
        };
    };

    const handleMouseDown = useCallback((e) => {
        // Only handle drawing tools
        if (!['brush', 'eraser', 'line', 'rect', 'circle'].includes(selectedTool)) return;

        // Don't start if clicking on a draggable object (like a token)
        // logic handling might be needed here or in the layer

        const stage = e.target.getStage();
        const pos = getPointerPos(stage);

        setIsDrawing(true);
        lastPointerPos.current = pos;

        // Initialize the shape
        if (selectedTool === 'brush' || selectedTool === 'eraser') {
            setCurrentShape({
                type: 'line',
                points: [pos.x, pos.y],
                color: selectedTool === 'eraser' ? null : drawingSettings.color,
                width: drawingSettings.width * (selectedTool === 'eraser' ? 2 : 1), // Eraser is wider
                opacity: drawingSettings.opacity,
                tool: selectedTool, // distinct tool type for rendering logic (e.g. globalCompositeOperation)
                closed: false
            });
        } else if (selectedTool === 'rect') {
            setCurrentShape({
                type: 'rect',
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                color: drawingSettings.color,
                strokeWidth: drawingSettings.width,
                opacity: drawingSettings.opacity
            });
        } else if (selectedTool === 'circle') {
            setCurrentShape({
                type: 'circle',
                x: pos.x,
                y: pos.y,
                radius: 0,
                color: drawingSettings.color,
                strokeWidth: drawingSettings.width,
                opacity: drawingSettings.opacity
            });
        } else if (selectedTool === 'line') {
            setCurrentShape({
                type: 'line',
                points: [pos.x, pos.y, pos.x, pos.y],
                color: drawingSettings.color,
                width: drawingSettings.width,
                opacity: drawingSettings.opacity,
                tool: 'line',
                closed: false
            });
        }
    }, [selectedTool, drawingSettings, zoom, panOffset]);

    const handleMouseMove = useCallback((e) => {
        if (!isDrawing || !currentShape) return;

        const stage = e.target.getStage();
        const pos = getPointerPos(stage);

        if (selectedTool === 'brush' || selectedTool === 'eraser') {
            // Append points
            setCurrentShape(prev => ({
                ...prev,
                points: [...prev.points, pos.x, pos.y]
            }));
        } else if (selectedTool === 'rect') {
            setCurrentShape(prev => ({
                ...prev,
                width: pos.x - prev.x,
                height: pos.y - prev.y
            }));
        } else if (selectedTool === 'circle') {
            const dx = pos.x - currentShape.x;
            const dy = pos.y - currentShape.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            setCurrentShape(prev => ({
                ...prev,
                radius
            }));
        } else if (selectedTool === 'line') {
            setCurrentShape(prev => ({
                ...prev,
                points: [prev.points[0], prev.points[1], pos.x, pos.y]
            }));
        }
    }, [isDrawing, selectedTool, currentShape, zoom, panOffset]);

    const handleMouseUp = useCallback(() => {
        if (!isDrawing || !currentShape) return;

        // Commit the shape
        addDrawing(currentShape);

        // Reset
        setIsDrawing(false);
        setCurrentShape(null);
        lastPointerPos.current = null;
    }, [isDrawing, currentShape, addDrawing]);

    return {
        isDrawing,
        currentShape,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp
    };
}
