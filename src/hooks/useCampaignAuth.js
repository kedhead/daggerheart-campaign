import { useMemo } from 'react';

/**
 * Single source of truth for campaign role determination.
 *
 * Replaces the 5-condition cascade that previously lived inline in CampaignApp:
 *   isSuperAdmin || dmId === uid || createdBy === uid || role === 'dm' || !campaign.dmId
 *
 * After the migration effect in useFirestoreCampaign runs, every campaign has a
 * members map with the creator's role set to 'dm'. This hook trusts that map as
 * the canonical source. Super-admin status is checked separately via env var so
 * UIDs are never hardcoded in source.
 *
 * @param {object|null} campaign     - campaign document from Firestore
 * @param {object|null} currentUser  - Firebase auth user
 * @returns {{ isDM: boolean, campaignRole: string }}
 */
export function useCampaignAuth(campaign, currentUser) {
  return useMemo(() => {
    if (!campaign || !currentUser) {
      return { isDM: false, campaignRole: 'player' };
    }

    const campaignRole = campaign.members?.[currentUser.uid]?.role ?? 'player';

    // Super-admin override — UIDs sourced from env, never hardcoded
    const superAdminIds = (import.meta.env.VITE_SUPER_ADMIN_IDS || '').split(',').filter(Boolean);
    const isSuperAdmin = superAdminIds.includes(currentUser.uid);

    const isDM = isSuperAdmin || campaignRole === 'dm';

    return { isDM, campaignRole };
  }, [campaign, currentUser?.uid]);
}
