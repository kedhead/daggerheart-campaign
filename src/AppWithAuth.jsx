import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { CampaignDataProvider, useCampaignData } from './contexts/CampaignDataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthPage from './components/Auth/AuthPage';
import TermsOfService from './components/Auth/TermsOfService';
import CampaignSelector from './components/Campaigns/CampaignSelector';
import JoinCampaignPage from './components/Campaigns/JoinCampaignPage';
import RoleSelection from './components/RoleSelection/RoleSelection';
import SidebarWithAuth from './components/SidebarWithAuth';
import AppRouter from './components/AppRouter';
import { usePendingInvites } from './hooks/usePendingInvites';
import ChatWidget from './components/DaggerheartChat/ChatWidget';
import CommandPalette from './components/CommandPalette/CommandPalette';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { usePresence } from './hooks/usePresence';
import { useCampaignAuth } from './hooks/useCampaignAuth';
import TopBar from './components/Layout/TopBar';
import BottomNav from './components/Layout/BottomNav';
import './App.css';

// Lazy-loaded: only needed off the critical login path, or pull in heavy
// libraries (three.js, @3d-dice/dice-box) that shouldn't block initial load.
const PlayerDisplay = lazy(() => import('./components/PlayerDisplay/PlayerDisplay'));
const PublicChronicleView = lazy(() => import('./components/Storybook/PublicChronicleView'));
const BattleMapDisplayWindow = lazy(() => import('./components/BattleMapDisplay/BattleMapDisplayWindow'));
const PlayerPortalView = lazy(() => import('./components/PlayerPortal/PlayerPortalView'));
const DiceRoller = lazy(() => import('./dice').then(m => ({ default: m.DiceRoller })));
const DiceTray = lazy(() => import('./dice').then(m => ({ default: m.DiceTray })));

function FullScreenFallback() {
  return (
    <div className="loading-view">
      <div className="loading-spinner" />
      <p>Loading...</p>
    </div>
  );
}

/**
 * Inner shell — consumes CampaignDataContext, renders the full app layout.
 * Must be mounted inside CampaignDataProvider.
 */
function CampaignAppShell({ currentCampaignId, setCurrentCampaignId, userRole, onChangeUserRole }) {
  const { currentUser } = useAuth();
  const { success } = useToast();
  const { joinedCampaigns } = usePendingInvites();

  const {
    campaign,
    characters,
    npcs,
    locations,
    adversaries,
    quests,
    lore,
    sessions,
    encounters,
    campaignFrame,
    initiative,
    items,
    updateCharacter,
  } = useCampaignData();

  const [currentView, setCurrentView] = useState('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [playerPortalMode, setPlayerPortalMode] = useState(
    () => localStorage.getItem('lrPlayerPortalMode') === 'true'
  );

  const { isDM, campaignRole } = useCampaignAuth(campaign, currentUser);
  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';
  const isStarWarsD6 = campaign?.gameSystem === 'starwarsd6';
  const hasChatBot = isDaggerheart || isStarWarsD6;

  useKeyboardShortcut('/', () => setIsCommandPaletteOpen(true), { ctrl: true });
  useKeyboardShortcut('k', () => setIsCommandPaletteOpen(true), { ctrl: true });

  const { presenceList } = usePresence(currentCampaignId, currentView);

  useEffect(() => {
    if (joinedCampaigns.length > 0) {
      const names = joinedCampaigns.map(c => c.name).join(', ');
      success(`Welcome! You've been added to: ${names}`);
    }
  }, [joinedCampaigns, success]);

  const handleTogglePortal = () => {
    setPlayerPortalMode(prev => {
      const next = !prev;
      localStorage.setItem('lrPlayerPortalMode', next ? 'true' : 'false');
      return next;
    });
  };

  if (playerPortalMode && !isDM && isDaggerheart) {
    return (
      <Suspense fallback={<FullScreenFallback />}>
      <PlayerPortalView
        characters={characters}
        currentUserId={currentUser.uid}
        campaign={campaign}
        updateCharacter={updateCharacter}
        items={items}
        onExit={handleTogglePortal}
      />
      </Suspense>
    );
  }

  return (
    <ThemeProvider gameSystem={campaign?.gameSystem}>
      <div className={`app min-h-screen flex bg-arcane-navy selection:bg-indigo-500/30 font-sans relative overflow-hidden ${isDM ? 'dm-mode' : 'player-mode'}`}>
        {/* Global Background Visuals */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full animate-pulse delay-1000" />
          <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-500/5 blur-[80px] rounded-full animate-pulse delay-500" />
        </div>

        <div className="relative z-10 flex flex-1">
          <SidebarWithAuth
            currentView={currentView}
            setCurrentView={setCurrentView}
            isDM={isDM}
            userRole={campaignRole}
            currentCampaign={campaign}
            onSwitchCampaign={() => setCurrentCampaignId(null)}
          />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
            <TopBar
              currentView={currentView}
              presenceList={presenceList}
              currentCampaignId={currentCampaignId}
              campaign={campaign}
              isDM={isDM}
              setCurrentView={setCurrentView}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />
            <main className="flex-1 overflow-y-auto custom-scrollbar relative lr-fade-in" style={{ paddingBottom: 'var(--lr-main-pad, 0)' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
              <AppRouter
                currentView={currentView}
                setCurrentView={setCurrentView}
                isDM={isDM}
                currentUserId={currentUser.uid}
                currentCampaignId={currentCampaignId}
                userRole={userRole}
                onChangeUserRole={onChangeUserRole}
              />
            </main>
          </div>
        </div>

        <BottomNav
          currentView={currentView}
          setCurrentView={setCurrentView}
          onMore={() => window.dispatchEvent(new CustomEvent('lr-open-sidebar'))}
          isDM={isDM}
          isDaggerheart={isDaggerheart}
          onEnterPortal={handleTogglePortal}
        />

        {hasChatBot && (
          <ChatWidget
            userId={currentUser?.uid}
            gameSystem={campaign?.gameSystem || 'daggerheart'}
            campaign={campaign}
            campaignFrame={campaignFrame}
            characters={characters}
            npcs={npcs}
            adversaries={adversaries}
            locations={locations}
            lore={lore}
            sessions={sessions}
            encounters={encounters}
          />
        )}

        <Suspense fallback={null}>
          <DiceTray campaignId={currentCampaignId} />
          <DiceRoller
            campaignId={currentCampaignId}
            gameSystem={campaign?.gameSystem || 'daggerheart'}
            isDM={isDM}
            variant="fab"
          />
        </Suspense>

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          npcs={npcs}
          characters={characters}
          locations={locations}
          quests={quests}
          isDM={isDM}
        />
      </div>
    </ThemeProvider>
  );
}

/**
 * Outer campaign wrapper — manages pre-campaign gates (role, campaign selection)
 * and provides CampaignDataContext to the shell.
 */
function CampaignApp() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [currentCampaignId, setCurrentCampaignId] = useState(
    localStorage.getItem('lastCampaignId') || null
  );

  const handleRoleSelection = (role) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  };

  const handleSelectCampaign = (campaignId) => {
    setCurrentCampaignId(campaignId);
    localStorage.setItem('lastCampaignId', campaignId);
  };

  if (!userRole) {
    return <RoleSelection onSelectRole={handleRoleSelection} />;
  }

  if (!currentCampaignId) {
    return (
      <div className="app">
        <CampaignSelector
          currentCampaignId={currentCampaignId}
          onSelectCampaign={handleSelectCampaign}
          userRole={userRole}
        />
      </div>
    );
  }

  return (
    <CampaignDataProvider campaignId={currentCampaignId}>
      <CampaignAppShell
        currentCampaignId={currentCampaignId}
        setCurrentCampaignId={(id) => {
          setCurrentCampaignId(id);
          if (!id) localStorage.removeItem('lastCampaignId');
        }}
        userRole={userRole}
        onChangeUserRole={handleRoleSelection}
      />
    </CampaignDataProvider>
  );
}

function AppContent() {
  const { currentUser, logout } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const campaignIdParam = urlParams.get('campaign');
  const joinCampaignId = urlParams.get('join');
  const publicChronicleId = urlParams.get('chronicle');

  useEffect(() => {
    if (currentUser) {
      const accepted = localStorage.getItem(`terms_accepted_${currentUser.uid}`);
      setTermsAccepted(accepted === 'true');
    }
  }, [currentUser]);

  // Public chronicle — no auth required. Placed AFTER all hooks (Rules of Hooks).
  if (publicChronicleId) {
    return (
      <Suspense fallback={<FullScreenFallback />}>
        <PublicChronicleView campaignId={publicChronicleId} />
      </Suspense>
    );
  }

  const handleAcceptTerms = () => {
    if (currentUser) {
      localStorage.setItem(`terms_accepted_${currentUser.uid}`, 'true');
      localStorage.setItem(`terms_accepted_date_${currentUser.uid}`, new Date().toISOString());
      setTermsAccepted(true);
    }
  };

  const handleDeclineTerms = async () => {
    await logout();
  };

  if (!currentUser) {
    return <AuthPage />;
  }

  if (viewParam === 'playerDisplay' && campaignIdParam) {
    return (
      <Suspense fallback={<FullScreenFallback />}>
        <PlayerDisplay campaignId={campaignIdParam} />
      </Suspense>
    );
  }

  if (viewParam === 'battleMapDisplay' && campaignIdParam) {
    return (
      <Suspense fallback={<FullScreenFallback />}>
        <BattleMapDisplayWindow campaignId={campaignIdParam} />
      </Suspense>
    );
  }

  if (joinCampaignId) {
    const handleJoinSuccess = (campaignId) => {
      window.history.replaceState({}, '', window.location.origin);
      localStorage.setItem('lastCampaignId', campaignId);
      window.location.reload();
    };
    return <JoinCampaignPage campaignId={joinCampaignId} onJoinSuccess={handleJoinSuccess} />;
  }

  if (termsAccepted === false) {
    return <TermsOfService onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />;
  }

  if (termsAccepted === null) {
    return (
      <div className="loading-view">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return <CampaignApp />;
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
