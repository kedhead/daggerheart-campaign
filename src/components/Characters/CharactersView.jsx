import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import CharacterCardSimple from './CharacterCardSimple';
import CharacterFormSimple from './CharacterFormSimple';
import DnD5eForm from './forms/DnD5eForm';
import DnD5eCard from './cards/DnD5eCard';
import StarWarsD6Form from './forms/StarWarsD6Form';
import StarWarsD6Card from './cards/StarWarsD6Card';
import Modal from '../Modal';
import './CharactersView.css';

// Map game systems to their form/card components
const FORM_COMPONENTS = {
  'daggerheart': CharacterFormSimple,
  'dnd5e': DnD5eForm,
  'starwarsd6': StarWarsD6Form
};

const CARD_COMPONENTS = {
  'daggerheart': CharacterCardSimple,
  'dnd5e': DnD5eCard,
  'starwarsd6': StarWarsD6Card
};

export default function CharactersView({ campaign, characters, addCharacter, updateCharacter, deleteCharacter, isDM, currentUserId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get the right form/card components for this campaign's game system
  const gameSystem = campaign?.gameSystem || 'daggerheart';
  const FormComponent = FORM_COMPONENTS[gameSystem] || CharacterFormSimple;
  const CardComponent = CARD_COMPONENTS[gameSystem] || CharacterCardSimple;

  const handleAdd = () => {
    setEditingCharacter(null);
    setIsModalOpen(true);
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

  // Players can only edit their own characters, DMs can edit all
  const canEditCharacter = (character) => {
    return isDM || character.createdBy === currentUserId;
  };

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (char.class && char.class.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (char.ancestry && char.ancestry.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (char.playerName && char.playerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="characters-view">
      <div className="view-header">
        <div>
          <h2>Characters</h2>
          <p className="view-subtitle">{characters.length} character{characters.length !== 1 ? 's' : ''} in your party</p>
        </div>
        <button className={`btn btn-primary ${isDM ? 'dm-mode' : ''}`} onClick={handleAdd}>
          <Plus size={20} />
          Add Character
        </button>
      </div>

      {characters.length > 0 && (
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {filteredCharacters.length === 0 ? (
        <div className="empty-state">
          <p>No characters found</p>
          {isDM && !searchTerm && (
            <button className={`btn btn-primary ${isDM ? 'dm-mode' : ''}`} onClick={handleAdd}>
              <Plus size={20} />
              Create First Character
            </button>
          )}
        </div>
      ) : (
        <div className="characters-grid">
          {filteredCharacters.map(character => (
            <CardComponent
              key={character.id}
              character={character}
              onEdit={() => handleEdit(character)}
              onDelete={() => deleteCharacter(character.id)}
              isDM={isDM}
              canEdit={canEditCharacter(character)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCharacter(null);
        }}
        title={editingCharacter ? 'Edit Character' : 'New Character'}
        size="medium"
      >
        <FormComponent
          character={editingCharacter}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCharacter(null);
          }}
          isDM={isDM}
        />
      </Modal>
    </div>
  );
}
