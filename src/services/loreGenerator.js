/**
 * Lore Generator Service
 * Generates thematic visuals for lore entries using DALL-E
 */

import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Download an image from a URL and convert to data URL via proxy
 */
async function downloadImageAsDataUrl(imageUrl) {
    try {
        const response = await fetch('/api/download-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
 * Generate a lore visual using DALL-E
 */
async function generateLoreVisual(prompt, apiKey) {
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

    console.log('Downloading DALL-E lore visual to convert to data URL...');
    const dataUrl = await downloadImageAsDataUrl(imageUrl);
    return dataUrl;
}

/**
 * Build a DALL-E prompt for a Lore entry
 */
function buildLorePrompt(lore, gameSystem = 'daggerheart') {
    const { title, content, type } = lore;

    let styleBase = '';
    if (gameSystem === 'starwarsd6') {
        styleBase = 'Star Wars cinematic concept art, sci-fi aesthetic, high-tech noir, dramatic lighting, detailed scenery';
    } else {
        styleBase = 'Epic fantasy concept art, oil painting style, dramatic volumetric lighting, highly detailed, atmospheric';
    }

    // Refine style based on lore type
    let typeContext = '';
    if (type === 'history') typeContext = 'an ancient historical scene or manuscript illustration';
    else if (type === 'faction') typeContext = 'a symbolic representation of a powerful organization or their sigil';
    else if (type === 'item') typeContext = 'a mythical legendary artifact with magical aura';
    else if (type === 'quest') typeContext = 'a dramatic scene depicting a heroic journey or objective';
    else typeContext = 'a thematic illustration representing this fragment of world lore';

    const summary = content ? content.substring(0, 300) : '';
    const prompt = `${styleBase}. ${typeContext} for "${title}". ${summary}. Wide cinematic composition, immersive atmosphere, no text or labels, professional digital art.`;

    return prompt;
}

/**
 * Upload to Firebase Storage
 */
async function uploadToStorage(dataUrl, campaignId, loreTitle) {
    const timestamp = Date.now();
    const safeName = (loreTitle || 'lore').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const storagePath = `campaigns/${campaignId}/lore/${timestamp}_${safeName}.png`;
    const storageRef = ref(storage, storagePath);

    await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(storageRef);
}

/**
 * Main entry point for lore visual generation
 */
export async function generateLoreImage(lore, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
    if (!openaiKey) throw new Error('OpenAI API key required');

    const prompt = buildLorePrompt(lore, gameSystem);
    const dataUrl = await generateLoreVisual(prompt, openaiKey);

    if (campaignId) {
        return await uploadToStorage(dataUrl, campaignId, lore.title);
    }

    return dataUrl;
}

export const loreGeneratorService = {
    generateLoreImage,
    buildLorePrompt
};
