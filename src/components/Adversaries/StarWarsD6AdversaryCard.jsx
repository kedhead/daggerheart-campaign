import { useState } from 'react';
import { Edit, Trash2, EyeOff, ChevronDown, ChevronUp, Wand2, Loader2, Zap } from 'lucide-react';
import './AdversariesView.css';

const CLASSIFICATION_COLORS = {
  minion:    '#64748b',
  thug:      '#22c55e',
  veteran:   '#eab308',
  elite:     '#f97316',
  legendary: '#ef4444'
};

const CLASSIFICATION_ICONS = {
  minion:    '👤',
  thug:      '🎖️',
  veteran:   '🛡️',
  elite:     '⚔️',
  legendary: '👑'
};

const AFFILIATION_LABELS = {
  empire:                 'Galactic Empire',
  rebellion:              'Rebel Alliance',
  republic:               'Galactic Republic',
  separatist:             'Separatist',
  sith:                   'Sith',
  jedi:                   'Jedi Order',
  'hutt cartel':          'Hutt Cartel',
  'bounty hunters guild': 'Bounty Hunters',
  criminal:               'Criminal',
  fringe:                 'Fringe',
  creature:               'Creature',
  droid:                  'Droid',
  neutral:                'Neutral'
};

export default function StarWarsD6AdversaryCard({
  adversary,
  onEdit,
  onDelete,
  onGenerateImage,
  isDM,
  compact = false
}) {
  const [expanded, setExpanded] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const classification = adversary.classification || 'thug';
  const color = CLASSIFICATION_COLORS[classification] || '#64748b';
  const icon = CLASSIFICATION_ICONS[classification] || '⚔️';
  const affiliation = adversary.affiliation || 'neutral';

  const handleGenerateImage = async () => {
    if (!onGenerateImage) return;
    setGeneratingImage(true);
    try {
      await onGenerateImage(adversary);
    } finally {
      setGeneratingImage(false);
    }
  };

  const attrs = adversary.attributes || {};
  const attrEntries = [
    ['DEX', attrs.dexterity],
    ['KNO', attrs.knowledge],
    ['MEC', attrs.mechanical],
    ['PER', attrs.perception],
    ['STR', attrs.strength],
    ['TEC', attrs.technical]
  ].filter(([, v]) => v && v !== '—');

  return (
    <div className={`adversary-card ${compact ? 'compact' : ''} ${adversary.hidden ? 'hidden-card' : ''}`}>
      <div className="adversary-header" onClick={() => !compact && setExpanded(!expanded)}>
        <div className="adversary-image">
          {adversary.imageUrl ? (
            <img src={adversary.imageUrl} alt={adversary.name} />
          ) : (
            <div className="adversary-image-placeholder" style={{ fontSize: '1.5rem' }}>
              {icon}
            </div>
          )}
        </div>

        <div className="adversary-info">
          <div className="adversary-name-row">
            <h3>{adversary.name}</h3>
            {adversary.forceSensitive && (
              <span
                className="role-badge"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' }}
                title="Force Sensitive"
              >
                <Zap size={12} /> Force
              </span>
            )}
            {adversary.hidden && (
              <span className="hidden-badge" title="Hidden from players">
                <EyeOff size={14} />
              </span>
            )}
          </div>

          <div className="adversary-meta">
            <span
              className="tier-badge"
              style={{ backgroundColor: color, textTransform: 'capitalize' }}
            >
              {classification}
            </span>
            <span className="role-badge" style={{ textTransform: 'capitalize' }}>
              {AFFILIATION_LABELS[affiliation] || affiliation}
            </span>
            {adversary.scale && adversary.scale !== 'character' && (
              <span className="role-badge" style={{ textTransform: 'capitalize' }}>
                {adversary.scale} scale
              </span>
            )}
          </div>

          {adversary.description && <p className="adversary-description">{adversary.description}</p>}
        </div>

        {!compact && (
          <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>

      {/* Attributes row */}
      {attrEntries.length > 0 && (
        <div className="adversary-stats" style={{ flexWrap: 'wrap' }}>
          {attrEntries.map(([label, value]) => (
            <div key={label} className="stat" title={label}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.7 }}>{label}</span>
              <span style={{ fontFamily: 'monospace' }}>{value}</span>
            </div>
          ))}
          {adversary.move != null && (
            <div className="stat" title="Move">
              <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.7 }}>MV</span>
              <span style={{ fontFamily: 'monospace' }}>{adversary.move}</span>
            </div>
          )}
        </div>
      )}

      {expanded && !compact && (
        <div className="adversary-details">
          {adversary.motives && (
            <div className="detail-section">
              <strong>Motives:</strong> {adversary.motives}
            </div>
          )}

          {adversary.skills?.length > 0 && (
            <div className="detail-section">
              <strong>Skills:</strong>{' '}
              <span style={{ fontFamily: 'monospace' }}>
                {adversary.skills.map(s => `${s.name} ${s.dice}`).join(' · ')}
              </span>
            </div>
          )}

          {adversary.forceSkills?.length > 0 && (
            <div className="detail-section">
              <strong>Force Skills:</strong>{' '}
              <span style={{ fontFamily: 'monospace' }}>
                {adversary.forceSkills.map(s => `${s.name} ${s.dice}`).join(' · ')}
              </span>
            </div>
          )}

          {adversary.weapons?.length > 0 && (
            <div className="detail-section features-section">
              <strong>Weapons:</strong>
              <ul className="features-list">
                {adversary.weapons.map((w, i) => (
                  <li key={i} className="feature-item">
                    <span className="feature-name">{w.name}</span>
                    <span className="feature-desc" style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                      {w.skill && <>Skill: {w.skill} · </>}
                      Damage: {w.damage || '—'}
                      {w.range && <> · Range: {w.range}</>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(adversary.forcePoints > 0 || adversary.darkSidePoints > 0 || adversary.characterPoints > 0) && (
            <div className="detail-section">
              {adversary.forcePoints > 0 && <><strong>Force Points:</strong> {adversary.forcePoints} · </>}
              {adversary.darkSidePoints > 0 && <><strong>Dark Side:</strong> {adversary.darkSidePoints} · </>}
              {adversary.characterPoints > 0 && <><strong>Character Points:</strong> {adversary.characterPoints}</>}
            </div>
          )}

          {adversary.specialAbilities?.length > 0 && (
            <div className="detail-section features-section">
              <strong>Special Abilities:</strong>
              <ul className="features-list">
                {adversary.specialAbilities.map((a, i) => (
                  <li key={i} className="feature-item">
                    <span className="feature-name">{a.name}</span>
                    <span className="feature-desc">{a.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {adversary.equipment?.length > 0 && (
            <div className="detail-section">
              <strong>Equipment:</strong> {adversary.equipment.join(', ')}
            </div>
          )}
        </div>
      )}

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
