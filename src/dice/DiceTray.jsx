// The single 3D dice animation overlay for the entire app. Mounted once
// per surface (player view, battle map display, dashboard). Subscribes via
// useLiveRoll, animates each incoming canonical roll document with
// @3d-dice/dice-box, and shows its result. Face values are passed to
// dice-box as locked `value:` overrides — physics tumbles cosmetically, lands
// on the canonical face. Numbers are never derived from physics; the banner
// reads the canonical doc.
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
import { diceSpec, MAX_CONCURRENT_ROLLS } from './diceSpec.js';

const CONTAINER_ID = 'dice-tray-canvas';
const BANNER_DURATION = 3000;
const SPECIAL_OVERLAY_DURATION = 2500;
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
export default function DiceTray({ campaignId, currentUserId = null, animateRemote = false }) {
  const containerRef = useRef(null);
  const boxRef = useRef(null);
  const readyRef = useRef(false);
  // Rolls that arrived before dice-box finished initialising.
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
      e.roll.id === rollId ? { ...e, results, settled: true } : e
    )));
    armGroupTimer();
  }, [armGroupTimer, commitEntries]);

  const playRoll = useCallback(async (roll) => {
    if (!boxRef.current || !readyRef.current) {
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

    // Trigger special-result full-screen overlays based ONLY on canonical
    // flags from the doc. The roller authored the truth; we just display it.
    if (!specialBusyRef.current) {
      let next = null;
      if (roll.flags?.isCrit) {
        playCritSound();
        next = { type: 'crit', value: 20 };
      } else if (roll.flags?.isCritFail) {
        next = { type: 'critfail', value: 1 };
      } else if (roll.flags?.isDoubles) {
        playDoublesSound();
        const doublesValue = roll.dice?.find(d => d.groupId === 'hope')?.value ?? roll.dice?.[0]?.value;
        next = { type: 'doubles', value: doublesValue };
      }
      if (next) {
        specialBusyRef.current = true;
        setSpecial(next);
        if (specialTimerRef.current) clearTimeout(specialTimerRef.current);
        specialTimerRef.current = setTimeout(() => {
          setSpecial(null);
          specialBusyRef.current = false;
        }, SPECIAL_OVERLAY_DURATION);
      }
    }

    watchdogsRef.current.set(roll.id, setTimeout(() => {
      console.warn('[DiceTray] roll never settled, retiring it:', roll.id);
      settleRoll(roll.id, null);
    }, ROLL_WATCHDOG_MS));

    let results = null;
    try {
      // add(), not roll() — roll() clears the table first and would wipe
      // any dice still tumbling from another player.
      results = await boxRef.current.add(diceSpec(roll));
    } catch (err) {
      console.warn('[DiceTray] dice-box.add failed:', err);
    }

    settleRoll(roll.id, results);
  }, [pushToFeed, commitEntries, settleRoll]);

  // Lazy-init dice-box once the portal target is in the DOM.
  useEffect(() => {
    if (boxRef.current) return undefined;
    const box = new DiceBox({
      container: `#${CONTAINER_ID}`,
      assetPath: '/assets/dice-box/',
      scale: 6,
      throwForce: 6,
      gravity: 3,
      theme: 'magic',
      themeColor: '#3b82f6',
      offscreen: false,
    });
    let cancelled = false;
    box.init().then(() => {
      if (cancelled) return;
      boxRef.current = box;
      readyRef.current = true;
      // Play anything that arrived while we were initialising.
      const queued = pendingRef.current;
      pendingRef.current = [];
      for (const roll of queued) playRoll(roll);
    }).catch(err => console.error('[DiceTray] dice-box init failed:', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return createPortal(
    <>
      <div className={`dice-tray ${show ? 'is-visible' : ''}`} onClick={dismiss}>
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
