import WizardStep from '../WizardStep';

export default function OverviewStep({ value, onChange }) {
  return (
    <WizardStep
      title="Campaign Overview"
      description="Write a detailed overview of your campaign world, setting, and central conflict."
    >
      <div className="form-group">
        <label>Overview</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the world, the current state of affairs, the main conflicts, and what makes this campaign unique..."
          rows={12}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }}
        />
        <small className="form-hint">This should be a comprehensive 2-3 paragraph overview that sets the stage for your campaign.</small>
      </div>
    </WizardStep>
  );
}
