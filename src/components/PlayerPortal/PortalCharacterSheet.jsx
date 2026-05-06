import { useState } from 'react';
import { ArrowLeft, X, Heart, Dices, BookOpen, Backpack } from 'lucide-react';
import { useDice } from '../../dice';
import OverviewTab from './tabs/OverviewTab';
import CombatTab from './tabs/CombatTab';
import DomainsTab from './tabs/DomainsTab';
import InventoryTab from './tabs/InventoryTab';

const TABS = [
  { id: 'play',  label: 'Play',  Icon: Heart },
  { id: 'roll',  label: 'Roll',  Icon: Dices },
  { id: 'cards', label: 'Cards', Icon: BookOpen },
  { id: 'bag',   label: 'Bag',   Icon: Backpack },
];

export default function PortalCharacterSheet({ character, updateCharacter, campaign, items, onBack, onExit, showBack }) {
  const [activeTab, setActiveTab] = useState('play');
  const campaignId = campaign?.id;
  const { roll, rollDamage } = useDice(campaignId);

  const tabProps = { character, updateCharacter, campaign, campaignId, items, roll, rollDamage };

  return (
    <div className="lrp-portal">
      {/* Header */}
      <div className="lrp-header">
        {showBack && (
          <button className="lrp-icon-btn" onClick={onBack} aria-label="Back to character select">
            <ArrowLeft size={18} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lrp-header-title">{character.name}</div>
          <div className="lrp-header-subtitle">
            {[character.class, `Lv ${character.level || 1}`].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button className="lrp-icon-btn" onClick={onExit} aria-label="Exit portal">
          <X size={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="lrp-content">
        <div className="lrp-content-inner">
          {activeTab === 'play'  && <OverviewTab   {...tabProps} />}
          {activeTab === 'roll'  && <CombatTab     {...tabProps} />}
          {activeTab === 'cards' && <DomainsTab    {...tabProps} />}
          {activeTab === 'bag'   && <InventoryTab  {...tabProps} />}
        </div>
      </div>

      {/* Bottom tab nav */}
      <nav className="lrp-nav" aria-label="Character portal navigation">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              className="lrp-nav-btn"
              onClick={() => setActiveTab(id)}
              aria-current={active ? 'page' : undefined}
              style={{ color: active ? 'var(--primary, #6366f1)' : 'var(--text-muted, #94a3b8)' }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
