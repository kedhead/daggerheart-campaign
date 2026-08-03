/**
 * Graph calculation utilities for relationship graph visualization
 */

import { autoLinkText } from './autoLinkText';

/** Pull `[[Wiki Link]]` targets out of a block of text. */
export function extractWikiLinks(text) {
  if (typeof text !== 'string') return [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links = [];
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    links.push(match[1]);
  }
  return links;
}

/**
 * The linkable text fields for each entity type.
 *
 * These must stay in step with the WikiLinkInput fields in each entity's form —
 * a field that accepts `[[links]]` but is missing here silently drops them,
 * which is exactly what happened to an encounter's `environment`.
 */
export function entityTextsFor(entity, type) {
  const texts = [];
  if (!entity) return texts;

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
    // `enemies` only exists on hand-written encounters — the Encounter Builder
    // replaces it with structured adversarySlots, which is why builder-made
    // encounters have so little prose to link from.
    texts.push(entity.description, entity.enemies, entity.environment, entity.tactics, entity.rewards);
  } else if (type === 'note') {
    texts.push(entity.content);
  }

  // Keep only real strings so a structured array can never be regex-matched
  // as "[object Object]".
  return texts.filter(t => typeof t === 'string' && t.length > 0);
}

/** Inferred edges are guesses, so they weigh less than a link someone typed. */
export const INFERRED_EDGE_WEIGHT = 0.5;

/**
 * `autoLinkText`'s 3-character floor is right for an interactive button, where
 * you see the result and can undo it. It is too loose for silent inference: on
 * a real campaign it hung a spoke off every passing mention, and the map filled
 * with faint one-off connections nobody meant.
 */
export const INFERENCE_MIN_NAME_LENGTH = 6;

/**
 * Whether a name occurring in some text is strong enough to infer a link.
 *
 * A multi-word name ("Thornwood Bridge", "Korvus Thal") is distinctive — one
 * mention is a real reference. A single word ("Sagewilds", "Jeff") is the
 * dangerous case, because it also occurs as ordinary prose, so it has to earn
 * the edge by appearing more than once.
 */
export function isInferrableMention(name, text) {
  if (typeof name !== 'string' || typeof text !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < INFERENCE_MIN_NAME_LENGTH) return false;
  if (/\s/.test(trimmed)) return true;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = text.match(new RegExp(`\\b${escaped}\\b`, 'gi'));
  return (matches ? matches.length : 0) >= 2;
}

/**
 * Build the edge list for a set of nodes.
 *
 * Two sources. Typed `[[links]]` used to be the only one, which left whole
 * entity types floating unconnected — encounters worst of all, since the things
 * they really point at (adversaries, environments) are not node types here. So
 * an edge is also inferred when one entity's text names another, using the same
 * matching the forms' auto-link button applies: whole words, case-insensitive,
 * a 3-character floor, longest name first, existing links left alone.
 *
 * @param {Array} nodes - Nodes with { id, name, type, data }
 * @returns {Object} { edges, strengthMap } — edges carry `inferred: boolean`
 */
export function buildGraphEdges(nodes) {
  const edges = [];
  const edgeById = new Map();
  const strengthMap = new Map();

  const nodeMap = new Map();
  nodes.forEach(node => {
    if (node?.name) nodeMap.set(node.name.toLowerCase(), node);
  });
  const canonicalNames = nodes.map(n => n?.name).filter(Boolean);

  const addEdge = (node, targetNode, inferred) => {
    if (!targetNode || targetNode.id === node.id) return;
    const edgeId = [node.id, targetNode.id].sort().join('-');

    const existing = edgeById.get(edgeId);
    if (existing) {
      // One deliberate link anywhere settles it: this is not a guess.
      if (!inferred) existing.inferred = false;
    } else {
      const edge = { id: edgeId, source: node.id, target: targetNode.id, inferred };
      edgeById.set(edgeId, edge);
      edges.push(edge);
    }

    const strength = calculateConnectionStrength(node, targetNode, nodes);
    const weighted = inferred ? strength * INFERRED_EDGE_WEIGHT : strength;
    strengthMap.set(edgeId, Math.max(strengthMap.get(edgeId) || 0, weighted));
  };

  nodes.forEach(node => {
    entityTextsFor(node.data, node.type).forEach(text => {
      // Typed links first, so a later inferred pass over the same pair can only
      // confirm the edge, never downgrade it to a guess.
      extractWikiLinks(text).forEach(name => {
        addEdge(node, nodeMap.get(name.toLowerCase()), false);
      });

      // autoLinkText brackets every recognised name and preserves the ones
      // already bracketed, so re-extracting yields typed + inferred together.
      // The typed ones were recorded above and keep their flag; the rest have
      // to clear the stricter bar in isInferrableMention.
      extractWikiLinks(autoLinkText(text, canonicalNames)).forEach(name => {
        const target = nodeMap.get(name.toLowerCase());
        if (!target || !isInferrableMention(target.name, text)) return;
        addEdge(node, target, true);
      });
    });
  });

  return { edges, strengthMap };
}

/**
 * Calculate connection strength between two entities
 * Counts how many times they reference each other
 *
 * @param {Object} sourceNode - Source node
 * @param {Object} targetNode - Target node
 * @param {Array} allNodes - All nodes in the graph
 * @returns {number} Connection strength (number of mutual references)
 */
export function calculateConnectionStrength(sourceNode, targetNode, allNodes) {
  let strength = 0;

  // Count references from source to target
  const sourceText = `${sourceNode.data?.description || ''} ${sourceNode.data?.notes || ''} ${sourceNode.data?.content || ''} ${sourceNode.data?.summary || ''}`.toLowerCase();
  const targetName = targetNode.name.toLowerCase();

  // Count occurrences of target name in source text
  const sourceMatches = (sourceText.match(new RegExp(`\\b${targetName}\\b`, 'gi')) || []).length;
  strength += sourceMatches;

  // Count references from target to source
  const targetText = `${targetNode.data?.description || ''} ${targetNode.data?.notes || ''} ${targetNode.data?.content || ''} ${targetNode.data?.summary || ''}`.toLowerCase();
  const sourceName = sourceNode.name.toLowerCase();

  // Count occurrences of source name in target text
  const targetMatches = (targetText.match(new RegExp(`\\b${sourceName}\\b`, 'gi')) || []).length;
  strength += targetMatches;

  return Math.max(1, strength); // Minimum strength of 1
}

/**
 * Calculate node importance based on number of connections
 *
 * @param {string} nodeId - Node ID
 * @param {Array} edges - All edges in the graph
 * @returns {number} Importance score (number of connections)
 */
export function calculateNodeImportance(nodeId, edges) {
  return edges.filter(edge =>
    edge.source === nodeId || edge.target === nodeId
  ).length;
}

/**
 * Filter graph by selected entity types
 *
 * @param {Array} nodes - All nodes
 * @param {Array} edges - All edges
 * @param {Array} selectedTypes - Array of selected entity types
 * @returns {Object} Filtered { nodes, edges }
 */
export function filterGraphByTypes(nodes, edges, selectedTypes) {
  // Filter nodes by type
  const filteredNodes = nodes.filter(node =>
    selectedTypes.includes(node.type)
  );

  const nodeIds = new Set(filteredNodes.map(n => n.id));

  // Filter edges to only include connections between filtered nodes
  const filteredEdges = edges.filter(edge =>
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  };
}

/**
 * Drop nodes that touch no edge.
 *
 * Must run AFTER type filtering, never before: a node whose only partner was
 * just filtered out is isolated *in what you are looking at*, and computing
 * isolation against the unfiltered edge list would leave it stranded on screen.
 *
 * @param {Array} nodes - Nodes already narrowed to what will be displayed
 * @param {Array} edges - Edges already narrowed to the same set
 * @returns {Object} { nodes, edges, hiddenCount }
 */
export function filterIsolatedNodes(nodes, edges) {
  const connected = new Set();
  edges.forEach(edge => {
    connected.add(edge.source);
    connected.add(edge.target);
  });

  const kept = nodes.filter(n => connected.has(n.id));
  return { nodes: kept, edges, hiddenCount: nodes.length - kept.length };
}

/**
 * Find connected component (subgraph) for a given node using BFS
 *
 * @param {string} nodeId - Starting node ID
 * @param {Array} nodes - All nodes
 * @param {Array} edges - All edges
 * @returns {Object} Connected { nodes, edges }
 */
export function findConnectedComponent(nodeId, nodes, edges) {
  const connectedNodeIds = new Set([nodeId]);
  const queue = [nodeId];
  const visited = new Set([nodeId]);

  // BFS to find all connected nodes
  while (queue.length > 0) {
    const currentId = queue.shift();

    // Find all edges connected to current node
    const connectedEdges = edges.filter(edge =>
      edge.source === currentId || edge.target === currentId
    );

    // Add connected nodes to queue
    connectedEdges.forEach(edge => {
      const neighborId = edge.source === currentId ? edge.target : edge.source;

      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        connectedNodeIds.add(neighborId);
        queue.push(neighborId);
      }
    });
  }

  // Filter nodes and edges
  const connectedNodes = nodes.filter(n => connectedNodeIds.has(n.id));
  const connectedEdges = edges.filter(edge =>
    connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target)
  );

  return {
    nodes: connectedNodes,
    edges: connectedEdges
  };
}

/**
 * Calculate positions for nodes using force-directed layout
 * Simple implementation based on repulsion and attraction forces
 *
 * @param {Array} nodes - Nodes with initial positions
 * @param {Array} edges - Edges defining connections
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} iterations - Number of iterations to run
 * @returns {Array} Nodes with updated positions
 */
// ── Screen-space sizing ──────────────────────────────────────────────────
// Nodes and labels live in world units inside the SVG viewBox, so what the
// eye actually gets is `world × zoom`. fitToView settles around 0.29 on a
// 390px phone and clamps at a 0.15 floor for a large campaign, which turned a
// nominal 44px tap target into 7-13px and a 10px label into 1.5-3px. These
// helpers convert a desired SCREEN size into the world size to render at.

/** Minimum comfortable touch target radius in CSS px (44px diameter). */
export const MIN_TAP_RADIUS_PX = 22;
// Label sizes are counter-scaled in the stylesheet instead, via
// `calc(10px * var(--label-scale))`, so hover can still enlarge them.

/** World-space radius that renders at `screenPx` regardless of zoom. */
export function worldSizeForScreenPx(screenPx, zoom) {
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  return screenPx / z;
}

/** What a world-space size actually measures on screen at this zoom. */
export function screenSizeForWorld(worldSize, zoom) {
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  return worldSize * z;
}

/** Longest label drawn before an ellipsis. */
export const LABEL_MAX_CHARS = 26;

/** Roughly how wide one character is, as a fraction of font size, for Cinzel. */
const LABEL_CHAR_WIDTH = 0.6;

export function truncateLabel(name, max = LABEL_MAX_CHARS) {
  const text = typeof name === 'string' ? name : '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Decide which labels to draw, in screen space, so that none overlap.
 *
 * Labels were previously thinned by a zoom threshold alone, which controlled
 * *how many* appeared but nothing about *where*. On a real campaign the names
 * landed on top of each other and on the stars, and counter-scaling made it
 * worse by holding each label at a constant size while the nodes crowded
 * together. So place them in importance order and drop any that would collide
 * with one already placed: fewer names, every one readable.
 *
 * Pure and screen-space, so it is testable without a DOM.
 *
 * @returns {Set<string>} ids of the nodes that should show a label
 */
export function layoutLabels(nodes, { zoom, pan, viewport, fontPx = 10, maxLabels = Infinity, showTypeLabel = false } = {}) {
  const shown = new Set();
  if (!Array.isArray(nodes) || !nodes.length) return shown;

  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const panX = pan?.x || 0;
  const panY = pan?.y || 0;
  const vw = viewport?.w || 0;
  const vh = viewport?.h || 0;

  // The type line sits above the name, so reserve its height too or the two
  // stacked lines collide with whatever is placed above them.
  const lineH = fontPx * 1.25;
  const boxH = showTypeLabel ? lineH * 2.2 : lineH;
  const pad = 2;

  const ranked = [...nodes].sort((a, b) =>
    (b.importance || 0) - (a.importance || 0) ||
    String(a.name || '').localeCompare(String(b.name || ''))
  );

  const placed = [];
  for (const node of ranked) {
    if (shown.size >= maxLabels) break;

    const sx = (node.x - panX) * z;
    const sy = (node.y - panY) * z;
    const r = (node.radius || 8) * z;
    const w = truncateLabel(node.name).length * fontPx * LABEL_CHAR_WIDTH;

    const box = {
      x: sx - w / 2 - pad,
      y: sy - r - 8 - boxH - pad,
      w: w + pad * 2,
      h: boxH + pad * 2,
    };

    // Offscreen labels cost nothing to skip and free the budget for visible ones.
    if (vw && vh && (box.x + box.w < 0 || box.x > vw || box.y + box.h < 0 || box.y > vh)) continue;

    const hits = placed.some(p =>
      box.x < p.x + p.w && p.x < box.x + box.w &&
      box.y < p.y + p.h && p.y < box.y + box.h
    );
    if (hits) continue;

    placed.push(box);
    shown.add(node.id);
  }

  return shown;
}

/**
 * How many nodes the opening view holds, scaled to the campaign.
 *
 * A fixed limit ages badly in both directions: it hides most of a young
 * campaign and shows a vanishing fraction of a year-old one. Roughly a third,
 * floored so a small campaign is nearly complete and capped so a phone stays
 * legible. A campaign smaller than the floor is returned whole.
 */
export function hubLimitFor(nodeCount, { share = 0.35, min = 30, max = 60 } = {}) {
  if (!Number.isFinite(nodeCount) || nodeCount <= 0) return min;
  return Math.max(Math.min(nodeCount, min), Math.min(max, Math.round(nodeCount * share)));
}

/**
 * Choose what the map opens on.
 *
 * Ranking by connection count alone looks right and fails over time: a year in,
 * a few core NPCs and places are named in nearly every session and accumulate
 * enormous degree, while each session or timeline event links to only a
 * handful of things. A flat "top N by degree" therefore converges on the same
 * two dozen characters forever and never shows a single major event.
 *
 * So draft round-robin by type instead — the strongest NPC, the strongest
 * location, the strongest session, and so on, before the second of any type.
 * Every type present gets a share, ordered by connections within it, and types
 * with few entities simply run out and hand their slots to the rest.
 *
 * @returns {Object} { nodes, edges, trimmedCount }
 */
export function selectOpeningView(nodes, edges, limit) {
  if (!Array.isArray(nodes) || nodes.length <= limit) {
    return { nodes, edges, trimmedCount: 0 };
  }

  const byType = new Map();
  nodes.forEach(n => {
    const list = byType.get(n.type);
    if (list) list.push(n);
    else byType.set(n.type, [n]);
  });

  // Sorted by type name only so the draft order is stable between renders;
  // within a type it is strongest first.
  const queues = [...byType.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([, list]) => list.sort((a, b) =>
      (b.importance || 0) - (a.importance || 0) ||
      String(a.name || '').localeCompare(String(b.name || ''))
    ));

  const keep = new Set();
  let drafted = true;
  while (keep.size < limit && drafted) {
    drafted = false;
    for (const queue of queues) {
      if (keep.size >= limit) break;
      const next = queue.shift();
      if (!next) continue;
      keep.add(next.id);
      drafted = true;
    }
  }

  const keptNodes = nodes.filter(n => keep.has(n.id));
  const keptEdges = edges.filter(e => keep.has(e.source) && keep.has(e.target));

  return { nodes: keptNodes, edges: keptEdges, trimmedCount: nodes.length - keptNodes.length };
}

export function calculateForceDirectedLayout(nodes, edges, width, height, iterations = 50) {
  const k = Math.sqrt((width * height) / nodes.length); // Ideal distance
  const repulsion = k * k;
  const attraction = k;

  // Initialize positions if not already set
  nodes.forEach((node, i) => {
    if (!node.x || !node.y) {
      node.x = (i % Math.ceil(Math.sqrt(nodes.length))) * (width / Math.ceil(Math.sqrt(nodes.length)));
      node.y = Math.floor(i / Math.ceil(Math.sqrt(nodes.length))) * (height / Math.ceil(Math.sqrt(nodes.length)));
    }
    node.vx = 0;
    node.vy = 0;
  });

  // Run iterations
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate repulsive forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      nodeA.vx = 0;
      nodeA.vy = 0;

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;

        const nodeB = nodes[j];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        // Repulsive force
        const force = repulsion / distance;
        nodeA.vx += (dx / distance) * force;
        nodeA.vy += (dy / distance) * force;
      }
    }

    // Calculate attractive forces along edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);

      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Attractive force
      const force = (distance * distance) / attraction;

      source.vx += (dx / distance) * force;
      source.vy += (dy / distance) * force;
      target.vx -= (dx / distance) * force;
      target.vy -= (dy / distance) * force;
    });

    // Apply forces and damping
    const damping = 0.5;
    nodes.forEach(node => {
      node.x += node.vx * damping;
      node.y += node.vy * damping;

      // Keep within bounds
      node.x = Math.max(50, Math.min(width - 50, node.x));
      node.y = Math.max(50, Math.min(height - 50, node.y));
    });
  }

  return nodes;
}

/**
 * Get color for entity type
 *
 * @param {string} type - Entity type
 * @returns {string} CSS color
 */
export function getNodeColor(type) {
  const colors = {
    npc: '#8b5cf6',      // Purple (Fear color)
    location: '#3b82f6', // Blue
    lore: '#10b981',     // Green
    session: '#eab308',  // Gold (Hope color)
    timeline: '#f59e0b', // Orange
    encounter: '#ef4444', // Red
    note: '#6366f1'      // Indigo
  };

  return colors[type] || '#6b7280'; // Gray fallback
}

/**
 * Get label for entity type
 *
 * @param {string} type - Entity type
 * @returns {string} Display label
 */
export function getTypeLabel(type) {
  const labels = {
    npc: 'NPC',
    location: 'Location',
    lore: 'Lore',
    session: 'Session',
    timeline: 'Event',
    encounter: 'Encounter',
    note: 'Note'
  };

  return labels[type] || type;
}
