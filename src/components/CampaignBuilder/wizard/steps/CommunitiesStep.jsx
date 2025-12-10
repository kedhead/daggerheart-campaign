import WizardStep from '../WizardStep';

export default function CommunitiesStep({ value, onChange }) {
  return (
    <WizardStep
      title="Communities"
      description="Describe the different communities (factions, cultures, groups) in your campaign world."
    >
      <div className="form-group">
        <label>Communities Description</label>
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the major communities in your world: their cultures, values, conflicts, and relationships..."
          rows={10}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', fontFamily: 'monospace' }}
        />
        <small className="form-hint">Describe each major community and how they interact with each other.</small>
      </div>
    </WizardStep>
  );
}
