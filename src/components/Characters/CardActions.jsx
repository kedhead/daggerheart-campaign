import { useMemo, useState } from 'react';
import { Sparkles, Dices, Flame, Feather, Check, RotateCcw, Minus, Plus } from 'lucide-react';
import {
  parseCardActions, diceFormula, spellcastModifier, traitModifier,
  hopeAvailable, stressAvailable, spendHope, markStress,
} from '../../utils/cardActions';
import { VITALITY_CHOICES, applyVitalityChoice } from '../../data/daggerheartAbilityEffects';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);

const btn = (accent, disabled) => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '6px 10px', minHeight: 32, borderRadius: 9,
  fontSize: '0.78rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
  background: `color-mix(in srgb, ${accent} 14%, transparent)`,
  color: disabled ? 'var(--text-dim)' : accent,
  opacity: disabled ? 0.55 : 1,
});

/**
 * The buttons a domain card's (or feature's) rules text calls for — Cast,
 * trait rolls, every dice expression, Spend Hope / Mark Stress, a "Used" toggle
 * for once-per-rest effects, and a token counter. Shared by the full sheet and
 * the Player Portal so both behave the same. Rules: utils/cardActions.js.
 *
 * @param {string} text        - the rules text
 * @param {string} useKey      - key for this card's uses/tokens (card name, or "Card · Spell")
 * @param {Function} onRoll    - (label, modifier, { reaction }) => roll a Duality roll
 * @param {Function} onDice    - (label, { quantity, dieType, modifier }) => roll dice
 * @param {Function} [updateCharacter] - (id, updates); without it costs/uses are read-only
 */
export default function CardActions({
  text, name, useKey, character, updateCharacter, onRoll, onDice,
  proficiency = 1, accent = 'var(--primary)', canRoll = true,
}) {
  const actions = useMemo(() => parseCardActions(text), [text]);
  if (actions.length === 0) return null;

  const key = useKey || name;
  const canEdit = !!updateCharacter && !!character?.id;
  const update = (u) => { if (u && canEdit) updateCharacter(character.id, u); };
  const spell = spellcastModifier(character);
  const hope = hopeAvailable(character);
  const stress = stressAvailable(character);
  const uses = character?.cardUses?.[key];
  const tokens = Number(character?.cardTokens?.[key]) || 0;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {actions.map((a, i) => {
        if (a.kind === 'spellcast') {
          if (!canRoll) return null;
          const title = spell.trait
            ? `Spellcast Roll: 2d12 ${signed(spell.modifier)} (${cap(spell.trait)})`
            : 'Spellcast Roll: your subclass has no Spellcast trait, so nothing is added';
          return (
            <button key={i} type="button" style={btn(accent)} title={title}
              onClick={() => onRoll?.(`${a.reaction ? 'Reaction' : 'Spellcast'}: ${name}`, spell.modifier, { reaction: a.reaction })}>
              <Sparkles size={13} /> {a.reaction ? 'Counter' : 'Cast'} {signed(spell.modifier)}{a.difficulty ? ` vs ${a.difficulty}` : ''}
            </button>
          );
        }
        if (a.kind === 'trait') {
          if (!canRoll) return null;
          const mod = traitModifier(character, a.trait);
          return (
            <button key={i} type="button" style={btn(accent)} title={`${cap(a.trait)} Roll: 2d12 ${signed(mod)}`}
              onClick={() => onRoll?.(`${cap(a.trait)} Roll: ${name}`, mod, {})}>
              <Dices size={13} /> {cap(a.trait)} {signed(mod)}{a.difficulty ? ` vs ${a.difficulty}` : ''}
            </button>
          );
        }
        if (a.kind === 'dice') {
          if (!canRoll) return null;
          const formula = diceFormula(a, { proficiency, spellcast: Math.max(0, spell.modifier) });
          const m = formula.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
          return (
            <button key={i} type="button" style={btn(accent)}
              title={a.scale === 'proficiency' ? 'Dice equal to your Proficiency' : a.scale === 'spellcast' ? 'Dice equal to your Spellcast trait' : undefined}
              onClick={() => m && onDice?.(`${name}${a.label ? ` — ${a.label}` : ''}`, { quantity: +m[1], dieType: +m[2], modifier: +(m[3] || 0) })}>
              <Dices size={13} /> {formula}{a.label ? ` ${a.label}` : ''}
            </button>
          );
        }
        if (a.kind === 'hope') {
          const short = hope < a.amount;
          return (
            <button key={i} type="button" style={btn('#f5c543', short || !canEdit)} disabled={short || !canEdit}
              title={short ? `You have ${hope} Hope` : `Spend ${a.amount} Hope from your track`}
              onClick={() => update(spendHope(character, a.amount))}>
              <Feather size={13} /> Spend {a.amount} Hope
            </button>
          );
        }
        if (a.kind === 'stress') {
          const full = stress < a.amount;
          return (
            <button key={i} type="button" style={btn('#f87171', full || !canEdit)} disabled={full || !canEdit}
              title={full ? `Only ${stress} Stress slot${stress === 1 ? '' : 's'} free` : `Mark ${a.amount} Stress on your track`}
              onClick={() => update(markStress(character, a.amount))}>
              <Flame size={13} /> Mark {a.amount} Stress
            </button>
          );
        }
        if (a.kind === 'uses') {
          const used = !!uses?.used;
          const setUsed = (v) => update({ cardUses: { ...(character?.cardUses || {}), [key]: { per: a.per, used: v } } });
          return (
            <button key={i} type="button" style={btn(used ? 'var(--text-muted)' : '#34d399', !canEdit)} disabled={!canEdit}
              aria-pressed={used}
              title={used
                ? (a.per === 'session' ? 'Used this session — click to reset' : `Used — refreshes on your next ${a.per === 'rest' ? 'rest' : a.per}`)
                : `Once per ${a.per} — click when you use it`}
              onClick={() => setUsed(!used)}>
              {used ? <RotateCcw size={13} /> : <Check size={13} />} {used ? `Used (per ${a.per})` : `Use (1/${a.per})`}
            </button>
          );
        }
        if (a.kind === 'tokens') {
          const set = (n) => update({ cardTokens: { ...(character?.cardTokens || {}), [key]: Math.max(0, n) } });
          return (
            <span key={i} style={{ ...btn(accent), cursor: 'default', gap: 6 }}>
              Tokens
              <button type="button" aria-label="Remove a token" disabled={!canEdit || tokens <= 0} onClick={() => set(tokens - 1)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex' }}><Minus size={13} /></button>
              <strong style={{ minWidth: 14, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{tokens}</strong>
              <button type="button" aria-label="Add a token" disabled={!canEdit} onClick={() => set(tokens + 1)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex' }}><Plus size={13} /></button>
            </span>
          );
        }
        return null;
      })}
    </div>
  );
}

/**
 * Vitality: "permanently gain two of" three benefits, then vault the card.
 * Shown on the card until the choice is made.
 */
export function VitalityChoice({ character, updateCharacter, accent = 'var(--primary)' }) {
  const [picked, setPicked] = useState([]);
  if (!updateCharacter || Array.isArray(character?.vitalityChoices)) return null;
  const toggle = (id) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : p.length < 2 ? [...p, id] : p));
  return (
    <div style={{ marginTop: 8, padding: 10, borderRadius: 10, border: `1px dashed color-mix(in srgb, ${accent} 50%, transparent)` }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>Choose 2 permanent benefits</div>
      {VITALITY_CHOICES.map(o => (
        <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', padding: '3px 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={picked.includes(o.id)} onChange={() => toggle(o.id)}
            disabled={!picked.includes(o.id) && picked.length >= 2} />
          {o.label}
        </label>
      ))}
      <button type="button" style={{ ...btn(accent, picked.length !== 2), marginTop: 6 }} disabled={picked.length !== 2}
        onClick={() => { const u = applyVitalityChoice(character, picked); if (u) updateCharacter(character.id, u); }}>
        <Check size={13} /> Apply and vault Vitality
      </button>
    </div>
  );
}
