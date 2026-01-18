import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, Sword, Shield, Backpack, EyeOff } from 'lucide-react';
import DaggerheartWeaponCard from './cards/DaggerheartWeaponCard';
import DaggerheartArmorCard from './cards/DaggerheartArmorCard';
import DaggerheartEquipmentCard from './cards/DaggerheartEquipmentCard';
import DynamicItemCard from './cards/DynamicItemCard';
import './ItemsView.css';

// Map of game systems to their card components
// Systems not listed here will use DynamicItemCard
const CARD_COMPONENTS = {
  daggerheart: {
    weapon: DaggerheartWeaponCard,
    armor: DaggerheartArmorCard,
    equipment: DaggerheartEquipmentCard
  }
};

const TYPE_ICONS = {
  weapon: Sword,
  armor: Shield,
  equipment: Backpack
};

export default function ItemCard({ item, gameSystem, onEdit, onDelete, isDM, campaign }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const TypeIcon = TYPE_ICONS[item.type] || Backpack;

  // Get the appropriate card component for this game system and item type
  const systemCards = CARD_COMPONENTS[gameSystem];
  const SpecificCard = systemCards?.[item.type];

  // If we have a specific card component, use it
  if (SpecificCard) {
    return (
      <SpecificCard
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        isDM={isDM}
        campaign={campaign}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
    );
  }

  // Use DynamicItemCard for systems without specific card components
  // This uses the itemTemplates from the game system definition
  return (
    <DynamicItemCard
      item={item}
      onEdit={onEdit ? () => onEdit(item) : undefined}
      onDelete={onDelete ? () => onDelete(item.id) : undefined}
      canEdit={isDM}
    />
  );
}
