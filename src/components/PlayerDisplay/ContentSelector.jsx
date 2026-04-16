import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAPIKey } from '../../hooks/useAPIKey';
import { Map, Users, FolderOpen, Check, Image as ImageIcon, Youtube, Upload, Link, Play, Loader2, Wand2, Skull, Plus, Film, Trash2 } from 'lucide-react';
import './DMDisplayControl.css';

// Extract YouTube video ID for thumbnail
function getYouTubeVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function ContentSelector({
  campaignId,
  campaign,
  characters = [],
  npcs = [],
  locations = [],
  adversaries = [],
  onSelectContent,
  currentContentItems = []
}) {
  const [activeTab, setActiveTab] = useState('maps');
  const [files, setFiles] = useState([]);
  const [maps, setMaps] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // API key for AI generation
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const openaiKeyInfo = getEffectiveKey('openai');
  const hasOpenAIKey = !!openaiKeyInfo?.key;

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [savedUploads, setSavedUploads] = useState([]);

  // AI Generate state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateName, setGenerateName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  // Load files and maps
  useEffect(() => {
    const loadContent = async () => {
      if (!campaignId) return;

      try {
        setLoading(true);

        // Load regular files from campaign document
        const regularFiles = campaign?.files || [];

        // Load generated maps from subcollection
        const mapsSnapshot = await getDocs(collection(db, `campaigns/${campaignId}/maps`));
        const mapFiles = mapsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        // Load generated images (creatures, etc.)
        const generatedSnapshot = await getDocs(collection(db, `campaigns/${campaignId}/generatedImages`));
        const generatedFiles = generatedSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setGeneratedImages(generatedFiles);

        // Load saved Quick Upload library (DM uploads persisted for reuse)
        const uploadsSnapshot = await getDocs(
          query(collection(db, `campaigns/${campaignId}/displayUploads`), orderBy('createdAt', 'desc'))
        );
        setSavedUploads(uploadsSnapshot.docs.map(d => ({ ...d.data(), id: d.id })));

        // Separate maps from other files
        const allFiles = [...regularFiles, ...mapFiles];
        const imageFiles = allFiles.filter(f =>
          f.contentType?.startsWith('image/') ||
          f.dataUrl?.startsWith('http') ||
          (f.isGeneratedMap && f.dataUrl)
        );

        setMaps(imageFiles.filter(f => f.isGeneratedMap));
        setFiles(imageFiles.filter(f => !f.isGeneratedMap));
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [campaignId, campaign]);

  const handleSelectItem = (type, item) => {
    onSelectContent(type, {
      url: item.dataUrl || item.avatarUrl || item.imageUrl || '',
      name: item.name,
      type: item.type || type,
      showName: true
    });
  };

  // Check if an item is already on the display
  const isOnDisplay = (item) => {
    if (!currentContentItems || currentContentItems.length === 0) return false;
    const itemUrl = item.dataUrl || item.avatarUrl || item.imageUrl;
    return currentContentItems.some(ci => ci.url === itemUrl);
  };

  // Handle YouTube submit
  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    const videoId = getYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    onSelectContent('video', {
      url: youtubeUrl,
      name: videoTitle || 'YouTube Video',
      type: 'youtube',
      showName: !!videoTitle
    });
  };

  // Handle quick upload — supports images and videos
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Images: 50MB limit  |  Videos: 500MB limit
    const maxBytes = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`File size must be less than ${isVideo ? '500MB' : '50MB'}`);
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      const storagePath = `campaigns/${campaignId}/display/${timestamp}_${file.name}`;
      const storageRef = ref(storage, storagePath);

      // Upload binary directly — avoids base64 blowing up memory for large files
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      const displayName = file.name.replace(/\.[^/.]+$/, '');

      // Persist to library so it can be reused without re-uploading
      const savedDoc = await addDoc(
        collection(db, `campaigns/${campaignId}/displayUploads`),
        {
          url: downloadUrl,
          name: displayName,
          isVideo,
          storagePath,
          createdAt: serverTimestamp()
        }
      );
      setSavedUploads(prev => [
        { id: savedDoc.id, url: downloadUrl, name: displayName, isVideo, storagePath },
        ...prev
      ]);

      setUploadedImage({
        url: downloadUrl,
        name: displayName,
        isVideo
      });
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Failed to upload file to storage');
    } finally {
      setUploading(false);
    }
  };

  // Push uploaded file to display
  const handlePushUploadedImage = () => {
    if (!uploadedImage) return;

    if (uploadedImage.isVideo) {
      onSelectContent('localvideo', {
        url: uploadedImage.url,
        name: uploadedImage.name,
        type: 'localvideo',
        showName: true
      });
    } else {
      onSelectContent('image', {
        url: uploadedImage.url,
        name: uploadedImage.name,
        type: 'uploaded',
        showName: true
      });
    }
  };

  // Push a previously saved upload from the library
  const handlePushSavedUpload = (item) => {
    if (item.isVideo) {
      onSelectContent('localvideo', {
        url: item.url,
        name: item.name,
        type: 'localvideo',
        showName: true
      });
    } else {
      onSelectContent('image', {
        url: item.url,
        name: item.name,
        type: 'uploaded',
        showName: true
      });
    }
  };

  // Delete a saved upload (removes both Storage object and Firestore doc)
  const handleDeleteSavedUpload = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${item.name}" from the library? This cannot be undone.`)) return;

    try {
      if (item.storagePath) {
        await deleteObject(ref(storage, item.storagePath)).catch(() => {}); // tolerate already-missing files
      }
      await deleteDoc(doc(db, `campaigns/${campaignId}/displayUploads`, item.id));
      setSavedUploads(prev => prev.filter(u => u.id !== item.id));
    } catch (err) {
      console.error('Failed to delete saved upload:', err);
      alert('Failed to delete. Try again.');
    }
  };

  // Generate AI image
  const handleGenerateImage = async () => {
    if (!generatePrompt.trim()) {
      setGenerateError('Please enter a description');
      return;
    }

    setGenerating(true);
    setGenerateError(null);

    try {
      // Build the DALL-E prompt based on game system
      const gameSystem = campaign?.gameSystem || 'daggerheart';
      let stylePrefix = '';
      if (gameSystem === 'starwarsd6') {
        stylePrefix = 'Star Wars sci-fi creature or character, dramatic cinematic lighting, detailed sci-fi art style';
      } else {
        stylePrefix = 'Fantasy RPG creature or monster, dramatic lighting, detailed fantasy art style, painterly quality';
      }

      const fullPrompt = `${stylePrefix}. ${generatePrompt.trim()}. Full body or portrait view, dynamic pose, high quality, no text or labels.`;

      console.log('Generating display image with prompt:', fullPrompt);

      // Call DALL-E via server proxy — backend uses server-side OPENAI_API_KEY if no client key
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          type: 'portrait',
          apiKey: openaiKeyInfo?.key || undefined,
          size: '1792x1024'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || 'Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data.imageUrl;
      if (!imageUrl) throw new Error('No image URL returned');

      // Download via proxy and upload to Firebase Storage
      console.log('Downloading generated image...');
      const proxyResponse = await fetch('/api/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      if (!proxyResponse.ok) {
        throw new Error('Failed to download generated image');
      }

      const { dataUrl } = await proxyResponse.json();

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const safeName = (generateName || 'creature').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const storagePath = `campaigns/${campaignId}/display/${timestamp}_${safeName}.png`;
      const storageRef = ref(storage, storagePath);

      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      console.log('Generated image uploaded:', downloadUrl);

      // Save to Firestore so it appears in Maps & Files
      const imageRecord = {
        name: generateName || 'Generated Creature',
        description: generatePrompt,
        dataUrl: downloadUrl,
        isGenerated: true,
        type: 'creature',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, `campaigns/${campaignId}/generatedImages`), imageRecord);
      console.log('Generated image record saved to Firestore');

      setGeneratedImage({
        url: downloadUrl,
        name: generateName || 'Generated Image'
      });

    } catch (err) {
      console.error('Image generation failed:', err);
      setGenerateError(err.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  // Push generated image to display
  const handlePushGeneratedImage = () => {
    if (!generatedImage) return;

    onSelectContent('image', {
      url: generatedImage.url,
      name: generatedImage.name,
      type: 'generated',
      showName: !!generateName
    });
  };

  // Get characters with avatars (party members)
  const charactersWithAvatars = characters.filter(char => char.avatarUrl);

  // Get NPCs with images
  const npcsWithImages = npcs.filter(npc => npc.avatarUrl);

  // Get locations with images
  const locationsWithImages = locations.filter(loc => loc.imageUrl);

  // Get adversaries with images
  const adversariesWithImages = adversaries.filter(adv => adv.imageUrl);

  const tabs = [
    { id: 'maps', label: 'Maps', icon: Map, count: maps.length },
    { id: 'party', label: 'Party', icon: Users, count: charactersWithAvatars.length },
    { id: 'creatures', label: 'Creatures', icon: Skull, count: generatedImages.length },
    { id: 'adversaries', label: 'Adversaries', icon: Skull, count: adversariesWithImages.length },
    { id: 'npcs', label: 'NPCs', icon: Users, count: npcsWithImages.length },
    { id: 'locations', label: 'Locations', icon: Map, count: locationsWithImages.length },
    { id: 'files', label: 'Files', icon: FolderOpen, count: files.length },
    { id: 'uploads', label: 'Uploads', icon: FolderOpen, count: savedUploads.length },
    { id: 'generate', label: 'Generate', icon: Wand2 },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'upload', label: 'Quick Upload', icon: Upload }
  ];

  const renderContent = () => {
    if (activeTab === 'youtube') {
      const videoId = getYouTubeVideoId(youtubeUrl);
      return (
        <div className="youtube-input-section">
          <form onSubmit={handleYoutubeSubmit}>
            <div className="input-group">
              <label>YouTube URL</label>
              <div className="input-with-icon">
                <Link size={16} />
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>
            <div className="input-group">
              <label>Title (optional)</label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Video title to display"
              />
            </div>

            {/* YouTube Preview */}
            {videoId && (
              <div className="youtube-preview">
                <img
                  src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                  alt="Video thumbnail"
                />
                <div className="play-overlay">
                  <Play size={32} />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!youtubeUrl}
            >
              <Plus size={16} />
              Add to Display
            </button>
          </form>
        </div>
      );
    }

    if (activeTab === 'generate') {
      return (
        <div className="generate-section">
          <div className="generate-form">
            <div className="input-group">
              <label>
                <Skull size={16} />
                Creature/Monster Description
              </label>
              <textarea
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="e.g., A fearsome goblin war chief with tribal tattoos and a jagged sword, or A massive shadow dragon emerging from darkness..."
                rows={3}
                disabled={generating}
              />
            </div>
            <div className="input-group">
              <label>Name (optional, shown on display)</label>
              <input
                type="text"
                value={generateName}
                onChange={(e) => setGenerateName(e.target.value)}
                placeholder="e.g., Goblin War Chief"
                disabled={generating}
              />
            </div>

            {generateError && (
              <div className="generate-error">
                {generateError}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleGenerateImage}
              disabled={generating || !generatePrompt.trim()}
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {generatedImage && (
            <div className="generated-result">
              <div className="generated-preview">
                <img src={generatedImage.url} alt={generatedImage.name} />
              </div>
              <div className="generated-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setGeneratedImage(null);
                    setGeneratePrompt('');
                    setGenerateName('');
                  }}
                >
                  Clear
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handlePushGeneratedImage}
                >
                  <Plus size={16} />
                  Add to Display
                </button>
              </div>
            </div>
          )}

          <p className="generate-note">
            Generate monsters, creatures, or scene images on the fly using AI. Images are saved to your campaign.
          </p>
        </div>
      );
    }

    if (activeTab === 'upload') {
      return (
        <div className="upload-section">
          <div className="upload-area">
            <label className="upload-dropzone">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {uploading ? (
                <>
                  <Loader2 size={40} className="spinner" />
                  <span>Uploading to storage...</span>
                </>
              ) : uploadedImage ? (
                <div className="uploaded-preview">
                  {uploadedImage.isVideo ? (
                    <video
                      src={uploadedImage.url}
                      muted
                      playsInline
                      controls
                      style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: '6px' }}
                    />
                  ) : (
                    <img src={uploadedImage.url} alt={uploadedImage.name} />
                  )}
                  <span className="uploaded-name">
                    {uploadedImage.isVideo && <Film size={12} style={{ display: 'inline', marginRight: 4 }} />}
                    {uploadedImage.name}
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={40} />
                  <span>Click to select an image or video</span>
                  <span className="upload-hint">Images up to 50MB · Videos up to 500MB</span>
                </>
              )}
            </label>
          </div>

          {uploadedImage && (
            <div className="upload-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setUploadedImage(null)}
              >
                Clear
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePushUploadedImage}
              >
                <Plus size={16} />
                Add to Display
              </button>
            </div>
          )}

          <p className="upload-note">
            Uploaded files are saved to the Uploads tab for reuse — you don't need to re-upload next time.
          </p>
        </div>
      );
    }

    if (activeTab === 'uploads') {
      if (loading) {
        return (
          <div className="content-loading">
            <div className="loading-spinner"></div>
            <span>Loading uploads...</span>
          </div>
        );
      }
      if (savedUploads.length === 0) {
        return (
          <div className="content-empty">
            <Upload size={40} />
            <p>No saved uploads yet. Use Quick Upload to add images or videos — they'll be saved here for reuse.</p>
          </div>
        );
      }
      return (
        <div className="content-grid">
          {savedUploads.map(item => (
            <button
              key={item.id}
              className="content-item"
              onClick={() => handlePushSavedUpload(item)}
              title="Click to add to display"
            >
              <div className="content-thumbnail">
                {item.isVideo ? (
                  <video src={item.url} muted playsInline preload="metadata" />
                ) : (
                  <img src={item.url} alt={item.name} />
                )}
                {item.isVideo && (
                  <div className="on-display-indicator" style={{ left: 6, right: 'auto' }}>
                    <Film size={14} />
                  </div>
                )}
                <div className="add-indicator">
                  <Plus size={16} />
                </div>
                <button
                  type="button"
                  className="upload-delete-btn"
                  onClick={(e) => handleDeleteSavedUpload(item, e)}
                  title="Delete from library"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <span className="content-name">{item.name}</span>
            </button>
          ))}
        </div>
      );
    }

    if (loading) {
      return (
        <div className="content-loading">
          <div className="loading-spinner"></div>
          <span>Loading content...</span>
        </div>
      );
    }

    let items = [];
    let type = activeTab;

    switch (activeTab) {
      case 'maps':
        items = maps;
        type = 'map';
        break;
      case 'party':
        items = charactersWithAvatars;
        type = 'character';
        break;
      case 'creatures':
        items = generatedImages;
        type = 'creature';
        break;
      case 'adversaries':
        items = adversariesWithImages;
        type = 'adversary';
        break;
      case 'npcs':
        items = npcsWithImages;
        type = 'npc';
        break;
      case 'locations':
        items = locationsWithImages;
        type = 'location';
        break;
      case 'files':
        items = files;
        type = 'image';
        break;
    }

    if (items.length === 0) {
      return (
        <div className="content-empty">
          <ImageIcon size={40} />
          <p>No {activeTab} with images available</p>
        </div>
      );
    }

    return (
      <div className="content-grid">
        {items.map((item) => {
          const imageUrl = item.dataUrl || item.avatarUrl || item.imageUrl;
          const onDisplay = isOnDisplay(item);

          return (
            <button
              key={item.id}
              className={`content-item ${onDisplay ? 'on-display' : ''}`}
              onClick={() => handleSelectItem(type, item)}
              title={onDisplay ? 'Already on display - click to add again' : 'Click to add to display'}
            >
              <div className="content-thumbnail">
                {imageUrl ? (
                  <img src={imageUrl} alt={item.name} />
                ) : (
                  <ImageIcon size={24} />
                )}
                {onDisplay && (
                  <div className="on-display-indicator">
                    <Check size={14} />
                  </div>
                )}
                <div className="add-indicator">
                  <Plus size={16} />
                </div>
              </div>
              <span className="content-name">{item.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="content-selector">
      <div className="content-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`content-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="tab-count">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="content-panel">
        {renderContent()}
      </div>
    </div>
  );
}
