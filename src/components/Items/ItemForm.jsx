import { useState } from 'react';
import { Save, X, Sword, Shield, Backpack } from 'lucide-react';
import DaggerheartWeaponForm from './forms/DaggerheartWeaponForm';
import DaggerheartArmorForm from './forms/DaggerheartArmorForm';
import DaggerheartEquipmentForm from './forms/DaggerheartEquipmentForm';
import DynamicItemForm from './forms/DynamicItemForm';
import './ItemsView.css';

// Map of game systems to their form components
// Systems not listed here will use DynamicItemForm
const FORM_COMPONENTS = {
  daggerheart: {
    weapon: DaggerheartWeaponForm,
    armor: DaggerheartArmorForm,
    equipment: DaggerheartEquipmentForm
  }
};

const ITEM_TYPES = [
  { type: 'weapon', label: 'Weapon', icon: Sword, description: 'Swords, bows, staves, and other weapons' },
  { type: 'armor', label: 'Armor', icon: Shield, description: 'Protective gear and shields' },
  { type: 'equipment', label: 'Equipment', icon: Backpack, description: 'Items, consumables, and gear' }
];

export default function ItemForm({ item, gameSystem, onSave, onCancel, campaign, isDM }) {
  const [itemType, setItemType] = useState(item?.type || null);
  const [formData, setFormData] = useState(item || {
    name: '',
    type: null,
    description: '',
    hidden: false,
    systemData: {}
  });

  const handleTypeSelect = (type) => {
    setItemType(type);
    setFormData({
      ...formData,
      type: type
    });
  };

  const handleFormDataChange = (data) => {
    setFormData({
      ...formData,
      ...data
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // If no type selected, show type selector
  if (!itemType) {
    return (
      <div className="item-form">
        <div className="input-group">
          <label>Select Item Type</label>
          <div className="item-type-selector">
            {ITEM_TYPES.map(({ type, label, icon: Icon, description }) => (
              <button
                key={type}
                type="button"
                className={`type-option ${itemType === type ? 'selected' : ''}`}
                onClick={() => handleTypeSelect(type)}
              >
                <Icon size={32} />
                <span>{label}</span>
                <small style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            <X size={16} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Get the appropriate form component for this game system and item type
  const systemForms = FORM_COMPONENTS[gameSystem];
  const SpecificForm = systemForms?.[itemType];

  // If we have a specific form component, use it
  if (SpecificForm) {
    return (
      <SpecificForm
        item={item}
        formData={formData}
        setFormData={handleFormDataChange}
        onSave={onSave}
        onCancel={onCancel}
        onChangeType={() => setItemType(null)}
        campaign={campaign}
        isDM={isDM}
      />
    );
  }

  // Use DynamicItemForm for systems without specific form components
  // This uses the itemTemplates from the game system definition
  return (
    <div className="dynamic-form-wrapper">
      <div className="form-type-header">
        <span className={`item-type-badge ${itemType}`}>{itemType}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItemType(null)}>
          Change Type
        </button>
      </div>
      <DynamicItemForm
        gameSystem={gameSystem}
        itemType={itemType}
        initialData={item}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}
