import { Sun, Moon } from 'lucide-react';

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
        <div className="banner-dice">Wild: {wild} | [{others}]{modSuffix}</div>
        <div className="banner-total">{roll.total}</div>
        {roll.flags?.complication && <div className="banner-outcome complication">⚠️ COMPLICATION</div>}
        {roll.label && <div className="banner-label">{roll.label}</div>}
      </div>
    );
  }

  // Generic
  const breakdown = (roll.dice || []).map((d, i) => (
    <span key={i} style={{ color: d.color }}>
      {d.value}{i < (roll.dice.length - 1) ? ', ' : ''}
    </span>
  ));
  return (
    <div className={`dice-result-banner ${roll.flags?.isCrit ? 'is-crit' : ''} ${roll.flags?.isCritFail ? 'is-critfail' : ''}`}>
      <div className="banner-dice">[{breakdown}]{modSuffix}</div>
      <div className="banner-total">{roll.total}</div>
      {roll.flags?.isCrit && <div className="banner-outcome crit">🎯 CRITICAL HIT</div>}
      {roll.flags?.isCritFail && <div className="banner-outcome critfail">💥 CRITICAL FAIL</div>}
      {roll.label && <div className="banner-label">{roll.label}</div>}
    </div>
  );
}
