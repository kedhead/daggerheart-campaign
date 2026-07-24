import { Shape } from 'react-konva';

// Painted opaque and made translucent via the Shape's opacity — filling with a
// translucent black instead would stack alpha wherever 'hide' overpaints fog.
const FOG_FILL = '#000';
const FOG_OPACITY = 0.9;

export default function FogOfWarLayer({ width, height, revealed }) {
  const drawFog = (context, shape) => {
    // Fill entire area with fog
    context.fillStyle = FOG_FILL;
    context.fillRect(0, 0, width, height);

    const paintArea = (area) => {
      if (area.type === 'circle') {
        context.beginPath();
        context.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
        context.fill();
      } else if (area.type === 'rect') {
        context.fillRect(area.x, area.y, area.width, area.height);
      } else if (area.type === 'polygon' && area.points) {
        context.beginPath();
        context.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
          context.lineTo(area.points[i].x, area.points[i].y);
        }
        context.closePath();
        context.fill();
      }
    };

    // Applied in order: 'reveal' cuts fog away, 'hide' paints it back, so a
    // DM can re-cover an area they revealed by mistake.
    revealed.forEach(area => {
      if (area.mode === 'hide') {
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = FOG_FILL;
      } else {
        context.globalCompositeOperation = 'destination-out';
      }
      paintArea(area);
    });

    // Reset composite operation
    context.globalCompositeOperation = 'source-over';
    context.fillStrokeShape(shape);
  };

  return (
    <Shape
      sceneFunc={drawFog}
      opacity={FOG_OPACITY}
      listening={false}
    />
  );
}
