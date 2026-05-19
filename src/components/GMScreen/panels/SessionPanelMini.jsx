import { ExternalLink, ScrollText, Clock } from 'lucide-react';

export default function SessionPanelMini({ sessions = [], campaign, onViewAll }) {
  const sorted = [...sessions].sort((a, b) => (b.sessionNumber || 0) - (a.sessionNumber || 0));
  const latest = sorted[0];

  const formatDate = (ts) => {
    if (!ts) return null;
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!latest ? (
        <div className="gm-mini-empty" style={{ flex: 1 }}>No sessions logged yet.</div>
      ) : (
        <>
          {/* Latest session header */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <ScrollText size={13} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', fontWeight: 600 }}>
                Session {latest.sessionNumber || '?'}
              </span>
              {formatDate(latest.createdAt || latest.date) && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Clock size={11} />
                  {formatDate(latest.createdAt || latest.date)}
                </span>
              )}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {latest.title || latest.name || 'Untitled Session'}
            </div>
          </div>

          {/* Plan / notes summary */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem' }}>
            {latest.plan?.summary && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Summary</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {latest.plan.summary}
                </p>
              </div>
            )}

            {latest.plan?.hooks?.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Hooks</div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {latest.plan.hooks.slice(0, 4).map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}

            {latest.notes && !latest.plan && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {latest.notes.substring(0, 600)}{latest.notes.length > 600 ? '…' : ''}
              </p>
            )}

            {!latest.plan?.summary && !latest.notes && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                No notes for this session yet.
              </div>
            )}

            {/* Older sessions quick list */}
            {sorted.length > 1 && (
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Previous Sessions
                </div>
                {sorted.slice(1, 5).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, minWidth: 28 }}>#{s.sessionNumber || '?'}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title || s.name || 'Untitled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="gm-mini-footer">
        <button className="gm-mini-footer-btn" onClick={onViewAll}>
          <ExternalLink size={13} />
          Full Sessions View
        </button>
      </div>
    </div>
  );
}
