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
  const nodePositionsRef = useRef(new Map());
  const dragStartPosRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef(null);
  const panStartOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!entities) return;

    // Get current container dimensions from ref or window
    // Use optional chaining and fallbacks to ensure we have numbers
    const width = containerRef.current?.offsetWidth || window.innerWidth || 800;
    const height = containerRef.current?.offsetHeight || window.innerHeight || 600;
    const padding = 50;

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

        const nodeId = `${entityType}-${entity.id}`;
        // Recover previous position if available, else random
        const savedPos = nodePositionsRef.current.get(nodeId);

        const node = {
          id: nodeId,
          name: entity.title || entity.name,
          type: entityType,
          data: entity,
          x: savedPos ? savedPos.x : Math.random() * (width - 100) + 50,
          y: savedPos ? savedPos.y : Math.random() * (height - 100) + 50,
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

    // Run force simulation once (static layout)
    const runSimulation = (iterations = 300, alpha = 1.0) => {
      const width = containerRef.current?.offsetWidth || window.innerWidth || 800;
      const height = containerRef.current?.offsetHeight || window.innerHeight || 600;
      const padding = 50;

      const repulsionStrength = 8000;
      const attractionStrength = 0.005;
      const centeringForce = 0.0002;
      const damping = 0.8;

      // Use current positions as starting point
      let currentNodes = [...graphNodes];

      for (let iter = 0; iter < iterations; iter++) {
        // Apply forces
        for (let i = 0; i < currentNodes.length; i++) {
          const nodeA = currentNodes[i];

          // 1. Center Gravity
          const centerX = width / 2;
          const centerY = height / 2;
          nodeA.vx += (centerX - nodeA.x) * centeringForce * alpha;
          nodeA.vy += (centerY - nodeA.y) * centeringForce * alpha;

          // 2. Repulsion & Collision
          for (let j = i + 1; j < currentNodes.length; j++) {
            const nodeB = currentNodes[j];
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distSq = dx * dx + dy * dy + 0.01;
            const dist = Math.sqrt(distSq);

            const force = (repulsionStrength / distSq) * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;

            // Strict Collision
            const minDistance = (nodeA.radius || 20) + (nodeB.radius || 20) + 10;
            if (dist < minDistance) {
              const overlap = minDistance - dist;
              const d = dist || 1;
              const push = overlap * 0.5 * alpha;
              const pushX = (dx / d) * push;
              const pushY = (dy / d) * push;

              nodeA.x -= pushX;
              nodeA.y -= pushY;
              nodeB.x += pushX;
              nodeB.y += pushY;
            }
          }
        }

        // 3. Edges
        graphEdges.forEach(edge => {
          const source = currentNodes.find(n => n.id === edge.source);
          const target = currentNodes.find(n => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const force = attractionStrength * alpha;
            const fx = dx * force;
            const fy = dy * force;
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // 4. Update
        currentNodes.forEach(node => {
          node.vx *= damping;
          node.vy *= damping;
          node.x += node.vx;
          node.y += node.vy;

          // Wall Constraints
          node.x = Math.max(padding, Math.min(width - padding, node.x));
          node.y = Math.max(padding, Math.min(height - padding, node.y));
        });
      }

      // Save and render
      currentNodes.forEach(node => {
        nodePositionsRef.current.set(node.id, { x: node.x, y: node.y });
      });
      setAllNodes([...currentNodes]);
    };

    // Initial stabilization if needed
    // Only run if we don't have positions, or if we want a quick settling
    const hasHistory = nodePositionsRef.current.size > 0;
    if (!hasHistory) {
      runSimulation(300, 1.0);
    } else {
      // Just ensuring nodes array is set
      setAllNodes(graphNodes);
    }

    // Expose spread function to parent/ref if needed, but for now we need a way to trigger it.
    // We can use a ref or a context, but simpler is to pass it down if we lifted state.
    // Since GraphControls is child, we can't easily pass this function *out* unless we define it outside effect.
    // We will move runSimulation definition outside useEffect in next step.

    setAllEdges(graphEdges);
  }, [entities, isDM, currentUserId]);

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

  // Keep refs in sync with state for use in native event handlers
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Scroll wheel zoom (native listener for passive: false)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.15, Math.min(5, currentZoom * zoomFactor));

      // Keep the point under the mouse fixed in world coordinates
      const newPanX = currentPan.x + screenX * (1 / currentZoom - 1 / newZoom);
      const newPanY = currentPan.y + screenY * (1 / currentZoom - 1 / newZoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
      zoomRef.current = newZoom;
      panRef.current = { x: newPanX, y: newPanY };
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  const handleNodeClick = (node) => {
    // Only select if we weren't dragging
    if (!isDraggingRef.current) {
      setSelectedEntity({
        type: node.type,
        data: node.data,
        name: node.name,
        displayName: node.name,
        subtitle: node.type
      });
    }
  };

  const handleNodeHover = (node) => {
    if (isDraggingRef.current) return;
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
    draggedNodeRef.current = node;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (draggedNode && svgRef.current) {
      // Node dragging
      if (dragStartPosRef.current) {
        const dist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
        if (dist > 5) {
          isDraggingRef.current = true;
        }
      }

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();

      // Convert screen coords to world coords using viewBox mapping
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldX = panRef.current.x + screenX / zoomRef.current;
      const worldY = panRef.current.y + screenY / zoomRef.current;

      const newX = Math.max(20, worldX);
      const newY = Math.max(20, worldY);

      nodePositionsRef.current.set(draggedNode.id, { x: newX, y: newY });

      setAllNodes(prev => prev.map(n =>
        n.id === draggedNode.id
          ? { ...n, x: newX, y: newY }
          : n
      ));
    } else if (isPanningRef.current && panStartRef.current) {
      // Canvas panning
      const dx = (e.clientX - panStartRef.current.x) / zoomRef.current;
      const dy = (e.clientY - panStartRef.current.y) / zoomRef.current;
      const newPan = {
        x: panStartOffsetRef.current.x - dx,
        y: panStartOffsetRef.current.y - dy
      };
      setPan(newPan);
      panRef.current = newPan;
    }
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      setDraggedNode(null);
      draggedNodeRef.current = null;
      dragStartPosRef.current = null;
      // Reset drag flag after a short delay to allow click handler to check it
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    }
    isPanningRef.current = false;
    panStartRef.current = null;
  };

  const handleZoomIn = () => {
    const w = containerRef.current?.offsetWidth || 800;
    const h = containerRef.current?.offsetHeight || 600;
    const centerX = w / 2;
    const centerY = h / 2;
    const newZoom = Math.min(zoom * 1.3, 5);
    const newPanX = pan.x + centerX * (1 / zoom - 1 / newZoom);
    const newPanY = pan.y + centerY * (1 / zoom - 1 / newZoom);
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
    zoomRef.current = newZoom;
    panRef.current = { x: newPanX, y: newPanY };
  };
  const handleZoomOut = () => {
    const w = containerRef.current?.offsetWidth || 800;
    const h = containerRef.current?.offsetHeight || 600;
    const centerX = w / 2;
    const centerY = h / 2;
    const newZoom = Math.max(zoom / 1.3, 0.15);
    const newPanX = pan.x + centerX * (1 / zoom - 1 / newZoom);
    const newPanY = pan.y + centerY * (1 / zoom - 1 / newZoom);
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
    zoomRef.current = newZoom;
    panRef.current = { x: newPanX, y: newPanY };
  };
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
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

  // Manual spread function - balanced force simulation
  const handleSpread = () => {
    const width = containerRef.current?.offsetWidth || 800;
    const height = containerRef.current?.offsetHeight || 600;
    const padding = 60;
    const nodeCount = allNodes.length;
    if (nodeCount === 0) return;

    // Clone nodes and reset velocities
    const currentNodes = allNodes.map(n => ({ ...n, vx: 0, vy: 0 }));

    // Calculate ideal spacing based on available area
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const area = usableWidth * usableHeight;
    const idealDistance = Math.sqrt(area / nodeCount) * 0.7;
    const centerX = width / 2;
    const centerY = height / 2;

    // Break up overlapping nodes with random nudges
    for (let i = 0; i < currentNodes.length; i++) {
      for (let j = i + 1; j < currentNodes.length; j++) {
        const dx = currentNodes[j].x - currentNodes[i].x;
        const dy = currentNodes[j].y - currentNodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) {
          const angle = Math.random() * Math.PI * 2;
          currentNodes[j].x += Math.cos(angle) * idealDistance * 0.5;
          currentNodes[j].y += Math.sin(angle) * idealDistance * 0.5;
        }
      }
    }

    const iterations = 200;
    const repulsionStrength = idealDistance * idealDistance;
    const attractionStrength = 0.008;
    const centeringForce = 0.003;
    const damping = 0.85;

    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1.0 - (iter / iterations) * 0.7;

      for (let i = 0; i < currentNodes.length; i++) {
        const nodeA = currentNodes[i];

        // Centering force - pull toward center to prevent wall stacking
        nodeA.vx += (centerX - nodeA.x) * centeringForce * alpha;
        nodeA.vy += (centerY - nodeA.y) * centeringForce * alpha;

        // Repulsion between all pairs
        for (let j = i + 1; j < currentNodes.length; j++) {
          const nodeB = currentNodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);

          const force = (repulsionStrength / distSq) * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;

          // Hard collision prevention
          const minDist = (nodeA.radius || 12) + (nodeB.radius || 12) + 30;
          if (dist < minDist) {
            const push = (minDist - dist) * 0.3;
            const px = (dx / dist) * push;
            const py = (dy / dist) * push;
            nodeA.x -= px;
            nodeA.y -= py;
            nodeB.x += px;
            nodeB.y += py;
          }
        }
      }

      // Edge attraction - keep connected nodes at reasonable distance
      allEdges.forEach(edge => {
        const source = currentNodes.find(n => n.id === edge.source);
        const target = currentNodes.find(n => n.id === edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const displacement = dist - idealDistance * 0.6;
          const force = displacement * attractionStrength * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // Update positions with soft boundary forces (not hard clamping)
      currentNodes.forEach(node => {
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;

        const boundaryForce = 0.5 * alpha;
        if (node.x < padding) node.vx += (padding - node.x) * boundaryForce;
        if (node.x > width - padding) node.vx += (width - padding - node.x) * boundaryForce;
        if (node.y < padding) node.vy += (padding - node.y) * boundaryForce;
        if (node.y > height - padding) node.vy += (height - padding - node.y) * boundaryForce;
      });
    }

    // Final gentle clamp to ensure nothing is off-screen
    currentNodes.forEach(node => {
      node.x = Math.max(30, Math.min(width - 30, node.x));
      node.y = Math.max(30, Math.min(height - 30, node.y));
      nodePositionsRef.current.set(node.id, { x: node.x, y: node.y });
    });

    setAllNodes([...currentNodes]);

    // Reset view to see all nodes
    setZoom(1);
    setPan({ x: 0, y: 0 });
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
  };

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
        onSpread={handleSpread}
        onExport={handleExportSVG}
      />

      <div className="graph-canvas" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${pan.x} ${pan.y} ${(containerRef.current?.offsetWidth || 800) / zoom} ${(containerRef.current?.offsetHeight || 600) / zoom}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseDown={(e) => {
            if (e.button === 0) {
              isPanningRef.current = true;
              panStartRef.current = { x: e.clientX, y: e.clientY };
              panStartOffsetRef.current = { ...panRef.current };
            }
          }}
        >
          <defs>
            {/* Star glow filter - enhanced bloom for nodes */}
            <filter id="star-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feGaussianBlur stdDeviation="2" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Edge glow filter - softer diffuse glow */}
            <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="edgeBlur" />
              <feMerge>
                <feMergeNode in="edgeBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Spike glow filter - subtle bloom on diffraction spikes */}
            <filter id="spike-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="spikeBlur" />
              <feMerge>
                <feMergeNode in="spikeBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Per-edge gradients */}
            {displayEdges.map((edge) => {
              const source = displayNodes.find(n => n.id === edge.source);
              const target = displayNodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              const sourceColor = getNodeColor(source.type);
              const targetColor = getNodeColor(target.type);
              return (
                <linearGradient
                  key={`grad-${edge.id}`}
                  id={`edge-grad-${edge.id}`}
                  x1={source.x} y1={source.y}
                  x2={target.x} y2={target.y}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor={sourceColor} />
                  <stop offset="100%" stopColor={targetColor} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Edges */}
          <g className="edges">
            {displayEdges.map((edge) => {
              const source = displayNodes.find(n => n.id === edge.source);
              const target = displayNodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              const strength = edgeStrengthMap.get(edge.id) || 1;
              const isHighlighted = highlightedEdges.includes(edge.id);
              const strokeWidth = Math.min(3, 0.5 + strength * 0.4);
              const opacity = isHighlighted ? 0.9 : (0.15 + (strength * 0.05));
              const gradientUrl = `url(#edge-grad-${edge.id})`;

              return (
                <g key={edge.id} className={`edge-group${isHighlighted ? ' edge-highlighted' : ''}`}>
                  {/* Glow underlay - wider, blurred */}
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#fbbf24' : gradientUrl}
                    strokeWidth={isHighlighted ? strokeWidth * 4 : strokeWidth * 3}
                    opacity={isHighlighted ? 0.4 : opacity * 0.5}
                    filter="url(#edge-glow)"
                    className="edge-glow-line"
                  />
                  {/* Main crisp line */}
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#fbbf24' : gradientUrl}
                    strokeWidth={isHighlighted ? strokeWidth * 1.5 : strokeWidth}
                    opacity={opacity}
                    className="edge-main-line"
                  />
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {displayNodes.map((node, index) => {
              const baseColor = getNodeColor(node.type);
              const r = node.radius || 8;
              // Pseudo-random delay based on node id hash
              const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
              const twinkleDelay = (hash % 40) / 10; // 0-4s delay
              const sparkleDelay = ((hash * 7) % 30) / 10; // 0-3s delay
              const twinkleDuration = 3 + (hash % 20) / 10; // 3-5s
              const sparkleDuration = 2 + ((hash * 3) % 20) / 10; // 2-4s
              const spikeLength = r * 2.2;

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
                  {/* 1. Soft halo - large ambient glow */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r * 3}
                    fill={baseColor}
                    opacity="0.08"
                    className="star-halo"
                  />

                  {/* 2. Twinkle halo - pulsing ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r * 2}
                    fill={baseColor}
                    opacity="0.2"
                    className="star-twinkle"
                    style={{
                      animationDelay: `${twinkleDelay}s`,
                      animationDuration: `${twinkleDuration}s`
                    }}
                  />

                  {/* 3. Diffraction spikes - classic 4-point star cross */}
                  <g className="star-spikes" filter="url(#spike-glow)">
                    {/* Vertical spike */}
                    <line
                      x1={node.x} y1={node.y - spikeLength}
                      x2={node.x} y2={node.y + spikeLength}
                      stroke={baseColor}
                      strokeWidth="1"
                      opacity="0.5"
                      className="spike-line"
                    />
                    {/* Horizontal spike */}
                    <line
                      x1={node.x - spikeLength} y1={node.y}
                      x2={node.x + spikeLength} y2={node.y}
                      stroke={baseColor}
                      strokeWidth="1"
                      opacity="0.5"
                      className="spike-line"
                    />
                    {/* Diagonal spike (45 deg) */}
                    <line
                      x1={node.x - spikeLength * 0.6} y1={node.y - spikeLength * 0.6}
                      x2={node.x + spikeLength * 0.6} y2={node.y + spikeLength * 0.6}
                      stroke={baseColor}
                      strokeWidth="0.5"
                      opacity="0.25"
                      className="spike-line-minor"
                    />
                    {/* Diagonal spike (135 deg) */}
                    <line
                      x1={node.x + spikeLength * 0.6} y1={node.y - spikeLength * 0.6}
                      x2={node.x - spikeLength * 0.6} y2={node.y + spikeLength * 0.6}
                      stroke={baseColor}
                      strokeWidth="0.5"
                      opacity="0.25"
                      className="spike-line-minor"
                    />
                  </g>

                  {/* 4. Core glow - main colored body */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={baseColor}
                    filter="url(#star-glow)"
                    className="node-circle"
                  />

                  {/* 5. Bright center - white hot core */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r * 0.4}
                    fill="#fff"
                    opacity="0.7"
                    className="star-center"
                    style={{
                      animationDelay: `${sparkleDelay}s`,
                      animationDuration: `${sparkleDuration}s`
                    }}
                  />

                  {/* 6. Sparkle point - tiny bright dot */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={1.5}
                    fill="#fff"
                    opacity="1"
                    className="star-sparkle"
                  />

                  {showLabels && (
                    <>
                      <text
                        x={node.x}
                        y={node.y - r - 8}
                        textAnchor="middle"
                        className="node-label"
                      >
                        {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                      </text>
                      <text
                        x={node.x}
                        y={node.y - r - 22}
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
