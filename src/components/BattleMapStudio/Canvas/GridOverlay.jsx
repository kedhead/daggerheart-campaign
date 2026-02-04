import { Shape, Group } from 'react-konva';

export default function GridOverlay({ width, height, gridType, gridSize, gridColor }) {
  if (gridType === 'none') return null;

  const drawSquareGrid = (context, shape) => {
    context.beginPath();
    context.strokeStyle = gridColor;
    context.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }

    context.stroke();
    context.fillStrokeShape(shape);
  };

  const drawHexGrid = (context, shape) => {
    context.beginPath();
    context.strokeStyle = gridColor;
    context.lineWidth = 1;

    const hexHeight = gridSize;
    const hexWidth = hexHeight * (2 / Math.sqrt(3));
    const vertDist = hexHeight * 0.75;
    const horizDist = hexWidth;

    const drawHex = (centerX, centerY) => {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        points.push({
          x: centerX + (hexWidth / 2) * Math.cos(angle),
          y: centerY + (hexHeight / 2) * Math.sin(angle)
        });
      }

      context.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        context.lineTo(points[i].x, points[i].y);
      }
      context.lineTo(points[0].x, points[0].y);
    };

    let row = 0;
    for (let y = hexHeight / 2; y < height + hexHeight; y += vertDist) {
      const offset = row % 2 === 0 ? 0 : horizDist / 2;
      for (let x = hexWidth / 2 + offset; x < width + hexWidth; x += horizDist) {
        drawHex(x, y);
      }
      row++;
    }

    context.stroke();
    context.fillStrokeShape(shape);
  };

  return (
    <Group>
      <Shape
        sceneFunc={gridType === 'hex' ? drawHexGrid : drawSquareGrid}
        listening={false}
      />
    </Group>
  );
}
