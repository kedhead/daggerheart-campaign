import { BookOpen, Link2, Brain, Users, Map, Wand2, Zap, Database, Keyboard, ExternalLink } from 'lucide-react';
import './HelpView.css';

export default function HelpView({ campaign }) {
  const gameSystem = campaign?.gameSystem || 'daggerheart';

  return (
    <div className="help-view">
      <div className="help-header">
        <BookOpen size={48} />
        <div>
          <h1>Features & Help</h1>
          <p className="help-subtitle">Discover what you can do with your campaign manager</p>
        </div>
      </div>

      {/* Wiki Features */}
      <section className="help-section card">
        <div className="help-section-header">
          <Link2 size={24} />
          <h2>Wiki-Style Linking</h2>
        </div>
        <div className="help-content">
          <p>Connect your campaign entities together with wiki-style links.</p>

          <div className="help-feature">
            <h3>How to Create Links</h3>
            <div className="help-steps">
              <div className="help-step">
                <span className="step-number">1</span>
                <div>
                  <strong>Type <code>[[</code> in any text field</strong>
                  <p>An autocomplete dropdown will appear showing all entities in your campaign</p>
                </div>
              </div>
              <div className="help-step">
                <span className="step-number">2</span>
                <div>
                  <strong>Search and select an entity</strong>
                  <p>Use arrow keys (↑↓) to navigate, Enter or Tab to insert</p>
                </div>
              </div>
              <div className="help-step">
                <span className="step-number">3</span>
                <div>
                  <strong>Link is created automatically</strong>
                  <p>The entity name is inserted as <code>[[Entity Name]]</code></p>
                </div>
              </div>
            </div>
          </div>

          <div className="help-tip">
            <strong>💡 Tip:</strong> Links work in NPCs, Notes, Locations, Lore, Sessions, Timeline Events, and Encounters
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="help-section card">
        <div className="help-section-header">
          <Brain size={24} />
          <h2>AI-Powered Campaign Builder</h2>
        </div>
        <div className="help-content">
          <p>Generate rich campaign content with AI assistance.</p>

          <div className="help-feature">
            <h3>Campaign Frame Generation</h3>
            <p>Create a complete campaign foundation including:</p>
            <ul>
              <li><strong>Campaign Theme & Tone</strong> - Setting, mood, and atmosphere</li>
              <li><strong>Core Story</strong> - Main plot, conflicts, and objectives</li>
              <li><strong>Key NPCs</strong> - Major characters with motivations</li>
              <li><strong>Important Locations</strong> - Detailed places with descriptions</li>
              <li><strong>World Map</strong> - AI-generated visual map (requires OpenAI API)</li>
              <li><strong>Starting Quests</strong> - Initial adventure hooks</li>
            </ul>
          </div>

          <div className="help-feature">
            <h3>Quick Generators</h3>
            <p>Generate individual entities on-demand:</p>
            <ul>
              <li>NPCs with portraits, backgrounds, and personalities</li>
              <li>Locations with maps and notable features</li>
              <li>Combat Encounters with balanced difficulty</li>
            </ul>
            <div className="help-tip">
              <strong>✨ Look for the "Generate with AI" button</strong> in NPCs, Locations, and Encounters views
            </div>
          </div>

          <div className="help-feature">
            <h3>Setting Up AI Features</h3>
            <div className="help-steps">
              <div className="help-step">
                <span className="step-number">1</span>
                <div>
                  <strong>Add API Keys</strong>
                  <p>Go to Settings → API Settings and add your Anthropic (Claude) or OpenAI keys</p>
                </div>
              </div>
              <div className="help-step">
                <span className="step-number">2</span>
                <div>
                  <strong>Choose Your Provider</strong>
                  <p>Anthropic (Claude) for text, OpenAI for image generation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-System Support */}
      <section className="help-section card">
        <div className="help-section-header">
          <Database size={24} />
          <h2>Multi-System Support</h2>
        </div>
        <div className="help-content">
          <p>Built-in support for multiple game systems with themed UI:</p>
          <ul>
            <li><strong>Daggerheart</strong> - Purple & Gold theme, Hope/Fear mechanics</li>
            <li><strong>D&D 5th Edition</strong> - Fantasy templates and locations</li>
            <li><strong>Star Wars D6</strong> - Sci-fi themed maps and terminology</li>
            <li><strong>Generic/Custom</strong> - Flexible system for any RPG</li>
          </ul>
          <div className="help-tip">
            <strong>💡 Tip:</strong> The entire UI adapts to your chosen system - map styles, AI prompts, and theming all change automatically!
          </div>
        </div>
      </section>

      {/* Campaign Management */}
      <section className="help-section card">
        <div className="help-section-header">
          <Users size={24} />
          <h2>Campaign Management</h2>
        </div>
        <div className="help-content">
          <div className="help-feature">
            <h3>Player & DM Modes</h3>
            <ul>
              <li><strong>DM Mode</strong> - Full access to create, edit, and manage all content</li>
              <li><strong>Player Mode</strong> - View shared content and manage personal notes</li>
            </ul>
          </div>

          <div className="help-feature">
            <h3>Invite Players</h3>
            <div className="help-steps">
              <div className="help-step">
                <span className="step-number">1</span>
                <div>
                  <strong>Go to Campaign Members</strong>
                  <p>Click "Manage Members" from the sidebar</p>
                </div>
              </div>
              <div className="help-step">
                <span className="step-number">2</span>
                <div>
                  <strong>Generate Invite Link</strong>
                  <p>Create a secure invite link valid for 7 days</p>
                </div>
              </div>
              <div className="help-step">
                <span className="step-number">3</span>
                <div>
                  <strong>Share with Players</strong>
                  <p>Players join automatically when they click the link</p>
                </div>
              </div>
            </div>
          </div>

          <div className="help-feature">
            <h3>Entity Types</h3>
            <p>Organize your campaign across multiple entity types:</p>
            <div className="entity-grid">
              <div className="entity-type">
                <strong>NPCs</strong>
                <p>Characters with portraits, relationships, and notes</p>
              </div>
              <div className="entity-type">
                <strong>Locations</strong>
                <p>Places with maps, descriptions, and secrets</p>
              </div>
              <div className="entity-type">
                <strong>Lore</strong>
                <p>World-building entries with categories and tags</p>
              </div>
              <div className="entity-type">
                <strong>Sessions</strong>
                <p>Session logs with highlights and DM notes</p>
              </div>
              <div className="entity-type">
                <strong>Timeline</strong>
                <p>In-game events with dates and outcomes</p>
              </div>
              <div className="entity-type">
                <strong>Encounters</strong>
                <p>Combat templates with difficulty and tactics</p>
              </div>
              <div className="entity-type">
                <strong>Notes</strong>
                <p>Personal player notes by category</p>
              </div>
              <div className="entity-type">
                <strong>Characters</strong>
                <p>Player characters with stats (system-dependent)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Maps & Files */}
      <section className="help-section card">
        <div className="help-section-header">
          <Map size={24} />
          <h2>Maps & Files</h2>
        </div>
        <div className="help-content">
          <div className="help-feature">
            <h3>World Map</h3>
            <ul>
              <li>Upload your own world map (up to 10MB)</li>
              <li>Generate maps with AI based on campaign setting</li>
              <li>Maps stored in Firebase Storage for fast loading</li>
            </ul>
          </div>

          <div className="help-feature">
            <h3>AI Map Generation</h3>
            <p>Create custom maps with AI:</p>
            <ul>
              <li><strong>World Map</strong> - Overview of your campaign world</li>
              <li><strong>Regional Map</strong> - Specific areas and territories</li>
              <li><strong>Local Map</strong> - Cities, towns, or specific locations</li>
              <li><strong>Dungeon/Facility Map</strong> - Interior spaces and tactical layouts</li>
            </ul>
            <div className="help-tip">
              <strong>✨ Custom Style Keywords:</strong> Add keywords like "watercolor", "vintage", or "detailed" to customize map aesthetics
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="help-section card">
        <div className="help-section-header">
          <Zap size={24} />
          <h2>Integrations</h2>
        </div>
        <div className="help-content">
          <div className="help-feature">
            <h3>FreshCutGrass Encounter Manager</h3>
            <p>Build detailed combat encounters with the full FreshCutGrass toolkit:</p>
            <ul>
              <li>Create encounters on <a href="https://freshcutgrass.app/encounter-manager" target="_blank" rel="noopener noreferrer">FreshCutGrass <ExternalLink size={14} /></a></li>
              <li>Link encounters in Session logs</li>
              <li>Save encounter templates with links for quick reference</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="help-section card">
        <div className="help-section-header">
          <Keyboard size={24} />
          <h2>Tips & Shortcuts</h2>
        </div>
        <div className="help-content">
          <div className="shortcuts-grid">
            <div className="shortcut">
              <code>[[</code>
              <span>Open entity autocomplete</span>
            </div>
            <div className="shortcut">
              <code>↑ ↓</code>
              <span>Navigate autocomplete results</span>
            </div>
            <div className="shortcut">
              <code>Enter</code>
              <span>Insert selected entity</span>
            </div>
            <div className="shortcut">
              <code>Esc</code>
              <span>Close autocomplete</span>
            </div>
          </div>

          <div className="help-feature">
            <h3>Best Practices</h3>
            <ul>
              <li><strong>Link Related Entities</strong> - Connect NPCs to locations, sessions to events, etc.</li>
              <li><strong>Use Categories</strong> - Organize notes and lore with appropriate categories</li>
              <li><strong>Regular Session Logs</strong> - Document sessions promptly while details are fresh</li>
              <li><strong>DM Notes</strong> - Use hidden/DM-only fields for secrets and future plot points</li>
              <li><strong>Campaign Frame First</strong> - Start with Campaign Builder for a solid foundation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="help-footer">
        <p>Need more help? Have feedback or feature requests?</p>
        <a href="https://github.com/kedhead/daggerheart-campaign/issues" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          <ExternalLink size={16} />
          Report an Issue or Request a Feature
        </a>
      </div>
    </div>
  );
}
