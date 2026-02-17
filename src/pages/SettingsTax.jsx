import { useState, useEffect } from 'react';
import { Calculator, Save, Info } from 'lucide-react';
import api from '../utils/api';

export default function SettingsTax() {
  const [settings, setSettings] = useState({
    tax_display_mode: 'exclusive', // exclusive, inclusive
    default_tax_rate: 10.0,
    reduced_tax_rate: 8.0,
    enable_reduced_tax: true,
    tax_rounding: 'round' // round, floor, ceil
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // TODO: API実装後に修正
      // const response = await api.get('/settings/tax');
      // setSettings(response.data);
    } catch (err) {
      console.error('Error loading tax settings:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      // TODO: API実装後に修正
      // await api.put('/settings/tax', settings);
      
      // デモ用の成功メッセージ
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccess('消費税設定を保存しました');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving tax settings:', err);
      setError(err.response?.data?.error || '設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <Calculator size={28} />
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>消費税表示設定</h1>
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
        <Info size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '14px', color: '#1e40af', lineHeight: '1.5' }}>
          この設定は、書類作成や受注取引における消費税の計算・表示方法に影響します。
          変更後は、新規作成する書類から適用されます。
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
          {/* Tax Display Mode */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontWeight: '600',
              fontSize: '16px',
              color: '#111827'
            }}>
              消費税の表示方法
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'start',
                gap: '12px',
                padding: '16px',
                border: '2px solid',
                borderColor: settings.tax_display_mode === 'exclusive' ? '#3b82f6' : '#e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: settings.tax_display_mode === 'exclusive' ? '#eff6ff' : 'white'
              }}>
                <input
                  type="radio"
                  value="exclusive"
                  checked={settings.tax_display_mode === 'exclusive'}
                  onChange={(e) => setSettings({ ...settings, tax_display_mode: e.target.value })}
                  style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>税抜表示</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    金額を税抜で表示し、消費税を別途計算します（例：¥10,000 + 税¥1,000）
                  </div>
                </div>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'start',
                gap: '12px',
                padding: '16px',
                border: '2px solid',
                borderColor: settings.tax_display_mode === 'inclusive' ? '#3b82f6' : '#e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: settings.tax_display_mode === 'inclusive' ? '#eff6ff' : 'white'
              }}>
                <input
                  type="radio"
                  value="inclusive"
                  checked={settings.tax_display_mode === 'inclusive'}
                  onChange={(e) => setSettings({ ...settings, tax_display_mode: e.target.value })}
                  style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>税込表示</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    金額を税込で表示します（例：¥11,000 税込）
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tax Rates */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontWeight: '600',
              fontSize: '16px',
              color: '#111827'
            }}>
              税率設定
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  標準税率（%）
                </label>
                <input
                  type="number"
                  value={settings.default_tax_rate}
                  onChange={(e) => setSettings({ ...settings, default_tax_rate: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  軽減税率（%）
                </label>
                <input
                  type="number"
                  value={settings.reduced_tax_rate}
                  onChange={(e) => setSettings({ ...settings, reduced_tax_rate: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={!settings.enable_reduced_tax}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none',
                    backgroundColor: !settings.enable_reduced_tax ? '#f9fafb' : 'white',
                    cursor: !settings.enable_reduced_tax ? 'not-allowed' : 'text'
                  }}
                  onFocus={(e) => {
                    if (settings.enable_reduced_tax) e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>
          </div>

          {/* Enable Reduced Tax */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <input
                type="checkbox"
                checked={settings.enable_reduced_tax}
                onChange={(e) => setSettings({ ...settings, enable_reduced_tax: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>軽減税率を有効にする</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  食品・新聞などの軽減税率対象品目を使用する場合にチェックしてください
                </div>
              </div>
            </label>
          </div>

          {/* Tax Rounding */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontWeight: '600',
              fontSize: '16px',
              color: '#111827'
            }}>
              端数処理
            </label>
            <select
              value={settings.tax_rounding}
              onChange={(e) => setSettings({ ...settings, tax_rounding: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="round">四捨五入</option>
              <option value="floor">切り捨て</option>
              <option value="ceil">切り上げ</option>
            </select>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
              消費税計算時の端数処理方法を選択してください
            </div>
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
                保存中...
              </>
            ) : (
              <>
                <Save size={20} />
                設定を保存
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
