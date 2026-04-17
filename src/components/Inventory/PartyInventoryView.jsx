import { useState } from 'react';
import { Backpack, Search, Plus, Package, Trash2, ArrowRight } from 'lucide-react';
import Modal from '../Modal';
import TransferModal from './TransferModal';
import './PartyInventoryView.css';

const RARITY_VAR = {
  common: 'var(--r-common)',
  uncommon: 'var(--r-uncommon)',
  rare: 'var(--r-rare)',
  epic: 'var(--r-epic)',
  legendary: 'var(--r-legendary)',
};

const TYPE_TO_RARITY = {
  weapon: 'rare',
  armor: 'uncommon',
  consumable: 'common',
  tool: 'common',
};

const getItemRarity = (item) => {
  const raw = (item?.systemData?.rarity || item?.rarity || '').toString().toLowerCase();
  if (RARITY_VAR[raw]) return raw;
  return TYPE_TO_RARITY[item?.type] || 'common';
};

export default function PartyInventoryView({
  items = [],
  partyInventory = [],
  addToPartyInventory,
  removeFromPartyInventory,
  transferToCharacter,
  characters = [],
  isDM,
  currentUserId,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transferItem, setTransferItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [addNotes, setAddNotes] = useState('');

  const getItemById = (itemId) => items.find(i => i.id === itemId);

  const filteredInventory = partyInventory.filter(entry => {
    const item = getItemById(entry.itemId);
    if (!item) return false;
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  const handleTransferConfirm = async (characterId, quantity) => {
    if (transferItem) {
      await transferToCharacter(transferItem.id, characterId, quantity);
      setTransferItem(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-transparent p-6 space-y-8 lr-fade-in"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Hero header */}
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="space-y-2">
          <span
            className="text-[11px] font-bold uppercase block"
            style={{ color: 'var(--accent)', letterSpacing: '0.28em' }}
          >
            Shared Stash
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
            The Vault
          </h2>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{ background: 'var(--surface-hi)', border: '1px solid var(--line-strong)' }}
            >
              <Package size={11} style={{ color: 'var(--text-muted)' }} />
              <span
                className="text-[10px] font-bold uppercase"
                style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
              >
                {totalItems} {totalItems === 1 ? 'Artifact' : 'Artifacts'}
              </span>
            </div>
            <span
              className="text-[10px] font-bold uppercase"
              style={{ color: 'var(--text-dim)', letterSpacing: '0.18em' }}
            >
              Shared party payload
            </span>
          </div>
        </div>

        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
          style={{
            background: 'var(--primary)',
            color: '#fff',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} />
          <span className="font-bold text-[11px] uppercase" style={{ letterSpacing: '0.18em' }}>
            Deposit Item
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="w-full max-w-xl relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-dim)' }}
        />
        <input
          type="text"
          placeholder="Search stashed gear and equipment…"
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

      {/* Slot grid */}
      {filteredInventory.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-16 md:p-24 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px dashed var(--line-strong)' }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: 'var(--surface-hi)',
              color: 'var(--text-dim)',
              border: '1px solid var(--line-strong)',
            }}
          >
            <Backpack size={40} />
          </div>
          <h3
            className="text-2xl mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-muted)' }}
          >
            Vault Empty
          </h3>
          <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-dim)' }}>
            The party stash is empty. Add items to share with the group.
          </p>
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
            onClick={() => setIsAddModalOpen(true)}
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
        >
          {filteredInventory.map(entry => {
            const item = getItemById(entry.itemId);
            if (!item) return null;
            const rarity = getItemRarity(item);
            const tone = RARITY_VAR[rarity];
            const isLegendary = rarity === 'legendary';

            return (
              <div
                key={entry.id}
                className="relative flex flex-col p-5 rounded-2xl transition-all"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid color-mix(in srgb, ${tone} 45%, var(--line-strong))`,
                  boxShadow: isLegendary
                    ? `0 0 0 1px color-mix(in srgb, ${tone} 30%, transparent), 0 8px 28px color-mix(in srgb, ${tone} 25%, transparent)`
                    : 'none',
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: `color-mix(in srgb, ${tone} 14%, var(--surface-hi))`,
                      border: `1px solid color-mix(in srgb, ${tone} 40%, var(--line-strong))`,
                      color: tone,
                    }}
                  >
                    <Package size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="truncate"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: 18,
                        color: 'var(--text)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md"
                        style={{
                          letterSpacing: '0.18em',
                          color: tone,
                          background: `color-mix(in srgb, ${tone} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${tone} 35%, transparent)`,
                        }}
                      >
                        {rarity}
                      </span>
                      {item.type && (
                        <span
                          className="text-[9px] font-bold uppercase"
                          style={{ letterSpacing: '0.18em', color: 'var(--text-muted)' }}
                        >
                          {item.type}
                        </span>
                      )}
                      <span
                        className="text-[10px] font-bold"
                        style={{
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        ×{entry.quantity || 1}
                      </span>
                    </div>
                  </div>
                </div>

                {entry.notes && (
                  <p
                    className="mt-4 p-3 rounded-lg text-[11px] leading-relaxed italic"
                    style={{
                      background: 'var(--surface-hi)',
                      border: '1px solid var(--line)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {entry.notes}
                  </p>
                )}

                <div
                  className="mt-5 flex items-center justify-between pt-4"
                  style={{ borderTop: '1px solid var(--line)' }}
                >
                  <span
                    className="text-[9px] font-bold uppercase"
                    style={{ color: 'var(--text-dim)', letterSpacing: '0.16em' }}
                  >
                    {entry.addedByName ? `Stashed by ${entry.addedByName}` : 'Party stash'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: 'var(--surface-hi)',
                        border: '1px solid var(--line-strong)',
                        color: 'var(--text-muted)',
                      }}
                      onClick={() => setTransferItem(entry)}
                    >
                      <ArrowRight size={12} style={{ color: 'var(--accent)' }} />
                      <span
                        className="text-[10px] font-bold uppercase"
                        style={{ letterSpacing: '0.16em' }}
                      >
                        Transfer
                      </span>
                    </button>
                    {isDM && (
                      <button
                        className="p-2 rounded-lg transition-all"
                        style={{
                          background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)',
                          color: 'var(--danger)',
                        }}
                        onClick={() => handleRemove(entry.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deposit modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Deposit Item"
        size="small"
      >
        <form onSubmit={handleAddToParty} className="space-y-5 pt-2">
          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold uppercase block"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}
            >
              Select Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--surface-hi)',
                border: '1px solid var(--line-strong)',
                color: 'var(--text)',
              }}
            >
              <option value="">Choose item…</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} [{item.type}]
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold uppercase block"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}
            >
              Quantity
            </label>
            <input
              type="number"
              value={addQuantity}
              onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
              min="1"
              max="999"
              className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--surface-hi)',
                border: '1px solid var(--line-strong)',
                color: 'var(--text)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold uppercase block"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}
            >
              Notes
            </label>
            <input
              type="text"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="Optional notes…"
              className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--surface-hi)',
                border: '1px solid var(--line-strong)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div
            className="flex gap-3 pt-4"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            <button
              type="button"
              className="flex-1 py-3 rounded-xl transition-all text-[11px] font-bold uppercase"
              style={{
                background: 'var(--surface-hi)',
                border: '1px solid var(--line-strong)',
                color: 'var(--text-muted)',
                letterSpacing: '0.18em',
              }}
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedItemId}
              className="flex-[2] py-3 rounded-xl transition-all text-[11px] font-bold uppercase disabled:opacity-50"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                letterSpacing: '0.18em',
              }}
            >
              Confirm Deposit
            </button>
          </div>
        </form>
      </Modal>

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
