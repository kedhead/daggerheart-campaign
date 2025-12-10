import WizardStep from '../WizardStep';

export default function CampaignMechanicsStep({ value, onChange }) {
  return (
    <WizardStep
      title="Campaign Mechanics"
      description="Define any special mechanics, rules, or systems unique to your campaign."
    >
      <div className="form-group">
        <label>Campaign Mechanics</label>
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe special mechanics like corruption systems, faction reputation, environmental hazards, etc..."
          rows={10}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', fontFamily: 'monospace' }}
        />
        <small className="form-hint">Optional: Add campaign-specific rules that support your themes and gameplay style.</small>
      </div>
    </WizardStep>
  );
}
