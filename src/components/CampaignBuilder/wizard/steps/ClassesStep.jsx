import WizardStep from '../WizardStep';

export default function ClassesStep({ value, onChange }) {
  return (
    <WizardStep
      title="Classes"
      description="Describe which classes are available and any campaign-specific modifications."
    >
      <div className="form-group">
        <label>Classes Description</label>
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the available classes (Bard, Druid, Guardian, Ranger, etc.) and any campaign-specific tweaks..."
          rows={10}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', fontFamily: 'monospace' }}
        />
        <small className="form-hint">Note any restricted classes or special features for certain classes in your campaign.</small>
      </div>
    </WizardStep>
  );
}
