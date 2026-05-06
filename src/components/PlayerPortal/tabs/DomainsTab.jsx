import { useState, useRef, useMemo } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Dices } from 'lucide-react';
import { getCardByName } from '../../../data/daggerheartDomainCards';
import { extractCardDice } from '../../../utils/daggerheartRollUtils';
import { RollResultBanner } from '../../../dice';

export default function DomainsTab({ character, roll, rollDamage, campaignId }) {
  const [expanded, setExpanded] = useState(new Set());
  const [rollingKey, setRollingKey] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const timerRef = useRef(null);

  const cardNames = character.domainCards || [];
  const cards = useMemo(
    () => cardNames.map(n => getCardByName(n)).filter(Boolean),
    [cardNames]
  );

  const grouped = useMemo(() => {
    const g = {};
    cards.forEach(card => {
      if (!g[card.domain]) g[card.domain] = [];
      g[card.domain].push(card);
    });
    return g;
  }, [cards]);

  const showResult = (doc) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLastRoll(doc);
    timerRef.current = setTimeout(() => setLastRoll(null), 6000);
  };

  const toggleCard = (name) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleSpellRoll = async (card) => {
    if (!campaignId) return;
    setRollingKey(card.name);
    const traits = character.traits || {};
    const spellcastTrait = Object.keys(traits).reduce((a, b) => traits[a] > traits[b] ? a : b, 'knowledge');
    const mod = traits[spellcastTrait] ?? 0;
    const doc = await roll({ label: `${card.name} (Spellcast)`, modifier: mod });
    setRollingKey(null);
    if (doc) showResult(doc);
  };

  const handleDiceRoll = async (card, parsed) => {
    if (!campaignId || !parsed) return;
    setRollingKey(`dmg-${card.name}`);
    const doc = await rollDamage({
      label: `${card.name}`,
      dieType: parsed.dieType,
      quantity: parsed.quantity,
      modifier: parsed.modifier,
    });
    setRollingKey(null);
    if (doc) showResult(doc);
  };

  const domainColors = {
    Arcana: '#a855f7',
    Blade: '#ef4444',
    Bone: '#94a3b8',
    Codex: '#3b82f6',
    Grace: '#ec4899',
    Midnight: '#6366f1',
    Sage: '#22c55e',
    Splendor: '#eab308',
    Valor: '#f97316',
  };

  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
        No domain cards selected yet.
      </div>
    );
  }

  return (
    <div>
      {/* Roll result overlay */}
      {lastRoll && (
        <div className="lrp-roll-overlay">
          <RollResultBanner roll={lastRoll} />
        </div>
      )}

      {/* Domain header */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[character.primaryDomain, character.secondaryDomain].filter(Boolean).map(d => (
          <span
            key={d}
            style={{
              padding: '4px 12px',
              borderRadius: 99,
              background: `${domainColors[d] || '#6366f1'}20`,
              color: domainColors[d] || '#6366f1',
              border: `1px solid ${domainColors[d] || '#6366f1'}`,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Cards grouped by domain */}
      {Object.entries(grouped).map(([domain, domainCards]) => (
        <div key={domain} style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: domainColors[domain] || 'var(--text-muted)',
            marginBottom: 6,
            paddingLeft: 4,
          }}>
            {domain}
          </div>
          {domainCards.map(card => {
            const isOpen = expanded.has(card.name);
            const diceParsed = extractCardDice(card.description);
            const isSpell = card.type === 'Spell';
            const isRolling = rollingKey === card.name;
            const isDmgRolling = rollingKey === `dmg-${card.name}`;
            const color = domainColors[card.domain] || '#6366f1';
            return (
              <div key={card.name} className="lrp-card-item">
                <div
                  className="lrp-card-header"
                  onClick={() => toggleCard(card.name)}
                  role="button"
                  aria-expanded={isOpen}
                >
                  <span className="lrp-card-name">{card.name}</span>
                  <span
                    className="lrp-card-tag"
                    style={{ color, borderColor: color }}
                  >
                    {card.type}
                  </span>
                  <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
                {isOpen && (
                  <div className="lrp-card-body">
                    <p className="lrp-card-desc">{card.description}</p>
                    <div className="lrp-card-actions">
                      {isSpell && (
                        <button
                          className={`lrp-action-btn lrp-action-btn-primary${isRolling ? ' lrp-rolling' : ''}`}
                          onClick={() => handleSpellRoll(card)}
                        >
                          <Sparkles size={14} /> Spellcast
                        </button>
                      )}
                      {diceParsed && (
                        <button
                          className={`lrp-action-btn lrp-action-btn-secondary${isDmgRolling ? ' lrp-rolling' : ''}`}
                          onClick={() => handleDiceRoll(card, diceParsed)}
                        >
                          <Dices size={14} />
                          {diceParsed.quantity}d{diceParsed.dieType}
                          {diceParsed.modifier ? `+${diceParsed.modifier}` : ''}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
