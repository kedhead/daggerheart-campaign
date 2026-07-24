import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase';

export default function AssetUploader({ campaignId, onUpload, onCancel }) {
  const [name, setName] = useState('');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError('');
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !preview || uploading) return;

    if (!campaignId) {
      setError('No campaign selected — cannot save this token.');
      return;
    }

    // The preview is a blob: URL, which dies with this document. Upload the file
    // so the token survives a reload and renders on the display window.
    setUploading(true);
    setError('');
    try {
      const storagePath = `campaigns/${campaignId}/battleMaps/token_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      URL.revokeObjectURL(preview);

      onUpload({
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || 'Custom Token',
        url,
        storagePath
      });
    } catch (err) {
      console.error('Error uploading token:', err);
      setError('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="uploader-form">
      {!preview ? (
        <div
          className="uploader-dropzone"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} />
          <span>Select Image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <>
          <div className="uploader-preview">
            <img src={preview} alt="Preview" />
            <button
              type="button"
              className="uploader-preview-remove"
              onClick={() => {
                setPreview(null);
                setFile(null);
              }}
            >
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Token name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="uploader-name-input"
          />
          {error && <p className="uploader-error">{error}</p>}
          <div className="uploader-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <Loader2 size={14} className="uploader-spin" /> : 'Add'}
            </button>
          </div>
        </>
      )}

      <style>{`
        .uploader-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .uploader-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1.5rem;
          border: 1px dashed var(--border);
          border-radius: 6px;
          background: var(--bg-tertiary);
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .uploader-dropzone:hover {
          border-color: var(--fear-color);
          color: var(--text-primary);
        }
        .uploader-preview {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }
        .uploader-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
        }
        .uploader-preview-remove {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--danger);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .uploader-name-input {
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
        }
        .uploader-name-input:focus {
          outline: none;
          border-color: var(--fear-color);
        }
        .uploader-error {
          margin: 0;
          font-size: 0.75rem;
          color: var(--danger);
        }
        .uploader-spin {
          animation: uploader-spin 1s linear infinite;
        }
        @keyframes uploader-spin {
          to { transform: rotate(360deg); }
        }
        .uploader-actions {
          display: flex;
          gap: 0.5rem;
        }
        .uploader-actions .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .uploader-actions .btn {
          flex: 1;
          padding: 0.4rem;
          font-size: 0.85rem;
        }
      `}</style>
    </form>
  );
}
