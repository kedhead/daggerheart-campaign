import { useMemo } from 'react';
import { appearancesFor } from '../../utils/campaignMemory';

const MAX_SESSIONS = 6;
// Stable defaults, so a card without chapters doesn't rescan every render.
const EMPTY = Object.freeze([]);

const sessionLabel = (s) => {
  const n = s.sessionNumber ?? s.number;
  const title = s.title || 'Untitled session';
  return n != null && n !== '' ? `Session ${n}: ${title}` : title;
};

const toRoman = (n) => {
  const num = Number(n);
  if (!Number.isInteger(num) || num <= 0 || num > 3999) return String(n ?? '');
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  let rest = num;
  for (const [v, r] of map) { while (rest >= v) { out += r; rest -= v; } }
  return out;
};

/**
 * Where an NPC or location shows up: the sessions whose recaps mention them,
 * the chapters that spotlight them, and — for a location — who lives there.
 * Everything here was already in the campaign; nothing showed it.
 *
 * Mounted only inside an expanded card, so the scan runs when someone looks.
 * What a player may see is decided in appearancesFor (tested), not here.
 *
 * @param {(entity: object) => void} onOpen - opens a registry-shaped entity
 * @param {(name: string) => object|undefined} getByName - registry lookup
 */
export default function AppearsIn({ entity, kind = 'npc', sessions = EMPTY, chapters = EMPTY, npcs = EMPTY, isDM = false, onOpen, getByName }) {
  const { sessions: sessionHits, chapters: chapterHits, npcsHere } = useMemo(
    () => appearancesFor(entity, { sessions, chapters, npcs, kind, isDM }),
    [entity, sessions, chapters, npcs, kind, isDM]
  );

  if (sessionHits.length === 0 && chapterHits.length === 0 && npcsHere.length === 0) return null;

  const shownSessions = sessionHits.slice(0, MAX_SESSIONS);
  const moreSessions = sessionHits.length - shownSessions.length;

  const linkClass = 'text-left text-lr-text-muted hover:text-white underline decoration-white/20 hover:decoration-white/60 underline-offset-2';

  return (
    <div className="space-y-4">
      {npcsHere.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-emerald-400/70 uppercase tracking-[0.3em] font-sans">Found Here</h4>
          <ul className="flex flex-wrap gap-2 m-0 p-0 list-none text-sm font-sans">
            {npcsHere.map(n => {
              const target = getByName?.(n.name);
              return (
                <li key={n.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/5">
                  {target && onOpen ? (
                    <button type="button" className={linkClass} onClick={(e) => { e.stopPropagation(); onOpen(target); }}>
                      {n.name}
                    </button>
                  ) : <span className="text-lr-text-muted">{n.name}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {sessionHits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-sky-400/70 uppercase tracking-[0.3em] font-sans">Appears In</h4>
          <ul className="space-y-1 m-0 p-0 list-none text-sm font-sans">
            {shownSessions.map(s => (
              <li key={s.id}>
                {onOpen ? (
                  <button
                    type="button"
                    className={linkClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen({ id: s.id, type: 'session', name: s.title, displayName: s.title, subtitle: 'Session', data: s });
                    }}
                  >
                    {sessionLabel(s)}
                  </button>
                ) : <span className="text-lr-text-muted">{sessionLabel(s)}</span>}
              </li>
            ))}
            {moreSessions > 0 && (
              <li className="text-lr-text-dim text-xs">and {moreSessions} more</li>
            )}
          </ul>
        </div>
      )}

      {chapterHits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-violet-400/70 uppercase tracking-[0.3em] font-sans">In the Chronicle</h4>
          <ul className="space-y-1.5 m-0 p-0 list-none text-sm font-sans text-lr-text-muted">
            {chapterHits.map(({ chapter, moment }) => (
              <li key={chapter.id}>
                <span className="font-semibold text-lr-text-muted">
                  Ch. {toRoman(chapter.chapterNumber)}{chapter.title ? `: ${chapter.title}` : ''}
                </span>
                {isDM && chapter.status !== 'published' && (
                  <span className="ml-2 text-[11px] uppercase tracking-wider text-amber-400/80">draft</span>
                )}
                {moment && <span className="italic text-lr-text-muted"> — {moment}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
