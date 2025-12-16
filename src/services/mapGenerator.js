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
/**
 * Get map style instructions based on game system
 * @param {string} gameSystem - The game system ID
 * @param {string} mapType - Type of map (world, regional, local, dungeon)
 * @param {string} customStyle - Optional custom style keywords to add
 * @returns {object} Style instructions and DALL-E prompt
 */
function getMapStyle(gameSystem, mapType, customStyle = null) {
  if (gameSystem === 'starwarsd6') {
    const holocronBase = {
      world: {
        inst: 'Star Wars Holocron-style galactic map with holographic blue/cyan glowing effects, black space background with stars, glowing star systems, hyperspace routes as cyan lines, futuristic fonts, technical coordinates, no parchment - pure sci-fi',
        dalle: 'Star Wars holographic galactic map, blue cyan glowing aesthetic, black space, glowing star systems, hyperspace routes as cyan trails, futuristic labels, scan lines, technical coordinates'
      },
      regional: {
        inst: 'Star Wars Holocron-style sector map with holographic blue/cyan effects, space background, hyperspace routes, space stations, asteroid fields, grid coordinates, futuristic fonts, holographic scan lines',
        dalle: 'Star Wars holographic sector map, blue cyan glowing, star systems, hyperspace routes, space stations, asteroid fields, futuristic labels, grid coordinates, holographic effects'
      },
      local: {
        inst: 'Star Wars Holocron-style planetary map with holographic blue/cyan effects, orbital view, landing zones, technical labels, coordinate grid, futuristic fonts, scan effects, pure sci-fi',
        dalle: 'Star Wars holographic location map, blue cyan glowing, buildings, landing pads, technical labels, coordinate grid, holographic scan effects, sci-fi design'
      },
      dungeon: {
        inst: 'Star Wars technical schematic with cyan/white on dark background, grid overlay, facility/ship interior, technical labels, security points, clean lines, Imperial schematic style',
        dalle: 'Star Wars technical schematic, cyan white on dark, blueprint facility interior, grid overlay, technical labels, precise lines, Imperial schematics style'
      }
    };
    const style = holocronBase[mapType] || holocronBase.world;
    const customSuffix = customStyle ? `, ${customStyle}` : '';
    return {
      instructions: 'IMPORTANT - Map Style: ' + style.inst + customSuffix,
      dallePrompt: style.dalle + customSuffix
    };
  }

  const fantasyBase = {
    world: {
      inst: 'Tolkien-esque fantasy cartography with hand-drawn aesthetic, parchment texture, flowing calligraphy, illustrated mountains/forests, decorative compass rose, ornate border',
      dalle: 'Tolkien-style fantasy map, parchment texture, hand-drawn, flowing calligraphy, illustrated mountains and forests, decorative compass rose, ornate Celtic border, aged appearance'
    },
    regional: {
      inst: 'Tolkien-esque regional fantasy map with hand-drawn aesthetic, parchment texture, flowing calligraphy, illustrated terrain, dotted roads, compass rose, scale bar',
      dalle: 'Tolkien-style regional fantasy map, parchment texture, hand-drawn, calligraphy labels, illustrated terrain, dotted paths, building icons, compass rose, scale bar, aged appearance'
    },
    local: {
      inst: 'Tolkien-esque town/city map with hand-drawn aesthetic, parchment texture, flowing calligraphy, isometric buildings, streets, decorative elements, compass rose',
      dalle: 'Tolkien-style town map, parchment texture, hand-drawn, isometric buildings, marked streets, calligraphy labels, decorative elements, compass rose, scale bar, aged appearance'
    },
    dungeon: {
      inst: 'Grid-based battle map with square grid overlay (5-foot squares), top-down view, thick walls, D&D door symbols, numbered rooms, labeled features, clean tactical design',
      dalle: 'Campaign dungeon battle map, square grid overlay (5ft), top-down view, thick black walls, D&D door symbols, numbered rooms, labeled features, tactical design suitable for VTT'
    }
  };
  const style = fantasyBase[mapType] || fantasyBase.world;
  const customSuffix = customStyle ? `, ${customStyle}` : '';
  return {
    instructions: 'IMPORTANT - Map Style: ' + style.inst + customSuffix,
    dallePrompt: style.dalle + customSuffix
  };
}


async function generateMapDescription(context, apiKey, provider) {
  const { campaign, locations = [], mapType = 'world', specificLocation = null, customStyle = null } = context;
  const gameSystem = campaign?.gameSystem || 'daggerheart';

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

${getMapStyle(gameSystem, "world", customStyle).instructions}

Format as JSON:
\`\`\`json
{
  "description": "Detailed description of the world geography",
  "regions": ["region1", "region2"],
  "features": ["ocean", "mountains", "forests"],
  "locationPlacements": [
    {"location": "City Name", "position": "northern coast", "coordinates": [x, y]}
  ],
  "style": "${getMapStyle(gameSystem, 'world', customStyle).dallePrompt}",
  "dallePrompt": "${getMapStyle(gameSystem, 'world', customStyle).dallePrompt} [ADD YOUR SPECIFIC MAP DETAILS HERE]"
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

${getMapStyle(gameSystem, 'regional', customStyle).instructions}

Format as JSON:
\`\`\`json
{
  "description": "Detailed description of the regional geography",
  "regions": ["region names"],
  "features": ["terrain features"],
  "locationPlacements": [
    {"location": "Location Name", "position": "relative position", "coordinates": [x, y]}
  ],
  "style": "${getMapStyle(gameSystem, 'regional', customStyle).dallePrompt}",
  "dallePrompt": "${getMapStyle(gameSystem, 'regional', customStyle).dallePrompt} [ADD YOUR SPECIFIC REGIONAL DETAILS HERE]"
}
\`\`\``;
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

${getMapStyle(gameSystem, 'local', customStyle).instructions}

Format as JSON:
\`\`\`json
{
  "description": "Detailed description of the local area",
  "districts": ["district names"],
  "landmarks": ["important landmarks"],
  "features": ["streets", "pathways", "points of interest"],
  "style": "${getMapStyle(gameSystem, 'local', customStyle).dallePrompt}",
  "dallePrompt": "${getMapStyle(gameSystem, 'local', customStyle).dallePrompt} [ADD YOUR SPECIFIC TOWN/CITY DETAILS HERE]"
}
\`\`\``;
  } else if (mapType === 'dungeon' && specificLocation) {
    prompt = `Create a dungeon map for "${specificLocation.name}".

LOCATION DETAILS:
Type: ${specificLocation.type}
Description: ${specificLocation.description || 'No description'}
Notable Features: ${specificLocation.notableFeatures || 'None listed'}

Generate a dungeon map description showing:
1. Room layout with numbered chambers
2. Corridors and passages
3. Entrances and exits
4. Traps, hazards, or special features
5. Points of interest (treasure, monsters, puzzles)

${getMapStyle(gameSystem, 'dungeon', customStyle).instructions}

Format as JSON:
\`\`\`json
{
  "description": "Detailed description of the dungeon layout and features",
  "rooms": ["Room 1: Description", "Room 2: Description"],
  "connections": ["corridors", "secret passages"],
  "features": ["traps", "treasure", "encounters"],
  "gridSize": "5-foot squares",
  "style": "${getMapStyle(gameSystem, 'dungeon', customStyle).dallePrompt}",
  "dallePrompt": "${getMapStyle(gameSystem, 'dungeon', customStyle).dallePrompt} [ADD YOUR SPECIFIC DUNGEON DETAILS HERE]"
}
\`\`\``;
  }

  const response = await aiService.generate(prompt, apiKey, provider);
  console.log('Raw AI response:', response);

  // Try multiple JSON extraction patterns
  const patterns = [
    // Standard markdown code blocks (with capture groups)
    /```json\s*\n([\s\S]*?)\n```/,
    /```json\s*([\s\S]*?)```/,
    /```\s*\n([\s\S]*?)\n```/,
    /```([\s\S]*?)```/,
    // JSON object without code blocks (with capture groups)
    /(\{[\s\S]*"description"[\s\S]*\})/,
    // Look for first { to last } (already has capture group)
    /(\{[\s\S]*\})/
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match && match[1]) {
      const jsonText = match[1].trim();
      console.log('Attempting to parse JSON from pattern:', pattern.source);
      console.log('Extracted text:', jsonText.substring(0, 200) + '...');

      try {
        const parsed = JSON.parse(jsonText);
        // Validate it has the expected structure
        if (parsed && typeof parsed === 'object') {
          console.log('Successfully parsed JSON');
          return parsed;
        }
      } catch (err) {
        console.log('Failed to parse with this pattern:', err.message);
        continue;
      }
    }
  }

  // Last resort: try to parse the whole response
  try {
    console.log('Attempting to parse entire response as JSON');
    const parsed = JSON.parse(response.trim());
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (err) {
    // Log the full error details
    console.error('All JSON parsing attempts failed');
    console.error('Response length:', response.length);
    console.error('First 500 chars:', response.substring(0, 500));
    console.error('Last 500 chars:', response.substring(response.length - 500));
    throw new Error('Failed to parse map description from AI response. Check console for details.');
  }

  throw new Error('Failed to parse map description from AI response');
}

/**
 * Download an image from a URL and convert to data URL
 * Uses backend proxy to avoid CORS issues
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} Data URL (base64)
 */
async function downloadImageAsDataUrl(imageUrl) {
  try {
    const response = await fetch('/api/download-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Failed to download image: ${response.statusText}`);
    }

    const data = await response.json();
    return data.dataUrl;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * Generate a map image using DALL-E
 * @param {string} prompt - DALL-E prompt
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} Image data URL (base64)
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
  const imageUrl = data.data[0].url;

  // Download and convert to data URL so it doesn't expire
  console.log('Downloading DALL-E image to convert to data URL...');
  const dataUrl = await downloadImageAsDataUrl(imageUrl);
  console.log('Image converted to data URL');

  return dataUrl;
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
      description: mapDescription.description || 'A generated map',
      regions: mapDescription.regions || [],
      features: mapDescription.features || [],
      locationPlacements: mapDescription.locationPlacements || [],
      climateZones: mapDescription.climateZones || [], // Was missing!
      geographicalFeatures: mapDescription.geographicalFeatures || [], // Was missing!
      districts: mapDescription.districts || [],
      landmarks: mapDescription.landmarks || [],
      rooms: mapDescription.rooms || [], // For dungeon maps
      connections: mapDescription.connections || [], // For dungeon maps
      gridSize: mapDescription.gridSize || null, // For dungeon maps
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
