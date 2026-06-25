import { createContext, useContext } from 'react';
import { useFirestoreCampaign } from '../hooks/useFirestoreCampaign';

const CampaignDataContext = createContext(null);

/**
 * Provides all campaign data and mutation functions to the component subtree,
 * eliminating the need to pass 85+ props down through CampaignApp.
 */
export function CampaignDataProvider({ campaignId, children }) {
  const data = useFirestoreCampaign(campaignId);
  return (
    <CampaignDataContext.Provider value={data}>
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
