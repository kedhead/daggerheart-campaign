import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDialogFocus } from '../hooks/useDialogFocus';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
  const id = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dialogRef = useRef(null);
  const titleId = `${id}-title`;
  // Focus, Tab and Escape — only the topmost dialog responds (see useDialogFocus).
  useDialogFocus(dialogRef, isOpen, () => onCloseRef.current?.());

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-5xl',
    'full': 'max-w-[95vw]',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9400] flex items-center justify-center p-4 sm:p-6 lr-fade-in"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background: 'color-mix(in srgb, var(--bg) 78%, transparent)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      />

      {/* Modal Content */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${sizeClasses[size] || sizeClasses.medium} flex flex-col overflow-hidden rounded-2xl lr-modal-shell`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
          border: '1px solid var(--line-strong)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px color-mix(in srgb, var(--primary) 10%, transparent)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        {/* Decorative top glow */}
        <div
          className="absolute -top-20 left-10 w-72 h-72 pointer-events-none"
          style={{
            background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
            filter: 'blur(100px)',
            borderRadius: '50%',
          }}
        />

        <div
          className="relative flex items-center justify-between px-6 sm:px-8 py-5"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <div className="space-y-1.5">
            <h2
              id={titleId}
              className="text-xl sm:text-2xl"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: 'var(--text)',
                letterSpacing: '-0.015em',
              }}
            >
              {title}
            </h2>
            <div
              className="h-[2px] w-10 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
          </div>
          <button
            type="button"
            aria-label="Close"
            className="p-2 rounded-xl transition-all"
            onClick={onClose}
            style={{
              background: 'var(--surface-hi)',
              border: '1px solid var(--line-strong)',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 12%, var(--surface-hi))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'var(--surface-hi)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
