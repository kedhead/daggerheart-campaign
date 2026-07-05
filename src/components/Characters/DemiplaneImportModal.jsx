import { useState, useRef } from 'react';
import Modal from '../Modal';
import { CLASSES, getBaseProficiency, ANCESTRIES, COMMUNITIES, DOMAINS } from '../../data/systems/daggerheart';
import { Upload, FileText, Image, Loader2, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

const CLASS_NAMES = Object.keys(CLASSES);
const ANCESTRY_NAMES = Object.keys(ANCESTRIES);
const COMMUNITY_NAMES = Object.keys(COMMUNITIES);
const TRAIT_KEYS = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

const INPUT_CLS = 'w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] text-sm';
const SELECT_CLS = INPUT_CLS;
const LABEL_CLS = 'block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider';

export default function DemiplaneImportModal({ isOpen, onClose, addCharacter, character, updateCharacter }) {
  const isUpdate = !!character;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setParsed(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setError('Please upload a PDF export or a screenshot (PNG, JPG, WebP) of your Demiplane character sheet.');
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      setError('File is too large (max 32 MB).');
      return;
    }

    setLoading(true);
    setError(null);
    setParsed(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      try {
        const res = await fetch('/api/parse-character-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to read file');
        setParsed(data.character);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleFieldChange = (field, value) => {
    setParsed(prev => ({ ...prev, [field]: value }));
  };

  const handleTraitChange = (trait, value) => {
    setParsed(prev => ({
      ...prev,
      traits: { ...prev.traits, [trait]: parseInt(value, 10) || 0 },
    }));
  };

  const handleImport = async () => {
    if (!parsed) return;
    const normalizedClass = CLASS_NAMES.find(
      k => k.toLowerCase() === (parsed.class || '').toLowerCase()
    ) || parsed.class || '';
    const classInfo = CLASSES[normalizedClass] || {};
    const rawTraits = parsed.traits || {};
    const traits = {};
    TRAIT_KEYS.forEach(t => {
      traits[t] = Math.max(-2, Math.min(4, parseInt(rawTraits[t]) || 0));
    });

    if (isUpdate) {
      // Merge parsed data into existing character — preserve game state (HP, stress, hope, etc.)
      await updateCharacter(character.id, {
        ...character,
        name: parsed.name || character.name,
        playerName: parsed.playerName || character.playerName,
        class: normalizedClass || character.class,
        subclass: parsed.subclass,
        level: parsed.level || character.level,
        ancestry: parsed.ancestry,
        community: parsed.community,
        traits,
        evasion: parsed.evasion || classInfo.baseEvasion || character.evasion,
        armor: parsed.armor ?? character.armor,
        primaryDomain: parsed.primaryDomain,
        secondaryDomain: parsed.secondaryDomain,
        domainCards: Array.isArray(parsed.domainCards) ? parsed.domainCards : character.domainCards,
        primaryWeapon: parsed.primaryWeapon,
        secondaryWeapon: parsed.secondaryWeapon,
        equippedArmor: parsed.equippedArmor,
        gold: parsed.gold ?? character.gold,
        inventory: parsed.inventory,
        experiences: Array.isArray(parsed.experiences) ? parsed.experiences : character.experiences,
        backstory: parsed.backstory,
        playerNotes: parsed.playerNotes,
        proficiency: getBaseProficiency(parsed.level || character.level || 1),
      });
    } else {
      const hpCount = classInfo.baseHp || 6;
      await addCharacter({
        ...parsed,
        class: normalizedClass,
        level: parsed.level || 1,
        traits,
        hpSlots: Array(hpCount).fill(true),
        stressSlots: Array(6).fill(false),
        armorSlots: Array(6).fill(false),
        // Characters start with 2 Hope (SRD)
        hopeSlots: [true, true, false, false, false, false],
        evasion: parsed.evasion || classInfo.baseEvasion || 10,
        armor: parsed.armor || 0,
        proficiency: getBaseProficiency(parsed.level || 1),
        subclassLevel: 'foundation',
        markedTraits: [],
        levelHistory: [],
        domainNotes: '',
        dmNotes: '',
        avatarUrl: '',
        domainCards: Array.isArray(parsed.domainCards) ? parsed.domainCards : [],
        experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
      });
    }
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isUpdate ? `Sync ${character.name} from Demiplane` : 'Import from Demiplane'} size="large">
      <div className="space-y-6">

        {/* Phase 1: Upload */}
        {!loading && !parsed && (
          <>
            {/* Instructions */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed space-y-2">
              <p className="font-bold">Export your character from Demiplane, then upload it here:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                  <p className="font-bold text-indigo-200 mb-1 flex items-center gap-1.5">
                    <FileText size={11} /> Option 1 — PDF Export
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-indigo-200/70 text-[11px]">
                    <li>Open your character sheet on Demiplane</li>
                    <li>Click the <span className="font-semibold">⋮ menu</span> → Export PDF</li>
                    <li>Upload the downloaded PDF here</li>
                  </ol>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                  <p className="font-bold text-indigo-200 mb-1 flex items-center gap-1.5">
                    <Image size={11} /> Option 2 — Screenshot
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-indigo-200/70 text-[11px]">
                    <li>Open your character sheet on Demiplane</li>
                    <li>Take a screenshot of the page</li>
                    <li>Upload the image here</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Drop zone */}
            <div
              className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                dragging
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center gap-3 text-white/20">
                <FileText size={36} />
                <span className="text-white/10 text-2xl font-thin">|</span>
                <Image size={36} />
              </div>
              <div className="text-center">
                <p className="text-white/60 font-semibold mb-1">Drop your PDF or screenshot here</p>
                <p className="text-white/30 text-sm">PDF · PNG · JPG · WebP · max 32 MB</p>
              </div>
              <button
                className="px-6 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-sm font-bold border border-indigo-500/30 transition-colors"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <Upload size={14} className="inline mr-2" />
                Select File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => processFile(e.target.files[0])}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            </div>
          </>
        )}

        {/* Phase 2: Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-white/50">
            <Loader2 size={36} className="animate-spin text-indigo-400" />
            <p className="font-semibold text-white/60">Reading character sheet with AI…</p>
            <p className="text-xs text-white/30">This takes about 10–20 seconds</p>
          </div>
        )}

        {/* Phase 3: Review & Edit */}
        {!loading && parsed && (
          <>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle size={16} className="shrink-0" />
              <span>{isUpdate ? 'Character data read. Review changes below — your HP, stress, and other game state will be preserved.' : 'Character parsed successfully. Review and edit fields below before importing.'}</span>
            </div>

            <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {/* Identity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Character Name *</label>
                  <input className={INPUT_CLS} value={parsed.name || ''} onChange={e => handleFieldChange('name', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Player Name</label>
                  <input className={INPUT_CLS} value={parsed.playerName || ''} onChange={e => handleFieldChange('playerName', e.target.value)} />
                </div>
              </div>

              {/* Class & Level */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLS}>Class *</label>
                  <select className={SELECT_CLS} value={parsed.class || ''} onChange={e => handleFieldChange('class', e.target.value)}>
                    <option value="">— Select —</option>
                    {CLASS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Subclass</label>
                  <input className={INPUT_CLS} value={parsed.subclass || ''} onChange={e => handleFieldChange('subclass', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Level</label>
                  <input type="number" min={1} max={10} className={INPUT_CLS} value={parsed.level || 1} onChange={e => handleFieldChange('level', parseInt(e.target.value) || 1)} />
                </div>
              </div>

              {/* Heritage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Ancestry *</label>
                  <input className={INPUT_CLS} list="ancestry-list" value={parsed.ancestry || ''} onChange={e => handleFieldChange('ancestry', e.target.value)} />
                  <datalist id="ancestry-list">
                    {ANCESTRY_NAMES.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
                <div>
                  <label className={LABEL_CLS}>Community *</label>
                  <input className={INPUT_CLS} list="community-list" value={parsed.community || ''} onChange={e => handleFieldChange('community', e.target.value)} />
                  <datalist id="community-list">
                    {COMMUNITY_NAMES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              {/* Traits */}
              <div>
                <label className={LABEL_CLS}>Traits</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {TRAIT_KEYS.map(t => (
                    <div key={t} className="text-center">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">{t}</p>
                      <input
                        type="number"
                        min={-2}
                        max={4}
                        className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white text-center focus:outline-none focus:border-[rgb(var(--color-primary))] text-sm"
                        value={parsed.traits?.[t] ?? 0}
                        onChange={e => handleTraitChange(t, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Combat */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Evasion</label>
                  <input type="number" className={INPUT_CLS} value={parsed.evasion || 10} onChange={e => handleFieldChange('evasion', parseInt(e.target.value) || 10)} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Armor Score</label>
                  <input type="number" className={INPUT_CLS} value={parsed.armor || 0} onChange={e => handleFieldChange('armor', parseInt(e.target.value) || 0)} />
                </div>
              </div>

              {/* Domains */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Primary Domain</label>
                  <select className={SELECT_CLS} value={parsed.primaryDomain || ''} onChange={e => handleFieldChange('primaryDomain', e.target.value)}>
                    <option value="">— None —</option>
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Secondary Domain</label>
                  <select className={SELECT_CLS} value={parsed.secondaryDomain || ''} onChange={e => handleFieldChange('secondaryDomain', e.target.value)}>
                    <option value="">— None —</option>
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Equipment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Primary Weapon</label>
                  <input className={INPUT_CLS} value={parsed.primaryWeapon || ''} onChange={e => handleFieldChange('primaryWeapon', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Secondary Weapon</label>
                  <input className={INPUT_CLS} value={parsed.secondaryWeapon || ''} onChange={e => handleFieldChange('secondaryWeapon', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Armor</label>
                  <input className={INPUT_CLS} value={parsed.equippedArmor || ''} onChange={e => handleFieldChange('equippedArmor', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Gold</label>
                  <input type="number" className={INPUT_CLS} value={parsed.gold || 0} onChange={e => handleFieldChange('gold', parseInt(e.target.value) || 0)} />
                </div>
              </div>

              {/* Experiences */}
              <div>
                <label className={LABEL_CLS}>Experiences (one per line)</label>
                <textarea
                  className={`${INPUT_CLS} min-h-[60px]`}
                  value={Array.isArray(parsed.experiences) ? parsed.experiences.join('\n') : (parsed.experiences || '')}
                  onChange={e => handleFieldChange('experiences', e.target.value.split('\n').filter(Boolean))}
                />
              </div>

              {/* Inventory */}
              <div>
                <label className={LABEL_CLS}>Inventory</label>
                <textarea className={`${INPUT_CLS} min-h-[60px]`} value={parsed.inventory || ''} onChange={e => handleFieldChange('inventory', e.target.value)} />
              </div>

              {/* Backstory */}
              <div>
                <label className={LABEL_CLS}>Backstory</label>
                <textarea className={`${INPUT_CLS} min-h-[80px]`} value={parsed.backstory || ''} onChange={e => handleFieldChange('backstory', e.target.value)} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <button
                className="flex items-center gap-2 btn btn-secondary text-sm"
                onClick={reset}
              >
                <RotateCcw size={14} />
                Try a different file
              </button>
              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={!parsed.name || !parsed.class}
                >
                  {isUpdate ? 'Update Character' : 'Import Character'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
