import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import '../CampaignBuilder.css';

/**
 * Template Generator Component
 * Generates content using pre-built templates and random generators
 */
export default function TemplateGenerator({ type, requirements, onGenerate, generating }) {
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleGenerate = () => {
    const context = {
      ...requirements,
      ...selectedOptions
    };
    onGenerate(context);
  };

  const renderRequirements = () => {
    if (type === 'npc') {
      return (
        <div className="generator-requirements">
          <div className="form-group">
            <label>Relationship (Optional)</label>
            <select
              value={selectedOptions.relationship || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, relationship: e.target.value })}
            >
              <option value="">Random</option>
              <option value="ally">Ally</option>
              <option value="neutral">Neutral</option>
              <option value="enemy">Enemy</option>
            </select>
          </div>

          <div className="form-group">
            <label>Occupation (Optional)</label>
            <input
              type="text"
              value={selectedOptions.occupation || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, occupation: e.target.value })}
              placeholder="Leave blank for random"
            />
          </div>

          <div className="form-group">
            <label>Location (Optional)</label>
            <input
              type="text"
              value={selectedOptions.location || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, location: e.target.value })}
              placeholder="Leave blank for random"
            />
          </div>
        </div>
      );
    }

    if (type === 'location') {
      return (
        <div className="generator-requirements">
          <div className="form-group">
            <label>Type (Optional)</label>
            <select
              value={selectedOptions.type || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, type: e.target.value })}
            >
              <option value="">Random</option>
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
              value={selectedOptions.region || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, region: e.target.value })}
              placeholder="Leave blank for random"
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
              value={selectedOptions.difficulty || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, difficulty: e.target.value })}
            >
              <option value="">Random</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
          </div>

          <div className="form-group">
            <label>Party Level (Optional)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={selectedOptions.partyLevel || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, partyLevel: parseInt(e.target.value) })}
              placeholder="1"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="template-generator">
      <div className="generator-info">
        <Sparkles size={24} />
        <div>
          <h4>Random Template Generation</h4>
          <p>Instantly generate content from curated lists. No AI required!</p>
        </div>
      </div>

      {renderRequirements()}

      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
