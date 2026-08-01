/**
 * Graph calculation utilities for relationship graph visualization
 */

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

/**
 * Whether a node keeps its label at this zoom.
 *
 * Counter-scaled labels stay readable but start colliding once zoomed out, so
 * thin them by importance. The old rule kept every node with degree ≥ 3 —
 * exactly the hubs, exactly where labels pile up worst.
 */
export function labelVisibleFor(node, zoom, { hubThreshold = 6 } = {}) {
  if (zoom >= 0.7) return true;
  if (zoom >= 0.35) return (node?.importance || 0) >= 3;
  return (node?.importance || 0) >= hubThreshold;
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
