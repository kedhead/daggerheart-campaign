import { useState, useEffect } from 'react';
import { Upload, User, Users, Skull, Circle, Square, Diamond, Star, Shield, Globe, Loader2 } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useBattleMapStore } from '../../../stores/battleMapStore';
import AssetUploader from './AssetUploader';

// Built-in token shapes/colors
const builtInTokens = [
  { id: 'player-blue', name: 'Player (Blue)', color: '#3b82f6', shape: 'circle' },
  { id: 'player-green', name: 'Player (Green)', color: '#22c55e', shape: 'circle' },
  { id: 'player-yellow', name: 'Player (Yellow)', color: '#eab308', shape: 'circle' },
  { id: 'player-red', name: 'Player (Red)', color: '#ef4444', shape: 'circle' },
  { id: 'player-purple', name: 'Player (Purple)', color: '#8b5cf6', shape: 'circle' },
  { id: 'enemy-red', name: 'Enemy (Red)', color: '#dc2626', shape: 'circle' },
  { id: 'enemy-orange', name: 'Enemy (Orange)', color: '#ea580c', shape: 'circle' },
  { id: 'npc-gray', name: 'NPC (Gray)', color: '#6b7280', shape: 'circle' },
  { id: 'npc-teal', name: 'NPC (Teal)', color: '#14b8a6', shape: 'circle' }
];

// Token size presets
const sizePresets = [
  { id: 'small', name: 'Small', multiplier: 0.5 },
  { id: 'medium', name: 'Medium', multiplier: 1 },
  { id: 'large', name: 'Large', multiplier: 2 },
  { id: 'huge', name: 'Huge', multiplier: 3 }
];

export default function AssetLibrary({ campaignId }) {
  const [selectedSize, setSelectedSize] = useState('medium');
  const [customAssets, setCustomAssets] = useState([]);
  const [showUploader, setShowUploader] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens'); // 'tokens' | 'shared'
  const [sharedAssets, setSharedAssets] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);

  const { addToken, gridSize, selectedTool, setSelectedTool } = useBattleMapStore();

  // Load shared assets when tab is activated
  useEffect(() => {
    if (activeTab !== 'shared') return;

    const loadSharedAssets = async () => {
      setLoadingShared(true);
      try {
        const sharedRef = collection(db, 'sharedAssets');
        const q = query(sharedRef, orderBy('sharedAt', 'desc'));
        const snapshot = await getDocs(q);
        const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSharedAssets(assets);
      } catch (err) {
        console.error('Error loading shared assets:', err);
      } finally {
        setLoadingShared(false);
      }
    };

    loadSharedAssets();
  }, [activeTab]);

  const sizeMultiplier = sizePresets.find(s => s.id === selectedSize)?.multiplier || 1;

  const handleAddToken = (tokenDef) => {
    const size = gridSize * sizeMultiplier;
    addToken({
      ...tokenDef,
      x: 100,
      y: 100,
      width: size,
      height: size
    });
  };

  const handleAssetUpload = (asset) => {
    setCustomAssets(prev => [...prev, asset]);
    setShowUploader(false);
  };

  const handleDragStart = (e, tokenDef) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...tokenDef,
      width: gridSize * sizeMultiplier,
      height: gridSize * sizeMultiplier
    }));
    setSelectedTool('place');
  };

  // Group shared assets by category
  const sharedByCategory = sharedAssets.reduce((acc, asset) => {
    const cat = asset.category || 'objects';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(asset);
    return acc;
  }, {});

  return (
    <div className="asset-library">
      {/* Tab selector */}
      <div className="asset-tabs">
        <button
          className={`asset-tab ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          <User size={14} />
          Tokens
        </button>
        <button
          className={`asset-tab ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => setActiveTab('shared')}
        >
          <Globe size={14} />
          Shared Library
          {sharedAssets.length > 0 && (
            <span className="asset-count">{sharedAssets.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'tokens' ? (
        <>
          {/* Size selector */}
          <div className="asset-category">
            <h4>Token Size</h4>
            <div className="grid-type-buttons" style={{ marginBottom: '0.5rem' }}>
              {sizePresets.map(size => (
                <button
                  key={size.id}
                  className={selectedSize === size.id ? 'active' : ''}
                  onClick={() => setSelectedSize(size.id)}
                  style={{ flex: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Player tokens */}
          <div className="asset-category">
            <h4>Player Tokens</h4>
            <div className="asset-grid">
              {builtInTokens.filter(t => t.id.startsWith('player')).map(token => (
                <div
                  key={token.id}
                  className="asset-item"
                  onClick={() => handleAddToken(token)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, token)}
                  title={token.name}
                >
                  <div
                    className="asset-placeholder"
                    style={{ backgroundColor: token.color }}
                  >
                    <User size={20} color="white" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enemy tokens */}
          <div className="asset-category">
            <h4>Enemy Tokens</h4>
            <div className="asset-grid">
              {builtInTokens.filter(t => t.id.startsWith('enemy')).map(token => (
                <div
                  key={token.id}
                  className="asset-item"
                  onClick={() => handleAddToken(token)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, token)}
                  title={token.name}
                >
                  <div
                    className="asset-placeholder"
                    style={{ backgroundColor: token.color }}
                  >
                    <Skull size={20} color="white" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NPC tokens */}
          <div className="asset-category">
            <h4>NPC Tokens</h4>
            <div className="asset-grid">
              {builtInTokens.filter(t => t.id.startsWith('npc')).map(token => (
                <div
                  key={token.id}
                  className="asset-item"
                  onClick={() => handleAddToken(token)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, token)}
                  title={token.name}
                >
                  <div
                    className="asset-placeholder"
                    style={{ backgroundColor: token.color }}
                  >
                    <Users size={20} color="white" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom assets */}
          {customAssets.length > 0 && (
            <div className="asset-category">
              <h4>Custom Assets</h4>
              <div className="asset-grid">
                {customAssets.map(asset => (
                  <div
                    key={asset.id}
                    className="asset-item"
                    onClick={() => handleAddToken({ src: asset.url, name: asset.name })}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { src: asset.url, name: asset.name })}
                    title={asset.name}
                  >
                    <img src={asset.url} alt={asset.name} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload button */}
          <div className="asset-uploader">
            {showUploader ? (
              <AssetUploader
                onUpload={handleAssetUpload}
                onCancel={() => setShowUploader(false)}
              />
            ) : (
              <button
                className="asset-upload-btn"
                onClick={() => setShowUploader(true)}
              >
                <Upload size={18} />
                Upload Custom Token
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Shared Library Tab */}
          <div className="shared-library-info">
            <p>Assets shared from all campaigns. Click or drag to add to your map.</p>
          </div>

          {/* Size selector for shared assets */}
          <div className="asset-category">
            <h4>Token Size</h4>
            <div className="grid-type-buttons" style={{ marginBottom: '0.5rem' }}>
              {sizePresets.map(size => (
                <button
                  key={size.id}
                  className={selectedSize === size.id ? 'active' : ''}
                  onClick={() => setSelectedSize(size.id)}
                  style={{ flex: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {loadingShared ? (
            <div className="shared-loading">
              <Loader2 size={24} className="spin" />
              <span>Loading shared assets...</span>
            </div>
          ) : sharedAssets.length === 0 ? (
            <div className="shared-empty">
              <Globe size={32} />
              <p>No shared assets yet</p>
              <p className="shared-hint">Share assets from AI Assets tab to build your library</p>
            </div>
          ) : (
            Object.entries(sharedByCategory).map(([category, assets]) => (
              <div key={category} className="asset-category">
                <h4>{category.charAt(0).toUpperCase() + category.slice(1)} ({assets.length})</h4>
                <div className="asset-grid">
                  {assets.map(asset => (
                    <div
                      key={asset.id}
                      className="asset-item shared-asset"
                      onClick={() => handleAddToken({ src: asset.url, name: asset.name })}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { src: asset.url, name: asset.name })}
                      title={asset.name}
                    >
                      <img src={asset.url} alt={asset.name} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      <style>{`
        .asset-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .asset-tab {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.6rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px 6px 0 0;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .asset-tab:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .asset-tab.active {
          color: var(--hope-color);
          background: var(--bg-tertiary);
          border-color: var(--border);
          border-bottom-color: var(--bg-tertiary);
        }

        .asset-count {
          background: var(--hope-color);
          color: var(--bg-primary);
          font-size: 0.65rem;
          padding: 0.1rem 0.35rem;
          border-radius: 10px;
          font-weight: 600;
        }

        .shared-library-info {
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .shared-library-info p {
          margin: 0;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .shared-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          color: var(--text-muted);
        }

        .shared-loading .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .shared-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          color: var(--text-muted);
          text-align: center;
        }

        .shared-empty p {
          margin: 0;
        }

        .shared-hint {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .shared-asset {
          border: 1px solid var(--border);
        }

        .shared-asset:hover {
          border-color: var(--hope-color);
        }
      `}</style>
    </div>
  );
}
