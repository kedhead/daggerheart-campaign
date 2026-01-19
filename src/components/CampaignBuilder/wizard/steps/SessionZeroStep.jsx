import { useState } from 'react';
import { Plus, X, Sparkles, Shield, Users, Globe, MapPin, HelpCircle, AlertTriangle, Check } from 'lucide-react';
import WizardStep from '../WizardStep';
import { templateService } from '../../../../services/templateService';

const TABS = [
  { id: 'safety', label: 'Safety Tools', icon: Shield },
  { id: 'connections', label: 'Connections', icon: Users },
  { id: 'worldFacts', label: 'World Facts', icon: Globe },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'questions', label: 'Questions', icon: HelpCircle }
];

const WORLD_FACT_CATEGORIES = [
  { id: 'geography', label: 'Geography' },
  { id: 'culture', label: 'Culture' },
  { id: 'history', label: 'History' },
  { id: 'magic', label: 'Magic' },
  { id: 'other', label: 'Other' }
];

const LOCATION_TYPES = [
  'city', 'town', 'village', 'dungeon', 'wilderness', 'landmark', 'other'
];

export default function SessionZeroStep({ value = {}, onChange }) {
  const [activeTab, setActiveTab] = useState('safety');
  const [newLine, setNewLine] = useState('');
  const [newVeil, setNewVeil] = useState('');
  const [newQuestion, setNewQuestion] = useState('');

  // Ensure value has the expected structure
  const sessionZero = {
    safetyTools: value.safetyTools || { lines: [], veils: [], xCardEnabled: true, otherBoundaries: '' },
    characterConnections: value.characterConnections || [],
    worldFacts: value.worldFacts || [],
    playerLocations: value.playerLocations || [],
    questions: value.questions || []
  };

  const generateId = () => `sz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const updateSessionZero = (field, fieldValue) => {
    onChange({ ...sessionZero, [field]: fieldValue });
  };

  // Safety Tools handlers
  const addLine = () => {
    if (newLine.trim()) {
      updateSessionZero('safetyTools', {
        ...sessionZero.safetyTools,
        lines: [...sessionZero.safetyTools.lines, newLine.trim()]
      });
      setNewLine('');
    }
  };

  const removeLine = (index) => {
    updateSessionZero('safetyTools', {
      ...sessionZero.safetyTools,
      lines: sessionZero.safetyTools.lines.filter((_, i) => i !== index)
    });
  };

  const addVeil = () => {
    if (newVeil.trim()) {
      updateSessionZero('safetyTools', {
        ...sessionZero.safetyTools,
        veils: [...sessionZero.safetyTools.veils, newVeil.trim()]
      });
      setNewVeil('');
    }
  };

  const removeVeil = (index) => {
    updateSessionZero('safetyTools', {
      ...sessionZero.safetyTools,
      veils: sessionZero.safetyTools.veils.filter((_, i) => i !== index)
    });
  };

  const toggleXCard = () => {
    updateSessionZero('safetyTools', {
      ...sessionZero.safetyTools,
      xCardEnabled: !sessionZero.safetyTools.xCardEnabled
    });
  };

  const updateOtherBoundaries = (text) => {
    updateSessionZero('safetyTools', {
      ...sessionZero.safetyTools,
      otherBoundaries: text
    });
  };

  // Character Connections handlers
  const addConnection = () => {
    const newConnection = {
      id: generateId(),
      question: '',
      answer: ''
    };
    updateSessionZero('characterConnections', [...sessionZero.characterConnections, newConnection]);
  };

  const updateConnection = (id, field, fieldValue) => {
    updateSessionZero('characterConnections',
      sessionZero.characterConnections.map(conn =>
        conn.id === id ? { ...conn, [field]: fieldValue } : conn
      )
    );
  };

  const removeConnection = (id) => {
    updateSessionZero('characterConnections',
      sessionZero.characterConnections.filter(conn => conn.id !== id)
    );
  };

  const generateConnections = () => {
    const generated = templateService.generateCharacterConnections(3);
    const newConnections = generated.map(q => ({
      id: generateId(),
      question: q,
      answer: ''
    }));
    updateSessionZero('characterConnections', [...sessionZero.characterConnections, ...newConnections]);
  };

  // World Facts handlers
  const addWorldFact = () => {
    const newFact = {
      id: generateId(),
      fact: '',
      establishedBy: '',
      category: 'other'
    };
    updateSessionZero('worldFacts', [...sessionZero.worldFacts, newFact]);
  };

  const updateWorldFact = (id, field, fieldValue) => {
    updateSessionZero('worldFacts',
      sessionZero.worldFacts.map(fact =>
        fact.id === id ? { ...fact, [field]: fieldValue } : fact
      )
    );
  };

  const removeWorldFact = (id) => {
    updateSessionZero('worldFacts',
      sessionZero.worldFacts.filter(fact => fact.id !== id)
    );
  };

  const generateWorldFactPrompts = () => {
    const prompts = templateService.generateWorldFactPrompts(3);
    const newFacts = prompts.map(prompt => ({
      id: generateId(),
      fact: prompt,
      establishedBy: '',
      category: 'other'
    }));
    updateSessionZero('worldFacts', [...sessionZero.worldFacts, ...newFacts]);
  };

  // Player Locations handlers
  const addPlayerLocation = () => {
    const newLocation = {
      id: generateId(),
      name: '',
      type: 'other',
      region: '',
      description: '',
      mentionedBy: '',
      createAsLocation: true
    };
    updateSessionZero('playerLocations', [...sessionZero.playerLocations, newLocation]);
  };

  const updatePlayerLocation = (id, field, fieldValue) => {
    updateSessionZero('playerLocations',
      sessionZero.playerLocations.map(loc =>
        loc.id === id ? { ...loc, [field]: fieldValue } : loc
      )
    );
  };

  const removePlayerLocation = (id) => {
    updateSessionZero('playerLocations',
      sessionZero.playerLocations.filter(loc => loc.id !== id)
    );
  };

  // Questions handlers
  const addQuestion = () => {
    if (newQuestion.trim()) {
      updateSessionZero('questions', [...sessionZero.questions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const removeQuestion = (index) => {
    updateSessionZero('questions', sessionZero.questions.filter((_, i) => i !== index));
  };

  const generateQuestions = () => {
    const generated = templateService.generateSessionZeroQuestions(5);
    updateSessionZero('questions', [...sessionZero.questions, ...generated]);
  };

  // Render Safety Tools tab
  const renderSafetyTools = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* X-Card */}
      <div className="card" style={{ padding: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={sessionZero.safetyTools.xCardEnabled}
            onChange={toggleXCard}
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--hope-color)' }} />
              X-Card Enabled
            </strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Any player can tap the X-Card to skip or fade-to-black uncomfortable content, no questions asked.
            </p>
          </div>
        </label>
      </div>

      {/* Lines */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <X size={16} style={{ color: 'var(--fear-color)' }} />
          Lines (Hard No)
        </label>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
          Topics that should never appear in the game at all.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {sessionZero.safetyTools.lines.map((line, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--fear-color)' }}>
              <X size={14} style={{ color: 'var(--fear-color)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{line}</span>
              <button onClick={() => removeLine(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newLine}
            onChange={(e) => setNewLine(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addLine()}
            placeholder="Add a line..."
            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <button className="btn btn-secondary" onClick={addLine}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Veils */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} style={{ color: 'var(--hope-color)' }} />
          Veils (Off-Screen)
        </label>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
          Topics that can exist in the world but happen off-screen or fade-to-black.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {sessionZero.safetyTools.veils.map((veil, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--hope-color)' }}>
              <Shield size={14} style={{ color: 'var(--hope-color)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{veil}</span>
              <button onClick={() => removeVeil(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newVeil}
            onChange={(e) => setNewVeil(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addVeil()}
            placeholder="Add a veil..."
            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <button className="btn btn-secondary" onClick={addVeil}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Other Boundaries */}
      <div className="form-group" style={{ margin: 0 }}>
        <label>Other Boundaries or Notes</label>
        <textarea
          value={sessionZero.safetyTools.otherBoundaries}
          onChange={(e) => updateOtherBoundaries(e.target.value)}
          placeholder="Any other safety considerations, accessibility needs, or table agreements..."
          rows={3}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
        />
      </div>
    </div>
  );

  // Render Character Connections tab
  const renderCharacterConnections = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
        Questions to establish relationships between party members. Fill these in during session zero with your players.
      </p>

      {sessionZero.characterConnections.map((conn) => (
        <div key={conn.id} className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={conn.question}
                onChange={(e) => updateConnection(conn.id, 'question', e.target.value)}
                placeholder="Connection question..."
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontWeight: 500 }}
              />
              <button
                onClick={() => removeConnection(conn.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={conn.answer}
              onChange={(e) => updateConnection(conn.id, 'answer', e.target.value)}
              placeholder="Answer (filled during session zero)..."
              rows={2}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
            />
          </div>
        </div>
      ))}

      {sessionZero.characterConnections.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '2px dashed var(--border)' }}>
          <Users size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No connection questions yet. Add questions to help players establish party relationships.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={addConnection}>
          <Plus size={18} />
          Add Question
        </button>
        <button className="btn btn-secondary" onClick={generateConnections}>
          <Sparkles size={18} />
          Generate Questions
        </button>
      </div>
    </div>
  );

  // Render World Facts tab
  const renderWorldFacts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
        Facts about the world established by players during session zero. Let players shape the world!
      </p>

      {sessionZero.worldFacts.map((fact) => (
        <div key={fact.id} className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <textarea
                value={fact.fact}
                onChange={(e) => updateWorldFact(fact.id, 'fact', e.target.value)}
                placeholder="World fact or prompt..."
                rows={2}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
              />
              <button
                onClick={() => removeWorldFact(fact.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={fact.category}
                onChange={(e) => updateWorldFact(fact.id, 'category', e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minWidth: '120px' }}
              >
                {WORLD_FACT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={fact.establishedBy}
                onChange={(e) => updateWorldFact(fact.id, 'establishedBy', e.target.value)}
                placeholder="Established by (player name)..."
                style={{ flex: 1, minWidth: '150px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
          </div>
        </div>
      ))}

      {sessionZero.worldFacts.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '2px dashed var(--border)' }}>
          <Globe size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No world facts yet. Add prompts for players to establish world details.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={addWorldFact}>
          <Plus size={18} />
          Add Fact
        </button>
        <button className="btn btn-secondary" onClick={generateWorldFactPrompts}>
          <Sparkles size={18} />
          Generate Prompts
        </button>
      </div>
    </div>
  );

  // Render Player Locations tab
  const renderPlayerLocations = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
        Locations mentioned by players during session zero. Check "Create as Location" to automatically add them to your campaign.
      </p>

      {sessionZero.playerLocations.map((loc) => (
        <div key={loc.id} className="card" style={{ padding: '1rem', border: loc.createAsLocation ? '2px solid var(--hope-color)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={loc.name}
                onChange={(e) => updatePlayerLocation(loc.id, 'name', e.target.value)}
                placeholder="Location name..."
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontWeight: 500 }}
              />
              <button
                onClick={() => removePlayerLocation(loc.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={loc.type}
                onChange={(e) => updatePlayerLocation(loc.id, 'type', e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minWidth: '120px' }}
              >
                {LOCATION_TYPES.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
              <input
                type="text"
                value={loc.region}
                onChange={(e) => updatePlayerLocation(loc.id, 'region', e.target.value)}
                placeholder="Region..."
                style={{ flex: 1, minWidth: '120px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                type="text"
                value={loc.mentionedBy}
                onChange={(e) => updatePlayerLocation(loc.id, 'mentionedBy', e.target.value)}
                placeholder="Mentioned by..."
                style={{ flex: 1, minWidth: '120px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <textarea
              value={loc.description}
              onChange={(e) => updatePlayerLocation(loc.id, 'description', e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={loc.createAsLocation}
                onChange={(e) => updatePlayerLocation(loc.id, 'createAsLocation', e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: loc.createAsLocation ? 'var(--hope-color)' : 'var(--text-secondary)' }}>
                {loc.createAsLocation ? <Check size={16} /> : <MapPin size={16} />}
                Create as Location
              </span>
            </label>
          </div>
        </div>
      ))}

      {sessionZero.playerLocations.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '2px dashed var(--border)' }}>
          <MapPin size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No player locations yet. Add locations your players mention during session zero.
          </p>
        </div>
      )}

      <button className="btn btn-primary" onClick={addPlayerLocation} style={{ alignSelf: 'flex-start' }}>
        <Plus size={18} />
        Add Location
      </button>
    </div>
  );

  // Render Questions tab (legacy support)
  const renderQuestions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
        Additional questions to discuss during session zero.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sessionZero.questions.map((question, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '4px' }}>
            <HelpCircle size={16} style={{ color: 'var(--hope-color)', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{question}</span>
            <button
              onClick={() => removeQuestion(index)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', color: 'var(--text)', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {sessionZero.questions.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '2px dashed var(--border)' }}>
          <HelpCircle size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No additional questions yet.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
          placeholder="Add a session zero question..."
          style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
        <button className="btn btn-primary" onClick={addQuestion}>
          <Plus size={20} />
          Add
        </button>
      </div>

      <button className="btn btn-secondary" onClick={generateQuestions} style={{ alignSelf: 'flex-start' }}>
        <Sparkles size={20} />
        Generate Questions
      </button>
    </div>
  );

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'safety': return renderSafetyTools();
      case 'connections': return renderCharacterConnections();
      case 'worldFacts': return renderWorldFacts();
      case 'locations': return renderPlayerLocations();
      case 'questions': return renderQuestions();
      default: return null;
    }
  };

  // Count items in each tab for badges
  const getTabCount = (tabId) => {
    switch (tabId) {
      case 'safety':
        return sessionZero.safetyTools.lines.length + sessionZero.safetyTools.veils.length;
      case 'connections':
        return sessionZero.characterConnections.length;
      case 'worldFacts':
        return sessionZero.worldFacts.length;
      case 'locations':
        return sessionZero.playerLocations.length;
      case 'questions':
        return sessionZero.questions.length;
      default:
        return 0;
    }
  };

  return (
    <WizardStep
      title="Session Zero"
      description="Prepare for your session zero with safety tools, character connections, and world-building prompts."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px 4px 0 0',
                  background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  color: isActive ? 'var(--hope-color)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive ? '2px solid var(--hope-color)' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span style={{
                    background: isActive ? 'var(--hope-color)' : 'var(--bg-tertiary)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    padding: '0 0.5rem',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {renderTabContent()}
        </div>
      </div>
    </WizardStep>
  );
}
