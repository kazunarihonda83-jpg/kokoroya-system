import { useState } from 'react';
import { Lock, Save, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

export default function SettingsPassword() {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (value) => {
    setFormData({ ...formData, new_password: value });
    setPasswordStrength(checkPasswordStrength(value));
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return '#ef4444';
    if (passwordStrength <= 3) return '#f59e0b';
    return '#10b981';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return '弱い';
    if (passwordStrength <= 3) return '普通';
    return '強い';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    // Validation
    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      setError('すべての項目を入力してください');
      return;
    }

    if (formData.new_password.length < 8) {
      setError('新しいパスワードは8文字以上にしてください');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('新しいパスワードが一致しません');
      return;
    }

    if (formData.current_password === formData.new_password) {
      setError('現在のパスワードと同じパスワードは使用できません');
      return;
    }

    try {
      setLoading(true);
      await api.put('/auth/password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      
      setSuccess('パスワードを変更しました');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordStrength(0);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.response?.data?.error || 'パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <Lock size={28} />
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>パスワード変更</h1>
      </div>

      {/* Info Box */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px'
      }}>
        <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '14px', color: '#1e40af', lineHeight: '1.5' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>安全なパスワードの条件：</div>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>8文字以上（12文字以上を推奨）</li>
            <li>大文字と小文字を含む</li>
            <li>数字を含む</li>
            <li>記号を含む（推奨）</li>
          </ul>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {success && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: '6px',
            marginBottom: '20px',
            color: '#065f46',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            marginBottom: '20px',
            color: '#991b1b',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              現在のパスワード *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                required
                placeholder="現在のパスワードを入力"
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              新しいパスワード *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                placeholder="新しいパスワードを入力"
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.new_password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>パスワード強度:</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: getStrengthColor() }}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div style={{
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: getStrengthColor(),
                    transition: 'all 0.3s'
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              新しいパスワード（確認） *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                required
                placeholder="新しいパスワードを再入力"
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirm_password && formData.new_password !== formData.confirm_password && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                パスワードが一致しません
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                変更中...
              </>
            ) : (
              <>
                <Save size={20} />
                パスワードを変更
              </>
            )}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
