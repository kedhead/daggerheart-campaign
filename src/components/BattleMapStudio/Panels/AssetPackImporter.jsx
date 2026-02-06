import { useState, useRef, useCallback } from 'react';
import { FolderOpen, Upload, Link, ExternalLink, Loader2, Check, X, Image as ImageIcon, Plus } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { useBattleMapStore } from '../../../stores/battleMapStore';

// Curated list of free RPG asset resources
const curatedResources = [
  {
    name: '2-Minute Tabletop',
    url: 'https://2minutetabletop.com/product-category/free/',
    description: 'High-quality free battle maps and tokens',
    type: 'website'
  },
  {
    name: 'Forgotten Adventures',
    url: 'https://www.forgotten-adventures.net/product-category/free/',
    description: 'Free tokens, maps, and assets for VTT',
    type: 'website'
  },
  {
    name: 'Tom Cartos',
    url: 'https://www.patreon.com/tomcartos/posts?filters%5Btag%5D=Free',
    description: 'Free battle maps and assets',
    type: 'patreon'
  },
  {
    name: 'Dungeon Mapster',
    url: 'https://www.patreon.com/dungeonmapster/posts?filters%5Btag%5D=Free',
    description: 'Free dungeon and encounter maps',
    type: 'patreon'
  },
  {
    name: 'Game-icons.net',
    url: 'https://game-icons.net/',
    description: 'Thousands of free CC0 icons for RPGs',
    type: 'website'
  },
  {
    name: 'OpenGameArt',
    url: 'https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=9&sort_by=count&sort_order=DESC',
    description: 'Open source game art including tiles and sprites',
    type: 'website'
  },
  {
    name: 'Kenney Assets',
    url: 'https://kenney.nl/assets?q=2d',
    description: 'Free 2D game assets including tiles',
    type: 'website'
  },
  {
    name: 'Awesome RPG Resources (GitHub)',
    url: 'https://github.com/neovatar/awesome-rpg-resources#map-assets',
    description: 'Curated list of RPG resources',
    type: 'github'
  }
];

export default function AssetPackImporter({ campaignId }) {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'resources'
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, name: '' });
  const [importedAssets, setImportedAssets] = useState([]);
  const [error, setError] = useState(null);
  const [categoryOverride, setCategoryOverride] = useState('');

  const folderInputRef = useRef(null);
  const filesInputRef = useRef(null);

  const { addToken, gridSize } = useBattleMapStore();

  // Guess category from filename or path
  const guessCategory = (filename, path) => {
    if (categoryOverride) return categoryOverride;

    const lowerPath = (path + '/' + filename).toLowerCase();

    if (/token|creature|monster|enemy|npc|character|hero/i.test(lowerPath)) return 'creatures';
    if (/terrain|ground|floor|tile|grass|dirt|stone|water/i.test(lowerPath)) return 'terrain';
    if (/furniture|chair|table|bed|chest|door/i.test(lowerPath)) return 'furniture';
    if (/hazard|trap|fire|lava|spike|pit/i.test(lowerPath)) return 'hazards';
    if (/tree|bush|rock|plant|nature|forest/i.test(lowerPath)) return 'nature';
    if (/wall|building|house|roof|structure/i.test(lowerPath)) return 'structures';
    if (/road|path|river|bridge/i.test(lowerPath)) return 'paths';

    return 'objects';
  };

  // Process a single image file
  const processImageFile = async (file, path = '') => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target.result;
          const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
          const category = guessCategory(file.name, path);

          // Upload to Firebase Storage
          const timestamp = Date.now();
          const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
          const storagePath = `sharedAssets/imported/${timestamp}_${safeName}.png`;
          const storageRef = ref(storage, storagePath);

          await uploadString(storageRef, dataUrl, 'data_url');
          const downloadUrl = await getDownloadURL(storageRef);

          // Save to shared assets collection
          const assetDoc = {
            name,
            url: downloadUrl,
            category,
            source: 'imported',
            originalFilename: file.name,
            sharedAt: serverTimestamp()
          };

          const docRef = await addDoc(collection(db, 'sharedAssets'), assetDoc);

          resolve({
            id: docRef.id,
            name,
            url: downloadUrl,
            category
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle folder selection
  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f =>
      f.type.startsWith('image/') ||
      /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.name)
    );

    if (imageFiles.length === 0) {
      setError('No image files found in the selected folder');
      return;
    }

    setImporting(true);
    setError(null);
    setImportProgress({ current: 0, total: imageFiles.length, name: '' });
    setImportedAssets([]);

    const imported = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const path = file.webkitRelativePath || '';

      setImportProgress({
        current: i + 1,
        total: imageFiles.length,
        name: file.name
      });

      try {
        const asset = await processImageFile(file, path);
        imported.push(asset);
        setImportedAssets([...imported]);
      } catch (err) {
        console.error('Error importing file:', file.name, err);
        // Continue with other files
      }
    }

    setImporting(false);
  };

  // Handle multiple file selection
  const handleFilesSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f =>
      f.type.startsWith('image/') ||
      /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.name)
    );

    if (imageFiles.length === 0) {
      setError('No image files selected');
      return;
    }

    setImporting(true);
    setError(null);
    setImportProgress({ current: 0, total: imageFiles.length, name: '' });
    setImportedAssets([]);

    const imported = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      setImportProgress({
        current: i + 1,
        total: imageFiles.length,
        name: file.name
      });

      try {
        const asset = await processImageFile(file);
        imported.push(asset);
        setImportedAssets([...imported]);
      } catch (err) {
        console.error('Error importing file:', file.name, err);
      }
    }

    setImporting(false);
  };

  // Add imported asset to map
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

  return (
    <div className="asset-pack-importer">
      {/* Tab selector */}
      <div className="importer-tabs">
        <button
          className={`importer-tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <Upload size={14} />
          Import Assets
        </button>
        <button
          className={`importer-tab ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <Link size={14} />
          Free Resources
        </button>
      </div>

      {activeTab === 'import' ? (
        <div className="import-section">
          <p className="section-description">
            Import image files or folders. Assets are saved to your shared library for use across all campaigns.
          </p>

          {/* Category override */}
          <div className="category-select">
            <label>Category (optional)</label>
            <select
              value={categoryOverride}
              onChange={(e) => setCategoryOverride(e.target.value)}
            >
              <option value="">Auto-detect</option>
              <option value="creatures">Creatures/Tokens</option>
              <option value="terrain">Terrain</option>
              <option value="furniture">Furniture</option>
              <option value="nature">Nature</option>
              <option value="structures">Structures</option>
              <option value="paths">Roads/Paths</option>
              <option value="hazards">Hazards</option>
              <option value="objects">Objects</option>
            </select>
          </div>

          {/* Import buttons */}
          <div className="import-buttons">
            <button
              className="import-btn"
              onClick={() => folderInputRef.current?.click()}
              disabled={importing}
            >
              <FolderOpen size={18} />
              <span>Import Folder</span>
              <small>Select a folder of images</small>
            </button>

            <button
              className="import-btn"
              onClick={() => filesInputRef.current?.click()}
              disabled={importing}
            >
              <ImageIcon size={18} />
              <span>Import Files</span>
              <small>Select multiple images</small>
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderSelect}
            style={{ display: 'none' }}
          />
          <input
            ref={filesInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelect}
            style={{ display: 'none' }}
          />

          {/* Import progress */}
          {importing && (
            <div className="import-progress">
              <Loader2 size={18} className="spin" />
              <div className="progress-info">
                <span>Importing {importProgress.current} of {importProgress.total}</span>
                <small>{importProgress.name}</small>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="import-error">
              <X size={14} />
              {error}
            </div>
          )}

          {/* Imported assets preview */}
          {importedAssets.length > 0 && !importing && (
            <div className="imported-assets">
              <div className="imported-header">
                <Check size={14} />
                <span>Imported {importedAssets.length} assets</span>
              </div>
              <div className="imported-grid">
                {importedAssets.slice(0, 12).map(asset => (
                  <div key={asset.id} className="imported-item" title={asset.name}>
                    <img src={asset.url} alt={asset.name} />
                    <button
                      className="add-to-map-btn"
                      onClick={() => handleAddToMap(asset)}
                      title="Add to map"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ))}
                {importedAssets.length > 12 && (
                  <div className="more-indicator">
                    +{importedAssets.length - 12} more
                  </div>
                )}
              </div>
              <p className="imported-hint">
                Assets saved to Shared Library. Access them from the Tokens → Shared Library tab.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="resources-section">
          <p className="section-description">
            Download free assets from these community resources, then import them here.
          </p>

          <div className="resources-list">
            {curatedResources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="resource-item"
              >
                <div className="resource-info">
                  <span className="resource-name">{resource.name}</span>
                  <span className="resource-desc">{resource.description}</span>
                </div>
                <ExternalLink size={14} />
              </a>
            ))}
          </div>

          <p className="resources-hint">
            Download asset packs from these sites, extract them, then use "Import Folder" to add them to your library.
          </p>
        </div>
      )}

      <style>{`
        .asset-pack-importer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .importer-tabs {
          display: flex;
          gap: 0.25rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .importer-tab {
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

        .importer-tab:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .importer-tab.active {
          color: var(--hope-color);
          background: var(--bg-tertiary);
          border-color: var(--border);
          border-bottom-color: var(--bg-tertiary);
        }

        .section-description {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .category-select {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .category-select label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .category-select select {
          padding: 0.4rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
        }

        .import-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .import-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem;
          background: var(--bg-tertiary);
          border: 2px dashed var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .import-btn:hover:not(:disabled) {
          border-color: var(--hope-color);
          background: rgba(34, 197, 94, 0.05);
        }

        .import-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .import-btn span {
          font-weight: 500;
        }

        .import-btn small {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .import-progress {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
        }

        .import-progress .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .progress-info {
          display: flex;
          flex-direction: column;
        }

        .progress-info span {
          font-size: 0.85rem;
        }

        .progress-info small {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .progress-bar {
          height: 4px;
          background: var(--bg-primary);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--hope-color);
          transition: width 0.3s;
        }

        .import-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--danger);
          border-radius: 6px;
          color: var(--danger);
          font-size: 0.85rem;
        }

        .imported-assets {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .imported-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--hope-color);
          font-weight: 500;
        }

        .imported-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .imported-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .imported-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .add-to-map-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 20px;
          height: 20px;
          background: var(--hope-color);
          border: none;
          border-radius: 50%;
          color: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .imported-item:hover .add-to-map-btn {
          opacity: 1;
        }

        .more-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .imported-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }

        .resources-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .resource-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          text-decoration: none;
          color: var(--text-primary);
          transition: all 0.2s;
        }

        .resource-item:hover {
          border-color: var(--hope-color);
          background: rgba(34, 197, 94, 0.05);
        }

        .resource-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .resource-name {
          font-weight: 500;
          font-size: 0.85rem;
        }

        .resource-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .resources-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
