import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ChevronLeft, Moon, ArrowUp, Skull, Palette, Heart, HeartCrack } from 'lucide-react';
import { useDice, DiceTray } from '../../dice';
import { PLAYER_COLORS, getPlayerDiceColor, setPlayerDiceColor, DUALITY_SETS, getDualitySet, setDualitySet } from '../../dice/playerColor';
import PortalSlotTracker from './PortalSlotTracker';
import ActionsTab from './tabs/ActionsTab';
import SpellsTab from './tabs/SpellsTab';
import StatsTab from './tabs/StatsTab';
import InventoryTab from './tabs/InventoryTab';
import FeaturesTab from './tabs/FeaturesTab';
import { computeDefenses } from '../../utils/daggerheartDefenses';
import { armorSlotCount } from '../../utils/daggerheartSheetFields';
import { isAtDeathsDoor, hpSlotsOf } from '../../utils/daggerheartVitals';
import { useDualityAutomation } from '../../hooks/useDualityAutomation';
import { useWakeLock } from '../../hooks/useWakeLock';
import { usePlayerDisplay } from '../../hooks/usePlayerDisplay';
import PortalTableStatus from './PortalTableStatus';
import { displayItemName } from '../../utils/itemNames';
import { scarCount, normalizeHopeSlots } from '../../utils/daggerheartHope';
import RestModal from '../Characters/RestModal';
import DeathMoveModal from '../Characters/DeathMoveModal';
import TakeDamageModal from '../Characters/TakeDamageModal';
import { applyDamage } from '../../utils/playerDamage';
import LevelUpWizard from '../Characters/LevelUpWizard';

const TABS = [
  { key: 'actions',   label: 'Actions'   },
  { key: 'spells',    label: 'Spells'    },
  { key: 'stats',     label: 'Stats'     },
  { key: 'inventory', label: 'Inventory' },
  { key: 'features',  label: 'Features'  },
];

function toTrack(boolArray, defaultLen = 6) {
  const arr = Array.isArray(boolArray) ? boolArray : Array(defaultLen).fill(false);
  return { filled: arr.filter(Boolean).length, max: arr.length };
}

function toBoolArray(filled, max) {
  return Array.from({ length: max }, (_, i) => i < filled);
}

export default function PortalCharacterSheet({ character, currentUserId, updateCharacter, stashFromCharacter, campaign, items, showBack, onBack, onExit }) {
  const [showDicePicker, setShowDicePicker] = useState(false);
  const [diceColor, setDiceColor] = useState(() => getPlayerDiceColor(currentUserId));
  const [dualityKey, setDualityKey] = useState(() => getDualitySet().key);
  const dualitySet = DUALITY_SETS.find(d => d.key === dualityKey) || DUALITY_SETS[0];
  const [activeTab, setActiveTab] = useState('actions');
  const [rollBonus, setRollBonus] = useState(null);
  const [showRest, setShowRest] = useState(false);
  const [showDeath, setShowDeath] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showDamage, setShowDamage] = useState(false);
  // The portal is the player's sheet at the table — keep the phone awake.
  useWakeLock(true);

  // hpSlots holds HP REMAINING, not damage marked — see daggerheartVitals.js.
  // This used to count true slots as marks, which offered the Death Move to a
  // character at full health and hid it from one with no HP left.
  const atDeathsDoor = isAtDeathsDoor(character);
  const applyUpdates = (updates) => updateCharacter && updateCharacter(character.id, updates);
  const scars = scarCount(character);

  // Vital track state: { filled, max }
  const [hp,     setHp]     = useState(() => toTrack(hpSlotsOf(character)));
  const [stress, setStress] = useState(() => toTrack(character.stressSlots, 6));
  // Normalized so a character whose track was shortened by the old scar bug is
  // repaired on read, and written back whole on the next toggle.
  const [hope,   setHope]   = useState(() => toTrack(normalizeHopeSlots(character.hopeSlots), 6));

  // Resolve equipped items and compute the true armor score (applying Protective /
  // Barrier / Double Duty feature bonuses) BEFORE the armor useState so the lazy
  // initializer and the useEffect reset both use the same computed value.
  const equippedItems = useMemo(() => {
    if (!items || !Array.isArray(character.equippedItems)) return [];
    return character.equippedItems
      .filter(ei => ei.equipped !== false)
      .map(ei => { const item = items?.find(i => i.id === ei.itemId); return item ? { ...item, ...ei } : null; })
      .filter(Boolean);
  }, [items, character.equippedItems]);

  const { armorScore: computedArmorScore, majorThreshold, severeThreshold } = useMemo(
    () => computeDefenses(character, equippedItems),
    [character, equippedItems]
  );

  // How many armor slots the track actually has.
  //
  // This is NOT the same as Armor Score: armor can carry more slots than its
  // score (the item's own `armorSlots`, and a legacy-6 correction). The portal
  // used to use the raw score for both display and persistence, so on armor
  // with 6 slots and a score of 4 the first tap wrote a 4-long array and marks
  // 5 and 6 were destroyed. Share the DM sheet's and the PDF's helper so all
  // three agree and the stored track keeps its real length.
  const equippedArmorItems = useMemo(
    () => equippedItems.filter(i => i.type === 'armor'),
    [equippedItems]
  );
  const armorSlotsTotal = useMemo(
    () => armorSlotCount(character, equippedArmorItems, computedArmorScore),
    [character, equippedArmorItems, computedArmorScore]
  );

  const [armor,  setArmor]  = useState(() => toTrack(character.armorSlots,  armorSlotsTotal || 0));

  // Reset local state when server data changes
  useEffect(() => {
    setHp(toTrack(hpSlotsOf(character)));
    setStress(toTrack(character.stressSlots, 6));
    setHope(toTrack(normalizeHopeSlots(character.hopeSlots), 6));
    setArmor(toTrack(character.armorSlots, armorSlotsTotal || 0));
  }, [character.hpSlots, character.stressSlots, character.hopeSlots, character.armorSlots, armorSlotsTotal]);

  const campaignId = campaign?.id;
  const { roll, rollDamage } = useDice(campaignId);
  // The GM's Fear and any countdowns the DM made public — read-only here.
  const { displayState: tableDisplay } = usePlayerDisplay(campaignId);

  // Every roll the tabs make is an action roll — a trait check, a weapon
  // attack, a spellcast — so they get a roll that says so and then applies
  // the Hope it earns. The Death Move below keeps the untagged `roll`: its
  // "Risk It All" has its own resolution and must not generate Hope or Fear.
  const applyRollOutcome = useDualityAutomation({ character, campaign, updateCharacter });
  const rollAction = useCallback(async (opts = {}) => {
    const doc = await roll({ ...opts, kind: 'action' });
    applyRollOutcome(doc);
    return doc;
  }, [roll, applyRollOutcome]);

  // `getter` is what the UI shows, which for Hope is the scar-reduced track.
  // `persistMax` is the real stored length — passing the displayed max here
  // used to shrink the saved Hope array by one slot on every single tap,
  // ratcheting a scarred character's maximum Hope down to nothing.
  const handleVitalToggle = (field, getter, setter, persistMax = null) => (i, wasOn) => {
    if (!updateCharacter) return;
    const newFilled = Math.max(0, Math.min(getter.max, wasOn ? i : i + 1));
    setter({ ...getter, filled: newFilled });
    updateCharacter(character.id, { [field]: toBoolArray(newFilled, persistMax ?? getter.max) });
  };

  // Death-move rolls go through the shared roller so the table sees them in
  // the dice tray and the roll log. Falls back to a local die if there's no
  // campaign to publish to, so the modal still works.
  const localD12 = () => Math.floor(Math.random() * 12) + 1;
  const rollDeathHopeDie = async () => {
    const doc = await rollDamage({ label: 'Death Move — Hope Die', dieType: 12, quantity: 1 });
    return doc?.dice?.[0]?.value ?? localD12();
  };
  const rollDeathDuality = async () => {
    const doc = await roll({ label: 'Death Move — Risk It All' });
    const hope = doc?.dice?.find(d => d.groupId === 'hope')?.value;
    const fear = doc?.dice?.find(d => d.groupId === 'fear')?.value;
    return { hope: hope ?? localD12(), fear: fear ?? localD12() };
  };

  // Take Damage: the rules are in playerDamage.js. Marking the last Hit Point
  // goes straight to the Death Move, which is what the rules say happens next.
  const handleTakeDamage = (outcome) => {
    const { updates, hpMarked, hpLeft } = applyDamage(character, outcome, armorSlotsTotal);
    if (!updates || !updateCharacter) return;
    updateCharacter(character.id, updates);
    if (hpMarked > 0 && hpLeft === 0) setShowDeath(true);
  };

  // Scars are permanent by the rules, but they can be healed through downtime
  // or a quest reward — and mistakes happen. Confirm, then give the slot back.
  const handleRemoveScar = () => {
    if (!updateCharacter || scars <= 0) return;
    if (!confirm(`Remove one scar from ${character.name || 'this character'}? This restores a Hope slot.`)) return;
    updateCharacter(character.id, {
      scars: Math.max(0, scars - 1),
      // Repair the track at the same time, in case it was shortened before.
      hopeSlots: normalizeHopeSlots(character.hopeSlots),
    });
  };

  // Prefer the equipped armor (with the player's own name for it, if they set
  // one); the legacy fields stay as fallbacks for sheets that predate the
  // item catalog.
  const equippedArmorItem = equippedItems.find(i => i.type === 'armor');
  const armorName = (equippedArmorItem && displayItemName(equippedArmorItem))
    || character.armorName || (character.armorItems?.[0]?.name) || '';

  // Scars permanently cross out Hope slots — reduce the usable Hope max to match
  // the DM sheet so a scarred character shows the right number in the portal.
  // Display only: the stored track stays hope.max long (see handleVitalToggle).
  const hopeAdjusted = { filled: Math.min(hope.filled, hope.max - scars), max: Math.max(0, hope.max - scars) };

  const tabProps = { character, roll: rollAction, rollDamage, campaignId, campaign, rollBonus, setRollBonus, items, updateCharacter, stashFromCharacter };

  return (
    <div className="lrp-portal">
      {/* Floating nav buttons — don't consume layout space */}
      <div style={{
        position: 'absolute',
        top: 'max(10px, env(safe-area-inset-top, 10px))',
        left: 16, right: 16,
        zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        {showBack ? (
          <button onClick={onBack} className="lrp-icon-btn" aria-label="Back to character list"
            style={{ pointerEvents: 'auto' }}>
            <ChevronLeft size={20} />
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}
        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowDicePicker(v => !v)}
            className="lrp-icon-btn"
            aria-label="Dice color"
            title="Your dice color"
            style={{ borderColor: diceColor, color: diceColor }}
          >
            <Palette size={18} />
          </button>
          <button onClick={onExit} className="lrp-icon-btn" aria-label="Exit portal">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Dice color swatches — your damage dice, toasts, and roll history use this */}
      {showDicePicker && (
        <div style={{
          position: 'absolute',
          top: 'max(56px, calc(env(safe-area-inset-top, 10px) + 46px))',
          right: 16, zIndex: 11,
          display: 'grid', gridTemplateColumns: 'repeat(7, 28px)', gap: 8,
          padding: 10, borderRadius: 12,
          background: 'rgba(12,14,28,0.96)', border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          {PLAYER_COLORS.map(c => (
            <button
              key={c}
              aria-label={`Dice color ${c}`}
              onClick={() => { setPlayerDiceColor(c); setDiceColor(c); }}
              style={{
                width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                background: c,
                border: diceColor === c ? '2px solid #fff' : '2px solid transparent',
              }}
            />
          ))}
          {/* Duality (Hope/Fear) color set */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span title="Hope die" style={{ width: 14, height: 14, borderRadius: '50%', background: dualitySet.hope, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span title="Fear die" style={{ width: 14, height: 14, borderRadius: '50%', background: dualitySet.fear, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <select
              value={dualityKey}
              aria-label="Duality dice colors"
              onChange={(e) => { setDualityKey(e.target.value); setDualitySet(e.target.value); }}
              style={{
                flex: 1, minWidth: 0, padding: '6px 8px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)', fontSize: 12, cursor: 'pointer',
              }}
            >
              {DUALITY_SETS.map(d => (
                <option key={d.key} value={d.key} style={{ background: '#14162a' }}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Scrollable body */}
      <div className="lrp-content">
        <div className="lrp-inner">

          {/* ── Hero card — padded to clear floating buttons ── */}
          <div style={{ padding: 'max(64px, calc(env(safe-area-inset-top, 0px) + 56px)) 18px 0' }}>
            <div style={{
              position: 'relative', borderRadius: 20,
              border: '1.5px solid rgba(234,179,8,0.4)',
              background: 'linear-gradient(165deg, rgba(234,179,8,0.1) 0%, rgba(20,15,40,0.65) 60%)',
              padding: '18px 16px 16px', overflow: 'hidden',
              boxShadow: '0 18px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(234,179,8,0.18)',
            }}>
              {/* Decorative corner glow */}
              <div style={{
                position: 'absolute', top: -50, right: -40, width: 180, height: 180, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
                {/* Avatar */}
                <div className="lrp-avatar-ring" style={{
                  width: 92, height: 92, fontSize: 36,
                  border: '3px solid #eab308',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 0 24px rgba(234,179,8,0.4)',
                }}>
                  {character.avatarUrl
                    ? <img src={character.avatarUrl} alt={character.name} />
                    : character.name[0]?.toUpperCase()}
                </div>
                {/* Identity */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lrp-cinzel" style={{
                    fontSize: 24, fontWeight: 900, color: '#eab308',
                    letterSpacing: '0.04em', lineHeight: 1.05,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {(character.name || '').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginTop: 8, lineHeight: 1.5 }}>
                    Lv {character.level || 1} · {character.class}
                  </div>
                  {character.subclass && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.5 }}>
                      {character.subclass}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>
                    {[character.ancestry, character.community].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick actions: Rest / Level Up / Death Move ── */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 18px 0' }}>
            {updateCharacter && (
              <button className="lrp-action-btn" onClick={() => setShowDamage(true)}>
                <HeartCrack size={15} /> Damage
              </button>
            )}
            <button className="lrp-action-btn" onClick={() => setShowRest(true)}>
              <Moon size={15} /> Rest
            </button>
            {(character.level || 1) < 10 && (
              <button className="lrp-action-btn" onClick={() => setShowLevelUp(true)}>
                <ArrowUp size={15} /> Level Up
              </button>
            )}
            {atDeathsDoor && (
              <button className="lrp-action-btn lrp-action-danger" onClick={() => setShowDeath(true)}>
                <Skull size={15} /> Death Move
              </button>
            )}
          </div>

          <PortalTableStatus display={tableDisplay} />

          {/* ── Vital tracks ── */}
          <div style={{ padding: '14px 18px 0' }}>
            <div style={{
              background: 'rgba(0,0,0,0.35)', borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.05)', padding: 14,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <PortalSlotTracker label={scars > 0 ? `Hope · ${scars} scar${scars > 1 ? 's' : ''}` : 'Hope'} {...hopeAdjusted} color="gold"
                    onToggle={handleVitalToggle('hopeSlots', hopeAdjusted, setHope, hope.max)} />
                </div>
                {scars > 0 && updateCharacter && (
                  <button
                    onClick={handleRemoveScar}
                    title="Remove a scar (restores a Hope slot)"
                    aria-label="Remove a scar"
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 10px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fbbf24', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Heart size={12} /> Heal scar
                  </button>
                )}
              </div>
              <PortalSlotTracker label="Hit Points" {...hp} color="hp"
                onToggle={handleVitalToggle('hpSlots', hp, setHp)} />
              <PortalSlotTracker label="Stress" {...stress} color="stress"
                onToggle={handleVitalToggle('stressSlots', stress, setStress)} />
              <PortalSlotTracker
                label={armorName ? `Armor · ${armorName}` : 'Armor'}
                {...armor} max={armorSlotsTotal || armor.max} color="armor"
                right={`${armor.filled}/${armorSlotsTotal || armor.max}${computedArmorScore ? `  (${computedArmorScore})` : ''}`}
                onToggle={handleVitalToggle(
                  'armorSlots',
                  { ...armor, max: armorSlotsTotal || armor.max },
                  setArmor,
                  armorSlotsTotal || armor.max
                )} />
            </div>
          </div>

          {/* ── Tab bar (sticky below vitals) ── */}
          <div style={{ marginTop: 16 }}>
            <div className="lrp-tab-bar">
              {TABS.map(t => {
                const active = activeTab === t.key;
                return (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} className="lrp-tab-btn"
                    style={{
                      color: active ? '#eab308' : 'rgba(255,255,255,0.4)',
                      borderBottomColor: active ? '#eab308' : 'transparent',
                    }}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tab content ── */}
          <div style={{ padding: '14px 16px 40px' }}>
            {activeTab === 'actions'   && <ActionsTab   {...tabProps} />}
            {activeTab === 'spells'    && <SpellsTab    {...tabProps} />}
            {activeTab === 'stats'     && <StatsTab     {...tabProps} />}
            {activeTab === 'inventory' && <InventoryTab {...tabProps} />}
            {activeTab === 'features'  && <FeaturesTab  {...tabProps} />}
          </div>

        </div>
      </div>
      <DiceTray campaignId={campaignId} currentUserId={currentUserId} />

      {showRest && (
        <RestModal character={character} onApply={applyUpdates} onClose={() => setShowRest(false)} />
      )}
      {showDamage && (
        <TakeDamageModal
          character={character}
          thresholds={{ major: majorThreshold, severe: severeThreshold }}
          armorTotal={armorSlotsTotal}
          massiveRule={campaign?.massiveDamage === true}
          onApply={handleTakeDamage}
          onClose={() => setShowDamage(false)}
        />
      )}
      {showDeath && (
        <DeathMoveModal
          character={character}
          onApply={applyUpdates}
          onRollHopeDie={rollDeathHopeDie}
          onRollDuality={rollDeathDuality}
          onClose={() => setShowDeath(false)}
        />
      )}
      {showLevelUp && (
        <LevelUpWizard
          character={character}
          items={items}
          onComplete={applyUpdates}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </div>
  );
}
