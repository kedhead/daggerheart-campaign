// Content-source registry. Every rules entry in the app belongs to a source:
// entries without a `source` field are Core Set; expansion entries carry the
// expansion's id. Campaigns can disable an expansion (campaign.contentSources
// map — absent means "everything on"), so tables that run core-only never see
// Hope & Fear options in pickers and catalogs.

export const CORE_SOURCE = 'core';
export const HOPE_FEAR_SOURCE = 'hope-fear';

export const CONTENT_SOURCES = [
  { id: CORE_SOURCE, label: 'Daggerheart Core Set', locked: true },
  {
    id: HOPE_FEAR_SOURCE,
    label: 'Hope & Fear (expansion)',
    releaseDate: '2026-08-25',
    description: 'Witch, Warlock, Brawler & Assassin · Dread domain · Transformations · 130+ adversaries',
  },
];

/** Source id of an entry ('core' when untagged). */
export function sourceOf(entry) {
  return entry?.source || CORE_SOURCE;
}

/** Whether a campaign has a source enabled. Core is always on; anything not
 *  explicitly disabled is on (new expansions default to enabled). */
export function isSourceEnabled(campaign, sourceId) {
  if (!sourceId || sourceId === CORE_SOURCE) return true;
  return campaign?.contentSources?.[sourceId] !== false;
}

/** Filter a content list down to the campaign's enabled sources. */
export function filterBySource(entries, campaign) {
  return (entries || []).filter(e => isSourceEnabled(campaign, sourceOf(e)));
}

/** Tag an array of entries with a source id (used at data-merge points). */
export function withSource(entries, sourceId) {
  return (entries || []).map(e => ({ ...e, source: sourceId }));
}
