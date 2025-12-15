import { useState } from 'react';
import { Wand2, FileText, Sparkles, Edit, Eye, CheckCircle } from 'lucide-react';
import CampaignBuilderWizard from './CampaignBuilderWizard';
import { useCampaignBuilder } from '../../hooks/useCampaignBuilder';
import { getAvailableTemplates } from '../../data/campaignFrameTemplates';
import './CampaignBuilder.css';

export default function CampaignBuilderView({
  userId,
  campaign,
  campaignFrame,
  campaignFrameDraft,
  saveCampaignFrameDraft,
  completeCampaignFrame,
  deleteCampaignFrameDraft,
  updateCampaign,
  onBack,
  addNPC,
  addLocation,
  addLore,
  addEncounter,
  addTimelineEvent
}) {
  const [wizardStarted, setWizardStarted] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [viewingFrame, setViewingFrame] = useState(false);

  const wizardState = useCampaignBuilder(
    campaign?.id,
    campaignFrameDraft,
    saveCampaignFrameDraft,
    completeCampaignFrame
  );

  const templates = getAvailableTemplates(campaign?.gameSystem);
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

  // If viewing completed campaign frame
  if (viewingFrame && campaignFrame) {
    return (
      <div className="campaign-builder-view">
        <div className="view-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 0 0.5rem 0' }}>
              <CheckCircle size={32} style={{ color: 'var(--hope-color)' }} />
              Campaign Frame
            </h1>
            <p className="view-subtitle">Your completed campaign frame for {campaign.name}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setViewingFrame(false)}>
            Back
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Pitch */}
          {campaignFrame.pitch && (
            <div className="card">
              <h3>Campaign Pitch</h3>
              <p>{campaignFrame.pitch}</p>
            </div>
          )}

          {/* Tone & Feel */}
          {campaignFrame.toneAndFeel && campaignFrame.toneAndFeel.length > 0 && (
            <div className="card">
              <h3>Tone & Feel</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {campaignFrame.toneAndFeel.map((tone, i) => (
                  <span key={i} className="tag">{tone}</span>
                ))}
              </div>
            </div>
          )}

          {/* Themes */}
          {campaignFrame.themes && campaignFrame.themes.length > 0 && (
            <div className="card">
              <h3>Themes</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {campaignFrame.themes.map((theme, i) => (
                  <span key={i} className="tag">{theme}</span>
                ))}
              </div>
            </div>
          )}

          {/* Touchstones */}
          {campaignFrame.touchstones && campaignFrame.touchstones.length > 0 && (
            <div className="card">
              <h3>Touchstones</h3>
              <ul>
                {campaignFrame.touchstones.map((touchstone, i) => (
                  <li key={i}>{touchstone}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Overview */}
          {campaignFrame.overview && (
            <div className="card">
              <h3>Campaign Overview</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{campaignFrame.overview}</p>
            </div>
          )}

          {/* Inciting Incident */}
          {campaignFrame.incitingIncident && (
            <div className="card">
              <h3>Inciting Incident</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{campaignFrame.incitingIncident}</p>
            </div>
          )}

          {/* Player Principles */}
          {campaignFrame.playerPrinciples && campaignFrame.playerPrinciples.length > 0 && (
            <div className="card">
              <h3>Player Principles</h3>
              <ul>
                {campaignFrame.playerPrinciples.map((principle, i) => (
                  <li key={i}>{principle}</li>
                ))}
              </ul>
            </div>
          )}

          {/* GM Principles */}
          {campaignFrame.gmPrinciples && campaignFrame.gmPrinciples.length > 0 && (
            <div className="card">
              <h3>GM Principles</h3>
              <ul>
                {campaignFrame.gmPrinciples.map((principle, i) => (
                  <li key={i}>{principle}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Session Zero Questions */}
          {campaignFrame.sessionZeroQuestions && campaignFrame.sessionZeroQuestions.length > 0 && (
            <div className="card">
              <h3>Session Zero Questions</h3>
              <ul>
                {campaignFrame.sessionZeroQuestions.map((question, i) => (
                  <li key={i}>{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If wizard is started, show the wizard
  if (wizardStarted) {
    return (
      <CampaignBuilderWizard
        userId={userId}
        campaign={campaign}
        campaignFrame={campaignFrame}
        wizardState={wizardState}
        onComplete={handleComplete}
        addNPC={addNPC}
        addLocation={addLocation}
        addLore={addLore}
        addEncounter={addEncounter}
        addTimelineEvent={addTimelineEvent}
        updateCampaign={updateCampaign}
      />
    );
  }

  // Check if a completed campaign frame exists
  const hasCompletedFrame = campaignFrame && campaignFrame.status === 'completed';

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

      {/* Completed Campaign Frame */}
      {hasCompletedFrame && (
        <div className="card" style={{ background: 'var(--hope-color-10)', border: '2px solid var(--hope-color)', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} style={{ color: 'var(--hope-color)' }} />
            Campaign Frame Completed!
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
            You have a completed campaign frame for this campaign.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setViewingFrame(true)}>
              <Eye size={20} />
              View Campaign Frame
            </button>
          </div>
        </div>
      )}

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
