import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

export default function MapImporter() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const { setMapImage } = useBattleMapStore();

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setIsLoading(true);

    try {
      // Create object URL for the image
      const url = URL.createObjectURL(file);

      // Get image dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      setMapImage({
        url,
        width: img.width,
        height: img.height,
        name: file.name
      });
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Failed to load image');
    } finally {
      setIsLoading(false);
    }
  }, [setMapImage]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  return (
    <div className="map-importer">
      <div
        className={`import-dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {isLoading ? (
          <>
            <div className="loading-spinner" style={{ width: 48, height: 48 }}></div>
            <p>Loading map...</p>
          </>
        ) : (
          <>
            <Upload size={48} />
            <h3>Drop your map here</h3>
            <p>or click to browse</p>
            <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
              Supports PNG, JPG, WebP
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
