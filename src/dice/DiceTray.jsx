// The single 3D dice animation overlay for the entire app. Mounted once
// per surface (player view, battle map display, dashboard). Subscribes via
// useLiveRoll, throws each incoming canonical roll document with our own dice
// engine (./engine), and shows its result.
//
// The numbers are decided before any die moves: the crypto RNG rolls them
// (rng.js -> systems.js -> service.js) and they are written once to
// Firestore. The engine then makes the dice LAND on those numbers. It works
// the whole throw out in advance, sees which face each die comes to rest on,
// and puts the rolled number on that face before playing the throw back.
// So the faces always agree with the banner, on every screen. (The engine
// this replaced read its result off whichever face happened to end up on top
// and could not be told what to land on, which is why its dice wore runes.)
//
// Rolls animate CONCURRENTLY. When several players roll at once their dice
// share the table, each in that player's colour and in its own lane, and
// their result cards sit side by side.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { initAudio, playRollSound, playCritSound, playDoublesSound } from '../utils/diceAudio.js';
import SpecialResultOverlay from '../components/DiceRoller/SpecialResultOverlay.jsx';
import RollResultBanner from './RollResultBanner.jsx';
import { useLiveRoll } from './useLiveRoll.js';
import { throwSpec, throwSeed, MAX_CONCURRENT_ROLLS } from './diceSpec.js';

const CONTAINER_ID = 'dice-tray-canvas';
const BANNER_DURATION = 3000;
const SPECIAL_OVERLAY_DURATION = 2500;
// If the engine never resolves a roll, that roll would sit on the table
// forever holding the scrim up over the whole screen — and, now that rolls
// are concurrent, blocking everyone else's cleanup too. Force it through.
const ROLL_WATCHDOG_MS = 15000;

// The tray is display:none while idle, so its canvas measures 0x0 until the
// frame that reveals it has been laid out. The engine sizes the table from
// the container's clientWidth / clientHeight on every throw, so every throw
// has to wait for that frame first — not just the first one.
const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

// Wait until the tray has real dimensions. One rAF is not enough on its own:
// rolls arrive from a Firestore listener, not a React event, so setShow(true)
// is committed on React's scheduler rather than synchronously, and a single
// frame can land before that commit. Polling the element settles it in one
// frame when the layout is already there and still gives React room when it
// isn't. Give up after a handful of frames rather than stalling the roll —
// worst case the dice are sized as they were before, which is what used to
// happen every time anyway.
async function waitForLayout(el, maxFrames = 10) {
  for (let i = 0; i < maxFrames; i += 1) {
    await nextFrame();
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return true;
  }
  return false;
}

// While dice are in the air, mark the document so the rest of the app can
// stand down (see dice.css: backdrop-filter is suppressed for the duration).
// Counted rather than a plain toggle: more than one tray can be mounted at
// once — player view, dashboard, the battle-map display — and the last one to
// finish should be the one that lifts it.
let rollingTrays = 0;
function setTrayRolling(rolling) {
  if (typeof document === 'undefined') return;
  rollingTrays = Math.max(0, rollingTrays + (rolling ? 1 : -1));
  document.body.classList.toggle('dice-rolling', rollingTrays > 0);
}

// Personal devices animate ONLY the local player's rolls in 3D — everyone
// else's land as compact attributed toasts. Before this split, every phone
// ran full physics for every roll at the table: four simultaneous rolls
// meant four queued 3D simulations (+ banners) on every device, no names
// attached. Shared displays (the table TV) pass animateRemote to keep the
// full spectacle.
export default function DiceTray({ campaignId, currentUserId = null, animateRemote = false }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  // In-flight init, so simultaneous rolls share one engine rather than racing.
  const initRef = useRef(null);
  const groupTimerRef = useRef(null);
  const specialTimerRef = useRef(null);
  const watchdogsRef = useRef(new Map()); // rollId -> timeout
  // A special overlay is a full-screen takeover; two crits landing together
  // would fight over it, so the first one holds the slot.
  const specialBusyRef = useRef(false);

  // Every roll currently on the table: { roll, settled }. The engine knows
  // each roll's dice by the roll id, which is what remove() takes.
  //
  // entriesRef is authoritative and updated synchronously; `entries` state
  // only mirrors it for rendering. Two rolls landing in the same tick both
  // need to see each other, which a state read alone would miss.
  const entriesRef = useRef([]);
  const [entries, setEntries] = useState([]);
  const commitEntries = useCallback((next) => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  const [special, setSpecial] = useState(null);
  const [show, setShow] = useState(false);
  const [feed, setFeed] = useState([]); // remote-roll toasts

  const pushToFeed = useCallback((roll) => {
    setFeed(prev => [...prev.slice(-3), roll]); // keep at most 4 visible
    setTimeout(() => {
      setFeed(prev => prev.filter(r => r.id !== roll.id));
    }, 6000);
  }, []);

  // Retire every roll that has finished tumbling, together. Rolls still in
  // the air are left alone and will re-arm the timer when they land.
  const clearSettled = useCallback(() => {
    const current = entriesRef.current;
    const remaining = current.filter(e => !e.settled);
    const engine = engineRef.current;

    if (engine) {
      try {
        if (remaining.length === 0) {
          // Nothing left in the air — a full clear is cheaper and can't leak.
          engine.clear();
        } else {
          for (const e of current) {
            if (e.settled) engine.remove(e.roll.id);
          }
        }
      } catch (err) {
        console.warn('[DiceTray] failed to clear dice:', err);
      }
    }

    commitEntries(remaining);
    if (remaining.length === 0) setShow(false);
  }, [commitEntries]);

  const armGroupTimer = useCallback(() => {
    if (groupTimerRef.current) clearTimeout(groupTimerRef.current);
    groupTimerRef.current = setTimeout(clearSettled, BANNER_DURATION);
  }, [clearSettled]);

  // Trigger special-result full-screen overlays based ONLY on canonical
  // flags from the doc. The dice authored the truth; we just display it.
  const showSpecialFor = useCallback((roll) => {
    if (specialBusyRef.current) return;
    let next = null;
    if (roll.flags?.isCrit) {
      playCritSound();
      next = { type: 'crit', value: 20 };
    } else if (roll.flags?.isCritFail) {
      next = { type: 'critfail', value: 1 };
    } else if (roll.flags?.isDoubles) {
      playDoublesSound();
      next = { type: 'doubles', value: roll.dice?.find(d => d.groupId === 'hope')?.value ?? roll.dice?.[0]?.value };
    }
    if (!next) return;
    specialBusyRef.current = true;
    setSpecial(next);
    if (specialTimerRef.current) clearTimeout(specialTimerRef.current);
    specialTimerRef.current = setTimeout(() => {
      setSpecial(null);
      specialBusyRef.current = false;
    }, SPECIAL_OVERLAY_DURATION);
  }, []);

  // Mark a roll settled whether or not the engine came back, so the group
  // timer can retire it.
  const settleRoll = useCallback((rollId) => {
    const watchdog = watchdogsRef.current.get(rollId);
    if (watchdog) {
      clearTimeout(watchdog);
      watchdogsRef.current.delete(rollId);
    }
    // It may already have been dismissed while tumbling — don't re-add it.
    if (!entriesRef.current.some(e => e.roll.id === rollId)) return;
    commitEntries(entriesRef.current.map(e => (
      e.roll.id === rollId
        ? { ...e, settled: true }
        : e
    )));
    armGroupTimer();
  }, [armGroupTimer, commitEntries]);

  // Create the engine on the FIRST ROLL, not on mount.
  //
  // It builds a WebGL canvas that fills .dice-tray — a position:fixed, inset:0,
  // z-index:9000 element. Initialising on mount left that surface composited
  // over the whole app for the entire session whether or not anyone rolled,
  // which is what made Android flicker: a large transparent GL layer over
  // scrolling content is far more fragile there than on iOS or desktop, and
  // worst on the big high-resolution panels of foldables. The import is lazy
  // too, so three.js and the physics only download when someone first rolls.
  const ensureEngine = useCallback(async () => {
    if (engineRef.current) return engineRef.current;
    if (initRef.current) return initRef.current;

    initRef.current = (async () => {
      const { createDiceEngine } = await import('./engine/index.js');
      const engine = await createDiceEngine(containerRef.current);
      engineRef.current = engine;
      return engine;
    })();

    try {
      return await initRef.current;
    } catch (err) {
      console.error('[DiceTray] dice engine init failed:', err);
      initRef.current = null;
      return null;
    }
  }, []);

  // Keep the canvas matched to the viewport (rotation, folding a foldable,
  // the URL bar collapsing). While the tray is hidden the engine ignores the
  // 0x0 measurement and keeps its last size; every throw re-measures anyway.
  useEffect(() => {
    const onResize = () => engineRef.current?.resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  useEffect(() => () => {
    engineRef.current?.dispose();
    engineRef.current = null;
  }, []);

  // Blur is the single most expensive thing the compositor does, and during a
  // roll it is pure waste: every backdrop-filter layer in the app is re-blurred
  // each frame behind a 55%-black scrim that hides the result anyway. Dropping
  // it for the seconds a roll is on screen gives those frames back to the dice.
  useEffect(() => {
    if (!show) return undefined;
    setTrayRolling(true);
    return () => setTrayRolling(false);
  }, [show]);

  const playRoll = useCallback(async (roll) => {
    // Already on the table (a duplicate emit) — ignore.
    if (entriesRef.current.some(e => e.roll.id === roll.id)) return;
    if (entriesRef.current.length >= MAX_CONCURRENT_ROLLS) {
      pushToFeed(roll);
      return;
    }

    commitEntries([...entriesRef.current, { roll, settled: false }]);
    setShow(true);

    initAudio();
    playRollSound();

    showSpecialFor(roll);

    watchdogsRef.current.set(roll.id, setTimeout(() => {
      console.warn('[DiceTray] roll never settled, retiring it:', roll.id);
      settleRoll(roll.id);
    }, ROLL_WATCHDOG_MS));

    // Wait for the frame that actually puts the tray on screen before anything
    // measures it. This has to happen on every roll, not only the first: the
    // tray goes back to display:none between rolls, so roll two would
    // otherwise size itself against a hidden, zero-width canvas.
    await waitForLayout(containerRef.current);

    const engine = await ensureEngine();
    if (engine) {
      try {
        await engine.throw(roll.id, throwSpec(roll), { seed: throwSeed(roll) });
      } catch (err) {
        console.warn('[DiceTray] dice throw failed:', err);
      }
    }

    settleRoll(roll.id);
  }, [pushToFeed, commitEntries, settleRoll, showSpecialFor, ensureEngine]);

  // Receive new canonical rolls from Firestore.
  useLiveRoll(campaignId, useCallback((roll) => {
    const isMine = currentUserId != null && roll.rollerId === currentUserId;
    // Someone else's private roll is not our business on any surface.
    if (roll.isPrivate && !isMine) return;
    if (isMine || animateRemote) {
      playRoll(roll);
    } else {
      pushToFeed(roll);
    }
  }, [playRoll, pushToFeed, currentUserId, animateRemote]));

  useEffect(() => {
    const watchdogs = watchdogsRef.current;
    return () => {
      if (groupTimerRef.current) clearTimeout(groupTimerRef.current);
      if (specialTimerRef.current) clearTimeout(specialTimerRef.current);
      for (const t of watchdogs.values()) clearTimeout(t);
      watchdogs.clear();
    };
  }, []);

  // Tapping the tray clears everything on the table at once.
  const dismiss = useCallback(() => {
    if (groupTimerRef.current) clearTimeout(groupTimerRef.current);
    for (const t of watchdogsRef.current.values()) clearTimeout(t);
    watchdogsRef.current.clear();
    if (engineRef.current) {
      try { engineRef.current.clear(); } catch (e) { /* noop */ }
    }
    commitEntries([]);
    setShow(false);
  }, [commitEntries]);

  const banners = entries.filter(e => e.settled);
  // Nothing on the table and nothing to read: the tray is display:none so its
  // full-viewport layer leaves the compositor entirely.
  const idle = !show && banners.length === 0;

  return createPortal(
    <>
      <div className={`dice-tray ${show ? 'is-visible' : ''} ${idle ? 'is-idle' : ''}`} onClick={dismiss}>
        <div id={CONTAINER_ID} ref={containerRef} className="dice-tray-canvas" />
        {banners.length > 0 && (
          <div className={`dice-banner-stack ${banners.length > 1 ? 'is-multi' : ''}`}>
            {banners.map(e => <RollResultBanner key={e.roll.id} roll={e.roll} />)}
          </div>
        )}
      </div>
      {feed.length > 0 && (
        <div className="dice-feed" aria-live="polite">
          {feed.map(roll => <RollToast key={roll.id} roll={roll} />)}
        </div>
      )}
      {special && (
        <SpecialResultOverlay
          type={special.type}
          value={special.value}
          onClose={() => { setSpecial(null); specialBusyRef.current = false; }}
        />
      )}
    </>,
    document.body
  );
}

// Compact attributed card for a remote player's roll — name, what they
// rolled, and the outcome, with the roller's color as the accent. No 3D.
function RollToast({ roll }) {
  const outcome = roll.system === 'daggerheart' ? roll.outcome : null;
  // isCrit is the d20 flag; a Daggerheart critical is doubles on the Duality
  // dice. Without this, everyone else's toast called a crit plain "Hope".
  const crit = roll.flags?.isCrit || (roll.system === 'daggerheart' && roll.flags?.isDoubles);
  const critFail = roll.flags?.isCritFail;
  return (
    <div className="dice-toast" style={{ borderLeftColor: roll.rollerColor || '#6366f1' }}>
      <div className="dice-toast-meta">
        <span className="dice-toast-name" style={{ color: roll.rollerColor || '#a5b4fc' }}>
          {roll.rollerName || 'Player'}
        </span>
        {roll.label && <span className="dice-toast-label">{roll.label}</span>}
      </div>
      <div className="dice-toast-result">
        <span className="dice-toast-total">{roll.total}</span>
        {crit && <span className="dice-toast-flag dice-toast-crit">CRIT!</span>}
        {critFail && <span className="dice-toast-flag dice-toast-critfail">FUMBLE</span>}
        {outcome === 'hope' && <span className="dice-toast-flag dice-toast-hope">✨ Hope</span>}
        {outcome === 'fear' && <span className="dice-toast-flag dice-toast-fear">💀 Fear</span>}
      </div>
    </div>
  );
}
