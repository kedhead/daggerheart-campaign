// Homebrew modules: optional rules a campaign switches on in Edit Campaign.
// Off by default, so a campaign that doesn't use one never sees it.

export const HOMEBREW_MODULES = [
  {
    key: 'alchemy',
    label: 'Alchemy & concoctions',
    description: 'Characters can keep a satchel of ingredients (spores, herbs, strange reagents), combine them with AI into concoctions with a Hope effect and a Fear effect, and roll the Duality dice when they take a dose.'
  }
];

export function isHomebrewOn(campaign, key) {
  return campaign?.homebrew?.[key] === true;
}
