import { useRef, useState } from 'react';
import { getCardByName } from '../../../data/daggerheartDomainCards';
import { extractCardDice } from '../../../utils/daggerheartRollUtils';
import { RollResultBanner } from '../../../dice';

const DOMAIN_COLORS = {
  Sage: '#22c55e', Arcana: '#a78bfa', Blade: '#f5c543', Bone: '#94a3b8',
  Codex: '#60a5fa', Grace: '#f472b6', Midnight: '#7c3aed', Splendor: '#fbbf24',
  Valor: '#ef4444',
};
const DOMAIN_GLYPHS = {
  Sage: '🌿', Arcana: '✦', Blade: '⚔', Bone: '☠', Codex: '📜',
  Grace: '✿', Midnight: '☾', Splendor: '☀', Valor: '⚜',
};

function RollPill({ label, formula, onClick, kind }) {
  const colorMap = { weapon: '#f5c543', spell: '#a78bfa', stat: '#60a5fa', generic: '#eab308' };
  const c = colorMap[kind] || colorMap.generic;
  return (
    <button onClick={onClick} className="lrp-roll-pill"
      style={{ background: `linear-gradient(180deg, ${c}22, ${c}11)`, border: `1px solid ${c}55`, color: c }}>
      <span style={{ fontSize: 14 }}>🎲</span>
      <span>{label}</span>
      {formula && <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85, fontWeight: 600 }}>{formula}</span>}
    </button>
  );
}

export default function SpellsTab({ character, roll, rollDamage, campaignId }) {
  const [openCard, setOpenCard] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const timerRef = useRef(null);

  const cardNames = character.domainCards || [];
  const cards = cardNames.map(n => getCardByName(n)).filter(Boolean);

  // First 3 cards in loadout, rest in vault
  const loadout = cards.slice(0, 3);
  const vault = cards.slice(3);

  const domains = [character.primaryDomain, character.secondaryDomain].filter(Boolean);

  const showResult = (doc) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLastRoll(doc);
    timerRef.current = setTimeout(() => setLastRoll(null), 6000);
  };

  const handleSpellRoll = async (card) => {
    if (!campaignId) return;
    const traits = character.traits || {};
    const best = Object.entries(traits).reduce((a, b) => b[1] > a[1] ? b : a, ['knowledge', 0]);
    const doc = await roll({ label: `${card.name} (Spellcast)`, modifier: best[1] });
    if (doc) showResult(doc);
  };

  const handleDiceRoll = async (card, parsed) => {
    if (!campaignId || !parsed) return;
    const doc = await rollDamage({ label: card.name, ...parsed });
    if (doc) showResult(doc);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {lastRoll && (
        <div className="lrp-roll-overlay">
          <RollResultBanner roll={lastRoll} />
        </div>
      )}

      {/* Domain chips */}
      <div>
        <div className="lrp-section-label">Domains</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {domains.map(d => {
            const c = DOMAIN_COLORS[d] || '#a78bfa';
            return (
              <div key={d} style={{
                flex: 1, padding: '12px 10px', borderRadius: 12,
                background: `linear-gradient(180deg, ${c}33, ${c}11)`,
                border: `1px solid ${c}55`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{DOMAIN_GLYPHS[d] || '✦'}</div>
                <div style={{ fontSize: 10, color: '#fdf6dc', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {d}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loadout */}
      {loadout.length > 0 && (
        <div>
          <div className="lrp-section-label">Loadout — {loadout.length} cards</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadout.map(card => {
              const dc = DOMAIN_COLORS[card.domain] || '#a78bfa';
              const glyph = DOMAIN_GLYPHS[card.domain] || '✦';
              const isOpen = openCard === card.name;
              const diceParsed = extractCardDice(card.description);
              return (
                <div key={card.name} className="lrp-spell-card"
                  style={{ background: `linear-gradient(165deg, ${dc}22 0%, rgba(20,15,40,0.7) 70%)`, border: `1px solid ${dc}44` }}>
                  <div onClick={() => setOpenCard(isOpen ? null : card.name)} style={{ padding: 14, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{glyph}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fdf6dc' }}>{card.name}</span>
                        </div>
                        <div style={{ fontSize: 9, color: dc, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginTop: 6 }}>
                          {card.domain} · Lv {card.level} · {card.type}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', fontWeight: 700 }}>RECALL</span>
                        <span className="lrp-cinzel" style={{ fontSize: 12, color: '#eab308', fontWeight: 800 }}>1</span>
                      </div>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 14px 14px' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5, marginBottom: 10 }}>
                        {card.description}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {card.type === 'Spell' && (
                          <RollPill kind="spell" label="Spellcast" onClick={() => handleSpellRoll(card)} />
                        )}
                        {diceParsed && (
                          <RollPill kind="spell" label="Roll"
                            formula={`${diceParsed.quantity}d${diceParsed.dieType}${diceParsed.modifier ? `+${diceParsed.modifier}` : ''}`}
                            onClick={() => handleDiceRoll(card, diceParsed)} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vault */}
      {vault.length > 0 && (
        <div>
          <div className="lrp-section-label">Vault — {vault.length} cards</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vault.map(card => (
              <div key={card.name} style={{
                padding: '10px 12px', borderRadius: 10, opacity: 0.55,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{card.name}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Lv {card.level} · {card.domain}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0', fontSize: 13 }}>
          No domain cards selected yet.
        </div>
      )}
    </div>
  );
}
