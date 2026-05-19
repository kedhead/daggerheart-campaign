import { useState } from 'react';
import { Search, ExternalLink, User } from 'lucide-react';

const RELATIONSHIP_STYLES = {
  ally:    { label: 'Ally',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  enemy:   { label: 'Enemy',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  neutral: { label: 'Neutral', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

const FILTERS = ['all', 'ally', 'enemy', 'neutral'];

export default function NPCsPanelMini({ npcs = [], campaign, isDM, onViewAll }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = npcs.filter(npc => {
    const matchesSearch =
      (npc.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (npc.occupation || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || npc.relationship === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div className="gm-mini-search">
        <Search size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search NPCs…"
        />
      </div>

      {/* Filter bar */}
      <div className="gm-mini-toolbar">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`gm-mini-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {filtered.length} / {npcs.length}
        </span>
      </div>

      {/* List */}
      <div className="gm-mini-list" style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div className="gm-mini-empty">
            {search || filter !== 'all' ? 'No NPCs match your filters.' : 'No NPCs yet.'}
          </div>
        ) : (
          filtered.map(npc => {
            const rel = RELATIONSHIP_STYLES[npc.relationship];
            return (
              <div key={npc.id} className="gm-mini-item">
                {npc.avatarUrl ? (
                  <img
                    src={npc.avatarUrl}
                    alt={npc.name}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={14} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="gm-mini-item-name">{npc.name || 'Unnamed'}</div>
                  {npc.occupation && (
                    <div className="gm-mini-item-sub" style={{ fontSize: '0.72rem' }}>{npc.occupation}</div>
                  )}
                </div>
                {rel && (
                  <span
                    className="gm-mini-badge"
                    style={{ color: rel.color, background: rel.bg }}
                  >
                    {rel.label}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="gm-mini-footer">
        <button className="gm-mini-footer-btn" onClick={onViewAll}>
          <ExternalLink size={13} />
          Full NPC View
        </button>
      </div>
    </div>
  );
}
