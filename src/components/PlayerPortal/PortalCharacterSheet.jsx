import { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, Moon, ArrowUp, Skull } from 'lucide-react';
import { useDice, DiceTray } from '../../dice';
import PortalSlotTracker from './PortalSlotTracker';
import ActionsTab from './tabs/ActionsTab';
import SpellsTab from './tabs/SpellsTab';
import StatsTab from './tabs/StatsTab';
import InventoryTab from './tabs/InventoryTab';
import FeaturesTab from './tabs/FeaturesTab';
import { computeDefenses } from '../../utils/daggerheartDefenses';
import RestModal from '../Characters/RestModal';
import DeathMoveModal from '../Characters/DeathMoveModal';
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

export default function PortalCharacterSheet({ character, currentUserId, updateCharacter, campaign, items, showBack, onBack, onExit }) {
  const [activeTab, setActiveTab] = useState('actions');
  const [rollBonus, setRollBonus] = useState(null);
  const [showRest, setShowRest] = useState(false);
  const [showDeath, setShowDeath] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const hpMarked = (character.hpSlots || []).filter(Boolean).length;
  const hpMax = (character.hpSlots || []).length || 6;
  const atDeathsDoor = hpMax > 0 && hpMarked >= hpMax;
  const applyUpdates = (updates) => updateCharacter && updateCharacter(character.id, updates);
  const scars = character.scars || 0;

  // Vital track state: { filled, max }
  const [hp,     setHp]     = useState(() => toTrack(character.hpSlots,     6));
  const [stress, setStress] = useState(() => toTrack(character.stressSlots, 6));
  const [hope,   setHope]   = useState(() => toTrack(character.hopeSlots,   6));

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

  const { armorScore: computedArmorScore } = useMemo(
    () => computeDefenses(character, equippedItems),
    [character, equippedItems]
  );

  const [armor,  setArmor]  = useState(() => toTrack(character.armorSlots,  computedArmorScore || 0));

  // Reset local state when server data changes
  useEffect(() => {
    setHp(toTrack(character.hpSlots, 6));
    setStress(toTrack(character.stressSlots, 6));
    setHope(toTrack(character.hopeSlots, 6));
    setArmor(toTrack(character.armorSlots, computedArmorScore || 0));
  }, [character.hpSlots, character.stressSlots, character.hopeSlots, character.armorSlots, computedArmorScore]);

  const campaignId = campaign?.id;
  const { roll, rollDamage } = useDice(campaignId);

  const handleVitalToggle = (field, getter, setter) => (i, wasOn) => {
    if (!updateCharacter) return;
    const newFilled = Math.max(0, Math.min(getter.max, wasOn ? i : i + 1));
    setter({ ...getter, filled: newFilled });
    updateCharacter(character.id, { [field]: toBoolArray(newFilled, getter.max) });
  };

  const armorName = character.armorName || (character.armorItems?.[0]?.name) || '';

  // Scars permanently cross out Hope slots — reduce the usable Hope max to match
  // the DM sheet so a scarred character shows the right number in the portal.
  const hopeAdjusted = { filled: Math.min(hope.filled, hope.max - scars), max: Math.max(0, hope.max - scars) };

  const tabProps = { character, roll, rollDamage, campaignId, rollBonus, setRollBonus, items, updateCharacter };

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
        <button onClick={onExit} className="lrp-icon-btn" aria-label="Exit portal"
          style={{ pointerEvents: 'auto' }}>
          <X size={20} />
        </button>
      </div>

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

          {/* ── Vital tracks ── */}
          <div style={{ padding: '14px 18px 0' }}>
            <div style={{
              background: 'rgba(0,0,0,0.35)', borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.05)', padding: 14,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <PortalSlotTracker label={scars > 0 ? `Hope · ${scars} scar${scars > 1 ? 's' : ''}` : 'Hope'} {...hopeAdjusted} color="gold"
                onToggle={handleVitalToggle('hopeSlots', hopeAdjusted, setHope)} />
              <PortalSlotTracker label="Hit Points" {...hp} color="hp"
                onToggle={handleVitalToggle('hpSlots', hp, setHp)} />
              <PortalSlotTracker label="Stress" {...stress} color="stress"
                onToggle={handleVitalToggle('stressSlots', stress, setStress)} />
              <PortalSlotTracker
                label={armorName ? `Armor · ${armorName}` : 'Armor'}
                {...armor} max={computedArmorScore || armor.max} color="armor"
                right={`${armor.filled}/${computedArmorScore || armor.max}${computedArmorScore ? `  (${computedArmorScore})` : ''}`}
                onToggle={handleVitalToggle('armorSlots', { ...armor, max: computedArmorScore || armor.max }, setArmor)} />
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
      {showDeath && (
        <DeathMoveModal character={character} onApply={applyUpdates} onClose={() => setShowDeath(false)} />
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
