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

// dice-box is imported dynamically, not statically. It carries ~2MB of
// renderer and physics, and the 2D path exists precisely for devices that
// can't run it — a static import would make those devices download the whole
// thing before falling back. See shouldUse3D() for how the choice is made.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { initAudio, playRollSound, playCritSound, playDoublesSound } from '../utils/diceAudio.js';
import SpecialResultOverlay from '../components/DiceRoller/SpecialResultOverlay.jsx';
import RollResultBanner from './RollResultBanner.jsx';
import Dice2DRoll from './Dice2D.jsx';
import { useLiveRoll } from './useLiveRoll.js';
import { shouldUse3D } from './webglSupport.js';
import { diceSpec, MAX_CONCURRENT_ROLLS, THEME_RUNES } from './diceSpec.js';

const CONTAINER_ID = 'dice-tray-canvas';
const BANNER_DURATION = 3000;
const SPECIAL_OVERLAY_DURATION = 2500;
// How long the 2D dice tumble before showing as settled.
const FLAT_ROLL_DURATION = 700;
// A WebView that reports WebGL but then hangs initialising the physics
// worker would otherwise leave the tray in 'pending' forever, silently
// swallowing rolls the way the pre-fallback version did on init failure.
const INIT_TIMEOUT_MS = 8000;
// If dice-box never resolves a roll, that roll would sit on the table
// forever holding the scrim up over the whole screen — and, now that rolls
// are concurrent, blocking everyone else's cleanup too. Force it through.
const ROLL_WATCHDOG_MS = 15000;

// Personal devices animate ONLY the local player's rolls in 3D — everyone
// else's land as compact attributed toasts. Before this split, every phone
// ran full physics for every roll at the table: four simultaneous rolls
// meant four queued 3D simulations (+ banners) on every device, no names
// attached. Shared displays (the table TV) pass animateRemote to keep the
// full spectacle.
export default function DiceTray({ campaignId, currentUserId = null, animateRemote = false, renderMode = 'auto' }) {
  const containerRef = useRef(null);
  const boxRef = useRef(null);
  const readyRef = useRef(false);
  // 'pending' until the engine choice resolves, then '3d' or '2d'.
  // modeRef is authoritative for playRoll (which can fire in the same tick as
  // the decision); `mode` state only drives rendering.
  const modeRef = useRef('pending');
  const [mode, setMode] = useState('pending');
  // Rolls that arrived before the engine choice resolved.
  const pendingRef = useRef([]);
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

  const playRoll = useCallback(async (roll) => {
    // Engine choice hasn't landed yet — hold the roll, don't drop it.
    if (modeRef.current === 'pending') {
      pendingRef.current.push(roll);
      return;
    }
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

    // Generic hook for a host shell. The Expo WebView listens for this to
    // fire haptics, so a roll is felt as well as heard. A plain DOM event
    // keeps the native concern out of here: in a browser nothing listens and
    // this costs one dispatch.
    try {
      window.dispatchEvent(new CustomEvent('lorelich:roll', {
        detail: { crit: !!roll.flags?.isCrit, critFail: !!roll.flags?.isCritFail },
      }));
    } catch (err) { /* CustomEvent unavailable — nothing depends on it */ }

    showSpecialFor(roll);

    watchdogsRef.current.set(roll.id, setTimeout(() => {
      console.warn('[DiceTray] roll never settled, retiring it:', roll.id);
      settleRoll(roll.id, null);
    }, ROLL_WATCHDOG_MS));

    // In 2D the dice are React-rendered, so Dice2DRoll reports its own
    // settle via onSettled and there's no engine call to await here.
    if (modeRef.current === '2d') return;

    let results = null;
    try {
      // add(), not roll() — roll() clears the table first and would wipe
      // any dice still tumbling from another player.
      results = await boxRef.current.add(diceSpec(roll));
    } catch (err) {
      console.warn('[DiceTray] dice-box.add failed:', err);
    }

    settleRoll(roll.id, results);
  }, [pushToFeed, commitEntries, settleRoll, showSpecialFor]);

  // Settle on an engine, then drain whatever queued up while deciding.
  //
  // Every exit from this effect MUST land on a concrete mode. The version
  // before the 2D fallback existed had one path that didn't — an init()
  // rejection left readyRef false forever, so the player's rolls queued
  // invisibly while the rest of the table saw them land. Hence the timeout
  // and the catch below both fall back rather than just logging.
  useEffect(() => {
    if (modeRef.current !== 'pending') return undefined;
    let cancelled = false;

    const commitMode = (next) => {
      if (cancelled || modeRef.current !== 'pending') return;
      modeRef.current = next;
      setMode(next);
      const queued = pendingRef.current;
      pendingRef.current = [];
      for (const roll of queued) playRoll(roll);
    };

    if (!shouldUse3D(renderMode)) {
      // Straight to 2D without importing dice-box at all — the whole point
      // of the dynamic import.
      commitMode('2d');
      return () => { cancelled = true; };
    }

    const timeout = setTimeout(() => {
      console.warn('[DiceTray] 3D init timed out, using 2D dice');
      commitMode('2d');
    }, INIT_TIMEOUT_MS);

    import('@3d-dice/dice-box')
      .then(({ default: DiceBox }) => {
        if (cancelled) return null;
        const box = new DiceBox({
          container: `#${CONTAINER_ID}`,
          assetPath: '/assets/dice-box/',
          scale: 6,
          throwForce: 6,
          gravity: 3,
          theme: THEME_RUNES,
          themeColor: '#3b82f6',
          offscreen: false,
        });
        return box.init().then(() => {
          clearTimeout(timeout);
          // A slow init can land AFTER the timeout already fell back. Adopting
          // the box then would leave boxRef pointing at a renderer whose
          // canvas host is no longer mounted, and clear()/remove() would be
          // called against it on every subsequent roll. Stay in 2D.
          if (cancelled || modeRef.current !== 'pending') return;
          boxRef.current = box;
          readyRef.current = true;
          commitMode('3d');
        });
      })
      .catch(err => {
        console.error('[DiceTray] 3D dice unavailable, using 2D dice:', err);
        clearTimeout(timeout);
        commitMode('2d');
      });

    return () => { cancelled = true; clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderMode]);

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
  const flat = mode === '2d';

  return createPortal(
    <>
      <div className={`dice-tray ${show ? 'is-visible' : ''}`} onClick={dismiss}>
        {/* The 3D canvas host is only mounted in 3D mode; dice-box binds to
            this element by id at init, so it must not exist twice. */}
        {!flat && <div id={CONTAINER_ID} ref={containerRef} className="dice-tray-canvas" />}
        {flat && entries.length > 0 && (
          <div className="d2d-stack">
            {entries.map(e => (
              <Dice2DRoll
                key={e.roll.id}
                roll={e.roll}
                duration={FLAT_ROLL_DURATION}
                onSettled={() => settleRoll(e.roll.id, null)}
              />
            ))}
          </div>
        )}
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
