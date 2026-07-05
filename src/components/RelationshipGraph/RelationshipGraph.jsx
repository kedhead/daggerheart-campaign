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

// The layout runs in a virtual world sized by node count, NOT the container.
// On phones the container is tiny; cramming the simulation into it stacked
// every node against the walls. fitToView() maps the world to the screen.
const layoutSizeFor = (count) => Math.max(900, Math.ceil(Math.sqrt(Math.max(1, count))) * 170);

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
  const panStartRef = useRef(null);
  const panStartOffsetRef = useRef({ x: 0, y: 0 });
  // Pointer/touch interaction state
  const pointersRef = useRef(new Map()); // pointerId → {x, y} in container coords
  const modeRef = useRef(null); // 'node' | 'pan' | 'pinch' | null
  const pinchRef = useRef(null);
  const tapRef = useRef(null);
  const displayNodesRef = useRef([]);
  const needsFitRef = useRef(true);

  // The canvas only exists once there are nodes (the empty state renders
  // instead) — every container listener must (re)attach when this flips.
  const hasGraph = !!entities && allNodes.length > 0;

  // Re-render on container resize (rotation, keyboard) so the viewBox tracks it
  const [, setViewportTick] = useState(0);
  useEffect(() => {
    if (!hasGraph || !containerRef.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setViewportTick(t => t + 1));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [hasGraph]);

  // Fit the whole constellation (or the given nodes) on screen
  const fitToView = (nodesArg) => {
    const list = (nodesArg && nodesArg.length ? nodesArg : displayNodesRef.current) || [];
    if (!list.length || !containerRef.current) return;
    const cw = containerRef.current.offsetWidth || 800;
    const ch = containerRef.current.offsetHeight || 600;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    list.forEach(n => {
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
    });
    const pad = 70;
    const bw = Math.max(1, maxX - minX + pad * 2);
    const bh = Math.max(1, maxY - minY + pad * 2);
    const newZoom = Math.max(0.15, Math.min(2, Math.min(cw / bw, ch / bh)));
    const newPan = {
      x: (minX - pad) - (cw / newZoom - bw) / 2,
      y: (minY - pad) - (ch / newZoom - bh) / 2,
    };
    setZoom(newZoom);
    setPan(newPan);
    zoomRef.current = newZoom;
    panRef.current = newPan;
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
        texts.push(entity.description, entity.notes, entity.firstMet, entity.location);
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
        // Recover previous position if available; random positions are
        // assigned below once the virtual world size is known.
        const savedPos = nodePositionsRef.current.get(nodeId);

        const node = {
          id: nodeId,
          name: entity.title || entity.name,
          type: entityType,
          data: entity,
          x: savedPos ? savedPos.x : null,
          y: savedPos ? savedPos.y : null,
          vx: 0,
          vy: 0
        };
        graphNodes.push(node);
        nodeMap.set((entity.title || entity.name).toLowerCase(), node);
      });
    });

    // Seed unplaced nodes randomly inside the virtual layout world
    const worldSize = layoutSizeFor(graphNodes.length);
    graphNodes.forEach(node => {
      if (node.x == null) {
        node.x = Math.random() * (worldSize - 160) + 80;
        node.y = Math.random() * (worldSize - 160) + 80;
      }
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

    // Run force simulation once (static layout) inside the virtual world
    const runSimulation = (iterations = 300, alpha = 1.0) => {
      const width = worldSize;
      const height = worldSize;
      const padding = 60;

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
      return currentNodes;
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
    // Fit the whole constellation on screen once the canvas mounts (the
    // deferred-fit effect handles it — the container isn't rendered yet here).
    needsFitRef.current = true;

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
    displayNodesRef.current = nodes;
  }, [allNodes, allEdges, selectedTypes, focusNode]);

  // Keep refs in sync with state for use in native event handlers
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Scroll wheel zoom (native listener for passive: false)
  useEffect(() => {
    if (!hasGraph) return;
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
  }, [hasGraph]);

  // Deferred fit-to-view: the entities effect lays out nodes while the empty
  // state is still showing (no container yet), so the actual fit runs here once
  // the canvas has mounted.
  useEffect(() => {
    if (hasGraph && needsFitRef.current && containerRef.current) {
      needsFitRef.current = false;
      fitToView(displayNodesRef.current);
    }
  }, [hasGraph, displayNodes]);

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

  // Unified pointer interaction: works for mouse AND touch.
  // 1 pointer on a node → drag it (or tap to open) · 1 pointer on space → pan
  // 2 pointers → pinch-zoom around the midpoint
  useEffect(() => {
    if (!hasGraph) return;
    const container = containerRef.current;
    if (!container) return;

    const getPos = (e) => {
      const rect = container.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { container.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      pointersRef.current.set(e.pointerId, getPos(e));

      if (pointersRef.current.size === 2) {
        const [p1, p2] = [...pointersRef.current.values()];
        pinchRef.current = {
          startDist: Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1,
          startZoom: zoomRef.current,
          startPan: { ...panRef.current },
          startMid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        };
        modeRef.current = 'pinch';
        draggedNodeRef.current = null;
        setDraggedNode(null);
        tapRef.current = null;
        return;
      }

      tapRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false };
      const nodeEl = e.target.closest?.('[data-node-id]');
      if (nodeEl) {
        const node = displayNodesRef.current.find(n => n.id === nodeEl.getAttribute('data-node-id'));
        if (node) {
          modeRef.current = 'node';
          draggedNodeRef.current = node;
          setDraggedNode(node);
          return;
        }
      }
      modeRef.current = 'pan';
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panStartOffsetRef.current = { ...panRef.current };
    };

    const onPointerMove = (e) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, getPos(e));

      if (modeRef.current === 'pinch' && pointersRef.current.size >= 2) {
        const [p1, p2] = [...pointersRef.current.values()];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const { startDist, startZoom, startPan, startMid } = pinchRef.current;
        const newZoom = Math.max(0.15, Math.min(5, startZoom * (dist / startDist)));
        // Keep the world point under the initial midpoint pinned under the current one
        const worldMid = { x: startPan.x + startMid.x / startZoom, y: startPan.y + startMid.y / startZoom };
        const newPan = { x: worldMid.x - mid.x / newZoom, y: worldMid.y - mid.y / newZoom };
        setZoom(newZoom);
        setPan(newPan);
        zoomRef.current = newZoom;
        panRef.current = newPan;
        return;
      }

      if (tapRef.current && !tapRef.current.moved &&
          Math.hypot(e.clientX - tapRef.current.x, e.clientY - tapRef.current.y) > 6) {
        tapRef.current.moved = true;
        isDraggingRef.current = true;
      }

      if (modeRef.current === 'node' && draggedNodeRef.current && tapRef.current?.moved) {
        const pos = getPos(e);
        const worldX = panRef.current.x + pos.x / zoomRef.current;
        const worldY = panRef.current.y + pos.y / zoomRef.current;
        const nodeId = draggedNodeRef.current.id;
        nodePositionsRef.current.set(nodeId, { x: worldX, y: worldY });
        setAllNodes(prev => prev.map(n =>
          n.id === nodeId ? { ...n, x: worldX, y: worldY } : n
        ));
      } else if (modeRef.current === 'pan' && panStartRef.current) {
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

    const endPointer = (e) => {
      pointersRef.current.delete(e.pointerId);

      if (modeRef.current === 'pinch') {
        if (pointersRef.current.size < 2) {
          modeRef.current = null;
          pinchRef.current = null;
        }
      } else if (modeRef.current === 'node') {
        const node = draggedNodeRef.current;
        const tap = tapRef.current;
        if (node && tap && !tap.moved && Date.now() - tap.t < 600) {
          setSelectedEntity({
            type: node.type,
            data: node.data,
            name: node.name,
            displayName: node.name,
            subtitle: node.type
          });
        }
      }

      if (pointersRef.current.size === 0) {
        modeRef.current = null;
        draggedNodeRef.current = null;
        setDraggedNode(null);
        panStartRef.current = null;
        tapRef.current = null;
        setTimeout(() => { isDraggingRef.current = false; }, 50);
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', endPointer);
    container.addEventListener('pointercancel', endPointer);
    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', endPointer);
      container.removeEventListener('pointercancel', endPointer);
    };
  }, [hasGraph]);

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
    setFocusNode(null);
    const { nodes } = filterGraphByTypes(allNodes, allEdges, selectedTypes);
    fitToView(nodes);
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

  // Manual spread function - balanced force simulation in the virtual world
  const handleSpread = () => {
    const nodeCount = allNodes.length;
    if (nodeCount === 0) return;
    const width = layoutSizeFor(nodeCount);
    const height = width;
    const padding = 60;

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
    fitToView(currentNodes);
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
                  data-node-id={node.id}
                  onMouseEnter={() => handleNodeHover(node)}
                  onMouseLeave={handleNodeLeave}
                  style={{
                    cursor: draggedNode?.id === node.id ? 'grabbing' : 'grab',
                    '--node-color': baseColor
                  }}
                >
                  {/* 0. Invisible touch target — keeps taps easy on phones */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={Math.max(r * 2, 22)}
                    fill="transparent"
                    pointerEvents="all"
                  />

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

                  {/* Labels: at low zoom only important nodes keep a name so the
                      map doesn't turn into overlapping text; type tags need
                      more zoom still. */}
                  {showLabels && (zoom >= 0.7 || (node.importance || 0) >= 3) && (
                    <>
                      <text
                        x={node.x}
                        y={node.y - r - 8}
                        textAnchor="middle"
                        className="node-label"
                      >
                        {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                      </text>
                      {zoom >= 0.7 && (
                        <text
                          x={node.x}
                          y={node.y - r - 22}
                          textAnchor="middle"
                          className="node-type-label"
                        >
                          {getTypeLabel(node.type)}
                        </text>
                      )}
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
