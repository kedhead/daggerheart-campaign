import { Fragment } from 'react';
import './WikiText.css';

/**
 * Parses text for [[Entity Name]] wiki links and renders them as clickable elements
 *
 * @param {string} text - Raw text with potential [[links]]
 * @param {function} onLinkClick - Callback when link is clicked (entity) => void
 * @param {function} getEntity - Function to resolve entity name to entity object
 */
export default function WikiText({ text, onLinkClick, getEntity }) {
  if (!text) return null;

  // Regex to match [[Entity Name]]
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  // Parse text and extract links
  while ((match = wikiLinkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Add the link
    const entityName = match[1];
    const entity = getEntity ? getEntity(entityName) : null;

    parts.push({
      type: 'link',
      entityName,
      entity,
      exists: !!entity
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  // If no links found, return plain text
  if (parts.length === 0) {
    return <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>;
  }

  return (
    <p style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <Fragment key={index}>{part.content}</Fragment>;
        } else {
          // Link rendering
          if (part.exists && onLinkClick) {
            return (
              <span
                key={index}
                className="wiki-link wiki-link-exists"
                onClick={() => onLinkClick(part.entity)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onLinkClick(part.entity);
                  }
                }}
                title={`Open ${part.entity.displayName} (${part.entity.subtitle})`}
                role="button"
                tabIndex={0}
              >
                {part.entityName}
              </span>
            );
          } else {
            // Broken link (entity not found)
            return (
              <span
                key={index}
                className="wiki-link wiki-link-broken"
                title="Entity not found"
              >
                {part.entityName}
              </span>
            );
          }
        }
      })}
    </p>
  );
}
