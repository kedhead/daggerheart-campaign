import { useState } from 'react';
import { Edit3, Trash2, ExternalLink, Dices, Zap, Minus, Plus, Crosshair, Backpack, Sparkles, ScrollText } from 'lucide-react';
import { ATTRIBUTES, WOUND_LEVELS, parseDiceCode } from '../../data/systems/starwarsd6';
import { useDice } from '../../dice';
import './StarWarsD6CharacterSheet.css';

const FORCE_SKILLS = ['control', 'sense', 'alter'];

// One rollable dice-code chip. Renders as plain text when the code can't be
// parsed or there's no campaign to publish rolls into.
function DiceCode({ code, label, onRoll, rolling }) {
  const parsed = parseDiceCode(code);
  if (!code) return <span className="sw-dice-code sw-dice-empty">—</span>;
  if (!parsed || !onRoll) return <span className="sw-dice-code">{code}</span>;
  return (
    <button
      type="button"
      className={`sw-dice-code sw-dice-rollable ${rolling ? 'sw-roll-flash' : ''}`}
      onClick={() => onRoll(parsed, label)}
      title={`Roll ${label} (${code})`}
    >
      {code}
      <Dices size={11} className="sw-dice-icon" />
    </button>
  );
}

export default function StarWarsD6CharacterSheet({
  character,
  onEdit,
  onDelete,
  isDM,
  canEdit,
  campaign,
  updateCharacter,
}) {
  const sd = character.systemData || {};
  const attributes = sd.attributes || {};
  const weapons = sd.weapons || [];
  const forceSkills = sd.forceSkills || {};
  const { rollD6Pool } = useDice(campaign?.id);
  const [rollingKey, setRollingKey] = useState(null);
  const canRoll = !!campaign?.id;
  const canQuickEdit = canEdit && typeof updateCharacter === 'function';

  const updateSystemData = (patch) => {
    if (!canQuickEdit) return;
    updateCharacter(character.id, { systemData: { ...sd, ...patch } });
  };

  const handleRoll = (key) => async (parsed, label) => {
    if (!canRoll) return;
    setRollingKey(key);
    try {
      await rollD6Pool({
        count: parsed.dice,
        modifier: parsed.pips,
        label: `${character.name} · ${label}`,
      });
    } catch (err) {
      console.error('[StarWarsD6CharacterSheet] roll failed:', err);
    } finally {
      setTimeout(() => setRollingKey(null), 600);
    }
  };

  const stepPoints = (field, delta, min = 0, max = 99) => {
    const current = parseInt(sd[field], 10) || 0;
    const next = Math.max(min, Math.min(max, current + delta));
    if (next !== current) updateSystemData({ [field]: next });
  };

  const woundStatus = sd.woundStatus || '';
  const woundIndex = WOUND_LEVELS.findIndex((w) => w.value === woundStatus);

  const setWound = (value) => {
    updateSystemData({ woundStatus: woundStatus === value ? '' : value });
  };

  const darkSide = parseInt(sd.darkSidePoints, 10) || 0;

  const bioPairs = [
    ['Species', sd.species],
    ['Sex', sd.sex],
    ['Age', sd.age],
    ['Height', sd.height],
    ['Weight', sd.weight],
  ].filter(([, v]) => v);

  const storyBlocks = [
    ['Physical Description', sd.physicalDescription],
    ['Personality', sd.personality],
    ['Objectives', sd.objectives],
    ['A Quote', sd.quote, true],
    ['Connections With Other Characters', sd.connections],
    ['Background', character.backstory],
  ].filter(([, v]) => v);

  return (
    <div className="sw-sheet">
      {/* ===== Title bar ===== */}
      <div className="sw-titlebar">
        <span className="sw-titlebar-brand">Star Wars</span>
        <span className="sw-titlebar-label">Character Sheet</span>
        <div className="sw-titlebar-actions">
          {sd.characterSheetLink && (
            <a
              href={sd.characterSheetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="sw-icon-btn"
              title="External character sheet"
            >
              <ExternalLink size={15} />
            </a>
          )}
          {canEdit && (
            <>
              <button className="sw-icon-btn" onClick={() => onEdit(character)} title="Edit character">
                <Edit3 size={15} />
              </button>
              <button
                className="sw-icon-btn sw-icon-danger"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${character.name}?`)) {
                    onDelete(character.id);
                  }
                }}
                title="Delete character"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== Identity header ===== */}
      <div className="sw-header">
        <div className="sw-portrait">
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} />
          ) : (
            <span className="sw-portrait-placeholder">
              {(character.name || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="sw-identity">
          <div className="sw-name-row">
            <h2 className="sw-char-name">{character.name}</h2>
            {sd.forceSensitive && (
              <span className="sw-force-badge">
                <Zap size={12} /> Force Sensitive
              </span>
            )}
          </div>
          <div className="sw-identity-sub">
            {sd.template && <span className="sw-template">{sd.template}</span>}
            {character.playerName && (
              <span className="sw-player">Played by {character.playerName}</span>
            )}
          </div>
          {bioPairs.length > 0 && (
            <div className="sw-bio-row">
              {bioPairs.map(([label, value]) => (
                <div key={label} className="sw-bio-item">
                  <span className="sw-bio-label">{label}</span>
                  <span className="sw-bio-value">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vital stats block (Move / points) */}
        <div className="sw-vitals">
          <div className="sw-vital">
            <span className="sw-vital-label">Move</span>
            <span className="sw-vital-value">{sd.move || '10'}</span>
          </div>
          {[
            ['forcePoints', 'Force Pts'],
            ['characterPoints', 'Char. Pts'],
          ].map(([field, label]) => (
            <div key={field} className="sw-vital">
              <span className="sw-vital-label">{label}</span>
              <span className="sw-vital-value sw-vital-stepper">
                {canQuickEdit && (
                  <button className="sw-step-btn" onClick={() => stepPoints(field, -1)} title={`Spend a ${label}`}>
                    <Minus size={10} />
                  </button>
                )}
                {parseInt(sd[field], 10) || 0}
                {canQuickEdit && (
                  <button className="sw-step-btn" onClick={() => stepPoints(field, 1)} title={`Add a ${label}`}>
                    <Plus size={10} />
                  </button>
                )}
              </span>
            </div>
          ))}
          <div className="sw-vital">
            <span className="sw-vital-label">Dark Side</span>
            <span className="sw-darkside">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={!canQuickEdit}
                  className={`sw-darkside-pip ${n <= darkSide ? 'filled' : ''}`}
                  onClick={() => updateSystemData({ darkSidePoints: darkSide === n ? n - 1 : n })}
                  title={`Dark Side Points: ${n}`}
                />
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* ===== Wound track ===== */}
      <div className="sw-wounds">
        <span className="sw-section-inline-label">Condition</span>
        <div className="sw-wound-pills">
          <button
            type="button"
            disabled={!canQuickEdit}
            className={`sw-wound-pill sw-wound-healthy ${!woundStatus ? 'active' : ''}`}
            onClick={() => setWound('')}
          >
            Healthy
          </button>
          {WOUND_LEVELS.map((w, i) => (
            <button
              key={w.value}
              type="button"
              disabled={!canQuickEdit}
              className={`sw-wound-pill ${woundStatus === w.value ? 'active' : ''} ${i <= woundIndex ? 'reached' : ''}`}
              onClick={() => setWound(w.value)}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Attributes & skills ===== */}
      <div className="sw-attributes-grid">
        {ATTRIBUTES.map((attrName) => {
          const key = attrName.toLowerCase();
          const attr = attributes[key] || {};
          const skills = attr.skills || [];
          return (
            <div key={key} className="sw-attr-block">
              <div className="sw-attr-header">
                <span className="sw-attr-name">{attrName}</span>
                <DiceCode
                  code={attr.dice}
                  label={attrName}
                  onRoll={canRoll ? handleRoll(`attr-${key}`) : null}
                  rolling={rollingKey === `attr-${key}`}
                />
              </div>
              <div className="sw-skill-list">
                {skills.length === 0 && (
                  <div className="sw-skill-row sw-skill-empty">No skills yet</div>
                )}
                {skills.map((skill, i) => (
                  <div key={`${skill.name}-${i}`} className="sw-skill-row">
                    <span className="sw-skill-name">{skill.name}</span>
                    <span className="sw-skill-dots" />
                    <DiceCode
                      code={skill.dice}
                      label={skill.name}
                      onRoll={canRoll ? handleRoll(`skill-${key}-${i}`) : null}
                      rolling={rollingKey === `skill-${key}-${i}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Force skills ===== */}
      {sd.forceSensitive && FORCE_SKILLS.some((f) => forceSkills[f]) && (
        <div className="sw-panel sw-force-panel">
          <div className="sw-panel-header">
            <Zap size={13} />
            <span>Force Skills</span>
          </div>
          <div className="sw-force-skills">
            {FORCE_SKILLS.filter((f) => forceSkills[f]).map((f) => (
              <div key={f} className="sw-force-skill">
                <span className="sw-skill-name">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                <DiceCode
                  code={forceSkills[f]}
                  label={f.charAt(0).toUpperCase() + f.slice(1)}
                  onRoll={canRoll ? handleRoll(`force-${f}`) : null}
                  rolling={rollingKey === `force-${f}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Weapons ===== */}
      {weapons.length > 0 && (
        <div className="sw-panel">
          <div className="sw-panel-header">
            <Crosshair size={13} />
            <span>Weapons</span>
          </div>
          <div className="sw-table-scroll">
            <table className="sw-weapons-table">
              <thead>
                <tr>
                  <th>Weapon</th>
                  <th>Damage</th>
                  <th>Difficulty</th>
                  <th>Short</th>
                  <th>Medium</th>
                  <th>Long</th>
                  <th>Ammo</th>
                </tr>
              </thead>
              <tbody>
                {weapons.map((w, i) => (
                  <tr key={`${w.name}-${i}`}>
                    <td className="sw-weapon-name">{w.name}</td>
                    <td>
                      <DiceCode
                        code={w.damage}
                        label={`${w.name} damage`}
                        onRoll={canRoll ? handleRoll(`weapon-${i}`) : null}
                        rolling={rollingKey === `weapon-${i}`}
                      />
                    </td>
                    <td>{w.difficulty || '—'}</td>
                    <td>{w.short || '—'}</td>
                    <td>{w.medium || '—'}</td>
                    <td>{w.long || '—'}</td>
                    <td>{w.ammo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Special abilities / Equipment ===== */}
      <div className="sw-panel-columns">
        {sd.specialAbilities && (
          <div className="sw-panel">
            <div className="sw-panel-header">
              <Sparkles size={13} />
              <span>Special Abilities</span>
            </div>
            <p className="sw-prose">{sd.specialAbilities}</p>
          </div>
        )}
        {(sd.equipment || sd.credits) && (
          <div className="sw-panel">
            <div className="sw-panel-header">
              <Backpack size={13} />
              <span>Equipment</span>
              {sd.credits && <span className="sw-credits">{sd.credits} credits</span>}
            </div>
            {sd.equipment && <p className="sw-prose">{sd.equipment}</p>}
          </div>
        )}
      </div>

      {/* ===== Story ===== */}
      {storyBlocks.length > 0 && (
        <div className="sw-panel">
          <div className="sw-panel-header">
            <ScrollText size={13} />
            <span>Dossier</span>
          </div>
          <div className="sw-story-grid">
            {storyBlocks.map(([label, value, isQuote]) => (
              <div key={label} className="sw-story-block">
                <span className="sw-story-label">{label}</span>
                {isQuote ? (
                  <blockquote className="sw-quote">&ldquo;{value}&rdquo;</blockquote>
                ) : (
                  <p className="sw-prose">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Player notes / DM notes ===== */}
      {sd.playerNotes && (
        <div className="sw-panel">
          <div className="sw-panel-header">
            <span>Player Notes</span>
          </div>
          <p className="sw-prose">{sd.playerNotes}</p>
        </div>
      )}
      {isDM && character.dmNotes && (
        <div className="sw-panel sw-dm-panel">
          <div className="sw-panel-header">
            <span>DM Notes (Private)</span>
          </div>
          <p className="sw-prose">{character.dmNotes}</p>
        </div>
      )}
    </div>
  );
}
