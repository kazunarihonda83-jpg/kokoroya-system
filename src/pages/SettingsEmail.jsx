import { useState } from 'react';
import { Mail, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function SettingsEmail() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    current_email: user?.email || '',
    new_email: '',
    confirm_email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    // Validation
    if (!formData.new_email || !formData.confirm_email || !formData.password) {
      setError('すべての項目を入力してください');
      return;
    }

    if (formData.new_email !== formData.confirm_email) {
      setError('新しいメールアドレスが一致しません');
      return;
    }

    if (formData.new_email === formData.current_email) {
      setError('現在のメールアドレスと同じです');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.new_email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    try {
      setLoading(true);
      await api.put('/auth/email', {
        email: formData.new_email,
        password: formData.password
      });
      
      await refreshUser(); // ユーザー情報を再取得
      setSuccess('メールアドレスを更新しました');
      setFormData({
        current_email: formData.new_email,
        new_email: '',
        confirm_email: '',
        password: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating email:', err);
      setError(err.response?.data?.error || 'メールアドレスの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <Mail size={28} />
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>メールアドレス設定</h1>
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
          メールアドレスを変更すると、次回ログイン時に新しいメールアドレスを使用する必要があります。
          確認のため、現在のパスワードを入力してください。
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
          {/* Current Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              現在のメールアドレス
            </label>
            <input
              type="email"
              value={formData.current_email}
              disabled
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* New Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              新しいメールアドレス *
            </label>
            <input
              type="email"
              value={formData.new_email}
              onChange={(e) => setFormData({ ...formData, new_email: e.target.value })}
              required
              placeholder="new-email@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Confirm Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              新しいメールアドレス（確認） *
            </label>
            <input
              type="email"
              value={formData.confirm_email}
              onChange={(e) => setFormData({ ...formData, confirm_email: e.target.value })}
              required
              placeholder="new-email@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Password Confirmation */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              現在のパスワード *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="確認のため入力してください"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
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
                更新中...
              </>
            ) : (
              <>
                <Save size={20} />
                メールアドレスを更新
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
