import { createContext, useContext, useMemo } from 'react';
import { useFirestoreCampaign } from '../hooks/useFirestoreCampaign';
import { useStorybook } from '../hooks/useStorybook';

const CampaignDataContext = createContext(null);

/**
 * Provides all campaign data and mutation functions to the component subtree,
 * eliminating the need to pass 85+ props down through CampaignApp.
 *
 * The storybook chapter subscription lives here too so the whole tree shares a
 * single Firestore listener instead of one per consumer (previously duplicated
 * in AppWithAuth and AppRouter).
 */
export function CampaignDataProvider({ campaignId, children }) {
  const data = useFirestoreCampaign(campaignId);
  const { chapters: storybookChapters } = useStorybook(campaignId);
  const value = useMemo(() => ({ ...data, storybookChapters }), [data, storybookChapters]);
  return (
    <CampaignDataContext.Provider value={value}>
      {children}
    </CampaignDataContext.Provider>
  );
}

/**
 * Hook for consuming campaign data. Must be used within CampaignDataProvider.
 */
export function useCampaignData() {
  const ctx = useContext(CampaignDataContext);
  if (!ctx) throw new Error('useCampaignData must be used within CampaignDataProvider');
  return ctx;
}
