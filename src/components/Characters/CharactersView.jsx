import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import CharacterCardSimple from './CharacterCardSimple';
import CharacterFormSimple from './CharacterFormSimple';
import Modal from '../Modal';
import './CharactersView.css';

export default function CharactersView({ characters, addCharacter, updateCharacter, deleteCharacter, isDM }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.ancestry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="characters-view">
      <div className="view-header">
        <div>
          <h2>Characters</h2>
          <p className="view-subtitle">{characters.length} character{characters.length !== 1 ? 's' : ''} in your party</p>
        </div>
        {isDM && (
          <button className={`btn btn-primary ${isDM ? 'dm-mode' : ''}`} onClick={handleAdd}>
            <Plus size={20} />
            Add Character
          </button>
        )}
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
            <CharacterCardSimple
              key={character.id}
              character={character}
              onEdit={() => handleEdit(character)}
              onDelete={() => deleteCharacter(character.id)}
              isDM={isDM}
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
        <CharacterFormSimple
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
