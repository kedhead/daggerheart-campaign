import { useState } from 'react';
import { Plus, Search, Package, Sword, Shield, Backpack, Wand2, Download, Check } from 'lucide-react';
import ItemCard from './ItemCard';
import ItemForm from './ItemForm';
import Modal from '../Modal';
import { ALL_DAGGERHEART_ITEMS, DAGGERHEART_WEAPONS, DAGGERHEART_ARMOR, DAGGERHEART_EQUIPMENT, DAGGERHEART_CONSUMABLES } from '../../data/daggerheartItems';
import { ALL_STARWARSD6_ITEMS, STARWARSD6_WEAPONS, STARWARSD6_ARMOR, STARWARSD6_EQUIPMENT } from '../../data/starwarsd6Items';
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCategory, setImportCategory] = useState('all');
  const [importTier, setImportTier] = useState('all');
  const [selectedImports, setSelectedImports] = useState(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [catalogTier, setCatalogTier] = useState('all');

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

  // Get items to show in import modal based on category and tier/rarity
  const getImportItems = () => {
    const system = campaign?.gameSystem || 'daggerheart';
    let items;
    
    if (system === 'starwarsd6') {
      switch (importCategory) {
        case 'weapons': items = STARWARSD6_WEAPONS; break;
        case 'armor': items = STARWARSD6_ARMOR; break;
        case 'equipment': items = STARWARSD6_EQUIPMENT; break;
        case 'consumables': items = []; break;
        default: items = ALL_STARWARSD6_ITEMS;
      }
      
      if (importTier !== 'all') {
        items = items.filter(i => (i.systemData?.availability || '1') === importTier);
      }
    } else {
      switch (importCategory) {
        case 'weapons': items = DAGGERHEART_WEAPONS; break;
        case 'armor': items = DAGGERHEART_ARMOR; break;
        case 'equipment': items = DAGGERHEART_EQUIPMENT; break;
        case 'consumables': items = DAGGERHEART_CONSUMABLES; break;
        default: items = ALL_DAGGERHEART_ITEMS;
      }

      // Apply tier/rarity filter
      if (importTier !== 'all') {
        const isEquipmentCategory = importCategory === 'equipment' || importCategory === 'consumables';
        if (isEquipmentCategory) {
          // Filter by rarity for equipment/consumables
          items = items.filter(i => (i.systemData?.rarity || 'common') === importTier);
        } else {
          // Filter by tier for weapons and armor
          const tierNum = parseInt(importTier);
          if (!isNaN(tierNum)) {
            items = items.filter(i => {
              if (i.type === 'weapon' || i.type === 'armor') {
                return (i.systemData?.tier || 1) === tierNum;
              }
              return true; // show all equipment/consumables when filtering by tier
            });
          }
        }
      }
    }

    return items;
  };

  const importItems = getImportItems();

  // Determine if current import category should show rarity or tier filter
  const showRarityFilter = importCategory === 'equipment' || importCategory === 'consumables';
  const existingItemNames = new Set(items.map(i => i.name.toLowerCase()));

  const toggleImportItem = (itemName) => {
    const newSelected = new Set(selectedImports);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
    } else {
      newSelected.add(itemName);
    }
    setSelectedImports(newSelected);
  };

  const selectAllImports = () => {
    const availableItems = importItems.filter(i => !existingItemNames.has(i.name.toLowerCase()));
    setSelectedImports(new Set(availableItems.map(i => i.name)));
  };

  const clearImportSelection = () => {
    setSelectedImports(new Set());
  };

  const handleImportItems = async () => {
    if (selectedImports.size === 0) return;

    setIsImporting(true);
    const itemsToImport = importItems.filter(i => selectedImports.has(i.name));

    for (const item of itemsToImport) {
      await addItem({
        ...item,
        hidden: false,
        isOfficial: true
      });
    }

    setIsImporting(false);
    setShowImportModal(false);
    setSelectedImports(new Set());
  };

  // Filter items
  const filteredItems = items.filter(item => {
    // Visibility filter
    if (!isDM && item.hidden) return false;

    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || item.type === filterType;

    // Tier filter for catalog (weapons and armor only)
    let matchesTier = true;
    if (catalogTier !== 'all' && (filterType === 'weapon' || filterType === 'armor')) {
      const itemTier = item.systemData?.tier || 1;
      matchesTier = itemTier === parseInt(catalogTier);
    }

    return matchesSearch && matchesFilter && matchesTier;
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
            {/* Show Import Official for supported campaigns */}
            {(!campaign?.gameSystem || campaign.gameSystem === 'daggerheart' || campaign.gameSystem === 'starwarsd6') && (
              <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                <Download size={20} />
                Import Official
              </button>
            )}
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
            onClick={() => { setFilterType('all'); setCatalogTier('all'); }}
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

          {(filterType === 'weapon' || filterType === 'armor') && (
            <select
              className="catalog-tier-select"
              value={catalogTier}
              onChange={(e) => setCatalogTier(e.target.value)}
            >
              <option value="all">All Tiers</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
              <option value="4">Tier 4</option>
            </select>
          )}
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

      {/* Import Official Items Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedImports(new Set());
        }}
        title={`Import Official ${gameSystem === 'starwarsd6' ? 'Star Wars D6' : 'Daggerheart'} Items`}
        size="large"
      >
        <div className="import-modal">
          <p className="import-description">
            Import official items into your campaign's item catalog.
          </p>

          <div className="import-category-tabs">
            {[
              { value: 'all', label: 'All Items' },
              { value: 'weapons', label: 'Weapons' },
              { value: 'armor', label: 'Armor' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'consumables', label: 'Consumables' }
            ].map(cat => (
              <button
                key={cat.value}
                className={`import-tab ${importCategory === cat.value ? 'active' : ''}`}
                onClick={() => { setImportCategory(cat.value); setImportTier('all'); }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="import-tier-filter">
            {gameSystem === 'starwarsd6' ? (
              <>
                {[
                  { value: 'all', label: 'All Availabilities' },
                  { value: '1', label: '1 - Readily Available' },
                  { value: '2', label: '2 - Common' },
                  { value: '3', label: '3 - Available' },
                  { value: '4', label: '4 - Scarce' },
                  { value: 'F', label: 'F - Black Market' },
                  { value: 'R', label: 'R - Restricted' },
                  { value: 'X', label: 'X - Rare' }
                ].map(r => (
                  <button
                    key={r.value}
                    className={`import-tier-tab ${importTier === r.value ? 'active' : ''}`}
                    onClick={() => setImportTier(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </>
            ) : showRarityFilter ? (
              <>
                {[
                  { value: 'all', label: 'All Rarities' },
                  { value: 'common', label: 'Common' },
                  { value: 'uncommon', label: 'Uncommon' },
                  { value: 'rare', label: 'Rare' },
                  { value: 'legendary', label: 'Legendary' }
                ].map(r => (
                  <button
                    key={r.value}
                    className={`import-tier-tab ${importTier === r.value ? 'active' : ''}`}
                    onClick={() => setImportTier(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </>
            ) : (
              <>
                {[
                  { value: 'all', label: 'All Tiers' },
                  { value: '1', label: 'Tier 1' },
                  { value: '2', label: 'Tier 2' },
                  { value: '3', label: 'Tier 3' },
                  { value: '4', label: 'Tier 4' }
                ].map(t => (
                  <button
                    key={t.value}
                    className={`import-tier-tab ${importTier === t.value ? 'active' : ''}`}
                    onClick={() => setImportTier(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="import-actions-bar">
            <span className="selection-count">
              {selectedImports.size} selected
            </span>
            <button className="btn btn-ghost btn-sm" onClick={selectAllImports}>
              Select All Available
            </button>
            <button className="btn btn-ghost btn-sm" onClick={clearImportSelection}>
              Clear Selection
            </button>
          </div>

          <div className="import-items-list">
            {importItems.map((item, index) => {
              const alreadyExists = existingItemNames.has(item.name.toLowerCase());
              const isSelected = selectedImports.has(item.name);

              return (
                <div
                  key={`${item.name}-${index}`}
                  className={`import-item ${alreadyExists ? 'exists' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => !alreadyExists && toggleImportItem(item.name)}
                >
                  <div className="import-item-checkbox">
                    {alreadyExists ? (
                      <Check size={16} className="exists-icon" />
                    ) : isSelected ? (
                      <Check size={16} />
                    ) : (
                      <div className="checkbox-empty" />
                    )}
                  </div>
                  <div className="import-item-info">
                    <div className="import-item-name">
                      {item.name}
                      <span className={`import-item-type ${item.type}`}>{item.type}</span>
                      {gameSystem !== 'starwarsd6' && (item.type === 'weapon' || item.type === 'armor') && (
                        <span className="import-item-tier">T{item.systemData?.tier || 1}</span>
                      )}
                      {gameSystem !== 'starwarsd6' && item.type === 'equipment' && item.systemData?.rarity && item.systemData.rarity !== 'common' && (
                        <span className={`import-item-rarity ${item.systemData.rarity}`}>{item.systemData.rarity}</span>
                      )}
                      {gameSystem === 'starwarsd6' && item.systemData?.availability && (
                         <span className="import-item-tier">Avail: {item.systemData.availability}</span>
                      )}
                    </div>
                    <div className="import-item-desc">
                      {item.description ? item.description.replace(/<[^>]+>/g, '') : ''}
                    </div>
                  </div>
                  {alreadyExists && (
                    <span className="already-exists-badge">Already in catalog</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="import-modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowImportModal(false);
                setSelectedImports(new Set());
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImportItems}
              disabled={selectedImports.size === 0 || isImporting}
            >
              <Download size={16} />
              {isImporting ? 'Importing...' : `Import ${selectedImports.size} Item${selectedImports.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
