import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Plus, X } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  generateMapAsset,
  saveGeneratedImage,
  assetCategories
} from '../../../services/battleMapGenerator';
import { useBattleMapStore } from '../../../stores/battleMapStore';

export default function AIAssetGenerator({ campaignId, onAssetGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('creatures');
  const [removeBackground, setRemoveBackground] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedAssets, setGeneratedAssets] = useState([]); // Session-generated
  const [savedAssets, setSavedAssets] = useState([]); // From Firestore

  const { addToken, gridSize } = useBattleMapStore();

  // Load saved assets from Firestore
  useEffect(() => {
    if (!campaignId) return;

    const loadSavedAssets = async () => {
      try {
        const assetsRef = collection(db, `campaigns/${campaignId}/battleMapAssets`);
        const q = query(assetsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedAssets(assets);
      } catch (err) {
        console.error('Error loading saved assets:', err);
      }
    };

    loadSavedAssets();
  }, [campaignId]);

  const handleExampleClick = (example) => {
    setPrompt(example);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the asset');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateMapAsset({
        prompt: prompt.trim(),
        category,
        removeBackground
      });

      // Save to Firebase Storage for persistence
      let finalUrl = result.url;
      if (campaignId) {
        try {
          finalUrl = await saveGeneratedImage(result.url, campaignId, 'asset');
          result.url = finalUrl;
        } catch (saveError) {
          console.warn('Failed to save to Firebase Storage, using temporary URL:', saveError);
        }

        // Save asset metadata to Firestore for reuse
        try {
          const assetDoc = {
            name: result.name,
            url: finalUrl,
            category,
            prompt: prompt.trim(),
            backgroundRemoved: removeBackground,
            createdAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(db, `campaigns/${campaignId}/battleMapAssets`), assetDoc);
          result.id = docRef.id;

          // Add to saved assets list
          setSavedAssets(prev => [{ ...assetDoc, id: docRef.id, createdAt: new Date() }, ...prev]);
        } catch (saveError) {
          console.warn('Failed to save asset to Firestore:', saveError);
        }
      }

      // Add to session generated assets list
      setGeneratedAssets(prev => [result, ...prev]);

      // Notify parent if callback provided
      if (onAssetGenerated) {
        onAssetGenerated(result);
      }

      // Clear prompt for next generation
      setPrompt('');

    } catch (err) {
      console.error('Asset generation error:', err);
      setError(err.message || 'Failed to generate asset');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToMap = (asset) => {
    addToken({
      src: asset.url,
      name: asset.name,
      x: 100,
      y: 100,
      width: gridSize,
      height: gridSize
    });
  };

  const handleRemoveGenerated = (assetId) => {
    setGeneratedAssets(prev => prev.filter(a => a.id !== assetId));
  };

  const handleDeleteSavedAsset = async (assetId) => {
    if (!campaignId) return;
    try {
      await deleteDoc(doc(db, `campaigns/${campaignId}/battleMapAssets`, assetId));
      setSavedAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  return (
    <div className="ai-asset-generator">
      <div className="generator-header">
        <Sparkles size={18} />
        <span>AI Asset Generator</span>
      </div>

      {/* Category Selection */}
      <div className="generator-section">
        <label className="section-label">Category</label>
        <div className="category-tabs">
          {Object.entries(assetCategories).map(([key, cat]) => (
            <button
              key={key}
              className={`category-tab ${category === key ? 'active' : ''}`}
              onClick={() => setCategory(key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Example Prompts */}
      <div className="generator-section">
        <label className="section-label">Examples</label>
        <div className="examples-list">
          {assetCategories[category]?.examples.map((example, idx) => (
            <button
              key={idx}
              className="example-btn"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="generator-section">
        <label className="section-label">Description</label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'glowing magic crystal' or 'armored knight token'"
          className="prompt-input"
          onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
        />
      </div>

      {/* Background Removal Toggle */}
      <div className="generator-section">
        <label className="bg-remove-toggle">
          <input
            type="checkbox"
            checked={removeBackground}
            onChange={(e) => setRemoveBackground(e.target.checked)}
          />
          <span>Remove background (for tokens)</span>
        </label>
        <p className="toggle-hint">Creates transparent PNG for clean token placement</p>
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
            <Sparkles size={18} />
            Generate Asset
          </>
        )}
      </button>

      {/* Generated Assets Grid (this session) */}
      {generatedAssets.length > 0 && (
        <div className="generator-section">
          <label className="section-label">Just Generated</label>
          <div className="generated-grid">
            {generatedAssets.map(asset => (
              <div key={asset.id} className="generated-item">
                <img src={asset.url} alt={asset.name} />
                <div className="generated-item-overlay">
                  <button
                    className="add-btn"
                    onClick={() => handleAddToMap(asset)}
                    title="Add to map"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveGenerated(asset.id)}
                    title="Remove from list"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Assets Grid (from Firestore) */}
      {savedAssets.length > 0 && (
        <div className="generator-section">
          <label className="section-label">Saved Assets ({savedAssets.length})</label>
          <div className="generated-grid">
            {savedAssets.map(asset => (
              <div key={asset.id} className="generated-item">
                <img src={asset.url} alt={asset.name} />
                <div className="generated-item-overlay">
                  <button
                    className="add-btn"
                    onClick={() => handleAddToMap(asset)}
                    title="Add to map"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => handleDeleteSavedAsset(asset.id)}
                    title="Delete permanently"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .ai-asset-generator {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .generator-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--hope-color);
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

        .category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .category-tab {
          padding: 0.35rem 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-tab:hover {
          border-color: var(--text-muted);
        }

        .category-tab.active {
          border-color: var(--hope-color);
          color: var(--hope-color);
          background: rgba(234, 179, 8, 0.1);
        }

        .examples-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .example-btn {
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .example-btn:hover {
          border-color: var(--hope-color);
          color: var(--text-primary);
        }

        .prompt-input {
          padding: 0.6rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 0.85rem;
        }

        .prompt-input:focus {
          outline: none;
          border-color: var(--hope-color);
        }

        .generator-error {
          padding: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--danger);
          border-radius: 6px;
          color: var(--danger);
          font-size: 0.8rem;
        }

        .generate-btn {
          width: 100%;
          padding: 0.6rem;
          justify-content: center;
          font-size: 0.9rem;
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        .generated-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .generated-item {
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          background: var(--bg-tertiary);
        }

        .generated-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .generated-item-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .generated-item:hover .generated-item-overlay {
          opacity: 1;
        }

        .generated-item-overlay button {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .generated-item-overlay button:hover {
          transform: scale(1.1);
        }

        .add-btn {
          background: var(--hope-color);
          color: var(--bg-primary);
        }

        .remove-btn {
          background: var(--danger);
          color: white;
        }

        .bg-remove-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-primary);
          cursor: pointer;
        }

        .bg-remove-toggle input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: var(--hope-color);
        }

        .toggle-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0.25rem 0 0 0;
        }
      `}</style>
    </div>
  );
}
