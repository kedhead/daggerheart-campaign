import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MediaLightbox({ items, index, onClose, onNavigate }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onNavigate]);

  if (!items || items.length === 0) return null;
  const item = items[index];
  if (!item) return null;

  const content = (() => {
    if (item.kind === 'video') return <video src={item.url} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '85vh' }} />;
    if (item.kind === 'audio') return <audio src={item.url} controls autoPlay style={{ width: 'min(640px, 90vw)' }} />;
    return <img src={item.url} alt={item.caption || ''} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }} />;
  })();

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
      >
        <X size={22} />
      </button>
      {items.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-3">
        {content}
        {item.caption && (
          <p className="text-sm text-white/70 max-w-2xl text-center px-4">{item.caption}</p>
        )}
      </div>
    </div>,
    document.body
  );
}
