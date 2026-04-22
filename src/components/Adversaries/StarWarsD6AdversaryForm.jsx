import { useState } from 'react';
import { Plus, Trash2, Pencil, BookOpen, Copy, Loader2 } from 'lucide-react';
import Modal from '../Modal';
import {
  STARWARSD6_ADVERSARIES,
  STARWARSD6_CLASSIFICATIONS,
  STARWARSD6_AFFILIATIONS,
  STARWARSD6_SCALES
} from '../../data/starwarsd6Adversaries';

const EMPTY_FORM = {
  name: '',
  classification: 'thug',
  scale: 'character',
  affiliation: 'neutral',
  forceSensitive: false,
  description: '',
  motives: '',
  attributes: {
    dexterity: '2D',
    knowledge: '2D',
    mechanical: '2D',
    perception: '2D',
    strength: '2D',
    technical: '2D'
  },
  skills: [],
  forceSkills: [],
  weapons: [],
  move: 10,
  forcePoints: 0,
  darkSidePoints: 0,
  characterPoints: 1,
  specialAbilities: [],
  equipment: [],
  hidden: false
};

function fromAdversary(adv) {
  return {
    ...EMPTY_FORM,
    ...adv,
    attributes: { ...EMPTY_FORM.attributes, ...(adv.attributes || {}) },
    skills: adv.skills ? adv.skills.map(s => ({ ...s })) : [],
    forceSkills: adv.forceSkills ? adv.forceSkills.map(s => ({ ...s })) : [],
    weapons: adv.weapons ? adv.weapons.map(w => ({ ...w })) : [],
    specialAbilities: adv.specialAbilities ? adv.specialAbilities.map(a => ({ ...a })) : [],
    equipment: adv.equipment ? [...adv.equipment] : []
  };
}

export default function StarWarsD6AdversaryForm({
  isOpen,
  onClose,
  onSave,
  adversary = null,
  campaignAdversaries = []
}) {
  const isEdit = !!adversary;
  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState(() => adversary ? fromAdversary(adversary) : { ...EMPTY_FORM });
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateSource, setTemplateSource] = useState('official');
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const setAttr = (key, value) =>
    setForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: value } }));

  // Skills
  const addSkill = () =>
    setForm(prev => ({ ...prev, skills: [...prev.skills, { name: '', dice: '' }] }));
  const updateSkill = (i, field, value) =>
    setForm(prev => {
      const skills = [...prev.skills];
      skills[i] = { ...skills[i], [field]: value };
      return { ...prev, skills };
    });
  const removeSkill = (i) =>
    setForm(prev => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }));

  // Force Skills
  const addForceSkill = () =>
    setForm(prev => ({ ...prev, forceSkills: [...prev.forceSkills, { name: '', dice: '' }] }));
  const updateForceSkill = (i, field, value) =>
    setForm(prev => {
      const forceSkills = [...prev.forceSkills];
      forceSkills[i] = { ...forceSkills[i], [field]: value };
      return { ...prev, forceSkills };
    });
  const removeForceSkill = (i) =>
    setForm(prev => ({ ...prev, forceSkills: prev.forceSkills.filter((_, idx) => idx !== i) }));

  // Weapons
  const addWeapon = () =>
    setForm(prev => ({
      ...prev,
      weapons: [...prev.weapons, { name: '', skill: '', damage: '', range: '' }]
    }));
  const updateWeapon = (i, field, value) =>
    setForm(prev => {
      const weapons = [...prev.weapons];
      weapons[i] = { ...weapons[i], [field]: value };
      return { ...prev, weapons };
    });
  const removeWeapon = (i) =>
    setForm(prev => ({ ...prev, weapons: prev.weapons.filter((_, idx) => idx !== i) }));

  // Abilities
  const addAbility = () =>
    setForm(prev => ({
      ...prev,
      specialAbilities: [...prev.specialAbilities, { name: '', description: '' }]
    }));
  const updateAbility = (i, field, value) =>
    setForm(prev => {
      const specialAbilities = [...prev.specialAbilities];
      specialAbilities[i] = { ...specialAbilities[i], [field]: value };
      return { ...prev, specialAbilities };
    });
  const removeAbility = (i) =>
    setForm(prev => ({
      ...prev,
      specialAbilities: prev.specialAbilities.filter((_, idx) => idx !== i)
    }));

  // Equipment
  const addEquipment = () =>
    setForm(prev => ({ ...prev, equipment: [...prev.equipment, ''] }));
  const updateEquipment = (i, value) =>
    setForm(prev => {
      const equipment = [...prev.equipment];
      equipment[i] = value;
      return { ...prev, equipment };
    });
  const removeEquipment = (i) =>
    setForm(prev => ({ ...prev, equipment: prev.equipment.filter((_, idx) => idx !== i) }));

  const applyTemplate = (source) => {
    setForm(fromAdversary(source));
    setMode('manual');
    setTemplateSearch('');
  };

  const templateList = templateSource === 'official' ? STARWARSD6_ADVERSARIES : campaignAdversaries;
  const filteredTemplates = templateList.filter(a =>
    !templateSearch || a.name?.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Name is required.'); return; }
    setSaving(true);
    try {
      const cleaned = {
        ...form,
        skills: form.skills.filter(s => s.name?.trim()).map(s => ({ name: s.name.trim(), dice: (s.dice || '').trim() })),
        forceSkills: form.forceSkills.filter(s => s.name?.trim()).map(s => ({ name: s.name.trim(), dice: (s.dice || '').trim() })),
        weapons: form.weapons
          .filter(w => w.name?.trim())
          .map(w => ({
            name: w.name.trim(),
            skill: (w.skill || '').trim(),
            damage: (w.damage || '').trim(),
            range: (w.range || '').trim()
          })),
        specialAbilities: form.specialAbilities
          .filter(a => a.name?.trim() || a.description?.trim())
          .map(a => ({ name: (a.name || '').trim(), description: (a.description || '').trim() })),
        equipment: form.equipment.map(e => e.trim()).filter(Boolean)
      };
      await onSave(cleaned);
      onClose();
    } catch (e) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const modeTab = (id, label, icon) => (
    <button
      key={id}
      onClick={() => setMode(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${mode === id
          ? 'bg-[var(--hope-color)]/20 text-[var(--hope-color)] border border-[var(--hope-color)]/40'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
        }`}
    >
      {icon}
      {label}
    </button>
  );

  const label = (text) => (
    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
      {text}
    </label>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit: ${adversary.name}` : 'New Star Wars D6 Adversary'}
      size="large"
    >
      <div className="flex flex-col gap-6 px-1">
        <div className="flex flex-wrap gap-2">
          {modeTab('manual', 'Build Manually', <Pencil size={14} />)}
          {modeTab('template', 'Use Template', <BookOpen size={14} />)}
        </div>

        {/* Template picker */}
        {mode === 'template' && (
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-5 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setTemplateSource('official')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${templateSource === 'official' ? 'bg-[var(--hope-color)]/20 text-[var(--hope-color)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
              >
                Official ({STARWARSD6_ADVERSARIES.length})
              </button>
              <button
                onClick={() => setTemplateSource('campaign')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${templateSource === 'campaign' ? 'bg-[var(--hope-color)]/20 text-[var(--hope-color)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
              >
                Campaign ({campaignAdversaries.length})
              </button>
            </div>

            <input
              value={templateSearch}
              onChange={e => setTemplateSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
            />

            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {filteredTemplates.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                  {templateSource === 'campaign' ? 'No campaign adversaries yet.' : 'No results.'}
                </p>
              )}
              {filteredTemplates.map((adv, i) => (
                <button
                  key={`${adv.name}-${i}`}
                  onClick={() => applyTemplate(adv)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] font-mono shrink-0 capitalize">
                    {adv.classification || 'thug'}
                  </span>
                  <span className="flex-1 text-sm text-[var(--text-primary)] font-medium truncate">{adv.name}</span>
                  <span className="text-xs text-[var(--text-muted)] shrink-0 capitalize">{adv.affiliation}</span>
                  <Copy size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main form */}
        <div className="space-y-5">
          {/* Row 1: name + classification + hidden */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              {label('Name *')}
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Stormtrooper Sergeant"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
              />
            </div>
            <div className="sm:col-span-3">
              {label('Classification')}
              <select
                value={form.classification}
                onChange={e => set('classification', e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {STARWARSD6_CLASSIFICATIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              {label('Scale')}
              <select
                value={form.scale}
                onChange={e => set('scale', e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] capitalize"
              >
                {STARWARSD6_SCALES.map(s => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex flex-col justify-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hidden}
                  onChange={e => set('hidden', e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-[var(--text-secondary)]">Hidden</span>
              </label>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] -mt-3 italic">
            {STARWARSD6_CLASSIFICATIONS.find(c => c.value === form.classification)?.hint}
          </p>

          {/* Row 2: affiliation + force-sensitive */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              {label('Affiliation')}
              <select
                value={form.affiliation}
                onChange={e => set('affiliation', e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] capitalize"
              >
                {STARWARSD6_AFFILIATIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-6 flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.forceSensitive}
                  onChange={e => set('forceSensitive', e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-[var(--text-secondary)]">Force Sensitive</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            {label('Description')}
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Physical appearance and feel in one vivid sentence."
              rows={2}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--hope-color)]/50"
            />
          </div>

          {/* Motives */}
          <div>
            {label('Motives')}
            <input
              value={form.motives}
              onChange={e => set('motives', e.target.value)}
              placeholder="What drives this NPC — the thing a GM should play toward"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
            />
          </div>

          {/* Attributes (6 D6 dice codes) */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Attributes
              <span className="ml-2 font-normal normal-case text-[var(--text-muted)]">
                — D6 dice codes like 2D, 3D+2, 4D
              </span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[
                ['dexterity',  'Dexterity'],
                ['knowledge',  'Knowledge'],
                ['mechanical', 'Mechanical'],
                ['perception', 'Perception'],
                ['strength',   'Strength'],
                ['technical',  'Technical']
              ].map(([key, lbl]) => (
                <div key={key}>
                  {label(lbl)}
                  <input
                    value={form.attributes[key] || ''}
                    onChange={e => setAttr(key, e.target.value)}
                    placeholder="2D"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Move / Points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              {label('Move')}
              <input
                type="number"
                value={form.move}
                onChange={e => set('move', Number(e.target.value))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
              />
            </div>
            <div>
              {label('Force Points')}
              <input
                type="number"
                value={form.forcePoints}
                onChange={e => set('forcePoints', Number(e.target.value))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
              />
            </div>
            <div>
              {label('Dark Side')}
              <input
                type="number"
                value={form.darkSidePoints}
                onChange={e => set('darkSidePoints', Number(e.target.value))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
              />
            </div>
            <div>
              {label('Character Points')}
              <input
                type="number"
                value={form.characterPoints}
                onChange={e => set('characterPoints', Number(e.target.value))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Skills</p>
              <button onClick={addSkill} className="flex items-center gap-1 text-xs text-[var(--hope-color)] hover:opacity-80">
                <Plus size={12} /> Add Skill
              </button>
            </div>
            {form.skills.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] italic py-2">No skills yet.</p>
            )}
            <div className="space-y-2">
              {form.skills.map((skill, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={skill.name}
                    onChange={e => updateSkill(i, 'name', e.target.value)}
                    placeholder="Blaster"
                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                  />
                  <input
                    value={skill.dice}
                    onChange={e => updateSkill(i, 'dice', e.target.value)}
                    placeholder="5D+2"
                    className="w-28 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
                  />
                  <button
                    onClick={() => removeSkill(i)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Force Skills (only if force-sensitive) */}
          {form.forceSensitive && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Force Skills (Control / Sense / Alter)</p>
                <button onClick={addForceSkill} className="flex items-center gap-1 text-xs text-[var(--hope-color)] hover:opacity-80">
                  <Plus size={12} /> Add Force Skill
                </button>
              </div>
              <div className="space-y-2">
                {form.forceSkills.map((skill, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={skill.name}
                      onChange={e => updateForceSkill(i, 'name', e.target.value)}
                      placeholder="Control"
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                    />
                    <input
                      value={skill.dice}
                      onChange={e => updateForceSkill(i, 'dice', e.target.value)}
                      placeholder="4D+1"
                      className="w-28 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
                    />
                    <button
                      onClick={() => removeForceSkill(i)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weapons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Weapons</p>
              <button onClick={addWeapon} className="flex items-center gap-1 text-xs text-[var(--hope-color)] hover:opacity-80">
                <Plus size={12} /> Add Weapon
              </button>
            </div>
            <div className="space-y-3">
              {form.weapons.map((weapon, i) => (
                <div key={i} className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      value={weapon.name}
                      onChange={e => updateWeapon(i, 'name', e.target.value)}
                      placeholder="Weapon name"
                      className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                    />
                    <input
                      value={weapon.skill}
                      onChange={e => updateWeapon(i, 'skill', e.target.value)}
                      placeholder="Skill (Blaster)"
                      className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                    />
                    <input
                      value={weapon.damage}
                      onChange={e => updateWeapon(i, 'damage', e.target.value)}
                      placeholder="Damage (5D)"
                      className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
                    />
                    <div className="flex gap-2">
                      <input
                        value={weapon.range}
                        onChange={e => updateWeapon(i, 'range', e.target.value)}
                        placeholder="Range"
                        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                      />
                      <button
                        onClick={() => removeWeapon(i)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special abilities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Special Abilities</p>
              <button onClick={addAbility} className="flex items-center gap-1 text-xs text-[var(--hope-color)] hover:opacity-80">
                <Plus size={12} /> Add Ability
              </button>
            </div>
            <div className="space-y-3">
              {form.specialAbilities.map((ability, i) => (
                <div key={i} className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={ability.name}
                      onChange={e => updateAbility(i, 'name', e.target.value)}
                      placeholder="Ability name"
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                    />
                    <button
                      onClick={() => removeAbility(i)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    value={ability.description}
                    onChange={e => updateAbility(i, 'description', e.target.value)}
                    placeholder="Ability description"
                    rows={2}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--hope-color)]/50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Equipment</p>
              <button onClick={addEquipment} className="flex items-center gap-1 text-xs text-[var(--hope-color)] hover:opacity-80">
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {form.equipment.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item}
                    onChange={e => updateEquipment(i, e.target.value)}
                    placeholder="Stormtrooper armor, Comlink, etc."
                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                  />
                  <button
                    onClick={() => removeEquipment(i)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Add Adversary'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
