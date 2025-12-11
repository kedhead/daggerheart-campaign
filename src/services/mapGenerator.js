/**
 * Map Generator Service
 * Generates maps using AI - descriptions with Claude/GPT, images with DALL-E
 */

import { aiService } from './aiService';

/**
 * Generate a map description using AI
 * @param {object} context - Map context (campaign, locations, type)
 * @param {string} apiKey - API key
 * @param {string} provider - API provider
 * @returns {Promise<object>} Map description and metadata
 */
async function generateMapDescription(context, apiKey, provider) {
  const { campaign, locations = [], mapType = 'world', specificLocation = null } = context;

  let prompt = '';

  if (mapType === 'world') {
    prompt = `Create a detailed world map description for the campaign "${campaign.name || 'Untitled Campaign'}".

CAMPAIGN CONTEXT:
${campaign.pitch ? `Pitch: ${campaign.pitch}` : ''}
${campaign.overview ? `Overview: ${campaign.overview}` : ''}
${campaign.themes ? `Themes: ${campaign.themes.join(', ')}` : ''}

LOCATIONS TO INCLUDE:
${locations.map(loc => `- ${loc.name} (${loc.type}): ${loc.region || 'Unknown region'}`).join('\n')}

Generate a map description with:
1. Overall geography (continents, oceans, major terrain)
2. Climate zones
3. Where each location is positioned
4. Notable geographical features
5. Scale/size of the world

Format as JSON:
\`\`\`json
{
  "description": "Detailed description of the world geography",
  "regions": ["region1", "region2"],
  "features": ["ocean", "mountains", "forests"],
  "locationPlacements": [
    {"location": "City Name", "position": "northern coast", "coordinates": [x, y]}
  ],
  "style": "hand-drawn fantasy map",
  "dallePrompt": "A comprehensive prompt for DALL-E to generate this map"
}
\`\`\``;
  } else if (mapType === 'regional' && specificLocation) {
    prompt = `Create a regional map description centered on "${specificLocation.name}".

LOCATION DETAILS:
Type: ${specificLocation.type}
Region: ${specificLocation.region || 'Unknown'}
Description: ${specificLocation.description || 'No description'}

NEARBY LOCATIONS:
${locations.filter(loc => loc.id !== specificLocation.id).slice(0, 5).map(loc =>
  `- ${loc.name} (${loc.type})`
).join('\n')}

Generate a regional map description showing:
1. The main location (${specificLocation.name}) in detail
2. Surrounding terrain and geography
3. Nearby locations and landmarks
4. Roads, rivers, or other connections
5. Scale (roughly 50-100 miles radius)

Format as JSON with description, features, and dallePrompt.`;
  } else if (mapType === 'local' && specificLocation) {
    prompt = `Create a local/city map description for "${specificLocation.name}".

LOCATION DETAILS:
Type: ${specificLocation.type}
Description: ${specificLocation.description || 'No description'}
Notable Features: ${specificLocation.notableFeatures || 'None listed'}

Generate a local map description showing:
1. Major districts or areas
2. Important buildings/landmarks
3. Streets or pathways
4. Points of interest
5. Scale (walkable city/town map)

Format as JSON with description, districts, landmarks, and dallePrompt.`;
  }

  const response = await aiService.generate(prompt, apiKey, provider);

  // Parse JSON from response
  const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // Fallback: try to parse the whole response
  return JSON.parse(response);
}

/**
 * Generate a map image using DALL-E
 * @param {string} prompt - DALL-E prompt
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} Image URL
 */
async function generateMapImage(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data[0].url;
}

/**
 * Generate a complete map (description + optional image)
 * @param {object} context - Map context
 * @param {string} apiKey - API key for description
 * @param {string} provider - Provider for description (anthropic/openai)
 * @param {string} openaiKey - Optional OpenAI key for DALL-E
 * @param {boolean} generateImage - Whether to generate image with DALL-E
 * @returns {Promise<object>} Complete map data
 */
export async function generateMap(context, apiKey, provider, openaiKey = null, generateImage = false) {
  try {
    console.log('Generating map description...');
    const mapDescription = await generateMapDescription(context, apiKey, provider);
    console.log('Map description generated:', mapDescription);

    const mapData = {
      type: context.mapType || 'world',
      name: context.mapName || `${context.campaign.name} Map`,
      description: mapDescription.description,
      regions: mapDescription.regions || [],
      features: mapDescription.features || [],
      locationPlacements: mapDescription.locationPlacements || [],
      style: mapDescription.style || 'hand-drawn fantasy',
      imageUrl: null,
      createdAt: new Date().toISOString()
    };

    // Generate image if OpenAI key provided and requested
    if (generateImage && openaiKey && mapDescription.dallePrompt) {
      console.log('Generating map image with DALL-E...');
      try {
        const imageUrl = await generateMapImage(mapDescription.dallePrompt, openaiKey);
        mapData.imageUrl = imageUrl;
        console.log('Map image generated:', imageUrl);
      } catch (err) {
        console.error('Failed to generate map image:', err);
        // Continue without image - we still have the description
      }
    }

    return mapData;
  } catch (error) {
    console.error('Error generating map:', error);
    throw error;
  }
}

/**
 * Generate a simple text-based map without AI (fallback)
 * @param {object} context - Map context
 * @returns {object} Simple map data
 */
export function generateSimpleMap(context) {
  const { campaign, locations = [], mapType = 'world' } = context;

  return {
    type: mapType,
    name: `${campaign.name || 'Campaign'} Map`,
    description: `A ${mapType} map for ${campaign.name || 'the campaign'}. This map shows the major locations and their relative positions.`,
    regions: [...new Set(locations.map(loc => loc.region).filter(Boolean))],
    features: ['mountains', 'forests', 'rivers', 'settlements'],
    locationPlacements: locations.map((loc, i) => ({
      location: loc.name,
      position: `Region ${i + 1}`,
      coordinates: null
    })),
    style: 'simple text description',
    imageUrl: null,
    createdAt: new Date().toISOString()
  };
}

export const mapGeneratorService = {
  generateMap,
  generateMapDescription,
  generateMapImage,
  generateSimpleMap
};
