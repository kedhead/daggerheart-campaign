import { useState, useEffect } from 'react';
import { Image as ImageIcon, Youtube, Film } from 'lucide-react';
import './PlayerDisplay.css';

// Extract YouTube video ID from various URL formats
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

// Single grid item component
function GridItem({ item, showNames }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    if (item.type === 'video' || item.type === 'localvideo') {
      setTimeout(() => setIsLoaded(true), 100);
    }
  }, [item.url, item.type]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // YouTube video
  if (item.type === 'video') {
    const videoId = getYouTubeVideoId(item.url);

    if (!videoId) {
      return (
        <div className="grid-item empty">
          <Youtube size={48} strokeWidth={1} />
        </div>
      );
    }

    return (
      <div className={`grid-item video ${isLoaded ? 'loaded' : 'loading'}`}>
        <div className="grid-video-container">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
            title={item.name || 'YouTube video'}
            frameBorder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {showNames && item.name && (
          <div className="grid-item-caption">{item.name}</div>
        )}
      </div>
    );
  }

  // Locally uploaded video
  if (item.type === 'localvideo') {
    return (
      <div className={`grid-item video ${isLoaded ? 'loaded' : 'loading'}`}>
        <div className="grid-video-container">
          {item.url ? (
            <video
              src={item.url}
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setIsLoaded(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <Film size={48} strokeWidth={1} />
          )}
        </div>
        {showNames && item.name && (
          <div className="grid-item-caption">{item.name}</div>
        )}
      </div>
    );
  }

  // Image (default)
  return (
    <div className={`grid-item ${isLoaded ? 'loaded' : 'loading'}`}>
      {item.url && (
        <img
          src={item.url}
          alt={item.name || 'Display content'}
          onLoad={handleImageLoad}
          className="grid-item-image"
        />
      )}
      {showNames && item.name && (
        <div className="grid-item-caption">{item.name}</div>
      )}
    </div>
  );
}

export default function ContentGrid({ items, showNames = false }) {
  if (!items || items.length === 0) {
    return (
      <div className="content-display empty">
        <ImageIcon size={120} strokeWidth={1} />
        <p>No content to display</p>
      </div>
    );
  }

  // Calculate grid layout class based on item count
  const getGridClass = (count) => {
    if (count === 1) return 'grid-1';
    if (count === 2) return 'grid-2';
    if (count === 3) return 'grid-3';
    if (count === 4) return 'grid-4';
    if (count <= 6) return 'grid-6';
    if (count <= 9) return 'grid-9';
    return 'grid-many';
  };

  return (
    <div className={`content-grid ${getGridClass(items.length)}`}>
      {items.map(item => (
        <GridItem key={item.id} item={item} showNames={showNames} />
      ))}
    </div>
  );
}
