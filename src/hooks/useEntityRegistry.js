import { useMemo } from 'react';

/**
 * Creates a searchable registry of all campaign entities
 * Used for wiki-style linking, autocomplete, and relationship graphs
 *
 * @param {Object} campaign - Campaign object with all entities
 * @returns {Object} Registry with entities array and search/lookup functions
 */
export function useEntityRegistry(campaign) {
  const registry = useMemo(() => {
    if (!campaign) return [];

    const entities = [];

    // NPCs
    (campaign.npcs || []).forEach(npc => {
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
    (campaign.locations || []).forEach(location => {
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
    (campaign.lore || []).forEach(lore => {
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
    (campaign.sessions || []).forEach(session => {
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
    (campaign.timelineEvents || []).forEach(event => {
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
    (campaign.encounters || []).forEach(encounter => {
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
    (campaign.notes || []).forEach(note => {
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

    return entities;
  }, [
    campaign?.npcs,
    campaign?.locations,
    campaign?.lore,
    campaign?.sessions,
    campaign?.timelineEvents,
    campaign?.encounters,
    campaign?.notes
  ]);

  /**
   * Search for entities by query string
   * @param {string} query - Search query
   * @returns {Array} Array of matching entities (max 10 results)
   */
  const search = (query) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return registry
      .filter(entity => entity.searchText.includes(lowerQuery))
      .slice(0, 10); // Limit to 10 results for performance
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
