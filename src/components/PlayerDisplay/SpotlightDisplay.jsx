import { Sparkles, Crown } from 'lucide-react';
import { GM } from '../../utils/spotlight';

/**
 * The spotlight on the players' TV (Daggerheart): who has it now, and the
 * party, with those who haven't had it yet this scene marked.
 *
 * @param {object} props
 * @param {object} props.spotlight - the state saved by useSpotlight, with its `cast`
 */
export default function SpotlightDisplay({ spotlight }) {
  const cast = spotlight?.cast || {};
  const ids = Object.keys(cast);
  if (!spotlight || (!spotlight.current && !ids.length)) return null;
  const current = spotlight.current;
  const who = current === GM ? null : cast[current];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '10px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.55)', border: `1px solid ${current === GM ? 'rgba(168,85,247,0.6)' : 'rgba(251,191,36,0.5)'}`, color: '#fff' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        {current === GM ? <Crown size={22} color="#c084fc" /> : <Sparkles size={22} color="#fbbf24" />}
        <span style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>Spotlight</span>
        {who?.avatarUrl && <img src={who.avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fbbf24' }} />}
        <span style={{ fontSize: 26, fontWeight: 700 }}>{current === GM ? 'The GM' : who?.name || 'Nobody yet'}</span>
      </span>
      {ids.length > 0 && (
        <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
          {ids.filter(id => id !== current).map(id => {
            const waiting = !spotlight.counts?.[id];
            return (
              <span key={id} title={waiting ? 'Has not had the spotlight yet this scene' : undefined}
                style={{ padding: '3px 10px', borderRadius: 999, fontSize: 14, border: `1px solid ${waiting ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.2)'}`, color: waiting ? '#fcd34d' : 'rgba(255,255,255,0.75)' }}>
                {cast[id].name}{waiting ? ' ✦' : ''}
              </span>
            );
          })}
        </span>
      )}
    </div>
  );
}
