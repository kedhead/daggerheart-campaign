import { Target, AlertTriangle, Quote, Dices, Hourglass, Users, Shuffle, Gift } from 'lucide-react';

// The playable part of a social or exploration scene (utils/sceneSpec.js):
// goal and stakes, the read-aloud opening, the rolls it invites with what
// each Daggerheart result means, a countdown, the people in it and a twist.

function Label({ icon: Icon, children }) {
  return (
    <h4 className="flex items-center gap-1.5 text-xs font-bold text-lr-text-dim uppercase tracking-wider">
      <Icon size={13} /> {children}
    </h4>
  );
}

export default function SceneSpecView({ spec }) {
  if (!spec) return null;
  return (
    <div className="space-y-4">
      {(spec.goal || spec.stakes) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {spec.goal && (
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <Label icon={Target}>Goal</Label>
              <p className="text-sm text-lr-text-muted mt-1 leading-relaxed">{spec.goal}</p>
            </div>
          )}
          {spec.stakes && (
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
              <Label icon={AlertTriangle}>Stakes</Label>
              <p className="text-sm text-lr-text-muted mt-1 leading-relaxed">{spec.stakes}</p>
            </div>
          )}
        </div>
      )}

      {spec.opening && (
        <div className="space-y-1">
          <Label icon={Quote}>Read aloud</Label>
          <p className="text-sm text-white/85 italic leading-relaxed border-l-2 border-white/15 pl-3">{spec.opening}</p>
        </div>
      )}

      {spec.rolls?.length > 0 && (
        <div className="space-y-2">
          <Label icon={Dices}>Rolls this scene invites</Label>
          {spec.rolls.map((r, i) => (
            <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {r.trait && <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/15 text-indigo-300">{r.trait}</span>}
                {r.difficulty && <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/10 text-white">Difficulty {r.difficulty}</span>}
              </div>
              <p className="text-sm text-white leading-snug">{r.action}</p>
              <div className="text-xs leading-relaxed space-y-1">
                {r.success && <p><span className="font-bold text-amber-300">With Hope:</span> <span className="text-lr-text-muted">{r.success}</span></p>}
                {r.successWithFear && <p><span className="font-bold text-purple-300">With Fear:</span> <span className="text-lr-text-muted">{r.successWithFear}</span></p>}
                {r.failure && <p><span className="font-bold text-red-300">Failure:</span> <span className="text-lr-text-muted">{r.failure}</span></p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {spec.countdown && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label icon={Hourglass}>Countdown: {spec.countdown.name}</Label>
            <span className="flex gap-1" aria-label={`Starts at ${spec.countdown.start}`}>
              {Array.from({ length: spec.countdown.start }, (_, i) => <span key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />)}
            </span>
          </div>
          {spec.countdown.advancesWhen && <p className="text-xs text-lr-text-muted"><span className="text-lr-text-dim">Ticks down when:</span> {spec.countdown.advancesWhen}</p>}
          {spec.countdown.atZero && <p className="text-xs text-lr-text-muted"><span className="text-lr-text-dim">At zero:</span> {spec.countdown.atZero}</p>}
        </div>
      )}

      {spec.npcs?.length > 0 && (
        <div className="space-y-1.5">
          <Label icon={Users}>Who's here</Label>
          {spec.npcs.map((n, i) => (
            <p key={i} className="text-sm text-lr-text-muted leading-relaxed">
              <span className="font-bold text-white">{n.name}</span>
              {n.wants && <><span className="text-lr-text-dim"> · Wants:</span> {n.wants}</>}
              {n.leverage && <><span className="text-lr-text-dim"> · Leverage:</span> {n.leverage}</>}
            </p>
          ))}
        </div>
      )}

      {spec.twist && (
        <div className="space-y-1">
          <Label icon={Shuffle}>Twist</Label>
          <p className="text-sm text-lr-text-muted leading-relaxed">{spec.twist}</p>
        </div>
      )}

      {spec.rewards && (
        <div className="space-y-1">
          <Label icon={Gift}>Rewards</Label>
          <p className="text-sm text-lr-text-muted leading-relaxed">{spec.rewards}</p>
        </div>
      )}
    </div>
  );
}

/** A puzzle's premise, mechanism and solution, which the card never showed. */
export function PuzzleSpecView({ spec }) {
  if (!spec) return null;
  const rows = [['Premise', spec.premise], ['How it works', spec.mechanism], ['Solution', spec.solution], ['On failure', spec.failureState]].filter(([, v]) => v);
  return (
    <div className="space-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <p key={k} className="text-lr-text-muted leading-relaxed"><span className="font-bold text-white">{k}:</span> {v}</p>
      ))}
    </div>
  );
}
