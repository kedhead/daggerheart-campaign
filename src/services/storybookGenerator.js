/**
 * Storybook Generator Service
 *
 * Orchestrates chapter generation for the "Story So Far" feature:
 *  1. POST /api/generate-storybook (action:'chapter') to get prose + scene
 *     prompts + spotlights.
 *  2. For each featured entity, ensure a cached "styled portrait" exists in the
 *     selected storybook style. If missing or stale, describe the source
 *     portrait via /api/generate-storybook (action:'describe'), then redraw it
 *     via /api/generate-image and cache the result on the entity doc.
 *  3. Compose each scene's final DALL-E prompt with the cached entity
 *     descriptions baked in so characters appear consistently.
 *  4. Upload all generated images to Firebase Storage.
 *
 * DALL-E 3 doesn't accept image inputs, so the only way to preserve likeness
 * while changing art style is this describe-then-redraw pipeline. A future
 * upgrade can swap the describe+redraw into a single gpt-image-1 call without
 * changing this module's public surface.
 */

import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { buildCampaignContext } from './campaignContext';

// ── Style presets (must stay in sync with api/generate-image.js) ──────────────

export const STORYBOOK_STYLES = [
  { key: 'watercolor', label: 'Soft watercolor' },
  { key: 'oil', label: 'Classical oil painting' },
  { key: 'ink-wash', label: 'Ink & watercolor wash' },
  { key: 'illuminated', label: 'Illuminated manuscript' },
  { key: 'children-storybook', label: "Classic children's storybook" },
  { key: 'custom', label: 'Custom (advanced)' }
];

export const DEFAULT_STYLE_KEY = 'watercolor';

// ── Low-level helpers ─────────────────────────────────────────────────────────

async function downloadImageAsDataUrl(imageUrl) {
  const response = await fetch('/api/download-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to download image: ${response.statusText}`);
  }
  const data = await response.json();
  return data.dataUrl;
}

async function uploadDataUrl(dataUrl, storagePath) {
  const storageRef = ref(storage, storagePath);
  await uploadString(storageRef, dataUrl, 'data_url');
  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

async function describeImage(imageUrl, subjectHint, apiKey) {
  const res = await fetch('/api/generate-storybook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'describe', imageUrl, subjectHint, apiKey: apiKey || undefined })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `describe failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data.description || '';
}

async function generateStylizedImage({ prompt, type, styleKey, gameSystem, apiKey, size = '1024x1024' }) {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, type, styleKey, gameSystem, size, apiKey: apiKey || undefined })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `generate-image failed: ${res.statusText}`);
  }
  const data = await res.json();
  const dataUrl = await downloadImageAsDataUrl(data.imageUrl);
  return dataUrl;
}

// ── Entity helpers ────────────────────────────────────────────────────────────

const ENTITY_COLLECTIONS = {
  character: 'characters',
  npc: 'npcs',
  adversary: 'adversaries'
};

const ENTITY_PORTRAIT_FIELD = {
  character: 'avatarUrl',
  npc: 'avatarUrl',
  adversary: 'imageUrl'
};

function findEntityInRosters({ entityId, rosters }) {
  for (const type of ['character', 'npc', 'adversary']) {
    const list = rosters[`${type}s`] || [];
    const match = list.find(e => e.id === entityId);
    if (match) return { entity: match, entityType: type };
  }
  return { entity: null, entityType: null };
}

function buildFallbackDescription(entity, entityType) {
  if (!entity) return '';
  const parts = [entity.name];
  if (entityType === 'character') {
    if (entity.ancestry) parts.push(entity.ancestry);
    if (entity.characterClass) parts.push(entity.characterClass);
    if (entity.subclass) parts.push(entity.subclass);
  } else if (entityType === 'npc') {
    if (entity.occupation) parts.push(entity.occupation);
    if (entity.description) parts.push(entity.description.slice(0, 160));
  } else if (entityType === 'adversary') {
    if (entity.role) parts.push(entity.role);
    if (entity.description) parts.push(entity.description.slice(0, 160));
  }
  return parts.filter(Boolean).join(', ');
}

// ── Styled portrait cache ─────────────────────────────────────────────────────

/**
 * Ensure the given entity has a cached styled portrait for the given styleKey.
 * Updates the entity doc in place and returns { url, description }.
 * Never throws — on failure it returns a best-effort fallback.
 */
async function ensureStyledPortrait({ entity, entityType, styleKey, styleCustom, campaignId, apiKey, gameSystem }) {
  const portraitField = ENTITY_PORTRAIT_FIELD[entityType];
  const sourcePortraitUrl = entity?.[portraitField] || null;
  const existing = entity?.storybookPortrait || null;

  const styleSignature = styleKey === 'custom' ? `custom:${styleCustom || ''}` : styleKey;

  // Cache hit: matching style + same source portrait
  if (
    existing &&
    existing.styleKey === styleSignature &&
    existing.sourcePortraitUrl === sourcePortraitUrl &&
    existing.url
  ) {
    return { url: existing.url, description: existing.description || '' };
  }

  // No source portrait: we can't visually preserve likeness, so just build a
  // text-only styled portrait from the entity's written attributes.
  const fallbackDescription = buildFallbackDescription(entity, entityType);

  try {
    let description = fallbackDescription;
    if (sourcePortraitUrl) {
      const visionDescription = await describeImage(sourcePortraitUrl, entity.name, apiKey);
      if (visionDescription) description = visionDescription;
    }

    const portraitPrompt = `Head-and-shoulders portrait of ${entity.name}. ${description}. Neutral background, facing slightly to one side, no text.`;

    const effectiveStyleKey = styleKey === 'custom' ? (styleCustom || 'watercolor') : styleKey;
    const dataUrl = await generateStylizedImage({
      prompt: portraitPrompt,
      type: 'storybook-portrait',
      styleKey: effectiveStyleKey,
      gameSystem,
      apiKey
    });

    const storagePath = `campaigns/${campaignId}/storybook/styled-portraits/${entity.id}_${Date.now()}.png`;
    const { url } = await uploadDataUrl(dataUrl, storagePath);

    // Patch the entity doc with the cache
    const collectionName = ENTITY_COLLECTIONS[entityType];
    if (collectionName) {
      try {
        await updateDoc(doc(db, `campaigns/${campaignId}/${collectionName}`, entity.id), {
          storybookPortrait: {
            url,
            storagePath,
            styleKey: styleSignature,
            description,
            sourcePortraitUrl: sourcePortraitUrl || null,
            updatedAt: new Date().toISOString()
          }
        });
      } catch (patchErr) {
        // Writing the cache is best-effort; generation succeeded so surface the URL
        console.warn('[storybook] Could not cache styled portrait on entity:', patchErr);
      }
    }

    return { url, description };
  } catch (err) {
    console.error('[storybook] ensureStyledPortrait failed for', entity?.name, err);
    return { url: sourcePortraitUrl || null, description: fallbackDescription };
  }
}

// ── Scene generation ──────────────────────────────────────────────────────────

async function generateSceneImage({ scene, entityDescriptions, styleKey, styleCustom, gameSystem, campaignId, apiKey }) {
  const featuredDescriptions = (scene.featuredEntityIds || [])
    .map(id => entityDescriptions[id])
    .filter(Boolean);

  const featuredClause = featuredDescriptions.length
    ? ` Featuring: ${featuredDescriptions.join('; ')}.`
    : '';

  const fullPrompt = `${scene.prompt}${featuredClause}`;
  const effectiveStyleKey = styleKey === 'custom' ? (styleCustom || 'watercolor') : styleKey;

  const dataUrl = await generateStylizedImage({
    prompt: fullPrompt,
    type: 'storybook-scene',
    styleKey: effectiveStyleKey,
    gameSystem,
    apiKey,
    size: '1792x1024'
  });

  const sceneId = scene.id || `scene_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const storagePath = `campaigns/${campaignId}/storybook/images/${Date.now()}_${sceneId}.png`;
  const { url } = await uploadDataUrl(dataUrl, storagePath);

  return {
    id: sceneId,
    caption: scene.caption || '',
    prompt: fullPrompt,
    imageUrl: url,
    storagePath,
    featuredEntityIds: scene.featuredEntityIds || []
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a storybook chapter from a session.
 *
 * @param {object} opts
 * @param {object} opts.campaign       - Campaign doc
 * @param {object} opts.session        - Session doc (with optional liveNotesCompiled)
 * @param {Array}  opts.priorChapters  - Previously published chapters (for continuity)
 * @param {object} opts.entities       - { characters, npcs, adversaries, locations, lore, sessions, encounters, campaignFrame }
 * @param {string} opts.campaignId
 * @param {string} opts.apiKey         - OpenAI key
 * @param {string} opts.gameSystem
 * @param {string} opts.styleKey       - one of STORYBOOK_STYLES[].key
 * @param {string} [opts.styleCustom]  - custom preamble when styleKey === 'custom'
 * @param {number} [opts.sceneCount]   - 2-4 scenes (default 3)
 * @param {boolean} [opts.includeIllustrations] - if false, skip all image generation
 * @param {string} [opts.generatedBy]  - userId or 'auto'
 * @param {function} [opts.onProgress] - ({ stage, current, total, message })
 * @returns {Promise<object>} chapter-ready payload (no Firestore write yet)
 */
export async function generateChapter({
  campaign,
  session,
  priorChapters = [],
  entities = {},
  campaignId,
  apiKey,
  gameSystem = 'daggerheart',
  styleKey = DEFAULT_STYLE_KEY,
  styleCustom = '',
  sceneCount = 3,
  includeIllustrations = true,
  generatedBy = 'manual',
  onProgress = () => {}
}) {
  if (!session) throw new Error('generateChapter: session is required');
  if (!campaignId) throw new Error('generateChapter: campaignId is required');

  const {
    characters = [],
    npcs = [],
    adversaries = [],
    locations = [],
    lore = [],
    sessions = [],
    encounters = [],
    campaignFrame = null
  } = entities;

  onProgress({ stage: 'text', current: 0, total: 1, message: 'Writing chapter…' });

  const campaignContext = buildCampaignContext(campaign, {
    characters, npcs, adversaries, locations, lore, sessions, encounters, campaignFrame
  });

  const entityRoster = {
    characters: characters.filter(c => c.name).slice(0, 30).map(c => ({ id: c.id, name: c.name, tag: c.characterClass })),
    npcs: npcs.filter(n => n.name).slice(0, 30).map(n => ({ id: n.id, name: n.name, tag: n.occupation })),
    adversaries: adversaries.filter(a => a.name).slice(0, 30).map(a => ({ id: a.id, name: a.name, tag: a.role })),
    locations: locations.filter(l => l.name).slice(0, 30).map(l => ({ id: l.id, name: l.name, tag: l.type }))
  };

  const priorSummaries = priorChapters
    .slice(0, 2)
    .map(c => `${c.title}: ${(c.prose || '').split('\n\n').slice(0, 2).join(' ').slice(0, 280)}`);

  const textRes = await fetch('/api/generate-storybook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'chapter',
      campaignContext,
      session: {
        title: session.title,
        sessionNumber: session.sessionNumber || session.number,
        date: session.date,
        summary: session.summary,
        highlights: session.highlights,
        dmNotes: session.dmNotes,
        liveNotesCompiled: session.liveNotesCompiled
      },
      priorChapterSummaries: priorSummaries,
      entityRoster,
      sceneCount,
      gameSystem,
      apiKey: apiKey || undefined
    })
  });

  if (!textRes.ok) {
    const err = await textRes.json().catch(() => ({ error: textRes.statusText }));
    throw new Error(err.error || `Chapter text generation failed: ${textRes.statusText}`);
  }
  const chapterText = await textRes.json();

  // Stop here if illustrations are disabled
  if (!includeIllustrations) {
    onProgress({ stage: 'done', current: 1, total: 1, message: 'Draft ready' });
    return {
      title: trimForFirestore(chapterText.title, 300),
      prose: trimForFirestore(chapterText.prose, 80_000),
      scenes: [],
      spotlights: (chapterText.spotlights || []).map(s => {
        const { entity } = findEntityInRosters({ entityId: s.entityId, rosters: { characters, npcs, adversaries } });
        const portraitField = ENTITY_PORTRAIT_FIELD[s.entityType];
        return {
          entityId: s.entityId,
          entityType: s.entityType,
          name: entity?.name || '',
          portraitUrl: entity?.storybookPortrait?.url || entity?.[portraitField] || null,
          moment: trimForFirestore(s.moment, 400)
        };
      }),
      sessionId: session.id,
      sessionNumber: session.sessionNumber || session.number || null,
      status: generatedBy === 'auto' ? 'pending_review' : 'draft',
      generatedBy,
      aiModel: chapterText.model,
      styleKey,
      styleCustom: styleKey === 'custom' ? styleCustom : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Collect all unique featured entity ids across scenes + spotlights
  const featuredIds = new Set();
  (chapterText.scenes || []).forEach(s => (s.featuredEntityIds || []).forEach(id => featuredIds.add(id)));
  (chapterText.spotlights || []).forEach(s => s.entityId && featuredIds.add(s.entityId));

  // Ensure styled portraits for each featured entity (parallel, best-effort)
  const rosters = { characters, npcs, adversaries };
  const entityDescriptions = {};
  const entityPortraitUrls = {};
  const entityTypes = {};

  const portraitJobs = Array.from(featuredIds).map(async (entityId, idx) => {
    const { entity, entityType } = findEntityInRosters({ entityId, rosters });
    if (!entity || !entityType) return;
    entityTypes[entityId] = entityType;
    onProgress({
      stage: 'portraits',
      current: idx,
      total: featuredIds.size,
      message: `Styling ${entity.name}…`
    });
    const { url, description } = await ensureStyledPortrait({
      entity, entityType, styleKey, styleCustom, campaignId, apiKey, gameSystem
    });
    entityPortraitUrls[entityId] = url;
    entityDescriptions[entityId] = description;
  });
  await Promise.all(portraitJobs);

  // Generate scene illustrations sequentially to respect rate limits
  const scenes = [];
  const scenePromptList = chapterText.scenes || [];
  for (let i = 0; i < scenePromptList.length; i++) {
    const scenePrompt = scenePromptList[i];
    onProgress({
      stage: 'scenes',
      current: i,
      total: scenePromptList.length,
      message: `Painting scene ${i + 1}/${scenePromptList.length}…`
    });
    try {
      const scene = await generateSceneImage({
        scene: { ...scenePrompt, id: `scene_${i}_${Date.now()}` },
        entityDescriptions,
        styleKey,
        styleCustom,
        gameSystem,
        campaignId,
        apiKey
      });
      scenes.push(scene);
    } catch (err) {
      console.error('[storybook] Scene generation failed, continuing:', err);
    }
  }

  // Build spotlight cards
  const spotlights = (chapterText.spotlights || []).map(s => {
    const { entity } = findEntityInRosters({ entityId: s.entityId, rosters });
    const portraitField = ENTITY_PORTRAIT_FIELD[s.entityType];
    return {
      entityId: s.entityId,
      entityType: s.entityType,
      name: entity?.name || '',
      portraitUrl: entityPortraitUrls[s.entityId] || entity?.storybookPortrait?.url || entity?.[portraitField] || null,
      moment: s.moment
    };
  }).filter(s => s.name);

  onProgress({ stage: 'done', current: 1, total: 1, message: 'Chapter ready' });

  return {
    title: trimForFirestore(chapterText.title, 300),
    prose: trimForFirestore(chapterText.prose, 80_000),
    scenes: scenes.map(s => ({
      ...s,
      caption: trimForFirestore(s.caption, 600),
      prompt: trimForFirestore(s.prompt, 2_000)
    })),
    spotlights: spotlights.map(s => ({
      ...s,
      moment: trimForFirestore(s.moment, 400)
    })),
    sessionId: session.id,
    sessionNumber: session.sessionNumber || session.number || null,
    status: generatedBy === 'auto' ? 'pending_review' : 'draft',
    generatedBy,
    aiModel: chapterText.model,
    styleKey,
    styleCustom: styleKey === 'custom' ? styleCustom : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Cap a string to maxChars, appending an ellipsis if truncated.
// Keeps individual fields safely below Firestore's 1 MB doc limit.
function trimForFirestore(str, maxChars) {
  if (typeof str !== 'string') return str;
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars - 1) + '…';
}

/**
 * Regenerate a single scene within an existing chapter.
 */
export async function regenerateScene({
  scene,
  chapter,
  entities,
  campaignId,
  apiKey,
  gameSystem,
  styleKey,
  styleCustom
}) {
  const rosters = {
    characters: entities.characters || [],
    npcs: entities.npcs || [],
    adversaries: entities.adversaries || []
  };
  const entityDescriptions = {};
  const featured = scene.featuredEntityIds || [];
  for (const id of featured) {
    const { entity, entityType } = findEntityInRosters({ entityId: id, rosters });
    if (!entity || !entityType) continue;
    const { description } = await ensureStyledPortrait({
      entity, entityType, styleKey, styleCustom, campaignId, apiKey, gameSystem
    });
    entityDescriptions[id] = description;
  }
  return await generateSceneImage({
    scene: { ...scene, id: scene.id || `scene_${Date.now()}` },
    entityDescriptions,
    styleKey,
    styleCustom,
    gameSystem,
    campaignId,
    apiKey
  });
}

/**
 * Force-regenerate a single entity's styled portrait.
 */
export async function regenerateStyledPortrait({ entity, entityType, campaignId, apiKey, gameSystem, styleKey, styleCustom }) {
  // Bypass cache by clearing it first on the entity
  const collectionName = ENTITY_COLLECTIONS[entityType];
  if (collectionName) {
    try {
      await updateDoc(doc(db, `campaigns/${campaignId}/${collectionName}`, entity.id), {
        storybookPortrait: null
      });
    } catch {
      // Non-fatal
    }
  }
  return ensureStyledPortrait({
    entity: { ...entity, storybookPortrait: null },
    entityType,
    styleKey,
    styleCustom,
    campaignId,
    apiKey,
    gameSystem
  });
}

/**
 * Fire-and-forget auto-draft a chapter from a freshly finalized session.
 * Called from SessionLive.handleFinalize and SessionForm save-as-completed.
 * Swallows errors so it never blocks the caller's flow.
 *
 * @returns {Promise<{ok: boolean, chapterId?: string, error?: string}>}
 */
export async function autoDraftChapterFromSession({
  campaign,
  session,
  entities,
  campaignId,
  apiKey,
  gameSystem = 'daggerheart',
  onComplete = () => {}
}) {
  if (!campaign || !session || !campaignId) return { ok: false, error: 'missing-args' };

  try {
    // Skip if this session already has a chapter
    const existingSnap = await getDocs(
      query(collection(db, `campaigns/${campaignId}/storybook`), orderBy('chapterNumber', 'desc'))
    );
    const existing = existingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (existing.some(c => c.sessionId === session.id)) {
      console.log('[storybook] auto-draft skipped: chapter already exists for session', session.id);
      return { ok: false, error: 'already-exists' };
    }

    const priorChapters = existing.filter(c => c.status === 'published').slice(0, 2);
    const chapterNumber = existing.length > 0
      ? Math.max(...existing.map(c => c.chapterNumber || 0)) + 1
      : 1;

    const styleKey = campaign.storybookStyle || DEFAULT_STYLE_KEY;
    const styleCustom = campaign.storybookStyleCustom || '';

    const chapter = await generateChapter({
      campaign,
      session,
      priorChapters,
      entities,
      campaignId,
      apiKey,
      gameSystem,
      styleKey,
      styleCustom,
      sceneCount: 2,
      includeIllustrations: true,
      generatedBy: 'auto'
    });

    const docRef = await addDoc(collection(db, `campaigns/${campaignId}/storybook`), {
      ...chapter,
      chapterNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    onComplete({ ok: true, chapterId: docRef.id });
    return { ok: true, chapterId: docRef.id };
  } catch (err) {
    console.error('[storybook] auto-draft failed:', err);
    return { ok: false, error: err.message };
  }
}

export const storybookGeneratorService = {
  generateChapter,
  regenerateScene,
  regenerateStyledPortrait,
  autoDraftChapterFromSession,
  STORYBOOK_STYLES,
  DEFAULT_STYLE_KEY
};
