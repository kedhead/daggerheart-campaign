import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { EXTERNAL_TOOLS, CLASSES, ANCESTRIES, COMMUNITIES } from '../../data/daggerheart';
import Modal from '../Modal';
import './ToolsView.css';

const ICON_MAP = {
  sword: '⚔️',
  sparkles: '✨',
  'user-circle': '👤',
  home: '🏠',
  'book-open': '📖'
};

export default function ToolsView() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);

  const openModal = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalType(null);
  };

  return (
    <div className="tools-view">
      <div className="view-header">
        <div>
          <h2>Tools & Reference</h2>
          <p className="view-subtitle">External resources and quick reference guides</p>
        </div>
      </div>

      <div className="tools-section">
        <h3>External Tools</h3>
        <div className="external-tools-grid">
          {EXTERNAL_TOOLS.map((tool, index) => (
            <a
              key={index}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tool-card card"
            >
              <span className="tool-icon">{ICON_MAP[tool.icon] || '🔗'}</span>
              <div className="tool-content">
                <h4>{tool.name}</h4>
                <p>{tool.description}</p>
              </div>
              <ExternalLink size={20} className="external-icon" />
            </a>
          ))}
        </div>
      </div>

      <div className="reference-grid">
        <div className="tools-section">
          <h3>Classes & Domains</h3>
          <div className="reference-list">
            {Object.entries(CLASSES).map(([className, data]) => (
              <div
                key={className}
                className="reference-item card clickable"
                onClick={() => openModal({ name: className, ...data }, 'class')}
              >
                <h4>{className}</h4>
                <div className="domains-list">
                  {data.domains.map(domain => (
                    <span key={domain} className="badge">{domain}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tools-section">
          <h3>Ancestries</h3>
          <div className="reference-tags">
            {Object.entries(ANCESTRIES).map(([name, description]) => (
              <span
                key={name}
                className="badge badge-hope clickable"
                onClick={() => openModal({ name, description }, 'ancestry')}
              >
                {name}
              </span>
            ))}
          </div>

          <h3 style={{marginTop: '2rem'}}>Communities</h3>
          <div className="reference-tags">
            {Object.entries(COMMUNITIES).map(([name, description]) => (
              <span
                key={name}
                className="badge badge-fear clickable"
                onClick={() => openModal({ name, description }, 'community')}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for showing details */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={closeModal}
          title={selectedItem.name}
          size="medium"
        >
          <div className="reference-modal-content">
            {modalType === 'class' && (
              <>
                <p className="modal-description">{selectedItem.description}</p>
                <div className="modal-section">
                  <h4>Key Features</h4>
                  <p>{selectedItem.features}</p>
                </div>
                <div className="modal-section">
                  <h4>Available Domains</h4>
                  <div className="domains-list">
                    {selectedItem.domains.map(domain => (
                      <span key={domain} className="badge">{domain}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {(modalType === 'ancestry' || modalType === 'community') && (
              <p className="modal-description">{selectedItem.description}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
