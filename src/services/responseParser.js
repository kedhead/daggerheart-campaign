/**
 * Response Parser Service
 * Parses AI responses into structured data
 * Handles both JSON and text responses with fallback parsing
 */

export const responseParser = {
  /**
   * Parse NPC response
   * @param {string} responseText - AI response text
   * @returns {object} Parsed NPC data
   */
  parseNPC(responseText) {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return this._validateNPCData(parsed);
      }

      // Try direct JSON parse
      const parsed = JSON.parse(responseText);
      return this._validateNPCData(parsed);
    } catch (error) {
      // Fallback: parse as plain text
      console.log('JSON parsing failed, trying text extraction');
      return this._parseNPCFromText(responseText);
    }
  },

  /**
   * Parse Location response
   * @param {string} responseText - AI response text
   * @returns {object} Parsed location data
   */
  parseLocation(responseText) {
    try {
      const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return this._validateLocationData(parsed);
      }

      const parsed = JSON.parse(responseText);
      return this._validateLocationData(parsed);
    } catch (error) {
      console.log('JSON parsing failed, trying text extraction');
      return this._parseLocationFromText(responseText);
    }
  },

  /**
   * Parse Encounter response
   * @param {string} responseText - AI response text
   * @returns {object} Parsed encounter data
   */
  parseEncounter(responseText) {
    try {
      const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return this._validateEncounterData(parsed);
      }

      const parsed = JSON.parse(responseText);
      return this._validateEncounterData(parsed);
    } catch (error) {
      console.log('JSON parsing failed, trying text extraction');
      return this._parseEncounterFromText(responseText);
    }
  },

  /**
   * Parse array responses (tone, themes, etc.)
   * @param {string} responseText - AI response text
   * @returns {array} Parsed array
   */
  parseArray(responseText) {
    try {
      const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      return JSON.parse(responseText);
    } catch (error) {
      // Parse as comma or newline-separated list
      return responseText
        .split(/[,\n]/)
        .map(item => item.trim())
        .filter(item => item && !item.match(/^[\[\]{}"`]$/))
        .map(item => item.replace(/^["']|["']$/g, '')); // Remove quotes
    }
  },

  /**
   * Parse text response (for pitch, overview, etc.)
   * @param {string} responseText - AI response text
   * @returns {string} Cleaned text
   */
  parseText(responseText) {
    // Remove markdown code blocks if present
    const textMatch = responseText.match(/```(?:text)?\s*\n([\s\S]*?)\n```/);
    if (textMatch) {
      return textMatch[1].trim();
    }

    return responseText.trim();
  },

  /**
   * Parse Lore response
   * @param {string} responseText - AI response text
   * @returns {object} Parsed lore data
   */
  parseLore(responseText) {
    try {
      const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return this._validateLoreData(parsed);
      }

      const parsed = JSON.parse(responseText);
      return this._validateLoreData(parsed);
    } catch (error) {
      console.log('JSON parsing failed for lore, trying text extraction');
      return this._parseLoreFromText(responseText);
    }
  },

  // Validation methods

  _validateNPCData(data) {
    return {
      name: data.name || 'Unknown NPC',
      ancestry: data.ancestry || '',
      occupation: data.occupation || '',
      location: data.location || '',
      relationship: this._validateRelationship(data.relationship),
      description: data.description || '',
      notes: data.notes || '',
      firstMet: data.firstMet || '',
      avatarUrl: ''
    };
  },

  _validateLocationData(data) {
    return {
      name: data.name || 'Unknown Location',
      type: this._validateLocationType(data.type),
      region: data.region || '',
      description: data.description || '',
      notableFeatures: data.notableFeatures || '',
      secrets: data.secrets || '',
      inhabitants: data.inhabitants || '',
      mapUrl: ''
    };
  },

  _validateEncounterData(data) {
    return {
      name: data.name || 'Unknown Encounter',
      difficulty: this._validateDifficulty(data.difficulty),
      partyLevel: data.partyLevel || 1,
      environment: data.environment || '',
      description: data.description || '',
      enemies: data.enemies || '',
      tactics: data.tactics || '',
      rewards: data.rewards || '',
      suggestedAdversaries: Array.isArray(data.suggestedAdversaries) ? data.suggestedAdversaries : [],
      suggestedEnvironment: data.suggestedEnvironment || '',
      newAdversaries: Array.isArray(data.newAdversaries) ? data.newAdversaries : [],
      freshCutGrassLink: ''
    };
  },

  _validateLoreData(data) {
    return {
      title: data.title || 'Untitled Lore',
      category: this._validateLoreCategory(data.category),
      content: data.content || '',
      tags: Array.isArray(data.tags) ? data.tags : []
    };
  },

  _validateLoreCategory(category) {
    const valid = ['history', 'legend', 'faction', 'culture', 'religion', 'magic', 'geography', 'other'];
    const normalized = (category || '').toLowerCase();
    return valid.includes(normalized) ? normalized : 'other';
  },

  _validateRelationship(relationship) {
    const valid = ['ally', 'neutral', 'enemy'];
    const normalized = (relationship || '').toLowerCase();
    return valid.includes(normalized) ? normalized : 'neutral';
  },

  _validateLocationType(type) {
    const valid = ['city', 'town', 'village', 'dungeon', 'wilderness', 'landmark', 'other'];
    const normalized = (type || '').toLowerCase();
    return valid.includes(normalized) ? normalized : 'other';
  },

  _validateDifficulty(difficulty) {
    const valid = ['easy', 'medium', 'hard', 'deadly'];
    const normalized = (difficulty || '').toLowerCase();
    return valid.includes(normalized) ? normalized : 'medium';
  },

  // Text extraction fallbacks

  _parseNPCFromText(text) {
    const extractField = (fieldNames) => {
      for (const fieldName of fieldNames) {
        const pattern = new RegExp(`${fieldName}:\\s*(.+?)(?:\\n|$)`, 'i');
        const match = text.match(pattern);
        if (match) return match[1].trim();
      }
      return '';
    };

    return {
      name: extractField(['name', 'npc name']) || 'Unknown NPC',
      ancestry: extractField(['ancestry', 'race', 'species']),
      occupation: extractField(['occupation', 'job', 'role']),
      location: extractField(['location', 'residence', 'found at']),
      relationship: this._validateRelationship(extractField(['relationship', 'allegiance', 'disposition'])),
      description: extractField(['description', 'appearance', 'personality']),
      notes: extractField(['notes', 'details', 'background']),
      firstMet: extractField(['first met', 'meeting', 'encounter', 'how to meet']),
      avatarUrl: ''
    };
  },

  _parseLocationFromText(text) {
    const extractField = (fieldNames) => {
      for (const fieldName of fieldNames) {
        const pattern = new RegExp(`${fieldName}:\\s*(.+?)(?:\\n|$)`, 'i');
        const match = text.match(pattern);
        if (match) return match[1].trim();
      }
      return '';
    };

    return {
      name: extractField(['name', 'location name']) || 'Unknown Location',
      type: this._validateLocationType(extractField(['type', 'location type'])),
      region: extractField(['region', 'area', 'territory']),
      description: extractField(['description', 'overview']),
      notableFeatures: extractField(['notable features', 'features', 'landmarks']),
      secrets: extractField(['secrets', 'hidden', 'mysteries']),
      inhabitants: extractField(['inhabitants', 'population', 'residents']),
      mapUrl: ''
    };
  },

  _parseEncounterFromText(text) {
    const extractField = (fieldNames) => {
      for (const fieldName of fieldNames) {
        const pattern = new RegExp(`${fieldName}:\\s*(.+?)(?:\\n|$)`, 'i');
        const match = text.match(pattern);
        if (match) return match[1].trim();
      }
      return '';
    };

    return {
      name: extractField(['name', 'encounter name', 'title']) || 'Unknown Encounter',
      difficulty: this._validateDifficulty(extractField(['difficulty', 'challenge'])),
      partyLevel: 1,
      environment: extractField(['environment', 'location', 'setting']),
      description: extractField(['description', 'scene', 'setup']),
      enemies: extractField(['enemies', 'adversaries', 'foes', 'opponents']),
      tactics: extractField(['tactics', 'strategy', 'behavior']),
      rewards: extractField(['rewards', 'loot', 'treasure']),
      freshCutGrassLink: ''
    };
  },

  _parseLoreFromText(text) {
    const extractField = (fieldNames) => {
      for (const fieldName of fieldNames) {
        const pattern = new RegExp(`${fieldName}:\\s*(.+?)(?:\\n|$)`, 'i');
        const match = text.match(pattern);
        if (match) return match[1].trim();
      }
      return '';
    };

    return {
      title: extractField(['title', 'name']) || 'Untitled Lore',
      category: this._validateLoreCategory(extractField(['category', 'type'])),
      content: extractField(['content', 'description', 'text']) || text.substring(0, 500),
      tags: extractField(['tags']).split(',').map(t => t.trim()).filter(Boolean)
    };
  },

  /**
   * Parse Session Plan response (GM Assistant mode)
   * @param {string} responseText - AI response text
   * @returns {object|null} Parsed session plan, or null if no JSON block found
   */
  parseSessionPlan(responseText) {
    const fenced = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
    const candidate = fenced ? fenced[1] : (() => {
      const brace = responseText.match(/\{[\s\S]*\}/);
      return brace ? brace[0] : null;
    })();
    if (!candidate) return null;

    let parsed;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      return null;
    }

    return this._validateSessionPlan(parsed);
  },

  _validateSessionPlan(data) {
    const encounters = Array.isArray(data.encounters) ? data.encounters : [];
    const validRoles = ['minion', 'horde', 'standard', 'bruiser', 'skulk', 'ranged', 'support', 'social', 'leader', 'solo', 'boss'];
    const validEncounterTypes = ['combat', 'puzzle', 'social', 'exploration'];

    return {
      sessionTitle: String(data.sessionTitle || 'Untitled Session'),
      estimatedDurationHours: Number(data.estimatedDurationHours) || 3,
      partyLevel: Number(data.partyLevel) || 1,
      partySize: Number(data.partySize) || 4,
      primaryLocation: String(data.primaryLocation || ''),
      pacingOutline: Array.isArray(data.pacingOutline) ? data.pacingOutline.map(String) : [],
      encounters: encounters.map((enc) => ({
        name: String(enc.name || 'Unnamed Encounter'),
        type: validEncounterTypes.includes(enc.type) ? enc.type : 'combat',
        summary: String(enc.summary || ''),
        estimatedMinutes: Number(enc.estimatedMinutes) || 30,
        adversariesNeeded: Array.isArray(enc.adversariesNeeded) ? enc.adversariesNeeded.map((a) => ({
          concept: String(a.concept || ''),
          tier: [1, 2, 3, 4].includes(Number(a.tier)) ? Number(a.tier) : 1,
          role: validRoles.includes(a.role) ? a.role : 'standard',
          quantity: Math.max(1, Number(a.quantity) || 1),
          reuseExistingName: a.reuseExistingName || null
        })) : [],
        puzzleSpec: enc.puzzleSpec ? {
          premise: String(enc.puzzleSpec.premise || ''),
          mechanism: String(enc.puzzleSpec.mechanism || ''),
          solution: String(enc.puzzleSpec.solution || ''),
          failureState: String(enc.puzzleSpec.failureState || '')
        } : null,
        environment: String(enc.environment || ''),
        bpEstimate: Number(enc.bpEstimate) || 0
      })),
      newNPCs: Array.isArray(data.newNPCs) ? data.newNPCs.map((n) => ({
        name: String(n.name || ''), occupation: String(n.occupation || ''), blurb: String(n.blurb || '')
      })).filter(n => n.name) : [],
      newLocations: Array.isArray(data.newLocations) ? data.newLocations.map((l) => ({
        name: String(l.name || ''), type: String(l.type || 'other'), blurb: String(l.blurb || '')
      })).filter(l => l.name) : [],
      events: Array.isArray(data.events) ? data.events.map((e) => ({
        title: String(e.title || ''), trigger: String(e.trigger || ''), outcome: String(e.outcome || '')
      })).filter(e => e.title) : [],
      mapsRequested: Array.isArray(data.mapsRequested) ? data.mapsRequested.map((m) => ({
        label: String(m.label || ''), kind: m.kind === 'location' ? 'location' : 'battle'
      })).filter(m => m.label) : [],
      gmNotes: String(data.gmNotes || '')
    };
  },

  /**
   * Main parse function - routes to appropriate parser
   * @param {string} type - Type of content
   * @param {string} responseText - AI response text
   * @returns {object|array|string} Parsed data
   */
  parse(type, responseText) {
    if (!responseText) {
      throw new Error('Response text is empty');
    }

    switch (type) {
      case 'npc':
        return this.parseNPC(responseText);
      case 'location':
        return this.parseLocation(responseText);
      case 'encounter':
        return this.parseEncounter(responseText);
      case 'lore':
        return this.parseLore(responseText);
      case 'session-plan':
        return this.parseSessionPlan(responseText);
      case 'array':
        return this.parseArray(responseText);
      case 'text':
        return this.parseText(responseText);
      default:
        return this.parseText(responseText);
    }
  }
};
