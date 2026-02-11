import { useRef, useEffect } from 'react';
import { Layer, Line, Rect, Circle } from 'react-konva';
import { useBattleMapStore } from '../../../stores/battleMapStore';

export default function DrawingLayer({ currentDrawing, isDrawing }) {
    const { drawings, drawingSettings } = useBattleMapStore();

    // Render a single shape based on its type
    const renderShape = (shape, i, isTemp = false) => {
        // If it's a temp shape, use its own properties.
        // If it's a committed shape, properties are already in object.

        if (shape.type === 'line') {
            return (
                <Line
                    key={shape.id || `temp-${i}`}
                    points={shape.points}
                    stroke={shape.tool === 'eraser' ? null : shape.color}
                    strokeWidth={shape.width}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    opacity={shape.opacity}
                    globalCompositeOperation={
                        shape.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                />
            );
        } else if (shape.type === 'rect') {
            return (
                <Rect
                    key={shape.id || `temp-${i}`}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    opacity={shape.opacity}
                />
            );
        } else if (shape.type === 'circle') {
            return (
                <Circle
                    key={shape.id || `temp-${i}`}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    opacity={shape.opacity}
                />
            );
        }
        return null;
    };

    return (
        <Layer>
            {/* Committed Drawings */}
            {drawings.map((drawing, i) => renderShape(drawing, i))}

            {/* Current Temporary Drawing */}
            {isDrawing && currentDrawing && renderShape(currentDrawing, 'current', true)}
        </Layer>
    );
}
