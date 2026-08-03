import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Network, Sparkles, X } from 'lucide-react';
import EntityViewer from '../EntityViewer/EntityViewer';
import GraphControls from './GraphControls';
import {
  buildGraphEdges,
  calculateNodeImportance,
  filterGraphByTypes,
  filterIsolatedNodes,
  findConnectedComponent,
  getNodeColor,
  getTypeLabel,
  labelVisibleFor,
  MIN_TAP_RADIUS_PX
} from '../../utils/graphCalculations';
import { useIsMobile } from '../../hooks/useIsMobile';
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
  // Unconnected nodes carry no information the map exists to show — they are
  // just a cloud of specks around the edge. Hidden by default, with the count
  // reported in the subtitle so nothing disappears unexplained.
  const [hideUnlinked, setHideUnlinked] = useState(true);
  const [hiddenCount, setHiddenCount] = useState(0);
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
  const displayEdgesRef = useRef([]);
  const focusNodeRef = useRef(null);
  const needsFitRef = useRef(true);

  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  // The graph is a `touch-action: none` canvas sized to most of the viewport.
  // Inline in the Dashboard's scrolling <main> on a phone, it spans the full
  // column and swallows every vertical swipe, so the whole page stops
  // scrolling once it comes into view. On mobile it therefore renders as a
  // preview card until tapped, and the live canvas only exists inside the
  // full-screen overlay, where owning the gestures is the point.
  const showCanvas = !isMobile || expanded;

  // The canvas only exists once there are nodes (the empty state renders
  // instead) — every container listener must (re)attach when this flips.
  const hasGraph = !!entities && allNodes.length > 0 && showCanvas;

  // Edge rendering walks every edge twice (gradient defs, then the lines) and
  // used to `.find()` both endpoints each time — O(E·N) per frame, and the
  // graph re-renders on every pan and pinch frame. Index once instead.
  const nodeById = useMemo(() => {
    const map = new Map();
    displayNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [displayNodes]);
  const highlightedEdgeSet = useMemo(() => new Set(highlightedEdges), [highlightedEdges]);

  // Measured container size, driving the viewBox. Measured in a LAYOUT effect
  // so it lands before the browser paints — reading containerRef during render
  // yields null on the mount pass, which used to paint one frame at a
  // hardcoded 800x600 and visibly jump on a 390px phone.
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!hasGraph) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => {
      const node = containerRef.current;
      if (!node) return;
      setViewportSize(prev => {
        const w = node.offsetWidth || prev.w;
        const h = node.offsetHeight || prev.h;
        return prev.w === w && prev.h === h ? prev : { w, h };
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    // Rotation and the on-screen keyboard both resize us.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasGraph]);

  // Opening or closing the overlay hands the canvas a completely different
  // viewport, so the previous zoom/pan is meaningless — re-fit on the next
  // measured frame. Also stop the page behind the overlay from scrolling.
  useEffect(() => {
    needsFitRef.current = true;
    if (!expanded) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

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
    const nodeMap = new Map();

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

    // Edges come from typed [[links]] plus names recognised in the prose —
    // see buildGraphEdges for why inference is needed at all.
    const { edges: graphEdges, strengthMap } = buildGraphEdges(graphNodes);

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

    // Order matters: isolation is judged against the types you kept, so a node
    // whose only partner was just filtered out counts as unlinked. Runs before
    // focus, because a focused component is connected by definition.
    let hidden = 0;
    if (hideUnlinked) {
      const pruned = filterIsolatedNodes(nodes, edges);
      nodes = pruned.nodes;
      edges = pruned.edges;
      hidden = pruned.hiddenCount;
    }
    setHiddenCount(hidden);

    // Apply focus mode if a node is selected
    if (focusNode) {
      const focused = findConnectedComponent(focusNode, nodes, edges);
      nodes = focused.nodes;
      edges = focused.edges;
    }

    setDisplayNodes(nodes);
    setDisplayEdges(edges);
    displayNodesRef.current = nodes;
  }, [allNodes, allEdges, selectedTypes, focusNode, hideUnlinked]);

  // Keep refs in sync with state for use in native event handlers
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { focusNodeRef.current = focusNode; }, [focusNode]);
  useEffect(() => { displayEdgesRef.current = displayEdges; }, [displayEdges]);

  // Entering or leaving focus changes which nodes are on screen, so re-fit to
  // whatever is left — on a phone this is what turns "a cloud of specks" into
  // "this thing and the four things it touches".
  const prevFocusRef = useRef(null);
  useEffect(() => {
    if (prevFocusRef.current !== focusNode) {
      prevFocusRef.current = focusNode;
      needsFitRef.current = true;
    }
  }, [focusNode]);

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
  }, [hasGraph, displayNodes, expanded, viewportSize]);

  const handleNodeHover = (node) => {
    if (isDraggingRef.current) return;
    // Read through the ref: this is also called from the native pointer
    // handler, whose closure would otherwise hold a stale edge list.
    const connected = displayEdgesRef.current.filter(e =>
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

      tapRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false, pointerType: e.pointerType };
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
          const openEntity = () => setSelectedEntity({
            type: node.type,
            data: node.data,
            name: node.name,
            displayName: node.name,
            subtitle: node.type
          });

          // Touch has no hover, so a tap used to jump straight past the whole
          // point of a relationship map — seeing what a thing connects to.
          // First tap lights up the node's links; tapping it again opens it.
          // A mouse keeps its old behaviour, since hover already reveals links.
          if (tap.pointerType === 'mouse') {
            openEntity();
          } else if (focusNodeRef.current === node.id) {
            openEntity();
          } else {
            handleNodeHover(node);
            focusNodeRef.current = node.id;
            setFocusNode(node.id);
          }
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
      <div className="relationship-graph-container is-empty">
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

  // On mobile the live canvas is only mounted inside the overlay, so the
  // Dashboard shows this instead and keeps scrolling.
  if (!showCanvas) {
    const typeCounts = {};
    displayNodes.forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });
    const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

    return (
      <button
        type="button"
        className="relationship-graph-preview"
        onClick={() => setExpanded(true)}
      >
        <span className="preview-glyph" aria-hidden="true">
          <Network size={30} />
        </span>
        <span className="preview-body">
          <span className="preview-title">The Constellation</span>
          <span className="preview-meta">
            {displayNodes.length} {displayNodes.length === 1 ? 'body' : 'bodies'}
            {' · '}
            {displayEdges.length} {displayEdges.length === 1 ? 'link' : 'links'}
          </span>
          {topTypes.length > 0 && (
            <span className="preview-types">
              {topTypes.map(([type, count]) => (
                <span key={type} className="preview-chip">
                  <i style={{ background: getNodeColor(type) }} />
                  {count} {getTypeLabel(type)}
                </span>
              ))}
            </span>
          )}
        </span>
        <span className="preview-cta">
          <Sparkles size={16} />
          Tap to explore
        </span>
      </button>
    );
  }

  const graph = (
    <div className={`relationship-graph-container${expanded ? ' is-expanded' : ''}`}>
      {expanded && (
        <button
          type="button"
          className="graph-close-expanded"
          onClick={() => setExpanded(false)}
          aria-label="Close the constellation"
        >
          <X size={20} />
        </button>
      )}
      <GraphControls
        expanded={expanded}
        onToggleExpand={() => setExpanded(v => !v)}
        header={
          <div className="graph-header-content">
            <h2>
              <Network size={28} />
              The Constellation
            </h2>
            <p className="graph-subtitle">
              {displayNodes.length} Celestial Bodies
              {hiddenCount > 0 && ` · ${hiddenCount} unlinked hidden`}
              {focusNode && ' (Focused View)'}
            </p>
          </div>
        }
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        hideUnlinked={hideUnlinked}
        setHideUnlinked={setHideUnlinked}
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
          // Everything inside is in world units, so text scales with zoom.
          // The stylesheet multiplies its font sizes by this so labels keep a
          // constant SCREEN size — as a CSS var rather than an inline
          // font-size, so the :hover enlargement still wins.
          style={{ '--label-scale': 1 / zoom }}
          viewBox={`${pan.x} ${pan.y} ${Math.max(1, viewportSize.w) / zoom} ${Math.max(1, viewportSize.h) / zoom}`}
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
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
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
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
              if (!source || !target) return null;

              const strength = edgeStrengthMap.get(edge.id) || 1;
              const isHighlighted = highlightedEdgeSet.has(edge.id);
              const isInferred = !!edge.inferred;
              const strokeWidth = Math.min(3, 0.5 + strength * 0.4);
              const opacity = isHighlighted ? 0.9 : (0.15 + (strength * 0.05));
              const gradientUrl = `url(#edge-grad-${edge.id})`;

              return (
                <g
                  key={edge.id}
                  className={`edge-group${isHighlighted ? ' edge-highlighted' : ''}${isInferred ? ' edge-inferred' : ''}`}
                >
                  {/* Glow underlay - wider, blurred. Skipped for inferred
                      edges: the bloom is what makes a line read as solid, and
                      a guess should not look as certain as a typed link. */}
                  {!isInferred && (
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isHighlighted ? '#fbbf24' : gradientUrl}
                      strokeWidth={isHighlighted ? strokeWidth * 4 : strokeWidth * 3}
                      vectorEffect="non-scaling-stroke"
                      opacity={isHighlighted ? 0.4 : opacity * 0.5}
                      filter="url(#edge-glow)"
                      className="edge-glow-line"
                    />
                  )}
                  {/* Main crisp line. The dash is in screen px because
                      non-scaling-stroke measures the stroke in screen px —
                      a world-space dash would dissolve as you zoom out. */}
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#fbbf24' : gradientUrl}
                    strokeWidth={isHighlighted ? strokeWidth * 1.5 : strokeWidth}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray={isInferred ? '4 4' : undefined}
                    opacity={isInferred ? opacity * 0.7 : opacity}
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
                  {/* 0. Invisible touch target. In world units, so it shrinks
                      with zoom — at a phone's fit zoom a flat 22 rendered
                      ~7-13px across. Counter-scaling keeps it ≥44px on screen
                      (Apple/Google minimum) whatever the zoom. */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={Math.max(r * 2, MIN_TAP_RADIUS_PX / zoom)}
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
                      vectorEffect="non-scaling-stroke"
                      opacity="0.5"
                      className="spike-line"
                    />
                    {/* Horizontal spike */}
                    <line
                      x1={node.x - spikeLength} y1={node.y}
                      x2={node.x + spikeLength} y2={node.y}
                      stroke={baseColor}
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      opacity="0.5"
                      className="spike-line"
                    />
                    {/* Diagonal spike (45 deg) */}
                    <line
                      x1={node.x - spikeLength * 0.6} y1={node.y - spikeLength * 0.6}
                      x2={node.x + spikeLength * 0.6} y2={node.y + spikeLength * 0.6}
                      stroke={baseColor}
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                      opacity="0.25"
                      className="spike-line-minor"
                    />
                    {/* Diagonal spike (135 deg) */}
                    <line
                      x1={node.x + spikeLength * 0.6} y1={node.y - spikeLength * 0.6}
                      x2={node.x - spikeLength * 0.6} y2={node.y + spikeLength * 0.6}
                      stroke={baseColor}
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
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

                  {/* Labels sit in world units inside the viewBox, so at the
                      fit zoom a phone settles on (~0.29, or the 0.15 floor for
                      a big campaign) a 10px label rendered under 3px. Font
                      sizes counter-scale by 1/zoom to stay constant on screen;
                      the cull below then keeps them from overlapping. */}
                  {showLabels && labelVisibleFor(node, zoom) && (
                    <>
                      <text
                        x={node.x}
                        y={node.y - r - 8 / zoom}
                        textAnchor="middle"
                        className="node-label"
                      >
                        {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                      </text>
                      {zoom >= 0.7 && (
                        <text
                          x={node.x}
                          y={node.y - r - 22 / zoom}
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

  // Fixed positioning is enough on its own, but the Dashboard card that hosts
  // the graph is `overflow-hidden`, so portal out rather than depend on no
  // ancestor ever growing a transform.
  return expanded ? createPortal(graph, document.body) : graph;
}
