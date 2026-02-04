import { useRef, useEffect } from 'react';
import { Group, Image as KonvaImage, Transformer, Circle, Text } from 'react-konva';
import useImage from 'use-image';

function Token({ token, isSelected, onSelect, onUpdate, gridSize, snapToGrid, isSelectable }) {
  const [image] = useImage(token.src, 'anonymous');
  const shapeRef = useRef();
  const transformerRef = useRef();

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const snapToGridPos = (x, y) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };

  const handleDragEnd = (e) => {
    const pos = snapToGridPos(e.target.x(), e.target.y());
    onUpdate(token.id, { x: pos.x, y: pos.y });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update dimensions
    node.scaleX(1);
    node.scaleY(1);

    onUpdate(token.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation()
    });
  };

  const handleClick = (e) => {
    if (!isSelectable) return;
    e.cancelBubble = true;
    onSelect(token.id, e.evt.shiftKey);
  };

  // Render a colored circle if no image
  if (!image) {
    return (
      <Group>
        <Circle
          ref={shapeRef}
          x={token.x + token.width / 2}
          y={token.y + token.height / 2}
          radius={token.width / 2}
          fill={token.color || '#8b5cf6'}
          stroke={isSelected ? '#fff' : 'transparent'}
          strokeWidth={2}
          draggable={isSelectable}
          onClick={handleClick}
          onTap={handleClick}
          onDragEnd={(e) => {
            const pos = snapToGridPos(
              e.target.x() - token.width / 2,
              e.target.y() - token.height / 2
            );
            onUpdate(token.id, { x: pos.x, y: pos.y });
          }}
        />
        {token.name && (
          <Text
            x={token.x}
            y={token.y + token.height + 4}
            width={token.width}
            text={token.name}
            fontSize={12}
            fill="#fff"
            align="center"
            listening={false}
          />
        )}
      </Group>
    );
  }

  return (
    <Group>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={token.x}
        y={token.y}
        width={token.width}
        height={token.height}
        rotation={token.rotation || 0}
        draggable={isSelectable}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {token.name && (
        <Text
          x={token.x}
          y={token.y + token.height + 4}
          width={token.width}
          text={token.name}
          fontSize={12}
          fill="#fff"
          align="center"
          listening={false}
        />
      )}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </Group>
  );
}

export default function TokenLayer({
  tokens,
  selectedIds,
  onSelect,
  onUpdate,
  gridSize,
  snapToGrid,
  isSelectable
}) {
  return (
    <Group>
      {tokens.map(token => (
        <Token
          key={token.id}
          token={token}
          isSelected={selectedIds.includes(token.id)}
          onSelect={onSelect}
          onUpdate={onUpdate}
          gridSize={gridSize}
          snapToGrid={snapToGrid}
          isSelectable={isSelectable}
        />
      ))}
    </Group>
  );
}
