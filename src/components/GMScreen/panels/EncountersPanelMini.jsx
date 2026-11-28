import { useState } from 'react';
import { Search, Plus, Play, Swords, ExternalLink, Loader2 } from 'lucide-react';
import { useActiveEncounter } from '../../../hooks/useActiveEncounter';

const DIFFICULTY_STYLES = {
  easy:    { text: 'Easy',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  medium:  { text: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  hard:    { text: 'Hard',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  deadly:  { text: 'Deadly', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};

export default function EncountersPanelMini({
  encounters = [],
  addEncounter,
  updateEncounter,
  deleteEncounter,
  campaign,
  adversaries = [],
  environments = [],
  isDM,
  onViewAll,
}) {
  const [search, setSearch] = useState('');
  // Start a fight from here, and see one that is running.
  const { activeEncounter, startEncounter } = useActiveEncounter(campaign?.id);
  const [starting, setStarting] = useState(null);
  const run = async (enc) => {
    setStarting(enc.id);
    try {
      const environment = enc.environmentId ? environments.find(e => e.id === enc.environmentId) : null;
      await startEncounter(enc, adversaries, environment);
      onViewAll?.();
    } finally {
      setStarting(null);
    }
  };
  const live = activeEncounter?.participants ? activeEncounter : null;
  const standing = live ? live.participants.filter(p => !p.isDefeated).length : 0;
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const filtered = encounters.filter(e =>
    (e.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !addEncounter) return;
    await addEncounter({ name: newName.trim(), description: '', difficulty: 'medium' });
    setNewName('');
    setAdding(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div className="gm-mini-search">
        <Search size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search encounters…"
        />
      </div>

      {live && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.3)', fontSize: '0.8rem' }}>
          <Swords size={14} style={{ color: '#f87171', flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <b>{live.encounterName || 'Fight'}</b> · Round {live.round || 1} · {standing} of {live.participants.length} standing
          </span>
          <button type="button" className="gm-mini-footer-btn primary" style={{ flex: 'none', padding: '0.25rem 0.6rem' }} onClick={onViewAll}>
            <Play size={12} /> Resume
          </button>
        </div>
      )}

      {/* List */}
      <div className="gm-mini-list" style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div className="gm-mini-empty">
            {search ? 'No encounters match that search.' : 'No encounters yet.'}
          </div>
        ) : (
          filtered.map(enc => {
            const diff = DIFFICULTY_STYLES[enc.difficulty] || DIFFICULTY_STYLES.medium;
            return (
              <div key={enc.id} className="gm-mini-item">
                <Swords size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span className="gm-mini-item-name">{enc.name || 'Unnamed'}</span>
                {enc.difficulty && (
                  <span
                    className="gm-mini-badge"
                    style={{ color: diff.color, background: diff.bg }}
                  >
                    {diff.text}
                  </span>
                )}
                {enc.calculatedBP ? (
                  <span className="gm-mini-item-sub">{enc.usedBP || 0}/{enc.calculatedBP} BP</span>
                ) : null}
                {isDM && enc.adversarySlots?.length > 0 && (
                  <button
                    type="button"
                    className="gm-mini-footer-btn primary"
                    style={{ flex: 'none', padding: '0.2rem 0.5rem', marginLeft: 'auto' }}
                    onClick={() => run(enc)}
                    disabled={!!starting || !!live}
                    title={live ? 'A fight is already running: end it first' : `Start ${enc.name || 'this encounter'} in the live tracker`}
                  >
                    {starting === enc.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick-add form */}
      {adding && (
        <form onSubmit={handleQuickAdd} style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Encounter name…"
            style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem 0.6rem', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit' }}
          />
          <button type="submit" className="gm-mini-footer-btn primary" style={{ flex: 'none', padding: '0.3rem 0.6rem' }}>Add</button>
          <button type="button" className="gm-mini-footer-btn" style={{ flex: 'none', padding: '0.3rem 0.6rem' }} onClick={() => setAdding(false)}>✕</button>
        </form>
      )}

      {/* Footer */}
      <div className="gm-mini-footer">
        {isDM && addEncounter && (
          <button className="gm-mini-footer-btn primary" onClick={() => setAdding(v => !v)}>
            <Plus size={13} />
            Quick Add
          </button>
        )}
        <button className="gm-mini-footer-btn" onClick={onViewAll}>
          <ExternalLink size={13} />
          Full View
        </button>
      </div>
    </div>
  );
}
