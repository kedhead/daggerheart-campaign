import { useState } from 'react';
import { Package, Coins, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function InventoryTab({ character }) {
  const [showFullNotes, setShowFullNotes] = useState(false);

  const equippedItems = character.equippedItems || [];
  const inventoryText = typeof character.inventory === 'string' ? character.inventory : '';
  const gold = character.gold ?? 0;
  const notes = character.playerNotes || '';
  const experiences = character.experiences || [];

  return (
    <div>
      {/* Gold */}
      {gold > 0 && (
        <div className="lrp-gold-row">
          <Coins size={20} />
          <span>{gold} Gold</span>
        </div>
      )}

      {/* Equipped items */}
      {equippedItems.length > 0 && (
        <div className="lrp-inventory-section">
          <div className="lrp-section-heading">Equipped</div>
          {equippedItems.map((item, i) => (
            <div key={item.id || i} className="lrp-equipped-item">
              <Package size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.name}</span>
              {item.quantity > 1 && (
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>×{item.quantity}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inventory text */}
      {inventoryText && (
        <div className="lrp-inventory-section">
          <div className="lrp-section-heading">Inventory</div>
          <div className="lrp-inventory-text">{inventoryText}</div>
        </div>
      )}

      {/* Experiences */}
      {experiences.length > 0 && (
        <div className="lrp-inventory-section">
          <div className="lrp-section-heading">Experiences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {experiences.map((exp, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  background: 'var(--surface)',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  color: 'var(--text)',
                }}
              >
                {exp.name || exp}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player notes */}
      {notes && (
        <div className="lrp-inventory-section">
          <div className="lrp-section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Notes</span>
            <button
              onClick={() => setShowFullNotes(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
            >
              {showFullNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          <div
            className="lrp-notes-text"
            style={{
              maxHeight: showFullNotes ? 'none' : '120px',
              overflow: showFullNotes ? 'visible' : 'hidden',
              WebkitMaskImage: showFullNotes ? 'none' : 'linear-gradient(to bottom, black 60%, transparent)',
              maskImage: showFullNotes ? 'none' : 'linear-gradient(to bottom, black 60%, transparent)',
            }}
          >
            {notes}
          </div>
        </div>
      )}

      {/* Backstory */}
      {character.backstory && (
        <div className="lrp-inventory-section">
          <div className="lrp-section-heading">
            <FileText size={12} style={{ display: 'inline', marginRight: 6 }} />
            Backstory
          </div>
          <div className="lrp-notes-text" style={{ maxHeight: 160, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent)', maskImage: 'linear-gradient(to bottom, black 70%, transparent)' }}>
            {character.backstory}
          </div>
        </div>
      )}

      {equippedItems.length === 0 && !inventoryText && !notes && !gold && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
          No inventory recorded.
        </div>
      )}
    </div>
  );
}
