import { Users, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Battle Points Calculator (SRD "Battle Guide")
 * Formula: BP Budget = (3 × number of PCs) + 2
 * Spend: 1 BP per group of Minions equal to party size · 1 BP per Social or
 * Support · 2 BP per Horde/Ranged/Skulk/Standard · 3 BP per Leader ·
 * 4 BP per Bruiser · 5 BP per Solo. (Boss is a homebrew role, costed at 8.)
 */

export const BP_COSTS = {
  minion: 1, // per group of minions equal to the party size — see getSlotBPCost
  social: 1,
  support: 1,
  horde: 2,
  ranged: 2,
  skulk: 2,
  standard: 2,
  leader: 3,
  bruiser: 4,
  solo: 5,
  boss: 8
};

export function calculateBPBudget(partySize) {
  return (3 * partySize) + 2;
}

/**
 * SRD Battle Guide budget adjustments.
 * Manual: easier (−1), harder (+2), damageBoost (−2 for +1d4/+2 adversary
 * damage), lowerTier (+1 per lower-tier adversary).
 * Automatic (derived from the current roster): 2+ Solos (−2), no
 * Bruisers/Hordes/Leaders/Solos (+1).
 */
export function calculateBPAdjustments({ adjustments = {}, soloCount = 0, hasMajorThreats = true, hasSlots = false }) {
  let total = 0;
  const notes = [];
  if (adjustments.easier) { total -= 1; notes.push('Easier/shorter fight −1'); }
  if (adjustments.harder) { total += 2; notes.push('Harder/longer fight +2'); }
  if (adjustments.damageBoost) { total -= 2; notes.push('All adversaries deal +1d4 (or +2) damage −2'); }
  if (soloCount >= 2) { total -= 2; notes.push('Using 2+ Solo adversaries −2'); }
  if (hasSlots && !hasMajorThreats) { total += 1; notes.push('No Bruisers, Hordes, Leaders, or Solos +1'); }
  const lowerTier = Number(adjustments.lowerTier) || 0;
  if (lowerTier > 0) { total += lowerTier; notes.push(`${lowerTier} lower-tier adversar${lowerTier > 1 ? 'ies' : 'y'} +${lowerTier}`); }
  return { total, notes };
}

/** BP cost for a quantity of one adversary. Minions are bought in groups of
 *  party size (e.g. 8 minions for a party of 4 = 2 BP). */
export function getSlotBPCost(role, quantity, partySize) {
  const r = role?.toLowerCase() || 'standard';
  const cost = BP_COSTS[r] || 2;
  const qty = quantity || 1;
  if (r === 'minion') {
    return Math.ceil(qty / Math.max(1, partySize || 4)) * cost;
  }
  return cost * qty;
}

export function calculateUsedBP(adversarySlots, adversaries, partySize = 4) {
  let total = 0;

  const slots = Array.isArray(adversarySlots) ? adversarySlots : [];

  for (const slot of slots) {
    const adversary = adversaries.find(a => a.id === slot.adversaryId);
    if (adversary) {
      total += getSlotBPCost(adversary.role, slot.quantity, partySize);
    }
  }

  return total;
}

export default function BPCalculator({
  partySize,
  setPartySize,
  usedBP,
  characterCount,
  adjustments = {},
  onAdjustmentsChange,
  soloCount = 0,
  hasMajorThreats = true,
  hasSlots = false
}) {
  const baseBudget = calculateBPBudget(partySize);
  const { total: adjTotal, notes: adjNotes } = calculateBPAdjustments({ adjustments, soloCount, hasMajorThreats, hasSlots });
  const budget = baseBudget + adjTotal;
  const remaining = budget - usedBP;

  const setAdj = (field, value) => onAdjustmentsChange && onAdjustmentsChange({ ...adjustments, [field]: value });
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
          <span className="text-white/60">
            Budget: {budget} BP{adjTotal !== 0 ? ` (${baseBudget} ${adjTotal > 0 ? '+' : '−'} ${Math.abs(adjTotal)})` : ''}
          </span>
        </div>
      </div>

      {/* Battle Guide adjustments */}
      {onAdjustmentsChange && (
        <div className="space-y-2 p-3 bg-black/20 rounded-lg border border-white/5">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Budget Adjustments</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/70">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={!!adjustments.easier} onChange={e => setAdj('easier', e.target.checked)} />
              Easier/shorter fight (−1)
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={!!adjustments.harder} onChange={e => setAdj('harder', e.target.checked)} />
              Harder/longer fight (+2)
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer" title="Add +1d4 (or a static +2) to all adversaries' damage rolls">
              <input type="checkbox" checked={!!adjustments.damageBoost} onChange={e => setAdj('damageBoost', e.target.checked)} />
              +1d4 adversary damage (−2)
            </label>
            <label className="flex items-center gap-1.5" title="+1 BP for each adversary from a lower tier than the party">
              Lower-tier adversaries (+1 each):
              <input
                type="number"
                min={0}
                max={20}
                value={adjustments.lowerTier || 0}
                onChange={e => setAdj('lowerTier', Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-center text-white focus:outline-none"
              />
            </label>
          </div>
          {(soloCount >= 2 || (hasSlots && !hasMajorThreats)) && (
            <div className="text-xs text-white/40">
              Auto-applied: {[
                soloCount >= 2 ? '2+ Solos (−2)' : null,
                hasSlots && !hasMajorThreats ? 'no Bruisers/Hordes/Leaders/Solos (+1)' : null
              ].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      )}

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
          Minion group ({partySize}): 1 BP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Social/Support: 1 BP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Horde/Ranged/Skulk/Standard: 2 BP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Leader: 3 BP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Bruiser: 4 BP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Solo: 5 BP
        </span>
      </div>
    </div>
  );
}
