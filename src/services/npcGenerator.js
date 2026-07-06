import { aiService } from './aiService';
import { promptBuilder } from './promptBuilder';
import { responseParser } from './responseParser';

/**
 * Generate a Daggerheart/campaign NPC (bio, personality, hooks — no combat stats).
 * Wraps the existing promptBuilder.buildNPCPrompt()/responseParser.parseNPC() pair
 * (already used internally by sessionPlanGenerator.js) rather than hand-rolling a
 * new prompt, and appends the shared campaign-brain context on top so the NPC can
 * reference recent sessions, items, or story beats that buildNPCPrompt alone
 * doesn't know about.
 *
 * @param {object} args
 * @param {string}  args.concept          - Free-text concept/description from the DM
 * @param {object}  args.campaign
 * @param {object=} args.campaignFrame
 * @param {Array=}  args.existingNPCs      - For name/ancestry collision avoidance
 * @param {Array=}  args.existingLocations - So the NPC can be placed at a real location
 * @param {string=} args.apiKey
 * @param {string=} args.provider          - 'anthropic' | 'openai'
 * @param {string=} args.campaignContext   - Output of buildCampaignContext()
 * @returns {Promise<object>} { name, ancestry, occupation, location, relationship, description, notes, firstMet, hidden }
 */
export async function generateNPC({
  concept,
  campaign,
  campaignFrame = null,
  existingNPCs = [],
  existingLocations = [],
  apiKey,
  provider = 'anthropic',
  campaignContext = ''
}) {
  if (!concept?.trim()) throw new Error('Please describe the NPC concept.');

  const basePrompt = promptBuilder.buildNPCPrompt({
    campaign,
    campaignFrame,
    existingNPCs,
    existingLocations,
    requirements: { description: concept }
  });

  // Append the shared campaign-brain context (items/maps/storybook/sessions/etc.)
  // as additional grounding beyond what buildNPCPrompt derives from campaignFrame
  // alone — this is what lets a generated NPC reference recent sessions, items,
  // or story beats without duplicating buildNPCPrompt's own campaign section.
  const prompt = campaignContext
    ? `${basePrompt}\n\n=== FULL CAMPAIGN BRAIN (for continuity — reference freely) ===\n${campaignContext}\n=== END CAMPAIGN BRAIN ===`
    : basePrompt;

  const raw = await aiService.generate(prompt, apiKey, provider);
  const parsed = responseParser.parse('npc', raw);

  return {
    ...parsed,
    hidden: false
  };
}
