import { useRef } from 'react';
import { Crown, Sparkles, Skull, Heart, Swords } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export default function PhaseTransitionModal({ bossName, phase, allAdversaries = [], onConfirm, isDM }) {
  // No Escape: the phase change has to be acknowledged.
  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, !!phase);
  if (!phase) return null;

  const summons = (phase.summons || [])
    .map(s => ({ ...s, adversary: allAdversaries.find(a => a.id === s.adversaryId) }))
    .filter(s => s.adversary && s.quantity > 0);

  const hasAttackChange = phase.attackName || phase.attackDamage;
  const hasNewFeatures = phase.newFeatures && phase.newFeatures.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      {/* Outer glow ring */}
      <div className="relative w-full max-w-lg" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="phase-transition-title">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-500/40 to-red-600/30 animate-pulse pointer-events-none blur-sm" />

        <div className="relative bg-[var(--bg-secondary)] border border-amber-500/60 rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/40">
          {/* Header */}
          <div className="bg-gradient-to-b from-amber-500/25 to-transparent px-6 pt-8 pb-5 text-center space-y-2">
            <Crown className="w-10 h-10 text-amber-400 mx-auto" style={{ filter: 'drop-shadow(0 0 8px #f59e0b)' }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500/70">Phase Transition</p>
            <h2
              id="phase-transition-title"
              className="text-4xl font-extrabold text-white"
              style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 24px rgba(245,158,11,0.4)' }}
            >
              {phase.name}
            </h2>
            <p className="text-sm text-lr-text-dim">{bossName}</p>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto">

            {/* Flavor description */}
            {phase.description && (
              <div className="border-t border-amber-500/20 pt-4">
                <p className="text-sm text-lr-text-muted leading-relaxed italic text-center">
                  &ldquo;{phase.description}&rdquo;
                </p>
              </div>
            )}

            {/* New features */}
            {hasNewFeatures && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <Sparkles size={11} />
                  {phase.replaceFeatures ? 'New Abilities (replaces all previous)' : 'New Abilities Gained'}
                </h4>
                {phase.newFeatures.map((f, i) => (
                  <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-amber-200 text-sm">{f.name}</span>
                      <span className="text-[11px] uppercase text-amber-500/60 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {f.type}
                      </span>
                    </div>
                    {f.description && (
                      <p className="text-xs text-lr-text-muted leading-relaxed">{f.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Attack change */}
            {hasAttackChange && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-start gap-3">
                <Swords size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm text-lr-text-muted leading-relaxed">
                  Attack changes to:{' '}
                  {phase.attackName && (
                    <span className="text-red-300 font-bold">{phase.attackName} </span>
                  )}
                  {phase.attackDamage && (
                    <span className="text-amber-400 font-mono">{phase.attackDamage}</span>
                  )}
                </div>
              </div>
            )}

            {/* Summons */}
            {summons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                  <Skull size={11} />
                  Calling for Reinforcements!
                </h4>
                {summons.map((s, i) => (
                  <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-sm text-lr-text-muted font-medium">{s.adversary.name}</span>
                    <span className="text-sm text-red-300 font-bold">×{s.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* HP restoration */}
            {phase.healPercent > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center gap-3">
                <Heart size={16} className="text-emerald-400 shrink-0" />
                <span className="text-sm text-lr-text-muted">
                  Boss recovers{' '}
                  <span className="text-emerald-300 font-bold">{phase.healPercent}%</span>{' '}
                  of maximum HP
                </span>
              </div>
            )}
          </div>

          {/* Confirm (DM only) */}
          {isDM && (
            <div className="px-6 pb-6 pt-2 border-t border-amber-500/20">
              <button
                onClick={onConfirm}
                className="w-full py-3 font-bold rounded-xl text-sm uppercase tracking-widest transition-all"
                style={{
                  background: 'linear-gradient(135deg, #d97706, #b45309)',
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(245,158,11,0.3)',
                }}
              >
                Confirm Transition
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
