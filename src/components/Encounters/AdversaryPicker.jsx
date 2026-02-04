import { useState } from 'react';
import { Plus, Minus, Trash2, Search, Skull } from 'lucide-react';
import { BP_COSTS } from './BPCalculator';

export default function AdversaryPicker({
  adversarySlots,
  setAdversarySlots,
  adversaries
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Filter adversaries for the picker
  const filteredAdversaries = adversaries.filter(adv =>
    adv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adv.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by tier
  const groupedByTier = filteredAdversaries.reduce((acc, adv) => {
    const tier = adv.tier || 1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(adv);
    return acc;
  }, {});

  const addAdversary = (adversary) => {
    const existingSlot = adversarySlots.find(s => s.adversaryId === adversary.id);
    if (existingSlot) {
      // Increment quantity
      setAdversarySlots(adversarySlots.map(s =>
        s.adversaryId === adversary.id
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ));
    } else {
      // Add new slot
      setAdversarySlots([...adversarySlots, {
        adversaryId: adversary.id,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (adversaryId, delta) => {
    setAdversarySlots(adversarySlots.map(slot => {
      if (slot.adversaryId === adversaryId) {
        const newQty = Math.max(0, slot.quantity + delta);
        return newQty > 0 ? { ...slot, quantity: newQty } : null;
      }
      return slot;
    }).filter(Boolean));
  };

  const removeSlot = (adversaryId) => {
    setAdversarySlots(adversarySlots.filter(s => s.adversaryId !== adversaryId));
  };

  const getAdversaryDetails = (adversaryId) => {
    return adversaries.find(a => a.id === adversaryId);
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'minion':
      case 'horde':
        return '#22c55e';
      case 'standard':
      case 'bruiser':
      case 'skulk':
        return '#60a5fa';
      case 'leader':
        return '#f59e0b';
      case 'solo':
        return '#ef4444';
      default:
        return '#888';
    }
  };

  return (
    <div className="adversary-picker">
      <div className="picker-header">
        <h4>
          <Skull size={18} />
          Adversaries
        </h4>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowPicker(!showPicker)}
        >
          <Plus size={16} />
          Add Adversary
        </button>
      </div>

      {/* Selected Adversaries */}
      <div className="selected-adversaries">
        {adversarySlots.length === 0 ? (
          <p className="empty-text">No adversaries added yet</p>
        ) : (
          adversarySlots.map(slot => {
            const adv = getAdversaryDetails(slot.adversaryId);
            if (!adv) return null;

            const cost = BP_COSTS[adv.role?.toLowerCase()] || 2;
            const totalCost = cost * slot.quantity;

            return (
              <div key={slot.adversaryId} className="adversary-slot">
                <div className="slot-info">
                  <div className="slot-name-row">
                    <span
                      className="role-indicator"
                      style={{ background: getRoleColor(adv.role) }}
                    />
                    <span className="slot-name">{adv.name}</span>
                    <span className="slot-tier">T{adv.tier}</span>
                  </div>
                  <div className="slot-meta">
                    <span className="slot-role">{adv.role}</span>
                    <span className="slot-bp">{totalCost} BP</span>
                  </div>
                </div>
                <div className="slot-controls">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(slot.adversaryId, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-display">{slot.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(slot.adversaryId, 1)}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeSlot(slot.adversaryId)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adversary Picker Dropdown */}
      {showPicker && (
        <div className="picker-dropdown">
          <div className="picker-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search adversaries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {adversaries.length === 0 ? (
            <div className="picker-empty">
              <p>No adversaries in catalog</p>
              <small>Import or create adversaries first</small>
            </div>
          ) : filteredAdversaries.length === 0 ? (
            <div className="picker-empty">
              <p>No matches found</p>
            </div>
          ) : (
            <div className="picker-list">
              {Object.entries(groupedByTier)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([tier, advs]) => (
                  <div key={tier} className="tier-group">
                    <div className="tier-label">Tier {tier}</div>
                    {advs.map(adv => {
                      const cost = BP_COSTS[adv.role?.toLowerCase()] || 2;
                      const isSelected = adversarySlots.some(s => s.adversaryId === adv.id);

                      return (
                        <button
                          key={adv.id}
                          type="button"
                          className={`picker-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => addAdversary(adv)}
                        >
                          <span
                            className="role-indicator"
                            style={{ background: getRoleColor(adv.role) }}
                          />
                          <span className="item-name">{adv.name}</span>
                          <span className="item-role">{adv.role}</span>
                          <span className="item-bp">{cost} BP</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
            </div>
          )}

          <div className="picker-footer">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPicker(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
