import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import LoreCard from './LoreCard';
import LoreForm from './LoreForm';
import Modal from '../Modal';
import { LORE_TYPES } from '../../data/daggerheart';
import './LoreView.css';

export default function LoreView({ lore, addLore, updateLore, deleteLore, isDM, campaign }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLore, setEditingLore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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
    <div className="lore-view">
      <div className="view-header">
        <div>
          <h2>Lore & World Building</h2>
          <p className="view-subtitle">{lore.length} lore entr{lore.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        {isDM && (
          <button className={`btn btn-primary ${isDM ? 'dm-mode' : ''}`} onClick={handleAdd}>
            <Plus size={20} />
            Add Lore
          </button>
        )}
      </div>

      {lore.length > 0 && (
        <div className="lore-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search lore..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="type-filter">
            <Filter size={18} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {LORE_TYPES.filter(type => type).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {visibleLore.length === 0 ? (
        <div className="empty-state">
          <p>{lore.length === 0 ? 'No lore entries yet' : 'No matching lore found'}</p>
          {isDM && lore.length === 0 && (
            <button className={`btn btn-primary ${isDM ? 'dm-mode' : ''}`} onClick={handleAdd}>
              <Plus size={20} />
              Create First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="lore-grid">
          {visibleLore.map(entry => (
            <LoreCard
              key={entry.id}
              lore={entry}
              onEdit={() => handleEdit(entry)}
              onDelete={() => deleteLore(entry.id)}
              isDM={isDM}
              campaign={campaign}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLore(null);
        }}
        title={editingLore ? 'Edit Lore Entry' : 'New Lore Entry'}
        size="medium"
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
        />
      </Modal>
    </div>
  );
}
