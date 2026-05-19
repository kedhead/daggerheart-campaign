import { useState } from 'react';
import { Wand2, Sparkles, Loader2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';
import {
  generateBattleMap,
  saveGeneratedImage,
  mapPromptTemplates
} from '../../../services/battleMapGenerator';

export default function AIMapGenerator({ campaignId }) {
  const [prompt, setPrompt] = useState('');
  const [mapType, setMapType] = useState('dungeon');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [model, setModel] = useState('gpt-image-1');
  const [size, setSize] = useState('1024x1024');

  const { setMapImage, setMapName } = useBattleMapStore();

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setPrompt(template.prompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the map');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate the map
      const result = await generateBattleMap({
        prompt: prompt.trim(),
        type: mapType,
        model,
        size
      });

      // Save to Firebase for persistence
      let finalUrl = result.url;
      if (campaignId) {
        try {
          finalUrl = await saveGeneratedImage(result.url, campaignId, 'map');
        } catch (saveError) {
          console.warn('Failed to save to Firebase, using temporary URL:', saveError);
        }
      }

      // Get image dimensions
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = finalUrl;
      });

      // Set as current map
      setMapImage({
        url: finalUrl,
        width: img.width,
        height: img.height,
        generated: true,
        prompt: prompt.trim()
      });

      // Set a name based on the template or prompt
      const mapName = selectedTemplate?.label || prompt.substring(0, 30);
      setMapName(`AI: ${mapName}`);

    } catch (err) {
      console.error('Map generation error:', err);
      setError(err.message || 'Failed to generate map');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="ai-map-generator">
      <div className="generator-header">
        <Wand2 size={18} />
        <span>AI Map Generator</span>
      </div>

      {/* Map Type Selection */}
      <div className="generator-section">
        <label className="section-label">Map Type</label>
        <div className="map-type-grid">
          {Object.entries(mapPromptTemplates).map(([key, category]) => (
            <button
              key={key}
              className={`map-type-btn ${mapType === key ? 'active' : ''}`}
              onClick={() => {
                setMapType(key);
                setSelectedTemplate(null);
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Selection */}
      <div className="generator-section">
        <label className="section-label">Quick Templates</label>
        <div className="template-list">
          {mapPromptTemplates[mapType]?.templates.map((template, idx) => (
            <button
              key={idx}
              className={`template-btn ${selectedTemplate === template ? 'active' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              <Sparkles size={14} />
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="generator-section">
        <label className="section-label">Description</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your map... e.g., 'Ancient temple with a central altar, four pillars, and hidden treasure room'"
          rows={3}
          className="prompt-input"
        />
      </div>

      {/* Advanced Options */}
      <div className="generator-section">
        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="option-row">
              <label>Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="gpt-image-1">OpenAI gpt-image-1 (Recommended)</option>
                <option value="magic-art_7_0">Magic Art 7.0 (Slow, may timeout)</option>
                <option value="flux-dev">Flux Dev</option>
                <option value="flux-schnell">Flux Schnell (Fast)</option>
                <option value="stable-diffusion-3">Stable Diffusion 3</option>
              </select>
            </div>

            <div className="option-row">
              <label>Size</label>
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="1024x1024">1024×1024 (Square)</option>
                <option value="1792x1024">1792×1024 (Wide)</option>
                <option value="1024x1792">1024×1792 (Tall)</option>
                <option value="2560x1440">2560×1440 (QHD Wide)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="generator-error">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        className="generate-btn btn btn-primary"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="spin" />
            Generating...
          </>
        ) : (
          <>
            <ImageIcon size={18} />
            Generate Map
          </>
        )}
      </button>

      <p className="generator-hint">
        Maps are generated using AI and saved to your campaign.
        Generation may take 10-30 seconds.
      </p>

      <style>{`
        .ai-map-generator {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .generator-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--fear-color);
        }

        .generator-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .section-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .map-type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .map-type-btn {
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .map-type-btn:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }

        .map-type-btn.active {
          border-color: var(--fear-color);
          color: var(--fear-color);
          background: rgba(139, 92, 246, 0.1);
        }

        .template-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .template-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .template-btn:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }

        .template-btn.active {
          border-color: var(--fear-color);
          color: var(--fear-color);
          background: rgba(139, 92, 246, 0.1);
        }

        .prompt-input {
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 0.9rem;
          resize: vertical;
          min-height: 80px;
        }

        .prompt-input:focus {
          outline: none;
          border-color: var(--fear-color);
        }

        .advanced-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          cursor: pointer;
        }

        .advanced-toggle:hover {
          color: var(--text-primary);
        }

        .advanced-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: 6px;
        }

        .option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .option-row label {
          font-size: 0.85rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .option-row select {
          padding: 0.35rem 0.5rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.8rem;
        }

        .generator-error {
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--danger);
          border-radius: 6px;
          color: var(--danger);
          font-size: 0.85rem;
        }

        .generate-btn {
          width: 100%;
          padding: 0.75rem;
          justify-content: center;
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .generator-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: center;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
