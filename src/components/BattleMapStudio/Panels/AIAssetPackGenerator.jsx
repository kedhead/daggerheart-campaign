import { useState } from 'react';
import {
  Package,
  Sparkles,
  Loader2,
  Check,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Share2,
  Palette
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  generateMapAsset,
  saveGeneratedImage
} from '../../../services/battleMapGenerator';

// Predefined themed asset packs
const ASSET_PACK_THEMES = {
  graveyard: {
    name: 'Graveyard',
    description: 'Spooky cemetery with tombstones, crypts, and undead elements',
    icon: '🪦',
    assets: [
      { name: 'Tombstone (simple)', prompt: 'simple weathered stone tombstone grave marker' },
      { name: 'Tombstone (cross)', prompt: 'stone cross grave marker tombstone' },
      { name: 'Tombstone (ornate)', prompt: 'ornate decorated tombstone with angel carving' },
      { name: 'Crypt entrance', prompt: 'small stone crypt mausoleum entrance door' },
      { name: 'Dead tree', prompt: 'gnarled dead tree with twisted branches no leaves' },
      { name: 'Iron fence', prompt: 'old rusty iron cemetery fence section' },
      { name: 'Grave dirt pile', prompt: 'freshly dug grave dirt pile with shovel' },
      { name: 'Skeleton remains', prompt: 'scattered skeleton bones on ground' },
      { name: 'Ghost wisp', prompt: 'ethereal ghost wisp spirit floating' },
      { name: 'Lantern post', prompt: 'old gothic lantern post with dim light' },
      { name: 'Coffin', prompt: 'wooden coffin partially open' },
      { name: 'Raven', prompt: 'black raven crow perched' }
    ]
  },
  tavern: {
    name: 'Tavern',
    description: 'Cozy inn with furniture, food, and drinking supplies',
    icon: '🍺',
    assets: [
      { name: 'Round table', prompt: 'wooden round tavern table' },
      { name: 'Long table', prompt: 'wooden rectangular dining table' },
      { name: 'Chair', prompt: 'simple wooden chair' },
      { name: 'Stool', prompt: 'wooden bar stool' },
      { name: 'Bar counter', prompt: 'wooden bar counter with tap' },
      { name: 'Barrel (standing)', prompt: 'wooden ale barrel standing upright' },
      { name: 'Barrel (lying)', prompt: 'wooden barrel lying on side' },
      { name: 'Fireplace', prompt: 'stone fireplace with burning fire' },
      { name: 'Chandelier', prompt: 'iron chandelier with candles' },
      { name: 'Mugs', prompt: 'wooden beer mugs tankards on tray' },
      { name: 'Food platter', prompt: 'platter of roasted meat and bread' },
      { name: 'Stairs', prompt: 'wooden stairs going up' }
    ]
  },
  forest: {
    name: 'Forest Camp',
    description: 'Woodland camping site with natural elements',
    icon: '🏕️',
    assets: [
      { name: 'Campfire', prompt: 'campfire with logs burning flames' },
      { name: 'Tent (small)', prompt: 'small canvas camping tent' },
      { name: 'Tent (large)', prompt: 'large adventurer tent with flap' },
      { name: 'Bedroll', prompt: 'rolled up sleeping bedroll blanket' },
      { name: 'Log seat', prompt: 'fallen log for sitting' },
      { name: 'Tree (oak)', prompt: 'large oak tree with full canopy' },
      { name: 'Tree (pine)', prompt: 'tall pine tree evergreen' },
      { name: 'Bush', prompt: 'leafy green bush shrub' },
      { name: 'Rock cluster', prompt: 'cluster of natural rocks stones' },
      { name: 'Cooking pot', prompt: 'iron cooking pot on tripod over fire' },
      { name: 'Backpack', prompt: 'adventurer backpack with supplies' },
      { name: 'Woodpile', prompt: 'stack of chopped firewood' }
    ]
  },
  dungeon: {
    name: 'Dungeon',
    description: 'Dark underground elements for dungeons and caves',
    icon: '🗝️',
    assets: [
      { name: 'Torch (wall)', prompt: 'wall mounted torch with flame' },
      { name: 'Torch (standing)', prompt: 'standing torch brazier with fire' },
      { name: 'Treasure chest', prompt: 'wooden treasure chest with gold' },
      { name: 'Chest (locked)', prompt: 'locked iron-bound treasure chest' },
      { name: 'Bones pile', prompt: 'pile of old bones and skulls' },
      { name: 'Chains', prompt: 'rusty chains hanging from wall' },
      { name: 'Cage', prompt: 'iron prisoner cage cell' },
      { name: 'Stone pillar', prompt: 'ancient stone pillar column' },
      { name: 'Rubble', prompt: 'pile of stone rubble debris' },
      { name: 'Sarcophagus', prompt: 'stone sarcophagus coffin' },
      { name: 'Altar', prompt: 'dark stone altar with candles' },
      { name: 'Cobwebs', prompt: 'large cobwebs spider webs' }
    ]
  },
  village: {
    name: 'Village',
    description: 'Medieval village buildings and decorations',
    icon: '🏘️',
    assets: [
      { name: 'House (small)', prompt: 'small medieval cottage house' },
      { name: 'House (large)', prompt: 'two-story medieval house building' },
      { name: 'Market stall', prompt: 'wooden market vendor stall booth' },
      { name: 'Well', prompt: 'stone water well with bucket' },
      { name: 'Cart', prompt: 'wooden merchant cart wagon' },
      { name: 'Crates', prompt: 'stack of wooden crates boxes' },
      { name: 'Barrel stack', prompt: 'stacked barrels in group' },
      { name: 'Fence (wood)', prompt: 'wooden picket fence section' },
      { name: 'Sign post', prompt: 'wooden directional sign post' },
      { name: 'Lamp post', prompt: 'street lamp post lantern' },
      { name: 'Hay bale', prompt: 'hay bale straw bundle' },
      { name: 'Flower pot', prompt: 'clay flower pot with flowers' }
    ]
  },
  castle: {
    name: 'Castle',
    description: 'Royal castle furniture and decorations',
    icon: '🏰',
    assets: [
      { name: 'Throne', prompt: 'ornate royal throne chair gold' },
      { name: 'Banner', prompt: 'hanging fabric banner flag' },
      { name: 'Suit of armor', prompt: 'standing suit of plate armor' },
      { name: 'Weapon rack', prompt: 'wooden weapon rack with swords' },
      { name: 'Shield display', prompt: 'shields mounted on wall display' },
      { name: 'Tapestry', prompt: 'hanging tapestry with design' },
      { name: 'Candelabra', prompt: 'tall candelabra with candles' },
      { name: 'Pedestal', prompt: 'stone display pedestal' },
      { name: 'Red carpet', prompt: 'red carpet runner rug' },
      { name: 'Bookshelf', prompt: 'tall wooden bookshelf with books' },
      { name: 'Globe', prompt: 'world globe on stand' },
      { name: 'Statue', prompt: 'stone statue of knight' }
    ]
  },
  swamp: {
    name: 'Swamp',
    description: 'Murky wetland with creepy vegetation',
    icon: '🐊',
    assets: [
      { name: 'Dead tree', prompt: 'dead swamp tree with moss hanging' },
      { name: 'Mangrove roots', prompt: 'tangled mangrove tree roots in water' },
      { name: 'Lily pads', prompt: 'cluster of lily pads on water' },
      { name: 'Reeds', prompt: 'tall swamp reeds cattails' },
      { name: 'Mud patch', prompt: 'muddy ground patch bog' },
      { name: 'Fallen log', prompt: 'rotting fallen log in water' },
      { name: 'Mushrooms', prompt: 'cluster of glowing mushrooms' },
      { name: 'Fogbank', prompt: 'low lying fog mist' },
      { name: 'Skull', prompt: 'animal skull half buried' },
      { name: 'Hut', prompt: 'swamp witch hut on stilts' },
      { name: 'Cauldron', prompt: 'bubbling cauldron pot' },
      { name: 'Alligator', prompt: 'alligator crocodile lying' }
    ]
  },
  arcane: {
    name: 'Arcane',
    description: 'Magical items and wizard tower elements',
    icon: '🔮',
    assets: [
      { name: 'Magic circle', prompt: 'glowing magic circle runes on floor' },
      { name: 'Crystal ball', prompt: 'crystal ball on stand glowing' },
      { name: 'Spellbook', prompt: 'open spellbook with glowing pages' },
      { name: 'Potion bottles', prompt: 'colorful potion bottles collection' },
      { name: 'Cauldron', prompt: 'bubbling magic cauldron with glow' },
      { name: 'Floating candles', prompt: 'magical floating candles' },
      { name: 'Staff', prompt: 'wizard staff with crystal' },
      { name: 'Orb pedestal', prompt: 'glowing orb on stone pedestal' },
      { name: 'Rune stones', prompt: 'carved rune stones glowing' },
      { name: 'Portal', prompt: 'swirling magical portal doorway' },
      { name: 'Enchanted mirror', prompt: 'ornate magic mirror glowing' },
      { name: 'Arcane debris', prompt: 'scattered magic components herbs' }
    ]
  }
};

// Art style options
const ART_STYLES = [
  { id: 'fantasy', name: 'Classic Fantasy', prompt: 'fantasy art style, detailed illustration' },
  { id: 'handdrawn', name: 'Hand-Drawn', prompt: 'hand-drawn sketch style, ink illustration' },
  { id: 'pixel', name: 'Pixel Art', prompt: '16-bit pixel art style, retro game aesthetic' },
  { id: 'realistic', name: 'Realistic', prompt: 'photorealistic style, detailed textures' },
  { id: 'watercolor', name: 'Watercolor', prompt: 'watercolor painting style, soft edges' },
  { id: 'darkfantasy', name: 'Dark Fantasy', prompt: 'dark gothic fantasy style, moody atmosphere' },
  { id: 'cartoon', name: 'Cartoon', prompt: 'cartoon style, bold outlines, vibrant colors' },
  { id: 'minimalist', name: 'Minimalist', prompt: 'minimalist clean style, simple shapes' }
];

export default function AIAssetPackGenerator({ campaignId }) {
  const [selectedTheme, setSelectedTheme] = useState('graveyard');
  const [selectedStyle, setSelectedStyle] = useState('fantasy');
  const [customAssets, setCustomAssets] = useState([]);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetPrompt, setNewAssetPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, currentAsset: '' });
  const [generatedAssets, setGeneratedAssets] = useState([]);
  const [error, setError] = useState(null);
  const [shareToLibrary, setShareToLibrary] = useState(true);

  const theme = ASSET_PACK_THEMES[selectedTheme];
  const style = ART_STYLES.find(s => s.id === selectedStyle);

  // Initialize selected assets when theme changes
  const initializeSelection = (themeKey) => {
    const newTheme = ASSET_PACK_THEMES[themeKey];
    setSelectedAssets(new Set(newTheme.assets.map((_, i) => `theme_${i}`)));
    setCustomAssets([]);
  };

  // Handle theme change
  const handleThemeChange = (themeKey) => {
    setSelectedTheme(themeKey);
    initializeSelection(themeKey);
    setGeneratedAssets([]);
  };

  // Toggle asset selection
  const toggleAsset = (assetId) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  // Add custom asset
  const addCustomAsset = () => {
    if (!newAssetName.trim() || !newAssetPrompt.trim()) return;

    const customId = `custom_${Date.now()}`;
    setCustomAssets(prev => [...prev, {
      id: customId,
      name: newAssetName.trim(),
      prompt: newAssetPrompt.trim()
    }]);
    setSelectedAssets(prev => new Set([...prev, customId]));
    setNewAssetName('');
    setNewAssetPrompt('');
  };

  // Remove custom asset
  const removeCustomAsset = (customId) => {
    setCustomAssets(prev => prev.filter(a => a.id !== customId));
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      newSet.delete(customId);
      return newSet;
    });
  };

  // Get all assets to generate
  const getAssetsToGenerate = () => {
    const assets = [];

    // Add selected theme assets
    theme.assets.forEach((asset, i) => {
      if (selectedAssets.has(`theme_${i}`)) {
        assets.push(asset);
      }
    });

    // Add selected custom assets
    customAssets.forEach(asset => {
      if (selectedAssets.has(asset.id)) {
        assets.push({ name: asset.name, prompt: asset.prompt });
      }
    });

    return assets;
  };

  // Generate all selected assets
  const handleGeneratePack = async () => {
    const assetsToGenerate = getAssetsToGenerate();

    if (assetsToGenerate.length === 0) {
      setError('Please select at least one asset to generate');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedAssets([]);
    setGenerationProgress({ current: 0, total: assetsToGenerate.length, currentAsset: '' });

    const results = [];

    for (let i = 0; i < assetsToGenerate.length; i++) {
      const asset = assetsToGenerate[i];
      setGenerationProgress({
        current: i + 1,
        total: assetsToGenerate.length,
        currentAsset: asset.name
      });

      try {
        // Build the full prompt with style
        const fullPrompt = `${asset.prompt}, ${style.prompt}, top-down token view, isolated on solid background, game asset`;

        const result = await generateMapAsset({
          prompt: fullPrompt,
          category: selectedTheme,
          removeBackground: true
        });

        result.name = asset.name;
        result.theme = selectedTheme;
        result.style = selectedStyle;

        // Save to Firebase Storage
        if (campaignId) {
          try {
            const savedUrl = await saveGeneratedImage(result.url, campaignId, 'asset');
            result.url = savedUrl;
          } catch (saveError) {
            console.warn('Failed to save to Firebase Storage:', saveError);
          }

          // Save to campaign assets
          try {
            const assetDoc = {
              name: result.name,
              url: result.url,
              category: selectedTheme,
              prompt: fullPrompt,
              theme: selectedTheme,
              style: selectedStyle,
              packGenerated: true,
              backgroundRemoved: true,
              createdAt: serverTimestamp()
            };
            const docRef = await addDoc(
              collection(db, `campaigns/${campaignId}/battleMapAssets`),
              assetDoc
            );
            result.id = docRef.id;

            // Also save to shared library if option selected
            if (shareToLibrary) {
              try {
                await addDoc(collection(db, 'sharedAssets'), {
                  ...assetDoc,
                  sharedAt: serverTimestamp(),
                  sharedFrom: campaignId
                });
              } catch (shareError) {
                console.warn('Failed to share asset:', shareError);
              }
            }
          } catch (dbError) {
            console.warn('Failed to save asset metadata:', dbError);
          }
        }

        results.push(result);
        setGeneratedAssets([...results]);

      } catch (err) {
        console.error(`Failed to generate ${asset.name}:`, err);
        results.push({
          name: asset.name,
          error: err.message,
          failed: true
        });
        setGeneratedAssets([...results]);
      }

      // Small delay between generations to avoid rate limiting
      if (i < assetsToGenerate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsGenerating(false);
    setGenerationProgress({ current: 0, total: 0, currentAsset: '' });
  };

  // Initialize selection on first render
  useState(() => {
    initializeSelection(selectedTheme);
  });

  const assetsToGenerate = getAssetsToGenerate();
  const successfulAssets = generatedAssets.filter(a => !a.failed);

  return (
    <div className="ai-pack-generator">
      <div className="pack-header">
        <Package size={18} />
        <span>AI Asset Pack Generator</span>
      </div>

      <p className="pack-description">
        Generate complete themed asset packs with consistent art style.
      </p>

      {/* Theme Selection */}
      <div className="pack-section">
        <label className="section-label">Theme</label>
        <div className="theme-grid">
          {Object.entries(ASSET_PACK_THEMES).map(([key, t]) => (
            <button
              key={key}
              className={`theme-btn ${selectedTheme === key ? 'active' : ''}`}
              onClick={() => handleThemeChange(key)}
              title={t.description}
            >
              <span className="theme-icon">{t.icon}</span>
              <span className="theme-name">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div className="pack-section">
        <label className="section-label">
          <Palette size={14} />
          Art Style
        </label>
        <div className="style-grid">
          {ART_STYLES.map(s => (
            <button
              key={s.id}
              className={`style-btn ${selectedStyle === s.id ? 'active' : ''}`}
              onClick={() => setSelectedStyle(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Assets List */}
      <div className="pack-section">
        <div className="section-header">
          <label className="section-label">
            Assets ({assetsToGenerate.length} selected)
          </label>
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? 'Collapse' : 'Customize'}
          </button>
        </div>

        {isExpanded && (
          <div className="assets-list">
            {/* Theme assets */}
            {theme.assets.map((asset, i) => (
              <label key={`theme_${i}`} className="asset-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAssets.has(`theme_${i}`)}
                  onChange={() => toggleAsset(`theme_${i}`)}
                />
                <span className="asset-name">{asset.name}</span>
              </label>
            ))}

            {/* Custom assets */}
            {customAssets.map(asset => (
              <label key={asset.id} className="asset-checkbox custom">
                <input
                  type="checkbox"
                  checked={selectedAssets.has(asset.id)}
                  onChange={() => toggleAsset(asset.id)}
                />
                <span className="asset-name">{asset.name}</span>
                <button
                  className="remove-custom-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    removeCustomAsset(asset.id);
                  }}
                >
                  <X size={12} />
                </button>
              </label>
            ))}

            {/* Add custom asset */}
            <div className="add-custom-form">
              <input
                type="text"
                placeholder="Asset name"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                className="custom-input"
              />
              <input
                type="text"
                placeholder="Description prompt"
                value={newAssetPrompt}
                onChange={(e) => setNewAssetPrompt(e.target.value)}
                className="custom-input"
              />
              <button
                className="add-custom-btn"
                onClick={addCustomAsset}
                disabled={!newAssetName.trim() || !newAssetPrompt.trim()}
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="assets-preview">
            {theme.assets.slice(0, 4).map((a, i) => (
              <span key={i} className="asset-tag">{a.name}</span>
            ))}
            {theme.assets.length > 4 && (
              <span className="asset-tag more">+{theme.assets.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Share to library toggle */}
      <div className="pack-section">
        <label className="share-toggle">
          <input
            type="checkbox"
            checked={shareToLibrary}
            onChange={(e) => setShareToLibrary(e.target.checked)}
          />
          <Share2 size={14} />
          <span>Share to global library for use in other campaigns</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="pack-error">{error}</div>
      )}

      {/* Generate Button */}
      <button
        className="generate-pack-btn btn btn-primary"
        onClick={handleGeneratePack}
        disabled={isGenerating || assetsToGenerate.length === 0}
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="spin" />
            Generating {generationProgress.current}/{generationProgress.total}...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate {assetsToGenerate.length} Assets
          </>
        )}
      </button>

      {/* Progress */}
      {isGenerating && (
        <div className="generation-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            Creating: {generationProgress.currentAsset}
          </p>
        </div>
      )}

      {/* Generated Assets */}
      {generatedAssets.length > 0 && (
        <div className="pack-section">
          <label className="section-label">
            Generated ({successfulAssets.length}/{generatedAssets.length})
          </label>
          <div className="generated-pack-grid">
            {generatedAssets.map((asset, i) => (
              <div
                key={i}
                className={`generated-pack-item ${asset.failed ? 'failed' : ''}`}
                title={asset.failed ? `Failed: ${asset.error}` : asset.name}
              >
                {asset.failed ? (
                  <div className="failed-icon">
                    <X size={24} />
                    <span>{asset.name}</span>
                  </div>
                ) : (
                  <>
                    <img src={asset.url} alt={asset.name} />
                    <div className="item-overlay">
                      <Check size={16} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .ai-pack-generator {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pack-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--hope-color);
        }

        .pack-description {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }

        .pack-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .expand-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 0.7rem;
          cursor: pointer;
        }

        .expand-btn:hover {
          border-color: var(--hope-color);
          color: var(--text-primary);
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.35rem;
        }

        .theme-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
          padding: 0.4rem 0.25rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-btn:hover {
          border-color: var(--text-muted);
        }

        .theme-btn.active {
          border-color: var(--hope-color);
          background: rgba(234, 179, 8, 0.1);
        }

        .theme-icon {
          font-size: 1.2rem;
        }

        .theme-name {
          font-size: 0.65rem;
          color: var(--text-primary);
        }

        .style-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.35rem;
        }

        .style-btn {
          padding: 0.4rem 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .style-btn:hover {
          border-color: var(--text-muted);
        }

        .style-btn.active {
          border-color: var(--hope-color);
          color: var(--hope-color);
          background: rgba(234, 179, 8, 0.1);
        }

        .assets-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-height: 250px;
          overflow-y: auto;
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 6px;
        }

        .asset-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-primary);
          cursor: pointer;
        }

        .asset-checkbox.custom {
          color: var(--hope-color);
        }

        .asset-checkbox input {
          accent-color: var(--hope-color);
        }

        .asset-name {
          flex: 1;
        }

        .remove-custom-btn {
          padding: 0.15rem;
          background: transparent;
          border: none;
          color: var(--danger);
          cursor: pointer;
          opacity: 0.7;
        }

        .remove-custom-btn:hover {
          opacity: 1;
        }

        .add-custom-form {
          display: flex;
          gap: 0.35rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
        }

        .custom-input {
          flex: 1;
          padding: 0.35rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.75rem;
        }

        .custom-input:focus {
          outline: none;
          border-color: var(--hope-color);
        }

        .add-custom-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.35rem 0.5rem;
          background: var(--hope-color);
          border: none;
          border-radius: 4px;
          color: var(--bg-primary);
          font-size: 0.75rem;
          cursor: pointer;
        }

        .add-custom-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .assets-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .asset-tag {
          padding: 0.2rem 0.4rem;
          background: var(--bg-tertiary);
          border-radius: 4px;
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .asset-tag.more {
          color: var(--hope-color);
        }

        .share-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-primary);
          cursor: pointer;
        }

        .share-toggle input {
          accent-color: var(--hope-color);
        }

        .pack-error {
          padding: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--danger);
          border-radius: 6px;
          color: var(--danger);
          font-size: 0.8rem;
        }

        .generate-pack-btn {
          width: 100%;
          padding: 0.75rem;
          justify-content: center;
          font-size: 0.9rem;
        }

        .generate-pack-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .generation-progress {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .progress-bar {
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--hope-color);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
          text-align: center;
        }

        .generated-pack-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.35rem;
        }

        .generated-pack-item {
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          background: var(--bg-tertiary);
        }

        .generated-pack-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .generated-pack-item .item-overlay {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 18px;
          height: 18px;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .generated-pack-item.failed {
          border: 1px solid var(--danger);
        }

        .failed-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--danger);
          padding: 0.25rem;
        }

        .failed-icon span {
          font-size: 0.6rem;
          text-align: center;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}
