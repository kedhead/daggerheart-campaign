import { useState, useEffect, useRef } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import EntityViewer from '../EntityViewer/EntityViewer';
import './RelationshipGraph.css';

export default function RelationshipGraph({ campaign, entities, isDM, currentUserId }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Entity type colors
  const typeColors = {
    npc: '#f59e0b',        // Orange
    location: '#3b82f6',   // Blue
    lore: '#8b5cf6',       // Purple
    session: '#22c55e',    // Green
    timelineEvent: '#ec4899', // Pink
    encounter: '#ef4444',  // Red
    note: '#64748b'        // Gray
  };

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
        nodeMap.set(entity.title || entity.name, node);
      });
    });

    // Create edges based on wiki links
    graphNodes.forEach(node => {
      const texts = getEntityTexts(node.data, node.type);
      texts.forEach(text => {
        const links = extractLinks(text);
        links.forEach(linkName => {
          const targetNode = nodeMap.get(linkName);
          if (targetNode && targetNode.id !== node.id) {
            graphEdges.push({
              source: node.id,
              target: targetNode.id
            });
          }
        });
      });
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
            const distSq = dx * dx + dy * dy + 0.01; // Avoid division by zero
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
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [entities]);

  const handleNodeClick = (node) => {
    setSelectedEntity({
      type: node.type,
      data: node.data,
      name: node.name,
      displayName: node.name,
      subtitle: node.type
    });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!entities || nodes.length === 0) {
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
            {nodes.length} entities, {edges.length} connections
          </p>
        </div>
        <div className="graph-controls">
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

      <div className="graph-legend">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-color" style={{ background: color }}></span>
            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </div>
        ))}
      </div>

      <div className="graph-canvas" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height="600"
          viewBox={`${-pan.x} ${-pan.y} ${800 / zoom} ${600 / zoom}`}
          style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}
        >
          {/* Edges */}
          <g className="edges">
            {edges.map((edge, index) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              return (
                <line
                  key={index}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity="0.3"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {nodes.map((node) => (
              <g
                key={node.id}
                className="node"
                onClick={() => handleNodeClick(node)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill={typeColors[node.type] || '#64748b'}
                  stroke="var(--bg-primary)"
                  strokeWidth="2"
                  className="node-circle"
                />
                <text
                  x={node.x}
                  y={node.y - 12}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="500"
                  className="node-label"
                >
                  {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                </text>
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
        />
      )}
    </div>
  );
}
