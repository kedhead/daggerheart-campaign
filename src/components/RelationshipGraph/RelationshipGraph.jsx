import { useState, useEffect, useRef } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import EntityViewer from '../EntityViewer/EntityViewer';
import GraphControls from './GraphControls';
import {
  calculateConnectionStrength,
  calculateNodeImportance,
  filterGraphByTypes,
  findConnectedComponent,
  getNodeColor,
  getTypeLabel
} from '../../utils/graphCalculations';
import './RelationshipGraph.css';

export default function RelationshipGraph({ campaign, entities, isDM, currentUserId }) {
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [displayNodes, setDisplayNodes] = useState([]);
  const [displayEdges, setDisplayEdges] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedTypes, setSelectedTypes] = useState([
    'npc',
    'location',
    'lore',
    'session',
    'timelineEvent',
    'encounter',
    'note'
  ]);
  const [focusNode, setFocusNode] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [highlightedEdges, setHighlightedEdges] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);
  const [edgeStrengthMap, setEdgeStrengthMap] = useState(new Map());

  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!entities) return;

    // Build graph data from entities
    const graphNodes = [];
    const graphEdges = [];
    const nodeMap = new Map();

    // Helper to extract wiki links from text
    const extractLinks = (text) => {
      if (!text) return [];
      const linkRegex = /\[\[([^\]]+)\]\]/g;
      const links = [];
      let match;
      while ((match = linkRegex.exec(text)) !== null) {
        links.push(match[1]);
      }
      return links;
    };

    // Helper to get all text fields from an entity
    const getEntityTexts = (entity, type) => {
      const texts = [];
      if (type === 'npc') {
        texts.push(entity.description, entity.notes);
      } else if (type === 'location') {
        texts.push(entity.description, entity.notableFeatures, entity.secrets);
      } else if (type === 'lore') {
        texts.push(entity.content);
      } else if (type === 'session') {
        texts.push(entity.summary, entity.dmNotes);
      } else if (type === 'timelineEvent') {
        texts.push(entity.description, entity.outcome);
      } else if (type === 'encounter') {
        texts.push(entity.description, entity.enemies, entity.tactics, entity.rewards);
      } else if (type === 'note') {
        texts.push(entity.content);
      }
      return texts.filter(Boolean);
    };

    // Create nodes for all entities
    const allEntityTypes = ['npcs', 'locations', 'lore', 'sessions', 'timelineEvents', 'encounters', 'notes'];
    const entityTypeMap = {
      npcs: 'npc',
      locations: 'location',
      lore: 'lore',
      sessions: 'session',
      timelineEvents: 'timelineEvent',
      encounters: 'encounter',
      notes: 'note'
    };

    allEntityTypes.forEach(entityKey => {
      let entityArray = entities[entityKey];

      // Defensive check for non-array entity lists
      if (!Array.isArray(entityArray)) {
        if (entityArray) console.warn(`RelationshipGraph: ${entityKey} is not an array:`, entityArray);
        entityArray = [];
      }

      const entityType = entityTypeMap[entityKey];

      entityArray.forEach(entity => {
        // Skip hidden entities for non-DMs
        if (!entity || (!isDM && entity.hidden)) {
          // Special handling for notes
          if (entityType === 'note') {
            // Players can see their own notes, shared notes, or DM-overridden notes
            if (entity.createdBy !== currentUserId && !entity.visibleToPlayers) {
              return;
            }
          } else {
            // For all other entity types, skip if hidden
            return;
          }
        }

        const node = {
          id: `${entityType}-${entity.id}`,
          name: entity.title || entity.name,
          type: entityType,
          data: entity,
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: 0,
          vy: 0
        };
        graphNodes.push(node);
        nodeMap.set((entity.title || entity.name).toLowerCase(), node);
      });
    });

    // Create edges based on wiki links
    const strengthMap = new Map();
    graphNodes.forEach(node => {
      const texts = getEntityTexts(node.data, node.type);
      texts.forEach(text => {
        const links = extractLinks(text);
        links.forEach(linkName => {
          const targetNode = nodeMap.get(linkName.toLowerCase());
          if (targetNode && targetNode.id !== node.id) {
            const edgeId = [node.id, targetNode.id].sort().join('-');

            // Calculate connection strength
            const strength = calculateConnectionStrength(node, targetNode, graphNodes);
            const existingStrength = strengthMap.get(edgeId) || 0;
            strengthMap.set(edgeId, Math.max(existingStrength, strength));

            // Add edge (avoid duplicates)
            const exists = graphEdges.some(e =>
              (e.source === node.id && e.target === targetNode.id) ||
              (e.source === targetNode.id && e.target === node.id)
            );

            if (!exists) {
              graphEdges.push({
                id: edgeId,
                source: node.id,
                target: targetNode.id
              });
            }
          }
        });
      });
    });

    setEdgeStrengthMap(strengthMap);

    // Calculate node importance and set radius
    graphNodes.forEach(node => {
      const importance = calculateNodeImportance(node.id, graphEdges);
      node.importance = importance;
      node.radius = 8 + Math.min(12, importance * 1.5); // 8-20px based on importance
    });

    // Run force simulation
    const simulate = () => {
      const iterations = 50;
      const repulsionStrength = 5000;
      const attractionStrength = 0.01;
      const damping = 0.8;

      for (let iter = 0; iter < iterations; iter++) {
        // Apply repulsion between all nodes
        for (let i = 0; i < graphNodes.length; i++) {
          for (let j = i + 1; j < graphNodes.length; j++) {
            const nodeA = graphNodes[i];
            const nodeB = graphNodes[j];
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distSq = dx * dx + dy * dy + 0.01;
            const dist = Math.sqrt(distSq);
            const force = repulsionStrength / distSq;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;
          }
        }

        // Apply attraction along edges
        graphEdges.forEach(edge => {
          const source = graphNodes.find(n => n.id === edge.source);
          const target = graphNodes.find(n => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const force = attractionStrength;

            const fx = dx * force;
            const fy = dy * force;

            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // Update positions and apply damping
        graphNodes.forEach(node => {
          node.vx *= damping;
          node.vy *= damping;
          node.x += node.vx;
          node.y += node.vy;

          // Keep in bounds (with padding)
          node.x = Math.max(50, Math.min(750, node.x));
          node.y = Math.max(50, Math.min(550, node.y));
        });
      }
    };

    simulate();
    setAllNodes(graphNodes);
    setAllEdges(graphEdges);
  }, [entities]);

  // Apply filters whenever selection changes
  useEffect(() => {
    let { nodes, edges } = filterGraphByTypes(allNodes, allEdges, selectedTypes);

    // Apply focus mode if a node is selected
    if (focusNode) {
      const focused = findConnectedComponent(focusNode, nodes, edges);
      nodes = focused.nodes;
      edges = focused.edges;
    }

    setDisplayNodes(nodes);
    setDisplayEdges(edges);
  }, [allNodes, allEdges, selectedTypes, focusNode]);

  const handleNodeClick = (node) => {
    setSelectedEntity({
      type: node.type,
      data: node.data,
      name: node.name,
      displayName: node.name,
      subtitle: node.type
    });
  };

  const handleNodeHover = (node) => {
    const connected = displayEdges.filter(e =>
      e.source === node.id || e.target === node.id
    );
    setHighlightedEdges(connected.map(e => e.id));
  };

  const handleNodeLeave = () => {
    setHighlightedEdges([]);
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setDraggedNode(node);
  };

  const handleMouseMove = (e) => {
    if (!draggedNode || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;

    const x = (e.clientX - rect.left) * scaleX / zoom + (pan.x / zoom);
    const y = (e.clientY - rect.top) * scaleY / zoom + (pan.y / zoom);

    // Update node position
    setAllNodes(prev => prev.map(n =>
      n.id === draggedNode.id
        ? { ...n, x: Math.max(50, Math.min(750, x)), y: Math.max(50, Math.min(550, y)) }
        : n
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFocusNode(null);
  };

  const handleExportSVG = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${campaign?.name || 'campaign'}-relationship-graph.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate bounding box for auto-scaling if needed, but for void view we just zoom/pan

  if (!entities || allNodes.length === 0) {
    return (
      <div className="relationship-graph-container">
        <div className="relationship-graph-empty">
          <Network size={64} style={{ opacity: 0.5, color: '#fbbf24' }} />
          <h3>The Void Awaits</h3>
          <p>The constellation of your world has yet to be charted. Begin scribing notes with <code>[[Wiki Links]]</code> to form the first stars.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relationship-graph-container">
      <GraphControls
        header={
          <div className="graph-header-content">
            <h2>
              <Network size={28} />
              The Constellation
            </h2>
            <p className="graph-subtitle">
              {displayNodes.length} Celestial Bodies
              {focusNode && ' (Focused View)'}
            </p>
          </div>
        }
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        focusNode={focusNode}
        setFocusNode={setFocusNode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onExport={handleExportSVG}
      />

      <div className="graph-canvas" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${-pan.x} ${-pan.y} ${containerRef.current?.offsetWidth / zoom || 800} ${containerRef.current?.offsetHeight / zoom || 600}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseDown={(e) => {
            // Pan logic would go here if we implemented pan-on-drag
          }}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="star-gradient">
              <stop offset="0%" stopColor="#fff" stopOpacity="1" />
              <stop offset="40%" stopColor="var(--node-color)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--node-color)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Edges */}
          <g className="edges">
            {displayEdges.map((edge) => {
              const source = displayNodes.find(n => n.id === edge.source);
              const target = displayNodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              const strength = edgeStrengthMap.get(edge.id) || 1;
              const isHighlighted = highlightedEdges.includes(edge.id);
              const strokeWidth = Math.min(3, 0.5 + strength * 0.4); // Thinner, more elegant lines
              const opacity = isHighlighted ? 0.8 : (0.15 + (strength * 0.05)); // Fainter base lines

              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? '#fbbf24' : '#94a3b8'} // Gold highlight, slate base
                  strokeWidth={isHighlighted ? strokeWidth * 2 : strokeWidth}
                  opacity={opacity}
                  style={{ transition: 'all 0.3s ease' }}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {displayNodes.map((node) => {
              const baseColor = getNodeColor(node.type);

              return (
                <g
                  key={node.id}
                  className="node"
                  onClick={() => handleNodeClick(node)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onMouseEnter={() => handleNodeHover(node)}
                  onMouseLeave={handleNodeLeave}
                  style={{
                    cursor: draggedNode?.id === node.id ? 'grabbing' : 'grab',
                    '--node-color': baseColor
                  }}
                >
                  {/* Outer Glow */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={(node.radius || 8) * 1.5}
                    fill={baseColor}
                    opacity="0.2"
                    className="node-glow"
                  />

                  {/* Inner Core */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius || 8}
                    fill={baseColor}
                    filter="url(#glow)"
                    className="node-circle"
                  />

                  {/* Center Star Point */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={2}
                    fill="#fff"
                    opacity="0.8"
                  />

                  {showLabels && (
                    <>
                      <text
                        x={node.x}
                        y={node.y - (node.radius || 8) - 8}
                        textAnchor="middle"
                        className="node-label"
                      >
                        {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                      </text>
                      <text
                        x={node.x}
                        y={node.y - (node.radius || 8) - 22}
                        textAnchor="middle"
                        className="node-type-label"
                      >
                        {getTypeLabel(node.type)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {selectedEntity && (
        <EntityViewer
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          campaign={campaign}
          currentUserId={currentUserId}
          isDM={isDM}
          entities={entities}
        />
      )}
    </div>
  );
}
