import { useMemo, useState } from 'react';
import { UserCog, Check, ChevronDown } from 'lucide-react';
import { getCharacterOwnerId } from '../../utils/characterOwnership';

// GM-only control for reassigning a character sheet to a specific campaign
// member. Writes the chosen uid to character.playerId; selecting "Default
// (creator)" clears playerId so the character falls back to whoever
// originally created it (character.createdBy).
//
// Renders nothing for non-DMs and nothing if the campaign has no member map.
export default function AssignPlayerControl({ character, campaign, updateCharacter, isDM }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const memberOptions = useMemo(() => {
    const members = campaign?.members || {};
    return Object.entries(members).map(([uid, m]) => ({
      uid,
      name: m?.displayName || m?.email || uid.slice(0, 8),
      role: m?.role || 'player',
    }));
  }, [campaign?.members]);

  if (!isDM || !character || memberOptions.length === 0) return null;

  const ownerId = getCharacterOwnerId(character);
  const hasExplicit = !!character.playerId;
  const ownerName = memberOptions.find((m) => m.uid === ownerId)?.name
    || (ownerId ? `${ownerId.slice(0, 6)}…` : 'Unassigned');

  const setAssignment = async (uid) => {
    if (busy) return;
    setBusy(true);
    try {
      // Pass null to clear, otherwise write the new uid.
      await updateCharacter(character.id, { playerId: uid || null });
      setOpen(false);
    } catch (err) {
      console.error('[AssignPlayerControl] failed:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block" style={{ fontFamily: 'var(--font-body)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all"
        style={{
          background: hasExplicit ? 'var(--primary-soft)' : 'var(--surface-hi)',
          color: hasExplicit ? 'var(--primary)' : 'var(--text-muted)',
          border: `1px solid ${hasExplicit ? 'var(--primary)' : 'var(--line)'}`,
          letterSpacing: '0.16em',
        }}
        title="Assign this character sheet to a campaign member"
      >
        <UserCog size={11} />
        <span>Assigned: {ownerName}</span>
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          {/* Click-out backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 mt-1 z-50 min-w-[220px] rounded-lg overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line-strong)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="px-3 py-2 text-[10px] font-bold uppercase"
              style={{
                color: 'var(--text-muted)',
                letterSpacing: '0.16em',
                borderBottom: '1px solid var(--line)',
              }}
            >
              Assign sheet to
            </div>
            <button
              type="button"
              onClick={() => setAssignment(null)}
              disabled={busy}
              className="w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-all"
              style={{
                background: !hasExplicit ? 'var(--primary-soft)' : 'transparent',
                color: !hasExplicit ? 'var(--primary)' : 'var(--text)',
              }}
            >
              <span>Default (creator)</span>
              {!hasExplicit && <Check size={12} />}
            </button>
            <div style={{ borderTop: '1px solid var(--line)' }} />
            {memberOptions.map((m) => {
              const selected = character.playerId === m.uid;
              return (
                <button
                  key={m.uid}
                  type="button"
                  onClick={() => setAssignment(m.uid)}
                  disabled={busy}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-all"
                  style={{
                    background: selected ? 'var(--primary-soft)' : 'transparent',
                    color: selected ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  <span className="flex flex-col">
                    <span>{m.name}</span>
                    <span
                      className="text-[9px] uppercase"
                      style={{ color: 'var(--text-dim)', letterSpacing: '0.14em' }}
                    >
                      {m.role}
                    </span>
                  </span>
                  {selected && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
