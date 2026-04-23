import { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Film, Mic, X } from 'lucide-react';

export default function MediaUploader({ chapter, storybook }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [pendingFile, setPendingFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      await storybook.uploadMedia(chapter.id, pendingFile, caption);
      setPendingFile(null);
      setCaption('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (mediaId) => {
    if (!window.confirm('Remove this media item?')) return;
    await storybook.removeMedia(chapter.id, mediaId);
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
          borderColor: 'var(--line)'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleFileChange}
          className="hidden"
          id="storybook-media-input"
        />
        <label
          htmlFor="storybook-media-input"
          className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer text-white/60 hover:text-white hover:border-white/30 transition"
          style={{ borderColor: 'var(--line-strong)' }}
        >
          <Upload size={18} />
          <span className="text-sm font-semibold">
            {pendingFile ? pendingFile.name : 'Choose image, video, or audio'}
          </span>
        </label>

        {pendingFile && (
          <>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption"
              className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setPendingFile(null); setCaption(''); }}
                className="px-3 py-2 rounded-lg text-white/60 text-sm hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-40"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 25%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)'
                }}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </>
        )}
      </div>

      {(chapter.media || []).length > 0 && (
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(chapter.media || []).map(m => (
            <li
              key={m.id}
              className="relative rounded-xl overflow-hidden border"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--line)',
                aspectRatio: '1'
              }}
            >
              {m.kind === 'image' && <img src={m.url} alt={m.caption || ''} className="w-full h-full object-cover" />}
              {m.kind === 'video' && (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <Film size={32} className="text-white/40" />
                </div>
              )}
              {m.kind === 'audio' && (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--surface-hi)' }}>
                  <Mic size={32} className="text-white/40" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white/80 hover:bg-red-500/80 hover:text-white"
                aria-label="Remove"
              >
                <X size={14} />
              </button>
              {m.caption && (
                <div className="absolute bottom-0 inset-x-0 px-2 py-1 text-[11px] text-white bg-gradient-to-t from-black/80 to-transparent">
                  {m.caption}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
