import { useState } from 'react';
import { Plus, Search, Filter, BookOpen, Wand2 } from 'lucide-react';
import LoreCard from './LoreCard';
import LoreForm from './LoreForm';
import Modal from '../Modal';
import { LORE_TYPES } from '../../data/daggerheart';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateLoreImage } from '../../services/loreGenerator';
import './LoreView.css';

export default function LoreView({ lore, addLore, updateLore, deleteLore, isDM, campaign, npcs = [], locations = [], sessions = [], timelineEvents = [], encounters = [], notes = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLore, setEditingLore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [generatingImageFor, setGeneratingImageFor] = useState(null);
  const { hasKey, keys } = useAPIKey(campaign?.createdBy);

  const handleAdd = () => {
    setEditingLore(null);
    setIsModalOpen(true);
  };

  const handleEdit = (loreEntry) => {
    setEditingLore(loreEntry);
    setIsModalOpen(true);
  };

  const handleSave = (loreData) => {
    if (editingLore) {
      updateLore(editingLore.id, loreData);
    } else {
      addLore(loreData);
    }
    setIsModalOpen(false);
    setEditingLore(null);
  };

  const handleGenerateImage = async (loreEntry) => {
    const openaiKey = keys.openai || keys.openai_shared;
    if (!openaiKey) {
      alert('OpenAI API key required for image generation.');
      return;
    }

    setGeneratingImageFor(loreEntry.id);
    try {
      const imageUrl = await generateLoreImage(
        loreEntry,
        openaiKey,
        campaign?.gameSystem || 'daggerheart',
        campaign?.id
      );

      await updateLore(loreEntry.id, {
        ...loreEntry,
        coverImage: imageUrl
      });
    } catch (error) {
      console.error('Error generating lore image:', error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      setGeneratingImageFor(null);
    }
  };

  const visibleLore = lore.filter(entry => {
    if (!isDM && entry.hidden) return false;
    // Check both 'type' and 'category' for backwards compatibility
    const entryType = entry.type || entry.category;
    if (typeFilter !== 'all' && entryType !== typeFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (entry.title || '').toLowerCase().includes(search) ||
        (entry.content || '').toLowerCase().includes(search) ||
        (Array.isArray(entry.tags) && entry.tags.some(tag => tag?.toLowerCase().includes(search)))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-10 animate-in fade-in duration-1000">
      {/* Immersive View Header */}
      <div className="flex items-center justify-between gap-8 pb-8 border-b border-white/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h2 className="font-serif text-4xl font-black text-white/95 tracking-tight italic lowercase">
            World Archive
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <BookOpen size={10} className="text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{lore.length} Fragments</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Preserving the echoes of time</p>
          </div>
        </div>

        {isDM && (
          <button
            className="group relative flex items-center gap-3 px-8 py-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.08] text-white transition-all duration-500 border border-white/5 hover:border-white/20 overflow-hidden shadow-2xl"
            onClick={handleAdd}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus size={20} className="relative z-10 text-indigo-400 group-hover:scale-125 transition-transform" />
            <span className="relative z-10 font-black text-xs uppercase tracking-[0.3em] font-sans">New Fragment</span>
          </button>
        )}

        {/* Subtle Background Glow for Header */}
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Modern Refined Filter Bar */}
      {lore.length > 0 && (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:max-w-md relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-white/60 transition-all duration-300" />
            <input
              type="text"
              placeholder="Search history, myths, or legends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-3xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-black/40 transition-all text-white placeholder:text-white/10 shadow-inner group-hover:border-white/10"
            />
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-x-auto no-scrollbar shadow-inner">
            <button
              onClick={() => setTypeFilter('all')}
              className={`
                px-5 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300
                ${typeFilter === 'all'
                  ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/20'
                  : 'text-white/20 hover:text-white/50 hover:bg-white/[0.01]'
                }
              `}
            >
              All Threads
            </button>
            {LORE_TYPES.filter(type => type).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`
                  px-5 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap
                  ${typeFilter === type
                    ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/20'
                    : 'text-white/20 hover:text-white/50 hover:bg-white/[0.01]'
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Immersive Lore Grid */}
      {visibleLore.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-32 rounded-[3rem] border border-white/5 bg-white/[0.01] backdrop-blur-sm group transition-all duration-700 hover:bg-white/[0.02] hover:border-white/10">
          <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 text-white/[0.03] group-hover:text-white/[0.07] group-hover:scale-110 transition-all duration-700">
            <BookOpen size={48} />
          </div>
          <h3 className="text-2xl font-serif font-black text-white/40 mb-3 italic lowercase">The pages are blank</h3>
          <p className="text-sm text-white/20 font-medium mb-10 tracking-wide">No tales of this nature have been chronicled in the Great Archive yet.</p>
          {isDM && lore.length === 0 && (
            <button
              className="px-10 py-4 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95"
              onClick={handleAdd}
            >
              Begin Chronicling
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-20 items-start">
          {visibleLore.map(entry => (
            <LoreCard
              key={entry.id}
              lore={entry}
              onEdit={() => handleEdit(entry)}
              onDelete={() => deleteLore(entry.id)}
              onGenerateImage={isDM ? () => handleGenerateImage(entry) : null}
              generatingImage={generatingImageFor === entry.id}
              isDM={isDM}
              campaign={campaign}
            />
          ))}
        </div>
      )}

      {/* Themed Modal wrapper */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLore(null);
        }}
        title={editingLore ? 'Refine Fragment' : 'Chronicling Fragment'}
        size="large"
      >
        <LoreForm
          lore={editingLore}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingLore(null);
          }}
          isDM={isDM}
          campaign={campaign}
          entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
        />
      </Modal>
    </div>
  );
}
