import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';

/**
 * Prompt Generator Component
 * Generates prompts for copy/paste to external AI services
 */
export default function PromptGenerator({
  type,
  prompt,
  onGeneratePrompt,
  onParseResponse,
  generating
}) {
  const [promptCopied, setPromptCopied] = useState(false);
  const [responseText, setResponseText] = useState('');

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleParseResponse = () => {
    if (responseText.trim()) {
      onParseResponse(responseText);
      setResponseText('');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-white/5">
        <FileText size={24} className="text-indigo-400 mt-1" />
        <div>
          <h4 className="text-base font-bold text-white mb-1">Prompt Generator</h4>
          <p className="text-sm text-white/60 m-0">Copy the prompt below to Claude.ai or ChatGPT, then paste the response back here.</p>
        </div>
      </div>

      {!prompt ? (
        <button
          className="btn btn-primary"
          onClick={onGeneratePrompt}
        >
          Generate Prompt
        </button>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white/80">Generated Prompt</label>
              <button
                className={`btn btn-secondary btn-sm text-xs ${promptCopied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}`}
                onClick={handleCopyPrompt}
              >
                {promptCopied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Prompt
                  </>
                )}
              </button>
            </div>
            <textarea
              value={prompt}
              readOnly
              rows={12}
              className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white font-mono text-sm resize-y focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">Paste AI Response Here</label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Paste the response from Claude or ChatGPT here..."
              rows={8}
              className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white font-mono text-sm resize-y focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
            <button
              className="btn btn-primary mt-2"
              onClick={handleParseResponse}
              disabled={!responseText.trim() || generating}
            >
              {generating ? 'Parsing...' : 'Parse Response'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
