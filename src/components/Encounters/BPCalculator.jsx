import { Users, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Battle Points Calculator
 * Formula: BP Budget = (3 × number of PCs) + 2
 * Costs: Minion/Horde = 1 BP, Standard = 2 BP, Solo = 5 BP
 */

export const BP_COSTS = {
  minion: 1,
  horde: 1,
  standard: 2,
  bruiser: 2,
  skulk: 2,
  leader: 3,
  solo: 5
};

export function calculateBPBudget(partySize) {
  return (3 * partySize) + 2;
}

export function calculateUsedBP(adversarySlots, adversaries) {
  let total = 0;

  const slots = Array.isArray(adversarySlots) ? adversarySlots : [];

  for (const slot of slots) {
    const adversary = adversaries.find(a => a.id === slot.adversaryId);
    if (adversary) {
      const role = adversary.role?.toLowerCase() || 'standard';
      const cost = BP_COSTS[role] || 2;
      total += cost * (slot.quantity || 1);
    }
  }

  return total;
}

export default function BPCalculator({
  partySize,
  setPartySize,
  usedBP,
  characterCount
}) {
  const budget = calculateBPBudget(partySize);
  const remaining = budget - usedBP;
  const isOver = remaining < 0;
  const isBalanced = remaining >= 0 && remaining <= 2;

  // Calculate percentage for the meter
  const fillPercent = Math.min((usedBP / budget) * 100, 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h4 className="text-lg font-bold text-white">Battle Points</h4>
        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
          <Users size={16} className="text-white/40" />
          <label className="text-sm font-medium text-white/60">Party Size:</label>
          <input
            type="number"
            value={partySize}
            onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={10}
            className="w-12 bg-white/5 border border-white/10 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
          />
          {characterCount > 0 && partySize !== characterCount && (
            <button
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/60 rounded transition-colors"
              onClick={() => setPartySize(characterCount)}
              title={`Set to ${characterCount} (campaign characters)`}
            >
              Use {characterCount}
            </button>
          )}
        </div>
      </div>

      <div className="relative pt-6 pb-2">
        <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-500 ease-out ${isOver ? 'bg-red-500' : isBalanced ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        {/* Labels & Markers */}
        <div className="absolute top-0 left-0 text-xs font-mono text-white/40">0</div>

        {/* Budget Marker */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center justify-end"
          style={{ left: `${Math.min((budget / (budget * 1.5)) * 100, 100)}%` }} // Simplified, just clamping logic
        >
          {/* Note: logic for marker position is tricky without fixed width, simplified here to just end of bar if 100% */}
        </div>

        <div className="flex justify-between mt-2 text-sm font-medium">
          <span className={isOver ? 'text-red-400' : 'text-white/60'}>Used: {usedBP} BP</span>
          <span className="text-white/60">Budget: {budget} BP</span>
        </div>
      </div>

      <div className={`flex items-center justify-center p-3 rounded-lg border ${isOver
        ? 'bg-red-500/10 border-red-500/30 text-red-200'
        : isBalanced
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
        }`}>
        {isOver ? (
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span className="font-bold">{Math.abs(remaining)} over budget!</span>
          </div>
        ) : isBalanced ? (
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span className="font-bold">Perfectly Balanced</span>
          </div>
        ) : (
          <span className="font-bold">{remaining} BP remaining</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-white/40 pt-2 border-t border-white/5 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Minion/Horde: 1 BP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Standard: 2 BP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Solo: 5 BP
        </span>
      </div>
    </div>
  );
}
