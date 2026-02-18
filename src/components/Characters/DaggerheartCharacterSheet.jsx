import { useState, useEffect, useMemo } from 'react';
import { Edit3, Trash2, ExternalLink, Sword, Shield, Star, Sparkles, BookOpen, Users } from 'lucide-react';
import { CLASSES, SUBCLASSES, ANCESTRIES, COMMUNITIES } from '../../data/systems/daggerheart';
import { getCardByName } from '../../data/daggerheartDomainCards';
import './DaggerheartCharacterSheet.css';

const DEFAULT_TRAITS = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
const DEFAULT_HP = [true, true, true, true, true, true];
const DEFAULT_STRESS = [false, false, false, false, false, false];
const DEFAULT_ARMOR_SLOTS = [false, false, false, false, false, false];
const DEFAULT_HOPE_SLOTS = [false, false, false, false, false, false];

const TRAIT_ABBREV = {
  agility: 'AGI', strength: 'STR', finesse: 'FIN',
  instinct: 'INS', presence: 'PRE', knowledge: 'KNO'
};

const getTierForLevel = (level) => {
  if (level <= 4) return 1;
  if (level <= 7) return 2;
  if (level <= 9) return 3;
  return 4;
};

const getWeaponDamage = (weapon, level) => {
  const sd = weapon.systemData;
  if (!sd) return null;
  const tier = getTierForLevel(level);
  const dice = sd[`damageTier${tier}Dice`];
  const mod = sd[`damageTier${tier}Modifier`];
  if (!dice) return null;
  return mod ? `${dice}+${mod}` : dice;
};

export default function DaggerheartCharacterSheet({ character, onEdit, onDelete, isDM, canEdit, campaign, updateCharacter, items }) {
  const [localHp, setLocalHp] = useState(null);
  const [localStress, setLocalStress] = useState(null);
  const [localArmor, setLocalArmor] = useState(null);
  const [localHope, setLocalHope] = useState(null);
  const [activeTab, setActiveTab] = useState('core');

  useEffect(() => {
    setLocalHp(null);
    setLocalStress(null);
    setLocalArmor(null);
    setLocalHope(null);
  }, [character.hpSlots, character.stressSlots, character.armorSlots, character.hopeSlots]);

  const hpSlots = localHp || character.hpSlots || DEFAULT_HP;
  const stressSlots = localStress || character.stressSlots || DEFAULT_STRESS;
  const armorSlots = localArmor || character.armorSlots || DEFAULT_ARMOR_SLOTS;
  const hopeSlots = localHope || character.hopeSlots || DEFAULT_HOPE_SLOTS;
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

  const formatTraitValue = (val) => val > 0 ? `+${val}` : `${val}`;
  const traitClass = (val) => val > 0 ? 'positive' : val < 0 ? 'negative' : 'zero';

  const charClass = character.class || '';
  const subclass = character.subclass || '';
  const ancestry = character.ancestry || '';
  const community = character.community || '';
  const level = character.level || 1;
  const baseEvasion = (charClass && CLASSES[charClass]?.baseEvasion) || character.evasion || 10;
  const baseArmorScore = character.armor ?? 0;
  const gold = character.gold ?? 0;
  const primaryWeapon = character.primaryWeapon || '';
  const secondaryWeapon = character.secondaryWeapon || '';
  const equippedArmor = character.equippedArmor || '';
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

  const ancestryData = ancestry ? ANCESTRIES[ancestry] : null;
  const ancestryFeatures = ancestryData && typeof ancestryData === 'object' ? ancestryData.features || [] : [];
  const communityData = community ? COMMUNITIES[community] : null;
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

  const effectiveArmorScore = useMemo(() => {
    if (equippedArmorItems.length === 0) return baseArmorScore;
    const maxFromEquipped = Math.max(...equippedArmorItems.map(a => a.systemData?.armorScore ?? 0));
    return Math.max(maxFromEquipped, baseArmorScore);
  }, [equippedArmorItems, baseArmorScore]);

  const effectiveEvasion = useMemo(() => {
    let ev = baseEvasion;
    equippedArmorItems.forEach(armor => {
      const features = armor.systemData?.features || [];
      features.forEach(f => {
        const fl = f.toLowerCase();
        if (fl === 'flexible') ev += 1;
        else if (fl === 'heavy') ev -= 1;
        else if (fl === 'very-heavy' || fl === 'very heavy') ev -= 2;
      });
    });
    return ev;
  }, [equippedArmorItems, baseEvasion]);

  // Damage thresholds from class data
  const classData = charClass ? CLASSES[charClass] : null;
  const hpThresholds = classData?.hpThresholds || {};
  const minorThreshold = hpThresholds.minor || Math.ceil(hpSlots.length / 3);
  const majorThreshold = hpThresholds.major || Math.ceil((hpSlots.length * 2) / 3);
  const severeThreshold = hpThresholds.severe || hpSlots.length;

  const hpFilledCount = hpSlots.filter(Boolean).length;
  const stressFilledCount = stressSlots.filter(Boolean).length;

  const TABS = [
    { key: 'core', label: 'Core' },
    { key: 'abilities', label: 'Abilities' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'backstory', label: 'Backstory' },
  ];

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
      </div>

      {/* Name & Info */}
      <div className="dh-sidebar-identity">
        <div className="dh-sidebar-name">{character.name}</div>
        <div className="dh-sidebar-subtitle">
          Lv {level}{subtitleParts.length > 0 && ` · ${subtitleParts.join(' · ')}`}
        </div>
        {community && <div className="dh-sidebar-community">{community}</div>}
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
            <span className="dh-sidebar-vital-label">Armor</span>
            <span className="dh-sidebar-vital-count">{armorSlots.filter(Boolean).length}/{armorSlots.length}</span>
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
      {/* Attribute Circles */}
      <div className="dh-section-label">Attributes</div>
      <div className="dh-attributes-row">
        {Object.entries(traits).map(([name, value]) => (
          <div key={name} className={`dh-attribute-circle ${traitClass(value)}`}>
            <span className="dh-attribute-abbrev">{TRAIT_ABBREV[name] || name.slice(0, 3).toUpperCase()}</span>
            <span className="dh-attribute-value">{formatTraitValue(value)}</span>
          </div>
        ))}
      </div>

      {/* Damage Thresholds */}
      <div className="dh-section-label">Damage Thresholds</div>
      <div className="dh-thresholds-row">
        <div className="dh-threshold-box dh-threshold-evasion">
          <div className="dh-threshold-value">{effectiveEvasion}</div>
          <div className="dh-threshold-label">Evasion</div>
        </div>
        <div className="dh-threshold-box">
          <div className="dh-threshold-value">{minorThreshold}</div>
          <div className="dh-threshold-label">Minor</div>
        </div>
        <div className="dh-threshold-box">
          <div className="dh-threshold-value">{majorThreshold}</div>
          <div className="dh-threshold-label">Major</div>
        </div>
        <div className="dh-threshold-box">
          <div className="dh-threshold-value">{severeThreshold}</div>
          <div className="dh-threshold-label">Severe</div>
        </div>
      </div>

      {/* Experiences */}
      {experiences.length > 0 && (
        <>
          <div className="dh-section-label">Experiences</div>
          <div className="dh-experiences-list">
            {experiences.map((exp, i) => (
              <div key={i} className="dh-experience-card">
                <span className="dh-experience-name">{exp}</span>
                <span className="dh-experience-mod">+2</span>
              </div>
            ))}
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
          {domainNotes && <div className="dh-domain-notes">{domainNotes}</div>}
        </>
      )}

      {/* Active Weapons */}
      <div className="dh-section-label">Active Weapons</div>
      <div className="dh-weapons-grid">
        {equippedWeapons.map(weapon => {
          const sd = weapon.systemData || {};
          const dmg = getWeaponDamage(weapon, level);
          const tier = getTierForLevel(level);
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
                  {sd.features.map((f, i) => (
                    <span key={i} className="dh-weapon-feature-badge">{f}</span>
                  ))}
                </div>
              )}
              {weapon.description && (
                <div className="dh-weapon-description">{weapon.description}</div>
              )}
            </div>
          );
        })}
        {equippedWeapons.length === 0 && (
          <>
            <div className="dh-weapon-card">
              <div className="dh-weapon-card-header">
                <Sword size={16} className="dh-weapon-icon" />
                <span className="dh-weapon-name">{primaryWeapon || <span className="dh-empty">Primary not set</span>}</span>
              </div>
            </div>
            {secondaryWeapon && (
              <div className="dh-weapon-card">
                <div className="dh-weapon-card-header">
                  <Sword size={16} className="dh-weapon-icon" style={{ opacity: 0.5 }} />
                  <span className="dh-weapon-name">{secondaryWeapon}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // ─── Abilities Tab ───
  const renderAbilitiesTab = () => (
    <div className="dh-tab-content">
      {/* Subclass Foundation */}
      {subclassInfo?.foundation && (
        <div className="dh-ability-section">
          <div className="dh-section-label">{subclassInfo.name} Foundation</div>
          <div className="dh-feature-card">
            <div className="dh-feature-name">{subclassInfo.foundation.name}</div>
            <div className="dh-feature-desc">{subclassInfo.foundation.description}</div>
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
                  {cards.map(card => (
                    <div key={card.name} className="dh-domain-card">
                      <div className="dh-domain-card-header">
                        <span className="dh-domain-card-name">{card.name}</span>
                        <span className="dh-domain-card-level">Lv {card.level}</span>
                      </div>
                      <div className="dh-domain-card-desc">{card.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!subclassInfo?.foundation && !hasHeritage && domainCards.length === 0 && (
        <div className="dh-empty-tab">No abilities configured yet.</div>
      )}
    </div>
  );

  // ─── Equipment Tab ───
  const renderEquipmentTab = () => (
    <div className="dh-tab-content">
      {/* Equipped Weapons */}
      {equippedWeapons.length > 0 && (
        <div className="dh-equip-section">
          <div className="dh-section-label">Weapons</div>
          {equippedWeapons.map(weapon => {
            const sd = weapon.systemData || {};
            const dmg = getWeaponDamage(weapon, level);
            const tier = getTierForLevel(level);
            return (
              <div key={weapon.id} className="dh-equipped-item">
                <Sword size={14} className="dh-equipped-item-icon" />
                <div>
                  <div className="dh-equipped-item-header">
                    <span className="dh-equipped-item-name">{weapon.name}</span>
                    <span className="dh-item-tier">T{tier}</span>
                  </div>
                  <div className="dh-equipped-item-stats">
                    {sd.trait && <span>{sd.trait}</span>}
                    {sd.range && <span>{sd.range}</span>}
                    {dmg && <span>{dmg}</span>}
                    {sd.damageType && <span>{sd.damageType}</span>}
                  </div>
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
                    {sd.features?.length > 0 && <span>{sd.features.join(', ')}</span>}
                  </div>
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
                <div>
                  <div className="dh-equipped-item-name">{eq.name}</div>
                  {sd.mechanicalEffect && <div className="dh-equipped-item-stats">{sd.mechanicalEffect}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Text fallbacks */}
      {equippedArmorItems.length === 0 && equippedArmor && (
        <div className="dh-equip-section">
          <div className="dh-section-label">Equipped Armor</div>
          <div className="dh-text-value">{equippedArmor}</div>
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
            {activeTab === 'equipment' && renderEquipmentTab()}
            {activeTab === 'backstory' && renderBackstoryTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
