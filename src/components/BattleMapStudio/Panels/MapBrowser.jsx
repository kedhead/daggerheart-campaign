import { Map, Trash2, FolderOpen } from 'lucide-react';

export default function MapBrowser({
  maps,
  loading,
  currentMapId,
  onLoadMap,
  onDeleteMap
}) {
  if (loading) {
    return (
      <div className="map-browser">
        <div className="map-browser-empty">
          <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }}></div>
          <p>Loading maps...</p>
        </div>
      </div>
    );
  }

  if (maps.length === 0) {
    return (
      <div className="map-browser">
        <div className="map-browser-empty">
          <Map size={32} />
          <p>No saved maps yet</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Import a map and save it to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-browser">
      {maps.map(map => (
        <div
          key={map.id}
          className={`map-browser-item ${map.id === currentMapId ? 'current' : ''}`}
          onClick={() => onLoadMap(map.id)}
        >
          {map.mapImage?.url ? (
            <img
              src={map.mapImage.url}
              alt={map.mapName}
              className="map-thumb"
            />
          ) : (
            <div className="map-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Map size={20} color="var(--text-muted)" />
            </div>
          )}
          <div className="map-info">
            <h5>{map.mapName || 'Untitled Map'}</h5>
            <p>
              {map.updatedAt?.toDate?.()?.toLocaleDateString() ||
               map.createdAt?.toDate?.()?.toLocaleDateString() ||
               'No date'}
            </p>
          </div>
          <div className="map-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadMap(map.id);
              }}
              title="Open map"
            >
              <FolderOpen size={16} />
            </button>
            <button
              className="delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMap(map.id);
              }}
              title="Delete map"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
