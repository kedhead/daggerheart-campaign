import { useState, useEffect } from 'react';
import { Upload, User, Users, Skull, Globe, Loader2 } from 'lucide-react';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
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

  const { addToken, gridSize, setSelectedTool } = useBattleMapStore();

  // Load this campaign's previously uploaded tokens
  useEffect(() => {
    if (!campaignId) return;

    const loadCustomAssets = async () => {
      try {
        const q = query(
          collection(db, `campaigns/${campaignId}/battleMapAssets`),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setCustomAssets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error loading custom tokens:', err);
      }
    };

    loadCustomAssets();
  }, [campaignId]);

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

  const handleAssetUpload = async (asset) => {
    setCustomAssets(prev => [...prev, asset]);
    setShowUploader(false);

    // Persist so the token is still here next session. Uploads without a
    // campaign are rejected upstream, so campaignId is set by this point.
    try {
      await addDoc(collection(db, `campaigns/${campaignId}/battleMapAssets`), {
        name: asset.name,
        url: asset.url,
        storagePath: asset.storagePath || null,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error saving custom token:', err);
    }
  };

  const handleDragStart = (e, tokenDef) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...tokenDef,
      width: gridSize * sizeMultiplier,
      height: gridSize * sizeMultiplier
    }));
    // Drops land wherever they're released; make sure the canvas is in a mode
    // where the new token can be picked up straight away.
    setSelectedTool('select');
  };

  // Group shared assets by category
  const sharedByCategory = sharedAssets.reduce((acc, asset) => {
    const cat = asset.category || 'objects';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(asset);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-300">
      {/* Tab selector */}
      <div className="flex border-b border-zinc-800 p-2 gap-1">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-xs font-medium transition-colors ${activeTab === 'tokens' ? 'bg-zinc-800 text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
          onClick={() => setActiveTab('tokens')}
        >
          <User size={14} />
          Tokens
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-xs font-medium transition-colors ${activeTab === 'shared' ? 'bg-zinc-800 text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
          onClick={() => setActiveTab('shared')}
        >
          <Globe size={14} />
          Shared
          {sharedAssets.length > 0 && (
            <span className="ml-1 bg-indigo-500/20 text-indigo-400 px-1.5 rounded-full text-[10px]">{sharedAssets.length}</span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {activeTab === 'tokens' ? (
          <>
            {/* Size selector */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Token Size</h4>
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {sizePresets.map(size => (
                  <button
                    key={size.id}
                    className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors ${selectedSize === size.id ? 'bg-zinc-800 text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setSelectedSize(size.id)}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Built-in Token Categories */}
            {[
              { id: 'player', label: 'Player Tokens', icon: User },
              { id: 'enemy', label: 'Enemy Tokens', icon: Skull },
              { id: 'npc', label: 'NPC Tokens', icon: Users },
            ].map(category => (
              <div key={category.id} className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{category.label}</h4>
                <div className="grid grid-cols-4 gap-2">
                  {builtInTokens.filter(t => t.id.startsWith(category.id)).map(token => (
                    <div
                      key={token.id}
                      className="aspect-square relative group cursor-pointer"
                      onClick={() => handleAddToken(token)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, token)}
                      title={token.name}
                    >
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ring-2 ring-transparent group-hover:ring-indigo-500"
                        style={{ backgroundColor: token.color }}
                      >
                        <category.icon size={20} className="text-white/90" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom assets */}
            {customAssets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Custom Assets</h4>
                <div className="grid grid-cols-4 gap-2">
                  {customAssets.map(asset => (
                    <div
                      key={asset.id}
                      className="aspect-square relative group cursor-pointer"
                      onClick={() => handleAddToken({ src: asset.url, name: asset.name })}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { src: asset.url, name: asset.name })}
                      title={asset.name}
                    >
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full rounded-full object-cover shadow-lg transition-transform group-hover:scale-105 ring-2 ring-transparent group-hover:ring-indigo-500 bg-zinc-800"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            <div className="pt-2">
              {showUploader ? (
                <AssetUploader
                  campaignId={campaignId}
                  onUpload={handleAssetUpload}
                  onCancel={() => setShowUploader(false)}
                />
              ) : (
                <button
                  className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2 text-xs"
                  onClick={() => setShowUploader(true)}
                >
                  <Upload size={14} />
                  Upload Custom Token
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Shared Library Tab */}
            <div className="bg-zinc-950/50 rounded-lg p-3 text-xs text-zinc-400 border border-zinc-800/50">
              Assets shared from all campaigns. Click or drag to add to your map.
            </div>

            {/* Size selector for shared assets */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Token Size</h4>
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {sizePresets.map(size => (
                  <button
                    key={size.id}
                    className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors ${selectedSize === size.id ? 'bg-zinc-800 text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    onClick={() => setSelectedSize(size.id)}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>

            {loadingShared ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-2">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-xs">Loading shared assets...</span>
              </div>
            ) : sharedAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-2 text-center">
                <Globe size={24} className="opacity-50" />
                <p className="text-sm font-medium">No shared assets yet</p>
                <p className="text-xs opacity-70">Share assets from AI Assets tab to build your library</p>
              </div>
            ) : (
              Object.entries(sharedByCategory).map(([category, assets]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{category.charAt(0).toUpperCase() + category.slice(1)} ({assets.length})</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {assets.map(asset => (
                      <div
                        key={asset.id}
                        className="aspect-square relative group cursor-pointer"
                        onClick={() => handleAddToken({ src: asset.url, name: asset.name })}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { src: asset.url, name: asset.name })}
                        title={asset.name}
                      >
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full rounded-full object-cover shadow-lg transition-transform group-hover:scale-105 ring-2 ring-transparent group-hover:ring-indigo-500 bg-zinc-800 border border-zinc-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
