import { Shape } from 'react-konva';

export default function FogOfWarLayer({ width, height, revealed }) {
  const drawFog = (context, shape) => {
    // Fill entire area with fog
    context.fillStyle = 'rgba(0, 0, 0, 0.9)';
    context.fillRect(0, 0, width, height);

    // Use destination-out to cut holes for revealed areas
    context.globalCompositeOperation = 'destination-out';

    revealed.forEach(area => {
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
    });

    // Reset composite operation
    context.globalCompositeOperation = 'source-over';
    context.fillStrokeShape(shape);
  };

  return (
    <Shape
      sceneFunc={drawFog}
      listening={false}
    />
  );
}
