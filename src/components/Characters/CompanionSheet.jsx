import { useState, useMemo } from 'react';
import { Heart, Shield, Swords, Star } from 'lucide-react';
import { COMPANION_UPGRADES } from '../../data/daggerheartCompanion';
import './CompanionSheet.css';

export default function CompanionSheet({ character, canEdit, updateCharacter }) {
  const companion = character.companion;
  if (!companion) return null;

  const stressSlots = companion.stressSlots || [false, false, false, false, false, false];
  const experiences = companion.experiences || [];
  const upgrades = companion.upgrades || [];
  const upgradeDetails = companion.upgradeDetails || {};

  const handleStressToggle = (index) => {
    if (!canEdit || !updateCharacter) return;
    const newSlots = [...stressSlots];
    newSlots[index] = !newSlots[index];
    const updatedCompanion = { ...companion, stressSlots: newSlots };
    updateCharacter(character.id, { companion: updatedCompanion });
  };

  const stressFilledCount = stressSlots.filter(Boolean).length;

  // Compute effective stats from upgrades
  const evasionBonus = upgrades.filter(u => u === 'aware').length * 2;
  const effectiveEvasion = (companion.evasion || 10) + evasionBonus;

  const upgradeInfos = useMemo(() =>
    upgrades.map(id => COMPANION_UPGRADES.find(u => u.id === id)).filter(Boolean),
    [upgrades]
  );

  return (
    <div className="cs-panel">
      {/* Identity */}
      <div className="cs-identity">
        {companion.avatarUrl && (
          <img src={companion.avatarUrl} alt={companion.name} className="cs-avatar" />
        )}
        <div>
          <div className="cs-name">{companion.name || 'Unnamed Companion'}</div>
          <div className="cs-type">{companion.type || 'Animal Companion'}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="cs-stats-row">
        <div className="cs-stat-box cs-stat-evasion">
          <div className="cs-stat-value">{effectiveEvasion}</div>
          <div className="cs-stat-label">Evasion</div>
        </div>
        <div className="cs-stat-box">
          <div className="cs-stat-value">{companion.damageDie || 'd6'}</div>
          <div className="cs-stat-label">Damage</div>
        </div>
        <div className="cs-stat-box">
          <div className="cs-stat-value">{companion.range || 'Melee'}</div>
          <div className="cs-stat-label">Range</div>
        </div>
      </div>

      {/* Attack description */}
      {companion.attackDescription && (
        <div className="cs-attack">
          <Swords size={14} />
          <span>{companion.attackDescription}</span>
        </div>
      )}

      {/* Stress slots */}
      <div className="cs-section">
        <div className="cs-section-header">
          <span className="cs-section-label">Stress</span>
          <span className="cs-section-count">{stressFilledCount}/{stressSlots.length}</span>
        </div>
        <div className="cs-stress-slots">
          {stressSlots.map((filled, i) => (
            <button
              key={i}
              className={`cs-slot ${filled ? 'filled' : ''}`}
              onClick={() => handleStressToggle(i)}
              disabled={!canEdit}
            />
          ))}
        </div>
      </div>

      {/* Experiences */}
      {experiences.length > 0 && (
        <div className="cs-section">
          <div className="cs-section-label">Experiences</div>
          <div className="cs-experiences">
            {experiences.map((exp, i) => (
              <div key={i} className="cs-experience">
                <span className="cs-experience-name">{exp.name}</span>
                <span className="cs-experience-mod">+{exp.modifier || 2}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training (upgrades) */}
      {upgradeInfos.length > 0 && (
        <div className="cs-section">
          <div className="cs-section-label">Training</div>
          <div className="cs-upgrades">
            {upgradeInfos.map((u, i) => (
              <div key={i} className="cs-upgrade">
                <div className="cs-upgrade-name">{u.name}</div>
                <div className="cs-upgrade-desc">{u.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spellcast info */}
      <div className="cs-spellcast">
        Command with Agility Spellcast Roll
      </div>
    </div>
  );
}
