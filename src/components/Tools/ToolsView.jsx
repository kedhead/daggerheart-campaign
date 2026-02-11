import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { getGameSystem } from '../../data/systems/index.js';
import Modal from '../Modal';
// import './ToolsView.css';

const ICON_MAP = {
  sword: '⚔️',
  sparkles: '✨',
  'user-circle': '👤',
  home: '🏠',
  'book-open': '📖'
};

export default function ToolsView({ campaign }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);

  // Get game system data
  const gameSystem = getGameSystem(campaign?.gameSystem);
  const externalTools = gameSystem?.externalTools || [];
  const classes = gameSystem?.classes || {};
  const races = gameSystem?.races || [];

  const openModal = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalType(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cinzel text-[var(--hope-color)]">Tools & Reference</h1>
            <p className="text-[var(--text-secondary)] mt-1">External resources and quick reference guides</p>
          </div>
        </div>
        <hr className="border-[var(--border-accent)] opacity-30" />
      </div>

      {/* External Tools Section */}
      <section>
        <h2 className="text-xl font-cinzel font-semibold mb-6 text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-[var(--hope-color)]">✦</span> External Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {externalTools.map((tool, index) => (
            <a
              key={index}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm group hover:border-[var(--hope-color)] transition-all duration-300 flex items-start gap-4 p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--hope-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="text-4xl select-none group-hover:scale-110 transition-transform duration-300">
                {ICON_MAP[tool.icon] || '🔗'}
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <h3 className="font-cinzel font-bold text-lg mb-1 group-hover:text-[var(--hope-color)] transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <ExternalLink size={18} className="text-[var(--text-muted)] group-hover:text-[var(--hope-color)] transition-colors flex-shrink-0 mt-1" />
            </a>
          ))}
        </div>
      </section>

      {/* Daggerheart Specific Reference */}
      {gameSystem?.id === 'daggerheart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Classes */}
          <section>
            <h2 className="text-xl font-cinzel font-semibold mb-6 text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-[var(--hope-color)]">⚔️</span> Classes & Domains
            </h2>
            <div className="space-y-4">
              {Object.entries(classes).map(([className, data]) => (
                <div
                  key={className}
                  onClick={() => openModal({ name: className, ...data }, 'class')}
                  className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm cursor-pointer hover:border-[var(--hope-color)]/50 transition-all duration-300 p-5 group"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-cinzel font-bold text-lg group-hover:text-[var(--hope-color)] transition-colors">
                      {className}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.domains && data.domains.map(domain => (
                      <span key={domain} className="px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-xs text-[var(--text-secondary)] uppercase tracking-wide">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Ancestries & Communities */}
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-cinzel font-semibold mb-6 text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-[var(--hope-color)]">🧬</span> Ancestries
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(gameSystem.ancestries || {}).map(([name, description]) => (
                  <button
                    key={name}
                    onClick={() => openModal({ name, description }, 'ancestry')}
                    className="badge badge-hope px-4 py-2 hover:scale-105 transition-transform cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-cinzel font-semibold mb-6 text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-[var(--fear-color)]">🏘️</span> Communities
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(gameSystem.communities || {}).map(([name, description]) => (
                  <button
                    key={name}
                    onClick={() => openModal({ name, description }, 'community')}
                    className="badge badge-fear px-4 py-2 hover:scale-105 transition-transform cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Modal Re-style */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={closeModal}
          title={selectedItem.name}
          size="medium"
        >
          <div className="p-4 space-y-6">
            {modalType === 'class' && (
              <>
                <div className="p-4 bg-[var(--bg-tertiary)]/50 rounded-lg border border-[var(--border)]">
                  <h4 className="text-sm uppercase tracking-wider text-[var(--text-muted)] mb-2 font-bold">Description</h4>
                  <p className="text-[var(--text-primary)] leading-relaxed italic">
                    {selectedItem.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm uppercase tracking-wider text-[var(--hope-color)] mb-3 font-bold border-b border-[var(--border)] pb-2">Key Features</h4>
                  <p className="text-[var(--text-primary)] leading-relaxed">{selectedItem.features}</p>
                </div>

                <div>
                  <h4 className="text-sm uppercase tracking-wider text-[var(--hope-color)] mb-3 font-bold border-b border-[var(--border)] pb-2">Available Domains</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.domains.map(domain => (
                      <span key={domain} className="badge bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)]">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(modalType === 'ancestry' || modalType === 'community') && (
              <div className="p-4 bg-[var(--bg-tertiary)]/50 rounded-lg border border-[var(--border)]">
                <p className="text-[var(--text-primary)] leading-relaxed text-lg">
                  {selectedItem.description}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
