// The open campaign's content rating, sent with every AI request.
//
// A mature campaign (campaign.contentIntensity === 'mature') gets frank,
// R-rated violence and horror in everything the AI writes and draws, and
// never sexual content (api/_lib/contentRating.js). Generators are called
// from all over the app, so the open campaign's rating is kept here and
// apiFetch adds it as a header.

let mature = false;

export function setContentIntensity(campaign) {
  mature = campaign?.contentIntensity === 'mature';
}

/** Headers to add to an /api request. */
export function contentHeaders() {
  return mature ? { 'X-Content-Intensity': 'mature' } : {};
}

export function isMatureCampaign() {
  return mature;
}
