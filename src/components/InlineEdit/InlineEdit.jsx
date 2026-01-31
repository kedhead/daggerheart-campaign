import { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import './InlineEdit.css';

/**
 * Reusable inline text editor component
 * @param {string} value - Current value to display/edit
 * @param {Function} onSave - Callback when value is saved (async supported)
 * @param {boolean} disabled - Whether editing is disabled
 * @param {string} placeholder - Placeholder when value is empty
 * @param {string} className - Additional CSS classes
 * @param {string} as - Element type for display ('h3', 'span', 'p', etc.)
 * @param {boolean} showEditIcon - Show pencil icon on hover
 */
export default function InlineEdit({
  value,
  onSave,
  disabled = false,
  placeholder = 'Click to edit',
  className = '',
  as: Element = 'span',
  showEditIcon = true,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  // Sync edit value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Cancel on Escape
  useEscapeKey(() => {
    if (isEditing) {
      handleCancel();
    }
  }, isEditing);

  const handleStartEdit = () => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    // Don't save if value hasn't changed
    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    // Don't save empty values
    if (!trimmedValue) {
      handleCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // Keep editing mode open on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className={`inline-edit editing ${className}`}>
        <input
          ref={inputRef}
          type="text"
          className="inline-edit-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          placeholder={placeholder}
        />
        <div className="inline-edit-actions">
          <button
            type="button"
            className="inline-edit-btn save"
            onClick={handleSave}
            disabled={isSaving}
            aria-label="Save"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            className="inline-edit-btn cancel"
            onClick={handleCancel}
            disabled={isSaving}
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-edit ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleStartEdit}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
    >
      <Element className="inline-edit-value">
        {value || <span className="inline-edit-placeholder">{placeholder}</span>}
      </Element>
      {showEditIcon && !disabled && (
        <Pencil size={14} className="inline-edit-icon" />
      )}
    </div>
  );
}
