import { useState } from 'react';
import { Plus, Search, Filter, BookOpen, Wand2 } from 'lucide-react';
import LoreCard from './LoreCard';
import LoreForm from './LoreForm';
import Modal from '../Modal';
import QuickGeneratorModal from '../CampaignBuilder/QuickGeneratorModal';
import { LORE_TYPES } from '../../data/daggerheart';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateLoreImage } from '../../services/loreGenerator';
import './LoreView.css';

export default function LoreView({ lore, addLore, updateLore, deleteLore, isDM, campaign, campaignFrame, npcs = [], locations = [], sessions = [], timelineEvents = [], encounters = [], notes = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLore, setEditingLore] = useState(null);
  const [quickGenOpen, setQuickGenOpen] = useState(false);
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
    const openaiKey = keys?.openai || keys?.openai_shared || null;

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
    <div className="min-h-screen bg-transparent p-6 space-y-8 lr-fade-in" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Hero header */}
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 relative"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="space-y-2 relative z-10">
          <span
            className="text-[11px] font-bold uppercase block"
            style={{ color: 'var(--accent)', letterSpacing: '0.28em' }}
          >
            World Archive
          </span>
          <h2
            className="text-3xl md:text-4xl"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Chronicles & Legends
          </h2>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{
                background: 'var(--surface-hi)',
                border: '1px solid var(--line-strong)',
              }}
            >
              <BookOpen size={11} style={{ color: 'var(--text-muted)' }} />
              <span
                className="text-[10px] font-bold uppercase"
                style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
              >
                {lore.length} {lore.length === 1 ? 'Fragment' : 'Fragments'}
              </span>
            </div>
          </div>
        </div>

        {isDM && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
              onClick={() => setQuickGenOpen(true)}
            >
              <Wand2 size={14} />
              <span className="font-bold text-[11px] uppercase" style={{ letterSpacing: '0.16em' }}>Generate with AI</span>
            </button>
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
              <span className="font-bold text-[11px] uppercase" style={{ letterSpacing: '0.18em' }}>New Fragment</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      {lore.length > 0 && (
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:max-w-md relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search history, myths, or legends…"
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

          <div
            className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
            }}
          >
            <button
              onClick={() => setTypeFilter('all')}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all"
              style={{
                background: typeFilter === 'all' ? 'var(--primary-soft)' : 'transparent',
                color: typeFilter === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                letterSpacing: '0.14em',
              }}
            >
              All Threads
            </button>
            {LORE_TYPES.filter(type => type).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all"
                style={{
                  background: typeFilter === type ? 'var(--primary-soft)' : 'transparent',
                  color: typeFilter === type ? 'var(--primary)' : 'var(--text-muted)',
                  letterSpacing: '0.14em',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lore Grid */}
      {visibleLore.length === 0 ? (
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
            <BookOpen size={40} />
          </div>
          <h3
            className="text-2xl mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            The pages are blank
          </h3>
          <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-dim)' }}>
            No tales of this nature have been chronicled in the archive yet.
          </p>
          {isDM && lore.length === 0 && (
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

      <QuickGeneratorModal
        isOpen={quickGenOpen}
        onClose={() => setQuickGenOpen(false)}
        type="lore"
        campaign={campaign}
        campaignFrame={campaignFrame}
        existingContent={lore}
        onSave={async (loreData) => {
          await addLore(loreData);
          setQuickGenOpen(false);
        }}
      />
    </div>
  );
}
