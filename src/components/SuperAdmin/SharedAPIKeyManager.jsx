import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Key, Users, Calendar, Zap, AlertTriangle } from 'lucide-react';
import { useSharedAPIKeyAdmin } from '../../hooks/useSharedAPIKey';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function SharedAPIKeyManager() {
  const { config, loading, saveConfig } = useSharedAPIKeyAdmin();
  const [formData, setFormData] = useState({
    enabled: false,
    anthropicKey: '',
    openaiKey: '',
    dailyLimit: 10,
    monthlyLimit: 100
  });
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [recentUsage, setRecentUsage] = useState([]);
  const [loadingUsage, setLoadingUsage] = useState(true);

  // Load config into form
  useEffect(() => {
    if (config) {
      setFormData({
        enabled: config.enabled || false,
        anthropicKey: config.anthropicKey || '',
        openaiKey: config.openaiKey || '',
        dailyLimit: config.dailyLimit || 10,
        monthlyLimit: config.monthlyLimit || 100
      });
    }
  }, [config]);

  // Load recent usage stats
  useEffect(() => {
    async function loadUsage() {
      try {
        const usageRef = collection(db, 'userUsage');
        const q = query(usageRef, orderBy('lastUsed', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const usage = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentUsage(usage);
      } catch (err) {
        console.error('Failed to load usage:', err);
      } finally {
        setLoadingUsage(false);
      }
    }
    loadUsage();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await saveConfig(formData);
      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="card">Loading shared API key configuration...</div>;
  }

  return (
    <div className="shared-api-manager" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Key size={20} />
          Shared API Key Configuration
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Configure API keys that all users can use with daily/monthly limits. Users without their own keys will use these shared keys.
        </p>

        {/* Enable/Disable Toggle */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: formData.enabled ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-tertiary)', borderRadius: '8px', border: formData.enabled ? '1px solid var(--hope-color)' : '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <div>
              <strong style={{ color: formData.enabled ? 'var(--hope-color)' : 'var(--text)' }}>
                {formData.enabled ? 'Shared Keys Enabled' : 'Shared Keys Disabled'}
              </strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {formData.enabled
                  ? 'Users without their own API keys can use your shared keys (with limits)'
                  : 'Users must provide their own API keys to use AI features'}
              </p>
            </div>
          </label>
        </div>

        {/* API Keys */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Anthropic Key */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Anthropic API Key</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type={showAnthropicKey ? 'text' : 'password'}
                value={formData.anthropicKey}
                onChange={(e) => handleChange('anthropicKey', e.target.value)}
                placeholder="sk-ant-..."
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text)' }}
              >
                {showAnthropicKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.anthropicKey && (
              <small style={{ color: 'var(--hope-color)' }}>Key configured</small>
            )}
          </div>

          {/* OpenAI Key */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>OpenAI API Key (for DALL-E map images)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type={showOpenaiKey ? 'text' : 'password'}
                value={formData.openaiKey}
                onChange={(e) => handleChange('openaiKey', e.target.value)}
                placeholder="sk-..."
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text)' }}
              >
                {showOpenaiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.openaiKey && (
              <small style={{ color: 'var(--hope-color)' }}>Key configured</small>
            )}
          </div>
        </div>

        {/* Usage Limits */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} />
              Daily Limit (per user)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.dailyLimit}
              onChange={(e) => handleChange('dailyLimit', parseInt(e.target.value) || 10)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <small style={{ color: 'var(--text-secondary)' }}>Requests per day</small>
          </div>

          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} />
              Monthly Limit (per user)
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={formData.monthlyLimit}
              onChange={(e) => handleChange('monthlyLimit', parseInt(e.target.value) || 100)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <small style={{ color: 'var(--text-secondary)' }}>Requests per month</small>
          </div>
        </div>

        {/* Warning */}
        {formData.enabled && (
          <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.5)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgb(234, 179, 8)' }}>
              <AlertTriangle size={18} />
              <strong>Cost Warning</strong>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              You will be billed by Anthropic/OpenAI for all API usage. With {formData.dailyLimit} requests/day
              and {formData.monthlyLimit} requests/month per user, costs can add up quickly with many users.
            </p>
          </div>
        )}

        {/* Save Button */}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

        {/* Message */}
        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '4px',
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? 'var(--hope-color)' : 'var(--fear-color)'
          }}>
            {message.text}
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Users size={20} />
          Recent Usage (Top 10)
        </h3>

        {loadingUsage ? (
          <p>Loading usage data...</p>
        ) : recentUsage.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No usage recorded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>User ID</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Today</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>This Month</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>All Time</th>
              </tr>
            </thead>
            <tbody>
              {recentUsage.map(usage => {
                const today = new Date().toISOString().split('T')[0];
                const thisMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                const dailyCount = usage.daily?.date === today ? usage.daily.count : 0;
                const monthlyCount = usage.monthly?.month === thisMonth ? usage.monthly.count : 0;

                return (
                  <tr key={usage.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <code style={{ fontSize: '0.75rem' }}>{usage.id.substring(0, 12)}...</code>
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                      <span style={{ color: dailyCount >= formData.dailyLimit ? 'var(--fear-color)' : 'var(--text)' }}>
                        {dailyCount}/{formData.dailyLimit}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                      <span style={{ color: monthlyCount >= formData.monthlyLimit ? 'var(--fear-color)' : 'var(--text)' }}>
                        {monthlyCount}/{formData.monthlyLimit}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                      {usage.totalAllTime || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
