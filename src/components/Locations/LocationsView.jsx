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

export default function LocationsView({ campaign, campaignFrame, locations = [], updateCampaign, addLocation, updateLocation, deleteLocation, isDM, userId, npcs = [], lore = [], sessions = [], timelineEvents = [], encounters = [], notes = [] }) {
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
    <div className="min-h-screen bg-transparent p-6 space-y-10 animate-in fade-in duration-1000">
      {/* Immersive Atlas Header */}
      <div className="flex items-center justify-between gap-8 pb-8 border-b border-white/5 relative">
        <div className="space-y-2 relative z-10">
          <h2 className="font-serif text-4xl font-black text-white/95 tracking-tight italic lowercase">
            The Atlas
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <MapIcon size={10} className="text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{locations.length} Cartographed Sites</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Locations ready</p>
          </div>
        </div>

        {isDM && (
          <div className="flex items-center gap-3">
            <button
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all border border-white/5 hover:border-white/20"
              onClick={() => setQuickGenOpen(true)}
            >
              <Wand2 size={16} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span className="font-black text-[10px] uppercase tracking-widest">AI cartography</span>
            </button>
            <button
              className="group flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-500 shadow-xl border border-indigo-400/20 active:scale-95"
              onClick={handleAdd}
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="font-black text-xs uppercase tracking-[0.3em]">New Sector</span>
            </button>
          </div>
        )}
      </div>

      {/* High-Impact World Map Section */}
      {isDM && (
        <div className="group relative rounded-[3rem] border border-white/5 bg-white/[0.01] backdrop-blur-sm overflow-hidden transition-all duration-700 hover:border-white/10 hover:bg-white/[0.03]">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <MapIcon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/80">World Map</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Global Scan Active</p>
              </div>
            </div>

            {hasKey() && (
              <div className="flex items-center gap-4 bg-black/20 p-2 pl-4 rounded-2xl border border-white/5">
                <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Aesthetic Filter:</span>
                <input
                  type="text"
                  value={customMapStyle || ''}
                  onChange={(e) => setCustomMapStyle(e.target.value)}
                  placeholder="watercolor, detailed..."
                  className="bg-transparent border-none text-[10px] font-bold text-white placeholder:text-white/10 focus:ring-0 w-32"
                />
              </div>
            )}
          </div>

          <div className="aspect-[21/9] w-full relative overflow-hidden bg-black/40">
            {worldMap ? (
              <>
                <img src={worldMap} alt="World Map" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 right-8 flex items-center gap-3">
                  <label className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all cursor-pointer">
                    <Upload size={14} />
                    Replace Atlas
                    <input type="file" accept="image/*" onChange={handleMapUpload} disabled={uploadingMap} className="hidden" />
                  </label>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-white transition-all" onClick={handleRemoveMap}>
                    Decommission
                  </button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 text-white/10 animate-pulse">
                  <MapIcon size={32} />
                </div>
                <h4 className="text-xl font-serif font-black text-white/40 mb-2 italic lowercase text-center">Cartography needed</h4>
                <p className="max-w-xs text-xs text-white/20 font-medium mb-8">Upload a world map to visualize the grand expanse of your campaign setting.</p>
                <label className="px-10 py-4 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl cursor-pointer">
                  {uploadingMap ? 'Processing Scan...' : 'Initiate Map Upload'}
                  <input type="file" accept="image/*" onChange={handleMapUpload} disabled={uploadingMap} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Module */}
      <div className="w-full max-w-2xl mx-auto relative group pt-10">
        <Search size={22} className="absolute left-6 top-[calc(50%+20px)] -translate-y-1/2 text-white/10 group-focus-within:text-indigo-400 transition-all duration-500" />
        <input
          type="text"
          placeholder="Locate coordinates or regional sectors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] py-6 pl-16 pr-8 text-lg font-serif italic focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-white/5 shadow-2xl"
        />
      </div>

      {/* Atlas Grid */}
      {filteredLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-32 rounded-[4rem] border border-white/5 bg-white/[0.01]">
          <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 text-white/[0.03]">
            <MapIcon size={48} />
          </div>
          <h3 className="text-2xl font-serif font-black text-white/30 mb-2 italic lowercase">Unknown Territory</h3>
          <p className="text-sm text-white/20 font-medium tracking-wide">The current search criteria yield no cartographed locations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20 items-start">
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
              entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
            />
          ))}
        </div>
      )}

      {/* Redesigned Modal wrapper for Arcane OS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
        }}
        title={editingLocation ? 'Refine Cartography' : 'New Coordinate Entry'}
        size="large"
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
        campaignFrame={campaignFrame}
        existingContent={locations}
        onSave={async (locationData) => {
          await addLocation(locationData);
          setQuickGenOpen(false);
        }}
      />
    </div>
  );
}
