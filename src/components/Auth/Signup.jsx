import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, UserPlus, Chrome } from 'lucide-react';
import './Auth.css';

export default function Signup({ onToggleForm }) {
  const { signup, signInWithGoogle } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, displayName);
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      default:
        return 'Failed to create account. Please try again';
    }
  }

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      <p className="auth-subtitle">Start managing your Daggerheart campaigns</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Display Name</label>
          <div className="input-with-icon">
            <User size={18} />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Email</label>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Password</label>
          <div className="input-with-icon">
            <Lock size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength="6"
              disabled={loading}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Confirm Password</label>
          <div className="input-with-icon">
            <Lock size={18} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength="6"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary full-width"
          disabled={loading}
        >
          <UserPlus size={18} />
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button
        type="button"
        className="btn btn-secondary full-width"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <Chrome size={18} />
        Continue with Google
      </button>

      <p className="auth-footer">
        Already have an account?{' '}
        <button className="link-button" onClick={onToggleForm} disabled={loading}>
          Sign in
        </button>
      </p>
    </div>
  );
}
