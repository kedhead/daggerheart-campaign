import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase';
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

  useEffect(() => {
    loadFiles();
  }, [campaign]);

  const loadFiles = async () => {
    try {
      // Files are stored directly in the campaign document
      const filesData = campaign.files || [];
      setFiles(filesData.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated)));
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

      // Save map as a file
      // Only save as image if we actually have an image, otherwise save as text
      const hasImage = !!mapData.imageUrl;

      // Flatten complex nested structures for Firestore
      // Firestore doesn't allow arrays of objects with nested data

      // Build fileData with all mapData fields, AUTO-DETECTING and stringifying ALL arrays
      const fileData = {
        id: Date.now().toString(),
        name: hasImage ? `${mapData.name}.png` : `${mapData.name}.txt`,
        size: 0,
        contentType: hasImage ? 'image/png' : 'text/plain',
        dataUrl: mapData.imageUrl || '',
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

        // Stringify arrays, keep primitives as-is
        if (Array.isArray(value)) {
          fileData[fieldName] = JSON.stringify(value);
          console.log(`Stringified array field ${fieldName}:`, value.length, 'items');
        } else if (value !== undefined && value !== null && typeof value !== 'object') {
          fileData[fieldName] = value;
        } else if (typeof value === 'object' && value !== null) {
          // Stringify any remaining objects to be safe
          fileData[fieldName] = JSON.stringify(value);
          console.log(`Stringified object field ${fieldName}`);
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

      // Add file to campaign's files array
      const campaignRef = doc(db, `campaigns/${campaign.id}`);
      await updateDoc(campaignRef, {
        files: arrayUnion(fileData),
        updatedAt: serverTimestamp()
      });

      // Also update campaign world map if it's a world map
      if (mapType === 'world' && mapData.imageUrl) {
        await updateCampaign({
          worldMap: mapData.imageUrl,
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
    <div className="files-view">
      <div className="view-header">
        <div>
          <h2>Maps & Files</h2>
          <p className="view-subtitle">{files.length} file{files.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        {isDM && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowMapGenerator(!showMapGenerator)}>
              <Wand2 size={20} />
              {showMapGenerator ? 'Hide Map Generator' : 'Generate Map with AI'}
            </button>
            <label className="btn btn-primary upload-btn">
              <Upload size={20} />
              Upload File (Max 5MB)
              <input
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Map Generator */}
      {isDM && showMapGenerator && (
        <div className="map-generator card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Wand2 size={20} />
            AI Map Generator
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Generate maps using AI based on your campaign and locations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Map Type Selection */}
            <div className="form-group">
              <label>Map Type</label>
              <select
                value={mapType}
                onChange={(e) => {
                  setMapType(e.target.value);
                  setSelectedLocation(null);
                }}
                disabled={generatingMap}
                className="form-control"
              >
                <option value="world">World Map - Tolkien-esque overview of entire campaign world</option>
                <option value="regional">Regional Map - Tolkien-esque area around a location</option>
                <option value="local">Local Map - Tolkien-esque detailed map of a city/town</option>
                <option value="dungeon">Dungeon Map - Grid-based tactical battle map</option>
              </select>
            </div>

            {/* Location Selection for Regional/Local/Dungeon */}
            {(mapType === 'regional' || mapType === 'local' || mapType === 'dungeon') && (
              <div className="form-group">
                <label>Select Location</label>
                <select
                  value={selectedLocation?.id || ''}
                  onChange={(e) => {
                    const loc = locations.find(l => l.id === e.target.value);
                    setSelectedLocation(loc);
                  }}
                  disabled={generatingMap}
                  className="form-control"
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

            {/* API Key Warning */}
            {!hasKey() && (
              <div className="alert alert-warning">
                ⚠️ You need to add an API key in Settings to use map generation.
              </div>
            )}

            {/* OpenAI Key Info */}
            {hasKey() && !hasKey('openai') && (
              <div className="alert alert-info">
                ℹ️ Add an OpenAI API key to generate visual map images with DALL-E. Otherwise, only text descriptions will be generated.
              </div>
            )}

            {/* Generate Button */}
            <button
              className="btn btn-primary"
              onClick={handleGenerateMap}
              disabled={generatingMap || !hasKey() || ((mapType === 'regional' || mapType === 'local' || mapType === 'dungeon') && !selectedLocation)}
              style={{ alignSelf: 'flex-start' }}
            >
              {generatingMap ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Generating Map...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate {mapType.charAt(0).toUpperCase() + mapType.slice(1)} Map
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="upload-progress card">
          <div className="progress-info">
            <Upload size={20} />
            <span>Uploading {selectedFile?.name}...</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <span className="progress-text">{Math.round(uploadProgress)}%</span>
        </div>
      )}

      {files.length === 0 && !uploading ? (
        <div className="empty-state card">
          <Map size={64} />
          <p>No files uploaded yet</p>
          {isDM && (
            <label className="btn btn-primary">
              <Upload size={20} />
              Upload First File
              <input
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      ) : (
        <div className="files-grid">
          {files.map((file) => (
            <div key={file.id} className={`file-card card ${file.isGeneratedMap ? 'generated-map' : ''}`}>
              <div className="file-preview">
                {isImage(file.contentType) ? (
                  <img src={file.dataUrl} alt={file.name} />
                ) : file.isGeneratedMap && file.mapDescription ? (
                  <div className="file-icon-large" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Map size={48} style={{ color: 'var(--hope-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Text Map Description</span>
                  </div>
                ) : (
                  <div className="file-icon-large">
                    {getFileIcon(file.contentType)}
                  </div>
                )}
              </div>
              <div className="file-info">
                <h4 className="file-name">
                  {file.name}
                  {file.isGeneratedMap && (
                    <span className="badge badge-ai" title="AI Generated">
                      <Wand2 size={12} />
                    </span>
                  )}
                </h4>
                <div className="file-meta">
                  {file.size > 0 && <span className="file-size">{formatFileSize(file.size)}</span>}
                  <span className="file-uploader">by {file.uploadedBy}</span>
                </div>
                {file.mapDescription && (
                  <p className="map-description" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {file.mapDescription.length > 100
                      ? file.mapDescription.substring(0, 100) + '...'
                      : file.mapDescription}
                  </p>
                )}
                {file.mapType && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className="tag" style={{ fontSize: '0.75rem' }}>
                      {file.mapType} map
                    </span>
                  </div>
                )}
              </div>
              <div className="file-actions">
                {file.isGeneratedMap && (
                  <button
                    className="btn btn-icon"
                    onClick={() => setViewingMap(file)}
                    title="View map details"
                  >
                    <Eye size={18} />
                  </button>
                )}
                {isImage(file.contentType) && !file.isGeneratedMap && (
                  <button
                    className="btn btn-icon"
                    onClick={() => setViewingFile(file)}
                    title="View full size"
                  >
                    <Eye size={18} />
                  </button>
                )}
                {file.dataUrl && (
                  <a
                    href={file.dataUrl}
                    download={file.name}
                    className="btn btn-icon"
                    title="Download"
                  >
                    <Download size={18} />
                  </a>
                )}
                {isDM && (
                  <button
                    className="btn btn-icon btn-danger"
                    onClick={() => handleDelete(file)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingFile && (
        <Modal
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
          title={viewingFile.name}
          size="large"
        >
          <div className="file-viewer">
            <img src={viewingFile.dataUrl} alt={viewingFile.name} />
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
            <div className="map-viewer" style={{ padding: '1.5rem' }}>
              {viewingMap.dataUrl && (
                <div style={{ marginBottom: '2rem' }}>
                  <img src={viewingMap.dataUrl} alt={viewingMap.name} style={{ width: '100%', borderRadius: '8px' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="tag">{viewingMap.mapType} map</span>
                <span className="badge badge-ai"><Wand2 size={12} /> AI Generated</span>
                {viewingMap.mapStyle && <span className="tag" style={{ fontSize: '0.75rem' }}>{viewingMap.mapStyle}</span>}
              </div>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Description</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {viewingMap.mapDescription}
              </p>

              {mapRegions && mapRegions.length > 0 && (
                <>
                  <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Regions</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {mapRegions.map((region, idx) => (
                      <span key={idx} className="tag">{region}</span>
                    ))}
                  </div>
                </>
              )}

              {mapFeatures && mapFeatures.length > 0 && (
                <>
                  <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Features</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {mapFeatures.map((feature, idx) => (
                      <span key={idx} className="tag">{feature}</span>
                    ))}
                  </div>
                </>
              )}

              {locationPlacements.length > 0 && (
                <>
                  <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Location Placements</h3>
                  <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                    {locationPlacements.map((loc, idx) => (
                      <div key={idx} style={{
                        padding: '1rem',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <strong style={{ color: 'var(--hope-color)' }}>{loc.location}</strong>
                          {loc.type && <span className="tag">{loc.type}</span>}
                        </div>
                        {loc.position && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                            📍 {loc.position}
                          </p>
                        )}
                        {loc.description && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                            {loc.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {climateZones.length > 0 && (
                <>
                  <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Climate Zones</h3>
                  <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                    {climateZones.map((zone, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <strong style={{ color: 'var(--hope-color)', fontSize: '0.9rem' }}>
                          {zone.zone || zone.region || 'Climate Zone'}
                        </strong>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                          {zone.climate || zone.description || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {geographicalFeatures.length > 0 && (
                <>
                  <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Geographical Features</h3>
                  <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                    {geographicalFeatures.map((feature, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <strong style={{ color: 'var(--hope-color)', fontSize: '0.9rem' }}>
                          {feature.feature || feature.name || 'Feature'}
                        </strong>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                          {feature.description || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

            {rooms && rooms.length > 0 && (
              <>
                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Rooms</h3>
                <ul style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                  {rooms.map((room, idx) => (
                    <li key={idx}>{room}</li>
                  ))}
                </ul>
              </>
            )}

            {connections && connections.length > 0 && (
              <>
                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Connections</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {connections.map((connection, idx) => (
                    <span key={idx} className="tag">{connection}</span>
                  ))}
                </div>
              </>
            )}

            {viewingMap.gridSize && (
              <>
                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Grid Size</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{viewingMap.gridSize}</p>
              </>
            )}
          </div>
        </Modal>
        );
      })()}
    </div>
  );
}
