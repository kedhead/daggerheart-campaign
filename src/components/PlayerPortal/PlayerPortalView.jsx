import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { getCharacterOwnerId } from '../../utils/characterOwnership';
import { usableHopeFilled, usableHopeMax } from '../../utils/daggerheartHope';
import PortalCharacterSheet from './PortalCharacterSheet';
import './PlayerPortal.css';

// Mini progress bar for the character select hero card
function MiniVital({ label, filled, max, color }) {
  const fillPct = max > 0 ? (filled / max) * 100 : 0;
  const colorMap = {
    gold:   { fg: '#eab308', track: 'rgba(234,179,8,0.12)' },
    hp:     { fg: '#f5c543', track: 'rgba(245,197,67,0.12)' },
    stress: { fg: '#a78bfa', track: 'rgba(167,139,250,0.12)' },
  }[color] || { fg: '#eab308', track: 'rgba(234,179,8,0.12)' };

  return (
    <div className="lrp-mini-vital">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800 }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: colorMap.fg, fontVariantNumeric: 'tabular-nums' }}>
          {filled}/{max}
        </span>
      </div>
      <div style={{ height: 4, background: colorMap.track, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: fillPct + '%', height: '100%', background: colorMap.fg, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function CharacterSelectScreen({ characters, playerName, campaign, onSelect, onExit }) {
  const primary = characters[0];
  const others = characters.slice(1);

  const toFilled = (arr) => (Array.isArray(arr) ? arr.filter(Boolean).length : 0);
  const toMax = (arr) => (Array.isArray(arr) ? arr.length : 6);

  if (characters.length === 0) {
    return (
      <div className="lrp-portal">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', paddingTop: 'max(24px, env(safe-area-inset-top, 24px))' }}>
          <div className="lrp-cinzel" style={{ fontSize: 22, color: '#fdf6dc', fontWeight: 800, letterSpacing: '0.04em' }}>
            No Characters Found
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 280 }}>
            Ask your GM to assign a character, or create one from the Characters view.
          </div>
          <button onClick={onExit} style={{
            marginTop: 24, padding: '10px 24px', borderRadius: 10,
            background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
            color: '#eab308', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Return to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lrp-portal">
      <div className="lrp-content">
        <div className="lrp-inner" style={{ paddingTop: 'max(18px, env(safe-area-inset-top, 18px))', paddingBottom: 40 }}>

          {/* Greeting header */}
          <div style={{ padding: '12px 22px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                Welcome back
              </div>
              <div className="lrp-cinzel" style={{ fontSize: 26, fontWeight: 900, color: '#eab308', letterSpacing: '0.04em', marginTop: 2 }}>
                {playerName || 'Adventurer'}
              </div>
            </div>
            <button onClick={onExit} className="lrp-icon-btn" aria-label="Exit portal"
              style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308' }}>
              <X size={18} />
            </button>
          </div>

          {/* Primary (active) character hero card */}
          <div style={{ padding: '0 18px' }}>
            <div style={{ fontSize: 10, color: 'rgba(234,179,8,0.6)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10, paddingLeft: 4 }}>
              Active Character
            </div>
            <button className="lrp-select-hero-card" onClick={() => onSelect(primary.id)}>
              {/* Corner glow */}
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
                <div className="lrp-avatar-ring" style={{
                  width: 86, height: 86, fontSize: 32,
                  border: `3px solid ${primary.accent || '#eab308'}`,
                  boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 0 24px ${primary.accent || '#eab308'}40`,
                }}>
                  {primary.avatarUrl
                    ? <img src={primary.avatarUrl} alt={primary.name} />
                    : primary.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lrp-cinzel" style={{ fontSize: 22, fontWeight: 900, color: '#eab308', letterSpacing: '0.04em', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(primary.name || '').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginTop: 6, lineHeight: 1.4 }}>
                    Lv {primary.level || 1} · {primary.class}
                  </div>
                  {primary.subclass && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.4 }}>
                      {primary.subclass}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>
                    {[primary.ancestry, primary.community].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>

              {/* Mini vital strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, position: 'relative' }}>
                {/* Scars cross out Hope slots — the roster used to ignore them
                    and show the unreduced maximum. */}
                <MiniVital label="Hope"   filled={usableHopeFilled(primary)}     max={usableHopeMax(primary)}     color="gold" />
                <MiniVital label="HP"     filled={toFilled(primary.hpSlots)}     max={toMax(primary.hpSlots)}     color="hp" />
                <MiniVital label="Stress" filled={toFilled(primary.stressSlots)} max={toMax(primary.stressSlots)} color="stress" />
              </div>

              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Tap to open sheet
                </span>
                <span style={{ color: '#eab308', fontSize: 18 }}>›</span>
              </div>
            </button>
          </div>

          {/* Other characters */}
          {others.length > 0 && (
            <div style={{ padding: '24px 18px 0' }}>
              <div style={{ fontSize: 10, color: 'rgba(234,179,8,0.6)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10, paddingLeft: 4 }}>
                Other Characters
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {others.map(c => (
                  <button key={c.id} className="lrp-select-other-card" onClick={() => onSelect(c.id)}>
                    <div className="lrp-avatar-ring" style={{
                      width: 48, height: 48, fontSize: 18,
                      border: `2px solid ${c.accent || '#eab308'}`,
                      boxShadow: `0 0 0 1px rgba(0,0,0,0.4)`,
                    }}>
                      {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} /> : c.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lrp-cinzel" style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>
                        Lv {c.level || 1} · {c.class} · {c.ancestry}
                      </div>
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px', borderRadius: 999,
                      background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)',
                      fontSize: 10, fontWeight: 800, color: '#eab308', letterSpacing: '0.05em',
                    }}>
                      <span style={{ opacity: 0.7 }}>HP</span>
                      <span>{toFilled(c.hpSlots)}/{toMax(c.hpSlots)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active campaign info */}
          {campaign && (
            <div style={{ padding: '24px 18px 8px' }}>
              <div style={{ fontSize: 10, color: 'rgba(234,179,8,0.6)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10, paddingLeft: 4 }}>
                Active Campaign
              </div>
              <div style={{
                padding: 14, borderRadius: 16,
                border: '1px solid rgba(139,92,246,0.18)',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(167,139,250,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
                  {campaign.gameSystem || 'Daggerheart'}
                </div>
                <div className="lrp-cinzel" style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  {campaign.name || 'The Campaign'}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function PlayerPortalView({ characters, currentUserId, campaign, updateCharacter, stashFromCharacter, items, onExit }) {
  const storageKey = currentUserId ? `lrPortalChar:${currentUserId}` : null;

  const myCharacters = useMemo(
    () => (characters || []).filter(c => getCharacterOwnerId(c) === currentUserId),
    [characters, currentUserId]
  );

  const [selectedId, setSelectedId] = useState(() => {
    const stored = storageKey ? localStorage.getItem(storageKey) : null;
    if (stored && myCharacters.some(c => c.id === stored)) return stored;
    return myCharacters.length === 1 ? myCharacters[0].id : null;
  });

  useEffect(() => {
    if (storageKey && selectedId) localStorage.setItem(storageKey, selectedId);
  }, [storageKey, selectedId]);

  useEffect(() => {
    if (!selectedId && myCharacters.length === 1) setSelectedId(myCharacters[0].id);
    if (selectedId && !myCharacters.some(c => c.id === selectedId)) setSelectedId(null);
  }, [myCharacters, selectedId]);

  const character = myCharacters.find(c => c.id === selectedId) || null;

  if (!character) {
    return (
      <CharacterSelectScreen
        characters={myCharacters}
        playerName={myCharacters[0]?.playerName || ''}
        campaign={campaign}
        onSelect={setSelectedId}
        onExit={onExit}
      />
    );
  }

  return (
    <PortalCharacterSheet
      character={character}
      currentUserId={currentUserId}
      updateCharacter={updateCharacter}
      stashFromCharacter={stashFromCharacter}
      campaign={campaign}
      items={items}
      showBack={myCharacters.length > 1}
      onBack={() => setSelectedId(null)}
      onExit={onExit}
    />
  );
}
