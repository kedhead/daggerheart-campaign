import { useState } from 'react';
import { Save, X, ExternalLink, Wand2, Loader2, Plus } from 'lucide-react';
import { CLASSES, DOMAINS, ANCESTRIES, COMMUNITIES, TRAIT_RANGE } from '../../data/systems/daggerheart';
import { generateCharacterPortrait } from '../../services/portraitGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';
import './CharacterForm.css';

const DEFAULT_TRAITS = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
const DEFAULT_HP = [true, true, true, true, true, true];
const DEFAULT_STRESS = [false, false, false, false, false, false];
const DEFAULT_ARMOR_SLOTS = [false, false, false, false, false, false];

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
  hope: 0,
  primaryDomain: '',
  secondaryDomain: '',
  domainNotes: '',
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

export default function DaggerheartCharacterForm({ character, onSave, onCancel, isDM, campaign }) {
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_CHARACTER,
    ...character,
    traits: { ...DEFAULT_TRAITS, ...character?.traits },
    hpSlots: character?.hpSlots || [...DEFAULT_HP],
    stressSlots: character?.stressSlots || [...DEFAULT_STRESS],
    armorSlots: character?.armorSlots || [...DEFAULT_ARMOR_SLOTS],
    experiences: character?.experiences || [],
  }));

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [experienceInput, setExperienceInput] = useState('');

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
    if (!hasOpenAIKey) { alert('OpenAI API key required for AI avatar generation.'); return; }
    if (!formData.appearanceDescription?.trim()) { alert('Please add an appearance description first.'); return; }

    setGeneratingAvatar(true);
    try {
      const imageUrl = await generateCharacterPortrait(
        formData,
        openaiKeyInfo.key,
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

  return (
    <form className="character-form" onSubmit={handleSubmit}>
      {/* ===== Section 1: Identity ===== */}
      <h4 style={{ color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem' }}>
        Identity
      </h4>

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
          {hasOpenAIKey && (
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
          )}
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
      <h4 style={{ color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem', marginTop: '0.5rem' }}>
        Class & Background
      </h4>

      <div className="form-grid">
        <div className="input-group">
          <label>Class</label>
          <select value={formData.class || ''} onChange={(e) => handleChange('class', e.target.value)}>
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
          <input type="text" value={formData.subclass || ''} onChange={(e) => handleChange('subclass', e.target.value)} placeholder="e.g., College of Lore" />
        </div>
        <div className="input-group">
          <label>Level</label>
          <input type="number" value={formData.level || 1} onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)} min="1" max="10" />
        </div>
        <div className="input-group">
          <label>Ancestry</label>
          <select value={formData.ancestry || ''} onChange={(e) => handleChange('ancestry', e.target.value)}>
            <option value="">-- Select Ancestry --</option>
            {Object.entries(ANCESTRIES).map(([name, desc]) => (
              <option key={name} value={name} title={desc}>{name}</option>
            ))}
          </select>
          {formData.ancestry && ANCESTRIES[formData.ancestry] && (
            <small className="input-hint">{ANCESTRIES[formData.ancestry]}</small>
          )}
        </div>
        <div className="input-group full-width">
          <label>Community</label>
          <select value={formData.community || ''} onChange={(e) => handleChange('community', e.target.value)}>
            <option value="">-- Select Community --</option>
            {Object.entries(COMMUNITIES).map(([name, desc]) => (
              <option key={name} value={name} title={desc}>{name}</option>
            ))}
          </select>
          {formData.community && COMMUNITIES[formData.community] && (
            <small className="input-hint">{COMMUNITIES[formData.community]}</small>
          )}
        </div>
      </div>

      {/* ===== Section 3: Traits ===== */}
      <h4 style={{ color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem', marginTop: '0.5rem' }}>
        Traits
      </h4>

      <div className="traits-form-grid">
        {Object.keys(DEFAULT_TRAITS).map(trait => (
          <div key={trait} className="input-group">
            <label>{trait.charAt(0).toUpperCase() + trait.slice(1)}</label>
            <select
              value={formData.traits[trait] ?? 0}
              onChange={(e) => handleChange(`traits.${trait}`, parseInt(e.target.value))}
            >
              {TRAIT_RANGE.map(val => (
                <option key={val} value={val}>{val >= 0 ? '+' : ''}{val}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* ===== Section 4: Combat & Vitals ===== */}
      <h4 style={{ color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem', marginTop: '0.5rem' }}>
        Combat & Vitals
      </h4>

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
      </div>

      <div className="form-grid">
        <div className="input-group">
          <label>Evasion</label>
          <input type="number" value={formData.evasion ?? 10} onChange={(e) => handleChange('evasion', parseInt(e.target.value) || 0)} min="0" />
        </div>
        <div className="input-group">
          <label>Armor Score</label>
          <input type="number" value={formData.armor ?? 0} onChange={(e) => handleChange('armor', parseInt(e.target.value) || 0)} min="0" />
        </div>
        <div className="input-group">
          <label>Hope</label>
          <input type="number" value={formData.hope ?? 0} onChange={(e) => handleChange('hope', parseInt(e.target.value) || 0)} min="0" />
        </div>
      </div>

      {/* ===== Section 5: Domains ===== */}
      <h4 style={{ color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem', marginTop: '0.5rem' }}>
        Domains
      </h4>

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
          <label>Secondary Domain</label>
          <select value={formData.secondaryDomain || ''} onChange={(e) => handleChange('secondaryDomain', e.target.value)}>
            <option value="">-- Select Domain --</option>
            {DOMAINS.map(d => (
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

      {/* ===== Section 6: Equipment ===== */}
      <h4 style={{ color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem', marginTop: '0.5rem' }}>
        Equipment
      </h4>

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
            value={formData.inventory || ''}
            onChange={(e) => handleChange('inventory', e.target.value)}
            rows="3"
            placeholder="Healing potions, rope, torches, etc."
          />
        </div>
      </div>

      {/* ===== Section 7: Growth ===== */}
      <h4 style={{ color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem', marginTop: '0.5rem' }}>
        Growth
      </h4>

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
      <h4 style={{ color: 'var(--hope-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '-0.5rem', marginTop: '0.5rem' }}>
        Narrative
      </h4>

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
