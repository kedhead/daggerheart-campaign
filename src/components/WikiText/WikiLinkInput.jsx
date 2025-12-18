import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import './WikiLinkInput.css';

/**
 * Textarea with wiki link autocomplete
 * Shows dropdown when user types [[
 *
 * @param {string} value - Current textarea value
 * @param {function} onChange - Change handler (receives event)
 * @param {function} searchEntities - Function to search entities by query
 * @param {string} placeholder - Placeholder text
 * @param {number} rows - Number of rows for textarea
 */
export default function WikiLinkInput({ value, onChange, searchEntities, placeholder, rows = 6 }) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Detect [[ typing and show autocomplete
  useEffect(() => {
    console.log('[WikiLinkInput] useEffect triggered', {
      hasValue: !!value,
      hasSearchEntities: !!searchEntities,
      valueLength: value?.length
    });

    if (!value || !searchEntities) {
      console.log('[WikiLinkInput] Missing value or searchEntities, hiding autocomplete');
      setShowAutocomplete(false);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      console.log('[WikiLinkInput] No textarea ref');
      return;
    }

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);

    // Check if we're inside an incomplete [[
    const lastOpenBracket = textBeforeCursor.lastIndexOf('[[');
    const lastCloseBracket = textBeforeCursor.lastIndexOf(']]');

    console.log('[WikiLinkInput] Bracket check', {
      lastOpenBracket,
      lastCloseBracket,
      textBeforeCursor
    });

    if (lastOpenBracket > lastCloseBracket && lastOpenBracket !== -1) {
      // We're typing inside [[
      const searchQuery = textBeforeCursor.substring(lastOpenBracket + 2);
      console.log('[WikiLinkInput] Inside [[, searching for:', searchQuery);

      if (searchQuery.length >= 0) {
        const results = searchEntities(searchQuery);
        console.log('[WikiLinkInput] Search results:', results);
        setAutocompleteResults(results);
        setSelectedIndex(0);

        if (results.length > 0) {
          // Calculate position for dropdown
          const rect = textarea.getBoundingClientRect();
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const lineHeight = 24; // Approximate line height

          setAutocompletePosition({
            top: rect.top + (currentLine * lineHeight) + lineHeight + 5,
            left: rect.left + 10
          });

          console.log('[WikiLinkInput] Showing autocomplete with', results.length, 'results');
          setShowAutocomplete(true);
        } else {
          console.log('[WikiLinkInput] No results, hiding autocomplete');
          setShowAutocomplete(false);
        }
      }
    } else {
      setShowAutocomplete(false);
    }
  }, [value, searchEntities]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showAutocomplete || autocompleteResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < autocompleteResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : autocompleteResults.length - 1
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (autocompleteResults.length > 0) {
        e.preventDefault();
        insertLink(autocompleteResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  // Insert selected entity link
  const insertLink = (entity) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);

    // Find the [[ position
    const lastOpenBracket = textBeforeCursor.lastIndexOf('[[');

    // Build new text with completed link
    const newText =
      value.substring(0, lastOpenBracket) +
      `[[${entity.name}]]` +
      textAfterCursor;

    onChange({ target: { value: newText } });
    setShowAutocomplete(false);

    // Set cursor after the inserted link
    setTimeout(() => {
      const newCursorPos = lastOpenBracket + entity.name.length + 4;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  return (
    <div className="wiki-link-input-wrapper">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="wiki-link-textarea"
      />

      {showAutocomplete && autocompleteResults.length > 0 && (
        <div
          ref={autocompleteRef}
          className="wiki-autocomplete-dropdown"
          style={{
            position: 'fixed',
            top: `${autocompletePosition.top}px`,
            left: `${autocompletePosition.left}px`
          }}
        >
          <div className="autocomplete-header">
            <Search size={14} />
            <span>Select entity to link</span>
          </div>
          <div className="autocomplete-results">
            {autocompleteResults.map((entity, index) => (
              <button
                key={`${entity.type}-${entity.id}`}
                className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => insertLink(entity)}
                onMouseEnter={() => setSelectedIndex(index)}
                type="button"
              >
                <div className="autocomplete-item-name">{entity.displayName}</div>
                <div className="autocomplete-item-subtitle">{entity.subtitle}</div>
              </button>
            ))}
          </div>
          <div className="autocomplete-footer">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      )}
    </div>
  );
}
