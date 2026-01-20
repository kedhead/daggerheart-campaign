/**
 * Prompt Builder Service
 * Generates context-aware prompts for AI generation
 * Includes campaign context, existing content, and specific requirements
 */

import { getGameSystem } from '../data/systems/index.js';

export const promptBuilder = {
  /**
   * Get game system context for prompts
   * @param {object} campaign - Campaign object
   * @returns {object} Game system info for prompts
   */
  _getGameSystemContext(campaign) {
    const systemId = campaign?.gameSystem || 'daggerheart';
    const system = getGameSystem(systemId);

    return {
      name: system?.name || 'Daggerheart',
      id: systemId,
      // Provide context about the genre/setting
      genre: this._getGenreContext(systemId)
    };
  },

  /**
   * Get genre-specific context for better AI prompts
   * @param {string} systemId - Game system ID
   * @returns {string} Genre context
   */
  _getGenreContext(systemId) {
    const genreMap = {
      'daggerheart': 'fantasy',
      'dnd5e': 'fantasy',
      'starwarsd6': 'science fiction space opera (Star Wars universe)',
      'generic': 'any genre'
    };
    return genreMap[systemId] || 'fantasy';
  },

  /**
   * Build session zero context for prompts
   * @param {object} campaignFrame - Campaign frame data
   * @returns {string} Session zero context string
   */
  _buildSessionZeroContext(campaignFrame) {
    if (!campaignFrame?.sessionZero) return '';

    const { sessionZero } = campaignFrame;
    let context = '';

    // World Facts established by players
    if (sessionZero.worldFacts?.length > 0) {
      context += '\n\nPLAYER-ESTABLISHED WORLD FACTS:';
      sessionZero.worldFacts.forEach(fact => {
        if (fact.fact) {
          context += `\n- ${fact.fact}`;
          if (fact.category && fact.category !== 'other') {
            context += ` (${fact.category})`;
          }
        }
      });
    }

    // Player locations
    if (sessionZero.playerLocations?.length > 0) {
      context += '\n\nPLAYER-MENTIONED LOCATIONS:';
      sessionZero.playerLocations.forEach(loc => {
        if (loc.name) {
          context += `\n- ${loc.name}`;
          if (loc.type && loc.type !== 'other') context += ` (${loc.type})`;
          if (loc.region) context += ` in ${loc.region}`;
          if (loc.description) context += `: ${loc.description}`;
        }
      });
    }

    // Character connections (for relationship context)
    if (sessionZero.characterConnections?.length > 0) {
      const answeredConnections = sessionZero.characterConnections.filter(c => c.answer);
      if (answeredConnections.length > 0) {
        context += '\n\nCHARACTER CONNECTIONS:';
        answeredConnections.forEach(conn => {
          context += `\n- ${conn.question}: ${conn.answer}`;
        });
      }
    }

    return context;
  },

  /**
   * Build starting quests context for prompts
   * @param {object} campaignFrame - Campaign frame data
   * @returns {string} Starting quests context string
   */
  _buildStartingQuestsContext(campaignFrame) {
    if (!campaignFrame?.startingQuests?.length) return '';

    let context = '\n\nSTARTING QUESTS:';
    campaignFrame.startingQuests.forEach(quest => {
      if (quest.name) {
        context += `\n- ${quest.name}`;
        if (quest.priority) context += ` [${quest.priority} priority]`;
        if (quest.description) context += `: ${quest.description}`;
      }
    });

    return context;
  },
  /**
   * Build a prompt for NPC generation
   * @param {object} context - Generation context
   * @returns {string} Generated prompt
   */
  buildNPCPrompt(context) {
    const { campaign, campaignFrame, existingNPCs = [], requirements = {} } = context;
    const gameSystem = this._getGameSystemContext(campaign);

    let prompt = `You are helping create an NPC for a ${gameSystem.name} campaign set in a ${gameSystem.genre} setting.

CAMPAIGN CONTEXT:
Campaign Name: ${campaign?.name || 'Untitled Campaign'}
Game System: ${gameSystem.name}`;

    if (campaign?.description) {
      prompt += `\nCampaign Description: ${campaign.description}`;
    }

    if (campaignFrame) {
      if (campaignFrame.pitch) {
        prompt += `\nCampaign Pitch: ${campaignFrame.pitch}`;
      }
      if (campaignFrame.toneAndFeel && campaignFrame.toneAndFeel.length > 0) {
        prompt += `\nTone & Feel: ${campaignFrame.toneAndFeel.join(', ')}`;
      }
      if (campaignFrame.themes && campaignFrame.themes.length > 0) {
        prompt += `\nThemes: ${campaignFrame.themes.join(', ')}`;
      }
      // Include session zero world-building context
      prompt += this._buildSessionZeroContext(campaignFrame);
      prompt += this._buildStartingQuestsContext(campaignFrame);
    }

    prompt += `\n\nREQUIREMENTS:`;
    prompt += requirements.name ? `\nName: ${requirements.name}` : '\nName: Generate a fitting name';
    prompt += requirements.occupation ? `\nOccupation: ${requirements.occupation}` : '\nOccupation: Suggest an appropriate occupation';
    prompt += requirements.relationship ? `\nRelationship: ${requirements.relationship}` : '\nRelationship: Suggest a relationship (ally, neutral, or enemy)';
    prompt += requirements.location ? `\nLocation: ${requirements.location}` : '\nLocation: Suggest a location';

    if (existingNPCs.length > 0) {
      prompt += `\n\nEXISTING NPCs IN CAMPAIGN:`;
      existingNPCs.slice(0, 10).forEach(npc => {
        prompt += `\n- ${npc.name} (${npc.occupation || 'Unknown'} - ${npc.relationship || 'Unknown'})`;
      });
      if (existingNPCs.length > 10) {
        prompt += `\n... and ${existingNPCs.length - 10} more`;
      }
    } else {
      prompt += `\n\nThis is the first NPC for this campaign.`;
    }

    prompt += `\n\nPlease generate an NPC with the following JSON structure:
\`\`\`json
{
  "name": "string",
  "occupation": "string",
  "location": "string",
  "relationship": "ally" | "neutral" | "enemy",
  "description": "2-3 sentences about appearance and personality",
  "notes": "Important details, connections, or secrets",
  "firstMet": "Suggestion for how/when the party might meet them"
}
\`\`\`

Ensure the NPC fits the campaign's tone and themes. Be creative but consistent with existing world elements.`;

    return prompt;
  },

  /**
   * Build a prompt for Location generation
   * @param {object} context - Generation context
   * @returns {string} Generated prompt
   */
  buildLocationPrompt(context) {
    const { campaign, campaignFrame, existingLocations = [], requirements = {} } = context;
    const gameSystem = this._getGameSystemContext(campaign);

    let prompt = `You are helping create a location for a ${gameSystem.name} campaign set in a ${gameSystem.genre} setting.

CAMPAIGN CONTEXT:
Campaign Name: ${campaign?.name || 'Untitled Campaign'}
Game System: ${gameSystem.name}`;

    if (campaign?.description) {
      prompt += `\nCampaign Description: ${campaign.description}`;
    }

    if (campaignFrame) {
      if (campaignFrame.pitch) {
        prompt += `\nCampaign Pitch: ${campaignFrame.pitch}`;
      }
      if (campaignFrame.toneAndFeel && campaignFrame.toneAndFeel.length > 0) {
        prompt += `\nTone & Feel: ${campaignFrame.toneAndFeel.join(', ')}`;
      }
      if (campaignFrame.distinctions && campaignFrame.distinctions.length > 0) {
        prompt += `\nSetting Elements: ${campaignFrame.distinctions.map(d => d.name).join(', ')}`;
      }
      // Include session zero world-building context
      prompt += this._buildSessionZeroContext(campaignFrame);
      prompt += this._buildStartingQuestsContext(campaignFrame);
    }

    prompt += `\n\nREQUIREMENTS:`;
    prompt += requirements.name ? `\nName: ${requirements.name}` : '\nName: Generate a fitting name';
    prompt += requirements.type ? `\nType: ${requirements.type}` : '\nType: Suggest a type (city, town, village, dungeon, wilderness, landmark, or other)';
    prompt += requirements.region ? `\nRegion: ${requirements.region}` : '\nRegion: Suggest a region';

    if (existingLocations.length > 0) {
      prompt += `\n\nEXISTING LOCATIONS:`;
      existingLocations.slice(0, 10).forEach(loc => {
        prompt += `\n- ${loc.name} (${loc.type || 'Unknown'} in ${loc.region || 'Unknown'})`;
      });
      if (existingLocations.length > 10) {
        prompt += `\n... and ${existingLocations.length - 10} more`;
      }
    } else {
      prompt += `\n\nThis is the first location for this campaign.`;
    }

    prompt += `\n\nPlease generate a location with this JSON structure:
\`\`\`json
{
  "name": "string",
  "type": "city" | "town" | "village" | "dungeon" | "wilderness" | "landmark" | "other",
  "region": "string",
  "description": "2-3 sentences describing the location",
  "notableFeatures": "Key landmarks or characteristics",
  "secrets": "Hidden elements or mysteries (DM-only information)",
  "inhabitants": "Who lives or frequents here"
}
\`\`\`

Make sure the location fits the campaign's tone and is geographically consistent with existing locations.`;

    return prompt;
  },

  /**
   * Build a prompt for Encounter generation
   * @param {object} context - Generation context
   * @returns {string} Generated prompt
   */
  buildEncounterPrompt(context) {
    const { campaign, campaignFrame, partyLevel = 1, partySize = 4, requirements = {} } = context;
    const gameSystem = this._getGameSystemContext(campaign);

    let prompt = `You are creating a combat encounter for a ${gameSystem.name} campaign set in a ${gameSystem.genre} setting.

CAMPAIGN CONTEXT:
Campaign Name: ${campaign?.name || 'Untitled Campaign'}
Game System: ${gameSystem.name}`;

    if (campaignFrame) {
      if (campaignFrame.pitch) {
        prompt += `\nCampaign Pitch: ${campaignFrame.pitch}`;
      }
      if (campaignFrame.themes && campaignFrame.themes.length > 0) {
        prompt += `\nThemes: ${campaignFrame.themes.join(', ')}`;
      }
      // Include session zero world-building context
      prompt += this._buildSessionZeroContext(campaignFrame);
      prompt += this._buildStartingQuestsContext(campaignFrame);
    }

    prompt += `\n\nPARTY INFO:
Party Level: ${partyLevel}
Party Size: ${partySize} characters`;

    prompt += `\n\nREQUIREMENTS:`;
    prompt += requirements.difficulty ? `\nDifficulty: ${requirements.difficulty}` : '\nDifficulty: Suggest appropriate difficulty (easy, medium, hard, or deadly)';
    prompt += requirements.environment ? `\nEnvironment: ${requirements.environment}` : '\nEnvironment: Suggest an environment';
    prompt += requirements.enemyTypes ? `\nEnemy Types: ${requirements.enemyTypes}` : '\nEnemy Types: Suggest appropriate enemies';

    prompt += `\n\nPlease generate an encounter with this JSON structure:
\`\`\`json
{
  "name": "string",
  "difficulty": "easy" | "medium" | "hard" | "deadly",
  "environment": "string describing the encounter location",
  "description": "2-3 sentences setting the scene",
  "enemies": "List of enemies and approximate numbers",
  "tactics": "How the enemies fight and their strategy",
  "rewards": "Potential loot, experience, or other rewards",
  "freshCutGrassLink": "" (leave empty)
}
\`\`\`

Balance the encounter for the party level and size. Make it thematically appropriate to the campaign.`;

    return prompt;
  },

  /**
   * Build a prompt for Campaign Frame sections
   * @param {string} step - Which step/section
   * @param {object} context - Generation context
   * @returns {string} Generated prompt
   */
  buildCampaignFramePrompt(step, context) {
    const { campaign, existingData = {}, requirements = {} } = context;

    const stepPrompts = {
      pitch: this._buildPitchPrompt(campaign, requirements),
      toneAndFeel: this._buildToneFeelPrompt(campaign, existingData, requirements),
      themes: this._buildThemesPrompt(campaign, existingData, requirements),
      touchstones: this._buildTouchstonesPrompt(campaign, existingData, requirements),
      overview: this._buildOverviewPrompt(campaign, existingData, requirements),
      incitingIncident: this._buildIncitingIncidentPrompt(campaign, existingData, requirements),
      playerPrinciples: this._buildPlayerPrinciplesPrompt(campaign, existingData),
      gmPrinciples: this._buildGMPrinciplesPrompt(campaign, existingData),
      sessionZeroQuestions: this._buildSessionZeroPrompt(campaign, existingData)
    };

    return stepPrompts[step] || `Generate content for the ${step} section of the campaign frame.`;
  },

  // Private helper methods for campaign frame prompts

  _buildPitchPrompt(campaign, requirements) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Create a compelling 2-3 sentence campaign pitch for a ${gameSystem.name} campaign named "${campaign?.name || 'Untitled Campaign'}".

SETTING: ${gameSystem.genre}
Game System: ${gameSystem.name}
${requirements.genre ? `Additional Genre/Style: ${requirements.genre}` : ''}
${requirements.inspiration ? `Inspired by: ${requirements.inspiration}` : ''}
${campaign?.description ? `Additional context: ${campaign.description}` : ''}

The pitch should:
- Hook players immediately
- Clearly state the core conflict or premise
- Set expectations for tone and scope
- Make players excited to participate
- Be appropriate for the ${gameSystem.genre} setting

Respond with just the pitch text, no additional formatting.`;
  },

  _buildToneFeelPrompt(campaign, existingData, requirements) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Suggest 5-8 descriptive words that capture the tone and feel of this ${gameSystem.name} campaign: "${campaign?.name || 'Untitled Campaign'}"

SETTING: ${gameSystem.genre}
${existingData.pitch ? `Campaign Pitch: ${existingData.pitch}` : ''}
${requirements.preferences ? `Desired feel: ${requirements.preferences}` : ''}

Examples of tone/feel words: Adventurous, Dark, Whimsical, Gritty, Epic, Mysterious, Lighthearted, Tense, Heroic, Tragic, Political, Romantic, Horror

Make sure the tone words are appropriate for a ${gameSystem.genre} setting.

Respond with a JSON array of words:
\`\`\`json
["word1", "word2", "word3", ...]
\`\`\``;
  },

  _buildThemesPrompt(campaign, existingData, requirements) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Identify 4-6 narrative and emotional themes for this ${gameSystem.name} campaign: "${campaign?.name || 'Untitled Campaign'}"

SETTING: ${gameSystem.genre}
${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.toneAndFeel ? `Tone: ${existingData.toneAndFeel.join(', ')}` : ''}

Themes are the deeper questions and ideas the campaign explores.

Examples: Duty vs. Ethics, Transformation, Survival, Cultural Clash, Power and Corruption, Redemption, Family, Identity

Make sure themes are appropriate for a ${gameSystem.genre} setting.

Respond with a JSON array:
\`\`\`json
["theme1", "theme2", "theme3", ...]
\`\`\``;
  },

  _buildTouchstonesPrompt(campaign, existingData, requirements) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Suggest 3-5 cultural touchstones (films, books, games, shows) that inspire the feel of this ${gameSystem.name} campaign: "${campaign?.name || 'Untitled Campaign'}"

SETTING: ${gameSystem.genre}
${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.toneAndFeel ? `Tone: ${existingData.toneAndFeel.join(', ')}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}

Touchstones help players understand the campaign's vibe. Suggest media appropriate for the ${gameSystem.genre} setting.

Respond with a JSON array:
\`\`\`json
["Media Title 1", "Media Title 2", ...]
\`\`\``;
  },

  _buildOverviewPrompt(campaign, existingData, requirements) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Write a 2-3 paragraph campaign overview for "${campaign?.name || 'Untitled Campaign'}" using ${gameSystem.name}.

SETTING: ${gameSystem.genre}
${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}

The overview should provide:
- Background lore and setting details appropriate for ${gameSystem.genre}
- The current state of the world
- Key factions, locations, or conflicts
- Enough context for players to create connected characters

Respond with the overview text.`;
  },

  _buildIncitingIncidentPrompt(campaign, existingData, requirements) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Create an inciting incident to launch the ${gameSystem.name} campaign "${campaign?.name || 'Untitled Campaign'}"

SETTING: ${gameSystem.genre}
${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.overview ? `Overview: ${existingData.overview.substring(0, 300)}...` : ''}

The inciting incident should:
- Be a compelling hook for the first session
- Draw all characters into the action
- Connect to the campaign's core themes
- Create urgency and investment
- Be appropriate for a ${gameSystem.genre} setting

Respond with 2-4 sentences describing the incident.`;
  },

  _buildPlayerPrinciplesPrompt(campaign, existingData) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Create 3-4 player principles for the ${gameSystem.name} campaign "${campaign?.name || 'Untitled Campaign'}"

SETTING: ${gameSystem.genre}
${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}

Player principles guide how players should approach the campaign. They should be:
- Specific to this campaign
- Actionable and clear
- Reinforce the themes
- Appropriate for ${gameSystem.genre}

Examples: "Make it personal", "Embrace vulnerability", "Question authority"

Respond with a JSON array:
\`\`\`json
["Principle 1", "Principle 2", ...]
\`\`\``;
  },

  _buildGMPrinciplesPrompt(campaign, existingData) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Create 3-4 GM principles for running the ${gameSystem.name} campaign "${campaign?.name || 'Untitled Campaign'}"

SETTING: ${gameSystem.genre}
${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}

GM principles guide how the GM should run the campaign. They should be:
- Specific to this campaign
- Actionable and clear
- Support the themes and tone
- Appropriate for ${gameSystem.genre}

Examples: "Show true danger", "Make them choose", "Paint contrast"

Respond with a JSON array:
\`\`\`json
["Principle 1", "Principle 2", ...]
\`\`\``;
  },

  _buildSessionZeroPrompt(campaign, existingData) {
    const gameSystem = this._getGameSystemContext(campaign);

    return `Create 5-10 session zero questions for the ${gameSystem.name} campaign "${campaign?.name || 'Untitled Campaign'}"

SETTING: ${gameSystem.genre}
${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}
${existingData.overview ? `Overview: ${existingData.overview.substring(0, 200)}...` : ''}

Session zero questions should:
- Help players connect their characters to the world
- Establish shared world details
- Create personal stakes
- Build character relationships
- Be appropriate for ${gameSystem.genre}

Respond with a JSON array:
\`\`\`json
["Question 1?", "Question 2?", ...]
\`\`\``;
  },

  /**
   * Main build function - routes to appropriate builder
   * @param {string} type - Type of content to generate
   * @param {object} context - Generation context
   * @returns {string} Generated prompt
   */
  build(type, context) {
    switch (type) {
      case 'npc':
        return this.buildNPCPrompt(context);
      case 'location':
        return this.buildLocationPrompt(context);
      case 'encounter':
        return this.buildEncounterPrompt(context);
      case 'campaignFrame':
        return this.buildCampaignFramePrompt(context.step, context);
      default:
        throw new Error(`Unknown generation type: ${type}`);
    }
  }
};
