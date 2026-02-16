import { useState, useEffect } from 'react';
import { Edit3, Trash2, ExternalLink, ChevronRight, Sword, Shield, Sun, Star, Sparkles } from 'lucide-react';
import './DaggerheartCharacterSheet.css';

const DEFAULT_TRAITS = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
const DEFAULT_HP = [true, true, true, true, true, true];
const DEFAULT_STRESS = [false, false, false, false, false, false];
const DEFAULT_ARMOR_SLOTS = [false, false, false, false, false, false];

export default function DaggerheartCharacterSheet({ character, onEdit, onDelete, isDM, canEdit, campaign, updateCharacter }) {
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
  const inventory = character.inventory || '';
  const experiences = character.experiences || [];
  const primaryDomain = character.primaryDomain || '';
  const secondaryDomain = character.secondaryDomain || '';
  const domainNotes = character.domainNotes || '';

  const subtitleParts = [charClass, subclass, ancestry, community].filter(Boolean);
  const hasNarrative = character.backstory || character.playerNotes || (isDM && character.dmNotes);

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
          <div className="dh-equipment-grid">
            <div className="dh-equipment-item">
              <span className="dh-equipment-label">Equipped Armor</span>
              <span className="dh-equipment-value">{equippedArmor || <span className="dh-empty">None</span>}</span>
            </div>
            <div className="dh-equipment-item">
              <span className="dh-equipment-label">Inventory</span>
              <span className="dh-inventory-text">{inventory || <span className="dh-empty">Empty</span>}</span>
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
