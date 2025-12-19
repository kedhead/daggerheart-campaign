import { useState } from 'react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { Plus, Search, Map as MapIcon, Upload, Wand2 } from 'lucide-react';
import LocationCard from './LocationCard';
import LocationForm from './LocationForm';
import Modal from '../Modal';
import QuickGeneratorModal from '../CampaignBuilder/QuickGeneratorModal';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateMap } from '../../services/mapGenerator';
import './LocationsView.css';

export default function LocationsView({ campaign, locations = [], updateCampaign, addLocation, updateLocation, deleteLocation, isDM, userId, npcs = [], lore = [], sessions = [], timelineEvents = [], encounters = [], notes = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingMap, setUploadingMap] = useState(false);
  const [quickGenOpen, setQuickGenOpen] = useState(false);
  const [generatingMapFor, setGeneratingMapFor] = useState(null);
  const [customMapStyle, setCustomMapStyle] = useState('');
  const { hasKey, keys } = useAPIKey(userId);
  const worldMap = campaign?.worldMap || null;

  const handleAdd = () => {
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleSave = async (locationData) => {
    if (editingLocation) {
      await updateLocation(editingLocation.id, locationData);
    } else {
      await addLocation(locationData);
    }
    setIsModalOpen(false);
    setEditingLocation(null);
  };

  const handleDelete = async (locationId) => {
    if (confirm('Are you sure you want to delete this location?')) {
      await deleteLocation(locationId);
    }
  };

  const handleMapUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Firebase Storage supports much larger files (up to 5GB)
      // But we'll keep a reasonable limit for map images
      if (file.size > 10 * 1024 * 1024) {
        alert('Map image size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setUploadingMap(true);

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64String = e.target.result;

          try {
            console.log('Uploading world map to Firebase Storage...');
            const timestamp = Date.now();
            const imagePath = `campaigns/${campaign.id}/maps/world-map-${timestamp}.${file.name.split('.').pop()}`;
            const imageRef = ref(storage, imagePath);

            // Upload base64 image to Storage
            await uploadString(imageRef, base64String, 'data_url');

            // Get the download URL
            const imageDownloadUrl = await getDownloadURL(imageRef);
            console.log('World map uploaded successfully:', imageDownloadUrl);

            // Save the Storage URL (not base64) to Firestore
            await updateCampaign({ worldMap: imageDownloadUrl });
            setUploadingMap(false);
          } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload map to Firebase Storage');
            setUploadingMap(false);
          }
        };
        reader.onerror = () => {
          alert('Failed to read file');
          setUploadingMap(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading map:', error);
        alert('Failed to upload map');
        setUploadingMap(false);
      }
    }
  };

  const handleRemoveMap = async () => {
    if (confirm('Are you sure you want to remove the world map?')) {
      await updateCampaign({ worldMap: null });
    }
  };

  const handleGenerateLocationMap = async (location) => {
    if (!hasKey()) {
      alert('Please add an API key in Settings to use AI map generation.');
      return;
    }

    setGeneratingMapFor(location.id);

    try {
      console.log(`Generating map for location: ${location.name}`);

      const apiKey = hasKey('anthropic') ? keys.anthropic : (hasKey('openai') ? keys.openai : null);
      const provider = hasKey('anthropic') ? 'anthropic' : 'openai';
      const openaiKey = hasKey('openai') ? keys.openai : null;

      // Determine map type based on location type
      const mapType = ['city', 'town', 'village'].includes(location.type) ? 'local' : 'regional';

      const mapData = await generateMap(
        {
          campaign,
          locations: locations.filter(loc => loc.id !== location.id), // Other nearby locations
          mapType: mapType,
          specificLocation: location,
          mapName: `${location.name} Map`,
          customStyle: customMapStyle || null
        },
        apiKey,
        provider,
        openaiKey,
        !!openaiKey // Generate image if we have OpenAI key
      );

      console.log('Map generated:', mapData);

      // Save map to location
      await updateLocation(location.id, {
        mapUrl: mapData.imageUrl,
        mapDescription: mapData.description,
        mapType: mapData.type
      });

      console.log('Map saved to location');
    } catch (error) {
      console.error('Error generating location map:', error);
      alert(`Failed to generate map: ${error.message}`);
    } finally {
      setGeneratingMapFor(null);
    }
  };

  // Filter locations
  const filteredLocations = locations.filter(location => {
    // Visibility filter
    if (!isDM && location.hidden) return false;

    return location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           location.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           location.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="locations-view">
      <div className="view-header">
        <div>
          <h2>Locations & Map</h2>
          <p className="view-subtitle">{locations.length} location{locations.length !== 1 ? 's' : ''} in your world</p>
        </div>
        {isDM && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setQuickGenOpen(true)}>
              <Wand2 size={20} />
              Generate with AI
            </button>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={20} />
              Add Location
            </button>
          </div>
        )}
      </div>

      {/* World Map Section */}
      {isDM && (
        <div className="world-map-section card">
          <h3>
            <MapIcon size={20} />
            World Map
          </h3>

          {/* Custom Map Style Input */}
          {hasKey() && (
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label>Custom Map Style Keywords (Optional)</label>
              <input
                type="text"
                value={customMapStyle}
                onChange={(e) => setCustomMapStyle(e.target.value)}
                placeholder="e.g., watercolor, vintage, minimalist, detailed..."
                className="style-keywords-input"
              />
              <small className="form-hint">
                Add custom keywords to influence the AI-generated map style. Leave blank to use default system style.
              </small>
            </div>
          )}

          {worldMap ? (
            <div className="world-map-container">
              <img src={worldMap} alt="World Map" className="world-map-image" />
              <div className="map-actions">
                <label className="btn btn-secondary">
                  <Upload size={16} />
                  Replace Map
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMapUpload}
                    disabled={uploadingMap}
                    style={{ display: 'none' }}
                  />
                </label>
                <button className="btn btn-danger" onClick={handleRemoveMap}>
                  Remove Map
                </button>
              </div>
            </div>
          ) : (
            <div className="world-map-upload">
              <MapIcon size={48} />
              <p>Upload a world map to visualize your campaign setting</p>
              <label className="btn btn-primary">
                {uploadingMap ? 'Uploading...' : 'Upload World Map'}
                <Upload size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMapUpload}
                  disabled={uploadingMap}
                  style={{ display: 'none' }}
                />
              </label>
              <small className="form-hint">Max 5MB, PNG or JPG recommended</small>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="locations-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search locations by name, type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Locations Grid */}
      {filteredLocations.length === 0 ? (
        <div className="empty-state card">
          {searchTerm ? (
            <p>No locations match your search</p>
          ) : (
            <>
              <MapIcon size={64} />
              <p>No locations yet</p>
              {isDM && (
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Plus size={20} />
                  Add Your First Location
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="locations-grid">
          {filteredLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={() => handleEdit(location)}
              onDelete={() => handleDelete(location.id)}
              onGenerateMap={isDM ? handleGenerateLocationMap : null}
              generatingMapFor={generatingMapFor}
              isDM={isDM}
              campaign={campaign}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
        }}
        title={editingLocation ? 'Edit Location' : 'Add Location'}
        size="medium"
      >
        <LocationForm
          location={editingLocation}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingLocation(null);
          }}
          campaign={campaign}
          entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
          isDM={isDM}
        />
      </Modal>

      {/* Quick Generator Modal */}
      <QuickGeneratorModal
        isOpen={quickGenOpen}
        onClose={() => setQuickGenOpen(false)}
        type="location"
        campaign={campaign}
        campaignFrame={campaign?.campaignFrame}
        existingContent={locations}
        onSave={async (locationData) => {
          await addLocation(locationData);
          setQuickGenOpen(false);
        }}
      />
    </div>
  );
}
