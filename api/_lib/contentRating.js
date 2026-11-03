// Mature campaigns: R-rated violence and horror, never sexual content.
//
// A campaign can be marked mature (campaign.contentIntensity). The browser
// then sends X-Content-Intensity: mature with every AI request (see
// src/services/apiClient.js), and each endpoint adds the guidance below.
// The models already write violence in fiction when asked; left alone they
// default to a cautious, family-friendly register that doesn't fit a grim
// campaign. Sexual content stays out either way, as the DM asked.

export const MATURE_TEXT_GUIDANCE = `CONTENT RATING: this is a mature (R-rated) tabletop campaign for adult players. Write violence, injury and death frankly and viscerally when the story calls for it: wounds, blood, brutal blows and grim aftermath. Let horror be genuinely unsettling, and let villains be truly cruel and menacing. Dark themes (war, loss, corruption, despair) are welcome. Do not soften, sanitise or cut away from them. No sexual content or nudity of any kind.`;

export const MATURE_IMAGE_GUIDANCE = 'Mature dark-fantasy art: show violence, blood, wounds and grim scenes frankly where the subject calls for it. No nudity or sexual content.';

/** Whether the request comes from a campaign marked mature. */
export function isMature(req) {
  const h = req?.headers || {};
  const v = typeof h.get === 'function' ? h.get('x-content-intensity') : (h['x-content-intensity'] ?? h['X-Content-Intensity']);
  return String(v || '').toLowerCase() === 'mature';
}

/** A system prompt with the mature guidance added, when the campaign is mature. */
export function withMatureSystem(system, mature) {
  if (!mature) return system;
  return system ? `${system}\n\n${MATURE_TEXT_GUIDANCE}` : MATURE_TEXT_GUIDANCE;
}

/**
 * An OpenAI client whose chat completions carry the mature guidance in their
 * system message, for endpoints that make several calls (the storybook).
 */
export function matureOpenAI(openai, mature) {
  if (!mature) return openai;
  return {
    ...openai,
    chat: {
      completions: {
        create(args) {
          const messages = [...(args.messages || [])];
          const at = messages.findIndex(m => m.role === 'system' && typeof m.content === 'string');
          if (at >= 0) messages[at] = { ...messages[at], content: withMatureSystem(messages[at].content, true) };
          else messages.unshift({ role: 'system', content: MATURE_TEXT_GUIDANCE });
          return openai.chat.completions.create({ ...args, messages });
        }
      }
    }
  };
}
