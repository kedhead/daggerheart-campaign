// How a non-combat encounter's scene spec is asked for: the session planner
// (api/rules-chat.js) and the encounter card's "flesh out this scene" button
// (src/utils/sceneSpec.js) use the same words. No imports, so both the
// server and the browser can load it.

export const SCENE_SPEC_SCHEMA = `{
  "goal": "what the party is trying to achieve in this scene",
  "stakes": "what is lost, or gets worse, if they fail",
  "opening": "1-2 sentences the GM can read aloud to start the scene",
  "rolls": [
    { "action": "a specific thing a character might do here (e.g. 'Calm Emmanita before the hunger takes her')",
      "trait": "the trait rolled (Agility, Strength, Finesse, Instinct, Presence or Knowledge)",
      "difficulty": number,
      "success": "what a success with Hope gets them",
      "successWithFear": "success, but with a cost or complication",
      "failure": "what a failure does — the scene moves on, never a dead end" }
  ],
  "countdown": null | { "name": "string", "start": number, "advancesWhen": "what ticks it down", "atZero": "what happens when it runs out" },
  "npcs": [{ "name": "string", "wants": "what they want from the party", "leverage": "what moves them (a secret, a need, a fear)" }],
  "twist": "a complication the GM can drop in mid-scene",
  "rewards": "what the party gains: information, an ally, an item, Hope, a shortcut"
}`;

export const SCENE_SPEC_RULES = `- Social and exploration encounters MUST have a "sceneSpec" (null for combat and puzzle): 3 to 5 rolls, each tied to a SPECIFIC action in this scene with its own trait, Difficulty and results. Never generic ("make a Presence roll to persuade"): name who, what and why.
- Daggerheart Difficulties: 10 easy, 12-13 standard, 15 hard, 18-20 very hard. Spread them; not every roll the same.
- Results follow Daggerheart's duality: success with Hope is a clean win; success with Fear succeeds with a cost or complication; failure moves the story on with a consequence, never a dead end.
- Use a countdown when the scene has time pressure (a ritual finishing, guards arriving, a transformation taking hold), started at 3-6.
- For social scenes list the NPCs present with what each wants and what moves them; for exploration, rolls cover navigating, searching, surviving and noticing.`;

