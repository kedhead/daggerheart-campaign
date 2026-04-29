import { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, Skull, Swords, Heart, Zap, Target, ChevronDown, ChevronUp, ImageIcon, Wand2, Loader2 } from 'lucide-react';
import './AdversariesView.css';
import { useDice, parseDamageNotation } from '../../dice';

export default function AdversaryCard({
  adversary,
  onEdit,
  onDelete,
  onGenerateImage,
  isDM,
  compact = false,
  campaignId
}) {
  const [expanded, setExpanded] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { rollDamage } = useDice(campaignId);

  const tierColors = {
    1: '#22c55e', // green
    2: '#eab308', // yellow
    3: '#f97316', // orange
    4: '#ef4444'  // red
  };

  const roleIcons = {
    bruiser: '💪',
    skulk: '🗡️',
    social: '🎭',
    solo: '👹',
    leader: '👑',
    support: '✨',
    horde: '🐀',
    ranged: '🏹'
  };

  const handleGenerateImage = async () => {
    if (!onGenerateImage) return;
    setGeneratingImage(true);
    try {
      await onGenerateImage(adversary);
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className={`adversary-card ${compact ? 'compact' : ''} ${adversary.hidden ? 'hidden-card' : ''}`}>
      <div className="adversary-header" onClick={() => !compact && setExpanded(!expanded)}>
        {/* Image or placeholder */}
        <div className="adversary-image">
          {adversary.imageUrl ? (
            <img src={adversary.imageUrl} alt={adversary.name} />
          ) : (
            <div className="adversary-image-placeholder">
              <Skull size={24} />
            </div>
          )}
        </div>

        <div className="adversary-info">
          <div className="adversary-name-row">
            <h3>{adversary.name}</h3>
            {adversary.hidden && (
              <span className="hidden-badge" title="Hidden from players">
                <EyeOff size={14} />
              </span>
            )}
          </div>

          <div className="adversary-meta">
            <span
              className="tier-badge"
              style={{ backgroundColor: tierColors[adversary.tier] || tierColors[1] }}
            >
              T{adversary.tier}
            </span>
            <span className="role-badge">
              {roleIcons[adversary.role] || '⚔️'} {adversary.role || 'unknown'}
            </span>
          </div>

          <p className="adversary-description">{adversary.description}</p>
        </div>

        {!compact && (
          <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>

      {/* Stats row - always visible */}
      <div className="adversary-stats">
        <div className="stat" title="Difficulty">
          <Target size={14} />
          <span>{adversary.difficulty}</span>
        </div>
        <div className="stat" title="HP">
          <Heart size={14} />
          <span>{adversary.hp}</span>
        </div>
        <div className="stat" title="Stress">
          <Zap size={14} />
          <span>{adversary.stress}</span>
        </div>
        <div className="stat" title="Damage Thresholds (Minor / Major)">
          <Swords size={14} />
          <span>Min {adversary.thresholds?.minor} · Maj {adversary.thresholds?.major}</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && !compact && (
        <div className="adversary-details">
          {adversary.motives && (
            <div className="detail-section">
              <strong>Motives:</strong> {adversary.motives}
            </div>
          )}

          {(adversary.attack !== undefined || adversary.attackDamage) && (
            <div className="detail-section">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.4rem' }}>
                <strong>Attack:</strong>
                {adversary.attack !== undefined && <span>+{adversary.attack}</span>}
                {adversary.attackName && <span>{adversary.attackName}</span>}
                {adversary.attackRange && <span style={{ opacity: 0.6 }}>({adversary.attackRange})</span>}
                {adversary.attackDamage && (
                  <span style={{ fontFamily: 'monospace' }}>{adversary.attackDamage}</span>
                )}
              </div>
              {campaignId && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {adversary.attack !== undefined && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        rollDamage({ label: `${adversary.name} Attack`, dieType: 20, quantity: 1, modifier: adversary.attack || 0 });
                      }}
                    >
                      Roll Attack (d20)
                    </button>
                  )}
                  {adversary.attackDamage && parseDamageNotation(adversary.attackDamage) && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const parsed = parseDamageNotation(adversary.attackDamage);
                        rollDamage({ label: `${adversary.name} Damage`, ...parsed });
                      }}
                    >
                      Roll Damage
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {adversary.thresholds && (
            <div className="detail-section">
              <strong>Damage Thresholds: </strong>
              Minor <strong>{adversary.thresholds.minor}</strong>
              {' · '}
              Major <strong>{adversary.thresholds.major}</strong>
              {' · '}
              Severe <strong>{adversary.thresholds.severe}</strong>
            </div>
          )}

          {adversary.experience && (
            <div className="detail-section">
              <strong>Experience:</strong> {adversary.experience}
            </div>
          )}

          {adversary.features && adversary.features.length > 0 && (
            <div className="detail-section features-section">
              <strong>Features:</strong>
              <ul className="features-list">
                {adversary.features.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <span className="feature-name">
                      {feature.name}
                      {feature.type && feature.type !== 'passive' && (
                        <span className="feature-type">({feature.type})</span>
                      )}
                    </span>
                    <span className="feature-desc">{feature.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isDM && (
        <div className="adversary-actions">
          {onGenerateImage && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleGenerateImage}
              disabled={generatingImage}
              title="Generate AI image"
            >
              {generatingImage ? <Loader2 size={14} className="spinner" /> : <Wand2 size={14} />}
            </button>
          )}
          {onEdit && (
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(adversary)} title="Edit">
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button className="btn btn-ghost btn-sm btn-danger" onClick={() => onDelete(adversary.id)} title="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
