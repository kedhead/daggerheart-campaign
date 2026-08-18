import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import {
  CLASSES, SUBCLASSES, DOMAINS, ADVANCEMENT_OPTIONS,
  getBaseProficiency, getProficiencyBonus, getTierForLevel, getAdvancementTier
} from '../../data/systems/daggerheart';
import { getCardsForCharacter, getCardsForMulticlass, getCardByName } from '../../data/daggerheartDomainCards';
import { applyLevelUp, maxCardLevelFor, TRAIT_NAMES, TIER_BOUNDARY_LEVELS } from '../../utils/daggerheartLevelUp';
import { COMPANION_UPGRADES, EXAMPLE_COMPANION_EXPERIENCES } from '../../data/daggerheartCompanion';
import './LevelUpWizard.css';

export default function LevelUpWizard({ character, items, onComplete, onClose }) {
  const currentLevel = character.level || 1;
  const newLevel = currentLevel + 1;
  const newTier = getTierForLevel(newLevel);
  const oldTier = getTierForLevel(currentLevel);
  const tierKey = getAdvancementTier(newLevel);
  const isTierBoundary = TIER_BOUNDARY_LEVELS[newTier] === newLevel;
  const charClass = character.class || '';
  const subclassName = character.subclass || '';
  const isBeastbound = charClass === 'Ranger' && subclassName === 'Beastbound';
  const isDruid = charClass === 'Druid';

  // Level history tracks how many times each advancement slot has been used.
  // Slots are tracked per tier pool ("<tier>:<optionId>") because tier 3+
  // level-ups may also spend unused slots from earlier tiers (SRD: "choose two
  // options from the list below or any from the previous tier").
  const levelHistory = character.levelHistory || [];

  const usedSlots = useMemo(() => {
    const counts = {};
    levelHistory.forEach(lh => {
      (lh.advancements || []).forEach(adv => {
        const fromTier = adv.fromTier || getTierForLevel(lh.level);
        const key = `${fromTier}:${adv.id}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }, [levelHistory]);

  // At levels 5 and 8 all trait marks clear before advancements are chosen,
  // so the trait picker must treat every trait as unmarked on those levels.
  const effectiveMarkedTraits = (isTierBoundary && newTier >= 3)
    ? []
    : (character.markedTraits || []);

  // Subclass progression
  const currentSubclassLevel = character.subclassLevel || 'foundation';
  const subclassInfo = useMemo(() => {
    if (!charClass || !subclassName || !SUBCLASSES[charClass]) return null;
    return SUBCLASSES[charClass].find(s => s.name === subclassName);
  }, [charClass, subclassName]);

  const hasMulticlass = !!character.multiclass;

  // Step state
  const [step, setStep] = useState(0);

  // Step 1: Achievements
  const [newExperience, setNewExperience] = useState('');

  // Step 2: Advancements (pick 2 slots worth)
  const [advancements, setAdvancements] = useState([]);
  const [advDetails, setAdvDetails] = useState({});

  // Step 3: Free domain card
  const [freeDomainCard, setFreeDomainCard] = useState(null);

  // Step 4: Companion upgrade (Beastbound only)
  const [companionUpgrade, setCompanionUpgrade] = useState(null);
  const [companionUpgradeDetail, setCompanionUpgradeDetail] = useState('');

  // Compute achievements for this level
  const achievements = useMemo(() => {
    const list = [];
    if (isTierBoundary) {
      list.push({ type: 'experience', label: 'Gain a new Experience (starts at +2)' });
      list.push({ type: 'proficiency', label: `Proficiency increases to +${getBaseProficiency(newLevel) + getProficiencyBonus(character)}` });
      if (newTier >= 3) {
        list.push({ type: 'clearMarks', label: 'Clear all trait marks (allows re-upgrading traits)' });
      }
    }
    // Happens at every level — thresholds are derived from level, so this is
    // informational and applied automatically.
    list.push({ type: 'thresholds', label: 'All damage thresholds increase by +1 (applied automatically)' });
    return list;
  }, [newLevel, newTier, isTierBoundary]);

  // Available domain cards for this level-up
  const availableDomainCards = useMemo(() => {
    const primaryDomain = character.primaryDomain || '';
    const secondaryDomain = character.secondaryDomain || '';
    const existing = new Set(character.domainCards || []);
    let cards = getCardsForCharacter(primaryDomain, secondaryDomain, newLevel)
      .filter(c => !existing.has(c.name));
    // If multiclassed, also include multiclass domain cards (capped at half level)
    if (character.multiclass?.domain) {
      const mcCards = getCardsForMulticlass(character.multiclass.domain, newLevel)
        .filter(c => !existing.has(c.name));
      cards = [...cards, ...mcCards];
    }
    return cards;
  }, [character, newLevel]);

  // Advancement pools: this tier's list plus unused slots from earlier tiers
  // (tier 2+). Each option keeps track of which tier pool it draws from, and
  // is identified by a composite key "<tier>:<id>".
  const availableOptions = useMemo(() => {
    if (!tierKey) return [];
    const opts = [];
    for (let t = newTier; t >= 2; t--) {
      const pool = ADVANCEMENT_OPTIONS[`tier${t}`] || [];
      pool.forEach(opt => {
        const key = `${t}:${opt.id}`;
        const used = usedSlots[key] || 0;
        const remaining = opt.slots - used;
        let crossedOut = false;
        if (opt.id === 'multiclass') {
          // Only one multiclass ever; taking an upgraded subclass card crosses
          // out the multiclass option for that tier (SRD).
          const upgradedThisTier = (usedSlots[`${t}:subclassUpgrade`] || 0) > 0;
          if (hasMulticlass || upgradedThisTier) crossedOut = true;
        }
        if (opt.id === 'subclassUpgrade') {
          // Multiclassing crosses out one subclass upgrade, so mastery becomes
          // unreachable — but foundation → specialization is still allowed.
          if (currentSubclassLevel === 'mastery') crossedOut = true;
          if (currentSubclassLevel === 'specialization' && hasMulticlass) crossedOut = true;
        }
        if (opt.id === 'experiences' && (character.experiences || []).length === 0) crossedOut = true;
        // An earlier tier's card box is capped below the character's level, so
        // it can run dry while higher-level cards are still on offer.
        if (opt.id === 'domainCard'
          && !availableDomainCards.some(c => c.level <= maxCardLevelFor(opt, newLevel))) crossedOut = true;
        // Hide exhausted or crossed-out options from earlier tiers to reduce noise
        if (t !== newTier && (remaining <= 0 || crossedOut)) return;
        opts.push({ ...opt, key, fromTier: t, used, remaining, crossedOut });
      });
    }
    return opts;
  }, [tierKey, newTier, usedSlots, hasMulticlass, currentSubclassLevel, character.experiences, availableDomainCards]);

  // Total slots used by current picks
  const totalAdvancementCost = advancements.reduce((sum, key) => {
    const opt = availableOptions.find(o => o.key === key);
    return sum + (opt?.cost || 1);
  }, 0);

  const canAddAdvancement = (key) => {
    const opt = availableOptions.find(o => o.key === key);
    if (!opt || opt.crossedOut || opt.remaining <= 0) return false;
    const alreadyPicked = advancements.filter(a => a === key).length;
    if (alreadyPicked >= opt.remaining) return false;
    if (totalAdvancementCost + opt.cost > 2) return false;
    // Only one multiclass pick ever, across all pools
    if (opt.id === 'multiclass' && advancements.some(a => a.endsWith(':multiclass'))) return false;
    return true;
  };

  const toggleAdvancement = (key) => {
    const idx = advancements.indexOf(key);
    if (idx >= 0) {
      const newAdv = [...advancements];
      newAdv.splice(idx, 1);
      setAdvancements(newAdv);
      const newDetails = { ...advDetails };
      delete newDetails[key];
      setAdvDetails(newDetails);
    } else if (canAddAdvancement(key)) {
      setAdvancements([...advancements, key]);
    }
  };

  // Companion upgrades available
  const companionUpgrades = character.companion?.upgrades || [];

  const availableCompanionUpgrades = useMemo(() => {
    return COMPANION_UPGRADES.filter(u => {
      if (!u.repeatable && companionUpgrades.includes(u.id)) return false;
      return true;
    });
  }, [companionUpgrades]);

  // Multiclass state (within advancements)
  const [mcClass, setMcClass] = useState('');
  const [mcSubclass, setMcSubclass] = useState('');
  const [mcDomain, setMcDomain] = useState('');

  // Steps definition
  const steps = useMemo(() => {
    const s = [];
    s.push({ id: 'achievements', label: 'Achievements' });
    if (tierKey) s.push({ id: 'advancements', label: 'Advancements' });
    s.push({ id: 'domainCard', label: 'Domain Card' });
    if (isBeastbound) s.push({ id: 'companion', label: 'Companion' });
    s.push({ id: 'summary', label: 'Summary' });
    return s;
  }, [tierKey, isBeastbound]);

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  // Each selected advancement that needs details must have them filled in
  const advancementDetailsComplete = advancements.every(key => {
    const id = key.split(':')[1];
    const d = advDetails[key] || {};
    if (id === 'traits') return (d.traits || []).length === 2;
    if (id === 'experiences') {
      const needed = Math.min(2, (character.experiences || []).length);
      return (d.experiences || []).length === needed;
    }
    if (id === 'domainCard') return !!d.card;
    if (id === 'multiclass') return !!(mcClass && mcSubclass && mcDomain);
    return true;
  });

  // Validation for each step
  const canProceed = () => {
    if (!currentStep) return false;
    switch (currentStep.id) {
      case 'achievements':
        return !isTierBoundary || newExperience.trim().length > 0;
      case 'advancements':
        return totalAdvancementCost === 2 && advancementDetailsComplete;
      case 'domainCard':
        // Every level-up grants a domain card (SRD) — required when any are available
        return availableDomainCards.length === 0 || !!freeDomainCard;
      case 'companion':
        return true; // Optional
      case 'summary':
        return true;
      default:
        return true;
    }
  };

  // Build the final update object. The rules live in daggerheartLevelUp so they
  // can be unit-tested; this component only gathers the choices.
  const buildUpdates = () => applyLevelUp(character, {
    newLevel,
    newTier,
    isTierBoundary,
    advancements,
    advDetails,
    newExperience,
    freeDomainCard,
    multiclass: (mcClass && mcSubclass && mcDomain)
      ? { class: mcClass, subclass: mcSubclass, domain: mcDomain }
      : null,
    companionUpgrade: isBeastbound ? companionUpgrade : null,
    companionUpgradeDetail,
  });

  const handleComplete = () => {
    onComplete(buildUpdates());
    onClose();
  };

  // ─── Render helpers ───

  const renderAchievements = () => (
    <div className="luw-step-content">
      <h3 className="luw-step-title">Level {newLevel} Achievements</h3>
      <p className="luw-step-desc">
        {isTierBoundary
          ? `You're entering Tier ${newTier}! These bonuses are automatically applied.`
          : 'No tier boundary achievements at this level. Proceed to choose advancements.'}
      </p>
      {achievements.map((ach, i) => (
        <div key={i} className="luw-achievement-item">
          <Check size={16} className="luw-check-icon" />
          <span>{ach.label}</span>
        </div>
      ))}
      {isTierBoundary && (
        <div className="luw-input-group">
          <label className="luw-label">New Experience Name</label>
          <input
            type="text"
            className="luw-input"
            placeholder="e.g., Expert Tracker, Battle Tactics..."
            value={newExperience}
            onChange={(e) => setNewExperience(e.target.value)}
          />
          <div className="luw-hint">This experience starts at +2 modifier.</div>
        </div>
      )}
    </div>
  );

  const renderAdvancements = () => {
    // Traits already chosen by any pick this level (marks apply immediately)
    const traitsPickedThisLevel = advancements.flatMap(k =>
      k.endsWith(':traits') ? (advDetails[k]?.traits || []) : []
    );
    // Domain cards claimed by other picks or the free card
    const cardsClaimed = new Set([
      freeDomainCard,
      ...advancements.map(k => (k.endsWith(':domainCard') ? advDetails[k]?.card : null))
    ].filter(Boolean));

    return (
      <div className="luw-step-content">
        <h3 className="luw-step-title">Choose Advancements ({totalAdvancementCost}/2 slots)</h3>
        <p className="luw-step-desc">
          Pick advancements that use a total of 2 slots.
          {newTier > 2 && ' Unused options from earlier tiers are also available.'}
        </p>

        <div className="luw-options-list">
          {availableOptions.map(opt => {
            const picked = advancements.includes(opt.key);
            const disabled = opt.crossedOut || (!picked && !canAddAdvancement(opt.key));
            const markedTraits = advDetails[opt.key]?.traits || [];

            return (
              <div key={opt.key} className={`luw-option ${picked ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${opt.crossedOut ? 'crossed-out' : ''}`}>
                <button
                  className="luw-option-btn"
                  onClick={() => !opt.crossedOut && toggleAdvancement(opt.key)}
                  disabled={disabled && !picked}
                >
                  <div className="luw-option-header">
                    <span className="luw-option-label">
                      {opt.label}
                      {opt.fromTier !== newTier && <span className="luw-option-tier-badge"> (Tier {opt.fromTier})</span>}
                    </span>
                    <span className="luw-option-meta">
                      Cost: {opt.cost} | {Math.max(0, opt.remaining - (picked ? 1 : 0))} left
                    </span>
                  </div>
                </button>

                {/* Detail inputs for selected options */}
                {picked && opt.id === 'traits' && (
                  <div className="luw-detail-panel">
                    <label className="luw-label">Pick 2 unmarked traits to increase by +1:</label>
                    <div className="luw-trait-picks">
                      {TRAIT_NAMES.map(t => {
                        const isSelected = markedTraits.includes(t);
                        const isMarked = !isSelected && (
                          effectiveMarkedTraits.includes(t) || traitsPickedThisLevel.includes(t)
                        );
                        return (
                          <button
                            key={t}
                            className={`luw-trait-btn ${isSelected ? 'selected' : ''} ${isMarked ? 'marked' : ''}`}
                            disabled={isMarked}
                            onClick={() => {
                              let traits;
                              if (isSelected) {
                                traits = markedTraits.filter(x => x !== t);
                              } else if (markedTraits.length < 2) {
                                traits = [...markedTraits, t];
                              } else {
                                return;
                              }
                              setAdvDetails({ ...advDetails, [opt.key]: { traits } });
                            }}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                            {isMarked && ' (marked)'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {picked && opt.id === 'experiences' && (
                  <div className="luw-detail-panel">
                    <label className="luw-label">Pick 2 experiences to boost by +1:</label>
                    <div className="luw-experience-picks">
                      {(character.experiences || []).map(exp => {
                        const isSelected = (advDetails[opt.key]?.experiences || []).includes(exp);
                        return (
                          <button
                            key={exp}
                            className={`luw-trait-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              const current = advDetails[opt.key]?.experiences || [];
                              let exps;
                              if (isSelected) {
                                exps = current.filter(x => x !== exp);
                              } else if (current.length < 2) {
                                exps = [...current, exp];
                              } else {
                                return;
                              }
                              setAdvDetails({ ...advDetails, [opt.key]: { experiences: exps } });
                            }}
                          >
                            {exp}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {picked && opt.id === 'domainCard' && (
                  <div className="luw-detail-panel">
                    <label className="luw-label">
                      Pick a domain card
                      {maxCardLevelFor(opt, newLevel) < newLevel
                        && ` (Tier ${opt.fromTier} box — level ${maxCardLevelFor(opt, newLevel)} or lower)`}:
                    </label>
                    <select
                      className="luw-select"
                      value={advDetails[opt.key]?.card || ''}
                      onChange={(e) => setAdvDetails({ ...advDetails, [opt.key]: { card: e.target.value } })}
                    >
                      <option value="">Select a card...</option>
                      {availableDomainCards
                        .filter(c => c.level <= maxCardLevelFor(opt, newLevel))
                        .filter(c => c.name === advDetails[opt.key]?.card || !cardsClaimed.has(c.name))
                        .map(c => (
                          <option key={c.name} value={c.name}>{c.name} (Lv {c.level} {c.domain}){c.source === 'hope-fear' ? ' — Hope & Fear' : ''}</option>
                        ))}
                    </select>
                  </div>
                )}

                {picked && opt.id === 'subclassUpgrade' && subclassInfo && (
                  <div className="luw-detail-panel">
                    <div className="luw-subclass-preview">
                      <div className="luw-subclass-level">
                        {currentSubclassLevel === 'foundation' ? 'Specialization' : 'Mastery'}
                      </div>
                      <div className="luw-subclass-name">
                        {currentSubclassLevel === 'foundation'
                          ? subclassInfo.specialization?.name
                          : subclassInfo.mastery?.name}
                      </div>
                      <div className="luw-subclass-desc">
                        {currentSubclassLevel === 'foundation'
                          ? subclassInfo.specialization?.description
                          : subclassInfo.mastery?.description}
                      </div>
                    </div>
                  </div>
                )}

                {picked && opt.id === 'multiclass' && (
                  <div className="luw-detail-panel">
                    <label className="luw-label">Choose a second class:</label>
                    <select
                      className="luw-select"
                      value={mcClass}
                      onChange={(e) => { setMcClass(e.target.value); setMcSubclass(''); setMcDomain(''); }}
                    >
                      <option value="">Select class...</option>
                      {Object.keys(CLASSES).filter(c => c !== charClass).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {mcClass && (
                      <>
                        <label className="luw-label">Choose a subclass:</label>
                        <select
                          className="luw-select"
                          value={mcSubclass}
                          onChange={(e) => setMcSubclass(e.target.value)}
                        >
                          <option value="">Select subclass...</option>
                          {(SUBCLASSES[mcClass] || []).map(sc => (
                            <option key={sc.name} value={sc.name}>{sc.name}</option>
                          ))}
                        </select>

                        <label className="luw-label">Choose a new domain:</label>
                        <select
                          className="luw-select"
                          value={mcDomain}
                          onChange={(e) => setMcDomain(e.target.value)}
                        >
                          <option value="">Select domain...</option>
                          {(CLASSES[mcClass]?.domains || [])
                            .filter(d => d !== character.primaryDomain && d !== character.secondaryDomain)
                            .map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDomainCard = () => {
    const cardsClaimed = new Set(
      advancements.map(k => (k.endsWith(':domainCard') ? advDetails[k]?.card : null)).filter(Boolean)
    );
    return (
    <div className="luw-step-content">
      <h3 className="luw-step-title">New Domain Card</h3>
      <p className="luw-step-desc">Every level-up grants a domain card. Pick one at level {newLevel} or lower from your accessible domains.</p>
      <div className="luw-card-grid">
        {availableDomainCards.filter(c => !cardsClaimed.has(c.name)).map(card => (
          <button
            key={card.name}
            className={`luw-card-option ${freeDomainCard === card.name ? 'selected' : ''}`}
            onClick={() => setFreeDomainCard(freeDomainCard === card.name ? null : card.name)}
          >
            <div className="luw-card-header">
              <span className="luw-card-name">
                {card.name}
                {card.source === 'hope-fear' && <span className="hf-badge">Hope &amp; Fear</span>}
              </span>
              <span className="luw-card-meta">Lv {card.level} · {card.domain} · {card.type}</span>
            </div>
            <div className="luw-card-desc">{card.description}</div>
          </button>
        ))}
        {availableDomainCards.length === 0 && (
          <div className="luw-empty">No new domain cards available.</div>
        )}
      </div>
    </div>
    );
  };

  const renderCompanion = () => (
    <div className="luw-step-content">
      <h3 className="luw-step-title">Companion Upgrade</h3>
      <p className="luw-step-desc">Choose a level-up option for your companion.</p>
      <div className="luw-options-list">
        {availableCompanionUpgrades.map(u => (
          <div
            key={u.id}
            className={`luw-option ${companionUpgrade === u.id ? 'selected' : ''}`}
          >
            <button
              className="luw-option-btn"
              onClick={() => setCompanionUpgrade(companionUpgrade === u.id ? null : u.id)}
            >
              <div className="luw-option-header">
                <span className="luw-option-label">{u.name}</span>
                {u.repeatable && <span className="luw-option-meta">Repeatable</span>}
              </div>
              <div className="luw-option-desc">{u.description}</div>
            </button>

            {companionUpgrade === u.id && u.id === 'intelligent' && (
              <div className="luw-detail-panel">
                <label className="luw-label">Which experience gets +1?</label>
                <select
                  className="luw-select"
                  value={companionUpgradeDetail}
                  onChange={(e) => setCompanionUpgradeDetail(e.target.value)}
                >
                  <option value="">Select experience...</option>
                  {(character.companion?.experiences || []).map(exp => (
                    <option key={exp.name} value={exp.name}>{exp.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSummary = () => {
    const updates = buildUpdates();
    return (
      <div className="luw-step-content">
        <h3 className="luw-step-title">Level Up Summary</h3>
        <p className="luw-step-desc">Review your choices before applying.</p>

        <div className="luw-summary">
          <div className="luw-summary-item">
            <span className="luw-summary-label">New Level</span>
            <span className="luw-summary-value">{newLevel} (Tier {newTier})</span>
          </div>
          <div className="luw-summary-item">
            <span className="luw-summary-label">Proficiency</span>
            <span className="luw-summary-value">+{updates.proficiency}</span>
          </div>

          {isTierBoundary && newExperience.trim() && (
            <div className="luw-summary-item">
              <span className="luw-summary-label">New Experience</span>
              <span className="luw-summary-value">{newExperience.trim()}</span>
            </div>
          )}

          {advancements.map((key, i) => {
            const advId = key.split(':')[1];
            const opt = availableOptions.find(o => o.key === key);
            const details = advDetails[key];
            let detailText = '';
            if (advId === 'traits' && details?.traits) detailText = `: ${details.traits.join(', ')}`;
            if (advId === 'experiences' && details?.experiences) detailText = `: ${details.experiences.join(', ')}`;
            if (advId === 'domainCard' && details?.card) detailText = `: ${details.card}`;
            if (advId === 'multiclass') detailText = `: ${mcClass} (${mcSubclass})`;
            return (
              <div key={i} className="luw-summary-item">
                <span className="luw-summary-label">Advancement {i + 1}</span>
                <span className="luw-summary-value">{opt?.label}{detailText}</span>
              </div>
            );
          })}

          {freeDomainCard && (
            <div className="luw-summary-item">
              <span className="luw-summary-label">New Domain Card</span>
              <span className="luw-summary-value">{freeDomainCard}</span>
            </div>
          )}

          {companionUpgrade && (
            <div className="luw-summary-item">
              <span className="luw-summary-label">Companion Upgrade</span>
              <span className="luw-summary-value">
                {COMPANION_UPGRADES.find(u => u.id === companionUpgrade)?.name}
                {companionUpgradeDetail && ` (${companionUpgradeDetail})`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (!currentStep) return null;
    switch (currentStep.id) {
      case 'achievements': return renderAchievements();
      case 'advancements': return renderAdvancements();
      case 'domainCard': return renderDomainCard();
      case 'companion': return renderCompanion();
      case 'summary': return renderSummary();
      default: return null;
    }
  };

  // Portal to <body>: ancestor transforms/filters in the app shell would
  // otherwise re-anchor this "fixed" overlay and strand it off-viewport on
  // phones. Server rendering (smoke tests) has no document — render inline.
  const overlay = (
    <div className="luw-overlay" onClick={onClose}>
      <div className="luw-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="luw-header">
          <h2 className="luw-title">Level Up to {newLevel}</h2>
          <button className="luw-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Progress */}
        <div className="luw-progress">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`luw-progress-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => i < step && setStep(i)}
            >
              <span className="luw-progress-num">{i + 1}</span>
              <span className="luw-progress-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="luw-body">
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="luw-footer">
          <button
            className="luw-btn luw-btn-secondary"
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
          >
            <ChevronLeft size={16} />
            {step > 0 ? 'Back' : 'Cancel'}
          </button>

          {isLastStep ? (
            <button className="luw-btn luw-btn-primary" onClick={handleComplete}>
              <Check size={16} /> Apply Level Up
            </button>
          ) : (
            <button
              className="luw-btn luw-btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
