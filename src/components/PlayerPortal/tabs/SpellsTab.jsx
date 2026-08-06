import { useState } from 'react';
import { getCardByName } from '../../../data/daggerheartDomainCards';
import { extractCardDice } from '../../../utils/daggerheartRollUtils';
import { getDamageDiceMods, isDamageDiceText } from '../../../utils/daggerheartDamageMods';
import { splitCardFeatures } from '../../../utils/domainCardText';

function parseGrimoireEntries(description) {
  // Split "SpellName: text. SpellName: text." into per-spell entries; only
  // return a list when the card actually holds multiple named abilities.
  const entries = splitCardFeatures(description).filter(e => e.name);
  return entries.length >= 2 ? entries : null;
}

const DOMAIN_COLORS = {
  Sage: '#22c55e', Arcana: '#a78bfa', Blade: '#f5c543', Bone: '#94a3b8',
  Codex: '#60a5fa', Grace: '#f472b6', Midnight: '#7c3aed', Splendor: '#fbbf24',
  Valor: '#ef4444',
  Dread: '#7f1d1d', // Hope & Fear expansion domain
};
const DOMAIN_GLYPHS = {
  Sage: '🌿', Arcana: '✦', Blade: '⚔', Bone: '☠', Codex: '📜',
  Grace: '✿', Midnight: '☾', Splendor: '☀', Valor: '⚜',
  Dread: '🕯',
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

export default function SpellsTab({ character, roll, rollDamage, campaignId, updateCharacter }) {
  const [openCard, setOpenCard] = useState(null);

  const cardNames = character.domainCards || [];
  const cards = cardNames.map(n => getCardByName(n)).filter(Boolean);

  // Real loadout/vault split (SRD: max 5 active cards). Vaulted cards are tracked
  // by name on the character; recall costs Stress equal to the card's recallCost.
  const vaultNames = character.vaultCards || [];
  const loadout = cards.filter(c => !vaultNames.includes(c.name));
  const vault = cards.filter(c => vaultNames.includes(c.name));
  const stressSlots = character.stressSlots || [false, false, false, false, false, false];
  const unmarkedStress = stressSlots.filter(s => !s).length;

  const moveToVault = (name) => {
    if (!updateCharacter || vaultNames.includes(name)) return;
    updateCharacter(character.id, { vaultCards: [...vaultNames, name] });
  };
  const recallFromVault = (card) => {
    if (!updateCharacter) return;
    const cost = card.recallCost || 0;
    const updates = { vaultCards: vaultNames.filter(n => n !== card.name) };
    if (cost > 0) {
      if (cost > unmarkedStress) return; // not enough Stress
      const s = [...stressSlots];
      let marked = 0;
      for (let i = 0; i < s.length && marked < cost; i++) if (!s[i]) { s[i] = true; marked++; }
      updates.stressSlots = s;
    }
    updateCharacter(character.id, updates);
  };

  const domains = [character.primaryDomain, character.secondaryDomain].filter(Boolean);

  const handleSpellRoll = async (card) => {
    if (!campaignId) return;
    const traits = character.traits || {};
    const best = Object.entries(traits).reduce((a, b) => b[1] > a[1] ? b : a, ['knowledge', 0]);
    await roll({ label: `${card.name} (Spellcast)`, modifier: best[1] });
  };

  const handleDiceRoll = async (card, parsed) => {
    if (!campaignId || !parsed) return;
    // Reroll abilities (Not Good Enough) apply to DAMAGE dice — a card that
    // rolls a d6 on a foraging table isn't rolling damage.
    const mods = isDamageDiceText(card.description)
      ? getDamageDiceMods(loadout)
      : { rerollBelow: 0, sources: [] };
    await rollDamage({
      label: card.name,
      ...parsed,
      rerollBelow: mods.rerollBelow,
      rerollSource: mods.sources[0] || '',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <div className="lrp-section-label">Loadout — {loadout.length}/5 cards</div>
          {loadout.length > 5 && (
            <div style={{ fontSize: 11, color: '#f5c76a', margin: '0 0 8px', padding: '6px 10px', borderRadius: 8, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
              Over the 5-card limit — vault {loadout.length - 5} card{loadout.length - 5 > 1 ? 's' : ''}.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadout.map(card => {
              const dc = DOMAIN_COLORS[card.domain] || '#a78bfa';
              const glyph = DOMAIN_GLYPHS[card.domain] || '✦';
              const isOpen = openCard === card.name;
              const grimoireEntries = card.type === 'Grimoire' ? parseGrimoireEntries(card.description) : null;
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
                          {grimoireEntries && ` · ${grimoireEntries.length} spells`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', fontWeight: 700 }}>⚡ RECALL</span>
                        <span className="lrp-cinzel" style={{ fontSize: 12, color: '#eab308', fontWeight: 800 }}>{card.recallCost ?? 0}</span>
                        {updateCharacter && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveToVault(card.name); }}
                            style={{ marginTop: 2, fontSize: 9, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', letterSpacing: '0.1em', fontWeight: 700 }}
                          >
                            VAULT
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 14px 14px' }}>
                      {grimoireEntries ? (
                        /* Grimoire: show each spell as its own entry */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                          {grimoireEntries.map((entry, ei) => {
                            const entryDice = extractCardDice(entry.text);
                            return (
                              <div key={ei} style={{
                                padding: '10px 12px', borderRadius: 10,
                                background: `rgba(0,0,0,0.25)`, border: `1px solid ${dc}22`,
                              }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: dc, marginBottom: 4 }}>{entry.name}</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>{entry.text}</div>
                                {entryDice && (
                                  <div style={{ marginTop: 8 }}>
                                    <RollPill kind="spell" label="Roll"
                                      formula={`${entryDice.quantity}d${entryDice.dieType}${entryDice.modifier ? `+${entryDice.modifier}` : ''}`}
                                      onClick={() => handleDiceRoll(card, entryDice)} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Regular card: show full description */
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5, marginBottom: 10 }}>
                          {card.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {card.type === 'Spell' && (
                          <RollPill kind="spell" label="Spellcast" onClick={() => handleSpellRoll(card)} />
                        )}
                        {!grimoireEntries && diceParsed && (
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
            {vault.map(card => {
              const cost = card.recallCost || 0;
              const loadoutFull = loadout.length >= 5;
              const cantAfford = cost > unmarkedStress;
              const disabled = loadoutFull || cantAfford;
              return (
                <div key={card.name} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{card.name}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginLeft: 8 }}>
                      Lv {card.level} · ⚡{cost}
                    </span>
                  </div>
                  {updateCharacter && (
                    <button
                      onClick={() => recallFromVault(card)}
                      disabled={disabled}
                      title={loadoutFull ? 'Loadout full — vault a card first' : cantAfford ? `Needs ${cost} unmarked Stress` : `Recall (marks ${cost} Stress)`}
                      style={{
                        flexShrink: 0, fontSize: 9, padding: '5px 10px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.1em',
                        border: '1px solid rgba(106,176,200,0.4)', background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(74,144,164,0.15)',
                        color: disabled ? 'rgba(255,255,255,0.3)' : '#8fd0e8', cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      RECALL{cost > 0 ? ` (${cost})` : ''}
                    </button>
                  )}
                </div>
              );
            })}
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
