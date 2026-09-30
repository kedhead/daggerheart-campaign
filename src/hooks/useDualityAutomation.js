// Player-side Hope automation: after an action roll, fill a Hope (and on a
// critical, clear a Stress) on the roller's own character.
//
// The player owns their character document, so this runs on their device and
// needs no rule change. Fear is the DM's pool and is applied on the DM's device
// instead — see useAutoFear.
//
// The rules themselves live in utils/dualityAutomation.js; this is only the
// glue: read the character as it is displayed right now, write the result, and
// say what happened.

import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { dualityEffects, applyHopeStressGain, isAutoHopeFearOn } from '../utils/dualityAutomation';

/**
 * @param {object} args
 * @param {object} args.character - the character AS CURRENTLY DISPLAYED. The
 *   full sheet keeps unsaved local copies of its tracks; pass those in, or a
 *   Hope gained here could overwrite a tap the player made a moment ago.
 * @param {object} args.campaign - for the DM's on/off setting
 * @param {function} args.updateCharacter - (id, updates) => Promise
 * @returns {function} applyRollOutcome(roll) — call with the document a roll returns
 */
export function useDualityAutomation({ character, campaign, updateCharacter }) {
  const { success, info } = useToast();

  return useCallback((roll) => {
    if (!roll || !character?.id || !updateCharacter) return;
    if (!isAutoHopeFearOn(campaign)) return;

    const effects = dualityEffects(roll);
    if (!effects.hope && !effects.clearStress) return;

    const { updates, gainedHope, clearedStress } = applyHopeStressGain(character, effects);
    if (updates) updateCharacter(character.id, updates);

    // Say so every time. Players are used to tapping the Hope pip themselves,
    // and without this they'd tap it again and double-count.
    if (effects.crit) {
      const parts = [gainedHope && '+1 Hope', clearedStress && 'cleared a Stress'].filter(Boolean);
      success(parts.length ? `Critical! ${parts.join(', ')}` : 'Critical success!');
    } else if (gainedHope) {
      success('✨ +1 Hope');
    } else if (effects.hope) {
      info('With Hope — your Hope is already full');
    }
  }, [character, campaign, updateCharacter, success, info]);
}
