import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { Upload, File, Image, Map, Trash2, Download, Eye, X, Wand2, Loader2 } from 'lucide-react';
import Modal from '../Modal';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateMap } from '../../services/mapGenerator';
import './FilesView.css';

export default function FilesView({ campaign, isDM, userId, locations = [], updateCampaign }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [viewingMap, setViewingMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingMap, setGeneratingMap] = useState(false);
  const [showMapGenerator, setShowMapGenerator] = useState(false);
  const [mapType, setMapType] = useState('world');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { hasKey, keys } = useAPIKey(userId);

  // Get map type descriptions based on game system
  const getMapTypeDescriptions = () => {
    const gameSystem = campaign?.gameSystem || 'daggerheart';

    if (gameSystem === 'starwarsd6') {
      return {
        world: 'Galactic Map - Holocron-style overview of star systems and hyperspace routes',
        regional: 'Sector Map - Holocron-style map of a galactic sector with nearby systems',
        local: 'Planetary/Location Map - Holocron-style map of a planet or specific location',
        dungeon: 'Facility/Ship Schematic - Technical blueprint of interior spaces'
      };
    }

    // Default fantasy descriptions for Daggerheart, D&D 5e, and generic
    return {
      world: 'World Map - Tolkien-esque overview of entire campaign world',
      regional: 'Regional Map - Tolkien-esque area around a location',
      local: 'Local Map - Tolkien-esque detailed map of a city/town',
      dungeon: 'Dungeon Map - Grid-based tactical battle map'
    };
  };

  const mapDescriptions = getMapTypeDescriptions();

  useEffect(() => {
    loadFiles();
  }, [campaign]);

  const loadFiles = async () => {
    try {
      // Regular files are stored in the campaign document
      const regularFiles = campaign.files || [];

      // Generated maps are stored in a subcollection
      const mapsSnapshot = await getDocs(collection(db, `campaigns/${campaign.id}/maps`));
      const mapFiles = mapsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Combine and sort by creation time
      const allFiles = [...regularFiles, ...mapFiles];
      setFiles(allFiles.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated)));
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB for Firestore storage)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    if (!isDM) {
      alert('Only DMs can upload files');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Read file as base64
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      };

      reader.onload = async (e) => {
        const dataUrl = e.target.result;

        const fileData = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          contentType: file.type,
          dataUrl: dataUrl,
          timeCreated: new Date().toISOString(),
          uploadedBy: campaign.members?.[campaign.dmId]?.displayName || 'DM'
        };

        // Add file to campaign's files array
        const campaignRef = doc(db, `campaigns/${campaign.id}`);
        await updateDoc(campaignRef, {
          files: arrayUnion(fileData),
          updatedAt: serverTimestamp()
        });

        await loadFiles();
        setUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
      };

      reader.onerror = (error) => {
        console.error('Upload error:', error);
        alert('Failed to upload file');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
      setUploading(false);
    }
  };

  const handleDelete = async (file) => {
    if (!isDM) {
      alert('Only DMs can delete files');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      const campaignRef = doc(db, `campaigns/${campaign.id}`);
      await updateDoc(campaignRef, {
        files: arrayRemove(file),
        updatedAt: serverTimestamp()
      });
      await loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleGenerateMap = async () => {
    if (!hasKey()) {
      alert('Please add an API key in Settings to use AI map generation.');
      return;
    }

    if (mapType === 'regional' || mapType === 'local') {
      if (!selectedLocation) {
        alert('Please select a location for regional/local maps.');
        return;
      }
    }

    setGeneratingMap(true);

    try {
      console.log(`Generating ${mapType} map...`);

      const apiKey = hasKey('anthropic') ? keys.anthropic : (hasKey('openai') ? keys.openai : null);
      const provider = hasKey('anthropic') ? 'anthropic' : 'openai';
      const openaiKey = hasKey('openai') ? keys.openai : null;

      const mapContext = {
        campaign,
        locations,
        mapType,
        mapName: mapType === 'world'
          ? `${campaign.name} World Map`
          : `${selectedLocation?.name} Map`
      };

      if (mapType === 'regional' || mapType === 'local' || mapType === 'dungeon') {
        mapContext.specificLocation = selectedLocation;
      }

      const mapData = await generateMap(
        mapContext,
        apiKey,
        provider,
        openaiKey,
        !!openaiKey // Generate image if we have OpenAI key
      );

      console.log('Map generated:', mapData);

      // Upload image to Firebase Storage if we have one
      let imageDownloadUrl = '';
      const hasImage = !!mapData.imageUrl;

      if (hasImage) {
        try {
          console.log('Uploading image to Firebase Storage...');
          const timestamp = Date.now();
          const imagePath = `campaigns/${campaign.id}/maps/${timestamp}.png`;
          const imageRef = ref(storage, imagePath);

          // Upload base64 image to Storage
          await uploadString(imageRef, mapData.imageUrl, 'data_url');

          // Get the download URL
          imageDownloadUrl = await getDownloadURL(imageRef);
          console.log('Image uploaded successfully:', imageDownloadUrl);
        } catch (error) {
          console.error('Failed to upload image to Storage:', error);
          alert('Image upload failed, but map metadata will be saved.');
        }
      }

      // Build fileData with all mapData fields, AUTO-DETECTING and stringifying ALL arrays
      const fileData = {
        id: Date.now().toString(),
        name: hasImage ? `${mapData.name}.png` : `${mapData.name}.txt`,
        size: 0,
        contentType: hasImage ? 'image/png' : 'text/plain',
        // Store the Firebase Storage download URL instead of base64
        dataUrl: imageDownloadUrl,
        timeCreated: new Date().toISOString(),
        uploadedBy: 'AI Generator',
        isGeneratedMap: true
      };

      // Auto-detect and process ALL fields from mapData
      Object.keys(mapData).forEach(key => {
        const value = mapData[key];

        // Skip fields we already handled or don't want to save
        if (key === 'imageUrl' || key === 'name') return;

        // Create field name with 'map' prefix for clarity
        const fieldName = `map${key.charAt(0).toUpperCase() + key.slice(1)}`;

        // Stringify arrays and objects, keep primitives as-is
        if (Array.isArray(value)) {
          fileData[fieldName] = JSON.stringify(value);
          console.log(`Stringified array field ${fieldName}:`, value.length, 'items');
        } else if (typeof value === 'object' && value !== null) {
          // Stringify any objects (including nested objects)
          fileData[fieldName] = JSON.stringify(value);
          console.log(`Stringified object field ${fieldName}:`, Object.keys(value).join(', '));
        } else if (value !== undefined && value !== null) {
          // Primitives (string, number, boolean)
          fileData[fieldName] = value;
        }
      });

      // Log the final fileData structure to debug
      console.log('Final fileData before save:', Object.keys(fileData));
      console.log('Checking for arrays in fileData:');
      Object.keys(fileData).forEach(key => {
        if (Array.isArray(fileData[key])) {
          console.error(`ERROR: ${key} is still an array!`, fileData[key]);
        }
      });

      // Deep check: log each field's type
      console.log('Field types:');
      Object.keys(fileData).forEach(key => {
        const value = fileData[key];
        console.log(`  ${key}: ${typeof value} ${Array.isArray(value) ? '(ARRAY!)' : ''}`);
      });

      // Save map as a document in a maps subcollection instead of the files array
      // This avoids Firestore's nested array limitations entirely
      console.log('Saving map to maps subcollection...');

      try {
        const mapsCollectionRef = collection(db, `campaigns/${campaign.id}/maps`);
        await addDoc(mapsCollectionRef, fileData);
        console.log('Map saved successfully to subcollection!');
      } catch (err) {
        console.error('Failed to save map:', err);
        throw err;
      }

      // Also update campaign world map if it's a world map
      if (mapType === 'world' && imageDownloadUrl) {
        await updateCampaign({
          worldMap: imageDownloadUrl,
          mapDescription: mapData.description,
          mapRegions: JSON.stringify(mapData.regions || []),
          mapFeatures: JSON.stringify(mapData.features || [])
        });
      }

      await loadFiles();
      setShowMapGenerator(false);
      setGeneratingMap(false);
    } catch (error) {
      console.error('Error generating map:', error);
      alert(`Failed to generate map: ${error.message}`);
      setGeneratingMap(false);
    }
  };

  const getFileIcon = (contentType) => {
    if (contentType?.startsWith('image/')) {
      return <Image size={24} />;
    }
    return <File size={24} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = (contentType) => {
    return contentType?.startsWith('image/');
  };

  if (loading) {
    return (
      <div className="files-view">
        <div className="loading-view">
          <div className="loading-spinner"></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cinzel text-[var(--hope-color)]">Maps & Files</h1>
            <p className="text-[var(--text-secondary)] mt-1">{files.length} file{files.length !== 1 ? 's' : ''} uploaded to your dedicated storage</p>
          </div>

          {isDM && (
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button
                className="btn btn-secondary flex-1 md:flex-none justify-center"
                onClick={() => setShowMapGenerator(!showMapGenerator)}
              >
                <Wand2 size={18} />
                {showMapGenerator ? 'Hide Generator' : 'AI Map Generator'}
              </button>
              <label className="btn btn-primary cursor-pointer flex-1 md:flex-none justify-center">
                <Upload size={18} />
                Upload File
                <input
                  type="file"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
        <hr className="border-[var(--border-accent)] opacity-30" />
      </div>

      {/* Map Generator Panel */}
      {isDM && showMapGenerator && (
        <div className="card border-2 border-[var(--fear-color)]/30 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-tertiary)] p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[var(--fear-color)]/20 rounded-full text-[var(--fear-color)]">
              <Wand2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-cinzel font-bold">AI Cartographer</h3>
              <p className="text-sm text-[var(--text-secondary)]">Procedurally generate maps and lore based on your campaign</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Map Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Map Type</label>
              <select
                value={mapType}
                onChange={(e) => {
                  setMapType(e.target.value);
                  setSelectedLocation(null);
                }}
                disabled={generatingMap}
                className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:border-[var(--hope-color)] outline-none transition-colors"
              >
                <option value="world">{mapDescriptions.world}</option>
                <option value="regional">{mapDescriptions.regional}</option>
                <option value="local">{mapDescriptions.local}</option>
                <option value="dungeon">{mapDescriptions.dungeon}</option>
              </select>
            </div>

            {/* Location Selection */}
            {(mapType === 'regional' || mapType === 'local' || mapType === 'dungeon') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Select Location</label>
                <select
                  value={selectedLocation?.id || ''}
                  onChange={(e) => {
                    const loc = locations.find(l => l.id === e.target.value);
                    setSelectedLocation(loc);
                  }}
                  disabled={generatingMap}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:border-[var(--hope-color)] outline-none transition-colors"
                >
                  <option value="">-- Select a location --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Info Alerts */}
            <div className="md:col-span-2 space-y-3">
              {!hasKey() && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-lg text-sm flex items-center gap-2">
                  ⚠️ You need to add an API key in Settings to use map generation.
                </div>
              )}

              {hasKey() && !hasKey('openai') && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-sm flex items-center gap-2">
                  ℹ️ Add an OpenAI API key to generate visual map images with DALL-E. Otherwise, only text descriptions will be generated.
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="md:col-span-2 flex justify-end">
              <button
                className="btn btn-primary"
                onClick={handleGenerateMap}
                disabled={generatingMap || !hasKey() || ((mapType === 'regional' || mapType === 'local' || mapType === 'dungeon') && !selectedLocation)}
              >
                {generatingMap ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Forging Map...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Generate {mapType.charAt(0).toUpperCase() + mapType.slice(1)} Map
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="card p-4 flex items-center gap-4 animate-pulse">
          <Upload size={24} className="text-[var(--hope-color)]" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading {selectedFile?.name}...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--hope-color)] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-primary)]/50">
          <div className="p-4 bg-[var(--bg-secondary)] rounded-full mb-4">
            <Map size={48} className="text-[var(--text-muted)] opacity-50" />
          </div>
          <h3 className="text-xl font-cinzel font-semibold mb-2">No Archives Found</h3>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">Upload maps, documents, or images to access them during your session.</p>
          {isDM && (
            <label className="btn btn-primary cursor-pointer">
              <Upload size={18} />
              Upload First File
              <input
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.map((file) => (
          <div
            key={file.id}
            className={`card p-0 overflow-hidden flex flex-col group hover:border-[var(--hope-color)] transition-all duration-300 ${file.isGeneratedMap ? 'border-[var(--fear-color)]/30' : ''}`}
          >
            {/* Preview Area */}
            <div
              className="h-48 bg-[var(--bg-secondary)] relative flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => isImage(file.contentType) ? setViewingFile(file) : (file.isGeneratedMap ? setViewingMap(file) : null)}
            >
              {/* Overlay Gradient on Hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                <Eye size={32} className="text-white drop-shadow-lg" />
              </div>

              {isImage(file.contentType) ? (
                <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : file.isGeneratedMap && file.mapDescription ? (
                <div className="text-center p-6">
                  <Wand2 size={48} className="text-[var(--fear-color)] mx-auto mb-3 opacity-80" />
                  <span className="text-xs uppercase tracking-widest text-[var(--fear-color)] font-bold">Generated Map</span>
                </div>
              ) : (
                <div className="text-[var(--text-muted)] opacity-50 scale-125">
                  {getFileIcon(file.contentType)}
                </div>
              )}

              {/* AI Badge Overlay */}
              {file.isGeneratedMap && (
                <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-sm border border-[var(--fear-color)] text-[var(--fear-color)] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                  AI Generated
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex-1">
                <h4 className="font-semibold text-[var(--text-primary)] mb-1 truncate" title={file.name}>{file.name}</h4>

                {file.mapType && (
                  <span className="inline-block px-2 py-0.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-[10px] uppercase tracking-wide text-[var(--text-secondary)] mb-2">
                    {file.mapType}
                  </span>
                )}

                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] mt-2">
                  <span>{formatFileSize(file.size)}</span>
                  <span>by {file.uploadedBy}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                <a
                  href={file.dataUrl}
                  download={file.name}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--hope-color)] hover:bg-[var(--bg-primary)] rounded transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </a>

                <div className="flex-1"></div>

                {isDM && (
                  <button
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewingFile && (
        <Modal
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
          title={viewingFile.name}
          size="large"
        >
          <div className="flex justify-center items-center bg-black/20 p-4 rounded-lg">
            <img src={viewingFile.dataUrl} alt={viewingFile.name} className="max-w-full max-h-[80vh] rounded shadow-2xl" />
          </div>
        </Modal>
      )}

      {viewingMap && (() => {
        // Parse JSON strings back to objects
        // Helper to safely parse any stringified array
        const safeParse = (value, fieldName) => {
          if (!value) return [];
          try {
            return typeof value === 'string' ? JSON.parse(value) : value;
          } catch (e) {
            console.error(`Failed to parse ${fieldName}:`, e);
            return [];
          }
        };

        // Parse all fields - they all have "map" prefix when saved
        let locationPlacements = safeParse(viewingMap.mapLocationPlacements, 'locationPlacements');
        let climateZones = safeParse(viewingMap.mapClimateZones, 'climateZones');
        let geographicalFeatures = safeParse(viewingMap.mapGeographicalFeatures, 'geographicalFeatures');
        let mapRegions = safeParse(viewingMap.mapRegions, 'mapRegions');
        let mapFeatures = safeParse(viewingMap.mapFeatures, 'mapFeatures');
        let districts = safeParse(viewingMap.mapDistricts, 'districts');
        let landmarks = safeParse(viewingMap.mapLandmarks, 'landmarks');
        let rooms = safeParse(viewingMap.mapRooms, 'rooms');
        let connections = safeParse(viewingMap.mapConnections, 'connections');

        return (
          <Modal
            isOpen={!!viewingMap}
            onClose={() => setViewingMap(null)}
            title={viewingMap.name.replace('.txt', '').replace('.png', '')}
            size="large"
          >
            <div className="space-y-6">
              {viewingMap.dataUrl && (
                <div className="rounded-lg overflow-hidden border border-[var(--border)] shadow-lg">
                  <img src={viewingMap.dataUrl} alt={viewingMap.name} className="w-full h-auto" />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] border border-[var(--border)]">{viewingMap.mapType} map</span>
                <span className="px-3 py-1 bg-[var(--fear-color)]/10 text-[var(--fear-color)] rounded-full text-xs font-bold uppercase tracking-wider border border-[var(--fear-color)]/20 flex items-center gap-1">
                  <Wand2 size={10} /> AI Generated
                </span>
                {viewingMap.mapStyle && <span className="px-3 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs text-[var(--text-secondary)] border border-[var(--border)]">{viewingMap.mapStyle}</span>}
              </div>

              <div>
                <h3 className="text-lg font-cinzel font-bold text-[var(--hope-color)] mb-2">Description</h3>
                <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap bg-[var(--bg-primary)]/30 p-4 rounded-lg border border-[var(--border)]">
                  {viewingMap.mapDescription}
                </p>
              </div>

              {mapRegions && mapRegions.length > 0 && (
                <div>
                  <h3 className="text-lg font-cinzel font-bold text-[var(--hope-color)] mb-3">Regions</h3>
                  <div className="flex flex-wrap gap-2">
                    {mapRegions.map((region, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-sm text-[var(--text-secondary)]">{region}</span>
                    ))}
                  </div>
                </div>
              )}

              {mapFeatures && mapFeatures.length > 0 && (
                <div>
                  <h3 className="text-lg font-cinzel font-bold text-[var(--hope-color)] mb-3">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {mapFeatures.map((feature, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-sm text-[var(--text-secondary)]">{feature}</span>
                    ))}
                  </div>
                </div>
              )}

              {locationPlacements.length > 0 && (
                <div>
                  <h3 className="text-lg font-cinzel font-bold text-[var(--hope-color)] mb-3">Key Locations</h3>
                  <div className="grid gap-4">
                    {locationPlacements.map((loc, idx) => (
                      <div key={idx} className="p-4 bg-[var(--bg-tertiary)]/50 rounded-lg border border-[var(--border)]">
                        <div className="flex justify-between items-start mb-2">
                          <strong className="text-[var(--text-primary)] font-cinzel">{loc.location}</strong>
                          {loc.type && <span className="text-xs px-2 py-0.5 bg-[var(--bg-primary)] rounded text-[var(--text-muted)] border border-[var(--border)]">{loc.type}</span>}
                        </div>
                        {loc.position && (
                          <p className="text-xs text-[var(--hope-color)] mb-2 flex items-center gap-1">
                            📍 {loc.position}
                          </p>
                        )}
                        {loc.description && (
                          <p className="text-sm text-[var(--text-secondary)] opacity-90">
                            {loc.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {climateZones.length > 0 && (
                <div>
                  <h3 className="text-lg font-cinzel font-bold text-[var(--hope-color)] mb-3">Climate Zones</h3>
                  <div className="grid gap-3">
                    {climateZones.map((zone, idx) => (
                      <div key={idx} className="p-3 bg-[var(--bg-tertiary)]/30 rounded-lg border border-[var(--border)]">
                        <strong className="text-sm block text-[var(--text-primary)] mb-1">
                          {zone.zone || zone.region || 'Climate Zone'}
                        </strong>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {zone.climate || zone.description || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {geographicalFeatures.length > 0 && (
                <div>
                  <h3 className="text-lg font-cinzel font-bold text-[var(--hope-color)] mb-3">Geography</h3>
                  <div className="grid gap-3">
                    {geographicalFeatures.map((feature, idx) => (
                      <div key={idx} className="p-3 bg-[var(--bg-tertiary)]/30 rounded-lg border border-[var(--border)]">
                        <strong className="text-sm block text-[var(--text-primary)] mb-1">
                          {feature.feature || feature.name || 'Feature'}
                        </strong>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {feature.description || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rooms && rooms.length > 0 && (
                <div>
                  <h3 className="text-lg font-cinzel font-bold text-[var(--hope-color)] mb-3">Rooms</h3>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] pl-2">
                    {rooms.map((room, idx) => (
                      <li key={idx} className="marker:text-[var(--hope-color)]">{room}</li>
                    ))}
                  </ul>
                </div>
              )}

              {connections && connections.length > 0 && (
                <div>
                  <h3 className="text-lg font-cinzel font-bold text-[var(--hope-color)] mb-3">Connections</h3>
                  <div className="flex flex-wrap gap-2">
                    {connections.map((connection, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-sm text-[var(--text-secondary)]">{connection}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingMap.gridSize && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-primary)]/50 p-2 rounded inline-block">
                  <span className="uppercase tracking-wider font-bold text-[10px]">Grid Size:</span>
                  {viewingMap.gridSize}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
