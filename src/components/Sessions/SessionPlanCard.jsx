import { useState } from 'react';
import {
  Clock, Users, MapPin, Sword, Brain, MessageCircle, Compass, Trash2,
  ChevronDown, ChevronUp, Map, Hammer, Sparkles
} from 'lucide-react';
import { calculateBPBudget } from '../Encounters/BPCalculator';

const TYPE_ICONS = {
  combat: Sword,
  puzzle: Brain,
  social: MessageCircle,
  exploration: Compass
};

const TYPE_COLORS = {
  combat: 'text-red-300 bg-red-500/10 border-red-500/30',
  puzzle: 'text-violet-300 bg-violet-500/10 border-violet-500/30',
  social: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  exploration: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
};

/**
 * Renders a SessionPlan returned by the GM Assistant.
 * Shows pacing, encounters with BP budget validation, new entities, and maps
 * with opt-in checkboxes. The user can refine, build a preview, or discard.
 */
export default function SessionPlanCard({
  plan,
  selectedMaps,
  setSelectedMaps,
  onBuildPreview,
  onRefine,
  onDiscard,
  isLoading
}) {
  const [expandedEncounter, setExpandedEncounter] = useState(null);

  const budget = calculateBPBudget(plan.partySize || 4);
  const totalMinutes = plan.encounters.reduce((sum, e) => sum + (e.estimatedMinutes || 0), 0);
  const targetMinutes = (plan.estimatedDurationHours || 3) * 60;

  const toggleMap = (label) => {
    if (selectedMaps.includes(label)) {
      setSelectedMaps(selectedMaps.filter(l => l !== label));
    } else {
      setSelectedMaps([...selectedMaps, label]);
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[rgb(var(--color-primary))]/30 rounded-xl p-5 space-y-5 shadow-lg">
      <div className="flex flex-col gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[rgb(var(--color-primary))]" />
          <span className="text-xs uppercase tracking-wider text-[rgb(var(--color-primary))] font-bold">Draft Session Plan</span>
        </div>
        <h3 className="text-2xl font-bold text-white font-cinzel">{plan.sessionTitle}</h3>
        <div className="flex flex-wrap gap-3 text-sm text-white/70">
          {plan.primaryLocation && (
            <span className="flex items-center gap-1.5"><MapPin size={14} /> {plan.primaryLocation}</span>
          )}
          <span className="flex items-center gap-1.5"><Users size={14} /> {plan.partySize} chars · Lvl {plan.partyLevel}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} /> ~{plan.estimatedDurationHours}h ({totalMinutes} min planned / {targetMinutes} target)</span>
          <span className="text-white/50">BP budget per encounter: {budget}</span>
        </div>
      </div>

      {plan.pacingOutline?.length > 0 && (
        <Section title="Pacing">
          <ul className="space-y-1 text-sm text-white/80">
            {plan.pacingOutline.map((line, i) => <li key={i}>· {line}</li>)}
          </ul>
        </Section>
      )}

      <Section title={`Encounters (${plan.encounters.length})`}>
        <div className="space-y-2">
          {plan.encounters.map((enc, i) => {
            const Icon = TYPE_ICONS[enc.type] || Sword;
            const colorCls = TYPE_COLORS[enc.type] || TYPE_COLORS.combat;
            const isExpanded = expandedEncounter === i;
            const overBudget = (enc.bpEstimate || 0) > budget;

            return (
              <div key={i} className="bg-black/20 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setExpandedEncounter(isExpanded ? null : i)}
                  className="w-full flex items-start gap-3 p-3 text-left"
                >
                  <span className={`p-1.5 rounded-md border ${colorCls}`}>
                    <Icon size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{i + 1}. {enc.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${colorCls}`}>{enc.type}</span>
                      <span className="text-xs text-white/50">~{enc.estimatedMinutes}m</span>
                      {enc.bpEstimate > 0 && (
                        <span className={`text-xs ${overBudget ? 'text-red-400' : 'text-white/50'}`}>
                          {enc.bpEstimate} BP{overBudget ? ` (over budget by ${enc.bpEstimate - budget})` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-0.5 line-clamp-2">{enc.summary}</p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-white/40 mt-1" /> : <ChevronDown size={16} className="text-white/40 mt-1" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 space-y-2 text-sm border-t border-white/5">
                    {enc.environment && (
                      <div className="text-white/60"><span className="text-white/40">Environment:</span> {enc.environment}</div>
                    )}
                    {enc.adversariesNeeded?.length > 0 && (
                      <div>
                        <div className="text-xs uppercase text-white/40 mb-1">Adversaries</div>
                        <ul className="space-y-1">
                          {enc.adversariesNeeded.map((a, ai) => (
                            <li key={ai} className="text-white/70">
                              {a.quantity}× <span className="text-white">{a.reuseExistingName || a.concept}</span>
                              <span className="text-white/40 ml-2">[T{a.tier} {a.role}{a.reuseExistingName ? ', existing' : ''}]</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {enc.puzzleSpec && (
                      <div className="space-y-1 text-white/70">
                        <div><span className="text-white/40">Premise:</span> {enc.puzzleSpec.premise}</div>
                        <div><span className="text-white/40">Mechanism:</span> {enc.puzzleSpec.mechanism}</div>
                        <div><span className="text-white/40">Solution:</span> {enc.puzzleSpec.solution}</div>
                        {enc.puzzleSpec.failureState && (
                          <div><span className="text-white/40">On failure:</span> {enc.puzzleSpec.failureState}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {plan.newNPCs?.length > 0 && (
        <Section title={`New NPCs (${plan.newNPCs.length})`}>
          <ul className="space-y-1 text-sm text-white/80">
            {plan.newNPCs.map((n, i) => (
              <li key={i}>· <span className="text-white">{n.name}</span> — {n.occupation}{n.blurb ? ` — ${n.blurb}` : ''}</li>
            ))}
          </ul>
        </Section>
      )}

      {plan.newLocations?.length > 0 && (
        <Section title={`New Locations (${plan.newLocations.length})`}>
          <ul className="space-y-1 text-sm text-white/80">
            {plan.newLocations.map((l, i) => (
              <li key={i}>· <span className="text-white">{l.name}</span> ({l.type}){l.blurb ? ` — ${l.blurb}` : ''}</li>
            ))}
          </ul>
        </Section>
      )}

      {plan.events?.length > 0 && (
        <Section title={`Events (${plan.events.length})`}>
          <ul className="space-y-1 text-sm text-white/80">
            {plan.events.map((ev, i) => (
              <li key={i}>· <span className="text-white">{ev.title}</span> — {ev.trigger} → {ev.outcome}</li>
            ))}
          </ul>
        </Section>
      )}

      {plan.mapsRequested?.length > 0 && (
        <Section title="Maps (opt-in — image generation costs API credits)">
          <div className="space-y-2">
            {plan.mapsRequested.map((m) => (
              <label key={m.label} className="flex items-start gap-2 text-sm text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMaps.includes(m.label)}
                  onChange={() => toggleMap(m.label)}
                  className="mt-1"
                />
                <span className="flex items-center gap-2">
                  <Map size={14} className="text-white/40" />
                  <span className="text-white">{m.label}</span>
                  <span className="text-white/40">({m.kind})</span>
                </span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {plan.gmNotes && (
        <Section title="GM Notes draft">
          <pre className="whitespace-pre-wrap text-sm text-white/80 bg-black/20 p-3 rounded-lg border border-white/5 max-h-48 overflow-y-auto">{plan.gmNotes}</pre>
        </Section>
      )}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
        <button
          type="button"
          className="btn btn-primary flex items-center gap-2"
          onClick={onBuildPreview}
          disabled={isLoading}
        >
          <Hammer size={16} />
          Build Preview
        </button>
        <button
          type="button"
          className="btn btn-secondary flex items-center gap-2"
          onClick={onRefine}
          disabled={isLoading}
        >
          Refine
        </button>
        <button
          type="button"
          className="ml-auto px-3 py-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
          onClick={onDiscard}
          disabled={isLoading}
        >
          <Trash2 size={14} /> Discard
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs uppercase tracking-wider text-white/40 font-semibold">{title}</h4>
      {children}
    </div>
  );
}
