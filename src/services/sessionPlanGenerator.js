/**
 * Session Plan Generator — GM Assistant orchestrator
 *
 * Three pure entrypoints:
 *   - generateSessionPlan(...)  → AI returns a structured SessionPlan JSON
 *   - buildPreviewFromPlan(...) → Calls existing generators (adversary/NPC/location)
 *                                 in memory, no Firestore writes
 *   - commitPreview(...)        → Writes the GM-edited preview to Firestore via
 *                                 the add* hook helpers
 *
 * Reuses: campaignContext, adversaryGenerator, campaignGenerator helpers,
 *         responseParser. Mirrors the existing campaignGenerator.js pattern.
 */

import { generateAdversaryStatblock, fallbackAdversaryStats } from './adversaryGenerator';
import { fleshOutLocationWithAI } from './campaignGenerator';
import { aiService } from './aiService';
import { promptBuilder } from './promptBuilder';
import { responseParser } from './responseParser';
import { generateBattleMap } from './battleMapGenerator';

/**
 * Ask the AI to produce a SessionPlan JSON.
 *
 * @param {object}  args
 * @param {string}  args.brief            - GM's natural-language request
 * @param {Array}   args.history          - Prior chat turns for refinement
 * @param {string}  args.campaignContext  - Output of buildCampaignContext()
 * @param {string}  args.gameSystem       - 'daggerheart' | 'starwarsd6'
 * @param {string=} args.apiKey
 * @param {string=} args.provider         - 'anthropic' | 'openai' | '1min'
 * @returns {Promise<{ plan: object|null, raw: string }>}
 */
export async function generateSessionPlan({
  brief,
  history = [],
  campaignContext = '',
  gameSystem = 'daggerheart',
  apiKey,
  provider = 'anthropic'
}) {
  if (!brief?.trim()) throw new Error('Please describe the session you want to plan.');

  const response = await fetch('/api/rules-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: brief,
      history,
      apiKey,
      provider,
      campaignContext,
      gameSystem,
      mode: 'gm-plan'
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Plan request failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  const raw = data.response || '';
  const plan = responseParser.parse('session-plan', raw);
  return { plan, raw };
}

/**
 * Stage every entity the plan calls for, in memory. No Firestore writes.
 *
 * Returns drafts the GM can edit in SessionPreviewModal before committing.
 *
 * @param {object}   args
 * @param {object}   args.plan
 * @param {object}   args.campaign
 * @param {object=}  args.campaignFrame
 * @param {Array=}   args.adversaries  - Existing campaign adversaries (for reuse)
 * @param {Array=}   args.locations    - Existing campaign locations (for reuse)
 * @param {Array=}   args.npcs         - Existing campaign NPCs (for reuse)
 * @param {string=}  args.apiKey
 * @param {string=}  args.provider
 * @param {Array=}   args.generateMapsFor  - List of mapsRequested labels the user opted into
 * @param {Function=} args.onProgress  - (step, total, label) => void
 */
export async function buildPreviewFromPlan({
  plan,
  campaign,
  campaignFrame = null,
  adversaries = [],
  locations = [],
  npcs = [],
  apiKey,
  provider = 'anthropic',
  generateMapsFor = [],
  onProgress = () => {}
}) {
  if (!plan) throw new Error('Missing session plan.');

  // Pre-compute every step so we can report accurate progress.
  const conceptKey = (a) => `${a.concept}|${a.tier}|${a.role}`;
  const adversaryConceptsToBuild = new Map(); // key → { concept, tier, role }

  const reuseByName = new Map(
    (adversaries || []).filter(a => a?.name).map(a => [a.name.toLowerCase(), a])
  );

  const planEncounters = Array.isArray(plan.encounters) ? plan.encounters : [];
  const planNewLocations = Array.isArray(plan.newLocations) ? plan.newLocations : [];
  const planNewNPCs = Array.isArray(plan.newNPCs) ? plan.newNPCs : [];
  const planMapsRequested = Array.isArray(plan.mapsRequested) ? plan.mapsRequested : [];

  for (const enc of planEncounters) {
    for (const need of (enc.adversariesNeeded || [])) {
      // Skip if mapped to an existing adversary by name
      if (need.reuseExistingName && reuseByName.has(need.reuseExistingName.toLowerCase())) continue;
      const k = conceptKey(need);
      if (!adversaryConceptsToBuild.has(k)) adversaryConceptsToBuild.set(k, need);
    }
  }

  const planPuzzleEncounters = planEncounters.filter(enc => enc.type === 'puzzle' && enc.puzzleSpec);

  const totalSteps =
    planNewLocations.length +
    planNewNPCs.length +
    adversaryConceptsToBuild.size +
    planEncounters.length +
    planPuzzleEncounters.length * 2 + // handout image + GM sheet per puzzle
    (generateMapsFor.length || 0);

  let step = 0;
  const tick = (label) => { step += 1; onProgress(step, totalSteps, label); };

  // Build a running list of "known" locations/NPCs the AI can reference, seeded
  // with what already exists in the campaign so generators don't duplicate.
  const stagedLocations = [...locations];
  const stagedNPCs = [...npcs];

  // ── 1. Locations ───────────────────────────────────────────────────────
  const previewLocations = [];
  for (const loc of planNewLocations) {
    tick(`Fleshing out location: ${loc.name}`);
    try {
      const fleshed = await fleshOutLocationWithAI(
        { name: loc.name, type: loc.type, description: loc.blurb, region: '' },
        campaignFrame,
        campaign,
        apiKey,
        provider
      );
      previewLocations.push({ ...fleshed, _planSource: loc });
      stagedLocations.push({ name: fleshed.name, type: fleshed.type });
    } catch (err) {
      console.error('Location generation failed:', err);
      // Fall back to the plan blurb so the GM still has something to edit.
      previewLocations.push({
        name: loc.name,
        type: loc.type,
        region: '',
        description: loc.blurb,
        notableFeatures: '',
        secrets: '',
        inhabitants: '',
        _planSource: loc,
        _generationError: err.message
      });
    }
  }

  // ── 2. NPCs ────────────────────────────────────────────────────────────
  const previewNPCs = [];
  for (const npc of planNewNPCs) {
    tick(`Fleshing out NPC: ${npc.name}`);
    try {
      const npcPrompt = promptBuilder.buildNPCPrompt({
        campaign,
        campaignFrame,
        existingNPCs: stagedNPCs,
        existingLocations: stagedLocations,
        requirements: {
          name: npc.name,
          occupation: npc.occupation,
          description: npc.blurb
        }
      });
      const raw = await aiService.generate(npcPrompt, apiKey, provider);
      const parsed = responseParser.parse('npc', raw);
      const merged = { ...parsed, name: npc.name || parsed.name, _planSource: npc };
      previewNPCs.push(merged);
      stagedNPCs.push({ name: merged.name, occupation: merged.occupation });
    } catch (err) {
      console.error('NPC generation failed:', err);
      previewNPCs.push({
        name: npc.name,
        ancestry: '',
        occupation: npc.occupation,
        location: '',
        relationship: 'neutral',
        description: npc.blurb,
        notes: '',
        firstMet: '',
        _planSource: npc,
        _generationError: err.message
      });
    }
  }

  // ── 3. Adversaries ─────────────────────────────────────────────────────
  // De-duplicated by (concept, tier, role) — two encounters needing the same
  // creature share one stat block.
  const previewAdversaries = [];
  const adversaryByConceptKey = new Map();
  for (const need of adversaryConceptsToBuild.values()) {
    tick(`Statting adversary: ${need.concept}`);
    try {
      const stats = await generateAdversaryStatblock({
        concept: need.concept,
        tier: need.tier,
        role: need.role,
        apiKey,
        provider,
        campaignContext: ''
      });
      const adv = { ...stats, _planSource: need };
      previewAdversaries.push(adv);
      adversaryByConceptKey.set(conceptKey(need), adv);
    } catch (err) {
      console.error('Adversary generation failed:', err);
      const fb = fallbackAdversaryStats(need.tier, need.role);
      const stub = {
        name: need.concept.split(/[,.]/)[0].slice(0, 60),
        tier: need.tier,
        role: need.role,
        description: need.concept,
        motives: '',
        difficulty: fb.difficulty,
        hp: fb.hp,
        stress: fb.stress,
        attack: fb.attack,
        attackName: 'Attack',
        attackRange: 'Melee',
        attackDamage: fb.attackDamage,
        experience: '',
        thresholds: fb.thresholds,
        features: [],
        _planSource: need,
        _generationError: err.message
      };
      previewAdversaries.push(stub);
      adversaryByConceptKey.set(conceptKey(need), stub);
    }
  }

  // ── 4. Encounters ──────────────────────────────────────────────────────
  // We don't ship Firestore IDs at preview time — we use an internal staging key
  // (_stagedAdvKey) to refer to in-memory adversaries, which commitPreview then
  // resolves to real Firestore ids after writing the adversary docs.
  const previewEncounters = planEncounters.map((enc, idx) => {
    tick(`Building encounter: ${enc.name}`);
    const adversarySlots = enc.adversariesNeeded.map((need) => {
      const reuse = need.reuseExistingName
        ? reuseByName.get(need.reuseExistingName.toLowerCase())
        : null;
      return reuse
        ? { _kind: 'existing', adversaryId: reuse.id, quantity: need.quantity }
        : { _kind: 'staged', _stagedAdvKey: conceptKey(need), quantity: need.quantity };
    });

    return {
      _planIndex: idx,
      name: enc.name,
      type: enc.type,
      description: enc.summary,
      summary: enc.summary,
      environment: enc.environment,
      partySize: plan.partySize,
      partyLevel: plan.partyLevel,
      adversarySlots,
      puzzleSpec: enc.puzzleSpec,
      estimatedMinutes: enc.estimatedMinutes,
      bpEstimate: enc.bpEstimate,
      tactics: '',
      rewards: '',
      hidden: false,
      _planSource: enc
    };
  });

  // ── 4.5. Puzzle handout charts + GM solution sheets ───────────────────
  // For each puzzle encounter:
  //   a) A player-facing visual handout (parchment diagram with clues but not the answer)
  //   b) A GM solution sheet (AI-written text with step-by-step solution, hints, failure)
  for (let i = 0; i < previewEncounters.length; i++) {
    const enc = previewEncounters[i];
    if (enc.type !== 'puzzle' || !enc.puzzleSpec) continue;

    // a) Player handout image
    tick(`Generating puzzle handout: ${enc.name}`);
    try {
      const result = await generateBattleMap({
        prompt: buildPuzzleHandoutPrompt(enc),
        type: 'handout',
        size: '1792x1024'  // Landscape — matches battle map aspect ratio, better for wide tables
      });
      previewEncounters[i] = {
        ...previewEncounters[i],
        handoutUrl: result?.url || result?.imageUrl || ''
      };
    } catch (err) {
      console.error('Puzzle handout generation failed:', err);
      previewEncounters[i] = { ...previewEncounters[i], handoutUrl: '', _handoutError: err.message };
    }

    // b) GM solution sheet (text)
    tick(`Generating GM solution sheet: ${enc.name}`);
    try {
      const sheet = await generatePuzzleGMSheet(previewEncounters[i], apiKey, provider);
      previewEncounters[i] = { ...previewEncounters[i], gmSheet: sheet };
    } catch (err) {
      console.error('GM sheet generation failed:', err);
      previewEncounters[i] = { ...previewEncounters[i], gmSheet: '', _gmSheetError: err.message };
    }
  }

  // ── 5. Maps (opt-in only) ──────────────────────────────────────────────
  const previewMaps = [];
  for (const mapReq of planMapsRequested) {
    if (!generateMapsFor.includes(mapReq.label)) continue;
    tick(`Generating map: ${mapReq.label}`);
    try {
      const birdsEyePrefix = 'Top-down bird\'s-eye view battle map, tabletop RPG grid map style, high detail, 4K quality.';
      const locationContext = plan.primaryLocation ? ` Primary location: ${plan.primaryLocation}.` : '';
      const result = await generateBattleMap({
        prompt: `${birdsEyePrefix} ${mapReq.label} for the session "${plan.sessionTitle}".${locationContext}`,
        type: mapReq.kind === 'location' ? 'outdoor' : 'battle-map',
        size: '1792x1024'
      });
      previewMaps.push({ label: mapReq.label, kind: mapReq.kind, url: result?.url || result?.imageUrl || '', _planSource: mapReq });
    } catch (err) {
      console.error('Map generation failed:', err);
      previewMaps.push({ label: mapReq.label, kind: mapReq.kind, url: '', _planSource: mapReq, _generationError: err.message });
    }
  }

  // ── 6. Session draft ───────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const sessionDraft = {
    title: plan.sessionTitle,
    date: today,
    status: 'planned',
    isPlanned: true,
    summary: `Planned session — ${plan.estimatedDurationHours}h, party of ${plan.partySize} at level ${plan.partyLevel}.`,
    highlights: [],
    dmNotes: assembleSessionNotes(plan),
    encounterLinks: '' // Filled in commitPreview once encounter ids exist
  };

  return {
    locations: previewLocations,
    npcs: previewNPCs,
    adversaries: previewAdversaries,
    encounters: previewEncounters,
    maps: previewMaps,
    sessionDraft,
    rawPlan: plan
  };
}

/**
 * Compose Markdown DM notes from the plan.
 */
/**
 * Build an image prompt for a puzzle encounter handout.
 *
 * The image must be a FUNCTIONAL puzzle diagram — specific labelled elements,
 * cryptic-but-real visual clues the players can actually interact with.
 * It deliberately omits the solution sequence but shows all the components.
 */
function buildPuzzleHandoutPrompt(enc) {
  const spec = enc.puzzleSpec;

  // Extract key nouns from mechanism to drive the visual
  const mechanism = spec.mechanism || '';
  const premise = spec.premise || '';

  // Build a hyper-specific diagram description tailored for Gemini 2.5 Flash Image
  // which is better at rendering exact text and technical structures.
  return [
    'Technical schematic drawing of a fantasy TTRPG puzzle, drawn on aged parchment.',
    'This is a functional puzzle diagram for players to solve at the table. Do not draw generic fantasy art or characters.',
    `At the top, write the exact title prominently: "${enc.name}".`,
    `Draw the central mechanism: ${mechanism}.`,
    `Include margin notes that read exactly: "${premise.slice(0, 120)}".`,
    'You MUST include numbered labels (1, 2, 3, 4) pointing to the interactive parts.',
    'Draw distinct alchemical, runic, or cardinal symbols on the moving parts.',
    'Draw a sequence indicator bar at the bottom with blank slots.',
    'Include at least one cryptic written clue in italics (a short riddle or alignment hint).',
    'Style: Flat top-down orthographic view, sepia ink, clean and highly legible lines, cross-hatching, no heavy shading or 3D perspective.',
    'CRITICAL: Do NOT show the solution. Show only the components in an unsolved, default state.'
  ].join(' ');
}

/**
 * Ask the AI to write a structured GM solution sheet for a puzzle encounter.
 * Returns a Markdown string the GM can reference at the table.
 */
async function generatePuzzleGMSheet(enc, apiKey, provider) {
  const spec = enc.puzzleSpec;
  const prompt = `You are writing a GM reference sheet for a puzzle encounter in a tabletop RPG.

PUZZLE: "${enc.name}"
Premise: ${spec.premise || 'N/A'}
Mechanism: ${spec.mechanism || 'N/A'}
Solution: ${spec.solution || 'N/A'}
Failure state: ${spec.failureState || 'N/A'}

Write a concise GM solution sheet in Markdown with these exact sections:

## Solution Steps
Numbered step-by-step instructions for how the puzzle is solved correctly.

## Clues on the Handout
List exactly what cryptic clues appear on the player handout and what they hint at (so the GM knows what to point players toward).

## Hint Ladder
Three tiered hints the GM can give if players are stuck:
- **Subtle hint** (for mild struggle, ~5 min in)
- **Medium hint** (for significant struggle, ~15 min in)
- **Overt hint** (last resort, preserves momentum)

## Success
What happens and what to describe when the puzzle is solved correctly.

## Failure
What happens and what to describe when the puzzle is failed or the players give up.

## GM Notes
Any pacing advice, optional flourishes, or things to watch for at the table.

Be specific, practical, and table-ready. This is for the GM's eyes only.`;

  const raw = await aiService.generate(prompt, apiKey, provider);
  return raw.trim();
}

function assembleSessionNotes(plan) {
  const lines = [];
  if (plan.gmNotes) {
    lines.push(plan.gmNotes.trim());
    lines.push('');
  }
  if (plan.pacingOutline?.length) {
    lines.push('## Pacing');
    for (const item of plan.pacingOutline) lines.push(`- ${item}`);
    lines.push('');
  }
  if (plan.encounters?.length) {
    lines.push('## Encounters');
    plan.encounters.forEach((enc, i) => {
      lines.push(`${i + 1}. **${enc.name}** *(${enc.type}, ~${enc.estimatedMinutes} min)* — ${enc.summary}`);
      if (enc.puzzleSpec) {
        lines.push(`   - **Premise:** ${enc.puzzleSpec.premise}`);
        lines.push(`   - **Mechanism:** ${enc.puzzleSpec.mechanism}`);
        lines.push(`   - **Solution:** ${enc.puzzleSpec.solution}`);
        if (enc.puzzleSpec.failureState) lines.push(`   - **On failure:** ${enc.puzzleSpec.failureState}`);
      }
    });
    lines.push('');
  }
  if (plan.events?.length) {
    lines.push('## Events');
    for (const ev of plan.events) {
      lines.push(`- **${ev.title}** — *${ev.trigger}* → ${ev.outcome}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

/**
 * Persist a GM-edited preview to Firestore.
 *
 * @param {object}   args
 * @param {object}   args.preview      - The (possibly edited) preview from buildPreviewFromPlan
 * @param {object}   args.handlers     - { addLocation, addNPC, addAdversary, addEncounter, addSession }
 * @param {Function=} args.onProgress  - (step, total, label) => void
 * @returns {Promise<{ sessionId: string|null, errors: Array<{ step, message }> }>}
 */
export async function commitPreview({ preview, handlers, onProgress = () => {} }) {
  const { addLocation, addNPC, addAdversary, addEncounter, addSession, addMapFile } = handlers || {};
  if (!addSession) throw new Error('addSession handler is required');

  const mapItems = [
    ...(preview.maps || []).map(m => ({ name: m.label, url: m.url, tag: m.kind || 'battle-map' })),
    ...(preview.encounters || []).filter(e => e.handoutUrl).map(e => ({ name: `${e.name} Handout`, url: e.handoutUrl, tag: 'puzzle-handout' }))
  ];

  const errors = [];
  const total =
    preview.locations.length +
    preview.npcs.length +
    preview.adversaries.length +
    preview.encounters.length +
    mapItems.length +
    1; // session
  let step = 0;
  const tick = (label) => { step += 1; onProgress(step, total, label); };

  // ── Locations ──────────────────────────────────────────────────────────
  for (const loc of preview.locations) {
    tick(`Saving location: ${loc.name}`);
    try {
      if (addLocation) {
        await addLocation(stripPreviewMeta(loc));
      }
    } catch (err) {
      console.error('addLocation failed:', err);
      errors.push({ step: `Location: ${loc.name}`, message: err.message });
    }
  }

  // ── NPCs ───────────────────────────────────────────────────────────────
  for (const npc of preview.npcs) {
    tick(`Saving NPC: ${npc.name}`);
    try {
      if (addNPC) {
        await addNPC(stripPreviewMeta(npc));
      }
    } catch (err) {
      console.error('addNPC failed:', err);
      errors.push({ step: `NPC: ${npc.name}`, message: err.message });
    }
  }

  // ── Adversaries ────────────────────────────────────────────────────────
  // Map staged keys → committed Firestore ids so encounters can reference them.
  const stagedKeyToId = new Map();
  for (const adv of preview.adversaries) {
    tick(`Saving adversary: ${adv.name}`);
    try {
      if (addAdversary) {
        const stagedKey = adv._planSource
          ? `${adv._planSource.concept}|${adv._planSource.tier}|${adv._planSource.role}`
          : null;
        const result = await addAdversary(stripPreviewMeta(adv));
        const newId = result?.id || result; // hook may return { id } or string
        if (stagedKey && newId) stagedKeyToId.set(stagedKey, newId);
      }
    } catch (err) {
      console.error('addAdversary failed:', err);
      errors.push({ step: `Adversary: ${adv.name}`, message: err.message });
    }
  }

  // ── Encounters ─────────────────────────────────────────────────────────
  const createdEncounterIds = [];
  for (const enc of preview.encounters) {
    tick(`Saving encounter: ${enc.name}`);
    try {
      const slots = (enc.adversarySlots || []).map((slot) => {
        if (slot._kind === 'existing') {
          return { adversaryId: slot.adversaryId, quantity: slot.quantity || 1 };
        }
        const id = stagedKeyToId.get(slot._stagedAdvKey);
        return id ? { adversaryId: id, quantity: slot.quantity || 1 } : null;
      }).filter(Boolean);

      const encDoc = {
        name: enc.name,
        description: enc.description || enc.summary || '',
        environmentId: '',
        adversarySlots: slots,
        partySize: enc.partySize || 4,
        tactics: enc.tactics || '',
        rewards: enc.rewards || '',
        hidden: !!enc.hidden,
        // Extra GM-assistant metadata, harmless to other consumers
        encounterType: enc.type || 'combat',
        puzzleSpec: enc.puzzleSpec || null,
        estimatedMinutes: enc.estimatedMinutes || null,
        handoutUrl: enc.handoutUrl || '',
        gmSheet: enc.gmSheet || ''
      };

      if (addEncounter) {
        const result = await addEncounter(encDoc);
        const newId = result?.id || result;
        if (newId) createdEncounterIds.push({ id: newId, name: enc.name });
      }
    } catch (err) {
      console.error('addEncounter failed:', err);
      errors.push({ step: `Encounter: ${enc.name}`, message: err.message });
    }

    // Save GM solution sheet as a DM-only lore entry so the GM can find it at the table
    const { addLore } = handlers || {};
    if (addLore && enc.gmSheet) {
      try {
        await addLore({
          title: `GM Sheet: ${enc.name}`,
          category: 'dm-notes',
          content: enc.gmSheet,
          tags: ['puzzle', 'gm-only', 'solution'],
          dmOnly: true
        });
      } catch (err) {
        console.error('addLore (GM sheet) failed:', err);
        // Non-fatal — the sheet is also visible in the encounter preview
      }
    }
  }

  // ── Maps & Handouts ──────────────────────────────────────────────
  let mapCount = 0;
  if (addMapFile) {
    for (const item of mapItems) {
      if (!item.url) continue;
      tick(`Uploading to Maps & Files: ${item.name}`);
      try {
        await addMapFile(item);
        mapCount++;
      } catch (err) {
        console.error('addMapFile failed:', err);
        errors.push({ step: `Map: ${item.name}`, message: err.message });
      }
    }
  }

  // ── Session ────────────────────────────────────────────────────────────
  tick(`Saving session: ${preview.sessionDraft.title}`);
  let sessionId = null;
  try {
    const sessionDoc = {
      ...preview.sessionDraft,
      // Store encounter IDs as plain comma-separated Firestore IDs (not encounter:// URIs)
      encounterLinks: createdEncounterIds.map(e => e.id).join(',')
    };
    const result = await addSession(sessionDoc);
    sessionId = result?.id || null;
  } catch (err) {
    console.error('addSession failed:', err);
    errors.push({ step: `Session: ${preview.sessionDraft.title}`, message: err.message });
  }

  return { sessionId, errors, encounterIds: createdEncounterIds, mapCount };
}

/**
 * Drop preview-only fields (those starting with "_") so we don't leak them
 * into Firestore documents.
 */
function stripPreviewMeta(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue;
    out[k] = v;
  }
  return out;
}
