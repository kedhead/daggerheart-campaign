import { PackagePlus, Check } from 'lucide-react';

// One-tap "add this catalog item to the party stash" action. Shown to every
// campaign member (unlike Edit/Delete, which stay DM-only) — players grabbing
// loot mid-session was the whole point.
export default function StashButton({ onDeposit, deposited }) {
  if (!onDeposit) return null;
  return (
    <button
      className="btn btn-secondary"
      onClick={(e) => { e.stopPropagation(); onDeposit(); }}
      disabled={deposited}
      title="Add one to the party stash"
    >
      {deposited ? <><Check size={16} /> Stashed</> : <><PackagePlus size={16} /> Stash</>}
    </button>
  );
}
