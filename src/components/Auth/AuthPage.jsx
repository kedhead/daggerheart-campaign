import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import './Auth.css';

export default function AuthPage() {
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot'

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <img src="/lorelichheader.png" alt="Lorelich" className="auth-logo" />
        </div>

        {view === 'login' && (
          <Login
            onToggleForm={() => setView('signup')}
            onForgotPassword={() => setView('forgot')}
          />
        )}

        {view === 'signup' && (
          <Signup onToggleForm={() => setView('login')} />
        )}

        {view === 'forgot' && (
          <ForgotPassword onBack={() => setView('login')} />
        )}

        <div className="auth-footer-text">
          <p>Free campaign management for TTRPGs</p>
          <p className="auth-credits">
            <a href="https://lorelich.com" target="_blank" rel="noopener noreferrer">
              lorelich.com
            </a>
            {' '}•{' '}
            Powered by{' '}
            <a href="https://freshcutgrass.app" target="_blank" rel="noopener noreferrer">
              FreshCutGrass
            </a>
            {' '}&{' '}
            <a href="https://app.demiplane.com/nexus/daggerheart" target="_blank" rel="noopener noreferrer">
              Demiplane
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
