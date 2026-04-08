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

  const getRarityStyles = (type) => {
    switch (type) {
      case 'weapon': return 'from-red-500/20 to-red-900/40 border-red-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]';
      case 'armor': return 'from-blue-500/20 to-blue-900/40 border-blue-500/30 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.1)]';
      case 'consumable': return 'from-emerald-500/20 to-emerald-900/40 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]';
      case 'tool': return 'from-amber-500/20 to-amber-900/40 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]';
      default: return 'from-slate-500/20 to-slate-900/40 border-white/10 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 animate-in fade-in duration-1000">
      {/* Vault Header */}
      <div className="flex items-center justify-between gap-8 pb-8 border-b border-white/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h2 className="font-serif text-4xl font-black text-white/95 tracking-tight italic lowercase">
            The Vault
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <Package size={10} className="text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{totalItems} Artifacts</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Shared party payload</p>
          </div>
        </div>

        <button
          className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-white transition-all duration-500 border border-white/5 hover:border-white/20 overflow-hidden shadow-2xl active:scale-95"
          onClick={() => setIsAddModalOpen(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={20} className="relative z-10 text-sky-400 group-hover:rotate-90 transition-transform duration-500" />
          <span className="relative z-10 font-black text-xs uppercase tracking-[0.3em]">Deposit Item</span>
        </button>
      </div>

      {/* Modern Control Tray */}
      <div className="w-full max-w-xl relative group">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-sky-400 transition-all duration-500" />
        <input
          type="text"
          placeholder="Search stashed gear and equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:bg-black/40 transition-all text-white placeholder:text-white/10 shadow-inner group-hover:border-white/10"
        />
      </div>

      {/* Inventory Slot Grid */}
      {filteredInventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-32 rounded-[3rem] border border-white/5 bg-white/[0.01] backdrop-blur-sm group hover:bg-white/[0.02] transition-all duration-700">
          <div className="w-24 h-24 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 text-white/[0.03] group-hover:text-white/[0.07] group-hover:scale-110 transition-all duration-700">
            <Backpack size={48} />
          </div>
          <h3 className="text-2xl font-serif font-black text-white/40 mb-3 italic lowercase">Vault Empty</h3>
          <p className="text-sm text-white/20 font-medium tracking-wide mb-10">The party stash is empty. Add items to share with the group.</p>
          <button
            className="px-10 py-4 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 border border-indigo-400/20"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredInventory.map(entry => {
            const item = getItemById(entry.itemId);
            if (!item) return null;
            const styleClass = getRarityStyles(item.type);

            return (
              <div key={entry.id} className="group relative flex flex-col p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:bg-white/[0.06] hover:border-white/10 hover:-translate-y-1">
                <div className="flex items-start gap-5">
                  <div className={`w-16 h-16 shrink-0 rounded-2xl border bg-gradient-to-br flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${styleClass}`}>
                    <Package size={24} className="group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-xl font-black text-white/90 leading-tight italic lowercase group-hover:text-white transition-colors truncate">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${styleClass}`}>
                        {item.type}
                      </span>
                      <span className="text-[10px] font-black text-white/20">x{entry.quantity || 1}</span>
                    </div>
                  </div>
                </div>

                {entry.notes && (
                  <p className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-medium text-white/40 italic leading-relaxed">
                    {entry.notes}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-[9px] font-bold text-white/10 uppercase tracking-tighter">Owned by {entry.addedByName || 'Party'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all active:scale-95"
                      onClick={() => handleTransfer(entry)}
                    >
                      <ArrowRight size={14} className="text-indigo-400" />
                      Transfer
                    </button>
                    {isDM && (
                      <button
                        className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500 border border-red-500/10 text-red-500 hover:text-white transition-all active:scale-95"
                        onClick={() => handleRemove(entry.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700" />
              </div>
            );
          })}
        </div>
      )}

      {/* Redesigned Modal wrapper */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Deposit Artifact"
        size="small"
      >
        <form onSubmit={handleAddToParty} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Select Item</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#0d1126]">Choose artifact...</option>
              {items.map(item => (
                <option key={item.id} value={item.id} className="bg-[#0d1126]">
                  {item.name} [{item.type}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Quantity</label>
              <input
                type="number"
                value={addQuantity}
                onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                min="1"
                max="999"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Notes</label>
            <input
              type="text"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-white/5">
            <button type="button" className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 font-black text-xs uppercase tracking-widest transition-all" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50" disabled={!selectedItemId}>
              Confirm Deposit
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal Integration */}
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
