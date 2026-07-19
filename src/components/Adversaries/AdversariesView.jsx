import { useState, useMemo } from 'react';
import { Plus, Search, Download, Check, Skull, Filter } from 'lucide-react';
import AdversaryCard from './AdversaryCard';
import AdversaryForm from './AdversaryForm';
import StarWarsD6AdversaryCard from './StarWarsD6AdversaryCard';
import StarWarsD6AdversaryForm from './StarWarsD6AdversaryForm';
import Modal from '../Modal';
import { DAGGERHEART_ADVERSARIES, ADVERSARIES_BY_TIER, ADVERSARIES_BY_ROLE } from '../../data/daggerheartAdversaries';
import { filterBySource } from '../../data/sources';
import {
  STARWARSD6_ADVERSARIES,
  STARWARSD6_ADVERSARIES_BY_CLASSIFICATION,
  STARWARSD6_CLASSIFICATIONS,
  STARWARSD6_AFFILIATIONS
} from '../../data/starwarsd6Adversaries';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateAdversaryPortrait } from '../../services/portraitGenerator';
import { generateAdversaryStatblock, generateBossStatblock } from '../../services/adversaryGenerator';
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
  items         = [],
  maps          = [],
  battleMaps    = [],
  storybookChapters = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterClassification, setFilterClassification] = useState('all');
  const [filterAffiliation, setFilterAffiliation] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAdversary, setEditingAdversary] = useState(null);
  const [importTier, setImportTier] = useState('all');
  const [selectedImports, setSelectedImports] = useState(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const isStarWarsD6 = campaign?.gameSystem === 'starwarsd6';
  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';

  const mergedMaps = useMemo(() => [
    ...maps.map(m => ({ ...m, tag: 'map' })),
    ...battleMaps.map(m => ({ ...m, tag: 'battle-map' }))
  ], [maps, battleMaps]);

  const campaignContext = useMemo(
    () => buildCampaignContext(campaign, {
      campaignFrame, adversaries, npcs, locations, lore, sessions, characters, encounters,
      items, maps: mergedMaps, storybookChapters
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign?.id, adversaries.length, npcs.length, locations.length, lore.length,
     items.length, mergedMaps.length, storybookChapters.length]
  );

  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const openaiKeyInfo = getEffectiveKey('openai');
  const hasOpenAIKey = !!openaiKeyInfo?.key;
  const [regeneratingId, setRegeneratingId] = useState(null);

  // Resolve an AI provider/key for statblock generation. Prefers a client key
  // (Anthropic, then OpenAI); an empty key tells the server to use its env vars.
  const resolveTextProvider = () => {
    for (const provider of ['anthropic', 'openai']) {
      const info = getEffectiveKey(provider);
      if (info?.key) return { provider, apiKey: info.key };
    }
    return { provider: 'anthropic', apiKey: '' };
  };

  // Get import items based on selected tier / classification
  const getImportItems = () => {
    if (isStarWarsD6) {
      if (importTier === 'all') return STARWARSD6_ADVERSARIES;
      return STARWARSD6_ADVERSARIES_BY_CLASSIFICATION[importTier] || [];
    }
    // Respect the campaign's enabled content sources (e.g. Hope & Fear off).
    if (importTier === 'all') return filterBySource(DAGGERHEART_ADVERSARIES, campaign);
    return filterBySource(ADVERSARIES_BY_TIER[parseInt(importTier)] || [], campaign);
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

  // Re-run AI generation for an existing adversary, keeping its identity
  // (name, portrait, visibility) but replacing stats and features. Useful for
  // refreshing older stat blocks after generator fixes.
  const handleRegenerate = async (adversary) => {
    const isBoss = adversary.isBoss || adversary.role === 'boss';
    if (!confirm(
      `Regenerate "${adversary.name}"?\n\nIts name and portrait are kept, but the current stats${isBoss ? ', features, and phases' : ' and features'} will be replaced with a fresh AI generation based on its concept. This can't be undone.`
    )) return;

    setRegeneratingId(adversary.id);
    try {
      const { provider, apiKey } = resolveTextProvider();
      const tier = adversary.tier || 1;
      // Build a faithful concept from the existing identity so the regen stays on-theme.
      const concept = [
        adversary.name,
        adversary.description,
        adversary.motives ? `Motives: ${adversary.motives}` : ''
      ].filter(Boolean).join('. ') || adversary.name || 'An adversary';

      const result = isBoss
        ? await generateBossStatblock({ concept, tier, apiKey, provider, campaignContext })
        : await generateAdversaryStatblock({ concept, tier, role: adversary.role || 'standard', apiKey, provider, campaignContext });

      // Keep the GM's identity/organizational fields; take the freshly generated mechanics.
      const { name, imageUrl, hidden, isOfficial, createdBy, createdByName, id, ...generated } = result;
      await updateAdversary(adversary.id, {
        ...generated,
        name: adversary.name,       // preserve the chosen name
      });
    } catch (err) {
      console.error('Adversary regeneration failed:', err);
      alert('Failed to regenerate adversary: ' + (err.message || 'Unknown error'));
    } finally {
      setRegeneratingId(null);
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

    if (isStarWarsD6) {
      const matchesClassification =
        filterClassification === 'all' || adv.classification === filterClassification;
      const matchesAffiliation =
        filterAffiliation === 'all' || adv.affiliation === filterAffiliation;
      return matchesSearch && matchesClassification && matchesAffiliation;
    }

    const matchesTier = filterTier === 'all' || adv.tier === parseInt(filterTier);
    const matchesRole = filterRole === 'all' || adv.role === filterRole;
    return matchesSearch && matchesTier && matchesRole;
  });

  // Get unique roles / classifications / affiliations from adversaries
  const roles = [...new Set(adversaries.map(a => a.role).filter(Boolean))];
  const classificationsInUse = [...new Set(adversaries.map(a => a.classification).filter(Boolean))];
  const affiliationsInUse = [...new Set(adversaries.map(a => a.affiliation).filter(Boolean))];

  // Counts
  const counts = {
    total: adversaries.filter(a => isDM || !a.hidden).length,
    byTier: {
      1: adversaries.filter(a => a.tier === 1 && (isDM || !a.hidden)).length,
      2: adversaries.filter(a => a.tier === 2 && (isDM || !a.hidden)).length,
      3: adversaries.filter(a => a.tier === 3 && (isDM || !a.hidden)).length,
      4: adversaries.filter(a => a.tier === 4 && (isDM || !a.hidden)).length
    },
    byClassification: STARWARSD6_CLASSIFICATIONS.reduce((acc, c) => {
      acc[c.value] = adversaries.filter(a => a.classification === c.value && (isDM || !a.hidden)).length;
      return acc;
    }, {})
  };

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
            {(isDaggerheart || isStarWarsD6) && (
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
          {isStarWarsD6 ? (
            <>
              <select
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
              >
                <option value="all">All Classifications</option>
                {STARWARSD6_CLASSIFICATIONS.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({counts.byClassification[c.value] || 0})
                  </option>
                ))}
              </select>
              <select
                value={filterAffiliation}
                onChange={(e) => setFilterAffiliation(e.target.value)}
              >
                <option value="all">All Affiliations</option>
                {affiliationsInUse.map(aff => (
                  <option key={aff} value={aff} style={{ textTransform: 'capitalize' }}>{aff}</option>
                ))}
              </select>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Adversaries Grid */}
      {filteredAdversaries.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterTier !== 'all' || filterRole !== 'all' || filterClassification !== 'all' || filterAffiliation !== 'all' ? (
            <p>No adversaries match your filters</p>
          ) : (
            <>
              <Skull size={64} />
              <p>No adversaries yet</p>
              {isDM && (isDaggerheart || isStarWarsD6) && (
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
            isStarWarsD6 ? (
              <StarWarsD6AdversaryCard
                key={adversary.id}
                adversary={adversary}
                onEdit={isDM ? openEdit : null}
                onDelete={isDM ? handleDelete : null}
                onGenerateImage={isDM ? handleGenerateImage : null}
                isDM={isDM}
              />
            ) : (
              <AdversaryCard
                key={adversary.id}
                adversary={adversary}
                onEdit={isDM ? openEdit : null}
                onDelete={isDM ? handleDelete : null}
                onGenerateImage={isDM ? handleGenerateImage : null}
                onRegenerate={isDM ? handleRegenerate : null}
                regenerating={regeneratingId === adversary.id}
                isDM={isDM}
                campaignId={campaign?.id}
              />
            )
          ))}
        </div>
      )}

      {/* Create / Edit Adversary Form */}
      {isStarWarsD6 ? (
        <StarWarsD6AdversaryForm
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditingAdversary(null); }}
          onSave={handleSave}
          adversary={editingAdversary}
          campaignAdversaries={adversaries}
        />
      ) : (
        <AdversaryForm
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditingAdversary(null); }}
          onSave={handleSave}
          adversary={editingAdversary}
          campaignAdversaries={adversaries}
          userId={userId || campaign?.createdBy}
          campaignContext={campaignContext}
        />
      )}

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedImports(new Set());
        }}
        title={isStarWarsD6 ? 'Import Star Wars D6 Adversaries' : 'Import Official Daggerheart Adversaries'}
        size="large"
      >
        <div className="import-modal">
          <p className="import-description">
            {isStarWarsD6
              ? 'Import canonical Star Wars D6 (West End Games) adversaries into your campaign.'
              : 'Import official adversaries from the Daggerheart SRD into your campaign.'}
          </p>

          <div className="import-category-tabs">
            {(isStarWarsD6
              ? [
                  { value: 'all', label: `All (${STARWARSD6_ADVERSARIES.length})` },
                  ...STARWARSD6_CLASSIFICATIONS.map(c => ({
                    value: c.value,
                    label: `${c.label} (${STARWARSD6_ADVERSARIES_BY_CLASSIFICATION[c.value]?.length || 0})`
                  }))
                ]
              : [
                  { value: 'all', label: `All (${DAGGERHEART_ADVERSARIES.length})` },
                  { value: '1', label: `Tier 1 (${ADVERSARIES_BY_TIER[1]?.length || 0})` },
                  { value: '2', label: `Tier 2 (${ADVERSARIES_BY_TIER[2]?.length || 0})` },
                  { value: '3', label: `Tier 3 (${ADVERSARIES_BY_TIER[3]?.length || 0})` },
                  { value: '4', label: `Tier 4 (${ADVERSARIES_BY_TIER[4]?.length || 0})` }
                ]
            ).map(cat => (
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
                      {isStarWarsD6 ? (
                        <>
                          <span className="import-item-tier" style={{ textTransform: 'capitalize' }}>
                            {adv.classification || 'thug'}
                          </span>
                          <span className="import-item-role" style={{ textTransform: 'capitalize' }}>
                            {adv.affiliation || 'neutral'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="import-item-tier">T{adv.tier}</span>
                          <span className="import-item-role">{adv.role}</span>
                        </>
                      )}
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
