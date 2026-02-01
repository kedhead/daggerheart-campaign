import { useState, useEffect } from 'react';
import { Image as ImageIcon, Youtube } from 'lucide-react';
import './PlayerDisplay.css';

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url) {
  if (!url) return null;

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export default function ContentDisplay({ contentType, content }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [prevUrl, setPrevUrl] = useState(null);

  // Handle fade transitions when content changes
  useEffect(() => {
    if (content?.url !== prevUrl) {
      setIsLoaded(false);
      setPrevUrl(content?.url);
      // For videos, mark as loaded immediately since iframe handles its own loading
      if (contentType === 'video') {
        setTimeout(() => setIsLoaded(true), 100);
      }
    }
  }, [content?.url, prevUrl, contentType]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  if (!contentType || contentType === 'none' || !content) {
    return (
      <div className="content-display empty">
        <ImageIcon size={120} strokeWidth={1} />
        <p>No content to display</p>
      </div>
    );
  }

  // YouTube video display
  if (contentType === 'video') {
    const videoId = getYouTubeVideoId(content.url);

    if (!videoId) {
      return (
        <div className="content-display empty">
          <Youtube size={120} strokeWidth={1} />
          <p>Invalid YouTube URL</p>
        </div>
      );
    }

    return (
      <div className={`content-display video ${isLoaded ? 'loaded' : 'loading'}`}>
        <div className="video-container">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={content.name || 'YouTube video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {content.showName && content.name && (
          <div className="content-caption">
            <h2>{content.name}</h2>
          </div>
        )}
      </div>
    );
  }

  // Image display (default)
  return (
    <div className={`content-display ${isLoaded ? 'loaded' : 'loading'}`}>
      {content.url && (
        <img
          src={content.url}
          alt={content.name || 'Display content'}
          onLoad={handleImageLoad}
          className="content-image"
        />
      )}
      {content.showName && content.name && (
        <div className="content-caption">
          <h2>{content.name}</h2>
        </div>
      )}
    </div>
  );
}
