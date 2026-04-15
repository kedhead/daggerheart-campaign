import { useState, useMemo } from 'react';
import { Plus, Search, Download, Check, Skull, Filter } from 'lucide-react';
import AdversaryCard from './AdversaryCard';
import AdversaryForm from './AdversaryForm';
import Modal from '../Modal';
import { DAGGERHEART_ADVERSARIES, ADVERSARIES_BY_TIER, ADVERSARIES_BY_ROLE } from '../../data/daggerheartAdversaries';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateAdversaryPortrait } from '../../services/portraitGenerator';
import { buildCampaignContext } from '../../services/campaignContext';
import './AdversariesView.css';

export default function AdversariesView({
  campaign,
  adversaries = [],
  addAdversary,
  updateAdversary,
  deleteAdversary,
  isDM,
  userId,
  campaignFrame = null,
  npcs          = [],
  locations     = [],
  lore          = [],
  sessions      = [],
  characters    = [],
  encounters    = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAdversary, setEditingAdversary] = useState(null);
  const [importTier, setImportTier] = useState('all');
  const [selectedImports, setSelectedImports] = useState(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const campaignContext = useMemo(
    () => buildCampaignContext(campaign, {
      campaignFrame, adversaries, npcs, locations, lore, sessions, characters, encounters
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign?.id, adversaries.length, npcs.length, locations.length, lore.length]
  );

  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const openaiKeyInfo = getEffectiveKey('openai');
  const hasOpenAIKey = !!openaiKeyInfo?.key;

  // Get import items based on selected tier
  const getImportItems = () => {
    if (importTier === 'all') return DAGGERHEART_ADVERSARIES;
    return ADVERSARIES_BY_TIER[parseInt(importTier)] || [];
  };

  const importItems = getImportItems();
  const existingNames = new Set(adversaries.map(a => a.name.toLowerCase()));

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
    const available = importItems.filter(a => !existingNames.has(a.name.toLowerCase()));
    setSelectedImports(new Set(available.map(a => a.name)));
  };

  const clearImportSelection = () => {
    setSelectedImports(new Set());
  };

  const handleImport = async () => {
    if (selectedImports.size === 0) return;

    setIsImporting(true);
    const toImport = importItems.filter(a => selectedImports.has(a.name));

    for (const adversary of toImport) {
      await addAdversary({
        ...adversary,
        hidden: false,
        isOfficial: true
      });
    }

    setIsImporting(false);
    setShowImportModal(false);
    setSelectedImports(new Set());
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this adversary?')) {
      await deleteAdversary(id);
    }
  };

  const openCreate = () => {
    setEditingAdversary(null);
    setShowForm(true);
  };

  const openEdit = (adversary) => {
    setEditingAdversary(adversary);
    setShowForm(true);
  };

  const handleSave = async (formData) => {
    if (editingAdversary) {
      await updateAdversary(editingAdversary.id, formData);
    } else {
      await addAdversary({ ...formData, createdBy: campaign?.createdBy, createdByName: 'DM' });
    }
  };

  const handleGenerateImage = async (adversary) => {
    try {
      const gameSystem = campaign?.gameSystem || 'daggerheart';
      const imageUrl = await generateAdversaryPortrait(
        adversary,
        openaiKeyInfo?.key || null,
        gameSystem,
        campaign?.id
      );

      await updateAdversary(adversary.id, { imageUrl });
    } catch (err) {
      console.error('Image generation failed:', err);
      alert('Failed to generate image: ' + err.message);
    }
  };

  // Filter adversaries
  const filteredAdversaries = adversaries.filter(adv => {
    if (!isDM && adv.hidden) return false;

    const matchesSearch =
      adv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adv.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = filterTier === 'all' || adv.tier === parseInt(filterTier);
    const matchesRole = filterRole === 'all' || adv.role === filterRole;

    return matchesSearch && matchesTier && matchesRole;
  });

  // Get unique roles from adversaries
  const roles = [...new Set(adversaries.map(a => a.role).filter(Boolean))];

  // Counts
  const counts = {
    total: adversaries.filter(a => isDM || !a.hidden).length,
    byTier: {
      1: adversaries.filter(a => a.tier === 1 && (isDM || !a.hidden)).length,
      2: adversaries.filter(a => a.tier === 2 && (isDM || !a.hidden)).length,
      3: adversaries.filter(a => a.tier === 3 && (isDM || !a.hidden)).length,
      4: adversaries.filter(a => a.tier === 4 && (isDM || !a.hidden)).length
    }
  };

  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';

  return (
    <div className="adversaries-view">
      <div className="view-header">
        <div>
          <h2>Adversary Catalog</h2>
          <p className="view-subtitle">
            {counts.total} adversar{counts.total !== 1 ? 'ies' : 'y'} in your campaign
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
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={20} />
              Add Adversary
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="adversaries-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search adversaries..."
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

          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Adversaries Grid */}
      {filteredAdversaries.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterTier !== 'all' || filterRole !== 'all' ? (
            <p>No adversaries match your filters</p>
          ) : (
            <>
              <Skull size={64} />
              <p>No adversaries yet</p>
              {isDM && isDaggerheart && (
                <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
                  <Download size={20} />
                  Import Official Adversaries
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="adversaries-grid">
          {filteredAdversaries.map((adversary) => (
            <AdversaryCard
              key={adversary.id}
              adversary={adversary}
              onEdit={isDM ? openEdit : null}
              onDelete={isDM ? handleDelete : null}
              onGenerateImage={isDM ? handleGenerateImage : null}
              isDM={isDM}
              campaignId={campaign?.id}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Adversary Form */}
      <AdversaryForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingAdversary(null); }}
        onSave={handleSave}
        adversary={editingAdversary}
        campaignAdversaries={adversaries}
        userId={userId || campaign?.createdBy}
        campaignContext={campaignContext}
      />

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedImports(new Set());
        }}
        title="Import Official Daggerheart Adversaries"
        size="large"
      >
        <div className="import-modal">
          <p className="import-description">
            Import official adversaries from the Daggerheart SRD into your campaign.
          </p>

          <div className="import-category-tabs">
            {[
              { value: 'all', label: `All (${DAGGERHEART_ADVERSARIES.length})` },
              { value: '1', label: `Tier 1 (${ADVERSARIES_BY_TIER[1]?.length || 0})` },
              { value: '2', label: `Tier 2 (${ADVERSARIES_BY_TIER[2]?.length || 0})` },
              { value: '3', label: `Tier 3 (${ADVERSARIES_BY_TIER[3]?.length || 0})` },
              { value: '4', label: `Tier 4 (${ADVERSARIES_BY_TIER[4]?.length || 0})` }
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
            {importItems.map((adv, index) => {
              const alreadyExists = existingNames.has(adv.name.toLowerCase());
              const isSelected = selectedImports.has(adv.name);

              return (
                <div
                  key={`${adv.name}-${index}`}
                  className={`import-item ${alreadyExists ? 'exists' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => !alreadyExists && toggleImportItem(adv.name)}
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
                      {adv.name}
                      <span className="import-item-tier">T{adv.tier}</span>
                      <span className="import-item-role">{adv.role}</span>
                    </div>
                    <div className="import-item-desc">{adv.description}</div>
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
              {isImporting ? 'Importing...' : `Import ${selectedImports.size} Adversar${selectedImports.size !== 1 ? 'ies' : 'y'}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
