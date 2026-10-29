// Real cinematic sound for the table cinematics.
//
// The first version synthesised its hits with Web Audio, and they sounded
// like what they were: little computer beeps. These are ElevenLabs sound
// effects (the same generator as the soundboard) written as trailer sound
// design: braams, taiko slams, power chords, risers. Each style's set is made
// once per campaign, stored, and listed in battleMapDisplay/cinematicSounds,
// so every intro after the first costs nothing and the monitor can read it.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { generateSoundEffect } from '../../services/audioGenerator';
import { persistAudio } from '../../services/audioStorage';
import { SOUND_CUES } from './soundPlayer';

export { SOUND_CUES };

export const SOUND_STYLES = {
  epic: {
    label: 'Epic orchestral',
    cues: {
      whoosh: { prompt: 'Fast heavy cinematic whoosh, deep air swoosh flying past the listener, movie trailer transition', duration: 1.5 },
      impact: { prompt: 'Massive cinematic movie trailer impact: huge low brass braam with a deep sub bass boom and a long dark reverb tail', duration: 5 },
      slam: { prompt: 'Punchy cinematic title card hit: big taiko drum and metallic slam with a crash cymbal, epic trailer hit', duration: 2.5 },
      riser: { prompt: 'Cinematic tension riser: orchestral strings and synth swelling upward, ending right before a hit', duration: 3 }
    }
  },
  rock: {
    label: 'Gritty rock (Borderlands)',
    cues: {
      whoosh: { prompt: 'Fast gritty whoosh with a distorted swoosh, punchy video game transition', duration: 1.2 },
      impact: { prompt: 'Video game boss intro sting: distorted electric guitar power chord slam with a heavy rock drum hit and crash cymbal, punchy, with ringing amp feedback tail', duration: 4 },
      slam: { prompt: 'Heavy rock drum hit with a distorted guitar stab and crash cymbal, punchy video game title card hit', duration: 2 },
      riser: { prompt: 'Rock build-up riser: fast snare roll and distorted guitar sliding upward into a hit', duration: 3 }
    }
  },
  dark: {
    label: 'Dark & menacing',
    cues: {
      whoosh: { prompt: 'Dark ghostly whoosh, eerie air rushing past with a low growl', duration: 1.5 },
      impact: { prompt: 'Dark horror cinematic impact: deep sub drop boom with a distorted metallic screech and a low ominous drone tail', duration: 5 },
      slam: { prompt: 'Heavy dark cinematic hit: metallic clang and low boom with a reversed cymbal into it', duration: 2.5 },
      riser: { prompt: 'Dark horror tension riser with dissonant strings and low brass building upward', duration: 3 }
    }
  }
};
export const DEFAULT_SOUND_STYLE = 'epic';

const setRef = (campaignId) => doc(db, `campaigns/${campaignId}/battleMapDisplay/cinematicSounds`);

/**
 * The style's sound URLs, making whichever are missing (DM only: it writes
 * Storage and the battleMapDisplay doc). The first time takes a little while;
 * after that it is one read.
 */
export async function ensureSoundSet(campaignId, styleKey = DEFAULT_SOUND_STYLE, onStatus = () => {}) {
  const style = SOUND_STYLES[styleKey] ? styleKey : DEFAULT_SOUND_STYLE;
  const snap = await getDoc(setRef(campaignId));
  const all = snap.exists() ? snap.data() : {};
  const urls = { ...(all[style] || {}) };
  const missing = SOUND_CUES.filter(cue => !urls[cue]);
  for (let i = 0; i < missing.length; i++) {
    const cue = missing[i];
    onStatus(`Making cinematic sounds (first time only) ${i + 1}/${missing.length}…`);
    const { prompt, duration } = SOUND_STYLES[style].cues[cue];
    const result = await generateSoundEffect(prompt, null, { duration, promptInfluence: 0.6 });
    const data = result?.audioData;
    if (!data) throw new Error('The sound generator returned nothing.');
    urls[cue] = await persistAudio(campaignId, data, `cinematic-${style}-${cue}`);
    await setDoc(setRef(campaignId), { [style]: urls }, { merge: true });
  }
  return urls;
}
