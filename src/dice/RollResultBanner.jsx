import { Sun, Moon } from 'lucide-react';

// Who rolled it. Concurrent rolls put several cards on screen at once, so
// this belongs on every system's banner, not just Daggerheart's.
function Roller({ roll }) {
  if (!roll.rollerName) return null;
  return (
    <div className="banner-roller" style={{ color: roll.rollerColor || undefined }}>
      {roll.rollerName}
    </div>
  );
}

// Reads everything from the canonical roll document. Never re-derives
// numbers. If a field isn't on the doc, we don't display it.
export default function RollResultBanner({ roll }) {
  if (!roll) return null;
  const mod = roll.modifier || 0;
  const modSuffix = mod ? (mod > 0 ? ` + ${mod}` : ` − ${Math.abs(mod)}`) : '';

  if (roll.system === 'daggerheart') {
    const hope = roll.dice?.find(d => d.groupId === 'hope')?.value;
    const fear = roll.dice?.find(d => d.groupId === 'fear')?.value;
    const adv = roll.dice?.find(d => d.groupId === 'advantage')?.value;
    const dis = roll.dice?.find(d => d.groupId === 'disadvantage')?.value;
    return (
      <div className={`dice-result-banner outcome-${roll.outcome || 'tie'}`}>
        <Roller roll={roll} />
        <div className="banner-dice">
          <span className="hope-chip"><Sun size={16} /> {hope}</span>
          <span className="vs">vs</span>
          <span className="fear-chip"><Moon size={16} /> {fear}</span>
          {adv != null && <span className="adv-chip">+{adv}</span>}
          {dis != null && <span className="dis-chip">−{dis}</span>}
        </div>
        <div className="banner-total">{roll.total}</div>
        {roll.outcome && (
          <div className={`banner-outcome ${roll.outcome}`}>
            {roll.outcome === 'hope' ? '✨ WITH HOPE' : '💀 WITH FEAR'}
          </div>
        )}
        {roll.label && <div className="banner-label">{roll.label}</div>}
      </div>
    );
  }

  if (roll.system === 'dnd5e') {
    const values = (roll.dice || []).map(d => d.value).join(', ');
    return (
      <div className={`dice-result-banner ${roll.flags?.isCrit ? 'is-crit' : ''} ${roll.flags?.isCritFail ? 'is-critfail' : ''}`}>
        <Roller roll={roll} />
        <div className="banner-dice">d20: {values}{modSuffix}</div>
        <div className="banner-total">{roll.total}</div>
        {roll.flags?.isCrit && <div className="banner-outcome crit">🎯 CRITICAL HIT</div>}
        {roll.flags?.isCritFail && <div className="banner-outcome critfail">💥 CRITICAL FAIL</div>}
        {roll.label && <div className="banner-label">{roll.label}</div>}
      </div>
    );
  }

  if (roll.system === 'starwarsd6') {
    const wild = roll.dice?.find(d => d.groupId === 'wild')?.value;
    const others = (roll.dice || []).filter(d => d.groupId !== 'wild').map(d => d.value).join(', ');
    return (
      <div className={`dice-result-banner ${roll.flags?.complication ? 'is-complication' : ''}`}>
        <Roller roll={roll} />
        <div className="banner-dice">Wild: {wild} | [{others}]{modSuffix}</div>
        <div className="banner-total">{roll.total}</div>
        {roll.flags?.complication && <div className="banner-outcome complication">⚠️ COMPLICATION</div>}
        {roll.label && <div className="banner-label">{roll.label}</div>}
      </div>
    );
  }

  // Generic. A die that a reroll ability replaced shows both faces — the
  // player needs to see the ability earning its keep, and the struck-out
  // original is the only proof the 1 was ever there.
  const breakdown = (roll.dice || []).map((d, i) => (
    <span key={i} style={{ color: d.color }}>
      {d.rerolledFrom != null && <s className="banner-rerolled">{d.rerolledFrom}</s>}
      {d.value}{i < (roll.dice.length - 1) ? ', ' : ''}
    </span>
  ));
  const parry = roll.parry;
  return (
    <div className={`dice-result-banner ${roll.flags?.isCrit ? 'is-crit' : ''} ${roll.flags?.isCritFail ? 'is-critfail' : ''}`}>
      <Roller roll={roll} />
      <div className="banner-dice">[{breakdown}]{modSuffix}</div>
      {parry ? (
        <div className="banner-total">
          <s className="banner-parry-before">{parry.originalTotal}</s> {parry.reducedTotal}
        </div>
      ) : (
        <div className="banner-total">{roll.total}</div>
      )}
      {parry && (
        <div className={`banner-outcome ${parry.discardedCount > 0 ? 'parry' : ''}`}>
          {parry.discardedCount > 0
            ? `🛡️ PARRIED ${parry.discardedCount} ${parry.discardedCount === 1 ? 'DIE' : 'DICE'}`
            : '🛡️ NO MATCH'}
        </div>
      )}
      {roll.reroll?.count > 0 && (
        <div className="banner-reroll">
          ↻ {roll.reroll.source || 'Reroll'} — {roll.reroll.count} rerolled
        </div>
      )}
      {roll.flags?.isCrit && <div className="banner-outcome crit">🎯 CRITICAL HIT</div>}
      {roll.flags?.isCritFail && <div className="banner-outcome critfail">💥 CRITICAL FAIL</div>}
      {roll.label && <div className="banner-label">{roll.label}</div>}
    </div>
  );
}
