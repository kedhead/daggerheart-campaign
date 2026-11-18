import { shotCast, shotAbsent, shotIsScenery, groundShotPrompt, withoutNames } from './cinematicPlan';
import { ANCESTRY_VISUAL_HINTS } from '../../services/portraitGenerator';
import { regenerateScene, DEFAULT_STYLE_KEY } from '../../services/storybookGenerator';

/**
 * Drawing a shot for an animated reel (the recap's or a stand-alone
 * cinematic's), with the campaign's people in it drawn as themselves.
 *
 * Each person a shot names is swapped for a plain label ("the rogue") and
 * described from their sheet, so the image model draws them and not a
 * famous namesake; their portrait is sent as a reference. A shot that names
 * nobody and mentions no person or creature is drawn as an empty place.
 *
 * @param {object} opts
 * @param {object} opts.campaign
 * @param {Array} opts.characters
 * @param {Array} opts.npcs
 * @param {Array} opts.adversaries
 * @param {object} [opts.chapter] - a story chapter whose art style (and cast looks) the pictures follow
 * @param {Function} [opts.getEffectiveKey]
 * @returns {{ castOf: Function, plainNames: Function, drawScene: Function }}
 */
export default function useShotArt({ campaign, characters = [], npcs = [], adversaries = [], chapter = null, getEffectiveKey }) {
  const everyone = { characters, npcs, adversaries };

  // `ids` is the DM's own choice for a shot, when they have changed who is in it.
  const castOf = (text, ids = null) => shotCast(text, everyone, { ancestryLook: a => ANCESTRY_VISUAL_HINTS[a] || '', ids });

  /** `text` with the people in it swapped for plain labels (for the video model). */
  const plainNames = (text, about = text, ids = null) => {
    const cast = castOf(about, ids);
    return withoutNames(text, cast, shotAbsent(`${about} ${text}`, everyone, cast));
  };

  /** Draw one picture; returns its URL. */
  const drawScene = async ({ id, prompt, about, scenery: choice, cast: ids = null }) => {
    const cast = castOf(about, ids);
    const absent = shotAbsent(`${about} ${prompt}`, everyone, cast);
    const scenery = shotIsScenery(about, cast, choice);
    const scene = await regenerateScene({
      scene: { id, prompt: groundShotPrompt(prompt, cast, { scenery, absent }), featuredEntityIds: cast.map(c => c.id), labels: Object.fromEntries(cast.map(c => [c.id, c.label])), scenery },
      chapter,
      entities: everyone,
      campaignId: campaign?.id,
      apiKey: getEffectiveKey?.('openai')?.key || null,
      gameSystem: campaign?.gameSystem || 'daggerheart',
      styleKey: chapter?.styleKey || campaign?.storybookStyle || DEFAULT_STYLE_KEY,
      styleCustom: chapter?.styleCustom || campaign?.storybookStyleCustom || '',
      imageModel: 'nano-banana-2'
    });
    if (!scene?.imageUrl) throw new Error('The picture did not come back.');
    return scene.imageUrl;
  };

  return { castOf, plainNames, drawScene };
}
