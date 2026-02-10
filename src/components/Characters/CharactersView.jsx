import { Plus, Search, Users, Wand2 } from 'lucide-react';
import CharacterCardSimple from './CharacterCardSimple';
import CharacterFormSimple from './CharacterFormSimple';
import DnD5eForm from './forms/DnD5eForm';
import DnD5eCard from './cards/DnD5eCard';
import StarWarsD6Form from './forms/StarWarsD6Form';
import StarWarsD6Card from './cards/StarWarsD6Card';
import GenericForm from './forms/GenericForm';
import GenericCard from './cards/GenericCard';
import Modal from '../Modal';
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
    <div className="min-h-screen bg-transparent p-6 space-y-10 animate-in fade-in duration-1000">
      {/* Immersive View Header */}
      <div className="flex items-center justify-between gap-8 pb-8 border-b border-white/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h2 className="font-serif text-4xl font-black text-white/95 tracking-tight italic lowercase">
            Party Manifest
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <Users size={10} className="text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{characters.length} Operatives</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">The Heroes of the Realm</p>
          </div>
        </div>

        <button
          className="group relative flex items-center gap-3 px-8 py-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.08] text-white transition-all duration-500 border border-white/5 hover:border-white/20 overflow-hidden shadow-2xl"
          onClick={handleAdd}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={20} className="relative z-10 text-emerald-400 group-hover:scale-125 transition-transform" />
          <span className="relative z-10 font-black text-xs uppercase tracking-[0.3em] font-sans">Enlist Hero</span>
        </button>

        {/* Subtle Background Glow for Header */}
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Modern Refined Filter Bar */}
      {characters.length > 0 && (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:max-w-md relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-white/60 transition-all duration-300" />
            <input
              type="text"
              placeholder="Locate operative by name, class, or player..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-3xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-black/40 transition-all text-white placeholder:text-white/10 shadow-inner group-hover:border-white/10"
            />
          </div>
        </div>
      )}

      {filteredCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-32 rounded-[3rem] border border-white/5 bg-white/[0.01] backdrop-blur-sm group transition-all duration-700 hover:bg-white/[0.02] hover:border-white/10">
          <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 text-white/[0.03] group-hover:text-white/[0.07] group-hover:scale-110 transition-all duration-700">
            <Users size={48} />
          </div>
          <h3 className="text-2xl font-serif font-black text-white/40 mb-3 italic lowercase">The roster is empty</h3>
          <p className="text-sm text-white/20 font-medium mb-10 tracking-wide">No heroes have stepped forward to claim their destiny yet.</p>
          {isDM && !searchTerm && (
            <button
              className="px-10 py-4 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95"
              onClick={handleAdd}
            >
              Enlist the First
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-20 items-start">
          {filteredCharacters.map(character => (
            <CardComponent
              key={character.id}
              character={character}
              onEdit={() => handleEdit(character)}
              onDelete={() => deleteCharacter(character.id)}
              isDM={isDM}
              canEdit={canEditCharacter(character)}
              campaign={campaign}
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
        title={editingCharacter ? 'Update Dossier' : 'New Operative'}
        size="large"
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
        />
      </Modal>
    </div>
  );
}
