import React, { useState } from 'react';
import { Zap, Key, Settings } from 'lucide-react';
import '../CampaignBuilder.css';

/**
 * Direct API Generator Component
 * Generates content using user's API key for seamless in-app generation
 */
export default function DirectAPIGenerator({
  type,
  apiKey,
  provider,
  onGenerateWithAPI,
  onOpenAPISettings,
  generating
}) {
  const [requirements, setRequirements] = useState({});

  const handleGenerate = () => {
    onGenerateWithAPI(requirements);
  };

  const renderRequirements = () => {
    if (type === 'npc') {
      return (
        <div className="generator-requirements">
          <div className="form-group">
            <label>Name (Optional)</label>
            <input
              type="text"
              value={requirements.name || ''}
              onChange={(e) => setRequirements({ ...requirements, name: e.target.value })}
              placeholder="Leave blank for AI to generate"
            />
          </div>

          <div className="form-group">
            <label>Occupation (Optional)</label>
            <input
              type="text"
              value={requirements.occupation || ''}
              onChange={(e) => setRequirements({ ...requirements, occupation: e.target.value })}
              placeholder="e.g., Blacksmith, Merchant"
            />
          </div>

          <div className="form-group">
            <label>Relationship (Optional)</label>
            <select
              value={requirements.relationship || ''}
              onChange={(e) => setRequirements({ ...requirements, relationship: e.target.value })}
            >
              <option value="">AI decides</option>
              <option value="ally">Ally</option>
              <option value="neutral">Neutral</option>
              <option value="enemy">Enemy</option>
            </select>
          </div>
        </div>
      );
    }

    if (type === 'location') {
      return (
        <div className="generator-requirements">
          <div className="form-group">
            <label>Name (Optional)</label>
            <input
              type="text"
              value={requirements.name || ''}
              onChange={(e) => setRequirements({ ...requirements, name: e.target.value })}
              placeholder="Leave blank for AI to generate"
            />
          </div>

          <div className="form-group">
            <label>Type (Optional)</label>
            <select
              value={requirements.type || ''}
              onChange={(e) => setRequirements({ ...requirements, type: e.target.value })}
            >
              <option value="">AI decides</option>
              <option value="city">City</option>
              <option value="town">Town</option>
              <option value="village">Village</option>
              <option value="dungeon">Dungeon</option>
              <option value="wilderness">Wilderness</option>
              <option value="landmark">Landmark</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Region (Optional)</label>
            <input
              type="text"
              value={requirements.region || ''}
              onChange={(e) => setRequirements({ ...requirements, region: e.target.value })}
              placeholder="e.g., The Northlands"
            />
          </div>
        </div>
      );
    }

    if (type === 'encounter') {
      return (
        <div className="generator-requirements">
          <div className="form-group">
            <label>Difficulty (Optional)</label>
            <select
              value={requirements.difficulty || ''}
              onChange={(e) => setRequirements({ ...requirements, difficulty: e.target.value })}
            >
              <option value="">AI decides</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
          </div>

          <div className="form-group">
            <label>Environment (Optional)</label>
            <input
              type="text"
              value={requirements.environment || ''}
              onChange={(e) => setRequirements({ ...requirements, environment: e.target.value })}
              placeholder="e.g., Dense forest, Ancient ruins"
            />
          </div>

          <div className="form-group">
            <label>Enemy Types (Optional)</label>
            <input
              type="text"
              value={requirements.enemyTypes || ''}
              onChange={(e) => setRequirements({ ...requirements, enemyTypes: e.target.value })}
              placeholder="e.g., Bandits, Undead"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (!apiKey) {
    return (
      <div className="api-generator no-key">
        <div className="generator-info warning">
          <Key size={24} />
          <div>
            <h4>API Key Required</h4>
            <p>You need to configure your API key to use direct generation.</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onOpenAPISettings}>
          <Settings size={20} />
          Configure API Key
        </button>
      </div>
    );
  }

  return (
    <div className="api-generator">
      <div className="generator-info">
        <Zap size={24} />
        <div>
          <h4>Direct AI Generation</h4>
          <p>Generate content instantly using your {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key.</p>
        </div>
      </div>

      {renderRequirements()}

      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate with AI'}
      </button>

      <button
        className="btn btn-link btn-sm"
        onClick={onOpenAPISettings}
      >
        <Settings size={16} />
        Change API Settings
      </button>
    </div>
  );
}
