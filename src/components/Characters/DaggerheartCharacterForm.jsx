import { useState, useMemo } from 'react';
import { Save, X, ExternalLink, Wand2, Loader2, Plus, Check, Sword, Shield, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { CLASSES, SUBCLASSES, DOMAINS, ANCESTRIES, COMMUNITIES, TRAIT_RANGE, STANDARD_ARRAY } from '../../data/systems/daggerheart';
import { getCardsForCharacter, getCardByName } from '../../data/daggerheartDomainCards';
import { generateCharacterPortrait } from '../../services/portraitGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';
import './CharacterForm.css';

const DEFAULT_TRAITS = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
const DEFAULT_HP = [true, true, true, true, true, true];
const DEFAULT_STRESS = [false, false, false, false, false, false];
const DEFAULT_ARMOR_SLOTS = [false, false, false, false, false, false];
const DEFAULT_HOPE_SLOTS = [false, false, false, false, false, false];

const DEFAULT_CHARACTER = {
  name: '',
  playerName: '',
  avatarUrl: '',
  appearanceDescription: '',
  class: '',
  subclass: '',
  level: 1,
  ancestry: '',
  community: '',
  traits: { ...DEFAULT_TRAITS },
  hpSlots: [...DEFAULT_HP],
  stressSlots: [...DEFAULT_STRESS],
  armorSlots: [...DEFAULT_ARMOR_SLOTS],
  evasion: 10,
  armor: 0,
  hopeSlots: [...DEFAULT_HOPE_SLOTS],
  primaryDomain: '',
  secondaryDomain: '',
  domainNotes: '',
  domainCards: [],
  primaryWeapon: '',
  secondaryWeapon: '',
  equippedArmor: '',
  inventory: '',
  gold: 0,
  experiences: [],
  backstory: '',
  playerNotes: '',
  dmNotes: '',
  demiplaneLink: ''
};

const SECTION_STYLE = { color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem', marginTop: '0.5rem' };

export default function DaggerheartCharacterForm({ character, onSave, onCancel, isDM, campaign, items, addToCharacterInventory, removeFromCharacterInventory, toggleEquipped }) {
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_CHARACTER,
    ...character,
    traits: { ...DEFAULT_TRAITS, ...character?.traits },
    hpSlots: character?.hpSlots || [...DEFAULT_HP],
    stressSlots: character?.stressSlots || [...DEFAULT_STRESS],
    armorSlots: character?.armorSlots || [...DEFAULT_ARMOR_SLOTS],
    hopeSlots: character?.hopeSlots || [...DEFAULT_HOPE_SLOTS],
    experiences: character?.experiences || [],
    domainCards: character?.domainCards || [],
  }));

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [experienceInput, setExperienceInput] = useState('');
  const [customSubclass, setCustomSubclass] = useState(false);
  const [showDomainCards, setShowDomainCards] = useState(false);
  const [showEquipPicker, setShowEquipPicker] = useState(false);
  const [equipFilter, setEquipFilter] = useState('');

  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const openaiKeyInfo = getEffectiveKey('openai');
  const hasOpenAIKey = !!openaiKeyInfo?.key;

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleClassChange = (newClass) => {
    setFormData(prev => {
      const update = { ...prev, class: newClass };
      // Reset subclass if it's not valid for the new class
      if (newClass && SUBCLASSES[newClass]) {
        const validNames = SUBCLASSES[newClass].map(s => s.name);
        if (!validNames.includes(prev.subclass) && prev.subclass !== '') {
          update.subclass = '';
          setCustomSubclass(false);
        }
      }
      // Auto-set evasion, HP, and domains from class data
      if (newClass && CLASSES[newClass]) {
        const classData = CLASSES[newClass];
        update.evasion = classData.baseEvasion;
        update.hpSlots = Array(classData.baseHp).fill(true);
        update.primaryDomain = classData.domains[0];
        update.secondaryDomain = classData.domains[1];
      }
      return update;
    });
  };

  const handleSubclassSelect = (value) => {
    if (value === '__custom__') {
      setCustomSubclass(true);
      handleChange('subclass', '');
    } else {
      setCustomSubclass(false);
      handleChange('subclass', value);
    }
  };

  const handleSlotToggle = (type, index) => {
    const slots = [...formData[type]];
    slots[index] = !slots[index];
    setFormData(prev => ({ ...prev, [type]: slots }));
  };

  const addExperience = () => {
    if (experienceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        experiences: [...prev.experiences, experienceInput.trim()]
      }));
      setExperienceInput('');
    }
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const toggleDomainCard = (cardName) => {
    setFormData(prev => {
      const current = prev.domainCards || [];
      if (current.includes(cardName)) {
        return { ...prev, domainCards: current.filter(n => n !== cardName) };
      } else {
        return { ...prev, domainCards: [...current, cardName] };
      }
    });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) { alert('Avatar size must be less than 1MB'); return; }
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, avatarUrl: e.target.result }));
      setUploadingAvatar(false);
    };
    reader.onerror = () => { alert('Failed to upload avatar'); setUploadingAvatar(false); };
    reader.readAsDataURL(file);
  };

  const handleGenerateAvatar = async () => {
    if (!formData.appearanceDescription?.trim()) { alert('Please add an appearance description first.'); return; }

    setGeneratingAvatar(true);
    try {
      const imageUrl = await generateCharacterPortrait(
        formData,
        openaiKeyInfo?.key || null,
        campaign?.gameSystem || 'daggerheart',
        campaign?.id
      );
      setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
    } catch (err) {
      console.error('Avatar generation failed:', err);
      alert('Failed to generate avatar: ' + err.message);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Filter primary domain options by selected class
  const availableDomains = formData.class && CLASSES[formData.class]
    ? CLASSES[formData.class].domains
    : DOMAINS;

  const selectedClassInfo = formData.class ? CLASSES[formData.class] : null;

  // Subclass options for current class
  const subclassOptions = formData.class && SUBCLASSES[formData.class]
    ? SUBCLASSES[formData.class]
    : [];

  // Check if current subclass is a known one or custom
  const isKnownSubclass = subclassOptions.some(s => s.name === formData.subclass);
  const selectedSubclassInfo = subclassOptions.find(s => s.name === formData.subclass);

  // Determine if we should show custom input
  const showCustomInput = customSubclass || (formData.subclass && !isKnownSubclass && formData.class);

  // Domain cards available for this character
  const availableDomainCards = useMemo(() =>
    getCardsForCharacter(formData.primaryDomain, formData.secondaryDomain, formData.level || 1),
    [formData.primaryDomain, formData.secondaryDomain, formData.level]
  );

  // Group available cards by domain
  const cardsByDomain = useMemo(() => {
    const grouped = {};
    availableDomainCards.forEach(card => {
      if (!grouped[card.domain]) grouped[card.domain] = [];
      grouped[card.domain].push(card);
    });
    return grouped;
  }, [availableDomainCards]);

  // Heritage features
  const ancestryData = formData.ancestry ? ANCESTRIES[formData.ancestry] : null;
  const ancestryDesc = ancestryData ? (typeof ancestryData === 'string' ? ancestryData : ancestryData.description) : '';
  const ancestryFeatures = ancestryData && typeof ancestryData === 'object' ? ancestryData.features || [] : [];
  const communityData = formData.community ? COMMUNITIES[formData.community] : null;
  const communityDesc = communityData ? (typeof communityData === 'string' ? communityData : communityData.description) : '';
  const communityFeatures = communityData && typeof communityData === 'object' ? communityData.features || [] : [];

  // Items for equip picker
  const campaignItems = items || [];
  const characterInventory = Array.isArray(formData.equippedItems) ? formData.equippedItems : [];
  const filteredItems = campaignItems.filter(item =>
    !equipFilter || item.name.toLowerCase().includes(equipFilter.toLowerCase()) ||
    (item.type && item.type.toLowerCase().includes(equipFilter.toLowerCase()))
  );

  return (
    <form className="character-form" onSubmit={handleSubmit}>
      {/* ===== Section 1: Identity ===== */}
      <h4 style={{ ...SECTION_STYLE, marginTop: 0 }}>Identity</h4>

      <div className="avatar-section">
        <div className="avatar-preview">
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="Character avatar" />
          ) : (
            <div className="avatar-placeholder"><span>No Avatar</span></div>
          )}
        </div>
        <div className="avatar-upload">
          <label className="btn btn-secondary">
            {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} style={{ display: 'none' }} />
          </label>
          <button
            type="button"
            className="btn btn-secondary ai-generate-btn"
            onClick={handleGenerateAvatar}
            disabled={generatingAvatar || !formData.appearanceDescription?.trim()}
            title={!formData.appearanceDescription?.trim() ? 'Add an appearance description first' : 'Generate AI Avatar'}
          >
            {generatingAvatar ? <Loader2 size={16} className="spinner" /> : <Wand2 size={16} />}
            {generatingAvatar ? 'Generating...' : 'AI Generate'}
          </button>
          {formData.avatarUrl && (
            <button type="button" className="btn btn-secondary" onClick={() => handleChange('avatarUrl', '')}>Remove</button>
          )}
          <small className="form-hint">Max 1MB for upload, or use AI generation</small>
        </div>
      </div>

      <div className="input-group">
        <label>Appearance Description (for AI Avatar)</label>
        <textarea
          value={formData.appearanceDescription || ''}
          onChange={(e) => handleChange('appearanceDescription', e.target.value)}
          rows="3"
          placeholder="Describe your character's physical appearance..."
        />
      </div>

      <div className="form-grid">
        <div className="input-group">
          <label>Character Name *</label>
          <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g., Eldrin Shadowstep" required />
        </div>
        <div className="input-group">
          <label>Player Name</label>
          <input type="text" value={formData.playerName || ''} onChange={(e) => handleChange('playerName', e.target.value)} placeholder="Your real name" />
        </div>
      </div>

      {/* ===== Section 2: Class & Background ===== */}
      <h4 style={SECTION_STYLE}>Class & Background</h4>

      <div className="form-grid">
        <div className="input-group">
          <label>Class</label>
          <select value={formData.class || ''} onChange={(e) => handleClassChange(e.target.value)}>
            <option value="">-- Select Class --</option>
            {Object.keys(CLASSES).map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          {selectedClassInfo && (
            <small className="input-hint">{selectedClassInfo.description}</small>
          )}
        </div>
        <div className="input-group">
          <label>Subclass</label>
          {!showCustomInput ? (
            <select
              value={formData.subclass || ''}
              onChange={(e) => handleSubclassSelect(e.target.value)}
              disabled={!formData.class}
            >
              <option value="">-- Select Subclass --</option>
              {subclassOptions.map(sc => (
                <option key={sc.name} value={sc.name}>{sc.name}</option>
              ))}
              <option value="__custom__">Custom...</option>
            </select>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={formData.subclass || ''}
                onChange={(e) => handleChange('subclass', e.target.value)}
                placeholder="Enter custom subclass"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary" onClick={() => { setCustomSubclass(false); handleChange('subclass', ''); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                <X size={12} />
              </button>
            </div>
          )}
          {selectedSubclassInfo && (
            <small className="input-hint">{selectedSubclassInfo.description}</small>
          )}
          {selectedSubclassInfo?.foundation && (
            <div className="dh-form-feature-card">
              <div className="dh-form-feature-name">{selectedSubclassInfo.foundation.name}</div>
              <div className="dh-form-feature-desc">{selectedSubclassInfo.foundation.description}</div>
            </div>
          )}
        </div>

        {/* Companion fields for Beastbound Rangers */}
        {formData.class === 'Ranger' && formData.subclass === 'Beastbound' && (
          <div className="input-group full-width" style={{ background: 'rgba(200,164,78,0.06)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(200,164,78,0.15)' }}>
            <label style={{ ...SECTION_STYLE, marginTop: 0, marginBottom: '0.25rem' }}>Companion</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Companion Name</label>
                <input
                  type="text"
                  value={formData.companion?.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companion: { ...prev.companion, name: e.target.value, stressSlots: prev.companion?.stressSlots || [false,false,false,false,false,false], evasion: 10, damageDie: 'd6', range: 'Melee', experiences: prev.companion?.experiences || [], upgrades: prev.companion?.upgrades || [] } }))}
                  placeholder="e.g., Fang, Shadow..."
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Companion Type</label>
                <input
                  type="text"
                  value={formData.companion?.type || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companion: { ...prev.companion, type: e.target.value } }))}
                  placeholder="e.g., Wolf, Hawk..."
                />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
              <label>Attack Description</label>
              <input
                type="text"
                value={formData.companion?.attackDescription || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, companion: { ...prev.companion, attackDescription: e.target.value } }))}
                placeholder="e.g., Bite, Claw, Peck..."
              />
            </div>
          </div>
        )}

        <div className="input-group">
          <label>Level</label>
          <input type="number" value={formData.level || 1} onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)} min="1" max="10" />
        </div>
        <div className="input-group">
          <label>Ancestry</label>
          <select value={formData.ancestry || ''} onChange={(e) => handleChange('ancestry', e.target.value)}>
            <option value="">-- Select Ancestry --</option>
            {Object.entries(ANCESTRIES).map(([name, data]) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {ancestryDesc && (
            <small className="input-hint">{ancestryDesc}</small>
          )}
        </div>
        <div className="input-group full-width">
          <label>Community</label>
          <select value={formData.community || ''} onChange={(e) => handleChange('community', e.target.value)}>
            <option value="">-- Select Community --</option>
            {Object.entries(COMMUNITIES).map(([name, data]) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {communityDesc && (
            <small className="input-hint">{communityDesc}</small>
          )}
        </div>
      </div>

      {/* Heritage Features */}
      {(ancestryFeatures.length > 0 || communityFeatures.length > 0) && (
        <div className="dh-form-heritage">
          <h4 style={{ ...SECTION_STYLE, marginTop: '0.25rem', marginBottom: '0.25rem', fontSize: '0.65rem', color: 'rgba(234, 179, 8, 0.5)' }}>Heritage Features</h4>
          {ancestryFeatures.map((f, i) => (
            <div key={`a-${i}`} className="dh-form-feature-card">
              <div className="dh-form-feature-tag">Ancestry</div>
              <div className="dh-form-feature-name">{f.name}</div>
              <div className="dh-form-feature-desc">{f.description}</div>
            </div>
          ))}
          {communityFeatures.map((f, i) => (
            <div key={`c-${i}`} className="dh-form-feature-card">
              <div className="dh-form-feature-tag">Community</div>
              <div className="dh-form-feature-name">{f.name}</div>
              <div className="dh-form-feature-desc">{f.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Section 3: Traits ===== */}
      <h4 style={SECTION_STYLE}>Traits {(formData.level || 1) === 1 && '(Standard Array)'}</h4>

      <div className="traits-form-grid">
        {Object.keys(DEFAULT_TRAITS).map(trait => {
          const isLevel1 = (formData.level || 1) === 1;
          let options;
          if (isLevel1) {
            // Pool-based: figure out which values are still available
            const pool = [...STANDARD_ARRAY]; // [-1, 0, 0, 1, 1, 2]
            // Remove values already assigned to OTHER traits
            Object.entries(formData.traits).forEach(([t, v]) => {
              if (t !== trait) {
                const idx = pool.indexOf(v);
                if (idx !== -1) pool.splice(idx, 1);
              }
            });
            // Available options = unique values remaining in pool, plus current value (always valid)
            const currentVal = formData.traits[trait] ?? 0;
            const uniqueAvailable = [...new Set(pool)].sort((a, b) => a - b);
            if (!uniqueAvailable.includes(currentVal)) {
              uniqueAvailable.push(currentVal);
              uniqueAvailable.sort((a, b) => a - b);
            }
            options = uniqueAvailable;
          } else {
            options = TRAIT_RANGE;
          }
          return (
            <div key={trait} className="input-group">
              <label>{trait.charAt(0).toUpperCase() + trait.slice(1)}</label>
              <select
                value={formData.traits[trait] ?? 0}
                onChange={(e) => handleChange(`traits.${trait}`, parseInt(e.target.value))}
              >
                {options.map(val => (
                  <option key={val} value={val}>{val >= 0 ? '+' : ''}{val}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      {(formData.level || 1) === 1 && (() => {
        const pool = [...STANDARD_ARRAY];
        Object.values(formData.traits).forEach(v => {
          const idx = pool.indexOf(v);
          if (idx !== -1) pool.splice(idx, 1);
        });
        if (pool.length > 0) {
          return (
            <small className="form-hint" style={{ marginTop: '-0.25rem' }}>
              Remaining: {pool.sort((a, b) => a - b).map(v => v >= 0 ? `+${v}` : `${v}`).join(', ')}
            </small>
          );
        }
        return null;
      })()}

      {/* ===== Section 4: Combat & Vitals ===== */}
      <h4 style={SECTION_STYLE}>Combat & Vitals</h4>

      <div className="slots-section">
        <div className="slot-group">
          <h4>HP Slots (gold = healthy)</h4>
          <div className="slot-toggles">
            {formData.hpSlots.map((filled, index) => (
              <button
                key={index}
                type="button"
                className={`slot-toggle ${filled ? 'filled' : 'empty'} hp`}
                onClick={() => handleSlotToggle('hpSlots', index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="slot-group">
          <h4>Stress Slots (purple = stressed)</h4>
          <div className="slot-toggles">
            {formData.stressSlots.map((filled, index) => (
              <button
                key={index}
                type="button"
                className={`slot-toggle ${filled ? 'filled' : 'empty'} stress`}
                onClick={() => handleSlotToggle('stressSlots', index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="slot-group">
          <h4>Armor Slots (blue = used)</h4>
          <div className="slot-toggles">
            {formData.armorSlots.map((filled, index) => (
              <button
                key={index}
                type="button"
                className={`slot-toggle ${filled ? 'filled' : 'empty'} stress`}
                style={filled ? { background: '#3b82f6', borderColor: '#3b82f6', color: 'white' } : {}}
                onClick={() => handleSlotToggle('armorSlots', index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="slot-group">
          <h4>Hope Slots (amber = available)</h4>
          <div className="slot-toggles">
            {formData.hopeSlots.map((filled, index) => (
              <button
                key={index}
                type="button"
                className={`slot-toggle ${filled ? 'filled' : 'empty'}`}
                style={filled ? { background: '#f59e0b', borderColor: '#f59e0b', color: '#0d1126' } : {}}
                onClick={() => handleSlotToggle('hopeSlots', index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="input-group">
          <label>Evasion {formData.class ? `(from ${formData.class})` : '(base)'}</label>
          <input type="number" value={formData.evasion ?? 10} onChange={(e) => handleChange('evasion', parseInt(e.target.value) || 0)} min="0" readOnly={!!formData.class} />
        </div>
        <div className="input-group">
          <label>Armor Score (base)</label>
          <input type="number" value={formData.armor ?? 0} onChange={(e) => handleChange('armor', parseInt(e.target.value) || 0)} min="0" />
        </div>
      </div>

      {/* ===== Section 5: Domains & Domain Cards ===== */}
      <h4 style={SECTION_STYLE}>Domains</h4>

      <div className="form-grid">
        <div className="input-group">
          <label>Primary Domain {formData.class && `(${formData.class} domains)`}</label>
          <select value={formData.primaryDomain || ''} onChange={(e) => handleChange('primaryDomain', e.target.value)}>
            <option value="">-- Select Domain --</option>
            {availableDomains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Secondary Domain {formData.class && `(${formData.class} domains)`}</label>
          <select value={formData.secondaryDomain || ''} onChange={(e) => handleChange('secondaryDomain', e.target.value)}>
            <option value="">-- Select Domain --</option>
            {availableDomains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="input-group full-width">
          <label>Domain Notes</label>
          <textarea
            value={formData.domainNotes || ''}
            onChange={(e) => handleChange('domainNotes', e.target.value)}
            rows="2"
            placeholder="Notes about your domain abilities, cards, etc."
          />
        </div>
      </div>

      {/* Domain Cards Picker */}
      {(formData.primaryDomain || formData.secondaryDomain) && (
        <div className="dh-form-domain-cards">
          <button
            type="button"
            className="dh-form-section-toggle"
            onClick={() => setShowDomainCards(!showDomainCards)}
          >
            {showDomainCards ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Domain Cards ({(formData.domainCards || []).length} selected)
          </button>

          {showDomainCards && (
            <div className="dh-form-cards-picker">
              {Object.entries(cardsByDomain).map(([domain, cards]) => (
                <div key={domain} className="dh-form-cards-domain">
                  <div className="dh-form-cards-domain-label">{domain}</div>
                  {cards.map(card => {
                    const isSelected = (formData.domainCards || []).includes(card.name);
                    return (
                      <div
                        key={card.name}
                        className={`dh-form-card-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleDomainCard(card.name)}
                      >
                        <div className="dh-form-card-header">
                          <div className={`dh-form-card-check ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <Check size={10} />}
                          </div>
                          <span className="dh-form-card-name">{card.name}</span>
                          <span className="dh-form-card-level">Lv {card.level}</span>
                        </div>
                        <div className="dh-form-card-desc">{card.description}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {availableDomainCards.length === 0 && (
                <div className="dh-form-cards-empty">Select domains above to see available cards.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== Section 6: Equipment ===== */}
      <h4 style={SECTION_STYLE}>Equipment</h4>

      {/* Item Equip Picker */}
      {campaignItems.length > 0 && (
        <div className="dh-form-equip-section">
          <button
            type="button"
            className="dh-form-section-toggle"
            onClick={() => setShowEquipPicker(!showEquipPicker)}
          >
            {showEquipPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Equip from Campaign Catalog
          </button>

          {showEquipPicker && (
            <div className="dh-form-equip-picker">
              <input
                type="text"
                value={equipFilter}
                onChange={(e) => setEquipFilter(e.target.value)}
                placeholder="Search items..."
                className="dh-form-equip-search"
              />
              <div className="dh-form-equip-list">
                {filteredItems.map(item => {
                  const isEquipped = characterInventory.some(ei => ei.itemId === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`dh-form-equip-item ${isEquipped ? 'equipped' : ''}`}
                    >
                      <div className="dh-form-equip-item-info">
                        <span className="dh-form-equip-item-icon">
                          {item.type === 'weapon' ? <Sword size={12} /> :
                           item.type === 'armor' ? <Shield size={12} /> :
                           <Package size={12} />}
                        </span>
                        <span className="dh-form-equip-item-name">{item.name}</span>
                        {item.systemData?.tier != null && <span className="dh-form-equip-item-tier">T{item.systemData.tier}</span>}
                        <span className="dh-form-equip-item-type">{item.type}</span>
                      </div>
                      {!isEquipped ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}
                          onClick={() => {
                            if (addToCharacterInventory && character?.id) {
                              addToCharacterInventory(character.id, item.id);
                            }
                            // Also track locally for form state
                            setFormData(prev => ({
                              ...prev,
                              equippedItems: [...(prev.equippedItems || []), { itemId: item.id, quantity: 1, equipped: true }]
                            }));
                          }}
                        >
                          <Plus size={10} /> Add
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', color: '#ef4444' }}
                          onClick={() => {
                            if (removeFromCharacterInventory && character?.id) {
                              removeFromCharacterInventory(character.id, item.id);
                            }
                            setFormData(prev => ({
                              ...prev,
                              equippedItems: (prev.equippedItems || []).filter(ei => ei.itemId !== item.id)
                            }));
                          }}
                        >
                          <X size={10} /> Remove
                        </button>
                      )}
                    </div>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div className="dh-form-cards-empty">No items match your search.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="form-grid">
        <div className="input-group">
          <label>Primary Weapon</label>
          <input type="text" value={formData.primaryWeapon || ''} onChange={(e) => handleChange('primaryWeapon', e.target.value)} placeholder='e.g., Longsword (Str, Melee, d8+3)' />
        </div>
        <div className="input-group">
          <label>Secondary Weapon</label>
          <input type="text" value={formData.secondaryWeapon || ''} onChange={(e) => handleChange('secondaryWeapon', e.target.value)} placeholder='e.g., Shortbow (Fin, Far, d6+2)' />
        </div>
        <div className="input-group">
          <label>Equipped Armor</label>
          <input type="text" value={formData.equippedArmor || ''} onChange={(e) => handleChange('equippedArmor', e.target.value)} placeholder='e.g., Chain Mail (Score 3, 6 slots)' />
        </div>
        <div className="input-group">
          <label>Gold</label>
          <input type="number" value={formData.gold ?? 0} onChange={(e) => handleChange('gold', parseInt(e.target.value) || 0)} min="0" />
        </div>
        <div className="input-group full-width">
          <label>Inventory</label>
          <textarea
            value={typeof formData.inventory === 'string' ? formData.inventory : ''}
            onChange={(e) => handleChange('inventory', e.target.value)}
            rows="3"
            placeholder="Healing potions, rope, torches, etc."
          />
        </div>
      </div>

      {/* ===== Section 7: Growth ===== */}
      <h4 style={SECTION_STYLE}>Growth</h4>

      <div className="experiences-form-section">
        <div className="experience-input-group">
          <input
            type="text"
            value={experienceInput}
            onChange={(e) => setExperienceInput(e.target.value)}
            placeholder="Add experience..."
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExperience(); } }}
          />
          <button type="button" className="btn btn-secondary" onClick={addExperience}>
            <Plus size={14} />
            Add
          </button>
        </div>
        {formData.experiences.length > 0 && (
          <div className="experiences-tags">
            {formData.experiences.map((exp, index) => (
              <span key={index} className="badge">
                {exp}
                <button type="button" onClick={() => removeExperience(index)}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ===== Section 8: Narrative ===== */}
      <h4 style={SECTION_STYLE}>Narrative</h4>

      <div className="input-group">
        <label>Backstory</label>
        <textarea
          value={formData.backstory || ''}
          onChange={(e) => handleChange('backstory', e.target.value)}
          rows="4"
          placeholder="Tell your character's story..."
        />
      </div>

      <div className="input-group">
        <label>Player Notes</label>
        <textarea
          value={formData.playerNotes || ''}
          onChange={(e) => handleChange('playerNotes', e.target.value)}
          rows="3"
          placeholder="Personal notes, goals, relationships..."
        />
      </div>

      {isDM && (
        <div className="input-group">
          <label>DM Notes (DM Only)</label>
          <textarea
            value={formData.dmNotes || ''}
            onChange={(e) => handleChange('dmNotes', e.target.value)}
            rows="3"
            placeholder="Private notes for your eyes only..."
          />
        </div>
      )}

      <div className="input-group">
        <label>
          Demiplane Character Sheet Link
          <a href="https://app.demiplane.com/nexus/daggerheart" target="_blank" rel="noopener noreferrer" className="external-link-inline">
            <ExternalLink size={14} />
            Open Demiplane
          </a>
        </label>
        <input
          type="url"
          value={formData.demiplaneLink || ''}
          onChange={(e) => handleChange('demiplaneLink', e.target.value)}
          placeholder="https://app.demiplane.com/nexus/daggerheart/..."
        />
        <small className="input-hint">Optional: Link to your Demiplane character sheet.</small>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} /> Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} /> Save Character
        </button>
      </div>
    </form>
  );
}
