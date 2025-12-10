import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import '../CampaignBuilder.css';

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
    <div className="prompt-generator">
      <div className="generator-info">
        <FileText size={24} />
        <div>
          <h4>Prompt Generator</h4>
          <p>Copy the prompt below to Claude.ai or ChatGPT, then paste the response back here.</p>
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
          <div className="prompt-section">
            <div className="prompt-header">
              <label>Generated Prompt</label>
              <button
                className={`btn btn-secondary btn-sm ${promptCopied ? 'success' : ''}`}
                onClick={handleCopyPrompt}
              >
                {promptCopied ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Prompt
                  </>
                )}
              </button>
            </div>
            <textarea
              className="prompt-textarea"
              value={prompt}
              readOnly
              rows={12}
            />
          </div>

          <div className="response-section">
            <label>Paste AI Response Here</label>
            <textarea
              className="response-textarea"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Paste the response from Claude or ChatGPT here..."
              rows={8}
            />
            <button
              className="btn btn-primary"
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
