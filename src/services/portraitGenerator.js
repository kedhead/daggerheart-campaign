/**
 * Portrait Generator Service
 * Generates character portraits using DALL-E
 */

import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

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
 * Generate a portrait image using DALL-E
 * @param {string} prompt - DALL-E prompt
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} Image data URL (base64)
 */
async function generatePortraitImage(prompt, apiKey) {
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
      style: 'vivid'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const imageUrl = data.data[0].url;

  // Download and convert to data URL so it doesn't expire
  console.log('Downloading DALL-E portrait to convert to data URL...');
  const dataUrl = await downloadImageAsDataUrl(imageUrl);
  console.log('Portrait converted to data URL');

  return dataUrl;
}

/**
 * Build a DALL-E prompt for an NPC portrait
 * @param {object} npc - NPC data with name, description, occupation, etc.
 * @param {string} gameSystem - The game system (daggerheart, starwarsd6, etc.)
 * @returns {string} DALL-E prompt
 */
function buildNPCPortraitPrompt(npc, gameSystem = 'daggerheart') {
  const { name, description, occupation, relationship } = npc;

  // Base style based on game system
  let styleBase = '';
  if (gameSystem === 'starwarsd6') {
    styleBase = 'Star Wars character portrait, sci-fi aesthetic, dramatic lighting, cinematic quality';
  } else {
    styleBase = 'Fantasy RPG character portrait, detailed fantasy art style, dramatic lighting, painterly quality';
  }

  // Build character description
  let characterDesc = '';
  if (description) {
    // Extract physical appearance from description if present
    characterDesc = description;
  }

  // Add occupation context
  let occupationContext = '';
  if (occupation) {
    occupationContext = `, ${occupation}`;
  }

  // Add mood/expression based on relationship
  let expression = 'neutral expression';
  if (relationship === 'ally') {
    expression = 'friendly and approachable expression';
  } else if (relationship === 'enemy') {
    expression = 'menacing or intense expression';
  }

  // Construct the full prompt
  const prompt = `${styleBase}. Portrait of ${name || 'a character'}${occupationContext}. ${characterDesc}. ${expression}. Head and shoulders portrait, detailed face, high quality, no text or labels.`;

  return prompt;
}

/**
 * Upload a data URL to Firebase Storage and return the download URL
 * @param {string} dataUrl - Base64 data URL
 * @param {string} campaignId - Campaign ID for storage path
 * @param {string} npcName - NPC name for filename
 * @returns {Promise<string>} Firebase Storage download URL
 */
async function uploadPortraitToStorage(dataUrl, campaignId, npcName) {
  const timestamp = Date.now();
  const safeName = (npcName || 'portrait').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const storagePath = `campaigns/${campaignId}/portraits/${timestamp}_${safeName}.png`;
  const storageRef = ref(storage, storagePath);

  console.log('Uploading portrait to Firebase Storage...');
  await uploadString(storageRef, dataUrl, 'data_url');
  const downloadUrl = await getDownloadURL(storageRef);
  console.log('Portrait uploaded to Storage:', downloadUrl);

  return downloadUrl;
}

/**
 * Generate an NPC portrait
 * @param {object} npc - NPC data
 * @param {string} openaiKey - OpenAI API key for DALL-E
 * @param {string} gameSystem - Game system for style
 * @param {string} campaignId - Campaign ID for storage (optional, will use data URL if not provided)
 * @returns {Promise<string>} Portrait URL (Firebase Storage URL if campaignId provided, otherwise data URL)
 */
export async function generateNPCPortrait(npc, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
  if (!openaiKey) {
    throw new Error('OpenAI API key required for portrait generation');
  }

  console.log('Building portrait prompt for NPC:', npc.name);
  const prompt = buildNPCPortraitPrompt(npc, gameSystem);
  console.log('DALL-E prompt:', prompt);

  const dataUrl = await generatePortraitImage(prompt, openaiKey);

  // If campaignId provided, upload to Firebase Storage to avoid Firestore size limits
  if (campaignId) {
    const storageUrl = await uploadPortraitToStorage(dataUrl, campaignId, npc.name);
    return storageUrl;
  }

  return dataUrl;
}

export const portraitGeneratorService = {
  generateNPCPortrait,
  buildNPCPortraitPrompt,
  generatePortraitImage
};
