import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Shape, Group, Circle, Text } from 'react-konva';
import useImage from 'use-image';

function MapBackground({ url }) {
  const [image] = useImage(url, 'anonymous');
  return image ? <KonvaImage image={image} /> : null;
}

function GridOverlay({ width, height, gridType, gridSize, gridColor }) {
  if (gridType === 'none' || !gridType) return null;

  const drawSquareGrid = (context, shape) => {
    context.beginPath();
    context.strokeStyle = gridColor || 'rgba(255,255,255,0.3)';
    context.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += gridSize) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }

    context.stroke();
    context.fillStrokeShape(shape);
  };

  const drawHexGrid = (context, shape) => {
    context.beginPath();
    context.strokeStyle = gridColor || 'rgba(255,255,255,0.3)';
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
    <Shape
      sceneFunc={gridType === 'hex' ? drawHexGrid : drawSquareGrid}
      listening={false}
    />
  );
}

function Token({ token }) {
  const [image] = useImage(token.src, 'anonymous');

  if (!image && !token.color) return null;

  if (!image) {
    return (
      <Group>
        <Circle
          x={token.x + token.width / 2}
          y={token.y + token.height / 2}
          radius={token.width / 2}
          fill={token.color || '#8b5cf6'}
        />
        {token.name && (
          <Text
            x={token.x}
            y={token.y + token.height + 4}
            width={token.width}
            text={token.name}
            fontSize={14}
            fill="#fff"
            align="center"
          />
        )}
      </Group>
    );
  }

  return (
    <Group>
      <KonvaImage
        image={image}
        x={token.x}
        y={token.y}
        width={token.width}
        height={token.height}
        rotation={token.rotation || 0}
      />
      {token.name && (
        <Text
          x={token.x}
          y={token.y + token.height + 4}
          width={token.width}
          text={token.name}
          fontSize={14}
          fill="#fff"
          align="center"
        />
      )}
    </Group>
  );
}

function FogOfWarLayer({ width, height, revealed }) {
  const drawFog = (context, shape) => {
    context.fillStyle = 'rgba(0, 0, 0, 0.9)';
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = 'destination-out';

    (revealed || []).forEach(area => {
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

    context.globalCompositeOperation = 'source-over';
    context.fillStrokeShape(shape);
  };

  return <Shape sceneFunc={drawFog} listening={false} />;
}

export default function BattleMapDisplay({ mapState }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && mapState?.mapImage) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const mapWidth = mapState.mapImage.width;
        const mapHeight = mapState.mapImage.height;

        // Calculate scale to fit the map in the container
        const scaleX = containerWidth / mapWidth;
        const scaleY = containerHeight / mapHeight;
        const newScale = Math.min(scaleX, scaleY, 1);

        setScale(newScale);
        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [mapState?.mapImage]);

  if (!mapState || !mapState.mapImage) {
    return (
      <div className="battle-map-display empty">
        <p>No battle map to display</p>
      </div>
    );
  }

  const { mapImage, gridType, gridSize, gridColor, gridVisible, tokens, fogRevealed } = mapState;

  // Calculate centering offset
  const offsetX = (dimensions.width - mapImage.width * scale) / 2;
  const offsetY = (dimensions.height - mapImage.height * scale) / 2;

  return (
    <div ref={containerRef} className="battle-map-display">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
      >
        <Layer
          x={offsetX}
          y={offsetY}
          scaleX={scale}
          scaleY={scale}
        >
          {/* Background */}
          <MapBackground url={mapImage.url} />

          {/* Grid */}
          {gridVisible !== false && gridType !== 'none' && (
            <GridOverlay
              width={mapImage.width}
              height={mapImage.height}
              gridType={gridType}
              gridSize={gridSize || 50}
              gridColor={gridColor}
            />
          )}

          {/* Tokens */}
          {tokens?.map(token => (
            <Token key={token.id} token={token} />
          ))}

          {/* Fog of War */}
          {fogRevealed && (
            <FogOfWarLayer
              width={mapImage.width}
              height={mapImage.height}
              revealed={fogRevealed}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
