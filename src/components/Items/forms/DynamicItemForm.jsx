import { useState, useEffect } from 'react';
import { Save, X, Loader2 } from 'lucide-react';
import { getGameSystem } from '../../../data/systems';

/**
 * Dynamic Item Form - Renders form fields based on any game system's itemTemplates
 * Works for D&D 5e, Star Wars D6, Generic, and any future systems
 */
export default function DynamicItemForm({
  gameSystem,
  itemType,
  initialData = null,
  onSave,
  onCancel,
  isLoading = false
}) {
  const system = getGameSystem(gameSystem);
  const template = system?.itemTemplates?.[itemType];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    hidden: false,
    systemData: {}
  });
  const [errors, setErrors] = useState({});

  // Initialize form with template defaults or existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || '',
        hidden: initialData.hidden || false,
        systemData: initialData.systemData || {}
      });
    } else if (template) {
      // Initialize with default values from template
      const defaultSystemData = {};
      Object.entries(template.fields || {}).forEach(([fieldName, fieldConfig]) => {
        if (fieldConfig.default !== undefined) {
          defaultSystemData[fieldName] = fieldConfig.default;
        } else if (fieldConfig.type === 'number') {
          defaultSystemData[fieldName] = fieldConfig.min || 0;
        } else if (fieldConfig.type === 'checkbox') {
          defaultSystemData[fieldName] = false;
        } else if (fieldConfig.type === 'select' && fieldConfig.options?.length > 0) {
          // Don't set default for select - let user choose
        } else if (fieldConfig.type === 'multiselect') {
          defaultSystemData[fieldName] = [];
        } else {
          defaultSystemData[fieldName] = '';
        }
      });
      setFormData(prev => ({
        ...prev,
        systemData: defaultSystemData
      }));
    }
  }, [initialData, template]);

  if (!template) {
    return (
      <div className="form-error">
        <p>No template found for item type: {itemType}</p>
        <button className="btn btn-secondary" onClick={onCancel}>Back</button>
      </div>
    );
  }

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      systemData: {
        ...prev.systemData,
        [fieldName]: value
      }
    }));
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const handleBaseFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate required template fields
    Object.entries(template.fields || {}).forEach(([fieldName, fieldConfig]) => {
      if (fieldConfig.required) {
        const value = formData.systemData[fieldName];
        if (value === undefined || value === '' || value === null) {
          newErrors[fieldName] = `${fieldConfig.label || fieldName} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const itemData = {
      ...formData,
      type: itemType,
      gameSystem
    };

    await onSave(itemData);
  };

  // Render a single field based on its configuration
  const renderField = (fieldName, fieldConfig) => {
    const value = formData.systemData[fieldName];
    const error = errors[fieldName];

    switch (fieldConfig.type) {
      case 'text':
        return (
          <div className="form-group" key={fieldName}>
            <label>
              {fieldConfig.label}
              {fieldConfig.required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={fieldConfig.placeholder}
              className={error ? 'error' : ''}
            />
            {fieldConfig.helpText && <small className="help-text">{fieldConfig.helpText}</small>}
            {error && <span className="error-text">{error}</span>}
          </div>
        );

      case 'textarea':
        return (
          <div className="form-group" key={fieldName}>
            <label>
              {fieldConfig.label}
              {fieldConfig.required && <span className="required">*</span>}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={fieldConfig.placeholder}
              rows={3}
              className={error ? 'error' : ''}
            />
            {fieldConfig.helpText && <small className="help-text">{fieldConfig.helpText}</small>}
            {error && <span className="error-text">{error}</span>}
          </div>
        );

      case 'number':
        return (
          <div className="form-group" key={fieldName}>
            <label>
              {fieldConfig.label}
              {fieldConfig.required && <span className="required">*</span>}
            </label>
            <input
              type="number"
              value={value ?? (fieldConfig.default || 0)}
              onChange={(e) => handleFieldChange(fieldName, parseInt(e.target.value) || 0)}
              min={fieldConfig.min}
              max={fieldConfig.max}
              className={error ? 'error' : ''}
            />
            {fieldConfig.helpText && <small className="help-text">{fieldConfig.helpText}</small>}
            {error && <span className="error-text">{error}</span>}
          </div>
        );

      case 'select':
        const options = Array.isArray(fieldConfig.options)
          ? fieldConfig.options
          : [];
        return (
          <div className="form-group" key={fieldName}>
            <label>
              {fieldConfig.label}
              {fieldConfig.required && <span className="required">*</span>}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className={error ? 'error' : ''}
            >
              <option value="">Select...</option>
              {options.map((opt) => {
                // Handle both string arrays and object arrays
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                return (
                  <option key={optValue} value={optValue}>
                    {optLabel}
                  </option>
                );
              })}
            </select>
            {fieldConfig.helpText && <small className="help-text">{fieldConfig.helpText}</small>}
            {error && <span className="error-text">{error}</span>}
          </div>
        );

      case 'multiselect':
        const multiOptions = Array.isArray(fieldConfig.options)
          ? fieldConfig.options
          : [];
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="form-group" key={fieldName}>
            <label>
              {fieldConfig.label}
              {fieldConfig.required && <span className="required">*</span>}
            </label>
            <div className="multiselect-options">
              {multiOptions.map((opt) => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isSelected = selectedValues.includes(optValue);
                return (
                  <label key={optValue} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFieldChange(fieldName, [...selectedValues, optValue]);
                        } else {
                          handleFieldChange(fieldName, selectedValues.filter(v => v !== optValue));
                        }
                      }}
                    />
                    <span>{optLabel}</span>
                  </label>
                );
              })}
            </div>
            {fieldConfig.helpText && <small className="help-text">{fieldConfig.helpText}</small>}
            {error && <span className="error-text">{error}</span>}
          </div>
        );

      case 'checkbox':
        return (
          <div className="form-group checkbox-group" key={fieldName}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              />
              <span>{fieldConfig.label}</span>
            </label>
            {fieldConfig.helpText && <small className="help-text">{fieldConfig.helpText}</small>}
          </div>
        );

      default:
        return (
          <div className="form-group" key={fieldName}>
            <label>{fieldConfig.label}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={fieldConfig.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="item-form dynamic-item-form">
      <div className="form-header">
        <h3>{initialData ? 'Edit' : 'Create'} {template.label}</h3>
        <p className="form-subtitle">{system.name}</p>
      </div>

      {/* Base fields */}
      <div className="form-section">
        <h4>Basic Info</h4>

        <div className="form-group">
          <label>
            Name
            <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleBaseFieldChange('name', e.target.value)}
            placeholder={`Enter ${template.label.toLowerCase()} name`}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleBaseFieldChange('description', e.target.value)}
            placeholder="Describe this item..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleBaseFieldChange('imageUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* System-specific fields */}
      <div className="form-section">
        <h4>{template.label} Details</h4>
        {Object.entries(template.fields || {}).map(([fieldName, fieldConfig]) =>
          renderField(fieldName, fieldConfig)
        )}
      </div>

      {/* Visibility */}
      <div className="form-section">
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.hidden}
              onChange={(e) => handleBaseFieldChange('hidden', e.target.checked)}
            />
            <span>Hidden from players</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X size={16} />
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              {initialData ? 'Update' : 'Create'} {template.label}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
