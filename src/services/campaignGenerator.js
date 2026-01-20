/**
 * Campaign Content Generator
 * Generates NPCs, Locations, Lore, Encounters, and Timeline Events based on campaign frame
 */

import { templateService } from './templateService';
import { aiService } from './aiService';
import { promptBuilder } from './promptBuilder';
import { responseParser } from './responseParser';

/**
 * Generate starter content for a campaign based on its frame
 * @param {object} campaignFrame - The completed campaign frame
 * @param {object} campaign - The campaign document
 * @param {string} apiKey - Optional API key for AI generation
 * @param {string} provider - API provider (anthropic/openai)
 * @returns {Promise<object>} Generated content organized by type
 */
export async function generateCampaignContent(campaignFrame, campaign, apiKey = null, provider = 'anthropic') {
  const useAI = !!apiKey;

  const context = {
    campaign,
    campaignFrame,
    existingNPCs: [],
    existingLocations: [],
    existingLore: []
  };

  const generated = {
    npcs: [],
    locations: [],
    lore: [],
    encounters: [],
    timelineEvents: []
  };

  try {
    // Generate NPCs (5 starter NPCs)
    console.log('Generating NPCs...');
    for (let i = 0; i < 5; i++) {
      try {
        const npc = useAI
          ? await generateNPCWithAI(context, apiKey, provider)
          : templateService.generateRandomNPC(context);
        console.log('Generated NPC:', npc);
        generated.npcs.push(npc);
        context.existingNPCs.push(npc);
      } catch (err) {
        console.error(`Failed to generate NPC ${i + 1}:`, err);
        // Use template as fallback
        const npc = templateService.generateRandomNPC(context);
        generated.npcs.push(npc);
        context.existingNPCs.push(npc);
      }
    }

    // Generate Locations (4 starter locations)
    console.log('Generating Locations...');
    for (let i = 0; i < 4; i++) {
      try {
        const location = useAI
          ? await generateLocationWithAI(context, apiKey, provider)
          : templateService.generateRandomLocation(context);
        console.log('Generated Location:', location);
        generated.locations.push(location);
        context.existingLocations.push(location);
      } catch (err) {
        console.error(`Failed to generate Location ${i + 1}:`, err);
        const location = templateService.generateRandomLocation(context);
        generated.locations.push(location);
        context.existingLocations.push(location);
      }
    }

    // Generate Lore Entries (3 starter lore entries)
    console.log('Generating Lore...');
    for (let i = 0; i < 3; i++) {
      try {
        const lore = useAI
          ? await generateLoreWithAI(context, apiKey, provider, i)
          : generateLoreFromTemplate(campaignFrame, i);
        console.log('Generated Lore:', lore);
        generated.lore.push(lore);
      } catch (err) {
        console.error(`Failed to generate Lore ${i + 1}:`, err);
        const lore = generateLoreFromTemplate(campaignFrame, i);
        generated.lore.push(lore);
      }
    }

    // Generate Encounters (2 starter encounters)
    console.log('Generating Encounters...');
    for (let i = 0; i < 2; i++) {
      try {
        const encounter = useAI
          ? await generateEncounterWithAI(context, apiKey, provider, i)
          : templateService.generateRandomEncounter({ partyLevel: 1, partySize: 4 });
        console.log('Generated Encounter:', encounter);
        generated.encounters.push(encounter);
      } catch (err) {
        console.error(`Failed to generate Encounter ${i + 1}:`, err);
        const encounter = templateService.generateRandomEncounter({ partyLevel: 1, partySize: 4 });
        generated.encounters.push(encounter);
      }
    }

    // Generate Timeline Events (3 starter timeline events)
    console.log('Generating Timeline Events...');
    generated.timelineEvents = generateTimelineEvents(campaignFrame);
    console.log('Generated Timeline Events:', generated.timelineEvents);

    console.log('Final generated content:', generated);
    return generated;
  } catch (error) {
    console.error('Error generating campaign content:', error);
    throw error;
  }
}

/**
 * Generate NPC using AI
 */
async function generateNPCWithAI(context, apiKey, provider) {
  const prompt = promptBuilder.buildNPCPrompt(context);
  const response = await aiService.generate(prompt, apiKey, provider);
  return responseParser.parse('npc', response);
}

/**
 * Generate Location using AI
 */
async function generateLocationWithAI(context, apiKey, provider) {
  const prompt = promptBuilder.buildLocationPrompt(context);
  const response = await aiService.generate(prompt, apiKey, provider);
  return responseParser.parse('location', response);
}

/**
 * Generate Lore using AI
 */
async function generateLoreWithAI(context, apiKey, provider, index) {
  const loreTypes = ['history', 'legend', 'faction'];
  const loreType = loreTypes[index % loreTypes.length];

  // Build session zero context
  let sessionZeroContext = '';
  if (context.campaignFrame?.sessionZero) {
    const { sessionZero } = context.campaignFrame;
    if (sessionZero.worldFacts?.length > 0) {
      sessionZeroContext += '\n\nPLAYER-ESTABLISHED WORLD FACTS:';
      sessionZero.worldFacts.forEach(fact => {
        if (fact.fact) sessionZeroContext += `\n- ${fact.fact}`;
      });
    }
    if (sessionZero.playerLocations?.length > 0) {
      sessionZeroContext += '\n\nPLAYER-MENTIONED LOCATIONS:';
      sessionZero.playerLocations.forEach(loc => {
        if (loc.name) sessionZeroContext += `\n- ${loc.name}${loc.description ? `: ${loc.description}` : ''}`;
      });
    }
  }

  // Build starting quests context
  let questsContext = '';
  if (context.campaignFrame?.startingQuests?.length > 0) {
    questsContext += '\n\nSTARTING QUESTS:';
    context.campaignFrame.startingQuests.forEach(quest => {
      if (quest.name) questsContext += `\n- ${quest.name}${quest.description ? `: ${quest.description}` : ''}`;
    });
  }

  const prompt = `Create a ${loreType} entry for the campaign "${context.campaign.name || 'Untitled Campaign'}".

CAMPAIGN CONTEXT:
${context.campaignFrame.pitch ? `Pitch: ${context.campaignFrame.pitch}` : ''}
${context.campaignFrame.overview ? `Overview: ${context.campaignFrame.overview}` : ''}
${context.campaignFrame.themes ? `Themes: ${context.campaignFrame.themes.join(', ')}` : ''}${sessionZeroContext}${questsContext}

Generate a lore entry with this JSON structure:
\`\`\`json
{
  "title": "string",
  "category": "${loreType}",
  "content": "2-3 paragraphs of detailed lore",
  "tags": ["tag1", "tag2", "tag3"]
}
\`\`\`

Make it thematically consistent with the campaign. Incorporate player-established facts and locations where appropriate.`;

  const response = await aiService.generate(prompt, apiKey, provider);
  return responseParser.parse('lore', response);
}

/**
 * Generate Encounter using AI
 */
async function generateEncounterWithAI(context, apiKey, provider, index) {
  const difficulties = ['easy', 'medium'];
  const difficulty = difficulties[index % difficulties.length];

  const encounterContext = {
    ...context,
    partyLevel: 1,
    partySize: 4,
    requirements: { difficulty }
  };

  const prompt = promptBuilder.buildEncounterPrompt(encounterContext);
  const response = await aiService.generate(prompt, apiKey, provider);
  return responseParser.parse('encounter', response);
}

/**
 * Generate Lore from template
 */
function generateLoreFromTemplate(campaignFrame, index) {
  const loreTypes = ['history', 'legend', 'faction'];
  const loreType = loreTypes[index % loreTypes.length];

  const loreTitles = {
    history: ['The Founding Era', 'The Great War', 'The Age of Discovery'],
    legend: ['The Lost Artifact', 'The Ancient Prophecy', 'The Cursed Lands'],
    faction: ['The Order of Guardians', 'The Shadow Syndicate', 'The Merchant Guild']
  };

  const loreContent = {
    history: [
      'Long ago, the realm was united under a single banner. The founding families established laws and traditions that would last for generations. However, internal conflicts and external threats eventually led to the fragmentation of the empire.',
      'Centuries of warfare ravaged the land, pitting kingdom against kingdom. Heroes rose and fell, their deeds becoming legend. The scars of these battles can still be seen across the landscape.',
      'When explorers first ventured beyond the known world, they discovered wonders and horrors in equal measure. Ancient ruins, strange creatures, and powerful artifacts changed the course of history.'
    ],
    legend: [
      'Tales speak of a powerful artifact hidden deep within forgotten ruins. Many have sought it, but none have returned. Some say it grants immense power, while others claim it brings only doom.',
      'An ancient text foretells of a chosen one who will either save or doom the realm. The prophecy\'s words are cryptic, and scholars debate their meaning to this day.',
      'There are places in this world where the very land is cursed. Strange phenomena occur, the dead do not rest, and those who enter rarely return unchanged.'
    ],
    faction: [
      'An ancient order dedicated to protecting the realm from supernatural threats. They operate in secrecy, recruiting only the most skilled warriors and scholars.',
      'Operating from the shadows, this organization pulls strings across the realm. Their true goals remain a mystery, but their influence is undeniable.',
      'Controlling trade routes and commerce, this guild wields economic power that rivals any kingdom. Their members include the wealthiest merchants and craftspeople.'
    ]
  };

  return {
    title: loreTitles[loreType][index % 3],
    category: loreType,
    content: loreContent[loreType][index % 3],
    tags: campaignFrame.themes?.slice(0, 3) || ['campaign', 'lore', loreType]
  };
}

/**
 * Generate Timeline Events based on campaign frame
 */
function generateTimelineEvents(campaignFrame) {
  const events = [];

  // Ancient Past event
  events.push({
    title: 'The Age of Legends',
    date: '-1000 years',
    era: 'Ancient',
    description: 'The foundations of the world were laid. Ancient civilizations rose to power, wielding magic and technology long since lost.',
    importance: 'major',
    category: 'historical'
  });

  // Recent Past event
  events.push({
    title: 'The Turning Point',
    date: '-10 years',
    era: 'Recent',
    description: campaignFrame.overview
      ? `Events that set the stage for the current situation: ${campaignFrame.overview.substring(0, 150)}...`
      : 'A significant event that changed the political and social landscape of the realm.',
    importance: 'major',
    category: 'historical'
  });

  // Present Day event (Inciting Incident)
  if (campaignFrame.incitingIncident) {
    events.push({
      title: 'The Adventure Begins',
      date: 'Present',
      era: 'Present',
      description: campaignFrame.incitingIncident,
      importance: 'critical',
      category: 'campaign'
    });
  }

  return events;
}

export const campaignGeneratorService = {
  generateCampaignContent
};
