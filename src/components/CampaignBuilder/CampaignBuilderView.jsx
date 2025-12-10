import { useState } from 'react';
import { Wand2, FileText, Sparkles } from 'lucide-react';
import CampaignBuilderWizard from './CampaignBuilderWizard';
import { useCampaignBuilder } from '../../hooks/useCampaignBuilder';
import { getAvailableTemplates } from '../../data/campaignFrameTemplates';
import './CampaignBuilder.css';

export default function CampaignBuilderView({
  campaign,
  campaignFrame,
  campaignFrameDraft,
  saveCampaignFrameDraft,
  completeCampaignFrame,
  deleteCampaignFrameDraft,
  onBack
}) {
  const [wizardStarted, setWizardStarted] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const wizardState = useCampaignBuilder(
    campaign?.id,
    campaignFrameDraft,
    saveCampaignFrameDraft,
    completeCampaignFrame
  );

  const templates = getAvailableTemplates();
  const hasDraft = !!campaignFrameDraft;

  const handleStartWizard = (template = null) => {
    if (template) {
      wizardState.loadTemplate(template);
    }
    setWizardStarted(true);
  };

  const handleContinueDraft = () => {
    setWizardStarted(true);
  };

  const handleDeleteDraft = async () => {
    if (confirm('Are you sure you want to delete your draft? This cannot be undone.')) {
      await deleteCampaignFrameDraft();
    }
  };

  const handleComplete = () => {
    setWizardStarted(false);
    if (onBack) {
      onBack();
    }
  };

  // If wizard is started, show the wizard
  if (wizardStarted) {
    return (
      <CampaignBuilderWizard
        campaign={campaign}
        campaignFrame={campaignFrame}
        wizardState={wizardState}
        onComplete={handleComplete}
      />
    );
  }

  // Otherwise show the welcome/template selection screen
  return (
    <div className="campaign-builder-view">
      <div className="view-header" style={{ textAlign: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '0 0 0.5rem 0' }}>
            <Wand2 size={32} />
            Campaign Builder
          </h1>
          <p className="view-subtitle">Create a complete campaign frame to guide your adventure</p>
        </div>
      </div>

      {/* Continue Draft */}
      {hasDraft && (
        <div className="card" style={{ background: 'var(--hope-color-10)', border: '2px solid var(--hope-color)', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} />
            Resume Draft
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
            You have an unfinished campaign frame. Continue where you left off!
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleContinueDraft}>
              Continue Draft
            </button>
            <button className="btn btn-danger" onClick={handleDeleteDraft}>
              Delete Draft
            </button>
          </div>
        </div>
      )}

      {/* Start Fresh */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Start from Scratch</h3>
        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
          Build your campaign frame from the ground up with guidance at every step.
        </p>
        <button className="btn btn-primary" onClick={() => handleStartWizard()}>
          <Sparkles size={20} />
          Start Blank Campaign Frame
        </button>
      </div>

      {/* Templates */}
      <div>
        <h3 style={{ margin: '0 0 1rem 0' }}>Or Choose a Template</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {templates.map((template) => (
            <div
              key={template.id}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: selectedTemplate?.id === template.id ? '2px solid var(--hope-color)' : '1px solid var(--border)'
              }}
              onClick={() => setSelectedTemplate(template)}
            >
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--hope-color)' }}>{template.name}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Complexity: {template.complexity}/3
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {template.pitch}
                </p>
              </div>
              {selectedTemplate?.id === template.id && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartWizard(template);
                  }}
                >
                  Use This Template
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="card" style={{ marginTop: '2rem', background: 'var(--card-bg)', borderLeft: '4px solid var(--hope-color)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>What's a Campaign Frame?</h4>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          A campaign frame is a structured guide that defines the core elements of your campaign:
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <li>Pitch, themes, and tone</li>
          <li>World overview and touchstones</li>
          <li>Player and GM principles</li>
          <li>Inciting incident and campaign mechanics</li>
          <li>Session zero questions</li>
        </ul>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          The wizard will guide you through all 14 steps with AI assistance available at each stage!
        </p>
      </div>
    </div>
  );
}
