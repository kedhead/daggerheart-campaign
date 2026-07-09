import { useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { getGameSystem } from '../../../data/systems/index.js';
import {
  ATTRIBUTES,
  SKILLS_BY_ATTRIBUTE,
  WOUND_LEVELS,
  createEmptyAttributes
} from '../../../data/systems/starwarsd6.js';
import { STARWARS_SPECIES_GROUPS } from '../../../data/starwarsd6Species.js';

const EMPTY_WEAPON = { name: '', damage: '', difficulty: '', short: '', medium: '', long: '', ammo: '' };

// Merge a stored character into a fully-populated form shape so older
// characters (which only had template/species/link fields) still load.
function buildInitialState(character) {
  const sd = character?.systemData || {};
  const attributes = createEmptyAttributes();
  for (const key of Object.keys(attributes)) {
    if (sd.attributes?.[key]) {
      attributes[key] = {
        dice: sd.attributes[key].dice || '',
        skills: (sd.attributes[key].skills || []).map(s => ({ name: s.name || '', dice: s.dice || '' }))
      };
    }
  }
  return {
    name: character?.name || '',
    playerName: character?.playerName || '',
    avatarUrl: character?.avatarUrl || '',
    level: character?.level || 1,
    backstory: character?.backstory || '',
    dmNotes: character?.dmNotes || '',
    systemData: {
      template: sd.template || '',
      species: sd.species || '',
      sex: sd.sex || '',
      age: sd.age || '',
      height: sd.height || '',
      weight: sd.weight || '',
      physicalDescription: sd.physicalDescription || '',
      personality: sd.personality || '',
      objectives: sd.objectives || '',
      quote: sd.quote || '',
      connections: sd.connections || '',
      move: sd.move || '10',
      forceSensitive: !!sd.forceSensitive,
      forcePoints: sd.forcePoints ?? 1,
      darkSidePoints: sd.darkSidePoints ?? 0,
      characterPoints: sd.characterPoints ?? 5,
      credits: sd.credits || '',
      woundStatus: sd.woundStatus || '',
      attributes,
      forceSkills: {
        control: sd.forceSkills?.control || '',
        sense: sd.forceSkills?.sense || '',
        alter: sd.forceSkills?.alter || ''
      },
      weapons: (sd.weapons || []).map(w => ({ ...EMPTY_WEAPON, ...w })),
      specialAbilities: sd.specialAbilities || '',
      equipment: sd.equipment || '',
      characterSheetLink: sd.characterSheetLink || '',
      playerNotes: sd.playerNotes || ''
    }
  };
}

export default function StarWarsD6Form({ character, onSave, onCancel, isDM }) {
  const gameSystem = getGameSystem('starwarsd6');
  const [formData, setFormData] = useState(() => buildInitialState(character));
  const sd = formData.systemData;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Drop empty skill/weapon rows before saving
    const cleaned = {
      ...formData,
      systemData: {
        ...sd,
        attributes: Object.fromEntries(
          Object.entries(sd.attributes).map(([key, attr]) => [
            key,
            { ...attr, skills: attr.skills.filter(s => s.name.trim()) }
          ])
        ),
        weapons: sd.weapons.filter(w => w.name.trim())
      }
    };
    onSave(cleaned);
  };

  const updateSystemData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      systemData: { ...prev.systemData, [field]: value }
    }));
  };

  const updateAttribute = (attrKey, patch) => {
    updateSystemData('attributes', {
      ...sd.attributes,
      [attrKey]: { ...sd.attributes[attrKey], ...patch }
    });
  };

  const updateSkill = (attrKey, index, patch) => {
    const skills = sd.attributes[attrKey].skills.map((s, i) => (i === index ? { ...s, ...patch } : s));
    updateAttribute(attrKey, { skills });
  };

  const addSkill = (attrKey) => {
    const attr = sd.attributes[attrKey];
    updateAttribute(attrKey, { skills: [...attr.skills, { name: '', dice: attr.dice || '' }] });
  };

  const removeSkill = (attrKey, index) => {
    updateAttribute(attrKey, { skills: sd.attributes[attrKey].skills.filter((_, i) => i !== index) });
  };

  const updateWeapon = (index, patch) => {
    updateSystemData('weapons', sd.weapons.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  };

  const speciesInGroups = STARWARS_SPECIES_GROUPS.some(g => g.species.includes(sd.species));

  const rowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' };
  const smallLabel = { color: 'var(--text-muted)', fontSize: '0.75rem' };

  return (
    <form onSubmit={handleSubmit} className="character-form">
      <div className="form-section">
        <h3>Basic Information</h3>

        <div className="input-group">
          <label>Character Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label>Player Name *</label>
          <input
            type="text"
            value={formData.playerName}
            onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label>Avatar URL</label>
          <input
            type="url"
            value={formData.avatarUrl}
            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div style={rowStyle}>
          <div className="input-group">
            <label>Template/Class</label>
            <select value={sd.template} onChange={(e) => updateSystemData('template', e.target.value)}>
              <option value="">Select Template</option>
              {gameSystem.templates.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
              {sd.template && !gameSystem.templates.includes(sd.template) && (
                <option value={sd.template}>{sd.template}</option>
              )}
            </select>
          </div>

          <div className="input-group">
            <label>Species</label>
            <select value={sd.species} onChange={(e) => updateSystemData('species', e.target.value)}>
              <option value="">Select Species</option>
              {STARWARS_SPECIES_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.species.map(s => (
                    <option key={`${group.label}-${s}`} value={s}>{s}</option>
                  ))}
                </optgroup>
              ))}
              {sd.species && !speciesInGroups && (
                <option value={sd.species}>{sd.species}</option>
              )}
            </select>
          </div>
        </div>

        <div style={rowStyle}>
          <div className="input-group">
            <label>Sex</label>
            <input type="text" value={sd.sex} onChange={(e) => updateSystemData('sex', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Age</label>
            <input type="text" value={sd.age} onChange={(e) => updateSystemData('age', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Height</label>
            <input type="text" value={sd.height} onChange={(e) => updateSystemData('height', e.target.value)} placeholder="1.8m" />
          </div>
          <div className="input-group">
            <label>Weight</label>
            <input type="text" value={sd.weight} onChange={(e) => updateSystemData('weight', e.target.value)} placeholder="80kg" />
          </div>
          <div className="input-group">
            <label>Move</label>
            <input type="text" value={sd.move} onChange={(e) => updateSystemData('move', e.target.value)} placeholder="10" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Attributes &amp; Skills</h3>
        <small style={smallLabel}>
          Dice codes use the D6 notation: 3D, 3D+1, 4D+2, etc. Add the skills your character
          has improved beyond the base attribute.
        </small>

        {ATTRIBUTES.map(attrName => {
          const key = attrName.toLowerCase();
          const attr = sd.attributes[key];
          return (
            <div
              key={key}
              style={{
                border: '1px solid var(--line, rgba(255,255,255,0.1))',
                borderRadius: '10px',
                padding: '0.75rem',
                marginTop: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <strong style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>
                  {attrName}
                </strong>
                <input
                  type="text"
                  value={attr.dice}
                  onChange={(e) => updateAttribute(key, { dice: e.target.value })}
                  placeholder="3D+1"
                  style={{ width: '90px', textAlign: 'center' }}
                />
              </div>

              {attr.skills.map((skill, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    list={`sw-skills-${key}`}
                    value={skill.name}
                    onChange={(e) => updateSkill(key, i, { name: e.target.value })}
                    placeholder="Skill name"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    value={skill.dice}
                    onChange={(e) => updateSkill(key, i, { dice: e.target.value })}
                    placeholder="4D+2"
                    style={{ width: '90px', textAlign: 'center' }}
                  />
                  <button
                    type="button"
                    className="btn btn-icon btn-danger"
                    onClick={() => removeSkill(key, i)}
                    title="Remove skill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <datalist id={`sw-skills-${key}`}>
                {(SKILLS_BY_ATTRIBUTE[key] || []).map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => addSkill(key)}
                style={{ marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
              >
                <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
                Add Skill
              </button>
            </div>
          );
        })}
      </div>

      <div className="form-section">
        <h3>The Force &amp; Points</h3>

        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={sd.forceSensitive}
              onChange={(e) => updateSystemData('forceSensitive', e.target.checked)}
              style={{ width: 'auto', margin: 0 }}
            />
            <Zap size={14} />
            Force Sensitive
          </label>
        </div>

        {sd.forceSensitive && (
          <div style={rowStyle}>
            {['control', 'sense', 'alter'].map(f => (
              <div key={f} className="input-group">
                <label style={{ textTransform: 'capitalize' }}>{f}</label>
                <input
                  type="text"
                  value={sd.forceSkills[f]}
                  onChange={(e) => updateSystemData('forceSkills', { ...sd.forceSkills, [f]: e.target.value })}
                  placeholder="2D"
                />
              </div>
            ))}
          </div>
        )}

        <div style={rowStyle}>
          <div className="input-group">
            <label>Force Points</label>
            <input
              type="number"
              min="0"
              value={sd.forcePoints}
              onChange={(e) => updateSystemData('forcePoints', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="input-group">
            <label>Dark Side Points</label>
            <input
              type="number"
              min="0"
              max="6"
              value={sd.darkSidePoints}
              onChange={(e) => updateSystemData('darkSidePoints', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="input-group">
            <label>Character Points</label>
            <input
              type="number"
              min="0"
              value={sd.characterPoints}
              onChange={(e) => updateSystemData('characterPoints', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="input-group">
            <label>Credits</label>
            <input
              type="text"
              value={sd.credits}
              onChange={(e) => updateSystemData('credits', e.target.value)}
              placeholder="1000"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Condition</label>
          <select value={sd.woundStatus} onChange={(e) => updateSystemData('woundStatus', e.target.value)}>
            <option value="">Healthy</option>
            {WOUND_LEVELS.map(w => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>Weapons</h3>
        {sd.weapons.map((w, i) => (
          <div
            key={i}
            style={{
              border: '1px solid var(--line, rgba(255,255,255,0.1))',
              borderRadius: '10px',
              padding: '0.75rem',
              marginBottom: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={w.name}
                onChange={(e) => updateWeapon(i, { name: e.target.value })}
                placeholder="Weapon name (e.g. Blaster Pistol)"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-icon btn-danger"
                onClick={() => updateSystemData('weapons', sd.weapons.filter((_, j) => j !== i))}
                title="Remove weapon"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ ...rowStyle, marginTop: '0.5rem' }}>
              <div className="input-group">
                <label style={smallLabel}>Damage</label>
                <input type="text" value={w.damage} onChange={(e) => updateWeapon(i, { damage: e.target.value })} placeholder="4D" />
              </div>
              <div className="input-group">
                <label style={smallLabel}>Difficulty</label>
                <input type="text" value={w.difficulty} onChange={(e) => updateWeapon(i, { difficulty: e.target.value })} placeholder="Easy" />
              </div>
              <div className="input-group">
                <label style={smallLabel}>Short</label>
                <input type="text" value={w.short} onChange={(e) => updateWeapon(i, { short: e.target.value })} placeholder="3-10" />
              </div>
              <div className="input-group">
                <label style={smallLabel}>Medium</label>
                <input type="text" value={w.medium} onChange={(e) => updateWeapon(i, { medium: e.target.value })} placeholder="30" />
              </div>
              <div className="input-group">
                <label style={smallLabel}>Long</label>
                <input type="text" value={w.long} onChange={(e) => updateWeapon(i, { long: e.target.value })} placeholder="120" />
              </div>
              <div className="input-group">
                <label style={smallLabel}>Ammo</label>
                <input type="text" value={w.ammo} onChange={(e) => updateWeapon(i, { ammo: e.target.value })} placeholder="100" />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => updateSystemData('weapons', [...sd.weapons, { ...EMPTY_WEAPON }])}
          style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
        >
          <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
          Add Weapon
        </button>
      </div>

      <div className="form-section">
        <h3>Abilities &amp; Gear</h3>

        <div className="input-group">
          <label>Special Abilities</label>
          <textarea
            value={sd.specialAbilities}
            onChange={(e) => updateSystemData('specialAbilities', e.target.value)}
            rows="3"
            placeholder="Species or template special abilities..."
          />
        </div>

        <div className="input-group">
          <label>Equipment</label>
          <textarea
            value={sd.equipment}
            onChange={(e) => updateSystemData('equipment', e.target.value)}
            rows="4"
            placeholder={'One item per line:\nComlink\nMedpac\nBlast vest (+1D physical, +1 energy)'}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Character Story</h3>

        <div className="input-group">
          <label>Physical Description</label>
          <textarea
            value={sd.physicalDescription}
            onChange={(e) => updateSystemData('physicalDescription', e.target.value)}
            rows="2"
          />
        </div>

        <div className="input-group">
          <label>Personality</label>
          <textarea
            value={sd.personality}
            onChange={(e) => updateSystemData('personality', e.target.value)}
            rows="2"
          />
        </div>

        <div className="input-group">
          <label>Objectives</label>
          <textarea
            value={sd.objectives}
            onChange={(e) => updateSystemData('objectives', e.target.value)}
            rows="2"
          />
        </div>

        <div className="input-group">
          <label>A Quote</label>
          <input
            type="text"
            value={sd.quote}
            onChange={(e) => updateSystemData('quote', e.target.value)}
            placeholder="Something your character would say..."
          />
        </div>

        <div className="input-group">
          <label>Connections With Other Characters</label>
          <textarea
            value={sd.connections}
            onChange={(e) => updateSystemData('connections', e.target.value)}
            rows="2"
          />
        </div>

        <div className="input-group">
          <label>Background</label>
          <textarea
            value={formData.backstory}
            onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
            rows="4"
            placeholder="Your character's history..."
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Links &amp; Notes</h3>

        <div className="input-group">
          <label>External Character Sheet Link</label>
          <input
            type="url"
            value={sd.characterSheetLink}
            onChange={(e) => updateSystemData('characterSheetLink', e.target.value)}
            placeholder="https://... (optional)"
          />
        </div>

        <div className="input-group">
          <label>Player Notes</label>
          <textarea
            value={sd.playerNotes}
            onChange={(e) => updateSystemData('playerNotes', e.target.value)}
            rows="3"
            placeholder="Quick notes about your character..."
          />
        </div>

        {isDM && (
          <div className="input-group">
            <label>DM Notes (Private)</label>
            <textarea
              value={formData.dmNotes}
              onChange={(e) => setFormData({ ...formData, dmNotes: e.target.value })}
              rows="3"
              placeholder="Private notes only visible to the DM..."
            />
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Character
        </button>
      </div>
    </form>
  );
}
