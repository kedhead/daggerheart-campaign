import WizardStep from '../WizardStep';

export default function DistinctionsStep({ value, onChange }) {
  return (
    <WizardStep
      title="Distinctions"
      description="Define campaign-specific distinctions that players can choose to add flavor to their characters."
    >
      <div className="form-group">
        <label>Distinctions</label>
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="List campaign-specific distinctions with their effects and narrative significance..."
          rows={10}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', fontFamily: 'monospace' }}
        />
        <small className="form-hint">Distinctions are optional character traits unique to your campaign setting.</small>
      </div>
    </WizardStep>
  );
}
