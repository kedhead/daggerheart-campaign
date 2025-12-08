import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';
import './Auth.css';

export default function ForgotPassword({ onBack }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setSuccess(false);
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/invalid-email':
        return 'Invalid email address';
      default:
        return 'Failed to send reset email. Please try again';
    }
  }

  return (
    <div className="auth-form">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        Back to login
      </button>

      <h2>Reset Password</h2>
      <p className="auth-subtitle">We'll send you a link to reset your password</p>

      {error && <div className="auth-error">{error}</div>}
      {success && (
        <div className="auth-success">
          Password reset email sent! Check your inbox.
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
              disabled={loading || success}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary full-width"
          disabled={loading || success}
        >
          {loading ? 'Sending...' : success ? 'Email Sent!' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}
