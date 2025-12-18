import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, MapPin, Map, Loader2 } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './LocationsView.css';

export default function LocationCard({ location, onEdit, onDelete, onGenerateMap, isDM, generatingMapFor, campaign, isEmbedded = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign);
  const isGeneratingMap = generatingMapFor === location.id;

  const getTypeColor = (type) => {
    const typeColors = {
      city: 'location-city',
      town: 'location-town',
      village: 'location-village',
      dungeon: 'location-dungeon',
      wilderness: 'location-wilderness',
      landmark: 'location-landmark',
      other: 'location-other'
    };
    return typeColors[type] || 'location-other';
  };

  return (
    <div className="location-card card">
      <div className="location-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="location-icon">
          <MapPin size={24} />
        </div>
        <div className="location-info">
          <h3>{location.name}</h3>
          {location.type && (
            <span className={`location-type-badge ${getTypeColor(location.type)}`}>
              {location.type}
            </span>
          )}
          {location.region && (
            <p className="location-region">{location.region}</p>
          )}
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="location-details">
          {location.description && (
            <div className="location-section">
              <h4>Description</h4>
              <WikiText
                text={location.description}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {location.notableFeatures && (
            <div className="location-section">
              <h4>Notable Features</h4>
              <WikiText
                text={location.notableFeatures}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {location.inhabitants && (
            <div className="location-section">
              <h4>Inhabitants</h4>
              <WikiText
                text={location.inhabitants}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {location.secrets && (
            <div className="location-section">
              <h4>Secrets</h4>
              <WikiText
                text={location.secrets}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {/* Location Map Section */}
          {(location.mapUrl || location.mapDescription) && (
            <div className="location-section">
              <h4>Location Map</h4>
              <div className="location-map-container">
                {location.mapUrl && (
                  <img src={location.mapUrl} alt={`Map of ${location.name}`} className="location-map-image" />
                )}
                {location.mapDescription && (
                  <p className="map-description">{location.mapDescription}</p>
                )}
              </div>
            </div>
          )}

          {isDM && !isEmbedded && (
            <div className="location-actions">
              <button className="btn btn-secondary" onClick={onEdit}>
                <Edit3 size={16} />
                Edit
              </button>
              {onGenerateMap && (
                <button
                  className="btn btn-secondary"
                  onClick={() => onGenerateMap(location)}
                  disabled={isGeneratingMap}
                >
                  {isGeneratingMap ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Map size={16} />
                      {location.mapUrl ? 'Regenerate Map' : 'Generate Map'}
                    </>
                  )}
                </button>
              )}
              <button className="btn btn-danger" onClick={onDelete}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Entity viewer modal for wiki links */}
      {viewingEntity && (
        <EntityViewer
          entity={viewingEntity}
          isOpen={!!viewingEntity}
          onClose={() => setViewingEntity(null)}
          isDM={isDM}
          campaign={campaign}
        />
      )}
    </div>
  );
}
