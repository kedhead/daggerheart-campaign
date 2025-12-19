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
      const entityArray = entities[entityKey] || [];
      const entityType = entityTypeMap[entityKey];

      entityArray.forEach(entity => {
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

  if (!entities || allNodes.length === 0) {
    return (
      <div className="relationship-graph-empty card">
        <Network size={64} />
        <h3>No Relationships Yet</h3>
        <p>Start creating wiki links between entities to see the relationship graph.</p>
        <p className="graph-hint">Use <code>[[Entity Name]]</code> in any text field to create connections.</p>
      </div>
    );
  }

  return (
    <div className="relationship-graph-container">
      <div className="graph-header">
        <div>
          <h2>
            <Network size={24} />
            Entity Relationship Graph
          </h2>
          <p className="graph-subtitle">
            {displayNodes.length} entities, {displayEdges.length} connections
            {focusNode && ' (focused)'}
          </p>
        </div>
        <div className="graph-controls">
          <button className="btn btn-icon" onClick={handleExportSVG} title="Export SVG">
            <Download size={20} />
          </button>
          <button className="btn btn-icon" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut size={20} />
          </button>
          <button className="btn btn-icon" onClick={handleReset} title="Reset view">
            <Maximize2 size={20} />
          </button>
          <button className="btn btn-icon" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      <GraphControls
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        focusNode={focusNode}
        setFocusNode={setFocusNode}
      />

      <div className="graph-canvas" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height="600"
          viewBox={`${-pan.x} ${-pan.y} ${800 / zoom} ${600 / zoom}`}
          style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Edges */}
          <g className="edges">
            {displayEdges.map((edge) => {
              const source = displayNodes.find(n => n.id === edge.source);
              const target = displayNodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              const strength = edgeStrengthMap.get(edge.id) || 1;
              const isHighlighted = highlightedEdges.includes(edge.id);
              const strokeWidth = Math.min(5, 1 + strength * 0.5);
              const opacity = isHighlighted ? 0.8 : (0.3 + (strength * 0.05));

              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? 'var(--hope-color)' : 'var(--border)'}
                  strokeWidth={isHighlighted ? strokeWidth * 2 : strokeWidth}
                  opacity={opacity}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {displayNodes.map((node) => (
              <g
                key={node.id}
                className="node"
                onClick={() => handleNodeClick(node)}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onMouseEnter={() => handleNodeHover(node)}
                onMouseLeave={handleNodeLeave}
                style={{ cursor: draggedNode?.id === node.id ? 'grabbing' : 'grab' }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius || 8}
                  fill={getNodeColor(node.type)}
                  stroke="var(--bg-primary)"
                  strokeWidth="2"
                  className="node-circle"
                />
                {showLabels && (
                  <>
                    <text
                      x={node.x}
                      y={node.y - (node.radius || 8) - 4}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize="11"
                      fontWeight="500"
                      className="node-label"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                    </text>
                    <text
                      x={node.x}
                      y={node.y - (node.radius || 8) - 18}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="9"
                      className="node-type-label"
                      style={{ pointerEvents: 'none' }}
                    >
                      {getTypeLabel(node.type)}
                    </text>
                  </>
                )}
              </g>
            ))}
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
