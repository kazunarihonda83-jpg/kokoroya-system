import { useState, useEffect } from 'react';
import { User, Save, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    postal_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: '070-2184-0992',
        address: '北海道河東郡音更町大通6-6',
        postal_code: '080-0101'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await api.put('/auth/profile', formData);
      await refreshUser(); // ユーザー情報を再取得
      setSuccess('プロフィールを更新しました');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <User size={28} />
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>プロフィール設定</h1>
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
          {/* Company Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              <User size={18} />
              会社名 / 店舗名
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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

          {/* Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              <Mail size={18} />
              メールアドレス
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

          {/* Phone */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              <Phone size={18} />
              電話番号
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

          {/* Postal Code */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              <MapPin size={18} />
              郵便番号
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="000-0000"
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

          {/* Address */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              <MapPin size={18} />
              住所
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                保存する
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
