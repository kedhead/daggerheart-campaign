import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CampaignDataProvider, useCampaignData } from './contexts/CampaignDataContext';
import AuthPage from './components/Auth/AuthPage';
import TermsOfService from './components/Auth/TermsOfService';
import MobileCampaignPicker from './components/Mobile/MobileCampaignPicker';
import './App.css';

/**
 * Entry point for the mobile app (`npm run build:mobile`), which the Expo
 * shell in mobile/ loads in a WebView.
 *
 * This is a sibling of AppWithAuth, not a variant of it. The web app's job is
 * to gate a large router on role; the mobile app has exactly one destination —
 * PlayerPortalView — so it reproduces only the pre-portal gates (auth, terms,
 * campaign) and skips the sidebar, router, GM tooling and campaign-creation
 * flows entirely. Keeping it separate is what makes the mobile build safe:
 * nothing here is imported by the web bundle, and nothing here changes it.
 *
 * The admin surface isn't merely hidden. It is never imported, so it isn't in
 * the bundle to be reached — which is also what keeps non-Daggerheart content
 * out of a binary that gets redistributed through app stores.
 */

const PlayerPortalView = lazy(() => import('./components/PlayerPortal/PlayerPortalView'));

function FullScreenFallback() {
  return (
    <div className="loading-view">
      <div className="loading-spinner" />
      <p>Loading...</p>
    </div>
  );
}

/** Shown when a campaign turns out to run a system the portal can't render. */
function UnsupportedSystem({ campaign, onBack }) {
  return (
    <div className="loading-view" style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ fontWeight: 700, marginBottom: 8 }}>Not available in the app</p>
      <p style={{ opacity: 0.7, fontSize: 13, lineHeight: 1.6 }}>
        “{campaign?.name || 'This campaign'}” runs {campaign?.gameSystem || 'another system'}.
        The app supports Daggerheart tables; open this one on the web.
      </p>
      <button onClick={onBack} style={{ marginTop: 20, padding: '10px 22px' }}>
        Pick another campaign
      </button>
    </div>
  );
}

/**
 * Mounted inside CampaignDataProvider. Reads the same live campaign data the
 * web app does, so a roll or an HP change here reaches the table instantly and
 * vice versa — the portal publishes through the shared dice service, and every
 * character write goes through the same Firestore document.
 */
function MobilePortalShell({ onSwitchCampaign }) {
  const { currentUser } = useAuth();
  const {
    campaign,
    characters,
    items,
    updateCharacter,
    stashFromCharacter,
    loading,
  } = useCampaignData();

  if (loading && !campaign) return <FullScreenFallback />;

  // A campaign can change system, or a stale id can point somewhere new, so
  // this is re-checked here rather than trusted from the picker.
  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';
  if (campaign && !isDaggerheart) {
    return <UnsupportedSystem campaign={campaign} onBack={onSwitchCampaign} />;
  }

  return (
    <Suspense fallback={<FullScreenFallback />}>
      <PlayerPortalView
        characters={characters}
        currentUserId={currentUser.uid}
        campaign={campaign}
        updateCharacter={updateCharacter}
        stashFromCharacter={stashFromCharacter}
        items={items}
        // On mobile there's no surrounding app to exit to, so the portal's
        // exit affordance drops you back at the campaign list instead.
        onExit={onSwitchCampaign}
      />
    </Suspense>
  );
}

function MobileContent() {
  const { currentUser, logout } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(null);
  // Shares the `lastCampaignId` key with the web app on purpose: opening the
  // app on a phone that already used the web build lands on the same table.
  const [campaignId, setCampaignId] = useState(() => localStorage.getItem('lastCampaignId'));

  useEffect(() => {
    if (currentUser) {
      setTermsAccepted(localStorage.getItem(`terms_accepted_${currentUser.uid}`) === 'true');
    }
  }, [currentUser]);

  const handleSelectCampaign = (id) => {
    localStorage.setItem('lastCampaignId', id);
    setCampaignId(id);
  };

  const handleSwitchCampaign = () => {
    localStorage.removeItem('lastCampaignId');
    setCampaignId(null);
  };

  const handleAcceptTerms = () => {
    localStorage.setItem(`terms_accepted_${currentUser.uid}`, 'true');
    localStorage.setItem(`terms_accepted_date_${currentUser.uid}`, new Date().toISOString());
    setTermsAccepted(true);
  };

  if (!currentUser) return <AuthPage />;
  if (termsAccepted === null) return <FullScreenFallback />;
  if (termsAccepted === false) {
    return <TermsOfService onAccept={handleAcceptTerms} onDecline={() => logout()} />;
  }

  if (!campaignId) return <MobileCampaignPicker onSelect={handleSelectCampaign} />;

  return (
    <CampaignDataProvider campaignId={campaignId}>
      <MobilePortalShell onSwitchCampaign={handleSwitchCampaign} />
    </CampaignDataProvider>
  );
}

export default function MobileApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MobileContent />
      </ToastProvider>
    </AuthProvider>
  );
}
