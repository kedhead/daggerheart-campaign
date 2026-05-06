import { useState, useEffect, useMemo } from 'react';
import { X, Compass } from 'lucide-react';
import { getCharacterOwnerId } from '../../utils/characterOwnership';
import PortalCharacterSheet from './PortalCharacterSheet';
import './PlayerPortal.css';

function CharacterSelectScreen({ characters, onSelect, onExit }) {
  if (characters.length === 0) {
    return (
      <div className="lrp-portal">
        <div className="lrp-header">
          <div style={{ flex: 1 }}>
            <div className="lrp-header-title">Player Portal</div>
          </div>
          <button className="lrp-icon-btn" onClick={onExit} aria-label="Exit portal">
            <X size={18} />
          </button>
        </div>
        <div className="lrp-content">
          <div className="lrp-content-inner" style={{ textAlign: 'center', paddingTop: 60 }}>
            <Compass size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              No characters assigned to you yet.
            </p>
            <p style={{ color: 'var(--text-dim, rgba(255,255,255,0.3))', fontSize: 13, marginTop: 8 }}>
              Ask your GM to assign a character, or create one from the Characters view.
            </p>
            <button
              className="lrp-action-btn lrp-action-btn-secondary"
              onClick={onExit}
              style={{ margin: '24px auto 0', display: 'flex' }}
            >
              Return to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lrp-portal">
      <div className="lrp-header">
        <div style={{ flex: 1 }}>
          <div className="lrp-header-title">Player Portal</div>
          <div className="lrp-header-subtitle">Choose your character</div>
        </div>
        <button className="lrp-icon-btn" onClick={onExit} aria-label="Exit portal">
          <X size={18} />
        </button>
      </div>
      <div className="lrp-content">
        <div className="lrp-content-inner" style={{ paddingTop: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <Compass size={24} style={{ color: 'var(--primary, #6366f1)' }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                Portal Mode
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                Focused view for play at the table
              </div>
            </div>
          </div>

          {characters.map((char) => {
            const initial = (char.name || '?')[0].toUpperCase();
            const hpCount = (char.hpSlots || []).filter(s => !s).length;
            const hpTotal = (char.hpSlots || []).length || 6;
            return (
              <button
                key={char.id}
                className="lrp-select-card"
                onClick={() => onSelect(char.id)}
              >
                <div className="lrp-avatar">
                  {char.avatarUrl
                    ? <img src={char.avatarUrl} alt={char.name} />
                    : initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                    {char.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {[char.class, char.subclass, char.ancestry].filter(Boolean).join(' · ')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      padding: '1px 6px',
                      borderRadius: 99,
                      background: 'rgba(99,102,241,0.15)',
                      color: 'var(--primary, #6366f1)',
                    }}>
                      Lv {char.level || 1}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      HP {hpCount}/{hpTotal}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PlayerPortalView({
  characters,
  currentUserId,
  campaign,
  updateCharacter,
  items,
  onExit,
}) {
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

  // Persist selection
  useEffect(() => {
    if (storageKey && selectedId) localStorage.setItem(storageKey, selectedId);
  }, [storageKey, selectedId]);

  // If only one character exists and nothing is selected, auto-select
  useEffect(() => {
    if (!selectedId && myCharacters.length === 1) {
      setSelectedId(myCharacters[0].id);
    }
    // If selected character no longer exists, clear
    if (selectedId && !myCharacters.some(c => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [myCharacters, selectedId]);

  const character = myCharacters.find(c => c.id === selectedId) || null;

  if (!character) {
    return (
      <CharacterSelectScreen
        characters={myCharacters}
        onSelect={setSelectedId}
        onExit={onExit}
      />
    );
  }

  return (
    <PortalCharacterSheet
      character={character}
      updateCharacter={updateCharacter}
      campaign={campaign}
      items={items}
      showBack={myCharacters.length > 1}
      onBack={() => setSelectedId(null)}
      onExit={onExit}
    />
  );
}
