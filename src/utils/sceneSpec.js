// Non-combat encounters that play like encounters.
//
// The session planner gave puzzles a real structure (premise, mechanism,
// solution) but a social or exploration scene got two sentences and nothing
// to do at the table: "Emmanita experiences symptoms… needing support from
// her companions." A scene spec is the playable part: what the party wants,
// what it costs to fail, the rolls the scene invites (trait, Difficulty and
// what each result means), a countdown when time is short, what the people in
// it want, and a twist to drop in.
//
// Pure: the planner prompt, the parser, the encounter card and the "flesh
// out this scene" button all share it, and the smoke tests cover it.

import { stripWikiLinks } from './campaignMemory';
// The wording is shared with the session planner's prompt (api/rules-chat.js).
import { SCENE_SPEC_SCHEMA, SCENE_SPEC_RULES } from '../../api/_lib/sceneSpecPrompt.js';

export { SCENE_SPEC_SCHEMA, SCENE_SPEC_RULES };

export const DAGGERHEART_TRAITS = ['Agility', 'Strength', 'Finesse', 'Instinct', 'Presence', 'Knowledge'];
export const NON_COMBAT_TYPES = ['social', 'exploration'];

const str = (v, n = 600) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const clean = (v) => stripWikiLinks(String(v || '')).replace(/\s+/g, ' ').trim();

/** A scene spec cleaned to a known shape, or null when there is nothing playable in it. */
export function normalizeSceneSpec(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const rolls = (Array.isArray(raw.rolls) ? raw.rolls : [])
    .map(r => ({
      action: str(r?.action, 200),
      trait: str(r?.trait, 40),
      difficulty: Math.max(5, Math.min(30, Math.round(Number(r?.difficulty) || 0))) || null,
      success: str(r?.success, 300),
      successWithFear: str(r?.successWithFear, 300),
      failure: str(r?.failure, 300)
    }))
    .filter(r => r.action)
    .slice(0, 6);
  const npcs = (Array.isArray(raw.npcs) ? raw.npcs : [])
    .map(n => ({ name: str(n?.name, 80), wants: str(n?.wants, 200), leverage: str(n?.leverage, 200) }))
    .filter(n => n.name)
    .slice(0, 4);
  const c = raw.countdown;
  const countdown = c && typeof c === 'object' && str(c.name, 80)
    ? { name: str(c.name, 80), start: Math.max(1, Math.min(12, Math.round(Number(c.start) || 4))), advancesWhen: str(c.advancesWhen, 200), atZero: str(c.atZero, 200) }
    : null;
  const spec = {
    goal: str(raw.goal, 300),
    stakes: str(raw.stakes, 300),
    opening: str(raw.opening, 500),
    rolls,
    countdown,
    npcs,
    twist: str(raw.twist, 300),
    rewards: str(raw.rewards, 300)
  };
  return spec.rolls.length || spec.goal ? spec : null;
}

/** Whether an encounter is a non-combat scene (planned as one, or with nobody to fight). */
export function isNonCombat(encounter) {
  const type = encounter?.encounterType;
  if (NON_COMBAT_TYPES.includes(type)) return true;
  if (type === 'combat' || type === 'puzzle') return false;
  return !(encounter?.adversarySlots?.length) && !encounter?.enemies;
}

/** The prompt for fleshing out an existing non-combat encounter. */
export function buildSceneSpecPrompt(encounter, { campaignName = '', storyNow = '', characters = [] } = {}) {
  const party = (characters || []).filter(c => c?.name).slice(0, 8).map(c => c.name).join(', ');
  return `You are helping a Game Master run a non-combat encounter in a Daggerheart campaign${campaignName ? ` called "${campaignName}"` : ''}. Turn it into a playable scene for the table.

ENCOUNTER: ${clean(encounter?.name) || 'Untitled'}
${encounter?.encounterType ? `TYPE: ${encounter.encounterType}\n` : ''}DESCRIPTION: ${clean(encounter?.description) || '(none)'}
${encounter?.environment ? `SETTING: ${clean(encounter.environment)}\n` : ''}${party ? `THE PARTY: ${party}\n` : ''}${storyNow ? `WHERE THE STORY IS NOW: ${clean(storyNow).slice(0, 800)}\n` : ''}
Rules:
${SCENE_SPEC_RULES.replace(/- Social and exploration encounters MUST have a "sceneSpec" \(null for combat and puzzle\): /, '- Write ')}
- Keep everything true to the description above; add detail, do not change what the scene is about.

Answer with JSON only, in this shape:
${SCENE_SPEC_SCHEMA}`;
}

/** The scene spec from the model's answer, or null. */
export function parseSceneSpec(text) {
  const json = String(text || '').match(/\{[\s\S]*\}/);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json[0]);
    return normalizeSceneSpec(parsed.sceneSpec || parsed);
  } catch {
    return null;
  }
}
