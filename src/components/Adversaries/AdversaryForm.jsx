import { useState } from 'react';
import { Wand2, Loader2, Plus, Trash2, Pencil, Copy, Sparkles, BookOpen } from 'lucide-react';
import Modal from '../Modal';
import { generateAdversaryStatblock, generateBossStatblock } from '../../services/adversaryGenerator';
import BossPhaseEditor from '../Encounters/BossPhaseEditor';
import { DAGGERHEART_ADVERSARIES } from '../../data/daggerheartAdversaries';
import { useAPIKey } from '../../hooks/useAPIKey';

const ROLES = ['minion', 'horde', 'standard', 'bruiser', 'skulk', 'ranged', 'support', 'social', 'leader', 'solo', 'boss'];
const ATTACK_RANGES = ['Melee', 'Very Close', 'Close', 'Far', 'Very Far'];
const FEATURE_TYPES = ['passive', 'action', 'reaction'];

const ROLE_HINTS = {
  minion:   'Weak and disposable — dangerous only in groups',
  horde:    'Attacks as one unit — overwhelming in numbers',
  standard: 'Balanced baseline adversary',
  bruiser:  'High HP and damage — slow and hits hard',
  skulk:    'Evasive and cunning — hit-and-run tactics',
  ranged:   'Attacks from distance — stays out of reach',
  support:  'Buffs allies and debuffs enemies',
  social:   'Narrative/dialogue focus — low combat stats',
  leader:   'Commands other adversaries — buffs allies',
  solo:     'Fights an entire party alone — very powerful',
  boss:     'Multi-phase climactic encounter — gains new abilities as HP drops (8 BP)'
};

const EMPTY_FORM = {
  name: '',
  tier: 1,
  role: 'standard',
  description: '',
  motives: '',
  difficulty: 12,
  hp: 4,
  stress: 2,
  attack: 1,
  attackName: '',
  attackRange: 'Melee',
  attackDamage: '1d6+2 phy',
  experience: '',
  thresholds: { minor: 6, major: 12 },
  features: [],
  phases: [],
  hidden: false
};

function fromAdversary(adv) {
  return {
    name: adv.name || '',
    tier: adv.tier || 1,
    role: adv.role || 'standard',
    description: adv.description || '',
    motives: adv.motives || '',
    difficulty: adv.difficulty || 12,
    hp: adv.hp || 4,
    stress: adv.stress || 2,
    attack: adv.attack ?? 1,
    attackName: adv.attackName || '',
    attackRange: adv.attackRange || 'Melee',
    attackDamage: adv.attackDamage || '',
    experience: adv.experience || '',
    thresholds: { minor: adv.thresholds?.minor || 6, major: adv.thresholds?.major || 12 },
    features: adv.features ? adv.features.map(f => ({ ...f })) : [],
    phases: adv.phases
      ? adv.phases.map(p => ({
          ...p,
          newFeatures: p.newFeatures ? p.newFeatures.map(f => ({ ...f })) : [],
          summons: p.summons ? p.summons.map(s => ({ ...s })) : []
        }))
      : [],
    hidden: adv.hidden || false
  };
}

export default function AdversaryForm({
  isOpen,
  onClose,
  onSave,
  adversary = null,        // existing adversary for edit mode
  campaignAdversaries = [], // all adversaries in the campaign (for template picker)
  userId,
  campaignContext = '',    // pre-built campaign brain context string
  initialMode = 'manual'   // 'manual' | 'ai' | 'template' — lets callers open straight into AI mode
}) {
  const isEdit = !!adversary;
  const [mode, setMode] = useState(initialMode); // 'manual' | 'ai' | 'template'
  const [form, setForm] = useState(() => adversary ? fromAdversary(adversary) : { ...EMPTY_FORM, features: [] });
  const [aiConcept, setAiConcept] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateSource, setTemplateSource] = useState('campaign'); // 'campaign' | 'srd'
  const [saving, setSaving] = useState(false);

  const { getEffectiveKey } = useAPIKey(userId);
  const anthropicInfo = getEffectiveKey('anthropic');
  const openaiInfo = getEffectiveKey('openai');
  const hasAI = !!(anthropicInfo?.key || openaiInfo?.key);
  const aiProvider = anthropicInfo?.key ? 'anthropic' : 'openai';
  const aiKey = anthropicInfo?.key || openaiInfo?.key;

  // ── Form helpers ────────────────────────────────────────────────────────────

  const set = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const setNested = (obj, field, value) =>
    setForm(prev => ({ ...prev, [obj]: { ...prev[obj], [field]: value } }));

  const applyTemplate = (source) => {
    setForm(fromAdversary(source));
    setMode('manual');
    setTemplateSearch('');
  };

  // ── Features helpers ────────────────────────────────────────────────────────

  const addFeature = () =>
    setForm(prev => ({
      ...prev,
      features: [...prev.features, { name: '', type: 'passive', description: '' }]
    }));

  const updateFeature = (i, field, value) =>
    setForm(prev => {
      const features = [...prev.features];
      features[i] = { ...features[i], [field]: value };
      return { ...prev, features };
    });

  const removeFeature = (i) =>
    setForm(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));

  // ── AI generation ───────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!aiConcept.trim()) { setAiError('Describe the adversary concept first.'); return; }
    setAiGenerating(true);
    setAiError('');
    try {
      const result = form.role === 'boss'
        ? await generateBossStatblock({
            concept: aiConcept,
            tier: form.tier,
            apiKey: aiKey,
            provider: aiProvider,
            campaignContext
          })
        : await generateAdversaryStatblock({
            concept: aiConcept,
            tier: form.tier,
            role: form.role,
            apiKey: aiKey,
            provider: aiProvider,
            campaignContext
          });
      setForm(prev => ({ ...result, hidden: prev.hidden }));
      setMode('manual');
    } catch (e) {
      setAiError(e.message || 'Generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // ── Template search ─────────────────────────────────────────────────────────

  const templateList = templateSource === 'srd' ? DAGGERHEART_ADVERSARIES : campaignAdversaries;
  const filteredTemplates = templateList.filter(a =>
    !templateSearch || a.name?.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Name is required.'); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        isBoss: form.role === 'boss',
        phases: form.role === 'boss' ? (form.phases || []) : []
      });
      onClose();
    } catch (e) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

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

  const input = (field, props = {}) => (
    <input
      value={form[field] ?? ''}
      onChange={e => set(field, e.target.type === 'number' ? Number(e.target.value) : e.target.value)}
      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
      {...props}
    />
  );

  const numInput = (field, min, max) =>
    input(field, { type: 'number', min, max });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit: ${adversary.name}` : 'New Adversary'}
      size="large"
    >
      <div className="flex flex-col gap-6 px-1">

        {/* ── Mode selector ── */}
        <div className="flex flex-wrap gap-2">
          {modeTab('manual', 'Build Manually', <Pencil size={14} />)}
          {modeTab('ai', 'AI Generate', <Sparkles size={14} />)}
          {modeTab('template', 'Use Template', <BookOpen size={14} />)}
        </div>

        {/* ── AI Generate panel ── */}
        {mode === 'ai' && (
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--hope-color)]/20 p-5 space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Set the <strong className="text-[var(--text-primary)]">Tier</strong> and{' '}
              <strong className="text-[var(--text-primary)]">Role</strong> below, then describe your concept.
              The AI will generate a rules-accurate Daggerheart statblock.
            </p>

            {/* Tier + Role quick-set */}
            <div className="flex gap-4">
              <div className="flex-1">
                {label('Tier')}
                <select
                  value={form.tier}
                  onChange={e => set('tier', Number(e.target.value))}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  {[1,2,3,4].map(t => (
                    <option key={t} value={t}>Tier {t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                {label('Role')}
                <select
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-[var(--hope-color)] italic -mt-2">{ROLE_HINTS[form.role]}</p>

            {/* Concept */}
            <div>
              {label('Concept / Description')}
              <textarea
                value={aiConcept}
                onChange={e => setAiConcept(e.target.value)}
                placeholder="e.g. A decaying skeletal knight wielding a rusted greatsword, bound to an ancient oath it can never fulfil."
                rows={3}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--hope-color)]/50"
              />
            </div>

            {aiError && <p className="text-sm text-red-400">{aiError}</p>}

            <button
              onClick={handleGenerate}
              disabled={aiGenerating}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {aiGenerating
                ? <><Loader2 size={16} className="animate-spin" /> Generating Statblock…</>
                : <><Wand2 size={16} /> Generate Statblock</>
              }
            </button>
          </div>
        )}

        {/* ── Template picker panel ── */}
        {mode === 'template' && (
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-5 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setTemplateSource('campaign')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${templateSource === 'campaign' ? 'bg-[var(--hope-color)]/20 text-[var(--hope-color)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
              >
                Campaign ({campaignAdversaries.length})
              </button>
              <button
                onClick={() => setTemplateSource('srd')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${templateSource === 'srd' ? 'bg-[var(--hope-color)]/20 text-[var(--hope-color)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
              >
                Official SRD ({DAGGERHEART_ADVERSARIES.length})
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
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] font-mono shrink-0">T{adv.tier}</span>
                  <span className="flex-1 text-sm text-[var(--text-primary)] font-medium truncate">{adv.name}</span>
                  <span className="text-xs text-[var(--text-muted)] shrink-0">{adv.role}</span>
                  <Copy size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Form fields (always visible) ── */}
        <div className="space-y-5">

          {/* Row 1: Name + Tier + Role + Hidden */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              {label('Name *')}
              {input('name', { placeholder: 'e.g. Ashbound Sentinel' })}
            </div>
            <div className="sm:col-span-2">
              {label('Tier')}
              <select
                value={form.tier}
                onChange={e => set('tier', Number(e.target.value))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {[1,2,3,4].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3">
              {label('Role')}
              <select
                value={form.role}
                onChange={e => set('role', e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
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

          {form.role && (
            <p className="text-xs text-[var(--text-muted)] -mt-3 italic">{ROLE_HINTS[form.role]}</p>
          )}

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
              placeholder="e.g. Protect the tomb, drag away intruders, serve the ancient oath"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
            />
          </div>

          {/* Stats row */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Stats</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                {label('Difficulty (DC)')}
                {numInput('difficulty', 6, 30)}
              </div>
              <div>
                {label('HP')}
                {numInput('hp', 1, 40)}
              </div>
              <div>
                {label('Stress')}
                {numInput('stress', 0, 10)}
              </div>
              <div>
                {label('Attack Mod')}
                {numInput('attack', -2, 10)}
              </div>
            </div>
          </div>

          {/* Thresholds */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Damage Thresholds
              <span className="ml-2 font-normal normal-case text-[var(--text-muted)]">
                — damage below Minor = 1 HP · above Major = 3 HP
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {label('Minor')}
                <input
                  type="number"
                  value={form.thresholds.minor}
                  onChange={e => setNested('thresholds', 'minor', Number(e.target.value))}
                  min={1}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                />
              </div>
              <div>
                {label('Major')}
                <input
                  type="number"
                  value={form.thresholds.major}
                  onChange={e => setNested('thresholds', 'major', Number(e.target.value))}
                  min={1}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                />
              </div>
            </div>
          </div>

          {/* Attack row */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Standard Attack</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                {label('Attack Name')}
                <input
                  value={form.attackName}
                  onChange={e => set('attackName', e.target.value)}
                  placeholder="e.g. Greatsword"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                />
              </div>
              <div>
                {label('Range')}
                <select
                  value={form.attackRange}
                  onChange={e => set('attackRange', e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  {ATTACK_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                {label('Damage')}
                <input
                  value={form.attackDamage}
                  onChange={e => set('attackDamage', e.target.value)}
                  placeholder="e.g. 1d8+3 phy"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--hope-color)]/50"
                />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            {label('Experience / Skill Bonus')}
            <input
              value={form.experience}
              onChange={e => set('experience', e.target.value)}
              placeholder="e.g. Tracking +3, Keen Senses +2"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
            />
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Features
                <span className="ml-2 font-normal normal-case text-[var(--text-muted)]">
                  (passive · action · reaction)
                </span>
              </p>
              <button
                onClick={addFeature}
                className="flex items-center gap-1 text-xs text-[var(--hope-color)] hover:opacity-80 transition-opacity"
              >
                <Plus size={12} /> Add Feature
              </button>
            </div>

            {form.features.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] italic py-2">
                No features yet. Adversaries typically have 2–4 features.
              </p>
            )}

            <div className="space-y-3">
              {form.features.map((feature, i) => (
                <div key={i} className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={feature.name}
                      onChange={e => updateFeature(i, 'name', e.target.value)}
                      placeholder="Feature name"
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--hope-color)]/50"
                    />
                    <select
                      value={feature.type}
                      onChange={e => updateFeature(i, 'type', e.target.value)}
                      className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)]"
                    >
                      {FEATURE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeFeature(i)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    value={feature.description}
                    onChange={e => updateFeature(i, 'description', e.target.value)}
                    placeholder="Feature description using Daggerheart terms (Mark a Stress, Very Close range, Vulnerable, etc.)"
                    rows={2}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--hope-color)]/50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Boss phase editor (only shown when role is boss) */}
          {form.role === 'boss' && (
            <BossPhaseEditor
              phases={form.phases || []}
              onChange={phases => setForm(prev => ({ ...prev, phases }))}
              campaignAdversaries={campaignAdversaries}
            />
          )}
        </div>

        {/* ── Footer ── */}
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
