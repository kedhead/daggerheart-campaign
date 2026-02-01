import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAPIKey } from '../../hooks/useAPIKey';
import { Map, Users, FolderOpen, Check, Image as ImageIcon, Youtube, Upload, Link, Play, Loader2, Wand2, Skull } from 'lucide-react';
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

  // Handle quick image upload - uploads to Firebase Storage
  const handleFileSelect = async (e) => {
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

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

        try {
          // Upload to Firebase Storage
          const timestamp = Date.now();
          const storagePath = `campaigns/${campaignId}/display/${timestamp}_${file.name}`;
          const storageRef = ref(storage, storagePath);

          await uploadString(storageRef, dataUrl, 'data_url');
          const downloadUrl = await getDownloadURL(storageRef);

          setUploadedImage({
            url: downloadUrl,
            name: fileName
          });
          setUploading(false);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          alert('Failed to upload image to storage');
          setUploading(false);
        }
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file');
      setUploading(false);
    }
  };

  // Push uploaded image to display
  const handlePushUploadedImage = () => {
    if (!uploadedImage) return;

    onSelectContent('image', {
      url: uploadedImage.url,
      name: uploadedImage.name,
      type: 'uploaded',
      showName: true
    });
  };

  // Generate AI image
  const handleGenerateImage = async () => {
    if (!hasOpenAIKey) {
      setGenerateError('OpenAI API key required');
      return;
    }

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

      // Call DALL-E API
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKeyInfo.key}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: fullPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

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

  // Get NPCs with images
  const npcsWithImages = npcs.filter(npc => npc.avatarUrl);

  // Get locations with images
  const locationsWithImages = locations.filter(loc => loc.imageUrl);

  const tabs = [
    { id: 'maps', label: 'Maps', icon: Map, count: maps.length },
    { id: 'npcs', label: 'NPCs', icon: Users, count: npcsWithImages.length },
    { id: 'locations', label: 'Locations', icon: Map, count: locationsWithImages.length },
    { id: 'files', label: 'Files', icon: FolderOpen, count: files.length },
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
              <Youtube size={16} />
              Play on Display
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

            {!hasOpenAIKey && (
              <div className="generate-warning">
                OpenAI API key required for AI image generation. Add your key in Settings.
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleGenerateImage}
              disabled={generating || !hasOpenAIKey || !generatePrompt.trim()}
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
                  <ImageIcon size={16} />
                  Push to Display
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
                accept="image/*"
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
                  <img src={uploadedImage.url} alt={uploadedImage.name} />
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
