import { useState } from 'react';
import { Plus, Search, Download, Check, TreePine, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import EnvironmentCard from './EnvironmentCard';
import EnvironmentForm from './EnvironmentForm';
import Modal from '../Modal';
import { DAGGERHEART_ENVIRONMENTS, getEnvironmentsByTier, ENVIRONMENT_TYPES } from '../../data/daggerheartEnvironments';
import { sourceOf, CONTENT_SOURCES } from '../../data/sources';
import './EnvironmentsView.css';

export default function EnvironmentsView({
  campaign,
  environments = [],
  addEnvironment,
  updateEnvironment,
  deleteEnvironment,
  isDM
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTier, setImportTier] = useState('all');
  const [importSource, setImportSource] = useState('all');
  const [selectedImports, setSelectedImports] = useState(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [expandedEnvId, setExpandedEnvId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState(null);

  // Get import items based on selected tier
  const getImportItems = () => {
    if (importTier === 'all') return DAGGERHEART_ENVIRONMENTS;
    return getEnvironmentsByTier(parseInt(importTier));
  };

  const importItems = getImportItems()
    .filter(e => importSource === 'all' || sourceOf(e) === importSource);
  const existingNames = new Set(environments.map(e => e.name.toLowerCase()));

  const toggleImportItem = (name) => {
    const newSelected = new Set(selectedImports);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedImports(newSelected);
  };

  const selectAllImports = () => {
    const available = importItems.filter(e => !existingNames.has(e.name.toLowerCase()));
    setSelectedImports(new Set(available.map(e => e.name)));
  };

  const clearImportSelection = () => {
    setSelectedImports(new Set());
  };

  const handleImport = async () => {
    if (selectedImports.size === 0) return;

    setIsImporting(true);
    const toImport = importItems.filter(e => selectedImports.has(e.name));

    for (const environment of toImport) {
      await addEnvironment({
        ...environment,
        hidden: false,
        isOfficial: true
      });
    }

    setIsImporting(false);
    setShowImportModal(false);
    setSelectedImports(new Set());
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this environment?')) {
      await deleteEnvironment(id);
    }
  };

  const openAddModal = () => {
    setEditingEnvironment(null);
    setShowEditModal(true);
  };

  const openEditModal = (environment) => {
    setEditingEnvironment(environment);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEnvironment(null);
  };

  const handleSaveEnvironment = async (data) => {
    if (editingEnvironment?.id) {
      const { id, ...updates } = { ...data };
      await updateEnvironment(editingEnvironment.id, updates);
    } else {
      await addEnvironment({ ...data, isOfficial: false });
    }
    closeEditModal();
  };

  // Filter environments
  const filteredEnvironments = environments.filter(env => {
    if (!isDM && env.hidden) return false;

    const matchesSearch =
      env.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      env.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = filterTier === 'all' || env.tier === parseInt(filterTier);
    const matchesType = filterType === 'all' || env.type === filterType;
    const matchesSource = filterSource === 'all' || sourceOf(env) === filterSource;

    return matchesSearch && matchesTier && matchesType && matchesSource;
  });

  // Get unique types from environments
  const types = [...new Set(environments.map(e => e.type).filter(Boolean))];

  // Counts
  const counts = {
    total: environments.filter(e => isDM || !e.hidden).length,
    byTier: {
      1: environments.filter(e => e.tier === 1 && (isDM || !e.hidden)).length,
      2: environments.filter(e => e.tier === 2 && (isDM || !e.hidden)).length,
      3: environments.filter(e => e.tier === 3 && (isDM || !e.hidden)).length,
      4: environments.filter(e => e.tier === 4 && (isDM || !e.hidden)).length
    }
  };

  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';

  // Get import tier counts
  const tierCounts = {
    all: DAGGERHEART_ENVIRONMENTS.length,
    1: getEnvironmentsByTier(1).length,
    2: getEnvironmentsByTier(2).length,
    3: getEnvironmentsByTier(3).length,
    4: getEnvironmentsByTier(4).length
  };

  return (
    <div className="environments-view">
      <div className="view-header">
        <div>
          <h2>Environment Catalog</h2>
          <p className="view-subtitle">
            {counts.total} environment{counts.total !== 1 ? 's' : ''} in your campaign
          </p>
        </div>
        {isDM && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isDaggerheart && (
              <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                <Download size={20} />
                Import Official
              </button>
            )}
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={20} />
              Add Environment
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="environments-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search environments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
            <option value="all">All Tiers</option>
            <option value="1">Tier 1 ({counts.byTier[1]})</option>
            <option value="2">Tier 2 ({counts.byTier[2]})</option>
            <option value="3">Tier 3 ({counts.byTier[3]})</option>
            <option value="4">Tier 4 ({counts.byTier[4]})</option>
          </select>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {ENVIRONMENT_TYPES.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>

          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} title="Filter by source book">
            <option value="all">All Sources</option>
            {CONTENT_SOURCES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Environments Grid */}
      {filteredEnvironments.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterTier !== 'all' || filterType !== 'all' ? (
            <p>No environments match your filters</p>
          ) : (
            <>
              <TreePine size={64} />
              <p>No environments yet</p>
              {isDM && isDaggerheart && (
                <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
                  <Download size={20} />
                  Import Official Environments
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="environments-grid">
          {filteredEnvironments.map((environment) => (
            <EnvironmentCard
              key={environment.id}
              environment={environment}
              onEdit={isDM ? () => openEditModal(environment) : null}
              onDelete={isDM ? handleDelete : null}
              isDM={isDM}
              isExpanded={expandedEnvId === environment.id}
              onToggleExpand={() => setExpandedEnvId(expandedEnvId === environment.id ? null : environment.id)}
            />
          ))}
        </div>
      )}

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedImports(new Set());
        }}
        title="Import Official Daggerheart Environments"
        size="large"
      >
        <div className="import-modal">
          <p className="import-description">
            Import official environments from the Daggerheart SRD into your campaign.
          </p>

          <div className="import-category-tabs">
            {[
              { value: 'all', label: `All (${tierCounts.all})` },
              { value: '1', label: `Tier 1 (${tierCounts[1]})` },
              { value: '2', label: `Tier 2 (${tierCounts[2]})` },
              { value: '3', label: `Tier 3 (${tierCounts[3]})` },
              { value: '4', label: `Tier 4 (${tierCounts[4]})` }
            ].map(cat => (
              <button
                key={cat.value}
                className={`import-tab ${importTier === cat.value ? 'active' : ''}`}
                onClick={() => setImportTier(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="import-source-row">
            <span className="import-source-label">Source</span>
            <button
              className={`import-source-chip ${importSource === 'all' ? 'active' : ''}`}
              onClick={() => setImportSource('all')}
            >All</button>
            {CONTENT_SOURCES.map(s => (
              <button
                key={s.id}
                className={`import-source-chip ${importSource === s.id ? 'active' : ''}`}
                onClick={() => setImportSource(s.id)}
              >{s.label}</button>
            ))}
          </div>

          <div className="import-actions-bar">
            <span className="selection-count">
              {selectedImports.size} selected
            </span>
            <button className="btn btn-ghost btn-sm" onClick={selectAllImports}>
              Select All Available
            </button>
            <button className="btn btn-ghost btn-sm" onClick={clearImportSelection}>
              Clear Selection
            </button>
          </div>

          <div className="import-items-list">
            {importItems.map((env, index) => {
              const alreadyExists = existingNames.has(env.name.toLowerCase());
              const isSelected = selectedImports.has(env.name);

              return (
                <div
                  key={`${env.name}-${index}`}
                  className={`import-item ${alreadyExists ? 'exists' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => !alreadyExists && toggleImportItem(env.name)}
                >
                  <div className="import-item-checkbox">
                    {alreadyExists ? (
                      <Check size={16} className="exists-icon" />
                    ) : isSelected ? (
                      <Check size={16} />
                    ) : (
                      <div className="checkbox-empty" />
                    )}
                  </div>
                  <div className="import-item-info">
                    <div className="import-item-name">
                      {env.name}
                      <span className="import-item-tier">T{env.tier}</span>
                      <span className="import-item-type">{env.type}</span>
                    </div>
                    <div className="import-item-desc">{env.description}</div>
                  </div>
                  {alreadyExists && (
                    <span className="already-exists-badge">Already imported</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="import-modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowImportModal(false);
                setSelectedImports(new Set());
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={selectedImports.size === 0 || isImporting}
            >
              <Download size={16} />
              {isImporting ? 'Importing...' : `Import ${selectedImports.size} Environment${selectedImports.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Environment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title={editingEnvironment?.id ? 'Edit Environment' : 'Add Environment'}
        size="large"
      >
        {showEditModal && (
          <EnvironmentForm
            environment={editingEnvironment}
            onSave={handleSaveEnvironment}
            onCancel={closeEditModal}
            isDM={isDM}
          />
        )}
      </Modal>
    </div>
  );
}
