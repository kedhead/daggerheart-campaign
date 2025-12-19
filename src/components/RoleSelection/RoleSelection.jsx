import { useState } from 'react';
import { Crown, User } from 'lucide-react';
import './RoleSelection.css';

export default function RoleSelection({ onSelectRole }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <div className="role-selection">
      <div className="role-selection-container">
        <h1>Welcome to Lorelich</h1>
        <p className="role-selection-subtitle">How do you want to use this app?</p>

        <div className="role-options">
          <button
            className={`role-option ${selectedRole === 'dm' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('dm')}
          >
            <div className="role-icon dm">
              <Crown size={48} />
            </div>
            <h3>I'm a Dungeon Master</h3>
            <p>Create and manage campaigns, invite players, track sessions and lore</p>
          </button>

          <button
            className={`role-option ${selectedRole === 'player' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('player')}
          >
            <div className="role-icon player">
              <User size={48} />
            </div>
            <h3>I'm a Player</h3>
            <p>Join campaigns, manage your character, and view campaign information</p>
          </button>
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          Continue
        </button>

        <p className="role-selection-note">
          Don't worry, you can always join campaigns as a player even if you choose DM, and vice versa.
        </p>
      </div>
    </div>
  );
}
