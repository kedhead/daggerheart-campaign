import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import WizardStep from '../WizardStep';
import { templateService } from '../../../../services/templateService';

export default function IncitingIncidentStep({ value, onChange }) {
  const generateRandom = () => {
    const generated = templateService.generateIncitingIncident();
    onChange(generated);
  };

  return (
    <WizardStep
      title="Inciting Incident"
      description="What event kicks off the adventure and brings the heroes together?"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label>Inciting Incident</label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describe the event or crisis that launches the campaign and motivates the heroes to act..."
            rows={6}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }}
          />
          <small className="form-hint">This should be a compelling hook that gets your players invested right away.</small>
        </div>

        <button className="btn btn-secondary" onClick={generateRandom} style={{ alignSelf: 'flex-start' }}>
          <Sparkles size={20} />
          Generate Random
        </button>
      </div>
    </WizardStep>
  );
}
