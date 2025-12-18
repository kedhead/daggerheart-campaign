import { useMemo } from 'react';

/**
 * Creates a searchable registry of all campaign entities
 * Used for wiki-style linking, autocomplete, and relationship graphs
 *
 * @param {Object} campaign - Campaign object (can have entities or pass them separately)
 * @param {Object} separateEntities - Optional object with entity arrays { npcs, locations, lore, sessions, timelineEvents, encounters, notes }
 * @returns {Object} Registry with entities array and search/lookup functions
 */
export function useEntityRegistry(campaign, separateEntities = null) {
  const registry = useMemo(() => {
    console.log('[useEntityRegistry] Building registry for campaign:', campaign?.name);

    if (!campaign) {
      console.log('[useEntityRegistry] No campaign, returning empty registry');
      return [];
    }

    // Use separate entities if provided, otherwise use campaign's nested entities
    const source = separateEntities || campaign;

    const entities = [];

    // NPCs
    (source.npcs || []).forEach(npc => {
      entities.push({
        id: npc.id,
        type: 'npc',
        name: npc.name,
        displayName: npc.name,
        subtitle: npc.occupation || 'NPC',
        searchText: `${npc.name} ${npc.occupation || ''} ${npc.description || ''}`.toLowerCase(),
        data: npc
      });
    });

    // Locations
    (source.locations || []).forEach(location => {
      entities.push({
        id: location.id,
        type: 'location',
        name: location.name,
        displayName: location.name,
        subtitle: location.type || 'Location',
        searchText: `${location.name} ${location.type || ''} ${location.description || ''}`.toLowerCase(),
        data: location
      });
    });

    // Lore
    (source.lore || []).forEach(lore => {
      entities.push({
        id: lore.id,
        type: 'lore',
        name: lore.title,
        displayName: lore.title,
        subtitle: lore.type || 'Lore',
        searchText: `${lore.title} ${lore.type || ''} ${lore.content || ''}`.toLowerCase(),
        data: lore
      });
    });

    // Sessions
    (source.sessions || []).forEach(session => {
      entities.push({
        id: session.id,
        type: 'session',
        name: session.title,
        displayName: session.title,
        subtitle: `Session - ${session.date ? new Date(session.date).toLocaleDateString() : 'No date'}`,
        searchText: `${session.title} ${session.summary || ''}`.toLowerCase(),
        data: session
      });
    });

    // Timeline Events
    (source.timelineEvents || []).forEach(event => {
      entities.push({
        id: event.id,
        type: 'timeline',
        name: event.title,
        displayName: event.title,
        subtitle: `Event - ${event.date || 'Unknown date'}`,
        searchText: `${event.title} ${event.description || ''}`.toLowerCase(),
        data: event
      });
    });

    // Encounters
    (source.encounters || []).forEach(encounter => {
      entities.push({
        id: encounter.id,
        type: 'encounter',
        name: encounter.name,
        displayName: encounter.name,
        subtitle: `${encounter.difficulty || 'Unknown'} Encounter`,
        searchText: `${encounter.name} ${encounter.description || ''}`.toLowerCase(),
        data: encounter
      });
    });

    // Notes
    (source.notes || []).forEach(note => {
      entities.push({
        id: note.id,
        type: 'note',
        name: note.title,
        displayName: note.title,
        subtitle: note.category || 'Note',
        searchText: `${note.title} ${note.content || ''}`.toLowerCase(),
        data: note
      });
    });

    console.log('[useEntityRegistry] Registry built with', entities.length, 'entities:', {
      npcs: source.npcs?.length || 0,
      locations: source.locations?.length || 0,
      lore: source.lore?.length || 0,
      sessions: source.sessions?.length || 0,
      timelineEvents: source.timelineEvents?.length || 0,
      encounters: source.encounters?.length || 0,
      notes: source.notes?.length || 0
    });

    return entities;
  }, [
    campaign,
    separateEntities?.npcs,
    separateEntities?.locations,
    separateEntities?.lore,
    separateEntities?.sessions,
    separateEntities?.timelineEvents,
    separateEntities?.encounters,
    separateEntities?.notes
  ]);

  /**
   * Search for entities by query string
   * @param {string} query - Search query (empty query returns all entities)
   * @returns {Array} Array of matching entities (max 10 results)
   */
  const search = (query) => {
    console.log('[useEntityRegistry] search() called', {
      query,
      registrySize: registry.length
    });

    // If no query, return all entities (for autocomplete when typing [[)
    if (!query || query.trim() === '') {
      const results = registry.slice(0, 10);
      console.log('[useEntityRegistry] Empty query, returning first 10:', results);
      return results;
    }

    const lowerQuery = query.toLowerCase();
    const results = registry
      .filter(entity => entity.searchText.includes(lowerQuery))
      .slice(0, 10);
    console.log('[useEntityRegistry] Filtered results:', results);
    return results;
  };

  /**
   * Get entity by exact name match (case-insensitive)
   * @param {string} name - Entity name
   * @returns {Object|undefined} Matching entity or undefined
   */
  const getByName = (name) => {
    if (!name) return undefined;
    const lowerName = name.toLowerCase().trim();
    return registry.find(entity => entity.name.toLowerCase() === lowerName);
  };

  return {
    entities: registry,
    search,
    getByName
  };
}
