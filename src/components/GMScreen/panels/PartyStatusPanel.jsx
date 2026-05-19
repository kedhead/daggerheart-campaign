import { ExternalLink, Heart, Zap } from 'lucide-react';

function HPBar({ current, max }) {
  if (!max) return null;
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 60 ? '#4ade80' : pct > 30 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ width: 60, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );
}

export default function PartyStatusPanel({ characters = [], campaign, onViewAll }) {
  const isDaggerheart = campaign?.gameSystem === 'daggerheart' || !campaign?.gameSystem;

  const active = characters.filter(c => !c.isRetired && !c.isNPC);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDaggerheart ? '1fr 90px 70px' : '1fr 90px',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderBottom: '1px solid var(--border)',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-secondary)',
        flexShrink: 0,
      }}>
        <span>Character</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Heart size={10} /> HP</span>
        {isDaggerheart && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Zap size={10} /> Stress</span>}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {active.length === 0 ? (
          <div className="gm-mini-empty">No characters in this campaign yet.</div>
        ) : (
          active.map(char => {
            const hp = char.currentHp ?? char.maxHp ?? '—';
            const maxHp = char.maxHp;
            const stress = char.currentStress ?? 0;
            const maxStress = char.maxStress ?? 6;
            const level = char.level || char.tier;
            return (
              <div
                key={char.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isDaggerheart ? '1fr 90px 70px' : '1fr 90px',
                  gap: '0.5rem',
                  padding: '0.55rem 0.75rem',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}
              >
                {/* Name + class */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {char.name || 'Unnamed'}
                  </div>
                  {(char.class || level) && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {[char.class, level ? `Lvl ${level}` : null].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>

                {/* HP */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    {hp}{maxHp ? `/${maxHp}` : ''}
                  </span>
                  {maxHp && <HPBar current={hp} max={maxHp} />}
                </div>

                {/* Stress (Daggerheart only) */}
                {isDaggerheart && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: '0.8rem', color: stress >= maxStress ? '#f87171' : 'var(--text-primary)' }}>
                      {stress}/{maxStress}
                    </span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: maxStress }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 6, height: 6,
                            borderRadius: '50%',
                            background: i < stress ? (stress >= maxStress ? '#f87171' : '#fbbf24') : 'var(--bg-tertiary)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
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
          Full Characters View
        </button>
      </div>
    </div>
  );
}
