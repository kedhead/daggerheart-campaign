/**
 * Battle Map Generator Service
 * Generates battle maps and assets using AI via 1min.ai
 */

import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Generate a battle map image using AI
 * @param {object} options - Generation options
 * @param {string} options.prompt - Description of the map to generate
 * @param {string} options.type - Map type: 'battle-map', 'dungeon', 'outdoor', 'city'
 * @param {string} options.model - AI model to use
 * @param {string} options.size - Image size (e.g., '1024x1024')
 * @param {boolean} options.animated - Whether to generate animated/video map
 * @returns {Promise<object>} Generated map data with URL
 */
export async function generateBattleMap(options) {
  const {
    prompt,
    type = 'battle-map',
    model = 'dall-e-3',  // Default to DALL-E 3 (direct OpenAI, faster than 1min.ai)
    size = '1024x1024',
    style = 'vivid',
    animated = false
  } = options;

  if (!prompt) {
    throw new Error('Prompt is required');
  }

  console.log('Generating battle map:', { prompt, type, model, size, animated });

  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      type,
      model,
      size,
      style,
      animated
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || 'Failed to generate map');
  }

  const data = await response.json();
  return {
    url: data.imageUrl,
    prompt: data.prompt,
    model: data.model,
    animated: data.animated,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate a map asset/tile using AI
 * @param {object} options - Generation options
 * @param {string} options.prompt - Description of the asset
 * @param {string} options.category - Asset category
 * @param {boolean} options.removeBackground - Whether to remove background after generation
 * @returns {Promise<object>} Generated asset data
 */
export async function generateMapAsset(options) {
  const { prompt, category = 'object', removeBackground = false } = options;

  if (!prompt) {
    throw new Error('Prompt is required');
  }

  // Generate the asset image
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      type: 'asset',
      model: 'magic-art_7_0',
      size: '1024x1024'
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || 'Failed to generate asset');
  }

  const data = await response.json();
  let finalUrl = data.imageUrl;

  // Optionally remove background
  if (removeBackground && finalUrl) {
    console.log('Removing background from generated asset...');
    try {
      const bgResponse = await fetch('/api/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: finalUrl })
      });

      if (bgResponse.ok) {
        const bgData = await bgResponse.json();
        finalUrl = bgData.imageUrl;
        console.log('Background removed successfully');
      } else {
        console.warn('Background removal failed, using original image');
      }
    } catch (bgError) {
      console.warn('Background removal error:', bgError);
      // Continue with original image if background removal fails
    }
  }

  return {
    id: `ai_asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: prompt.substring(0, 50),
    url: finalUrl,
    category,
    prompt: data.prompt,
    backgroundRemoved: removeBackground,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Download an image and save to Firebase Storage for persistence
 * @param {string} imageUrl - URL of the image to save
 * @param {string} campaignId - Campaign ID for storage path
 * @param {string} type - Type of image (map/asset)
 * @returns {Promise<string>} Firebase Storage download URL
 */
export async function saveGeneratedImage(imageUrl, campaignId, type = 'map') {
  try {
    // Fetch the image
    const response = await fetch('/api/download-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl })
    });

    if (!response.ok) {
      throw new Error('Failed to download image');
    }

    const { dataUrl } = await response.json();

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const storagePath = `campaigns/${campaignId}/battleMaps/${type}_${timestamp}.png`;
    const storageRef = ref(storage, storagePath);

    console.log('Uploading generated image to Firebase Storage...');
    await uploadString(storageRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('Image saved to Storage:', downloadUrl);

    return downloadUrl;
  } catch (error) {
    console.error('Error saving generated image:', error);
    throw error;
  }
}

/**
 * Build prompts for different map types
 */
export const mapPromptTemplates = {
  dungeon: {
    label: 'Dungeon',
    templates: [
      { label: 'Classic Dungeon', prompt: 'Stone dungeon with corridors, multiple rooms, secret doors, treasure chamber' },
      { label: 'Cave System', prompt: 'Natural cave system with underground river, stalactites, multiple caverns' },
      { label: 'Ancient Ruins', prompt: 'Ruined temple with crumbling pillars, overgrown vegetation, altar room' },
      { label: 'Crypt', prompt: 'Dark crypt with sarcophagi, burial chambers, undead lair aesthetic' },
      { label: 'Mine', prompt: 'Abandoned mine with rail tracks, support beams, collapsed sections' }
    ]
  },
  outdoor: {
    label: 'Outdoor',
    templates: [
      { label: 'Forest Clearing', prompt: 'Forest clearing with ancient trees, fallen logs, campfire area' },
      { label: 'River Crossing', prompt: 'River ford with bridge, rocky banks, nearby camp' },
      { label: 'Mountain Pass', prompt: 'Narrow mountain pass with cliffs, boulders, ambush points' },
      { label: 'Swamp', prompt: 'Murky swamp with dead trees, foggy atmosphere, scattered islands' },
      { label: 'Beach Cove', prompt: 'Coastal cove with sandy beach, rocky outcrops, shipwreck' }
    ]
  },
  city: {
    label: 'Urban',
    templates: [
      { label: 'Market Square', prompt: 'Medieval market square with stalls, fountain, surrounding buildings' },
      { label: 'Tavern Interior', prompt: 'Cozy tavern interior with bar, tables, fireplace, stairs to upper floor' },
      { label: 'Noble Estate', prompt: 'Wealthy estate with gardens, manor house, stables' },
      { label: 'Docks', prompt: 'Harbor docks with warehouses, ships, cargo crates' },
      { label: 'Alley Fight', prompt: 'Dark city alley with crates, barrels, rooftop access' }
    ]
  },
  special: {
    label: 'Special',
    templates: [
      { label: 'Dragon Lair', prompt: 'Massive dragon lair with treasure hoard, bones, multiple entry points' },
      { label: 'Wizard Tower', prompt: 'Interior of wizard tower with magical circles, bookshelves, portal' },
      { label: 'Arena', prompt: 'Gladiatorial arena with sand floor, spectator stands, gate entrances' },
      { label: 'Throne Room', prompt: 'Grand throne room with columns, red carpet, side chambers' },
      { label: 'Planar Portal', prompt: 'Mystical location with active portal, floating islands, ethereal aesthetic' }
    ]
  }
};

/**
 * Asset categories and example prompts
 */
export const assetCategories = {
  creatures: {
    label: 'Creatures',
    examples: ['goblin token', 'dragon token', 'skeleton warrior', 'orc berserker', 'giant spider']
  },
  furniture: {
    label: 'Furniture',
    examples: ['wooden table', 'throne chair', 'bookshelf', 'treasure chest', 'bed']
  },
  terrain: {
    label: 'Terrain',
    examples: ['boulder', 'tree stump', 'campfire', 'well', 'statue']
  },
  hazards: {
    label: 'Hazards',
    examples: ['spike trap', 'poison gas vent', 'lava pit', 'pit trap', 'magic rune']
  },
  objects: {
    label: 'Objects',
    examples: ['barrel', 'crate', 'altar', 'brazier', 'pillar']
  }
};

export const battleMapGeneratorService = {
  generateBattleMap,
  generateMapAsset,
  saveGeneratedImage,
  mapPromptTemplates,
  assetCategories
};
