/**
 * Prompt Builder Service
 * Generates context-aware prompts for AI generation
 * Includes campaign context, existing content, and specific requirements
 */

export const promptBuilder = {
  /**
   * Build a prompt for NPC generation
   * @param {object} context - Generation context
   * @returns {string} Generated prompt
   */
  buildNPCPrompt(context) {
    const { campaign, campaignFrame, existingNPCs = [], requirements = {} } = context;

    let prompt = `You are helping create an NPC for a Daggerheart TTRPG campaign.

CAMPAIGN CONTEXT:
Campaign Name: ${campaign?.name || 'Untitled Campaign'}`;

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

    let prompt = `You are helping create a location for a Daggerheart TTRPG campaign.

CAMPAIGN CONTEXT:
Campaign Name: ${campaign?.name || 'Untitled Campaign'}`;

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

    let prompt = `You are creating a combat encounter for a Daggerheart TTRPG campaign.

CAMPAIGN CONTEXT:
Campaign Name: ${campaign?.name || 'Untitled Campaign'}`;

    if (campaignFrame) {
      if (campaignFrame.pitch) {
        prompt += `\nCampaign Pitch: ${campaignFrame.pitch}`;
      }
      if (campaignFrame.themes && campaignFrame.themes.length > 0) {
        prompt += `\nThemes: ${campaignFrame.themes.join(', ')}`;
      }
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
    return `Create a compelling 2-3 sentence campaign pitch for a Daggerheart TTRPG campaign named "${campaign?.name || 'Untitled Campaign'}".

${requirements.genre ? `Genre/Style: ${requirements.genre}` : ''}
${requirements.inspiration ? `Inspired by: ${requirements.inspiration}` : ''}
${campaign?.description ? `Additional context: ${campaign.description}` : ''}

The pitch should:
- Hook players immediately
- Clearly state the core conflict or premise
- Set expectations for tone and scope
- Make players excited to participate

Respond with just the pitch text, no additional formatting.`;
  },

  _buildToneFeelPrompt(campaign, existingData, requirements) {
    return `Suggest 5-8 descriptive words that capture the tone and feel of this Daggerheart campaign: "${campaign?.name || 'Untitled Campaign'}"

${existingData.pitch ? `Campaign Pitch: ${existingData.pitch}` : ''}
${requirements.preferences ? `Desired feel: ${requirements.preferences}` : ''}

Examples of tone/feel words: Adventurous, Dark, Whimsical, Gritty, Epic, Mysterious, Lighthearted, Tense, Heroic, Tragic, Political, Romantic, Horror

Respond with a JSON array of words:
\`\`\`json
["word1", "word2", "word3", ...]
\`\`\``;
  },

  _buildThemesPrompt(campaign, existingData, requirements) {
    return `Identify 4-6 narrative and emotional themes for this Daggerheart campaign: "${campaign?.name || 'Untitled Campaign'}"

${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.toneAndFeel ? `Tone: ${existingData.toneAndFeel.join(', ')}` : ''}

Themes are the deeper questions and ideas the campaign explores.

Examples: Duty vs. Ethics, Transformation, Survival, Cultural Clash, Power and Corruption, Redemption, Family, Identity

Respond with a JSON array:
\`\`\`json
["theme1", "theme2", "theme3", ...]
\`\`\``;
  },

  _buildTouchstonesPrompt(campaign, existingData, requirements) {
    return `Suggest 3-5 cultural touchstones (films, books, games, shows) that inspire the feel of this campaign: "${campaign?.name || 'Untitled Campaign'}"

${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.toneAndFeel ? `Tone: ${existingData.toneAndFeel.join(', ')}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}

Touchstones help players understand the campaign's vibe.

Respond with a JSON array:
\`\`\`json
["Media Title 1", "Media Title 2", ...]
\`\`\``;
  },

  _buildOverviewPrompt(campaign, existingData, requirements) {
    return `Write a 2-3 paragraph campaign overview for "${campaign?.name || 'Untitled Campaign'}"

${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}

The overview should provide:
- Background lore and setting details
- The current state of the world
- Key factions, locations, or conflicts
- Enough context for players to create connected characters

Respond with the overview text.`;
  },

  _buildIncitingIncidentPrompt(campaign, existingData, requirements) {
    return `Create an inciting incident to launch the campaign "${campaign?.name || 'Untitled Campaign'}"

${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.overview ? `Overview: ${existingData.overview.substring(0, 300)}...` : ''}

The inciting incident should:
- Be a compelling hook for the first session
- Draw all characters into the action
- Connect to the campaign's core themes
- Create urgency and investment

Respond with 2-4 sentences describing the incident.`;
  },

  _buildPlayerPrinciplesPrompt(campaign, existingData) {
    return `Create 3-4 player principles for "${campaign?.name || 'Untitled Campaign'}"

${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}

Player principles guide how players should approach the campaign. They should be:
- Specific to this campaign
- Actionable and clear
- Reinforce the themes

Examples: "Make it personal", "Embrace vulnerability", "Question authority"

Respond with a JSON array:
\`\`\`json
["Principle 1", "Principle 2", ...]
\`\`\``;
  },

  _buildGMPrinciplesPrompt(campaign, existingData) {
    return `Create 3-4 GM principles for running "${campaign?.name || 'Untitled Campaign'}"

${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}

GM principles guide how the GM should run the campaign. They should be:
- Specific to this campaign
- Actionable and clear
- Support the themes and tone

Examples: "Show true danger", "Make them choose", "Paint contrast"

Respond with a JSON array:
\`\`\`json
["Principle 1", "Principle 2", ...]
\`\`\``;
  },

  _buildSessionZeroPrompt(campaign, existingData) {
    return `Create 5-10 session zero questions for "${campaign?.name || 'Untitled Campaign'}"

${existingData.pitch ? `Pitch: ${existingData.pitch}` : ''}
${existingData.themes ? `Themes: ${existingData.themes.join(', ')}` : ''}
${existingData.overview ? `Overview: ${existingData.overview.substring(0, 200)}...` : ''}

Session zero questions should:
- Help players connect their characters to the world
- Establish shared world details
- Create personal stakes
- Build character relationships

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
