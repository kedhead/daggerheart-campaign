import { useState } from 'react';
import { Plus, Search, Package, Sword, Shield, Backpack, Wand2 } from 'lucide-react';
import ItemCard from './ItemCard';
import ItemForm from './ItemForm';
import Modal from '../Modal';
import './ItemsView.css';

export default function ItemsView({
  campaign,
  items = [],
  addItem,
  updateItem,
  deleteItem,
  isDM,
  npcs = [],
  locations = [],
  lore = [],
  sessions = [],
  timelineEvents = [],
  encounters = [],
  notes = []
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (itemData) => {
    if (editingItem) {
      await updateItem(editingItem.id, itemData);
    } else {
      await addItem(itemData);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(itemId);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    // Visibility filter
    if (!isDM && item.hidden) return false;

    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || item.type === filterType;

    return matchesSearch && matchesFilter;
  });

  // Count by type
  const counts = {
    all: items.filter(i => isDM || !i.hidden).length,
    weapon: items.filter(i => i.type === 'weapon' && (isDM || !i.hidden)).length,
    armor: items.filter(i => i.type === 'armor' && (isDM || !i.hidden)).length,
    equipment: items.filter(i => i.type === 'equipment' && (isDM || !i.hidden)).length
  };

  const gameSystem = campaign?.gameSystem || 'daggerheart';

  return (
    <div className="items-view">
      <div className="view-header">
        <div>
          <h2>Item Catalog</h2>
          <p className="view-subtitle">{counts.all} item{counts.all !== 1 ? 's' : ''} in your campaign</p>
        </div>
        {isDM && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={20} />
              Add Item
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="items-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <Package size={16} />
            All ({counts.all})
          </button>
          <button
            className={`filter-tab ${filterType === 'weapon' ? 'active' : ''}`}
            onClick={() => setFilterType('weapon')}
          >
            <Sword size={16} />
            Weapons ({counts.weapon})
          </button>
          <button
            className={`filter-tab ${filterType === 'armor' ? 'active' : ''}`}
            onClick={() => setFilterType('armor')}
          >
            <Shield size={16} />
            Armor ({counts.armor})
          </button>
          <button
            className={`filter-tab ${filterType === 'equipment' ? 'active' : ''}`}
            onClick={() => setFilterType('equipment')}
          >
            <Backpack size={16} />
            Equipment ({counts.equipment})
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterType !== 'all' ? (
            <p>No items match your search</p>
          ) : (
            <>
              <Package size={64} />
              <p>No items yet</p>
              {isDM && (
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Plus size={20} />
                  Add Your First Item
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              gameSystem={gameSystem}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
              isDM={isDM}
              campaign={campaign}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Item' : 'Create Item'}
        size="large"
      >
        <ItemForm
          item={editingItem}
          gameSystem={gameSystem}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          campaign={campaign}
          isDM={isDM}
        />
      </Modal>
    </div>
  );
}
