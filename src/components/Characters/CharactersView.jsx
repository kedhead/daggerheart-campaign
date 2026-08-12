import { useState } from 'react';
import { Plus, Search, Users, LayoutGrid, FileText, Upload, Skull, Trash2 } from 'lucide-react';
import DemiplaneImportModal from './DemiplaneImportModal';
import CharacterCardSimple from './CharacterCardSimple';
import CharacterFormSimple from './CharacterFormSimple';
import DaggerheartCharacterSheet from './DaggerheartCharacterSheet';
import DaggerheartCharacterForm from './DaggerheartCharacterForm';
import CharacterCreationWizard from './CharacterCreationWizard';
import DnD5eForm from './forms/DnD5eForm';
import DnD5eCard from './cards/DnD5eCard';
import StarWarsD6Form from './forms/StarWarsD6Form';
import StarWarsD6Card from './cards/StarWarsD6Card';
import GenericForm from './forms/GenericForm';
import GenericCard from './cards/GenericCard';
import AssignPlayerControl from './AssignPlayerControl';
import ConfirmDeleteCharacterModal from './ConfirmDeleteCharacterModal';
import Modal from '../Modal';
import { getCharacterOwnerId } from '../../utils/characterOwnership';
import './CharactersView.css';

// Map game systems to their form/card components
const FORM_COMPONENTS = {
  'daggerheart': CharacterFormSimple,
  'dnd5e': DnD5eForm,
  'starwarsd6': StarWarsD6Form,
  'generic': GenericForm
};

const CARD_COMPONENTS = {
  'daggerheart': CharacterCardSimple,
  'dnd5e': DnD5eCard,
  'starwarsd6': StarWarsD6Card,
  'generic': GenericCard
};

export default function CharactersView({ campaign, characters, deletedCharacters = [], addCharacter, updateCharacter, deleteCharacter, isDM, currentUserId, items, partyInventory, addToCharacterInventory, removeFromCharacterInventory, toggleEquipped, transferToParty, onGoToGraveyard }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'sheets'
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [showDemiplaneImport, setShowDemiplaneImport] = useState(false);
  const [demiplaneTarget, setDemiplaneTarget] = useState(null);
  const [markFallenTarget, setMarkFallenTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deathDetails, setDeathDetails] = useState({ causeOfDeath: '', epitaph: '' });

  // Get the right form/card components for this campaign's game system
  const gameSystem = campaign?.gameSystem || 'daggerheart';
  const isDaggerheart = gameSystem === 'daggerheart';
  const isSheetMode = viewMode === 'sheets' && isDaggerheart;

  const FormComponent = isSheetMode
    ? DaggerheartCharacterForm
    : (FORM_COMPONENTS[gameSystem] || CharacterFormSimple);
  const CardComponent = isSheetMode
    ? DaggerheartCharacterSheet
    : (CARD_COMPONENTS[gameSystem] || CharacterCardSimple);

  const handleAdd = () => {
    if (isDaggerheart) {
      setShowCreationWizard(true);
    } else {
      setEditingCharacter(null);
      setIsModalOpen(true);
    }
  };

  const handleEdit = (character) => {
    setEditingCharacter(character);
    setIsModalOpen(true);
  };

  const handleSave = (characterData) => {
    if (editingCharacter) {
      updateCharacter(editingCharacter.id, characterData);
    } else {
      addCharacter(characterData);
    }
    setIsModalOpen(false);
    setEditingCharacter(null);
  };

  const handleWizardComplete = (characterData) => {
    addCharacter(characterData);
    setShowCreationWizard(false);
  };

  // Players can only edit their own characters, DMs can edit all
  const canEditCharacter = (character) => {
    return isDM || getCharacterOwnerId(character) === currentUserId;
  };

  const livingCharacters = characters.filter(c => !c.deceased);
  const fallenCount = characters.filter(c => c.deceased).length;

  const filteredCharacters = livingCharacters.filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (char.class && char.class.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (char.ancestry && char.ancestry.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (char.playerName && char.playerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleMarkFallen = () => {
    updateCharacter(markFallenTarget.id, {
      deceased: true,
      deathDate: new Date().toISOString(),
      causeOfDeath: deathDetails.causeOfDeath.trim(),
      epitaph: deathDetails.epitaph.trim(),
    });
    setMarkFallenTarget(null);
    setDeathDetails({ causeOfDeath: '', epitaph: '' });
  };

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 lr-fade-in" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Hero header */}
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 relative"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="space-y-2 relative z-10 w-full max-w-full">
          <span
            className="text-[11px] font-bold uppercase block"
            style={{ color: 'var(--primary)', letterSpacing: '0.28em' }}
          >
            Party Roster
          </span>
          <h2
            className="text-3xl md:text-4xl break-words"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Heroes of the Realm
          </h2>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-1">
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0"
              style={{
                background: 'var(--surface-hi)',
                border: '1px solid var(--line-strong)',
              }}
            >
              <Users size={11} style={{ color: 'var(--text-muted)' }} />
              <span
                className="text-[10px] font-bold uppercase"
                style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
              >
                {livingCharacters.length} {livingCharacters.length === 1 ? 'Adventurer' : 'Adventurers'}
              </span>
            </div>
            {fallenCount > 0 && onGoToGraveyard && (
              <button
                className="flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0 transition-all"
                style={{
                  background: 'rgba(80,20,20,0.3)',
                  border: '1px solid rgba(150,40,40,0.3)',
                }}
                onClick={onGoToGraveyard}
              >
                <Skull size={11} style={{ color: 'rgba(200,80,80,0.7)' }} />
                <span
                  className="text-[10px] font-bold uppercase"
                  style={{ color: 'rgba(200,80,80,0.7)', letterSpacing: '0.18em' }}
                >
                  {fallenCount} Fallen
                </span>
              </button>
            )}
            {deletedCharacters.length > 0 && onGoToGraveyard && (
              <button
                className="flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0 transition-all"
                style={{
                  background: 'var(--surface-hi)',
                  border: '1px solid var(--line-strong)',
                }}
                title="Restore a deleted character"
                onClick={onGoToGraveyard}
              >
                <Trash2 size={11} style={{ color: 'var(--text-muted)' }} />
                <span
                  className="text-[10px] font-bold uppercase"
                  style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
                >
                  {deletedCharacters.length} Deleted
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* View Mode Toggle - Daggerheart only */}
          {isDaggerheart && (
            <div
              className="flex items-center rounded-xl p-1"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
            >
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all"
                style={{
                  background: viewMode === 'cards' ? 'var(--primary-soft)' : 'transparent',
                  color: viewMode === 'cards' ? 'var(--primary)' : 'var(--text-muted)',
                  letterSpacing: '0.14em',
                }}
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid size={12} />
                Cards
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all"
                style={{
                  background: viewMode === 'sheets' ? 'var(--primary-soft)' : 'transparent',
                  color: viewMode === 'sheets' ? 'var(--primary)' : 'var(--text-muted)',
                  letterSpacing: '0.14em',
                }}
                onClick={() => setViewMode('sheets')}
              >
                <FileText size={12} />
                Full Sheets
              </button>
            </div>
          )}

          {isDaggerheart && (
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
              onClick={() => setShowDemiplaneImport(true)}
            >
              <Upload size={14} />
              <span className="font-bold text-[11px] uppercase" style={{ letterSpacing: '0.16em' }}>Import Demiplane</span>
            </button>
          )}

          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
            onClick={handleAdd}
          >
            <Plus size={16} />
            <span className="font-bold text-[11px] uppercase" style={{ letterSpacing: '0.18em' }}>Enlist Hero</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {characters.length > 0 && (
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:max-w-md relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search by name, class, or player…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
        </div>
      )}

      {filteredCharacters.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-16 md:p-24 rounded-2xl"
          style={{
            background: 'var(--surface)',
            border: '1px dashed var(--line-strong)',
          }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: 'var(--surface-hi)',
              color: 'var(--text-dim)',
              border: '1px solid var(--line-strong)',
            }}
          >
            <Users size={40} />
          </div>
          <h3
            className="text-2xl mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            The roster is empty
          </h3>
          <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-dim)' }}>
            No heroes have stepped forward to claim their destiny yet.
          </p>
          {isDM && !searchTerm && (
            <button
              className="px-6 py-3 rounded-xl transition-all"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
              onClick={handleAdd}
            >
              Enlist the First
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-8 pb-20 items-start ${isSheetMode
          ? 'grid-cols-1'
          : 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3'
          }`}>
          {filteredCharacters.map(character => (
            <div key={character.id} className="space-y-2">
              <CardComponent
                character={character}
                onEdit={() => handleEdit(character)}
                onDelete={() => setDeleteTarget(character)}
                isDM={isDM}
                canEdit={canEditCharacter(character)}
                campaign={campaign}
                updateCharacter={isSheetMode ? updateCharacter : undefined}
                items={isSheetMode ? items : undefined}
                onDemiplaneUpdate={isDaggerheart && canEditCharacter(character) ? () => setDemiplaneTarget(character) : undefined}
              />
              {isDM && (
                <div className="flex items-center justify-between px-1">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
                    style={{
                      background: 'rgba(80,20,20,0.3)',
                      border: '1px solid rgba(150,40,40,0.25)',
                      color: 'rgba(200,80,80,0.6)',
                      letterSpacing: '0.14em',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(120,30,30,0.5)';
                      e.currentTarget.style.color = 'rgba(220,100,100,0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(80,20,20,0.3)';
                      e.currentTarget.style.color = 'rgba(200,80,80,0.6)';
                    }}
                    onClick={() => {
                      setMarkFallenTarget(character);
                      setDeathDetails({ causeOfDeath: '', epitaph: '' });
                    }}
                  >
                    <Skull size={11} />
                    Mark as Fallen
                  </button>
                  <AssignPlayerControl
                    character={character}
                    campaign={campaign}
                    updateCharacter={updateCharacter}
                    isDM={isDM}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCharacter(null);
        }}
        title={editingCharacter ? 'Update Dossier' : 'New Operative'}
        size={isSheetMode ? 'full' : 'large'}
      >
        <FormComponent
          character={editingCharacter}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCharacter(null);
          }}
          isDM={isDM}
          campaign={campaign}
          items={isSheetMode ? items : undefined}
          partyInventory={isSheetMode ? partyInventory : undefined}
          addToCharacterInventory={isSheetMode ? addToCharacterInventory : undefined}
          removeFromCharacterInventory={isSheetMode ? removeFromCharacterInventory : undefined}
          toggleEquipped={isSheetMode ? toggleEquipped : undefined}
        />
      </Modal>

      {/* Character Creation Wizard (Daggerheart only) */}
      {showCreationWizard && (
        <CharacterCreationWizard
          onComplete={handleWizardComplete}
          onClose={() => setShowCreationWizard(false)}
          isDM={isDM}
          campaign={campaign}
        />
      )}

      {/* Demiplane Import / Update (Daggerheart only) */}
      <DemiplaneImportModal
        isOpen={showDemiplaneImport || !!demiplaneTarget}
        onClose={() => { setShowDemiplaneImport(false); setDemiplaneTarget(null); }}
        addCharacter={addCharacter}
        character={demiplaneTarget}
        updateCharacter={updateCharacter}
      />

      {/* Delete confirmation — deletes are recoverable from the Graveyard */}
      <ConfirmDeleteCharacterModal
        character={deleteTarget}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteCharacter(deleteTarget.id)}
      />

      {/* Mark as Fallen modal */}
      <Modal
        isOpen={!!markFallenTarget}
        onClose={() => setMarkFallenTarget(null)}
        title="Mark as Fallen"
        size="small"
      >
        <div className="space-y-5 p-2">
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Send{' '}
            <strong style={{ color: 'var(--text)' }}>{markFallenTarget?.name}</strong>{' '}
            to the graveyard. They can be resurrected later from the Graveyard view.
          </p>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}>
              Cause of Death
            </label>
            <input
              type="text"
              placeholder="How did they fall?"
              value={deathDetails.causeOfDeath}
              onChange={(e) => setDeathDetails(d => ({ ...d, causeOfDeath: e.target.value }))}
              className="w-full rounded-xl py-2.5 px-4 text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}>
              Epitaph <span style={{ color: 'var(--text-dim)' }}>(optional)</span>
            </label>
            <input
              type="text"
              placeholder="A final word in their memory…"
              value={deathDetails.epitaph}
              onChange={(e) => setDeathDetails(d => ({ ...d, epitaph: e.target.value }))}
              className="w-full rounded-xl py-2.5 px-4 text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
              style={{
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--line)',
                letterSpacing: '0.14em',
              }}
              onClick={() => setMarkFallenTarget(null)}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
              style={{
                background: 'rgba(150,40,40,0.8)',
                color: '#fff',
                letterSpacing: '0.14em',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
              onClick={handleMarkFallen}
            >
              <Skull size={12} style={{ display: 'inline', marginRight: 6 }} />
              Mark Fallen
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
