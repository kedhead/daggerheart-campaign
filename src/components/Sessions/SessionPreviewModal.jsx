import { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle, MapPin, Users, Sword, BookOpen, ScrollText, Map } from 'lucide-react';
import Modal from '../Modal';

/**
 * Editable preview of every entity the GM Assistant generated from a SessionPlan.
 * The GM can tweak names, descriptions, stat blocks, notes, or remove items
 * before clicking Save All to commit to Firestore.
 */
export default function SessionPreviewModal({
  isOpen,
  preview,
  onCancel,
  onSave,
  isSaving,
  saveProgress
}) {
  const [edited, setEdited] = useState(preview);
  const [activeTab, setActiveTab] = useState('session');

  // Sync edited state when preview prop changes (e.g., first time modal opens)
  useEffect(() => {
    if (preview) setEdited(preview);
  }, [preview]);

  if (!preview || !edited) return null;

  const tabs = [
    { id: 'session', label: 'Session', icon: BookOpen, count: 1 },
    { id: 'encounters', label: 'Encounters', icon: Sword, count: (edited.encounters || []).length },
    { id: 'adversaries', label: 'Adversaries', icon: ScrollText, count: (edited.adversaries || []).length },
    { id: 'npcs', label: 'NPCs', icon: Users, count: (edited.npcs || []).length },
    { id: 'locations', label: 'Locations', icon: MapPin, count: (edited.locations || []).length },
    ...((edited.maps || []).length ? [{ id: 'maps', label: 'Maps', icon: Map, count: (edited.maps || []).length }] : [])
  ];

  const updateList = (key, idx, patch) => {
    setEdited((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === idx ? { ...item, ...patch } : item))
    }));
  };

  const removeFromList = (key, idx) => {
    setEdited((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={isSaving ? () => {} : onCancel} title="Review & Save Session" size="large">
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          Review the AI-generated content below. Edit any field, remove items you don't want, then click <span className="text-white">Save All</span> to write everything to your campaign.
        </p>

        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-[rgb(var(--color-primary))]/20 text-white border border-[rgb(var(--color-primary))]/40'
                    : 'text-white/60 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={14} />
                {t.label}
                <span className="text-white/40 text-xs">({t.count})</span>
              </button>
            );
          })}
        </div>

        <div className="max-h-[55vh] overflow-y-auto pr-2">
          {activeTab === 'session' && (
            <SessionEditor
              session={edited.sessionDraft}
              onChange={(patch) => setEdited((p) => ({ ...p, sessionDraft: { ...p.sessionDraft, ...patch } }))}
            />
          )}

          {activeTab === 'encounters' && (
            <ItemList
              items={edited.encounters}
              emptyText="No encounters in this plan."
              renderItem={(enc, i) => (
                <EncounterEditor
                  key={i}
                  encounter={enc}
                  onChange={(patch) => updateList('encounters', i, patch)}
                  onRemove={() => removeFromList('encounters', i)}
                />
              )}
            />
          )}

          {activeTab === 'adversaries' && (
            <ItemList
              items={edited.adversaries}
              emptyText="No new adversaries in this plan."
              renderItem={(adv, i) => (
                <AdversaryEditor
                  key={i}
                  adversary={adv}
                  onChange={(patch) => updateList('adversaries', i, patch)}
                  onRemove={() => removeFromList('adversaries', i)}
                />
              )}
            />
          )}

          {activeTab === 'npcs' && (
            <ItemList
              items={edited.npcs}
              emptyText="No new NPCs in this plan."
              renderItem={(npc, i) => (
                <NPCEditor
                  key={i}
                  npc={npc}
                  onChange={(patch) => updateList('npcs', i, patch)}
                  onRemove={() => removeFromList('npcs', i)}
                />
              )}
            />
          )}

          {activeTab === 'locations' && (
            <ItemList
              items={edited.locations}
              emptyText="No new locations in this plan."
              renderItem={(loc, i) => (
                <LocationEditor
                  key={i}
                  location={loc}
                  onChange={(patch) => updateList('locations', i, patch)}
                  onRemove={() => removeFromList('locations', i)}
                />
              )}
            />
          )}

          {activeTab === 'maps' && (
            <ItemList
              items={edited.maps}
              emptyText="No maps generated."
              renderItem={(m, i) => (
                <div key={i} className="bg-black/20 rounded-lg border border-white/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white">{m.label}</span>
                    <button type="button" className="text-white/40 hover:text-red-400" onClick={() => removeFromList('maps', i)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {m.url ? (
                    <img src={m.url} alt={m.label} className="max-h-64 rounded" />
                  ) : (
                    <p className="text-xs text-amber-300 flex items-center gap-1"><AlertTriangle size={12} /> Map generation failed: {m._generationError || 'unknown error'}</p>
                  )}
                </div>
              )}
            />
          )}
        </div>

        {isSaving && saveProgress && (
          <div className="bg-black/20 rounded-lg border border-white/10 p-3">
            <div className="flex items-center justify-between text-sm text-white/70 mb-1">
              <span>{saveProgress.label}</span>
              <span>{saveProgress.step}/{saveProgress.total}</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round((saveProgress.step / Math.max(saveProgress.total, 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary flex items-center gap-2"
            onClick={() => onSave(edited)}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ItemList({ items, renderItem, emptyText }) {
  if (!items.length) return <p className="text-white/40 text-sm italic">{emptyText}</p>;
  return <div className="space-y-3">{items.map(renderItem)}</div>;
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full p-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[rgb(var(--color-primary))]';

function SessionEditor({ session, onChange }) {
  return (
    <div className="space-y-3">
      <Field label="Title">
        <input type="text" value={session.title} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" value={session.date} onChange={(e) => onChange({ date: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Status">
          <select value={session.status} onChange={(e) => onChange({ status: e.target.value })} className={inputCls}>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
      </div>
      <Field label="Summary">
        <textarea value={session.summary} onChange={(e) => onChange({ summary: e.target.value })} rows={2} className={inputCls} />
      </Field>
      <Field label="DM Notes (Markdown)">
        <textarea value={session.dmNotes} onChange={(e) => onChange({ dmNotes: e.target.value })} rows={14} className={`${inputCls} font-mono`} />
      </Field>
    </div>
  );
}

function EncounterEditor({ encounter, onChange, onRemove }) {
  return (
    <div className="bg-black/20 rounded-lg border border-white/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={encounter.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${inputCls} font-semibold`}
        />
        <button type="button" className="ml-2 text-white/40 hover:text-red-400 shrink-0" onClick={onRemove}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Type">
          <select value={encounter.type} onChange={(e) => onChange({ type: e.target.value })} className={inputCls}>
            <option value="combat">Combat</option>
            <option value="puzzle">Puzzle</option>
            <option value="social">Social</option>
            <option value="exploration">Exploration</option>
          </select>
        </Field>
        <Field label="Minutes">
          <input type="number" value={encounter.estimatedMinutes || 0} onChange={(e) => onChange({ estimatedMinutes: parseInt(e.target.value, 10) || 0 })} className={inputCls} />
        </Field>
        <Field label="BP estimate">
          <input type="number" value={encounter.bpEstimate || 0} onChange={(e) => onChange({ bpEstimate: parseInt(e.target.value, 10) || 0 })} className={inputCls} />
        </Field>
      </div>
      <Field label="Description">
        <textarea value={encounter.description || encounter.summary || ''} onChange={(e) => onChange({ description: e.target.value })} rows={3} className={inputCls} />
      </Field>
      <Field label="Environment">
        <input type="text" value={encounter.environment || ''} onChange={(e) => onChange({ environment: e.target.value })} className={inputCls} />
      </Field>
      {encounter.adversarySlots?.length > 0 && (
        <div className="text-xs text-white/50">
          <span className="uppercase tracking-wider">Adversary slots:</span>{' '}
          {encounter.adversarySlots.map((s, i) => (
            <span key={i} className="text-white/70">
              {s.quantity}× {s._kind === 'existing' ? '(existing)' : `staged: ${s._stagedAdvKey}`}{i < encounter.adversarySlots.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AdversaryEditor({ adversary, onChange, onRemove }) {
  return (
    <div className="bg-black/20 rounded-lg border border-white/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={adversary.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${inputCls} font-semibold`}
        />
        <button type="button" className="ml-2 text-white/40 hover:text-red-400 shrink-0" onClick={onRemove}>
          <Trash2 size={14} />
        </button>
      </div>
      {adversary._generationError && (
        <div className="text-xs text-amber-300 flex items-center gap-1">
          <AlertTriangle size={12} /> Stat block generation failed; using a placeholder. Edit before saving.
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        <Field label="Tier">
          <input type="number" min={1} max={4} value={adversary.tier} onChange={(e) => onChange({ tier: parseInt(e.target.value, 10) || 1 })} className={inputCls} />
        </Field>
        <Field label="Role">
          <input type="text" value={adversary.role} onChange={(e) => onChange({ role: e.target.value })} className={inputCls} />
        </Field>
        <Field label="HP">
          <input type="number" value={adversary.hp} onChange={(e) => onChange({ hp: parseInt(e.target.value, 10) || 0 })} className={inputCls} />
        </Field>
        <Field label="Difficulty">
          <input type="number" value={adversary.difficulty} onChange={(e) => onChange({ difficulty: parseInt(e.target.value, 10) || 0 })} className={inputCls} />
        </Field>
      </div>
      <Field label="Description">
        <textarea value={adversary.description || ''} onChange={(e) => onChange({ description: e.target.value })} rows={2} className={inputCls} />
      </Field>
      <Field label="Attack damage">
        <input type="text" value={adversary.attackDamage || ''} onChange={(e) => onChange({ attackDamage: e.target.value })} className={inputCls} />
      </Field>
    </div>
  );
}

function NPCEditor({ npc, onChange, onRemove }) {
  return (
    <div className="bg-black/20 rounded-lg border border-white/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <input type="text" value={npc.name} onChange={(e) => onChange({ name: e.target.value })} className={`${inputCls} font-semibold`} />
        <button type="button" className="ml-2 text-white/40 hover:text-red-400 shrink-0" onClick={onRemove}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Ancestry">
          <input type="text" value={npc.ancestry || ''} onChange={(e) => onChange({ ancestry: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Occupation">
          <input type="text" value={npc.occupation || ''} onChange={(e) => onChange({ occupation: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Relationship">
          <select value={npc.relationship || 'neutral'} onChange={(e) => onChange({ relationship: e.target.value })} className={inputCls}>
            <option value="ally">Ally</option>
            <option value="neutral">Neutral</option>
            <option value="enemy">Enemy</option>
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea value={npc.description || ''} onChange={(e) => onChange({ description: e.target.value })} rows={3} className={inputCls} />
      </Field>
      <Field label="Notes / hooks">
        <textarea value={npc.notes || ''} onChange={(e) => onChange({ notes: e.target.value })} rows={2} className={inputCls} />
      </Field>
    </div>
  );
}

function LocationEditor({ location, onChange, onRemove }) {
  return (
    <div className="bg-black/20 rounded-lg border border-white/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <input type="text" value={location.name} onChange={(e) => onChange({ name: e.target.value })} className={`${inputCls} font-semibold`} />
        <button type="button" className="ml-2 text-white/40 hover:text-red-400 shrink-0" onClick={onRemove}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Type">
          <input type="text" value={location.type || ''} onChange={(e) => onChange({ type: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Region">
          <input type="text" value={location.region || ''} onChange={(e) => onChange({ region: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <Field label="Description">
        <textarea value={location.description || ''} onChange={(e) => onChange({ description: e.target.value })} rows={3} className={inputCls} />
      </Field>
      <Field label="Notable features">
        <textarea value={location.notableFeatures || ''} onChange={(e) => onChange({ notableFeatures: e.target.value })} rows={2} className={inputCls} />
      </Field>
      <Field label="Secrets (DM only)">
        <textarea value={location.secrets || ''} onChange={(e) => onChange({ secrets: e.target.value })} rows={2} className={inputCls} />
      </Field>
    </div>
  );
}
