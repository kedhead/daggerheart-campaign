import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import WizardStep from '../WizardStep';
import { useAIGeneration } from '../../../../hooks/useAIGeneration';
import GenerationModeSelector from '../../GenerationModeSelector';
import TemplateGenerator from '../../generators/TemplateGenerator';
import PromptGenerator from '../../generators/PromptGenerator';
import DirectAPIGenerator from '../../generators/DirectAPIGenerator';
import { useAPIKey } from '../../../../hooks/useAPIKey';

export default function PitchStep({ value, onChange, campaign, userId, hasAPIKey }) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [mode, setMode] = useState('template');
  const { generating, result, error, generatedPrompt, generateFromTemplate, generatePrompt, parsePastedResponse, generateWithAPI, clearGeneration } = useAIGeneration();
  const { keys, hasKey } = useAPIKey(userId);

  const handleGenerate = async () => {
    try {
      const context = {
        campaign: campaign?.name,
        campaignDescription: campaign?.description
      };

      if (mode === 'template') {
        const generated = await generateFromTemplate('pitch', context);
        onChange(generated);
        setShowGenerator(false);
      } else if (mode === 'prompt') {
        generatePrompt('pitch', context);
      } else if (mode === 'api') {
        const generated = await generateWithAPI('pitch', context, hasKey('anthropic') ? keys.anthropic : keys.openai, keys.provider);
        onChange(generated);
        setShowGenerator(false);
      }
    } catch (err) {
      console.error('Generation error:', err);
    }
  };

  const handleParse = (responseText) => {
    const parsed = parsePastedResponse('pitch', responseText);
    if (parsed) {
      onChange(parsed);
      setShowGenerator(false);
    }
  };

  return (
    <WizardStep
      title="Campaign Pitch"
      description="Write a compelling 1-2 sentence pitch that captures the essence of your campaign."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label>Pitch</label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="The heroes must venture into the corrupted Witherwild forest to discover the source of the spreading blight before it consumes the entire realm..."
            rows={4}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }}
          />
          <small className="form-hint">Keep it concise but exciting! This will set the tone for your entire campaign.</small>
        </div>

        {!showGenerator && (
          <button
            className="btn btn-secondary"
            onClick={() => setShowGenerator(true)}
            style={{ alignSelf: 'flex-start' }}
          >
            <Sparkles size={20} />
            Generate with AI
          </button>
        )}

        {showGenerator && (
          <div className="quick-generator-modal" style={{ border: '2px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
            <GenerationModeSelector
              mode={mode}
              onModeChange={setMode}
              hasAPIKey={hasKey()}
            />

            {mode === 'template' && (
              <TemplateGenerator
                type="pitch"
                onGenerate={handleGenerate}
                generating={generating}
              />
            )}

            {mode === 'prompt' && (
              <PromptGenerator
                prompt={generatedPrompt}
                onGeneratePrompt={handleGenerate}
                onParse={handleParse}
                generating={generating}
              />
            )}

            {mode === 'api' && (
              <DirectAPIGenerator
                type="pitch"
                hasAPIKey={hasKey()}
                onGenerate={handleGenerate}
                onConfigureKey={() => {/* TODO: Open settings */}}
                generating={generating}
              />
            )}

            {error && (
              <div className="generator-error">{error}</div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => { setShowGenerator(false); clearGeneration(); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
