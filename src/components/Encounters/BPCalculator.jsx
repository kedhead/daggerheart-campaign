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

  for (const slot of adversarySlots) {
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
    <div className="bp-calculator">
      <div className="bp-header">
        <h4>Battle Points</h4>
        <div className="party-size-selector">
          <Users size={16} />
          <label>Party Size:</label>
          <input
            type="number"
            value={partySize}
            onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={10}
          />
          {characterCount > 0 && partySize !== characterCount && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPartySize(characterCount)}
              title={`Set to ${characterCount} (campaign characters)`}
            >
              Use {characterCount}
            </button>
          )}
        </div>
      </div>

      <div className="bp-meter">
        <div className="bp-meter-track">
          <div
            className={`bp-meter-fill ${isOver ? 'over' : isBalanced ? 'balanced' : ''}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <div className="bp-meter-labels">
          <span>0</span>
          <span className="bp-budget-mark" style={{ left: `${Math.min((budget / (budget * 1.5)) * 100, 100)}%` }}>
            Budget: {budget}
          </span>
        </div>
      </div>

      <div className={`bp-summary ${isOver ? 'over' : isBalanced ? 'balanced' : ''}`}>
        <div className="bp-used">
          <span className="bp-label">Used:</span>
          <span className="bp-value">{usedBP} BP</span>
        </div>
        <div className="bp-divider">/</div>
        <div className="bp-budget">
          <span className="bp-label">Budget:</span>
          <span className="bp-value">{budget} BP</span>
        </div>
        <div className="bp-status">
          {isOver ? (
            <>
              <AlertTriangle size={16} />
              <span className="text-danger">{Math.abs(remaining)} over!</span>
            </>
          ) : isBalanced ? (
            <>
              <CheckCircle size={16} />
              <span className="text-success">Balanced</span>
            </>
          ) : (
            <span className="text-muted">{remaining} remaining</span>
          )}
        </div>
      </div>

      <div className="bp-costs-legend">
        <span className="bp-cost-item">
          <span className="role-dot role-minion" />
          Minion/Horde: 1 BP
        </span>
        <span className="bp-cost-item">
          <span className="role-dot role-standard" />
          Standard: 2 BP
        </span>
        <span className="bp-cost-item">
          <span className="role-dot role-solo" />
          Solo: 5 BP
        </span>
      </div>
    </div>
  );
}
