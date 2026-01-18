import { useState } from 'react';
import { Package, Plus, Trash2, ArrowRight, Check, X } from 'lucide-react';
import './CharacterInventory.css';

export default function CharacterInventory({
  character,
  items = [],
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onToggleEquipped,
  onTransferToParty,
  canEdit = false
}) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);

  const inventory = character?.inventory || [];

  // Get item details by ID
  const getItemById = (itemId) => items.find(i => i.id === itemId);

  const handleAddItem = async () => {
    if (!selectedItemId) return;
    await onAddItem(character.id, selectedItemId, addQuantity);
    setSelectedItemId('');
    setAddQuantity(1);
    setIsAddingItem(false);
  };

  const handleRemoveItem = async (inventoryIndex) => {
    if (confirm('Remove this item from inventory?')) {
      await onRemoveItem(character.id, inventoryIndex);
    }
  };

  const handleToggleEquipped = async (inventoryIndex) => {
    await onToggleEquipped(character.id, inventoryIndex);
  };

  const handleTransferToParty = async (inventoryIndex) => {
    await onTransferToParty(character.id, inventoryIndex);
  };

  if (inventory.length === 0 && !canEdit) {
    return null; // Don't show empty inventory section for viewers
  }

  return (
    <div className="character-inventory">
      <div className="inventory-header">
        <h4>
          <Package size={16} />
          Inventory
        </h4>
        {canEdit && !isAddingItem && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setIsAddingItem(true)}
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {/* Add Item Inline Form */}
      {isAddingItem && (
        <div className="add-item-inline">
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="item-select"
          >
            <option value="">Select item...</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.type})
              </option>
            ))}
          </select>
          <input
            type="number"
            value={addQuantity}
            onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
            min="1"
            max="99"
            className="quantity-input"
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddItem}
            disabled={!selectedItemId}
          >
            <Check size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setIsAddingItem(false);
              setSelectedItemId('');
              setAddQuantity(1);
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Inventory Items */}
      {inventory.length === 0 ? (
        <p className="empty-inventory">No items in inventory</p>
      ) : (
        <div className="inventory-items">
          {inventory.map((entry, index) => {
            const item = getItemById(entry.itemId);
            if (!item) return null;

            return (
              <div
                key={`${entry.itemId}-${index}`}
                className={`inventory-item-row ${entry.equipped ? 'equipped' : ''}`}
              >
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{entry.quantity || 1}</span>
                  {entry.equipped && (
                    <span className="equipped-badge">Equipped</span>
                  )}
                </div>
                {canEdit && (
                  <div className="item-actions">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleToggleEquipped(index)}
                      title={entry.equipped ? 'Unequip' : 'Equip'}
                    >
                      {entry.equipped ? 'Unequip' : 'Equip'}
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleTransferToParty(index)}
                      title="Send to party stash"
                    >
                      <ArrowRight size={12} />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs btn-danger-text"
                      onClick={() => handleRemoveItem(index)}
                      title="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
