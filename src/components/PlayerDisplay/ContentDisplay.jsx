import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import './PlayerDisplay.css';

export default function ContentDisplay({ contentType, content }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [prevUrl, setPrevUrl] = useState(null);

  // Handle fade transitions when content changes
  useEffect(() => {
    if (content?.url !== prevUrl) {
      setIsLoaded(false);
      setPrevUrl(content?.url);
    }
  }, [content?.url, prevUrl]);

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
