import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useEscapeKey } from '../hooks/useKeyboardShortcut';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-5xl',
    'full': 'max-w-[95vw]'
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#060814]/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`
          relative w-full ${sizeClasses[size] || sizeClasses.medium} 
          bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)]
          flex flex-col overflow-hidden animate-in zoom-in-95 duration-500
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative flex items-center justify-between px-10 py-8 border-b border-white/5">
          <div className="space-y-1">
            <h2 className="font-serif text-3xl font-black text-white/95 italic lowercase tracking-tight">
              {title}
            </h2>
            <div className="h-0.5 w-12 bg-indigo-500/40 rounded-full" />
          </div>
          <button
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/40 hover:text-white transition-all group"
            onClick={onClose}
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto p-10 custom-scrollbar max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
