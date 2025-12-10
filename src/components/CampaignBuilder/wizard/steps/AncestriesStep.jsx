import WizardStep from '../WizardStep';

export default function AncestriesStep({ value, onChange }) {
  return (
    <WizardStep
      title="Ancestries"
      description="Describe which ancestries are available and any unique aspects for this campaign."
    >
      <div className="form-group">
        <label>Ancestries Description</label>
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the available ancestries (Drakona, Fauns, Humans, etc.) and any campaign-specific aspects..."
          rows={10}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', fontFamily: 'monospace' }}
        />
        <small className="form-hint">Note any restrictions, special features, or cultural significance of each ancestry.</small>
      </div>
    </WizardStep>
  );
}
