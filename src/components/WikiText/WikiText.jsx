import { Fragment } from 'react';
import './WikiText.css';
import { inlineMarkdown } from './inlineMarkdown';

/**
 * Parses text for [[Entity Name]] wiki links and renders them as clickable elements
 *
 * @param {string} text - Raw text with potential [[links]]
 * @param {function} onLinkClick - Callback when link is clicked (entity) => void
 * @param {function} getEntity - Function to resolve entity name to entity object
 */
export default function WikiText({ text, onLinkClick, getEntity }) {
  if (!text) return null;

  // Markdown first (bold, italics, headings), then [[links]] inside each
  // piece, so "**[[Bubbles]]**" is a bold link rather than stray asterisks.
  return (
    <p style={{ whiteSpace: 'pre-wrap' }}>
      {inlineMarkdown(text).map((token, i) => {
        const inner = renderLinks(token.content, `${i}`, onLinkClick, getEntity);
        if (token.type === 'bold') return <strong key={i} className="wiki-bold">{inner}</strong>;
        if (token.type === 'italic') return <em key={i}>{inner}</em>;
        if (token.type === 'heading') return <strong key={i} className="wiki-heading">{inner}</strong>;
        return <Fragment key={i}>{inner}</Fragment>;
      })}
    </p>
  );
}

/** Plain text with its [[Entity Name]] wiki links made clickable. */
function renderLinks(text, keyBase, onLinkClick, getEntity) {
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

  return parts.map((part, idx) => {
    const index = `${keyBase}-${idx}`;
    if (part.type === 'text') {
      return <Fragment key={index}>{part.content}</Fragment>;
    }
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
    }
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
  });
}
