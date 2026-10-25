// The campaign's art style, for every image request.
//
// When a campaign turns on "use this style for all campaign art", its
// storybook style travels with every portrait, monster, location, lore,
// handout and map request, and the server paints in that style (see
// api/_lib/artStyle.js). The image generators are plain functions called
// from all over the app, so rather than thread the campaign through each
// one, the open campaign's style is kept here.

const DEFAULT_STYLE_KEY = 'watercolor'; // matches storybookGenerator's default

let current = null;

/** The style a campaign asks for, or null when it keeps per-image styles. */
export function campaignArtStyle(campaign) {
  if (!campaign?.unifiedArtStyle) return null;
  const artStyle = campaign.storybookStyle || DEFAULT_STYLE_KEY;
  if (artStyle === 'custom') {
    const custom = String(campaign.storybookStyleCustom || '').trim();
    return custom ? { artStyle, artStyleCustom: custom } : null;
  }
  return { artStyle };
}

/** Called when the open campaign (or its settings) change. */
export function setCampaignArtStyle(campaign) {
  current = campaignArtStyle(campaign);
}

/** The fields to spread into an /api/generate-image request body. */
export function artStyleRequestFields() {
  return current ? { ...current } : {};
}

/** Whether the open campaign paints everything in one style. */
export function hasCampaignArtStyle() {
  return !!current;
}
