import { useState } from 'react';
import { Plus, Minus, Trash2, Search, Skull, X, Crown } from 'lucide-react';
import { BP_COSTS, getSlotBPCost } from './BPCalculator';

export default function AdversaryPicker({
  adversarySlots,
  setAdversarySlots,
  adversaries,
  partySize = 4
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

  const getRoleColorClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'minion':
      case 'horde':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'standard':
      case 'bruiser':
      case 'skulk':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'leader':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'solo':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'boss':
        return 'bg-amber-500/30 text-amber-300 border-amber-500/60';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <h4 className="text-lg font-bold text-white flex items-center gap-2">
          <Skull className="text-red-400" size={20} />
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
      <div className="space-y-2">
        {adversarySlots.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-secondary)] border border-white/5 rounded-xl border-dashed">
            <p className="text-white/60">No adversaries added yet</p>
          </div>
        ) : (
          adversarySlots.map(slot => {
            const adv = getAdversaryDetails(slot.adversaryId);
            if (!adv) return null;

            const isMinion = adv.role?.toLowerCase() === 'minion';
            const cost = BP_COSTS[adv.role?.toLowerCase()] || 2;
            const totalCost = getSlotBPCost(adv.role, slot.quantity, partySize);

            return (
              <div key={slot.adversaryId} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-white/5 rounded-lg hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${getRoleColorClass(adv.role).replace('text-', 'bg-').split(' ')[0].replace('/20', '')}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      {adv.isBoss && <Crown size={12} className="text-amber-400 shrink-0" />}
                      <span className="font-bold text-white">{adv.name}</span>
                      <span className="text-xs font-mono text-white/40 px-1.5 py-0.5 bg-white/5 rounded border border-white/5">T{adv.tier}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`uppercase tracking-wider font-semibold ${getRoleColorClass(adv.role).split(' ')[1]}`}>{adv.role}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60">
                        {totalCost} BP {isMinion ? `(1 per group of ${partySize})` : `(${cost} ea)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-black/20 rounded-lg border border-white/10">
                    <button
                      type="button"
                      className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors"
                      onClick={() => updateQuantity(slot.adversaryId, -1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-mono text-white font-bold">{slot.quantity}</span>
                    <button
                      type="button"
                      className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors"
                      onClick={() => updateQuantity(slot.adversaryId, 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    onClick={() => removeSlot(slot.adversaryId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adversary Picker Modal/Dropdown */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPicker(false)}>
          <div
            className="bg-[var(--bg-secondary)] border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            style={{ maxHeight: 'min(80vh, calc(100dvh - 2rem))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search and select adversaries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
                />
              </div>
              <button className="p-2 text-white/40 hover:text-white" onClick={() => setShowPicker(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {adversaries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No adversaries found.</p>
                </div>
              ) : filteredAdversaries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No matches for "{searchTerm}"</p>
                </div>
              ) : (
                Object.entries(groupedByTier)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([tier, advs]) => (
                    <div key={tier} className="space-y-2">
                      <div className="text-xs font-bold text-white/40 uppercase tracking-widest pl-2">Tier {tier}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {advs.map(adv => {
                          const advRole = adv.role?.toLowerCase();
                          const cost = BP_COSTS[advRole] || 2;
                          const costLabel = advRole === 'minion' ? `1 BP / group of ${partySize}` : `${cost} BP`;
                          const isSelected = adversarySlots.some(s => s.adversaryId === adv.id);
                          const quantity = adversarySlots.find(s => s.adversaryId === adv.id)?.quantity || 0;

                          return (
                            <button
                              key={adv.id}
                              type="button"
                              className={`
                                flex items-center justify-between p-3 rounded-lg border text-left transition-all
                                ${isSelected
                                  ? 'bg-[rgb(var(--color-primary))/10] border-[rgb(var(--color-primary))]'
                                  : 'bg-[var(--bg-primary)] border-white/5 hover:border-white/20 hover:bg-white/5'}
                              `}
                              onClick={() => addAdversary(adv)}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-1.5 h-8 rounded-full ${getRoleColorClass(adv.role).replace('text-', 'bg-').split(' ')[0].replace('/20', '')}`} />
                                <div>
                                  <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                                    {adv.isBoss && <Crown size={11} className="text-amber-400 shrink-0" />}
                                    {adv.name}
                                  </div>
                                  <div className="text-xs text-white/50">{adv.role} • {costLabel}</div>
                                </div>
                              </div>
                              {quantity > 0 && (
                                <div className="px-2 py-0.5 bg-[rgb(var(--color-primary))] text-white text-xs font-bold rounded">
                                  x{quantity}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="p-4 border-t border-white/5 flex justify-end">
              <button className="btn btn-primary" onClick={() => setShowPicker(false)}>
                Done Selecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
