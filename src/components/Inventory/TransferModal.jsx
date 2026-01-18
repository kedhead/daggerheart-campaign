import { useState } from 'react';
import { Package, ArrowRight, User } from 'lucide-react';
import Modal from '../Modal';
import './PartyInventoryView.css';

export default function TransferModal({
  isOpen,
  onClose,
  item,
  entry,
  characters = [],
  onTransfer,
  currentUserId
}) {
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(1);

  const maxQuantity = entry?.quantity || 1;

  const handleTransfer = () => {
    if (!selectedCharacterId) return;
    onTransfer(selectedCharacterId, transferQuantity);
    setSelectedCharacterId('');
    setTransferQuantity(1);
  };

  if (!item || !entry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Item"
      size="medium"
    >
      <div className="transfer-modal-content">
        {/* Item Preview */}
        <div className="transfer-item-preview">
          <div className="item-icon">
            <Package size={24} />
          </div>
          <div className="item-details">
            <h4>{item.name}</h4>
            <p>
              <span className={`item-type-badge ${item.type}`}>{item.type}</span>
              {' '} • Available: {entry.quantity || 1}
            </p>
          </div>
        </div>

        {/* Quantity */}
        {maxQuantity > 1 && (
          <div className="input-group">
            <label>Quantity to transfer</label>
            <input
              type="number"
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max={maxQuantity}
            />
          </div>
        )}

        {/* Character Selection */}
        <div className="input-group">
          <label>Give to character</label>
          {characters.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No characters in this campaign</p>
          ) : (
            <div className="character-select-list">
              {characters.map(char => (
                <button
                  key={char.id}
                  type="button"
                  className={`character-select-option ${selectedCharacterId === char.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCharacterId(char.id)}
                >
                  <div className="char-avatar">
                    {char.avatarUrl ? (
                      <img src={char.avatarUrl} alt={char.name} />
                    ) : (
                      char.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="char-info">
                    <h5>{char.name}</h5>
                    <p>{char.playerName || char.createdByName || 'Unknown player'}</p>
                  </div>
                  {selectedCharacterId === char.id && (
                    <ArrowRight size={20} style={{ color: 'var(--hope-color)' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleTransfer}
            disabled={!selectedCharacterId}
          >
            <ArrowRight size={16} />
            Transfer {transferQuantity > 1 ? `${transferQuantity} items` : 'Item'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
