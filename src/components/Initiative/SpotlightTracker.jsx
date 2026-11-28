import { useMemo } from 'react';
import { Sparkles, Skull, Undo2, RotateCcw, Crown, Clock } from 'lucide-react';
import { useSpotlight } from '../../hooks/useSpotlight';
import { usePlayerDisplay } from '../../hooks/usePlayerDisplay';
import { GM, REASONS, waitingOrder, spotlightCast } from '../../utils/spotlight';
import { useConfirm } from '../../contexts/ConfirmContext';

const timeAgo = (at) => {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

/**
 * Daggerheart's spotlight, in place of initiative. The spotlight moves
 * between the players and the GM: a player acts until a roll with Fear or a
 * failure hands it to the GM, or the GM spends a Fear to step in. Tap a
 * player to give them the spotlight; the tracker shows who has had it this
 * scene and who has waited longest, so nobody is left out.
 */
export default function SpotlightTracker({ campaign, characters = [], isDM, compact = false }) {
  const confirm = useConfirm();
  const { spotlight, loading, startScene, give, undo, renameScene } = useSpotlight(campaign?.id);
  const { fearCount = 0, addFear } = usePlayerDisplay(campaign?.id);

  const party = useMemo(() => characters.filter(c => c?.id && c.name && !c.deceased), [characters]);
  const cast = useMemo(() => spotlightCast(characters), [characters]);
  const s = spotlight || { counts: {}, lastAt: {}, log: [], passes: 0, current: null, scene: '' };
  const ids = party.map(c => c.id);
  const order = waitingOrder(s, ids);
  const nextUp = order.find(id => id !== s.current);
  const nameOf = (id) => (id === GM ? 'The GM' : party.find(c => c.id === id)?.name || characters.find(c => c.id === id)?.name || 'Someone');
  const neverHad = ids.filter(id => !s.counts?.[id]);
  const current = s.current;

  const newScene = async () => {
    if (s.passes > 0 && !(await confirm({ message: 'Start a new scene? The spotlight counts go back to zero.', confirmLabel: 'New scene' }))) return;
    await startScene('', cast);
  };

  const gmTakes = (reason) => give(GM, reason, cast);
  const spendFear = async () => {
    if (fearCount < 1) return;
    await addFear?.(-1);
    await gmTakes('spendFear');
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto p-6 text-lr-text-muted">Loading the spotlight…</div>;
  }

  return (
    <div className={compact ? 'p-2 space-y-3' : 'max-w-5xl mx-auto p-4 md:p-8 space-y-6'}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${compact ? '' : 'pb-4 border-b border-white/10'}`}>
        <div className={compact ? 'hidden' : 'space-y-1'}>
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">Daggerheart</span>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3"><Sparkles className="text-amber-300" size={28} /> Spotlight</h2>
          <p className="text-sm text-lr-text-muted max-w-xl">
            No initiative in Daggerheart: the spotlight moves. A player acts until a roll with Fear or a failure hands it to you,
            or you spend a Fear to step in. Tap whoever acts next.
          </p>
        </div>
        {isDM && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              key={s.scene || ''}
              defaultValue={s.scene || ''}
              maxLength={80}
              placeholder="Scene (optional)"
              aria-label="Scene name"
              onBlur={(e) => { if (e.target.value.trim() !== (s.scene || '')) renameScene(e.target.value.trim()); }}
              className="w-44 px-3 py-2 rounded-lg bg-black/25 border border-white/10 text-white text-sm"
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={undo} disabled={!s.log?.length} title="Take back the last pass">
              <Undo2 size={16} /> Undo
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={newScene}>
              <RotateCcw size={16} /> New scene
            </button>
          </div>
        )}
      </div>

      {/* Now */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-3 ${current === GM ? 'border-purple-400/50 bg-purple-500/10' : current ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10 bg-black/20'}`}>
        <span className="text-xs uppercase tracking-widest text-lr-text-dim font-bold">In the spotlight</span>
        <span className="text-2xl font-bold text-white">{current ? nameOf(current) : 'Nobody yet'}</span>
        {s.scene && <span className="text-sm text-lr-text-muted italic">· {s.scene}</span>}
        {nextUp && (
          <span className="ml-auto text-sm text-lr-text-muted inline-flex items-center gap-1.5">
            <Clock size={14} className="text-amber-300" /> Waiting longest: <b className="text-white">{nameOf(nextUp)}</b>
          </span>
        )}
      </div>

      {party.length === 0 && (
        <p className="text-sm text-lr-text-dim">No player characters yet: add them under Characters and they appear here.</p>
      )}

      <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}>
        {/* The party */}
        <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3'}>
          {party.map(c => {
            const count = s.counts?.[c.id] || 0;
            const on = current === c.id;
            const longest = nextUp === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!isDM}
                onClick={() => give(c.id, current === GM ? 'gm' : 'pass', cast)}
                aria-pressed={on}
                className={`text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${on
                  ? 'border-amber-400 bg-amber-400/15 shadow-lg shadow-amber-500/10'
                  : longest ? 'border-amber-400/40 bg-black/20 hover:bg-white/5' : 'border-white/10 bg-black/20 hover:bg-white/5'} disabled:cursor-default`}
              >
                {c.avatarUrl
                  ? <img src={c.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  : <span className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-white shrink-0">{c.name[0]}</span>}
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-white truncate">{c.name}</span>
                  <span className="block text-xs text-lr-text-muted">
                    {count === 0 ? <span className="text-amber-300">Hasn't had the spotlight yet</span> : `Spotlight ${count}× this scene`}
                  </span>
                </span>
                {on && <Sparkles size={18} className="text-amber-300 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* The GM */}
        <div className={`p-4 rounded-xl border space-y-3 ${current === GM ? 'border-purple-400 bg-purple-500/15' : 'border-white/10 bg-black/20'}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2"><Crown size={16} className="text-purple-300" /> The GM</span>
            <span className="text-sm text-purple-200 inline-flex items-center gap-1" title="Fear (shared with the GM Screen and the TV)">
              <Skull size={14} /> {fearCount} Fear
            </span>
          </div>
          {isDM && (
            <div className="grid grid-cols-1 gap-1.5">
              <button type="button" className="btn btn-secondary btn-sm justify-start" onClick={() => gmTakes('fear')}>A player rolled with Fear</button>
              <button type="button" className="btn btn-secondary btn-sm justify-start" onClick={() => gmTakes('fail')}>A player failed a roll</button>
              <button type="button" className="btn btn-secondary btn-sm justify-start disabled:opacity-40" onClick={spendFear} disabled={fearCount < 1}
                title={fearCount < 1 ? 'No Fear to spend' : 'Takes 1 Fear'}>
                Spend a Fear to step in
              </button>
            </div>
          )}
          <p className="text-[11px] text-lr-text-dim">When you're done, tap a player to hand the spotlight back.</p>
        </div>
      </div>

      {neverHad.length > 0 && s.passes > 0 && (
        <p className="text-sm text-amber-200">
          Not in the spotlight yet this scene: {neverHad.map(nameOf).join(', ')}.
        </p>
      )}

      {/* Log */}
      {(s.log || []).length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-xs uppercase tracking-widest text-lr-text-dim font-bold">This scene</h3>
          <ol className="space-y-1">
            {s.log.slice(0, 12).map((e, i) => (
              <li key={`${e.at}-${i}`} className="text-sm text-lr-text-muted flex flex-wrap gap-x-2">
                <span className="text-white font-medium">{nameOf(e.to)}</span>
                <span>· {e.to === GM ? REASONS[e.reason] || 'Took the spotlight' : e.prev === GM ? 'Got it back from the GM' : 'Took the spotlight'}</span>
                <span className="text-lr-text-dim text-xs">{timeAgo(e.at)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
