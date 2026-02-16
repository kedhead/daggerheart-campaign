import { useState, useEffect, useMemo } from 'react';
import { Edit3, Trash2, ExternalLink, ChevronRight, Sword, Shield, Sun, Star, Sparkles, BookOpen, Users } from 'lucide-react';
import { SUBCLASSES, ANCESTRIES, COMMUNITIES } from '../../data/systems/daggerheart';
import { getCardByName } from '../../data/daggerheartDomainCards';
import './DaggerheartCharacterSheet.css';

const DEFAULT_TRAITS = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
const DEFAULT_HP = [true, true, true, true, true, true];
const DEFAULT_STRESS = [false, false, false, false, false, false];
const DEFAULT_ARMOR_SLOTS = [false, false, false, false, false, false];

export default function DaggerheartCharacterSheet({ character, onEdit, onDelete, isDM, canEdit, campaign, updateCharacter, items }) {
  // Local optimistic state for slot toggling
  const [localHp, setLocalHp] = useState(null);
  const [localStress, setLocalStress] = useState(null);
  const [localArmor, setLocalArmor] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Reset local overrides when Firestore data changes
  useEffect(() => {
    setLocalHp(null);
    setLocalStress(null);
    setLocalArmor(null);
  }, [character.hpSlots, character.stressSlots, character.armorSlots]);

  // Resolved values: local override or Firestore or default
  const hpSlots = localHp || character.hpSlots || DEFAULT_HP;
  const stressSlots = localStress || character.stressSlots || DEFAULT_STRESS;
  const armorSlots = localArmor || character.armorSlots || DEFAULT_ARMOR_SLOTS;
  const traits = { ...DEFAULT_TRAITS, ...character.traits };

  const handleSlotToggle = (type, index) => {
    if (!canEdit || !updateCharacter) return;

    const currentSlots = type === 'hpSlots' ? [...hpSlots]
      : type === 'stressSlots' ? [...stressSlots]
      : [...armorSlots];

    currentSlots[index] = !currentSlots[index];

    // Optimistic local update
    if (type === 'hpSlots') setLocalHp(currentSlots);
    else if (type === 'stressSlots') setLocalStress(currentSlots);
    else setLocalArmor(currentSlots);

    // Persist to Firestore
    updateCharacter(character.id, { [type]: currentSlots });
  };

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatTraitValue = (val) => {
    if (val > 0) return `+${val}`;
    return `${val}`;
  };

  const traitClass = (val) => {
    if (val > 0) return 'positive';
    if (val < 0) return 'negative';
    return 'zero';
  };

  const charClass = character.class || '';
  const subclass = character.subclass || '';
  const ancestry = character.ancestry || '';
  const community = character.community || '';
  const level = character.level || 1;
  const evasion = character.evasion ?? 10;
  const armorScore = character.armor ?? 0;
  const hope = character.hope ?? 0;
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

  const subtitleParts = [charClass, subclass, ancestry, community].filter(Boolean);
  const hasNarrative = character.backstory || character.playerNotes || (isDM && character.dmNotes);

  // Subclass foundation feature
  const subclassInfo = useMemo(() => {
    if (!charClass || !subclass || !SUBCLASSES[charClass]) return null;
    return SUBCLASSES[charClass].find(s => s.name === subclass);
  }, [charClass, subclass]);

  // Heritage features
  const ancestryData = ancestry ? ANCESTRIES[ancestry] : null;
  const ancestryFeatures = ancestryData && typeof ancestryData === 'object' ? ancestryData.features || [] : [];
  const communityData = community ? COMMUNITIES[community] : null;
  const communityFeatures = communityData && typeof communityData === 'object' ? communityData.features || [] : [];
  const hasHeritage = ancestryFeatures.length > 0 || communityFeatures.length > 0;

  // Resolved domain cards
  const domainCards = useMemo(() =>
    domainCardNames.map(name => getCardByName(name)).filter(Boolean),
    [domainCardNames]
  );

  // Group domain cards by domain for display
  const domainCardsGrouped = useMemo(() => {
    const grouped = {};
    domainCards.forEach(card => {
      if (!grouped[card.domain]) grouped[card.domain] = [];
      grouped[card.domain].push(card);
    });
    return grouped;
  }, [domainCards]);

  // Equipped items from campaign catalog
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

  return (
    <div className="dh-sheet">
      {/* Header Banner */}
      <div className="dh-sheet-header">
        <div className="dh-sheet-header-info">
          <div className="dh-sheet-name">{character.name}</div>
          {subtitleParts.length > 0 && (
            <div className="dh-sheet-subtitle">
              {subtitleParts.map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="dh-divider"> / </span>}
                  {part}
                </span>
              ))}
              <span className="dh-divider"> </span>
              <span className="dh-sheet-level">Lv {level}</span>
            </div>
          )}
          {!subtitleParts.length && (
            <div className="dh-sheet-subtitle">
              <span className="dh-sheet-level">Lv {level}</span>
            </div>
          )}
          <div className="dh-sheet-player">
            {character.playerName || 'Unknown Player'}
          </div>
        </div>
        <div className="dh-sheet-avatar">
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} />
          ) : (
            <div className="dh-sheet-avatar-placeholder">
              {character.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Subclass Foundation Feature */}
      {subclassInfo?.foundation && (
        <div className="dh-subclass-feature">
          <button className="dh-narrative-toggle" onClick={() => toggleSection('foundation')}>
            <ChevronRight size={14} className={`dh-narrative-toggle-icon ${expandedSections.foundation ? 'open' : ''}`} />
            <span className="dh-narrative-toggle-label">{subclassInfo.name} — {subclassInfo.foundation.name}</span>
          </button>
          {expandedSections.foundation && (
            <div className="dh-narrative-content">{subclassInfo.foundation.description}</div>
          )}
        </div>
      )}

      <div className="dh-sheet-body">
        {/* Top Row: Armor Slots | Active Weapons | HP & Stress */}
        <div className="dh-sheet-row dh-sheet-row-3">
          {/* Armor Slots */}
          <div className="dh-panel">
            <div className="dh-section-label">Armor Slots</div>
            <div className="dh-slots-row">
              {armorSlots.map((filled, i) => (
                <button
                  key={i}
                  className={`dh-slot dh-slot-armor ${filled ? 'filled' : ''}`}
                  onClick={() => handleSlotToggle('armorSlots', i)}
                  disabled={!canEdit}
                  title={filled ? 'Armor slot used' : 'Armor slot available'}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Active Weapons */}
          <div className="dh-panel">
            <div className="dh-section-label">Active Weapons</div>
            <div className="dh-weapons">
              {/* Show equipped catalog weapons first */}
              {equippedWeapons.map(weapon => (
                <div key={weapon.id} className="dh-weapon dh-weapon-equipped">
                  <Sword size={14} className="dh-weapon-icon" />
                  <div>
                    <div className="dh-weapon-name">{weapon.name}</div>
                    <div className="dh-weapon-stats">
                      {weapon.trait && <span>{weapon.trait}</span>}
                      {weapon.range && <span>{weapon.range}</span>}
                      {weapon.damageTier1Dice && <span>{weapon.damageTier1Dice}{weapon.damageTier1Modifier ? `+${weapon.damageTier1Modifier}` : ''}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {/* Fallback to text weapons */}
              {equippedWeapons.length === 0 && (
                <>
                  <div className="dh-weapon">
                    <Sword size={14} className="dh-weapon-icon" />
                    <div>
                      <div className="dh-weapon-label">Primary</div>
                      <div className="dh-weapon-name">{primaryWeapon || <span className="dh-empty">Not set</span>}</div>
                    </div>
                  </div>
                  <div className="dh-weapon">
                    <Sword size={14} className="dh-weapon-icon" style={{ opacity: 0.5 }} />
                    <div>
                      <div className="dh-weapon-label">Secondary</div>
                      <div className="dh-weapon-name">{secondaryWeapon || <span className="dh-empty">Not set</span>}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* HP & Stress */}
          <div className="dh-panel">
            <div className="dh-section-label">Hit Points</div>
            <div className="dh-slots-row">
              {hpSlots.map((filled, i) => (
                <button
                  key={i}
                  className={`dh-slot dh-slot-hp ${filled ? 'filled' : ''}`}
                  onClick={() => handleSlotToggle('hpSlots', i)}
                  disabled={!canEdit}
                  title={filled ? 'Healthy' : 'Damaged'}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="dh-section-label" style={{ marginTop: '0.5rem' }}>Stress</div>
            <div className="dh-slots-row">
              {stressSlots.map((filled, i) => (
                <button
                  key={i}
                  className={`dh-slot dh-slot-stress ${filled ? 'filled' : ''}`}
                  onClick={() => handleSlotToggle('stressSlots', i)}
                  disabled={!canEdit}
                  title={filled ? 'Stressed' : 'Clear'}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Row: Evasion | Armor Score | Traits */}
        <div className="dh-sheet-row dh-sheet-row-2-wide">
          <div className="dh-stat-box">
            <div className="dh-stat-box-value">{evasion}</div>
            <div className="dh-stat-box-label">Evasion</div>
          </div>

          <div className="dh-stat-box">
            <div className="dh-stat-box-value">{armorScore}</div>
            <div className="dh-stat-box-label">Armor</div>
          </div>

          <div className="dh-panel">
            <div className="dh-section-label">Traits</div>
            <div className="dh-traits-grid">
              {Object.entries(traits).map(([name, value]) => (
                <div key={name} className="dh-trait">
                  <span className="dh-trait-name">{name.slice(0, 3).toUpperCase()}</span>
                  <span className={`dh-trait-value ${traitClass(value)}`}>
                    {formatTraitValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equipment & Inventory */}
        <div className="dh-panel">
          <div className="dh-section-label">Equipment & Inventory</div>

          {/* Equipped armor from catalog */}
          {equippedArmorItems.length > 0 && (
            <div className="dh-equipped-section">
              {equippedArmorItems.map(armor => (
                <div key={armor.id} className="dh-equipped-item">
                  <Shield size={14} className="dh-equipped-item-icon" />
                  <div>
                    <div className="dh-equipped-item-name">{armor.name}</div>
                    <div className="dh-equipped-item-stats">
                      {armor.armorScore != null && <span>Score {armor.armorScore}</span>}
                      {armor.armorSlots != null && <span>{armor.armorSlots} slots</span>}
                      {armor.features?.length > 0 && <span>{armor.features.join(', ')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Equipped equipment from catalog */}
          {equippedEquipment.length > 0 && (
            <div className="dh-equipped-section">
              {equippedEquipment.map(eq => (
                <div key={eq.id} className="dh-equipped-item">
                  <Star size={14} className="dh-equipped-item-icon" />
                  <div>
                    <div className="dh-equipped-item-name">{eq.name}</div>
                    {eq.mechanicalEffect && <div className="dh-equipped-item-stats">{eq.mechanicalEffect}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Text-based equipment fallback */}
          <div className="dh-equipment-grid">
            {(equippedArmorItems.length === 0) && (
              <div className="dh-equipment-item">
                <span className="dh-equipment-label">Equipped Armor</span>
                <span className="dh-equipment-value">{equippedArmor || <span className="dh-empty">None</span>}</span>
              </div>
            )}
            <div className="dh-equipment-item">
              <span className="dh-equipment-label">Inventory</span>
              <span className="dh-inventory-text">{inventoryText || <span className="dh-empty">Empty</span>}</span>
            </div>
          </div>
          <div className="dh-gold-hope-row">
            <div className="dh-counter dh-counter-gold">
              <Star size={14} className="dh-counter-icon" />
              <span>{gold} Gold</span>
            </div>
            <div className="dh-counter dh-counter-hope">
              <Sun size={14} className="dh-counter-icon" />
              <span>{hope} Hope</span>
            </div>
          </div>
        </div>

        {/* Heritage Features Section */}
        {hasHeritage && (
          <div className="dh-panel">
            <button className="dh-narrative-toggle" onClick={() => toggleSection('heritage')} style={{ paddingBottom: expandedSections.heritage ? '0.5rem' : 0 }}>
              <ChevronRight size={14} className={`dh-narrative-toggle-icon ${expandedSections.heritage ? 'open' : ''}`} />
              <span className="dh-narrative-toggle-label">
                <Users size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                Heritage Features
              </span>
            </button>
            {expandedSections.heritage && (
              <div className="dh-heritage-content">
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
            )}
          </div>
        )}

        {/* Domain Cards Section */}
        {domainCards.length > 0 && (
          <div className="dh-panel">
            <button className="dh-narrative-toggle" onClick={() => toggleSection('domainCards')} style={{ paddingBottom: expandedSections.domainCards ? '0.5rem' : 0 }}>
              <ChevronRight size={14} className={`dh-narrative-toggle-icon ${expandedSections.domainCards ? 'open' : ''}`} />
              <span className="dh-narrative-toggle-label">
                <BookOpen size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                Domain Cards ({domainCards.length})
              </span>
            </button>
            {expandedSections.domainCards && (
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
            )}
          </div>
        )}

        {/* Experiences & Domains */}
        <div className="dh-sheet-row dh-sheet-row-2">
          <div className="dh-panel">
            <div className="dh-section-label">Experiences</div>
            {experiences.length > 0 ? (
              <div className="dh-badges-row">
                {experiences.map((exp, i) => (
                  <span key={i} className="dh-experience-badge">{exp}</span>
                ))}
              </div>
            ) : (
              <span className="dh-empty">No experiences yet</span>
            )}
          </div>

          <div className="dh-panel">
            <div className="dh-section-label">Domains</div>
            <div className="dh-badges-row">
              {primaryDomain && (
                <span className="dh-domain-badge">
                  <Sparkles size={10} />
                  {primaryDomain}
                </span>
              )}
              {secondaryDomain && (
                <span className="dh-domain-badge">
                  {secondaryDomain}
                </span>
              )}
              {!primaryDomain && !secondaryDomain && (
                <span className="dh-empty">No domains selected</span>
              )}
            </div>
            {domainNotes && <div className="dh-domain-notes">{domainNotes}</div>}
          </div>
        </div>

        {/* Narrative Sections */}
        {hasNarrative && (
          <div className="dh-narrative-section">
            {character.backstory && (
              <div>
                <button className="dh-narrative-toggle" onClick={() => toggleSection('backstory')}>
                  <ChevronRight size={14} className={`dh-narrative-toggle-icon ${expandedSections.backstory ? 'open' : ''}`} />
                  <span className="dh-narrative-toggle-label">Backstory</span>
                </button>
                {expandedSections.backstory && (
                  <div className="dh-narrative-content">{character.backstory}</div>
                )}
              </div>
            )}

            {character.playerNotes && (
              <div>
                <button className="dh-narrative-toggle" onClick={() => toggleSection('notes')}>
                  <ChevronRight size={14} className={`dh-narrative-toggle-icon ${expandedSections.notes ? 'open' : ''}`} />
                  <span className="dh-narrative-toggle-label">Player Notes</span>
                </button>
                {expandedSections.notes && (
                  <div className="dh-narrative-content">{character.playerNotes}</div>
                )}
              </div>
            )}

            {isDM && character.dmNotes && (
              <div>
                <button className="dh-narrative-toggle" onClick={() => toggleSection('dm')}>
                  <ChevronRight size={14} className={`dh-narrative-toggle-icon ${expandedSections.dm ? 'open' : ''}`} />
                  <span className="dh-narrative-toggle-label">DM Notes (Private)</span>
                </button>
                {expandedSections.dm && (
                  <div className="dh-narrative-content">{character.dmNotes}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="dh-sheet-footer">
        {character.demiplaneLink && (
          <a
            href={character.demiplaneLink}
            target="_blank"
            rel="noopener noreferrer"
            className="dh-link"
          >
            <ExternalLink size={14} />
            Demiplane
          </a>
        )}
        <div className="dh-sheet-footer-spacer" />
        {canEdit && (
          <>
            <button className="dh-btn" onClick={onEdit}>
              <Edit3 size={14} />
              Edit
            </button>
            <button className="dh-btn dh-btn-danger" onClick={onDelete}>
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
