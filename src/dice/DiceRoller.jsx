// The single roller UI. Used in three variants:
//   - "fab"    : floating action button + popover (player phones, battle map)
//   - "inline" : embedded panel (dashboard interaction hub)
// Calls publishRoll() once per click. No RNG, no broadcast, no history
// writes here — that's all in the service.

import { useEffect, useRef, useState } from 'react';
import { Dices, X, Sun, Moon, Plus, Minus, Lock, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { publishRoll } from './service.js';
import { SYSTEM_LABELS, DICE_COLOR } from './systems.js';
import RollHistory from './RollHistory.jsx';

const PLAYER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ffffff',
];

const DICE_TYPES = [4, 6, 8, 10, 12, 20];

function getStoredColor() {
  if (typeof window === 'undefined') return '#6366f1';
  return localStorage.getItem('daggerheart_dice_color') || '#6366f1';
}

function getStoredName(currentUser, fallback) {
  if (typeof window === 'undefined') return fallback || 'Player';
  return localStorage.getItem('daggerheart_player_name')
    || currentUser?.displayName
    || currentUser?.email?.split('@')[0]
    || fallback
    || 'Player';
}

export default function DiceRoller({
  campaignId,
  gameSystem = 'daggerheart',
  isDM = false,
  variant = 'fab',
  defaultOpen = false,
}) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(variant === 'inline' ? true : defaultOpen);
  const [showHistory, setShowHistory] = useState(false);
  const [system, setSystem] = useState(gameSystem);
  const [modifier, setModifier] = useState(0);
  const [label, setLabel] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [dndMode, setDndMode] = useState('normal');
  const [swCount, setSwCount] = useState(3);
  const [genericDice, setGenericDice] = useState({});
  const [busy, setBusy] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [playerColor, setPlayerColor] = useState(getStoredColor());
  const [playerName, setPlayerName] = useState('');
  const popoverRef = useRef(null);

  useEffect(() => { setSystem(gameSystem); }, [gameSystem]);
  useEffect(() => { setPlayerName(getStoredName(currentUser, '')); }, [currentUser]);

  useEffect(() => {
    if (variant !== 'fab' || !isOpen) return undefined;
    const onClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        const btn = e.target.closest('.dice-fab-btn');
        if (!btn) setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [variant, isOpen]);

  const updateGenericDie = (sides, delta) => {
    setGenericDice(prev => {
      const next = { ...prev };
      const cur = next[`d${sides}`] || 0;
      const updated = Math.max(0, Math.min(10, cur + delta));
      if (updated === 0) delete next[`d${sides}`];
      else next[`d${sides}`] = updated;
      return next;
    });
  };

  const setName = (n) => {
    setPlayerName(n);
    if (typeof window !== 'undefined') localStorage.setItem('daggerheart_player_name', n);
  };
  const setColor = (c) => {
    setPlayerColor(c);
    if (typeof window !== 'undefined') localStorage.setItem('daggerheart_dice_color', c);
  };

  const rollerInfo = {
    rollerId: currentUser?.uid || null,
    rollerName: playerName || 'Player',
    rollerColor: playerColor,
  };

  const handleRoll = async () => {
    if (busy || !campaignId) return;
    setBusy(true);
    try {
      let config = { modifier };
      if (system === 'daggerheart') {
        config = { modifier, advantage, disadvantage };
      } else if (system === 'dnd5e') {
        config = { modifier, mode: dndMode };
      } else if (system === 'starwarsd6') {
        config = { modifier, count: swCount };
      } else if (system === 'generic') {
        const totalDice = Object.values(genericDice).reduce((s, n) => s + n, 0);
        if (totalDice === 0) {
          setBusy(false);
          return;
        }
        config = { modifier, diceConfig: genericDice };
      }
      await publishRoll({
        campaignId,
        system,
        config,
        rollerInfo,
        label,
        isPrivate: isDM ? isPrivate : false,
      });
      setLabel('');
    } catch (err) {
      console.error('[DiceRoller] publishRoll failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const quickRollSingle = async (sides) => {
    if (busy || !campaignId) return;
    setBusy(true);
    try {
      await publishRoll({
        campaignId,
        system: 'generic',
        config: { modifier, sides, quantity: 1 },
        rollerInfo,
        label,
        isPrivate: isDM ? isPrivate : false,
      });
      setLabel('');
    } catch (err) {
      console.error('[DiceRoller] quickRollSingle failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const totalGenericDice = Object.values(genericDice).reduce((s, n) => s + n, 0);
  const canRoll = !busy && !!campaignId && (system !== 'generic' || totalGenericDice > 0);

  const panel = (
    <div className="dice-roller-panel" ref={popoverRef}>
      <div className="dr-header">
        <div className="dr-title">
          <Dices size={16} />
          <span>{SYSTEM_LABELS[system]} Dice</span>
        </div>
        <div className="dr-header-actions">
          <button
            type="button"
            className="dr-icon-btn"
            onClick={() => setShowHistory(v => !v)}
            title="History"
          >
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {variant === 'fab' && (
            <button
              type="button"
              className="dr-icon-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="dr-identity">
        <input
          type="text"
          className="dr-name"
          value={playerName}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
          style={{ borderColor: playerColor }}
        />
        <button
          type="button"
          className="dr-color-btn"
          style={{ backgroundColor: playerColor }}
          onClick={() => setShowColorPicker(v => !v)}
          title="Color"
        >
          <Palette size={12} />
        </button>
      </div>
      {showColorPicker && (
        <div className="dr-color-grid">
          {PLAYER_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`dr-color-swatch ${playerColor === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => { setColor(c); setShowColorPicker(false); }}
            />
          ))}
        </div>
      )}

      <div className="dr-systems">
        {Object.keys(SYSTEM_LABELS).map(key => (
          <button
            key={key}
            type="button"
            className={`dr-system-btn ${system === key ? 'active' : ''}`}
            onClick={() => setSystem(key)}
          >
            {SYSTEM_LABELS[key]}
          </button>
        ))}
      </div>

      {system === 'daggerheart' && (
        <div className="dr-section">
          <div className="dr-hopefear">
            <span className="dr-hope"><Sun size={14} /> Hope d12</span>
            <span className="dr-fear"><Moon size={14} /> Fear d12</span>
          </div>
          <div className="dr-row">
            <label className={`dr-toggle ${advantage ? 'on' : ''}`}>
              <input type="checkbox" checked={advantage} onChange={(e) => { setAdvantage(e.target.checked); if (e.target.checked) setDisadvantage(false); }} />
              Advantage (+d6)
            </label>
            <label className={`dr-toggle ${disadvantage ? 'on' : ''}`}>
              <input type="checkbox" checked={disadvantage} onChange={(e) => { setDisadvantage(e.target.checked); if (e.target.checked) setAdvantage(false); }} />
              Disadvantage (−d6)
            </label>
          </div>
          <div className="dr-quick-row">
            {DICE_TYPES.map(s => (
              <button
                key={s}
                type="button"
                className="dr-quick-die"
                style={{ borderColor: DICE_COLOR[s], color: DICE_COLOR[s] }}
                onClick={() => quickRollSingle(s)}
                disabled={busy}
                title={`Quick roll d${s}`}
              >
                d{s}
              </button>
            ))}
          </div>
        </div>
      )}

      {system === 'dnd5e' && (
        <div className="dr-section">
          <div className="dr-row">
            <label>Mode</label>
            <div className="dr-mode-row">
              <button type="button" className={`dr-mode-btn ${dndMode === 'disadvantage' ? 'active' : ''}`} onClick={() => setDndMode('disadvantage')}>Dis</button>
              <button type="button" className={`dr-mode-btn ${dndMode === 'normal' ? 'active' : ''}`} onClick={() => setDndMode('normal')}>Norm</button>
              <button type="button" className={`dr-mode-btn ${dndMode === 'advantage' ? 'active' : ''}`} onClick={() => setDndMode('advantage')}>Adv</button>
            </div>
          </div>
        </div>
      )}

      {system === 'starwarsd6' && (
        <div className="dr-section">
          <div className="dr-row">
            <label>Dice Pool</label>
            <div className="dr-counter">
              <button type="button" onClick={() => setSwCount(n => Math.max(1, n - 1))}><Minus size={12} /></button>
              <input type="number" value={swCount} min={1} max={10} onChange={(e) => setSwCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} />
              <button type="button" onClick={() => setSwCount(n => Math.min(10, n + 1))}><Plus size={12} /></button>
            </div>
          </div>
        </div>
      )}

      {system === 'generic' && (
        <div className="dr-section">
          <div className="dr-generic-grid">
            {DICE_TYPES.map(s => (
              <div key={s} className="dr-generic-row">
                <span className="dr-generic-label" style={{ color: DICE_COLOR[s] }}>d{s}</span>
                <div className="dr-counter">
                  <button type="button" onClick={() => updateGenericDie(s, -1)} disabled={(genericDice[`d${s}`] || 0) === 0}><Minus size={12} /></button>
                  <span className="dr-counter-value">{genericDice[`d${s}`] || 0}</span>
                  <button type="button" onClick={() => updateGenericDie(s, 1)}><Plus size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dr-row">
        <label>Modifier</label>
        <div className="dr-counter">
          <button type="button" onClick={() => setModifier(m => m - 1)}><Minus size={12} /></button>
          <input type="number" value={modifier} min={-20} max={20} onChange={(e) => setModifier(parseInt(e.target.value) || 0)} />
          <button type="button" onClick={() => setModifier(m => m + 1)}><Plus size={12} /></button>
        </div>
      </div>

      <div className="dr-row">
        <input
          type="text"
          className="dr-label-input"
          placeholder="Roll for… (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canRoll) handleRoll(); }}
        />
      </div>

      {isDM && (
        <div className="dr-row">
          <label className={`dr-toggle ${isPrivate ? 'on' : ''}`}>
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            <Lock size={12} /> DM-only roll
          </label>
        </div>
      )}

      <button
        type="button"
        className="dr-roll-btn"
        onClick={handleRoll}
        disabled={!canRoll}
      >
        <Dices size={16} /> {busy ? 'Rolling…' : 'Roll'}
      </button>

      {showHistory && (
        <div className="dr-history">
          <RollHistory campaignId={campaignId} count={20} compact />
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return <div className="dice-roller dice-roller--inline">{panel}</div>;
  }

  return (
    <div className={`dice-roller dice-roller--fab ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="dice-fab-btn"
        style={{ borderColor: playerColor, boxShadow: `0 0 16px ${playerColor}55` }}
        onClick={() => setIsOpen(v => !v)}
        title={isOpen ? 'Close dice roller' : 'Open dice roller'}
      >
        {isOpen ? <X size={22} /> : <Dices size={22} />}
      </button>
      {isOpen && panel}
    </div>
  );
}
