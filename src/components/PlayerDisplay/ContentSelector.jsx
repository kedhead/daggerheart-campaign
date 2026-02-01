import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Map, Users, FolderOpen, X, Check, Image as ImageIcon } from 'lucide-react';
import './DMDisplayControl.css';

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

  // Get NPCs with images
  const npcsWithImages = npcs.filter(npc => npc.avatarUrl);

  // Get locations with images
  const locationsWithImages = locations.filter(loc => loc.imageUrl);

  const tabs = [
    { id: 'maps', label: 'Maps', icon: Map, count: maps.length },
    { id: 'npcs', label: 'NPCs', icon: Users, count: npcsWithImages.length },
    { id: 'locations', label: 'Locations', icon: Map, count: locationsWithImages.length },
    { id: 'files', label: 'Files', icon: FolderOpen, count: files.length }
  ];

  const renderContent = () => {
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
              <span className="tab-count">{tab.count}</span>
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
