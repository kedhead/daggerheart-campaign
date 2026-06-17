import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, Trash2, ExternalLink, Sword, Shield, Star, Sparkles, BookOpen, Users, ArrowUp, Wand2, Dices } from 'lucide-react';
import { CLASSES, SUBCLASSES, ANCESTRIES, COMMUNITIES, getBaseProficiency, getTierForLevel } from '../../data/systems/daggerheart';
import { getCardByName } from '../../data/daggerheartDomainCards';
import { computeAbilityDelta } from '../../data/daggerheartAbilityEffects';
import { DAGGERHEART_ARMOR } from '../../data/daggerheartItems';
import { getFeatureName, getFeatureDescription, hasFeatureName, featureNameList } from '../../utils/itemFeatures';
import { generateCharacterPortrait } from '../../services/portraitGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useDice } from '../../dice';
import LevelUpWizard from './LevelUpWizard';
import BeastformPanel from './BeastformPanel';
import CompanionSheet from './CompanionSheet';
import './DaggerheartCharacterSheet.css';

// Parse a damage string like "d8+3" or "2d6" into parts for rolling
const parseDamageString = (dmgStr) => {
  if (!dmgStr) return null;
  const match = dmgStr.match(/^(\d+)?d(\d+)(?:\+(\d+))?$/);
  if (!match) return null;
  return {
    quantity: parseInt(match[1] || '1', 10),
    dieType: parseInt(match[2], 10),
    modifier: parseInt(match[3] || '0', 10),
  };
};

// Extract the first dice expression embedded in free-form card description text.
// Matches patterns like d8, 1d8, 2d8+3, d20+2 anywhere in the string.
const extractCardDice = (text) => {
  if (!text) return null;
  const match = text.match(/(\d+)?d(\d+)(?:\+(\d+))?/);
  if (!match) return null;
  return {
    quantity: parseInt(match[1] || '1', 10),
    dieType: parseInt(match[2], 10),
    modifier: parseInt(match[3] || '0', 10),
  };
};

const DEFAULT_TRAITS = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
const DEFAULT_HP = [true, true, true, true, true, true];
const DEFAULT_STRESS = [false, false, false, false, false, false];
const DEFAULT_ARMOR_SLOTS = [false, false, false, false, false, false];
const DEFAULT_HOPE_SLOTS = [false, false, false, false, false, false];

const TRAIT_ABBREV = {
  agility: 'AGI', strength: 'STR', finesse: 'FIN',
  instinct: 'INS', presence: 'PRE', knowledge: 'KNO'
};

// getTierForLevel imported from daggerheart.js

const getWeaponDamage = (weapon, level, proficiency) => {
  const sd = weapon.systemData;
  if (!sd) return null;
  const tier = getTierForLevel(level);
  const dice = sd[`damageTier${tier}Dice`];
  const mod = sd[`damageTier${tier}Modifier`];
  if (!dice) return null;
  const qty = proficiency || 1;
  const diceStr = `${qty}${dice}`;
  return mod ? `${diceStr}+${mod}` : diceStr;
};

export default function DaggerheartCharacterSheet({ character, onEdit, onDelete, isDM, canEdit, campaign, updateCharacter, items }) {
  const [localHp, setLocalHp] = useState(null);
  const [localStress, setLocalStress] = useState(null);
  const [localArmor, setLocalArmor] = useState(null);
  const [localHope, setLocalHope] = useState(null);
  const [localSlayerDice, setLocalSlayerDice] = useState(null);
  const [activeTab, setActiveTab] = useState('core');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [expPickerActive, setExpPickerActive] = useState(null); // name of experience with open trait picker
  const [rollingKey, setRollingKey] = useState(null); // key of item currently rolling (flash feedback)
  const [lastRoll, setLastRoll] = useState(null); // { label, type, ...rollData }
  // Sticky one-shot modifier for the next trait/attack roll.
  //   null        → no effect
  //   'advantage' → add 1d6 to the total (Daggerheart help)
  //   'hindrance' → subtract 1d6 from the total (hinder)
  const [rollBonus, setRollBonus] = useState(null);
  const rollResultTimer = useRef(null);

  const { roll, rollDamage } = useDice(campaign?.id);

  // Translate a canonical roll document into the legacy fields the inline
  // overlay JSX consumes. Single source of truth is still the doc; this is
  // just a view-shape adapter.
  const showRollResult = (label, type, data) => {
    if (rollResultTimer.current) clearTimeout(rollResultTimer.current);
    let view;
    if (type === 'daggerheart') {
      const hope = data.dice?.find(d => d.groupId === 'hope')?.value;
      const fear = data.dice?.find(d => d.groupId === 'fear')?.value;
      view = {
        label, type,
        hopeDie: hope,
        fearDie: fear,
        modifier: data.modifier,
        total: data.total,
        outcome: data.outcome,
        isDoubles: !!data.flags?.isDoubles,
      };
    } else {
      const rolls = (data.dice || []).map(d => d.value);
      const dieType = data.dice?.[0]?.sides;
      view = { label, type, rolls, dieType, modifier: data.modifier, total: data.total };
    }
    setLastRoll(view);
    rollResultTimer.current = setTimeout(() => setLastRoll(null), 6000);
  };

  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const openaiKeyInfo = getEffectiveKey('openai');

  useEffect(() => {
    setLocalHp(null);
    setLocalStress(null);
    setLocalArmor(null);
    setLocalHope(null);
    setLocalSlayerDice(null);
  }, [character.hpSlots, character.stressSlots, character.armorSlots, character.hopeSlots, character.slayerDice]);

  const hpSlots = localHp || character.hpSlots || DEFAULT_HP;
  const stressSlots = localStress || character.stressSlots || DEFAULT_STRESS;
  const rawArmorSlots = localArmor || character.armorSlots || DEFAULT_ARMOR_SLOTS;
  const hopeSlots = localHope || character.hopeSlots || DEFAULT_HOPE_SLOTS;
  const slayerDice = localSlayerDice ?? character.slayerDice ?? 0;
  const traits = { ...DEFAULT_TRAITS, ...character.traits };

  const handleSlotToggle = (type, index) => {
    if (!canEdit || !updateCharacter) return;
    const currentSlots = type === 'hpSlots' ? [...hpSlots]
      : type === 'stressSlots' ? [...stressSlots]
      : type === 'hopeSlots' ? [...hopeSlots]
      : [...armorSlots];
    currentSlots[index] = !currentSlots[index];
    if (type === 'hpSlots') setLocalHp(currentSlots);
    else if (type === 'stressSlots') setLocalStress(currentSlots);
    else if (type === 'hopeSlots') setLocalHope(currentSlots);
    else setLocalArmor(currentSlots);
    updateCharacter(character.id, { [type]: currentSlots });
  };

  const handleSlayerDiceAdjust = (delta, max) => {
    if (!canEdit || !updateCharacter) return;
    const next = Math.max(0, Math.min(max, slayerDice + delta));
    if (next === slayerDice) return;
    setLocalSlayerDice(next);
    updateCharacter(character.id, { slayerDice: next });
  };

  const formatTraitValue = (val) => val > 0 ? `+${val}` : `${val}`;
  const traitClass = (val) => val > 0 ? 'positive' : val < 0 ? 'negative' : 'zero';

  const charClass = character.class || '';
  const subclass = character.subclass || '';
  const ancestry = character.ancestry || '';
  const community = character.community || '';
  const level = character.level || 1;
  const proficiency = character.proficiency || getBaseProficiency(level);
  const isDruid = charClass === 'Druid' || character.multiclass?.class === 'Druid';
  const isBeastbound = charClass === 'Ranger' && subclass === 'Beastbound';
  const subclassLevel = character.subclassLevel || 'foundation';
  const classData = charClass ? CLASSES[charClass] : null;
  const baseEvasion = ((charClass && CLASSES[charClass]?.baseEvasion) || character.evasion || 10) + (character.baseEvasionBonus || 0);
  const baseArmorScore = character.armor ?? 0;
  const gold = character.gold ?? 0;
  const inventoryText = typeof character.inventory === 'string' ? character.inventory : '';
  const experiences = character.experiences || [];
  const primaryDomain = character.primaryDomain || '';
  const secondaryDomain = character.secondaryDomain || '';
  const domainNotes = character.domainNotes || '';
  const domainCardNames = character.domainCards || [];

  const subtitleParts = [charClass, subclass, ancestry].filter(Boolean);

  const subclassInfo = useMemo(() => {
    if (!charClass || !subclass || !SUBCLASSES[charClass]) return null;
    return SUBCLASSES[charClass].find(s => s.name === subclass);
  }, [charClass, subclass]);

  const ancestryData = (ancestry && ANCESTRIES[ancestry]) ? ANCESTRIES[ancestry] : character.customAncestryData || null;
  const ancestryFeatures = ancestryData && typeof ancestryData === 'object' ? ancestryData.features || [] : [];
  const communityData = (community && COMMUNITIES[community]) ? COMMUNITIES[community] : character.customCommunityData || null;
  const communityFeatures = communityData && typeof communityData === 'object' ? communityData.features || [] : [];
  const hasHeritage = ancestryFeatures.length > 0 || communityFeatures.length > 0;

  const domainCards = useMemo(() =>
    domainCardNames.map(name => getCardByName(name)).filter(Boolean),
    [domainCardNames]
  );

  const domainCardsGrouped = useMemo(() => {
    const grouped = {};
    domainCards.forEach(card => {
      if (!grouped[card.domain]) grouped[card.domain] = [];
      grouped[card.domain].push(card);
    });
    return grouped;
  }, [domainCards]);

  const equippedItems = useMemo(() => {
    if (!items || !Array.isArray(character.equippedItems)) return [];
    return character.equippedItems
      .filter(ei => ei.equipped !== false)
      .map(ei => {
        const item = items.find(i => i.id === ei.itemId);
        return item ? { ...item, ...ei } : null;
      })
      .filter(Boolean);
  }, [items, character.equippedItems]);

  const equippedWeapons = equippedItems.filter(i => i.type === 'weapon');
  const equippedArmorItems = equippedItems.filter(i => i.type === 'armor');
  const equippedEquipment = equippedItems.filter(i => i.type === 'equipment');

  // Resize armor slots to match the equipped armor's slot count.
  // If no armor is equipped, fall back to the character's stored slot count.
  // Apply the same legacy-slot correction used in DaggerheartArmorForm: items
  // saved before the armorSlots field was introduced defaulted to 6 slots.
  // Detect those by checking armorSlots === 6 while armorScore !== 6 and no
  // 'Fortified' feature, then substitute armorScore as the correct slot count.
  const equippedArmorSlotCount = (() => {
    if (equippedArmorItems.length === 0) return rawArmorSlots.length;
    const sd = equippedArmorItems[0].systemData || {};
    let slots = sd.armorSlots ?? rawArmorSlots.length;
    if (slots === 6 && (sd.armorScore ?? 0) !== 6 && !hasFeatureName(sd.features, 'Fortified')) {
      slots = sd.armorScore || slots;
    }
    return slots > 0 ? slots : rawArmorSlots.length;
  })();
  const armorSlots = Array.from({ length: equippedArmorSlotCount }, (_, i) => rawArmorSlots[i] ?? false);

  const baseEffectiveArmorScore = useMemo(() => {
    if (equippedArmorItems.length === 0) return baseArmorScore;
    const maxFromEquipped = Math.max(...equippedArmorItems.map(a => a.systemData?.armorScore ?? 0));
    return Math.max(maxFromEquipped, baseArmorScore);
  }, [equippedArmorItems, baseArmorScore]);

  const baseEffectiveEvasion = useMemo(() => {
    let ev = baseEvasion;
    equippedArmorItems.forEach(armor => {
      const features = armor.systemData?.features || [];
      features.forEach(f => {
        const fl = getFeatureName(f).toLowerCase();
        if (fl === 'flexible') ev += 1;
        else if (fl === 'heavy') ev -= 1;
        else if (fl === 'very-heavy' || fl === 'very heavy') ev -= 2;
      });
    });
    return ev;
  }, [equippedArmorItems, baseEvasion]);

  // Damage thresholds per Daggerheart core rules (Ch. 2, p. 91 & 114):
  // - Armor prints two base numbers: Major base / Severe base (stored here as
  //   `thresholds.minor` and `thresholds.major` for historical reasons — the
  //   values are correct, only the field names are legacy).
  // - Final threshold = base + character level.
  // - Three damage tiers (Minor / Major / Severe) but only two threshold
  //   numbers act as "gates" between them, matching Demiplane's layout.
  // - Characters should always display thresholds. Fallback chain:
  //     1. Equipped armor item's systemData.thresholds + level
  //     2. Name-match against the predefined DAGGERHEART_ARMOR list + level
  //        (catches Demiplane imports and legacy custom armor missing the
  //        thresholds field)
  //     3. Character-level manual override (character.hpThresholds) — final
  //     4. Gambeson baseline (5 / 11) + level as a last-resort default
  const primaryArmor = equippedArmorItems[0];
  const manualThresholds = character.hpThresholds || {};
  const resolveArmorBases = (armor) => {
    if (!armor) return null;
    const t = armor.systemData?.thresholds;
    if (t && (t.minor > 0 || t.major > 0)) return { major: t.minor || 0, severe: t.major || 0 };
    if (armor.name) {
      const match = DAGGERHEART_ARMOR.find(a => a.name.toLowerCase() === armor.name.toLowerCase());
      if (match?.systemData?.thresholds) {
        return { major: match.systemData.thresholds.minor || 0, severe: match.systemData.thresholds.major || 0 };
      }
    }
    return null;
  };
  const armorBases = resolveArmorBases(primaryArmor);

  // Passive ability effects (Bare Bones, Vitality, Untouchable, ...) computed
  // before thresholds so abilities that REPLACE the base (Bare Bones) take
  // precedence over the armor/fallback baseline.
  const abilityDelta = useMemo(() => {
    const domainCardCounts = domainCards.reduce((acc, c) => {
      acc[c.domain] = (acc[c.domain] || 0) + 1;
      return acc;
    }, {});
    return computeAbilityDelta(domainCards, {
      hasEquippedArmor: equippedArmorItems.length > 0,
      tier: getTierForLevel(level),
      proficiency,
      traits,
      domainCardCounts,
    });
  }, [domainCards, equippedArmorItems, level, proficiency, traits]);

  let majorThreshold = 0;
  let severeThreshold = 0;
  if (abilityDelta.majorBaseSet != null || abilityDelta.severeBaseSet != null) {
    // Ability-set bases (e.g. Bare Bones) override armor / fallback entirely.
    majorThreshold = (abilityDelta.majorBaseSet ?? 0) + level;
    severeThreshold = (abilityDelta.severeBaseSet ?? 0) + level;
  } else if (armorBases && (armorBases.major > 0 || armorBases.severe > 0)) {
    majorThreshold = armorBases.major > 0 ? armorBases.major + level : 0;
    severeThreshold = armorBases.severe > 0 ? armorBases.severe + level : 0;
  } else if (manualThresholds.major > 0 || manualThresholds.severe > 0) {
    majorThreshold = manualThresholds.major || 0;
    severeThreshold = manualThresholds.severe || 0;
  } else {
    // Gambeson (tier 1) baseline so the sheet always shows usable numbers.
    majorThreshold = 5 + level;
    severeThreshold = 11 + level;
  }
  majorThreshold += abilityDelta.majorBonus;
  severeThreshold += abilityDelta.severeBonus;
  const massiveThreshold = severeThreshold > 0 ? severeThreshold * 2 : 0;

  // Armor-score and evasion with ability bonuses applied on top of the
  // armor/feature-derived baseline.
  const effectiveArmorScore = abilityDelta.armorScoreSet != null
    ? abilityDelta.armorScoreSet + abilityDelta.armorScoreBonus
    : baseEffectiveArmorScore + abilityDelta.armorScoreBonus;
  const effectiveEvasion = baseEffectiveEvasion + abilityDelta.evasionBonus;

  const hpFilledCount = hpSlots.filter(Boolean).length;
  const stressFilledCount = stressSlots.filter(Boolean).length;

  const handleGeneratePortrait = async () => {
    if (generatingPortrait) return;
    setGeneratingPortrait(true);
    try {
      const imageUrl = await generateCharacterPortrait(character, openaiKeyInfo?.key || null, campaign?.gameSystem || 'daggerheart', campaign?.id);
      if (imageUrl && updateCharacter) {
        updateCharacter(character.id, { avatarUrl: imageUrl });
      }
    } catch (err) {
      console.error('Portrait generation failed:', err);
    } finally {
      setGeneratingPortrait(false);
    }
  };

  const handleLevelUp = (updates) => {
    if (updateCharacter) {
      updateCharacter(character.id, updates);
    }
  };

  const TABS = useMemo(() => {
    const tabs = [
      { key: 'core', label: 'Core' },
      { key: 'abilities', label: 'Abilities' },
      { key: 'equipment', label: 'Equipment' },
      { key: 'backstory', label: 'Backstory' },
    ];
    if (isBeastbound && character.companion) {
      tabs.splice(2, 0, { key: 'companion', label: 'Companion' });
    }
    return tabs;
  }, [isBeastbound, character.companion]);

  // ─── Quick Roll Helpers ───
  const flashRoll = (key) => {
    setRollingKey(key);
    setTimeout(() => setRollingKey(null), 600);
  };

  // Apply the sticky Advantage/Hindrance bonus (if set) to a Daggerheart roll.
  // Consumes the bonus after one roll. Rolls a d6, adds/subtracts from modifier,
  // and tags the label so players can see the bonus in history.
  const applyRollBonus = (baseLabel, baseMod) => {
    if (!rollBonus) return { label: baseLabel, modifier: baseMod };
    const d6 = Math.floor(Math.random() * 6) + 1;
    const delta = rollBonus === 'advantage' ? d6 : -d6;
    const sign = rollBonus === 'advantage' ? '+' : '−';
    const label = `${baseLabel} (${sign}d6: ${d6})`;
    setRollBonus(null);
    return { label, modifier: baseMod + delta };
  };

  const handleAttributeRoll = async (traitName) => {
    const baseMod = traits[traitName] ?? 0;
    const baseLabel = `${traitName.charAt(0).toUpperCase() + traitName.slice(1)} Check`;
    const { label, modifier: mod } = applyRollBonus(baseLabel, baseMod);
    flashRoll(`attr-${traitName}`);
    const result = await roll({ label, modifier: mod });
    if (result) showRollResult(label, 'daggerheart', result);
  };

  const handleExperienceRoll = async (expName, expBonus, traitName) => {
    const traitMod = traits[traitName] ?? 0;
    const baseMod = traitMod + expBonus;
    const baseLabel = `${expName} (${TRAIT_ABBREV[traitName]})`;
    const { label, modifier: mod } = applyRollBonus(baseLabel, baseMod);
    flashRoll(`exp-${expName}`);
    setExpPickerActive(null);
    const result = await roll({ label, modifier: mod });
    if (result) showRollResult(label, 'daggerheart', result);
  };

  const handleWeaponAttack = async (weapon) => {
    const traitName = (weapon.systemData?.trait || '').toLowerCase();
    const traitMod = traits[traitName] ?? 0;
    const baseMod = traitMod;
    const baseLabel = `Attack: ${weapon.name}`;
    const { label, modifier: mod } = applyRollBonus(baseLabel, baseMod);
    flashRoll(`atk-${weapon.id}`);
    const result = await roll({ label, modifier: mod });
    if (result) showRollResult(label, 'daggerheart', result);
  };

  const handleReactionRoll = async () => {
    const label = 'Reaction Roll';
    flashRoll('reaction');
    const result = await roll({ label, modifier: 0 });
    if (result) showRollResult(label, 'daggerheart', result);
  };

  const handleWeaponDamage = async (weapon) => {
    const dmgStr = getWeaponDamage(weapon, level, proficiency);
    const parsed = parseDamageString(dmgStr);
    if (!parsed) return;
    const label = `Damage: ${weapon.name}`;
    flashRoll(`dmg-${weapon.id}`);
    const result = await rollDamage({ label, ...parsed });
    if (result) showRollResult(label, 'generic', result);
  };

  const handleSpellcastRoll = async (card) => {
    const baseLabel = `Spellcast: ${card.name}`;
    const { label, modifier: mod } = applyRollBonus(baseLabel, 0);
    flashRoll(`spell-${card.name}`);
    const result = await roll({ label, modifier: mod });
    if (result) showRollResult(label, 'daggerheart', result);
  };

  const handleAbilityDiceRoll = async (card, parsed) => {
    const label = `${card.name}`;
    flashRoll(`card-${card.name}`);
    const result = await rollDamage({ label, ...parsed });
    if (result) showRollResult(label, 'generic', result);
  };

  // ─── Sidebar ───
  const renderSidebar = () => (
    <div className="dh-sidebar">
      {/* Avatar */}
      <div className="dh-sidebar-avatar">
        {character.avatarUrl ? (
          <img src={character.avatarUrl} alt={character.name} />
        ) : (
          <div className="dh-sidebar-avatar-placeholder">
            {character.name.charAt(0)}
          </div>
        )}
        {canEdit && (
          <button
            className="dh-sidebar-generate-portrait"
            onClick={handleGeneratePortrait}
            disabled={generatingPortrait}
            title="Generate AI Portrait"
          >
            <Wand2 size={12} />
            {generatingPortrait ? 'Generating...' : 'Generate'}
          </button>
        )}
      </div>

      {/* Name & Info */}
      <div className="dh-sidebar-identity">
        <div className="dh-sidebar-name">{character.name}</div>
        <div className="dh-sidebar-subtitle">
          Lv {level}{subtitleParts.length > 0 && ` · ${subtitleParts.join(' · ')}`}
        </div>
        {character.multiclass && (
          <div className="dh-sidebar-multiclass">
            + {character.multiclass.class} ({character.multiclass.subclass})
          </div>
        )}
        {community && <div className="dh-sidebar-community">{community}</div>}
        <div className="dh-sidebar-proficiency">Proficiency +{proficiency}</div>
        <div className="dh-sidebar-player">{character.playerName || 'Unknown Player'}</div>
      </div>

      {/* Vitals */}
      <div className="dh-sidebar-vitals">
        {/* Hope */}
        <div className="dh-sidebar-vital-group">
          <div className="dh-sidebar-vital-header">
            <span className="dh-sidebar-vital-label">Hope</span>
            <span className="dh-sidebar-vital-count">{hopeSlots.filter(Boolean).length}/{hopeSlots.length}</span>
          </div>
          <div className="dh-sidebar-slots">
            {hopeSlots.map((filled, i) => (
              <button
                key={i}
                className={`dh-slot dh-slot-hope ${filled ? 'filled' : ''}`}
                onClick={() => handleSlotToggle('hopeSlots', i)}
                disabled={!canEdit}
              />
            ))}
          </div>
        </div>

        {/* HP */}
        <div className="dh-sidebar-vital-group">
          <div className="dh-sidebar-vital-header">
            <span className="dh-sidebar-vital-label">Hit Points</span>
            <span className="dh-sidebar-vital-count">{hpFilledCount}/{hpSlots.length}</span>
          </div>
          <div className="dh-sidebar-slots">
            {hpSlots.map((filled, i) => (
              <button
                key={i}
                className={`dh-slot dh-slot-hp ${filled ? 'filled' : ''}`}
                onClick={() => handleSlotToggle('hpSlots', i)}
                disabled={!canEdit}
              />
            ))}
          </div>
        </div>

        {/* Stress */}
        <div className="dh-sidebar-vital-group">
          <div className="dh-sidebar-vital-header">
            <span className="dh-sidebar-vital-label">Stress</span>
            <span className="dh-sidebar-vital-count">{stressFilledCount}/{stressSlots.length}</span>
          </div>
          <div className="dh-sidebar-slots">
            {stressSlots.map((filled, i) => (
              <button
                key={i}
                className={`dh-slot dh-slot-stress ${filled ? 'filled' : ''}`}
                onClick={() => handleSlotToggle('stressSlots', i)}
                disabled={!canEdit}
              />
            ))}
          </div>
        </div>

        {/* Armor Slots */}
        <div className="dh-sidebar-vital-group">
          <div className="dh-sidebar-vital-header">
            <span className="dh-sidebar-vital-label">
              Armor{equippedArmorItems.length > 0 ? ` · ${equippedArmorItems[0].name}` : ''}
            </span>
            <span className="dh-sidebar-vital-count">
              {armorSlots.filter(Boolean).length}/{armorSlots.length}
              {effectiveArmorScore > 0 ? ` (${effectiveArmorScore})` : ''}
            </span>
          </div>
          <div className="dh-sidebar-slots">
            {armorSlots.map((filled, i) => (
              <button
                key={i}
                className={`dh-slot dh-slot-armor ${filled ? 'filled' : ''}`}
                onClick={() => handleSlotToggle('armorSlots', i)}
                disabled={!canEdit}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="dh-sidebar-actions">
        {canEdit && level < 10 && (
          <button className="dh-btn dh-btn-levelup" onClick={() => setShowLevelUp(true)}>
            <ArrowUp size={14} /> Level Up
          </button>
        )}
        {character.demiplaneLink && (
          <a href={character.demiplaneLink} target="_blank" rel="noopener noreferrer" className="dh-link dh-sidebar-link">
            <ExternalLink size={14} />
            Demiplane
          </a>
        )}
        {canEdit && (
          <div className="dh-sidebar-buttons">
            <button className="dh-btn" onClick={onEdit}>
              <Edit3 size={14} /> Edit
            </button>
            <button className="dh-btn dh-btn-danger" onClick={onDelete}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Core Tab ───
  const renderCoreTab = () => (
    <div className="dh-tab-content">
      {/* Quick-roll controls: Reaction roll + Advantage/Hindrance toggle.
          Toggle is sticky — the next trait/attack/experience roll consumes it. */}
      {campaign?.id && (
        <div className="dh-quickroll-bar">
          <button
            className={`dh-quickroll-btn dh-quickroll-reaction ${rollingKey === 'reaction' ? 'dh-roll-flash' : ''}`}
            onClick={handleReactionRoll}
            title="Reaction roll (2d12 Hope/Fear, no modifier)"
          >
            <Dices size={12} /> Reaction Roll
          </button>
          <div className="dh-quickroll-toggle">
            <span className="dh-quickroll-toggle-label">Next roll:</span>
            <button
              type="button"
              className={`dh-quickroll-chip adv ${rollBonus === 'advantage' ? 'active' : ''}`}
              onClick={() => setRollBonus(rollBonus === 'advantage' ? null : 'advantage')}
              title="Add +1d6 to the next trait/attack/experience roll"
            >
              +d6 Advantage
            </button>
            <button
              type="button"
              className={`dh-quickroll-chip hind ${rollBonus === 'hindrance' ? 'active' : ''}`}
              onClick={() => setRollBonus(rollBonus === 'hindrance' ? null : 'hindrance')}
              title="Subtract 1d6 from the next trait/attack/experience roll"
            >
              −d6 Hindrance
            </button>
          </div>
        </div>
      )}

      {/* Attribute Circles */}
      <div className="dh-section-label">Attributes</div>
      <div className="dh-attributes-row">
        {Object.entries(traits).map(([name, value]) => (
          <button
            key={name}
            className={`dh-attribute-circle dh-attribute-rollable ${traitClass(value)} ${rollingKey === `attr-${name}` ? 'dh-roll-flash' : ''}`}
            onClick={() => campaign?.id && handleAttributeRoll(name)}
            title={`Roll ${name.charAt(0).toUpperCase() + name.slice(1)} Check (${formatTraitValue(value)})`}
          >
            <span className="dh-attribute-abbrev">{TRAIT_ABBREV[name] || name.slice(0, 3).toUpperCase()}</span>
            <span className="dh-attribute-value">{formatTraitValue(value)}</span>
            <Dices size={10} className="dh-attribute-roll-icon" />
          </button>
        ))}
      </div>

      {/* Evasion / Armor / Prof strip */}
      <div className="dh-section-label">Defenses</div>
      <div className="dh-thresholds-row">
        <div className="dh-threshold-box dh-threshold-evasion">
          <div className="dh-threshold-value">{effectiveEvasion}</div>
          <div className="dh-threshold-label">Evasion</div>
        </div>
        {effectiveArmorScore > 0 && (
          <div className="dh-threshold-box dh-threshold-armor">
            <div className="dh-threshold-value">{effectiveArmorScore}</div>
            <div className="dh-threshold-label">Armor</div>
          </div>
        )}
        <div className="dh-threshold-box dh-threshold-prof">
          <div className="dh-threshold-value">+{proficiency}</div>
          <div className="dh-threshold-label">Prof</div>
        </div>
      </div>

      {/* Damage Thresholds — gate layout matching the Daggerheart sheet:
          [Minor Damage]  (Major#)  [Major Damage]  (Severe#)  [Severe Damage]
          The numbers sit between the tiers as the "gates" that decide how
          many HP a hit marks. */}
      <div className="dh-section-label">Damage Thresholds</div>
      <div className="dh-damage-thresholds">
        <div className="dh-damage-tier dh-damage-minor" title="Minor damage: mark 1 HP">
          <div className="dh-damage-tier-label">Minor Damage</div>
          <div className="dh-damage-tier-hp">Mark 1 HP</div>
        </div>
        <div
          className="dh-damage-gate"
          title={`Major damage threshold: ${majorThreshold > 0 ? `≥ ${majorThreshold} marks 2 HP` : 'not set'}`}
        >
          <div className="dh-damage-gate-value">{majorThreshold > 0 ? majorThreshold : '—'}</div>
        </div>
        <div className="dh-damage-tier dh-damage-major" title="Major damage: mark 2 HP">
          <div className="dh-damage-tier-label">Major Damage</div>
          <div className="dh-damage-tier-hp">Mark 2 HP</div>
        </div>
        <div
          className="dh-damage-gate"
          title={`Severe damage threshold: ${severeThreshold > 0 ? `≥ ${severeThreshold} marks 3 HP` : 'not set'}${massiveThreshold > 0 ? ` · Massive (optional, 4 HP) at ≥ ${massiveThreshold}` : ''}`}
        >
          <div className="dh-damage-gate-value">{severeThreshold > 0 ? severeThreshold : '—'}</div>
        </div>
        <div className="dh-damage-tier dh-damage-severe" title="Severe damage: mark 3 HP">
          <div className="dh-damage-tier-label">Severe Damage</div>
          <div className="dh-damage-tier-hp">Mark 3 HP</div>
        </div>
      </div>

      {/* Experiences */}
      {experiences.length > 0 && (
        <>
          <div className="dh-section-label">Experiences</div>
          <div className="dh-experiences-list">
            {experiences.map((exp, i) => {
              const boost = (character.experienceBoosts || {})[exp] || 0;
              const bonus = 2 + boost;
              const isPickerOpen = expPickerActive === exp;
              return (
                <div key={i} className={`dh-experience-card dh-experience-rollable ${rollingKey === `exp-${exp}` ? 'dh-roll-flash' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <span className="dh-experience-name">{exp}</span>
                  <span className="dh-experience-mod">+{bonus}</span>
                  {campaign?.id && (
                    <button
                      className="dh-exp-roll-btn"
                      title="Roll with this experience — pick a trait"
                      onClick={(e) => { e.stopPropagation(); setExpPickerActive(isPickerOpen ? null : exp); }}
                    >
                      <Dices size={11} />
                    </button>
                  )}
                  {isPickerOpen && (
                    <div className="dh-exp-trait-picker" onClick={e => e.stopPropagation()}>
                      <div className="dh-exp-trait-picker-label">Pick trait to pair with</div>
                      <div className="dh-exp-trait-picker-row">
                        {Object.entries(traits).map(([tName, tVal]) => (
                          <button
                            key={tName}
                            className="dh-exp-trait-btn"
                            title={`Roll: ${TRAIT_ABBREV[tName]} ${formatTraitValue(tVal)} + Exp ${bonus >= 0 ? `+${bonus}` : bonus}`}
                            onClick={() => handleExperienceRoll(exp, bonus, tName)}
                          >
                            <span>{TRAIT_ABBREV[tName]}</span>
                            <span>{formatTraitValue(tVal)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Domains */}
      {(primaryDomain || secondaryDomain) && (
        <>
          <div className="dh-section-label">Domains</div>
          <div className="dh-badges-row">
            {primaryDomain && (
              <span className="dh-domain-badge">
                <Sparkles size={10} /> {primaryDomain}
              </span>
            )}
            {secondaryDomain && (
              <span className="dh-domain-badge">{secondaryDomain}</span>
            )}
          </div>
          {character.multiclass?.domain && (
            <span className="dh-domain-badge dh-domain-multiclass">{character.multiclass.domain} (MC)</span>
          )}
          {domainNotes && <div className="dh-domain-notes">{domainNotes}</div>}
        </>
      )}

      {/* Beastform (Druid only) */}
      {isDruid && (
        <BeastformPanel character={character} canEdit={canEdit} updateCharacter={updateCharacter} />
      )}

      {/* Active Weapons */}
      <div className="dh-section-label">Active Weapons</div>
      <div className="dh-weapons-grid">
        {equippedWeapons.map(weapon => {
          const sd = weapon.systemData || {};
          const dmg = getWeaponDamage(weapon, level, proficiency);
          const tier = getTierForLevel(level);
          const traitName = (sd.trait || '').toLowerCase();
          const traitMod = traits[traitName] ?? 0;
          const atkModTotal = traitMod;
          return (
            <div key={weapon.id} className="dh-weapon-card">
              <div className="dh-weapon-card-header">
                <Sword size={16} className="dh-weapon-icon" />
                <span className="dh-weapon-name">{weapon.name}</span>
                <span className="dh-item-tier">T{tier}</span>
              </div>
              <div className="dh-weapon-stats">
                {sd.trait && <span>{sd.trait}</span>}
                {sd.range && <span>{sd.range}</span>}
                {dmg && <span>{dmg}</span>}
                {sd.damageType && <span>{sd.damageType}</span>}
                {sd.burden && <span>{sd.burden}</span>}
              </div>
              {sd.features?.length > 0 && (
                <div className="dh-weapon-features">
                  {sd.features.map((f, i) => {
                    const fname = getFeatureName(f);
                    if (!fname) return null;
                    return (
                      <span key={i} className="dh-weapon-feature-badge">
                        {fname}
                      </span>
                    );
                  })}
                </div>
              )}
              {sd.features?.some(f => getFeatureDescription(f)) && (
                <div className="dh-item-custom-features">
                  {sd.features.filter(f => getFeatureDescription(f)).map((f, i) => (
                    <div key={i} className="dh-item-custom-feature">
                      <span className="dh-item-custom-feature-name">{getFeatureName(f)}:</span>
                      {' '}{getFeatureDescription(f)}
                    </div>
                  ))}
                </div>
              )}
              {weapon.description && (
                <div className="dh-weapon-description">{weapon.description}</div>
              )}
              {campaign?.id && (
                <div className="dh-weapon-roll-row">
                  <button
                    className={`dh-weapon-roll-btn dh-weapon-roll-atk ${rollingKey === `atk-${weapon.id}` ? 'dh-roll-flash' : ''}`}
                    onClick={() => handleWeaponAttack(weapon)}
                    title={`Attack roll: ${sd.trait || '?'} ${formatTraitValue(atkModTotal)}`}
                  >
                    <Dices size={12} /> Attack
                  </button>
                  {dmg && (
                    <button
                      className={`dh-weapon-roll-btn dh-weapon-roll-dmg ${rollingKey === `dmg-${weapon.id}` ? 'dh-roll-flash' : ''}`}
                      onClick={() => handleWeaponDamage(weapon)}
                      title={`Damage roll: ${dmg}`}
                    >
                      <Sword size={12} /> {dmg}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {equippedWeapons.length === 0 && (
          <div className="dh-weapon-card dh-weapon-card-empty">
            <Sword size={16} className="dh-weapon-icon" style={{ opacity: 0.4 }} />
            <span className="dh-empty">No weapons equipped. Equip one from the campaign catalog in character settings.</span>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Abilities Tab ───
  const renderAbilitiesTab = () => {
    const classFeatures = classData?.classFeatures || [];
    const hopeFeature = classData?.hopeFeature;
    // Multiclass subclass info
    const mcSubclassInfo = character.multiclass && SUBCLASSES[character.multiclass.class]
      ? SUBCLASSES[character.multiclass.class].find(s => s.name === character.multiclass.subclass)
      : null;

    const hasSlayer = subclassInfo?.name === 'Call of the Slayer'
      || mcSubclassInfo?.name === 'Call of the Slayer';

    const slayerDiceTracker = hasSlayer && (
      <div className="dh-feature-tracker">
        <div className="dh-feature-tracker-label">Slayer Dice</div>
        <div className="dh-feature-tracker-controls">
          <button
            className="dh-tracker-btn"
            onClick={() => handleSlayerDiceAdjust(-1, proficiency)}
            disabled={!canEdit || slayerDice <= 0}
            aria-label="Remove a Slayer Die"
          >−</button>
          <div className="dh-tracker-count">
            <span className="dh-tracker-current">{slayerDice}</span>
            <span className="dh-tracker-max">/ {proficiency}</span>
          </div>
          <button
            className="dh-tracker-btn"
            onClick={() => handleSlayerDiceAdjust(1, proficiency)}
            disabled={!canEdit || slayerDice >= proficiency}
            aria-label="Add a Slayer Die"
          >+</button>
          <button
            className="dh-tracker-btn dh-tracker-clear"
            onClick={() => handleSlayerDiceAdjust(-slayerDice, proficiency)}
            disabled={!canEdit || slayerDice === 0}
            title="Clear all Slayer Dice (end of session)"
          >Clear</button>
        </div>
      </div>
    );

    return (
    <div className="dh-tab-content">
      {/* Class Features */}
      {(classFeatures.length > 0 || hopeFeature) && (
        <div className="dh-ability-section">
          <div className="dh-section-label">{charClass} Features</div>
          {hopeFeature && (
            <div className="dh-feature-card dh-feature-hope">
              <div className="dh-feature-tag">Hope Feature</div>
              <div className="dh-feature-name">{hopeFeature.name}</div>
              <div className="dh-feature-desc">{hopeFeature.description}</div>
            </div>
          )}
          {classFeatures.map((f, i) => (
            <div key={i} className="dh-feature-card">
              <div className="dh-feature-name">{f.name}</div>
              <div className="dh-feature-desc">{f.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Subclass Features — show all unlocked levels */}
      {subclassInfo && (
        <div className="dh-ability-section">
          <div className="dh-section-label">{subclassInfo.name}</div>
          {subclassInfo.foundation && (
            <div className="dh-feature-card">
              <div className="dh-feature-tag">Foundation</div>
              <div className="dh-feature-name">{subclassInfo.foundation.name}</div>
              <div className="dh-feature-desc">{subclassInfo.foundation.description}</div>
              {subclassInfo.name === 'Call of the Slayer' && slayerDiceTracker}
            </div>
          )}
          {(subclassLevel === 'specialization' || subclassLevel === 'mastery') && subclassInfo.specialization && (
            <div className="dh-feature-card">
              <div className="dh-feature-tag">Specialization</div>
              <div className="dh-feature-name">{subclassInfo.specialization.name}</div>
              <div className="dh-feature-desc">{subclassInfo.specialization.description}</div>
            </div>
          )}
          {subclassLevel === 'mastery' && subclassInfo.mastery && (
            <div className="dh-feature-card">
              <div className="dh-feature-tag">Mastery</div>
              <div className="dh-feature-name">{subclassInfo.mastery.name}</div>
              <div className="dh-feature-desc">{subclassInfo.mastery.description}</div>
            </div>
          )}
        </div>
      )}

      {/* Multiclass Foundation */}
      {mcSubclassInfo?.foundation && (
        <div className="dh-ability-section">
          <div className="dh-section-label">{character.multiclass.class} — {mcSubclassInfo.name} (Multiclass)</div>
          <div className="dh-feature-card">
            <div className="dh-feature-tag">Foundation</div>
            <div className="dh-feature-name">{mcSubclassInfo.foundation.name}</div>
            <div className="dh-feature-desc">{mcSubclassInfo.foundation.description}</div>
            {mcSubclassInfo.name === 'Call of the Slayer' && slayerDiceTracker}
          </div>
        </div>
      )}

      {/* Heritage Features */}
      {hasHeritage && (
        <div className="dh-ability-section">
          <div className="dh-section-label">
            <Users size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
            Heritage Features
          </div>
          <div className="dh-features-list">
            {ancestryFeatures.map((f, i) => (
              <div key={`a-${i}`} className="dh-feature-card">
                <div className="dh-feature-tag">Ancestry — {ancestry}</div>
                <div className="dh-feature-name">{f.name}</div>
                <div className="dh-feature-desc">{f.description}</div>
              </div>
            ))}
            {communityFeatures.map((f, i) => (
              <div key={`c-${i}`} className="dh-feature-card">
                <div className="dh-feature-tag">Community — {community}</div>
                <div className="dh-feature-name">{f.name}</div>
                <div className="dh-feature-desc">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Cards */}
      {domainCards.length > 0 && (
        <div className="dh-ability-section">
          <div className="dh-section-label">
            <BookOpen size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
            Domain Cards ({domainCards.length})
          </div>
          <div className="dh-domain-cards-content">
            {Object.entries(domainCardsGrouped).map(([domain, cards]) => (
              <div key={domain} className="dh-domain-cards-group">
                <div className="dh-domain-cards-group-label">{domain}</div>
                <div className="dh-domain-cards-grid">
                  {cards.map(card => {
                    const isSpell = card.type === 'Spell';
                    const diceParsed = extractCardDice(card.description);
                    const diceLabel = diceParsed
                      ? `${diceParsed.quantity}d${diceParsed.dieType}${diceParsed.modifier > 0 ? `+${diceParsed.modifier}` : ''}`
                      : null;
                    return (
                      <div key={card.name} className="dh-domain-card">
                        <div className="dh-domain-card-header">
                          <span className="dh-domain-card-name">{card.name}</span>
                          <div className="dh-domain-card-badges">
                            {card.type && (
                              <span className={`dh-domain-card-type dh-card-type-${card.type.toLowerCase()}`}>
                                {card.type}
                              </span>
                            )}
                            <span className="dh-domain-card-level">Lv {card.level}</span>
                          </div>
                        </div>
                        <div className="dh-domain-card-desc">{card.description}</div>
                        {campaign?.id && (isSpell || diceLabel) && (
                          <div className="dh-weapon-roll-row" style={{ marginTop: '0.5rem' }}>
                            {isSpell && (
                              <button
                                className={`dh-weapon-roll-btn dh-ability-roll-cast ${rollingKey === `spell-${card.name}` ? 'dh-roll-flash' : ''}`}
                                onClick={() => handleSpellcastRoll(card)}
                                title="Spellcast Roll (2d12 — add your Spellcast trait)"
                              >
                                <Sparkles size={12} /> Cast
                              </button>
                            )}
                            {diceLabel && (
                              <button
                                className={`dh-weapon-roll-btn dh-ability-roll-dice ${rollingKey === `card-${card.name}` ? 'dh-roll-flash' : ''}`}
                                onClick={() => handleAbilityDiceRoll(card, diceParsed)}
                                title={`Roll ${diceLabel}`}
                              >
                                <Dices size={12} /> {diceLabel}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!subclassInfo && !hasHeritage && domainCards.length === 0 && !classFeatures.length && (
        <div className="dh-empty-tab">No abilities configured yet.</div>
      )}
    </div>
    );
  };

  // ─── Equipment Tab ───
  const renderEquipmentTab = () => (
    <div className="dh-tab-content">
      {/* Equipped Weapons */}
      {equippedWeapons.length > 0 && (
        <div className="dh-equip-section">
          <div className="dh-section-label">Weapons</div>
          {equippedWeapons.map(weapon => {
            const sd = weapon.systemData || {};
            const dmg = getWeaponDamage(weapon, level, proficiency);
            const tier = getTierForLevel(level);
            const traitName = (sd.trait || '').toLowerCase();
            const traitMod = traits[traitName] ?? 0;
            const atkModTotal = traitMod;
            return (
              <div key={weapon.id} className="dh-equipped-item">
                <Sword size={14} className="dh-equipped-item-icon" />
                <div style={{ flex: 1 }}>
                  <div className="dh-equipped-item-header">
                    <span className="dh-equipped-item-name">{weapon.name}</span>
                    <span className="dh-item-tier">T{tier}</span>
                  </div>
                  <div className="dh-equipped-item-stats">
                    {sd.trait && <span>{sd.trait}</span>}
                    {sd.range && <span>{sd.range}</span>}
                    {dmg && <span>{dmg}</span>}
                    {sd.damageType && <span>{sd.damageType}</span>}
                    {sd.burden && <span>{sd.burden}</span>}
                  </div>
                  {sd.features?.length > 0 && (
                    <div className="dh-weapon-features">
                      {sd.features.map((f, i) => {
                        const fname = getFeatureName(f);
                        if (!fname) return null;
                        return <span key={i} className="dh-weapon-feature-badge">{fname}</span>;
                      })}
                    </div>
                  )}
                  {sd.features?.some(f => getFeatureDescription(f)) && (
                    <div className="dh-item-custom-features">
                      {sd.features.filter(f => getFeatureDescription(f)).map((f, i) => (
                        <div key={i} className="dh-item-custom-feature">
                          <span className="dh-item-custom-feature-name">{getFeatureName(f)}:</span>
                          {' '}{getFeatureDescription(f)}
                        </div>
                      ))}
                    </div>
                  )}
                  {weapon.description && (
                    <div className="dh-weapon-description">{weapon.description}</div>
                  )}
                  {campaign?.id && (
                    <div className="dh-weapon-roll-row" style={{ marginTop: '0.4rem' }}>
                      <button
                        className={`dh-weapon-roll-btn dh-weapon-roll-atk ${rollingKey === `atk-${weapon.id}` ? 'dh-roll-flash' : ''}`}
                        onClick={() => handleWeaponAttack(weapon)}
                        title={`Attack: ${sd.trait || '?'} ${formatTraitValue(atkModTotal)}`}
                      >
                        <Dices size={12} /> Attack
                      </button>
                      {dmg && (
                        <button
                          className={`dh-weapon-roll-btn dh-weapon-roll-dmg ${rollingKey === `dmg-${weapon.id}` ? 'dh-roll-flash' : ''}`}
                          onClick={() => handleWeaponDamage(weapon)}
                          title={`Damage: ${dmg}`}
                        >
                          <Sword size={12} /> {dmg}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Equipped Armor */}
      {equippedArmorItems.length > 0 && (
        <div className="dh-equip-section">
          <div className="dh-section-label">Armor</div>
          {equippedArmorItems.map(armor => {
            const sd = armor.systemData || {};
            return (
              <div key={armor.id} className="dh-equipped-item">
                <Shield size={14} className="dh-equipped-item-icon" />
                <div>
                  <div className="dh-equipped-item-header">
                    <span className="dh-equipped-item-name">{armor.name}</span>
                    {sd.tier != null && <span className="dh-item-tier">T{sd.tier}</span>}
                  </div>
                  <div className="dh-equipped-item-stats">
                    {sd.armorScore != null && <span>Score {sd.armorScore}</span>}
                    {sd.armorSlots != null && <span>{sd.armorSlots} slots</span>}
                  </div>
                  {sd.features?.length > 0 && (
                    <div className="dh-weapon-features">
                      {sd.features.map((f, i) => {
                        const fname = getFeatureName(f);
                        if (!fname) return null;
                        return <span key={i} className="dh-weapon-feature-badge">{fname}</span>;
                      })}
                    </div>
                  )}
                  {sd.features?.some(f => getFeatureDescription(f)) && (
                    <div className="dh-item-custom-features">
                      {sd.features.filter(f => getFeatureDescription(f)).map((f, i) => (
                        <div key={i} className="dh-item-custom-feature">
                          <span className="dh-item-custom-feature-name">{getFeatureName(f)}:</span>
                          {' '}{getFeatureDescription(f)}
                        </div>
                      ))}
                    </div>
                  )}
                  {armor.description && (
                    <div className="dh-weapon-description">{armor.description}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Equipped Equipment */}
      {equippedEquipment.length > 0 && (
        <div className="dh-equip-section">
          <div className="dh-section-label">Equipment</div>
          {equippedEquipment.map(eq => {
            const sd = eq.systemData || {};
            return (
              <div key={eq.id} className="dh-equipped-item">
                <Star size={14} className="dh-equipped-item-icon" />
                <div style={{ flex: 1 }}>
                  <div className="dh-equipped-item-name">{eq.name}</div>
                  {sd.mechanicalEffect && <div className="dh-equipped-item-stats">{sd.mechanicalEffect}</div>}
                  {sd.features?.length > 0 && (
                    <div className="dh-weapon-features">
                      {sd.features.map((f, i) => {
                        const fname = getFeatureName(f);
                        if (!fname) return null;
                        return <span key={i} className="dh-weapon-feature-badge">{fname}</span>;
                      })}
                    </div>
                  )}
                  {sd.features?.some(f => getFeatureDescription(f)) && (
                    <div className="dh-item-custom-features">
                      {sd.features.filter(f => getFeatureDescription(f)).map((f, i) => (
                        <div key={i} className="dh-item-custom-feature">
                          <span className="dh-item-custom-feature-name">{getFeatureName(f)}:</span>
                          {' '}{getFeatureDescription(f)}
                        </div>
                      ))}
                    </div>
                  )}
                  {eq.description && (
                    <div className="dh-weapon-description">{eq.description}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inventory */}
      <div className="dh-equip-section">
        <div className="dh-section-label">Inventory</div>
        <div className="dh-inventory-text">{inventoryText || <span className="dh-empty">Empty</span>}</div>
      </div>

      {/* Gold */}
      <div className="dh-gold-row">
        <div className="dh-counter dh-counter-gold">
          <Star size={14} className="dh-counter-icon" />
          <span>{gold} Gold</span>
        </div>
      </div>
    </div>
  );

  // ─── Backstory Tab ───
  const renderBackstoryTab = () => (
    <div className="dh-tab-content">
      {character.backstory && (
        <div className="dh-narrative-block">
          <div className="dh-section-label">Backstory</div>
          <div className="dh-narrative-text">{character.backstory}</div>
        </div>
      )}

      {character.playerNotes && (
        <div className="dh-narrative-block">
          <div className="dh-section-label">Player Notes</div>
          <div className="dh-narrative-text">{character.playerNotes}</div>
        </div>
      )}

      {isDM && character.dmNotes && (
        <div className="dh-narrative-block">
          <div className="dh-section-label">DM Notes (Private)</div>
          <div className="dh-narrative-text">{character.dmNotes}</div>
        </div>
      )}

      {!character.backstory && !character.playerNotes && !(isDM && character.dmNotes) && (
        <div className="dh-empty-tab">No backstory or notes added yet.</div>
      )}
    </div>
  );

  // ─── Companion Tab ───
  const renderCompanionTab = () => (
    <div className="dh-tab-content">
      <CompanionSheet character={character} canEdit={canEdit} updateCharacter={updateCharacter} />
    </div>
  );

  return (
    <div className="dh-sheet">
      <div className="dh-layout">
        {renderSidebar()}

        <div className="dh-main">
          {/* Tab Bar */}
          <div className="dh-tab-bar">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`dh-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="dh-tab-panel">
            {activeTab === 'core' && renderCoreTab()}
            {activeTab === 'abilities' && renderAbilitiesTab()}
            {activeTab === 'companion' && renderCompanionTab()}
            {activeTab === 'equipment' && renderEquipmentTab()}
            {activeTab === 'backstory' && renderBackstoryTab()}
          </div>
        </div>
      </div>

      {/* Roll Result Overlay (portaled to body to escape transformed/blurred ancestors) */}
      {lastRoll && createPortal(
        <div className={`dh-roll-result-overlay ${lastRoll.type === 'generic' ? 'dh-roll-result-damage' : lastRoll.outcome}`}>
          <button className="dh-roll-result-dismiss" onClick={() => { clearTimeout(rollResultTimer.current); setLastRoll(null); }}>×</button>
          <div className="dh-roll-result-label">{lastRoll.label}</div>

          {lastRoll.type === 'daggerheart' ? (
            <>
              <div className="dh-roll-result-dice-row">
                <div className={`dh-roll-die dh-roll-die-hope ${lastRoll.outcome === 'hope' ? 'dh-die-winner' : ''}`}>
                  <span className="dh-roll-die-label">Hope</span>
                  <span className="dh-roll-die-val">{lastRoll.hopeDie}</span>
                </div>
                <span className="dh-roll-die-vs">vs</span>
                <div className={`dh-roll-die dh-roll-die-fear ${lastRoll.outcome === 'fear' ? 'dh-die-winner' : ''}`}>
                  <span className="dh-roll-die-label">Fear</span>
                  <span className="dh-roll-die-val">{lastRoll.fearDie}</span>
                </div>
                {lastRoll.modifier !== 0 && (
                  <span className="dh-roll-modifier">{lastRoll.modifier >= 0 ? '+' : ''}{lastRoll.modifier}</span>
                )}
              </div>
              <div className="dh-roll-result-total">{lastRoll.total}</div>
              <div className={`dh-roll-result-outcome ${lastRoll.outcome}`}>
                {lastRoll.outcome === 'hope' ? '✨ With Hope' : '💀 With Fear'}
                {lastRoll.isDoubles && <span className="dh-roll-doubles"> · Critical!</span>}
              </div>
            </>
          ) : (
            <>
              <div className="dh-roll-result-dice-row dh-roll-generic-dice">
                {lastRoll.rolls?.map((r, i) => (
                  <div key={i} className="dh-roll-die dh-roll-die-dmg">
                    <span className="dh-roll-die-label">d{lastRoll.dieType}</span>
                    <span className="dh-roll-die-val">{typeof r === 'object' ? r.result : r}</span>
                  </div>
                ))}
                {lastRoll.modifier !== 0 && (
                  <span className="dh-roll-modifier">{lastRoll.modifier >= 0 ? '+' : ''}{lastRoll.modifier}</span>
                )}
              </div>
              <div className="dh-roll-result-total">{lastRoll.total}</div>
            </>
          )}
        </div>,
        document.body
      )}

      {/* Level Up Wizard Modal */}
      {showLevelUp && (
        <LevelUpWizard
          character={character}
          items={items}
          onComplete={handleLevelUp}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </div>
  );
}
