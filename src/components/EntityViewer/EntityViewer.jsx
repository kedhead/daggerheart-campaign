import Modal from '../Modal';
import './EntityViewer.css';

// Import card components - we'll import them dynamically as we integrate
// For now, this is a placeholder that will be updated during integration

/**
 * Universal entity viewer that displays any entity type in a modal
 * Used when clicking wiki links
 *
 * @param {Object} entity - Entity object with type and data
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close modal callback
 * @param {boolean} isDM - Whether current user is DM
 * @param {Object} campaign - Campaign object (needed for nested wiki links)
 */
export default function EntityViewer({ entity, isOpen, onClose, isDM, campaign }) {
  if (!entity) return null;

  const renderEntityContent = () => {
    // For now, render basic entity information
    // We'll update this to use actual card components during integration
    return (
      <div className="entity-viewer-content">
        <div className="entity-viewer-section">
          <h4>Type</h4>
          <p>{entity.subtitle}</p>
        </div>

        <div className="entity-viewer-section">
          <h4>Name</h4>
          <p>{entity.displayName}</p>
        </div>

        {entity.data.description && (
          <div className="entity-viewer-section">
            <h4>Description</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{entity.data.description}</p>
          </div>
        )}

        {entity.data.content && (
          <div className="entity-viewer-section">
            <h4>Content</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{entity.data.content}</p>
          </div>
        )}

        {entity.data.summary && (
          <div className="entity-viewer-section">
            <h4>Summary</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{entity.data.summary}</p>
          </div>
        )}

        {entity.data.notes && (
          <div className="entity-viewer-section">
            <h4>Notes</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{entity.data.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entity.displayName}
      size="medium"
    >
      <div className="entity-viewer">
        <div className="entity-viewer-type-badge">
          {entity.subtitle}
        </div>
        {renderEntityContent()}
      </div>
    </Modal>
  );
}
