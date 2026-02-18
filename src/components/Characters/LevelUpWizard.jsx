import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import {
  CLASSES, SUBCLASSES, DOMAINS, ADVANCEMENT_OPTIONS,
  getBaseProficiency, getTierForLevel, getAdvancementTier
} from '../../data/systems/daggerheart';
import { getCardsForCharacter, getCardsForMulticlass, getCardByName } from '../../data/daggerheartDomainCards';
import { COMPANION_UPGRADES, EXAMPLE_COMPANION_EXPERIENCES } from '../../data/daggerheartCompanion';
import './LevelUpWizard.css';

const TRAIT_NAMES = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

const TIER_BOUNDARY_LEVELS = { 2: 2, 3: 5, 4: 8 };

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

  // Level history to track how many times each advancement has been picked this tier
  const levelHistory = character.levelHistory || [];
  const tierHistory = levelHistory.filter(lh => getTierForLevel(lh.level) === newTier);

  const usedSlots = useMemo(() => {
    const counts = {};
    tierHistory.forEach(lh => {
      (lh.advancements || []).forEach(adv => {
        counts[adv.id] = (counts[adv.id] || 0) + 1;
      });
    });
    return counts;
  }, [tierHistory]);

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
      list.push({ type: 'experience', label: 'Gain a new Experience' });
      list.push({ type: 'proficiency', label: `Proficiency increases to +${getBaseProficiency(newLevel)}` });
      if (newTier >= 3) {
        list.push({ type: 'clearMarks', label: 'Clear all trait marks (allows re-upgrading traits)' });
      }
    }
    return list;
  }, [newLevel, newTier, isTierBoundary]);

  // Available advancement options
  const availableOptions = useMemo(() => {
    if (!tierKey) return [];
    const options = ADVANCEMENT_OPTIONS[tierKey] || [];
    return options.map(opt => {
      const used = usedSlots[opt.id] || 0;
      const remaining = opt.slots - used;
      // Subclass upgrade / multiclass exclusivity
      let crossedOut = false;
      if (opt.id === 'subclassUpgrade' && hasMulticlass) crossedOut = true;
      if (opt.id === 'multiclass' && (currentSubclassLevel !== 'foundation' || hasMulticlass)) crossedOut = true;
      // Check subclass upgrade availability
      if (opt.id === 'subclassUpgrade') {
        const nextLevel = currentSubclassLevel === 'foundation' ? 'specialization' :
          currentSubclassLevel === 'specialization' ? 'mastery' : null;
        if (!nextLevel) crossedOut = true;
      }
      return { ...opt, used, remaining, crossedOut };
    });
  }, [tierKey, usedSlots, hasMulticlass, currentSubclassLevel]);

  // Total slots used by current picks
  const totalAdvancementCost = advancements.reduce((sum, a) => {
    const opt = availableOptions.find(o => o.id === a);
    return sum + (opt?.cost || 1);
  }, 0);

  const canAddAdvancement = (optId) => {
    const opt = availableOptions.find(o => o.id === optId);
    if (!opt || opt.crossedOut || opt.remaining <= 0) return false;
    const alreadyPicked = advancements.filter(a => a === optId).length;
    if (alreadyPicked >= opt.remaining) return false;
    if (totalAdvancementCost + opt.cost > 2) return false;
    return true;
  };

  const toggleAdvancement = (optId) => {
    const idx = advancements.indexOf(optId);
    if (idx >= 0) {
      const newAdv = [...advancements];
      newAdv.splice(idx, 1);
      setAdvancements(newAdv);
      const newDetails = { ...advDetails };
      delete newDetails[optId];
      setAdvDetails(newDetails);
    } else if (canAddAdvancement(optId)) {
      setAdvancements([...advancements, optId]);
    }
  };

  // Available domain cards for free pick
  const availableDomainCards = useMemo(() => {
    const primaryDomain = character.primaryDomain || '';
    const secondaryDomain = character.secondaryDomain || '';
    const existing = new Set(character.domainCards || []);
    let cards = getCardsForCharacter(primaryDomain, secondaryDomain, newLevel)
      .filter(c => !existing.has(c.name));
    // If multiclassed, also include multiclass domain cards
    if (character.multiclass?.domain) {
      const mcCards = getCardsForMulticlass(character.multiclass.domain, newLevel)
        .filter(c => !existing.has(c.name));
      cards = [...cards, ...mcCards];
    }
    return cards;
  }, [character, newLevel]);

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

  // Validation for each step
  const canProceed = () => {
    if (!currentStep) return false;
    switch (currentStep.id) {
      case 'achievements':
        return !isTierBoundary || newExperience.trim().length > 0;
      case 'advancements':
        return totalAdvancementCost === 2;
      case 'domainCard':
        return true; // Free card is optional
      case 'companion':
        return true; // Optional
      case 'summary':
        return true;
      default:
        return true;
    }
  };

  // Build the final update object
  const buildUpdates = () => {
    const updates = {};
    const newLevelEntry = {
      level: newLevel,
      tier: newTier,
      achievements: achievements.map(a => a.type),
      advancements: advancements.map(id => ({
        id,
        details: advDetails[id] || {}
      })),
      domainCard: freeDomainCard,
      companionUpgrade: companionUpgrade,
    };

    // Base level update
    updates.level = newLevel;
    updates.proficiency = getBaseProficiency(newLevel);
    updates.levelHistory = [...levelHistory, newLevelEntry];

    // Achievements
    if (isTierBoundary && newExperience.trim()) {
      updates.experiences = [...(character.experiences || []), newExperience.trim()];
    }
    if (isTierBoundary && newTier >= 3) {
      updates.markedTraits = []; // Clear marks
    }

    // Apply advancements
    advancements.forEach(advId => {
      const details = advDetails[advId] || {};
      switch (advId) {
        case 'traits': {
          const traits = { ...(character.traits || {}) };
          const marked = [...(updates.markedTraits || character.markedTraits || [])];
          (details.traits || []).forEach(t => {
            traits[t] = (traits[t] || 0) + 1;
            if (!marked.includes(t)) marked.push(t);
          });
          updates.traits = traits;
          updates.markedTraits = marked;
          break;
        }
        case 'hp': {
          const current = character.hpSlots || [true, true, true, true, true, true];
          updates.hpSlots = [...current, true];
          break;
        }
        case 'stress': {
          const current = character.stressSlots || [false, false, false, false, false, false];
          updates.stressSlots = [...current, false];
          break;
        }
        case 'evasion': {
          updates.baseEvasionBonus = (character.baseEvasionBonus || 0) + 1;
          break;
        }
        case 'experiences': {
          // +1 to two existing experiences — tracked via experienceBoosts
          const boosts = { ...(character.experienceBoosts || {}) };
          (details.experiences || []).forEach(exp => {
            boosts[exp] = (boosts[exp] || 0) + 1;
          });
          updates.experienceBoosts = boosts;
          break;
        }
        case 'subclassUpgrade': {
          const next = currentSubclassLevel === 'foundation' ? 'specialization' : 'mastery';
          updates.subclassLevel = next;
          break;
        }
        case 'proficiency': {
          updates.proficiency = (updates.proficiency || getBaseProficiency(newLevel)) + 1;
          break;
        }
        case 'multiclass': {
          updates.multiclass = {
            class: mcClass,
            subclass: mcSubclass,
            domain: mcDomain,
          };
          break;
        }
        default:
          break;
      }
    });

    // Free domain card
    if (freeDomainCard) {
      updates.domainCards = [...(character.domainCards || []), freeDomainCard];
    }

    // Domain card from advancement
    if (advancements.includes('domainCard') && advDetails.domainCard?.card) {
      const cards = updates.domainCards || [...(character.domainCards || [])];
      if (!cards.includes(advDetails.domainCard.card)) {
        updates.domainCards = [...cards, advDetails.domainCard.card];
      }
    }

    // Companion upgrade
    if (isBeastbound && companionUpgrade && character.companion) {
      const comp = { ...character.companion };
      comp.upgrades = [...(comp.upgrades || []), companionUpgrade];
      if (companionUpgrade === 'intelligent' && companionUpgradeDetail) {
        comp.upgradeDetails = { ...(comp.upgradeDetails || {}), intelligent: companionUpgradeDetail };
      }
      updates.companion = comp;
    }

    return updates;
  };

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
    const markedTraits = advDetails.traits?.traits || [];

    return (
      <div className="luw-step-content">
        <h3 className="luw-step-title">Choose Advancements ({totalAdvancementCost}/2 slots)</h3>
        <p className="luw-step-desc">Pick advancements that use a total of 2 slots.</p>

        <div className="luw-options-list">
          {availableOptions.map(opt => {
            const picked = advancements.includes(opt.id);
            const disabled = opt.crossedOut || (!picked && !canAddAdvancement(opt.id));

            return (
              <div key={opt.id} className={`luw-option ${picked ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${opt.crossedOut ? 'crossed-out' : ''}`}>
                <button
                  className="luw-option-btn"
                  onClick={() => !opt.crossedOut && toggleAdvancement(opt.id)}
                  disabled={disabled && !picked}
                >
                  <div className="luw-option-header">
                    <span className="luw-option-label">{opt.label}</span>
                    <span className="luw-option-meta">
                      Cost: {opt.cost} | {opt.remaining - (picked ? 1 : 0)} left
                    </span>
                  </div>
                </button>

                {/* Detail inputs for selected options */}
                {picked && opt.id === 'traits' && (
                  <div className="luw-detail-panel">
                    <label className="luw-label">Pick 2 unmarked traits to increase by +1:</label>
                    <div className="luw-trait-picks">
                      {TRAIT_NAMES.map(t => {
                        const isMarked = (character.markedTraits || []).includes(t);
                        const isSelected = markedTraits.includes(t);
                        return (
                          <button
                            key={t}
                            className={`luw-trait-btn ${isSelected ? 'selected' : ''} ${isMarked ? 'marked' : ''}`}
                            disabled={isMarked && !isSelected}
                            onClick={() => {
                              let traits;
                              if (isSelected) {
                                traits = markedTraits.filter(x => x !== t);
                              } else if (markedTraits.length < 2) {
                                traits = [...markedTraits, t];
                              } else {
                                return;
                              }
                              setAdvDetails({ ...advDetails, traits: { traits } });
                            }}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                            {isMarked && !isSelected && ' (marked)'}
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
                        const isSelected = (advDetails.experiences?.experiences || []).includes(exp);
                        return (
                          <button
                            key={exp}
                            className={`luw-trait-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              const current = advDetails.experiences?.experiences || [];
                              let exps;
                              if (isSelected) {
                                exps = current.filter(x => x !== exp);
                              } else if (current.length < 2) {
                                exps = [...current, exp];
                              } else {
                                return;
                              }
                              setAdvDetails({ ...advDetails, experiences: { experiences: exps } });
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
                    <label className="luw-label">Pick a domain card:</label>
                    <select
                      className="luw-select"
                      value={advDetails.domainCard?.card || ''}
                      onChange={(e) => setAdvDetails({ ...advDetails, domainCard: { card: e.target.value } })}
                    >
                      <option value="">Select a card...</option>
                      {availableDomainCards.map(c => (
                        <option key={c.name} value={c.name}>{c.name} (Lv {c.level} {c.domain})</option>
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

  const renderDomainCard = () => (
    <div className="luw-step-content">
      <h3 className="luw-step-title">Free Domain Card</h3>
      <p className="luw-step-desc">Pick one domain card at level {newLevel} or lower from your accessible domains.</p>
      <div className="luw-card-grid">
        {availableDomainCards.map(card => (
          <button
            key={card.name}
            className={`luw-card-option ${freeDomainCard === card.name ? 'selected' : ''}`}
            onClick={() => setFreeDomainCard(freeDomainCard === card.name ? null : card.name)}
          >
            <div className="luw-card-header">
              <span className="luw-card-name">{card.name}</span>
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
            <span className="luw-summary-value">+{updates.proficiency || getBaseProficiency(newLevel)}</span>
          </div>

          {isTierBoundary && newExperience.trim() && (
            <div className="luw-summary-item">
              <span className="luw-summary-label">New Experience</span>
              <span className="luw-summary-value">{newExperience.trim()}</span>
            </div>
          )}

          {advancements.map((advId, i) => {
            const opt = availableOptions.find(o => o.id === advId);
            const details = advDetails[advId];
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
              <span className="luw-summary-label">Free Domain Card</span>
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

  return (
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
}
