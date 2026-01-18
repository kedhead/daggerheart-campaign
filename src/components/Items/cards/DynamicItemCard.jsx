import { Eye, EyeOff, Edit, Trash2, Package, Sword, Shield, Backpack } from 'lucide-react';
import { getGameSystem } from '../../../data/systems';

/**
 * Dynamic Item Card - Renders item display based on any game system's itemTemplates
 * Works for D&D 5e, Star Wars D6, Generic, and any future systems
 */
export default function DynamicItemCard({
  item,
  onEdit,
  onDelete,
  onToggleVisibility,
  canEdit = false,
  compact = false
}) {
  const system = getGameSystem(item.gameSystem);
  const template = system?.itemTemplates?.[item.type];

  // Get icon based on item type
  const getItemIcon = () => {
    switch (item.type) {
      case 'weapon':
        return <Sword size={compact ? 14 : 20} />;
      case 'armor':
        return <Shield size={compact ? 14 : 20} />;
      case 'equipment':
        return <Backpack size={compact ? 14 : 20} />;
      default:
        return <Package size={compact ? 14 : 20} />;
    }
  };

  // Get display value for a field
  const getFieldDisplay = (fieldName, fieldConfig, value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    switch (fieldConfig.type) {
      case 'select':
        // Find the label for selected value
        if (Array.isArray(fieldConfig.options)) {
          const option = fieldConfig.options.find(opt =>
            (typeof opt === 'string' ? opt : opt.value) === value
          );
          if (option) {
            return typeof option === 'string' ? option : option.label;
          }
        }
        return value;

      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          return value.map(v => {
            if (Array.isArray(fieldConfig.options)) {
              const opt = fieldConfig.options.find(o =>
                (typeof o === 'string' ? o : o.value) === v
              );
              return opt ? (typeof opt === 'string' ? opt : opt.label) : v;
            }
            return v;
          }).join(', ');
        }
        return null;

      case 'checkbox':
        return value ? 'Yes' : 'No';

      case 'number':
        return value.toString();

      default:
        return value;
    }
  };

  // Group fields into primary (shown prominently) and secondary (shown in details)
  const groupFields = () => {
    const primary = [];
    const secondary = [];

    Object.entries(template?.fields || {}).forEach(([fieldName, fieldConfig]) => {
      const value = item.systemData?.[fieldName];
      const displayValue = getFieldDisplay(fieldName, fieldConfig, value);

      if (displayValue === null) return;

      const fieldInfo = {
        name: fieldName,
        label: fieldConfig.label,
        value: displayValue,
        config: fieldConfig
      };

      // Consider required fields and common important fields as primary
      if (fieldConfig.required ||
          ['damage', 'damageDice', 'protection', 'physicalProtection', 'energyProtection',
           'rarity', 'category', 'armorType', 'weaponType', 'scale', 'baseAC'].includes(fieldName)) {
        primary.push(fieldInfo);
      } else {
        secondary.push(fieldInfo);
      }
    });

    return { primary, secondary };
  };

  const { primary, secondary } = groupFields();

  // Get rarity color if applicable
  const getRarityColor = () => {
    const rarity = item.systemData?.rarity;
    if (!rarity) return null;

    const rarityColors = {
      common: '#9ca3af',
      uncommon: '#22c55e',
      rare: '#3b82f6',
      'very-rare': '#8b5cf6',
      legendary: '#f59e0b',
      artifact: '#ef4444',
      epic: '#8b5cf6',
      unique: '#ef4444'
    };

    return rarityColors[rarity] || null;
  };

  const rarityColor = getRarityColor();

  if (compact) {
    return (
      <div className="item-card-compact">
        <div className="item-icon">{getItemIcon()}</div>
        <div className="item-info">
          <span className="item-name" style={rarityColor ? { color: rarityColor } : {}}>
            {item.name}
          </span>
          <span className="item-type">{template?.label || item.type}</span>
        </div>
        {item.hidden && (
          <span className="hidden-badge" title="Hidden from players">
            <EyeOff size={12} />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`item-card dynamic-item-card ${item.hidden ? 'hidden-item' : ''}`}>
      {/* Header */}
      <div className="item-card-header">
        <div className="item-title-row">
          <span className="item-icon">{getItemIcon()}</span>
          <h3 className="item-name" style={rarityColor ? { color: rarityColor } : {}}>
            {item.name}
          </h3>
        </div>
        <div className="item-meta">
          <span className="item-type-badge">{template?.label || item.type}</span>
          <span className="item-system">{system?.name || item.gameSystem}</span>
        </div>
      </div>

      {/* Image */}
      {item.imageUrl && (
        <div className="item-image">
          <img src={item.imageUrl} alt={item.name} />
        </div>
      )}

      {/* Primary Stats */}
      {primary.length > 0 && (
        <div className="item-stats primary-stats">
          {primary.map(field => (
            <div key={field.name} className="stat-item">
              <span className="stat-label">{field.label}</span>
              <span className="stat-value">{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="item-description">
          <p>{item.description}</p>
        </div>
      )}

      {/* Secondary Stats */}
      {secondary.length > 0 && (
        <div className="item-stats secondary-stats">
          {secondary.map(field => (
            <div key={field.name} className="stat-item">
              <span className="stat-label">{field.label}</span>
              <span className="stat-value">{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Visibility indicator */}
      {item.hidden && (
        <div className="hidden-indicator">
          <EyeOff size={14} />
          <span>Hidden from players</span>
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="item-card-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onToggleVisibility?.(item.id, !item.hidden)}
            title={item.hidden ? 'Show to players' : 'Hide from players'}
          >
            {item.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onEdit?.(item)}
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm btn-danger"
            onClick={() => onDelete?.(item.id)}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
