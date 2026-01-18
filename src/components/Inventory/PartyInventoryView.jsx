import { useState } from 'react';
import { Backpack, Search, Plus, Package, Trash2, ArrowRight, Users } from 'lucide-react';
import Modal from '../Modal';
import TransferModal from './TransferModal';
import './PartyInventoryView.css';

export default function PartyInventoryView({
  campaign,
  items = [],
  partyInventory = [],
  addToPartyInventory,
  removeFromPartyInventory,
  updatePartyInventoryItem,
  transferToCharacter,
  characters = [],
  isDM,
  currentUserId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transferItem, setTransferItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [addNotes, setAddNotes] = useState('');

  // Get item details by ID
  const getItemById = (itemId) => items.find(i => i.id === itemId);

  // Filter party inventory by search
  const filteredInventory = partyInventory.filter(entry => {
    const item = getItemById(entry.itemId);
    if (!item) return false;
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate total items
  const totalItems = partyInventory.reduce((sum, entry) => sum + (entry.quantity || 1), 0);

  const handleAddToParty = async (e) => {
    e.preventDefault();
    if (!selectedItemId) return;

    await addToPartyInventory(selectedItemId, addQuantity, addNotes);
    setIsAddModalOpen(false);
    setSelectedItemId('');
    setAddQuantity(1);
    setAddNotes('');
  };

  const handleRemove = async (entryId) => {
    if (confirm('Remove this item from party stash?')) {
      await removeFromPartyInventory(entryId);
    }
  };

  const handleTransfer = (entry) => {
    setTransferItem(entry);
  };

  const handleTransferConfirm = async (characterId, quantity) => {
    if (transferItem) {
      await transferToCharacter(transferItem.id, characterId, quantity);
      setTransferItem(null);
    }
  };

  return (
    <div className="party-inventory-view">
      <div className="view-header">
        <div>
          <h2>Party Stash</h2>
          <p className="view-subtitle">
            {totalItems} item{totalItems !== 1 ? 's' : ''} in shared inventory
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Search */}
      <div className="inventory-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search party stash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory List */}
      {filteredInventory.length === 0 ? (
        <div className="empty-state card">
          {searchTerm ? (
            <p>No items match your search</p>
          ) : (
            <>
              <Backpack size={64} />
              <p>Party stash is empty</p>
              <p className="empty-hint">Add items to share with your party</p>
              <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={20} />
                Add First Item
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="inventory-list">
          {filteredInventory.map(entry => {
            const item = getItemById(entry.itemId);
            if (!item) return null;

            return (
              <div key={entry.id} className="inventory-item card">
                <div className="inventory-item-icon">
                  <Package size={24} />
                </div>
                <div className="inventory-item-info">
                  <h4>{item.name}</h4>
                  <div className="inventory-item-meta">
                    <span className={`item-type-badge ${item.type}`}>{item.type}</span>
                    <span className="quantity">x{entry.quantity || 1}</span>
                  </div>
                  {entry.notes && (
                    <p className="inventory-item-notes">{entry.notes}</p>
                  )}
                  <p className="added-by">Added by {entry.addedByName || 'Unknown'}</p>
                </div>
                <div className="inventory-item-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleTransfer(entry)}
                    title="Give to character"
                  >
                    <ArrowRight size={16} />
                    Give
                  </button>
                  {isDM && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemove(entry.id)}
                      title="Remove from stash"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add to Party Stash"
        size="small"
      >
        <form onSubmit={handleAddToParty} className="add-item-form">
          <div className="input-group">
            <label>Select Item *</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
            >
              <option value="">Choose an item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.type})
                </option>
              ))}
            </select>
            {items.length === 0 && (
              <small className="form-hint">No items created yet. Create items in the Item Catalog first.</small>
            )}
          </div>

          <div className="input-group">
            <label>Quantity</label>
            <input
              type="number"
              value={addQuantity}
              onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
              min="1"
              max="999"
            />
          </div>

          <div className="input-group">
            <label>Notes</label>
            <input
              type="text"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!selectedItemId}>
              <Plus size={16} />
              Add to Stash
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      {transferItem && (
        <TransferModal
          isOpen={!!transferItem}
          onClose={() => setTransferItem(null)}
          item={getItemById(transferItem.itemId)}
          entry={transferItem}
          characters={characters}
          onTransfer={handleTransferConfirm}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
