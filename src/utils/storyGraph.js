/**
 * The story map: a campaign graph built from session recaps.
 *
 * The world map treats every entity as a peer and lets a force simulation sort
 * them out, which produces a hairball — unreadable at any size, and worse every
 * week you play. It also has to guess what matters, using connection counts as
 * a stand-in for importance.
 *
 * A recap is a human saying what mattered, so this view takes it at its word.
 * Sessions are dated, so the graph gets a spine: a chronological chain with the
 * people, places and events of each session branching off it. Positions are
 * computed, not simulated, so the layout is stable between renders and there is
 * no hairball to untangle.
 *
 * The trade: this shows the story, not the world. Prep you have written but
 * never played, and relationships that never reached a recap, live on the world
 * map instead.
 */

import {
  autoLinkText,
} from './autoLinkText';
import {
  extractWikiLinks,
  isInferrableMention,
} from './graphCalculations';

/** Vertical distance between consecutive sessions on the spine. */
export const STORY_ROW_H = 220;
/** Horizontal distance between lanes of entities either side of the spine. */
export const STORY_LANE_W = 260;
/** Closest two entities may sit vertically within one lane. */
export const STORY_MIN_GAP = 90;
/** Lanes per side before entities start stacking in an overflow lane. */
export const STORY_MAX_LANES = 4;

/**
 * How many sessions the story map opens on.
 *
 * A year is ~50 sessions; showing all of them at once recreates the problem
 * this view exists to solve. Recent sessions are what "what's happening"
 * means, and the rest are one tap away.
 */
export const STORY_SESSION_LIMIT = 12;

/** The recap text of a session: what was reported, not what was prepped. */
export function sessionRecapTexts(session) {
  if (!session) return [];
  const texts = [session.summary, session.dmNotes];
  if (Array.isArray(session.highlights)) texts.push(...session.highlights);
  return texts.filter(t => typeof t === 'string' && t.trim().length > 0);
}

/** Whether a session has actually been played and written up. */
export function hasRecap(session) {
  return sessionRecapTexts(session).length > 0;
}

/**
 * Sessions oldest-first.
 *
 * `date` is a plain `YYYY-MM-DD` string from the form, so it sorts
 * lexicographically — but undated sessions must not silently lead the
 * campaign, so they fall to the end ordered by title.
 */
export function sortSessionsByDate(sessionNodes) {
  return [...sessionNodes].sort((a, b) => {
    const da = a.data?.date || '';
    const db = b.data?.date || '';
    if (da && db) return da.localeCompare(db) || String(a.name).localeCompare(String(b.name));
    if (da) return -1;
    if (db) return 1;
    return String(a.name).localeCompare(String(b.name));
  });
}

/**
 * Find a free slot for an entity, as near its sessions as possible.
 *
 * Works outward: nearest lane first, and within a lane alternates above and
 * below the preferred position. Anything that cannot be placed within the lane
 * budget is stacked in an overflow lane rather than dropped — losing an entity
 * silently would be worse than putting it slightly far out.
 */
function placeInLane(preferredY, side, occupied, { laneWidth, minGap, maxLanes }) {
  for (let lane = 1; lane <= maxLanes; lane++) {
    const key = `${side}:${lane}`;
    const used = occupied.get(key) || [];

    for (let step = 0; step <= 12; step++) {
      const magnitude = Math.ceil(step / 2) * minGap;
      const y = preferredY + (step % 2 === 0 ? magnitude : -magnitude);
      if (!used.some(u => Math.abs(u - y) < minGap)) {
        used.push(y);
        occupied.set(key, used);
        return { x: side * lane * laneWidth, y };
      }
    }
  }

  const key = `${side}:overflow`;
  const used = occupied.get(key) || [];
  const y = preferredY + used.length * minGap;
  used.push(y);
  occupied.set(key, used);
  return { x: side * (maxLanes + 1) * laneWidth, y };
}

/**
 * Build the story graph from already-collected entity nodes.
 *
 * @param {Array} allNodes - from collectEntityNodes: { id, name, type, data }
 * @param {Object} [options]
 * @param {number} [options.sessionLimit] - keep only this many most recent sessions
 * @returns {Object} { nodes, edges, sessionCount, trimmedSessions }
 */
export function buildStoryGraph(allNodes, options = {}) {
  const {
    rowHeight = STORY_ROW_H,
    laneWidth = STORY_LANE_W,
    minGap = STORY_MIN_GAP,
    maxLanes = STORY_MAX_LANES,
    sessionLimit = Infinity,
  } = options;

  const nodes = [];
  const edges = [];
  if (!Array.isArray(allNodes) || !allNodes.length) {
    return { nodes, edges, sessionCount: 0, trimmedSessions: 0 };
  }

  const allSessions = sortSessionsByDate(
    allNodes.filter(n => n.type === 'session' && hasRecap(n.data))
  );
  if (!allSessions.length) {
    return { nodes, edges, sessionCount: 0, trimmedSessions: 0 };
  }

  // Keep the tail: the most recent sessions are what "what's happening" means.
  const trimmedSessions = Math.max(0, allSessions.length - sessionLimit);
  const sessions = trimmedSessions ? allSessions.slice(-sessionLimit) : allSessions;

  // Names are matched across the whole campaign, not just the visible slice, so
  // that trimming sessions never changes what a recap is understood to mean.
  const byName = new Map();
  allNodes.forEach(n => { if (n.name) byName.set(n.name.toLowerCase(), n); });
  const canonicalNames = allNodes.map(n => n.name).filter(Boolean);

  const mentions = new Map(); // entity id → { node, sessionIndices: [] }
  const edgeById = new Map();

  sessions.forEach((session, index) => {
    sessionRecapTexts(session.data).forEach(text => {
      const typed = new Set(extractWikiLinks(text).map(s => s.toLowerCase()));
      const candidates = new Set([
        ...typed,
        ...extractWikiLinks(autoLinkText(text, canonicalNames)).map(s => s.toLowerCase()),
      ]);

      candidates.forEach(lower => {
        const target = byName.get(lower);
        if (!target || target.id === session.id) return;
        // Session-to-session links are the spine's job, not a recap's.
        if (target.type === 'session') return;

        const wasTyped = typed.has(lower);
        if (!wasTyped && !isInferrableMention(target.name, text)) return;

        const record = mentions.get(target.id) || { node: target, sessionIndices: [] };
        if (!record.sessionIndices.includes(index)) record.sessionIndices.push(index);
        mentions.set(target.id, record);

        const edgeId = `${session.id}--${target.id}`;
        const existing = edgeById.get(edgeId);
        if (existing) {
          if (wasTyped) existing.inferred = false;
        } else {
          const edge = { id: edgeId, source: session.id, target: target.id, inferred: !wasTyped };
          edgeById.set(edgeId, edge);
          edges.push(edge);
        }
      });
    });
  });

  // The spine. Sessions sit on a vertical line in date order; a session's size
  // reflects how much the recap actually covered.
  sessions.forEach((session, index) => {
    const mentioned = [...mentions.values()].filter(m => m.sessionIndices.includes(index)).length;
    nodes.push({
      ...session,
      x: 0,
      y: index * rowHeight,
      importance: mentioned,
      radius: 10 + Math.min(10, mentioned * 1.2),
      isSpine: true,
    });

    if (index > 0) {
      edges.push({
        id: `spine-${sessions[index - 1].id}--${session.id}`,
        source: sessions[index - 1].id,
        target: session.id,
        inferred: false,
        spine: true,
      });
    }
  });

  // Recurring entities first, so the things that span the campaign claim the
  // lanes nearest the spine and read as its supporting cast.
  const ordered = [...mentions.values()].sort((a, b) =>
    b.sessionIndices.length - a.sessionIndices.length ||
    Math.min(...a.sessionIndices) - Math.min(...b.sessionIndices) ||
    String(a.node.name || '').localeCompare(String(b.node.name || ''))
  );

  const occupied = new Map();
  ordered.forEach((record, i) => {
    const mean = record.sessionIndices.reduce((sum, v) => sum + v, 0) / record.sessionIndices.length;
    const side = i % 2 === 0 ? -1 : 1;
    const { x, y } = placeInLane(mean * rowHeight, side, occupied, { laneWidth, minGap, maxLanes });

    nodes.push({
      ...record.node,
      x,
      y,
      importance: record.sessionIndices.length,
      radius: 8 + Math.min(12, record.sessionIndices.length * 2.5),
    });
  });

  return { nodes, edges, sessionCount: sessions.length, trimmedSessions };
}
