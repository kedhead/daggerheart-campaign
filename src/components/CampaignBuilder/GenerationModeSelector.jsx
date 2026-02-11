import React from 'react';
import { Sparkles, Copy, Zap } from 'lucide-react';

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
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        {modes.map((modeOption) => {
          const Icon = modeOption.icon;
          const isActive = mode === modeOption.id;
          const needsKey = modeOption.requiresKey && !hasAPIKey;

          return (
            <button
              key={modeOption.id}
              className={`
                flex-1 min-w-[200px] flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all text-left
                ${isActive
                  ? 'bg-[rgb(var(--color-primary))/10] border-2 border-[rgb(var(--color-primary))]'
                  : 'bg-[var(--bg-secondary)] border-2 border-white/5 hover:bg-white/5 hover:border-white/10'}
                ${needsKey ? 'border-amber-500/50 opacity-80' : ''}
                ${!modeOption.available ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => onModeChange(modeOption.id)}
              disabled={!modeOption.available}
            >
              <Icon size={20} className={isActive ? 'text-[rgb(var(--color-primary))]' : 'text-white/60'} />
              <div className="flex flex-col gap-1">
                <span className={`font-bold ${isActive ? 'text-[rgb(var(--color-primary-light))]' : 'text-white'}`}>
                  {modeOption.label}
                </span>
                <span className="text-xs text-white/60">{modeOption.description}</span>
                {needsKey && <span className="text-xs font-medium text-amber-400 mt-1">Requires API key</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
