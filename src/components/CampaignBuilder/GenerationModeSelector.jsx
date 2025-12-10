import React from 'react';
import { Sparkles, Copy, Zap } from 'lucide-react';
import './CampaignBuilder.css';

/**
 * Generation Mode Selector
 * Allows user to choose between Template, Prompt, or API generation modes
 */
export default function GenerationModeSelector({ mode, onModeChange, hasAPIKey }) {
  const modes = [
    {
      id: 'template',
      label: 'Template',
      icon: Sparkles,
      description: 'Random generation from curated lists',
      available: true
    },
    {
      id: 'prompt',
      label: 'Prompt Generator',
      icon: Copy,
      description: 'Copy prompt to use with Claude/ChatGPT',
      available: true
    },
    {
      id: 'api',
      label: 'Direct API',
      icon: Zap,
      description: 'Generate with your API key',
      available: true,
      requiresKey: true
    }
  ];

  return (
    <div className="generation-mode-selector">
      <div className="mode-tabs">
        {modes.map((modeOption) => {
          const Icon = modeOption.icon;
          const isActive = mode === modeOption.id;
          const needsKey = modeOption.requiresKey && !hasAPIKey;

          return (
            <button
              key={modeOption.id}
              className={`mode-tab ${isActive ? 'active' : ''} ${needsKey ? 'needs-key' : ''}`}
              onClick={() => onModeChange(modeOption.id)}
              disabled={!modeOption.available}
            >
              <Icon size={20} />
              <div className="mode-tab-content">
                <span className="mode-label">{modeOption.label}</span>
                <span className="mode-description">{modeOption.description}</span>
                {needsKey && <span className="mode-warning">Requires API key</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
