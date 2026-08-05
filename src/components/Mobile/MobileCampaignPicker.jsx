import { useMemo } from 'react';
import { LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaigns } from '../../hooks/useCampaigns';
import '../PlayerPortal/PlayerPortal.css';

/**
 * Campaign chooser for the mobile app.
 *
 * Deliberately not CampaignSelector: that one is built around the GM's job —
 * creating campaigns, browsing public ones, picking a game system. The mobile
 * app is player-side only, so this lists the campaigns you're already a member
 * of and nothing else. Joining still happens on the web via an invite link.
 *
 * Campaigns running a system the portal can't render are listed but disabled,
 * so a player in a mixed group sees why the campaign isn't openable here
 * instead of it silently missing.
 */
export default function MobileCampaignPicker({ onSelect }) {
  const { currentUser, logout } = useAuth();
  const { campaigns, loading } = useCampaigns();

  const { playable, unsupported } = useMemo(() => {
    const isDaggerheart = (c) => !c.gameSystem || c.gameSystem === 'daggerheart';
    return {
      playable: campaigns.filter(isDaggerheart),
      unsupported: campaigns.filter(c => !isDaggerheart(c)),
    };
  }, [campaigns]);

  return (
    <div className="lrp-portal">
      <div className="lrp-content">
        <div className="lrp-inner" style={{ paddingTop: 'max(24px, env(safe-area-inset-top, 24px))', paddingBottom: 40 }}>

          <div style={{ padding: '12px 22px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                Choose your table
              </div>
              <div className="lrp-cinzel" style={{ fontSize: 26, fontWeight: 900, color: '#eab308', letterSpacing: '0.04em', marginTop: 2 }}>
                Lorelich
              </div>
            </div>
            <button onClick={logout} className="lrp-icon-btn" aria-label="Sign out"
              style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308' }}>
              <LogOut size={18} />
            </button>
          </div>

          {loading && (
            <div style={{ padding: '40px 22px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
              Loading your campaigns…
            </div>
          )}

          {!loading && campaigns.length === 0 && (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div className="lrp-cinzel" style={{ fontSize: 20, color: '#fdf6dc', fontWeight: 800 }}>
                No Campaigns Yet
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Ask your GM for an invite link and open it on this device. Once
                you've joined, the campaign shows up here.
              </div>
              <div style={{ marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                Signed in as {currentUser?.email}
              </div>
            </div>
          )}

          {playable.length > 0 && (
            <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {playable.map(c => (
                <button key={c.id} className="lrp-select-hero-card" onClick={() => onSelect(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lrp-cinzel" style={{ fontSize: 18, fontWeight: 800, color: '#eab308', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name || 'Untitled Campaign'}
                    </div>
                    {c.description && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={20} style={{ color: 'rgba(234,179,8,0.6)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}

          {unsupported.length > 0 && (
            <div style={{ padding: '26px 22px 0' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>
                Web only
              </div>
              {unsupported.map(c => (
                <div key={c.id} className="lrp-card" style={{ opacity: 0.5, marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                    {c.name || 'Untitled Campaign'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                    Open this one at lorelich.com — the app only runs Daggerheart tables.
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
