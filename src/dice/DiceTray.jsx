// The single 3D dice animation overlay for the entire app. Mounted once
// per surface (player view, battle map display, dashboard). Subscribes via
// useLiveRoll, animates each incoming canonical roll document with
// @3d-dice/dice-box, and shows its result.
//
// A die's face CANNOT be dictated. dice-box works out a result by ray-casting
// whichever face points up once the die stops (Dice.js getRollResult); a
// `value` in the notation is read only by the non-3D fallback path and is
// ignored for rendered dice. An earlier version of this comment claimed the
// opposite, which cost two attempts at "making the numbers match" before
// anyone checked the engine.
//
// The tumble is therefore an ANIMATION of a result the crypto RNG already
// decided (rng.js -> systems.js -> service.js), not the thing that produced
// it. The faces it settles on are meaningless. That is exactly why the dice
// wear the rune theme: rune faces carry no number, so they cannot contradict
// the canonical total on the banner. Do not switch to a numbered theme — the
// digits would be wrong, and only a screen that physically decides its own
// rolls could ever show honest ones.
//
// Rolls animate CONCURRENTLY. When several players roll at once their dice
// share the table, each in that player's colour, and their result cards sit
// side by side. This relies on dice-box's `add()` rather than `roll()`:
// `roll()` calls clear() first, so a second roll erased the first mid-tumble.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DiceBox from '@3d-dice/dice-box';
import { initAudio, playRollSound, playCritSound, playDoublesSound } from '../utils/diceAudio.js';
import SpecialResultOverlay from '../components/DiceRoller/SpecialResultOverlay.jsx';
import RollResultBanner from './RollResultBanner.jsx';
import { useLiveRoll } from './useLiveRoll.js';
import { diceSpec, MAX_CONCURRENT_ROLLS, THEME_RUNES } from './diceSpec.js';

const CONTAINER_ID = 'dice-tray-canvas';
const BANNER_DURATION = 3000;
const SPECIAL_OVERLAY_DURATION = 2500;
// If dice-box never resolves a roll, that roll would sit on the table
// forever holding the scrim up over the whole screen — and, now that rolls
// are concurrent, blocking everyone else's cleanup too. Force it through.
const ROLL_WATCHDOG_MS = 15000;

// The tray is display:none while idle, so its canvas measures 0x0 until the
// frame that reveals it has been laid out. dice-box reads clientWidth /
// clientHeight when it builds the world and whenever it re-measures, so every
// path that touches the canvas has to wait for that frame first — not just the
// first one. Getting this wrong sizes the physics world to nothing.
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

// Ask dice-box to re-measure its canvas.
//
// There is no public resize() on DiceBox — the earlier `box.resize?.()` here
// was optional-chained into a silent no-op and never did anything. What the
// library actually exposes is resizeWorld(), and even that only REGISTERS a
// rAF-debounced window-resize handler rather than resizing on the spot. So the
// one supported way to make it re-measure is to fire the event it listens for.
function requestDiceResize() {
  window.dispatchEvent(new Event('resize'));
}

// Personal devices animate ONLY the local player's rolls in 3D — everyone
// else's land as compact attributed toasts. Before this split, every phone
// ran full physics for every roll at the table: four simultaneous rolls
// meant four queued 3D simulations (+ banners) on every device, no names
// attached. Shared displays (the table TV) pass animateRemote to keep the
// full spectacle.
export default function DiceTray({ campaignId, currentUserId = null, animateRemote = false }) {
  const containerRef = useRef(null);
  const boxRef = useRef(null);
  const readyRef = useRef(false);
  // In-flight init, so simultaneous rolls share one dice-box rather than racing.
  const initRef = useRef(null);
  // Set when the viewport changed since the canvas was sized.
  const staleSizeRef = useRef(false);
  const groupTimerRef = useRef(null);
  const specialTimerRef = useRef(null);
  const watchdogsRef = useRef(new Map()); // rollId -> timeout
  // A special overlay is a full-screen takeover; two crits landing together
  // would fight over it, so the first one holds the slot.
  const specialBusyRef = useRef(false);

  // Every roll currently on the table: { roll, results, settled }.
  // `results` comes back from dice-box and is what remove() needs to tear
  // down just this roll's dice.
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
    const box = boxRef.current;

    if (box) {
      try {
        if (remaining.length === 0) {
          // Nothing left in the air — a full clear is cheaper and can't leak.
          box.clear();
        } else {
          for (const e of current) {
            if (e.settled && Array.isArray(e.results) && e.results.length) {
              box.remove(e.results);
            }
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
  const settleRoll = useCallback((rollId, results) => {
    const watchdog = watchdogsRef.current.get(rollId);
    if (watchdog) {
      clearTimeout(watchdog);
      watchdogsRef.current.delete(rollId);
    }
    // It may already have been dismissed while tumbling — don't re-add it.
    if (!entriesRef.current.some(e => e.roll.id === rollId)) return;
    commitEntries(entriesRef.current.map(e => (
      e.roll.id === rollId
        ? { ...e, results, settled: true }
        : e
    )));
    armGroupTimer();
  }, [armGroupTimer, commitEntries]);

  // Create dice-box on the FIRST ROLL, not on mount.
  //
  // It builds a WebGL canvas that fills .dice-tray — a position:fixed, inset:0,
  // z-index:9000 element. Initialising on mount left that surface composited
  // over the whole app for the entire session whether or not anyone rolled,
  // which is what made Android flicker: a large transparent GL layer over
  // scrolling content is far more fragile there than on iOS or desktop, and
  // worst on the big high-resolution panels of foldables, whose GPU surface is
  // also recreated on every fold/unfold.
  const ensureBox = useCallback(async () => {
    if (boxRef.current) return boxRef.current;
    if (initRef.current) return initRef.current;

    initRef.current = (async () => {
      const box = new DiceBox({
        container: `#${CONTAINER_ID}`,
        assetPath: '/assets/dice-box/',
        scale: 6,
        throwForce: 6,
        gravity: 3,
        theme: THEME_RUNES,
        themeColor: '#3b82f6',
        // Render on an OffscreenCanvas in a worker.
        //
        // world.onscreen.js drives the physics from the main thread — one
        // stepSimulation per requestAnimationFrame — so on that path frame
        // rate IS simulation speed: anything else competing for frames
        // doesn't merely make the animation choppy, it makes the dice tumble
        // in slow motion. world.offscreen.js contains no
        // requestAnimationFrame and no stepSimulation at all; the render loop
        // and the physics step both move into the worker, out of reach of
        // whatever the app is doing.
        //
        // Measured in headless Chromium (software rendering, 2d12): ~4.7s to
        // settle on the onscreen path, ~3.1s on this one, and the gap holds
        // with the main thread under load. A real phone GPU should do better
        // than that; the point is the direction, which was consistent.
        //
        // dice-box feature-detects this itself (OffscreenCanvas +
        // transferControlToOffscreen) and silently falls back to the onscreen
        // path where it isn't available, so nobody loses dice.
        offscreen: true,
        // Shadow maps are re-rendered every frame. They also make no visible
        // difference here — the tray has no lit surface for dice to cast onto,
        // just the app showing through — so this is cost with nothing bought.
        // Screenshots with and without were indistinguishable.
        enableShadows: false,
      });
      await box.init();
      boxRef.current = box;
      readyRef.current = true;
      return box;
    })();

    try {
      return await initRef.current;
    } catch (err) {
      console.error('[DiceTray] dice-box init failed:', err);
      initRef.current = null;
      return null;
    }
  }, []);

  // A viewport change (rotation, folding/unfolding a foldable, the URL bar
  // collapsing) while the tray is hidden is worse than a stale size: dice-box's
  // own resize handler runs anyway and measures the display:none canvas as
  // 0x0, leaving the physics world with no floor to land on. Flag it here and
  // re-measure on the next roll, once the tray is back on screen.
  useEffect(() => {
    const markStale = () => { staleSizeRef.current = true; };
    window.addEventListener('resize', markStale);
    window.addEventListener('orientationchange', markStale);
    return () => {
      window.removeEventListener('resize', markStale);
      window.removeEventListener('orientationchange', markStale);
    };
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

    commitEntries([...entriesRef.current, { roll, results: null, settled: false }]);
    setShow(true);

    initAudio();
    playRollSound();

    showSpecialFor(roll);

    watchdogsRef.current.set(roll.id, setTimeout(() => {
      console.warn('[DiceTray] roll never settled, retiring it:', roll.id);
      settleRoll(roll.id, null);
    }, ROLL_WATCHDOG_MS));

    // Wait for the frame that actually puts the tray on screen before anything
    // measures it. This has to happen on every roll, not only the first: the
    // tray goes back to display:none between rolls, so roll two would
    // otherwise size itself against a hidden, zero-width canvas.
    await waitForLayout(containerRef.current);

    let results = null;
    const box = await ensureBox();
    if (box) {
      try {
        if (staleSizeRef.current) {
          // Order matters: the synthetic event reaches our own markStale
          // listener synchronously, so the flag has to be cleared after the
          // dispatch or it would immediately set itself again.
          requestDiceResize();
          staleSizeRef.current = false;
          // dice-box debounces its resize by a frame; let it land before we
          // throw dice into a world that may still be the wrong size.
          await nextFrame();
        }
        // add(), not roll() — roll() clears the table first and would wipe
        // any dice still tumbling from another player.
        results = await box.add(diceSpec(roll));
      } catch (err) {
        console.warn('[DiceTray] dice-box.add failed:', err);
      }
    }

    settleRoll(roll.id, results);
  }, [pushToFeed, commitEntries, settleRoll, showSpecialFor, ensureBox]);

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
    if (boxRef.current) {
      try { boxRef.current.clear(); } catch (e) { /* noop */ }
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
  const crit = roll.flags?.isCrit;
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
