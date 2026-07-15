// The single 3D dice animation overlay for the entire app. Mounted once
// per surface (player view, battle map display, dashboard). Subscribes via
// useLiveRoll, queues incoming canonical roll documents, and animates each
// one with @3d-dice/dice-box. Face values are passed to dice-box as locked
// `value:` overrides — physics tumbles cosmetically, lands on the
// canonical face. Numbers are never derived from physics; the banner reads
// the canonical doc.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DiceBox from '@3d-dice/dice-box';
import { initAudio, playRollSound, playCritSound, playDoublesSound } from '../utils/diceAudio.js';
import SpecialResultOverlay from '../components/DiceRoller/SpecialResultOverlay.jsx';
import RollResultBanner from './RollResultBanner.jsx';
import { useLiveRoll } from './useLiveRoll.js';

const CONTAINER_ID = 'dice-tray-canvas';
const BANNER_DURATION = 3000;
const SPECIAL_OVERLAY_DURATION = 2500;

function diceSpec(roll) {
  // Group consecutive dice with the same sides+color into one dice-box group
  // so the engine renders them with locked face values via `value: [...]`.
  const groups = [];
  let cur = null;
  for (const d of roll.dice || []) {
    if (cur && cur.sides === d.sides && cur.themeColor === d.color) {
      cur.qty += 1;
      cur.value.push(d.value);
    } else {
      cur = {
        qty: 1,
        sides: d.sides,
        theme: 'magic',
        themeColor: d.color,
        value: [d.value],
      };
      groups.push(cur);
    }
  }
  return groups;
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
  const queueRef = useRef([]);
  const playingRef = useRef(false);
  const bannerTimerRef = useRef(null);
  const specialTimerRef = useRef(null);

  const [activeRoll, setActiveRoll] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [special, setSpecial] = useState(null);
  const [show, setShow] = useState(false);
  const [feed, setFeed] = useState([]); // remote-roll toasts

  const pushToFeed = useCallback((roll) => {
    setFeed(prev => [...prev.slice(-3), roll]); // keep at most 4 visible
    setTimeout(() => {
      setFeed(prev => prev.filter(r => r.id !== roll.id));
    }, 6000);
  }, []);

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
      // Drain any queued rolls that arrived before init finished.
      drain();
    }).catch(err => console.error('[DiceTray] dice-box init failed:', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishRoll = useCallback(() => {
    setShowBanner(false);
    setActiveRoll(null);
    setShow(false);
    if (boxRef.current) {
      try { boxRef.current.clear(); } catch (e) { /* noop */ }
    }
    playingRef.current = false;
    drain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playRoll = useCallback(async (roll) => {
    if (!boxRef.current || !readyRef.current) {
      queueRef.current.push(roll);
      return;
    }
    playingRef.current = true;
    setActiveRoll(roll);
    setShow(true);
    setShowBanner(false);

    initAudio();
    playRollSound();

    // Trigger special-result full-screen overlays based ONLY on canonical
    // flags from the doc. The roller authored the truth; we just display it.
    if (roll.flags?.isCrit) {
      playCritSound();
      setSpecial({ type: 'crit', value: 20 });
    } else if (roll.flags?.isCritFail) {
      setSpecial({ type: 'critfail', value: 1 });
    } else if (roll.flags?.isDoubles) {
      playDoublesSound();
      const doublesValue = roll.dice?.find(d => d.groupId === 'hope')?.value ?? roll.dice?.[0]?.value;
      setSpecial({ type: 'doubles', value: doublesValue });
    } else {
      setSpecial(null);
    }
    if (specialTimerRef.current) clearTimeout(specialTimerRef.current);
    specialTimerRef.current = setTimeout(() => setSpecial(null), SPECIAL_OVERLAY_DURATION);

    try {
      boxRef.current.clear();
      await boxRef.current.roll(diceSpec(roll));
    } catch (err) {
      console.warn('[DiceTray] dice-box.roll failed:', err);
    }

    setShowBanner(true);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(finishRoll, BANNER_DURATION);
  }, [finishRoll]);

  const drain = useCallback(() => {
    if (playingRef.current) return;
    const next = queueRef.current.shift();
    if (next) playRoll(next);
  }, [playRoll]);

  // Receive new canonical rolls from Firestore.
  useLiveRoll(campaignId, useCallback((roll) => {
    const isMine = currentUserId != null && roll.rollerId === currentUserId;
    // Someone else's private roll is not our business on any surface.
    if (roll.isPrivate && !isMine) return;
    if (isMine || animateRemote) {
      queueRef.current.push(roll);
      drain();
    } else {
      pushToFeed(roll);
    }
  }, [drain, pushToFeed, currentUserId, animateRemote]));

  useEffect(() => () => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    if (specialTimerRef.current) clearTimeout(specialTimerRef.current);
  }, []);

  const dismiss = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    finishRoll();
  }, [finishRoll]);

  return createPortal(
    <>
      <div className={`dice-tray ${show ? 'is-visible' : ''}`} onClick={dismiss}>
        <div id={CONTAINER_ID} ref={containerRef} className="dice-tray-canvas" />
        {showBanner && activeRoll && <RollResultBanner roll={activeRoll} />}
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
          onClose={() => setSpecial(null)}
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
