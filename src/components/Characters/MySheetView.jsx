import { useEffect, useMemo, useState } from 'react';
import { Plus, UserPlus, Users, ArrowRight } from 'lucide-react';
import DaggerheartCharacterSheet from './DaggerheartCharacterSheet';
import DaggerheartCharacterForm from './DaggerheartCharacterForm';
import CharacterCreationWizard from './CharacterCreationWizard';
import Modal from '../Modal';

export default function MySheetView({
  characters,
  currentUserId,
  campaign,
  updateCharacter,
  deleteCharacter,
  addCharacter,
  isDM,
  items,
  addToCharacterInventory,
  removeFromCharacterInventory,
  toggleEquipped,
  onGoToRoster,
}) {
  const myCharacters = useMemo(
    () => (characters || []).filter((c) => c.createdBy === currentUserId),
    [characters, currentUserId]
  );

  const storageKey = currentUserId ? `lrLastOpenedCharacter:${currentUserId}` : null;

  const [selectedId, setSelectedId] = useState(() => {
    const stored = storageKey ? localStorage.getItem(storageKey) : null;
    if (stored && myCharacters.some((c) => c.id === stored)) return stored;
    return myCharacters[0]?.id ?? null;
  });
  const [showWizard, setShowWizard] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!selectedId && myCharacters[0]) {
      setSelectedId(myCharacters[0].id);
      return;
    }
    if (selectedId && !myCharacters.some((c) => c.id === selectedId)) {
      setSelectedId(myCharacters[0]?.id ?? null);
    }
  }, [myCharacters, selectedId]);

  useEffect(() => {
    if (storageKey && selectedId) {
      localStorage.setItem(storageKey, selectedId);
    }
  }, [storageKey, selectedId]);

  const character = myCharacters.find((c) => c.id === selectedId) || null;

  const handleWizardComplete = async (characterData) => {
    const created = await Promise.resolve(addCharacter(characterData));
    setShowWizard(false);
    if (created?.id) setSelectedId(created.id);
  };

  const handleEditSave = (data) => {
    if (character) updateCharacter(character.id, data);
    setShowEdit(false);
  };

  const handleDelete = () => {
    if (!character) return;
    if (confirm(`Delete ${character.name}? This cannot be undone.`)) {
      deleteCharacter(character.id);
      setSelectedId(null);
    }
  };

  // Empty state: offer to create a character
  if (myCharacters.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center lr-fade-in"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-8 space-y-5"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
            style={{
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
            }}
          >
            <UserPlus size={28} strokeWidth={1.8} />
          </div>
          <div className="space-y-2">
            <span
              className="block text-[11px] font-bold uppercase"
              style={{ color: 'var(--primary)', letterSpacing: '0.28em' }}
            >
              My Sheet
            </span>
            <h2
              className="text-2xl"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: 'var(--text)',
                letterSpacing: '-0.01em',
              }}
            >
              No character yet
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Create one to claim a sheet of your own. You&rsquo;ll still see the full party
              roster under Characters.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: '1px solid transparent',
              }}
              onClick={() => setShowWizard(true)}
            >
              <Plus size={16} />
              <span
                className="font-bold text-[11px] uppercase"
                style={{ letterSpacing: '0.18em' }}
              >
                Create character
              </span>
            </button>
            {onGoToRoster && (
              <button
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all"
                style={{
                  background: 'var(--surface-hi)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--line)',
                }}
                onClick={onGoToRoster}
              >
                <Users size={14} />
                <span
                  className="font-bold text-[10px] uppercase"
                  style={{ letterSpacing: '0.16em' }}
                >
                  Party roster
                </span>
              </button>
            )}
          </div>
        </div>

        {showWizard && (
          <CharacterCreationWizard
            onComplete={handleWizardComplete}
            onClose={() => setShowWizard(false)}
            isDM={isDM}
            campaign={campaign}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen lr-fade-in" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Character switcher (only when user has >1 character) */}
      {myCharacters.length > 1 && (
        <div
          className="px-6 pt-5 pb-3 flex flex-wrap items-center gap-2"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <span
            className="text-[10px] font-bold uppercase mr-1"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
          >
            My Sheet
          </span>
          {myCharacters.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: active ? 'var(--primary-soft)' : 'var(--surface)',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
                  letterSpacing: '0.04em',
                }}
              >
                {c.name || 'Unnamed'}
              </button>
            );
          })}
          {onGoToRoster && (
            <button
              type="button"
              onClick={onGoToRoster}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--line)',
                letterSpacing: '0.16em',
              }}
            >
              Full Roster <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* Single-character: slim header with link to roster */}
      {myCharacters.length === 1 && onGoToRoster && (
        <div className="px-6 pt-4 pb-2 flex items-center justify-between">
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: 'var(--primary)', letterSpacing: '0.24em' }}
          >
            My Sheet
          </span>
          <button
            type="button"
            onClick={onGoToRoster}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--line)',
              letterSpacing: '0.16em',
            }}
          >
            Full Roster <ArrowRight size={12} />
          </button>
        </div>
      )}

      {character && (
        <DaggerheartCharacterSheet
          character={character}
          onEdit={() => setShowEdit(true)}
          onDelete={handleDelete}
          isDM={isDM}
          canEdit={true}
          campaign={campaign}
          updateCharacter={updateCharacter}
          items={items}
        />
      )}

      {showEdit && character && (
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          title={`Edit ${character.name}`}
          size="large"
        >
          <DaggerheartCharacterForm
            character={character}
            onSave={handleEditSave}
            onCancel={() => setShowEdit(false)}
            isDM={isDM}
            campaign={campaign}
            items={items}
            addToCharacterInventory={addToCharacterInventory}
            removeFromCharacterInventory={removeFromCharacterInventory}
            toggleEquipped={toggleEquipped}
          />
        </Modal>
      )}
    </div>
  );
}
