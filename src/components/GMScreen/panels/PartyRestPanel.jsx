import { useState } from 'react';
import { Sun, Moon, Check, Flame } from 'lucide-react';
import { getTierForLevel } from '../../../data/systems/daggerheart';
import { scarCount } from '../../../utils/daggerheartHope';

const d4 = () => Math.floor(Math.random() * 4) + 1;

/**
 * Party-wide rest: applies recovery to every Daggerheart PC at once and adds
 * the GM's Fear (SRD: 1d4 on a short rest, 1d4 + number of PCs on a long rest).
 * Short-rest recovery rolls 1d4 + tier per character per selected option;
 * long-rest recovery clears everything selected.
 */
export default function PartyRestPanel({ characters = [], updateCharacter, fearCount = 0, setFearCount }) {
  const [restType, setRestType] = useState('long');
  const [opts, setOpts] = useState({ hp: true, stress: true, armor: true, hope: true });
  const [result, setResult] = useState(null);

  const pcs = characters.filter(c => !c.isFallen);
  const toggle = (k) => setOpts(o => ({ ...o, [k]: !o[k] }));

  const applyRest = async () => {
    const lines = [];
    for (const c of pcs) {
      const tier = getTierForLevel(c.level || 1);
      const hp = [...(c.hpSlots || [true, true, true, true, true, true])];
      const stress = [...(c.stressSlots || [false, false, false, false, false, false])];
      const armor = [...(c.armorSlots || [false, false, false, false, false, false])];
      const hope = [...(c.hopeSlots || [false, false, false, false, false, false])];
      const scars = scarCount(c);
      const parts = [];

      const clearHP = (n) => { let k = 0; for (let i = 0; i < hp.length && k < n; i++) if (!hp[i]) { hp[i] = true; k++; } return k; };
      const clearStress = (n) => { let k = 0; for (let i = stress.length - 1; i >= 0 && k < n; i--) if (stress[i]) { stress[i] = false; k++; } return k; };
      const clearArmor = (n) => { let k = 0; for (let i = armor.length - 1; i >= 0 && k < n; i--) if (armor[i]) { armor[i] = false; k++; } return k; };
      const gainHope = (n) => { let k = 0; for (let i = 0; i < hope.length - scars && k < n; i++) if (!hope[i]) { hope[i] = true; k++; } return k; };

      if (opts.hp) {
        const n = restType === 'long' ? clearHP(hp.length) : clearHP(d4() + tier);
        if (n) parts.push(`+${n} HP`);
      }
      if (opts.stress) {
        const n = restType === 'long' ? clearStress(stress.length) : clearStress(d4() + tier);
        if (n) parts.push(`−${n} Stress`);
      }
      if (opts.armor) {
        const n = restType === 'long' ? clearArmor(armor.length) : clearArmor(d4() + tier);
        if (n) parts.push(`+${n} Armor`);
      }
      if (opts.hope) {
        const n = gainHope(2); // Prepare together: 2 Hope each
        if (n) parts.push(`+${n} Hope`);
      }

      if (updateCharacter) {
        await updateCharacter(c.id, { hpSlots: hp, stressSlots: stress, armorSlots: armor, hopeSlots: hope });
      }
      lines.push(`${c.name}: ${parts.length ? parts.join(', ') : 'no change'}`);
    }

    // GM Fear
    const fearRoll = d4();
    const fearGain = restType === 'long' ? fearRoll + pcs.length : fearRoll;
    if (setFearCount) await setFearCount(fearCount + fearGain);
    lines.push(`GM gains ${fearGain} Fear (1d4${restType === 'long' ? ` + ${pcs.length} PCs` : ''} → rolled ${fearRoll})`);

    setResult(lines);
  };

  if (result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.4rem' }}>
        <div className="gm-mini-list" style={{ flex: 1, overflow: 'auto' }}>
          {result.map((l, i) => (
            <div key={i} className="gm-mini-item" style={{ fontSize: '0.78rem' }}>{l}</div>
          ))}
        </div>
        <button className="gm-mini-filter-btn" style={{ padding: '0.45rem' }} onClick={() => setResult(null)}>
          <Check size={13} /> Done
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.6rem' }}>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button
          className={`gm-mini-filter-btn ${restType === 'short' ? 'active' : ''}`}
          style={{ flex: 1, padding: '0.4rem' }}
          onClick={() => setRestType('short')}
        >
          <Sun size={13} /> Short Rest
        </button>
        <button
          className={`gm-mini-filter-btn ${restType === 'long' ? 'active' : ''}`}
          style={{ flex: 1, padding: '0.4rem' }}
          onClick={() => setRestType('long')}
        >
          <Moon size={13} /> Long Rest
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={opts.hp} onChange={() => toggle('hp')} />
          {restType === 'long' ? 'Tend to All Wounds (clear all HP)' : 'Tend to Wounds (1d4 + tier HP each)'}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={opts.stress} onChange={() => toggle('stress')} />
          {restType === 'long' ? 'Clear All Stress' : 'Clear Stress (1d4 + tier each)'}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={opts.armor} onChange={() => toggle('armor')} />
          {restType === 'long' ? 'Repair All Armor' : 'Repair Armor (1d4 + tier each)'}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={opts.hope} onChange={() => toggle('hope')} />
          Prepare together (+2 Hope each)
        </label>
      </div>

      <div style={{ fontSize: '0.72rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Flame size={12} />
        Adds {restType === 'long' ? `1d4 + ${pcs.length} PCs` : '1d4'} Fear to the tracker automatically.
      </div>

      <button
        className="gm-mini-filter-btn active"
        style={{ padding: '0.5rem', fontWeight: 600 }}
        onClick={applyRest}
        disabled={pcs.length === 0}
      >
        Rest the Party ({pcs.length} PC{pcs.length !== 1 ? 's' : ''})
      </button>
      <div style={{ fontSize: '0.68rem', opacity: 0.5 }}>
        SRD: each player normally picks two downtime moves — use the checkboxes to match what your table chose,
        or have players use the Rest button on their own sheets.
      </div>
    </div>
  );
}
