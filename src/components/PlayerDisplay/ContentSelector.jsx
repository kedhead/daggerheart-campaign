import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Map, Users, FolderOpen, Check, Image as ImageIcon, Youtube, Upload, Link, Play } from 'lucide-react';
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
  npcs = [],
  locations = [],
  onSelectContent,
  currentContent
}) {
  const [activeTab, setActiveTab] = useState('maps');
  const [files, setFiles] = useState([]);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

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

  const isSelected = (item, type) => {
    if (!currentContent) return false;
    const itemUrl = item.dataUrl || item.avatarUrl || item.imageUrl;
    return currentContent.url === itemUrl;
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

  // Handle quick image upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setUploadedImage({
        dataUrl,
        name: file.name.replace(/\.[^/.]+$/, '') // Remove extension
      });
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Push uploaded image to display
  const handlePushUploadedImage = () => {
    if (!uploadedImage) return;

    onSelectContent('image', {
      url: uploadedImage.dataUrl,
      name: uploadedImage.name,
      type: 'uploaded',
      showName: true
    });
  };

  // Get NPCs with images
  const npcsWithImages = npcs.filter(npc => npc.avatarUrl);

  // Get locations with images
  const locationsWithImages = locations.filter(loc => loc.imageUrl);

  const tabs = [
    { id: 'maps', label: 'Maps', icon: Map, count: maps.length },
    { id: 'npcs', label: 'NPCs', icon: Users, count: npcsWithImages.length },
    { id: 'locations', label: 'Locations', icon: Map, count: locationsWithImages.length },
    { id: 'files', label: 'Files', icon: FolderOpen, count: files.length },
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
              <Youtube size={16} />
              Play on Display
            </button>
          </form>
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
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {uploading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Processing...</span>
                </>
              ) : uploadedImage ? (
                <div className="uploaded-preview">
                  <img src={uploadedImage.dataUrl} alt={uploadedImage.name} />
                  <span className="uploaded-name">{uploadedImage.name}</span>
                </div>
              ) : (
                <>
                  <Upload size={40} />
                  <span>Click to select an image</span>
                  <span className="upload-hint">Max 5MB - JPG, PNG, GIF, WebP</span>
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
                <ImageIcon size={16} />
                Push to Display
              </button>
            </div>
          )}

          <p className="upload-note">
            Quick upload displays the image immediately without saving to campaign files.
          </p>
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
          const selected = isSelected(item, type);

          return (
            <button
              key={item.id}
              className={`content-item ${selected ? 'selected' : ''}`}
              onClick={() => handleSelectItem(type, item)}
            >
              <div className="content-thumbnail">
                {imageUrl ? (
                  <img src={imageUrl} alt={item.name} />
                ) : (
                  <ImageIcon size={24} />
                )}
                {selected && (
                  <div className="selected-indicator">
                    <Check size={16} />
                  </div>
                )}
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
