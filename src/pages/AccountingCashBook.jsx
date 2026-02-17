import { useState, useEffect } from 'react';
import { BookOpen, Download, Search, Plus, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../utils/api';

export default function AccountingCashBook() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'income',
    category: '',
    description: '',
    amount: '',
    reference_type: '',
    reference_id: ''
  });

  useEffect(() => {
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadCashBook();
    }
  }, [startDate, endDate, filterType]);

  const loadCashBook = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });
      if (filterType !== 'all') {
        params.append('transaction_type', filterType);
      }
      const response = await api.get(`/accounting-ledgers/cash-book?${params}`);
      setEntries(response.data.data || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      console.error('Error loading cash book:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(e =>
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToPDF = () => {
    alert('PDF出力機能は準備中です');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/accounting-ledgers/cash-book', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      alert('現金出納データを登録しました');
      setShowModal(false);
      resetForm();
      loadCashBook();
    } catch (err) {
      console.error('Error creating cash book entry:', err);
      alert(err.response?.data?.error || '現金出納データの登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'income',
      category: '',
      description: '',
      amount: '',
      reference_type: '',
      reference_id: ''
    });
  };

  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={24} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>現金出納帳</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            <Plus size={20} />
            新規登録
          </button>
          <button
            onClick={exportToPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            <Download size={20} />
            PDFエクスポート
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '5px' }} />
              開始日
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '5px' }} />
              終了日
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              区分
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="all">すべて</option>
              <option value="income">入金</option>
              <option value="expense">出金</option>
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
            <input
              type="text"
              placeholder="摘要、カテゴリで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 40px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <TrendingUp size={16} style={{ color: '#10b981' }} />
              入金合計
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              ¥{summary.total_income?.toLocaleString() || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <TrendingDown size={16} style={{ color: '#ef4444' }} />
              出金合計
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              ¥{summary.total_expense?.toLocaleString() || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>現在残高</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              ¥{summary.current_balance?.toLocaleString() || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>取引件数</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280' }}>
              {summary.count || 0}件
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>日付</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>区分</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>カテゴリ</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>摘要</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>入金</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>出金</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>残高</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  現金出納データがありません
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{entry.transaction_date}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {entry.transaction_type === 'income' ? (
                      <span style={{
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <TrendingUp size={14} />
                        入金
                      </span>
                    ) : (
                      <span style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <TrendingDown size={14} />
                        出金
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>{entry.category || '-'}</td>
                  <td style={{ padding: '12px' }}>{entry.description}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '500' }}>
                    {entry.transaction_type === 'income' ? `¥${entry.amount?.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: '500' }}>
                    {entry.transaction_type === 'expense' ? `¥${entry.amount?.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                    ¥{entry.balance?.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Entry Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>現金出納登録</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  取引日 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  区分 <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="income">入金</option>
                  <option value="expense">出金</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  カテゴリ
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="例: 売上、仕入、経費"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  摘要 <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  placeholder="取引内容を入力"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  金額 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  min="0"
                  step="1"
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  {loading ? '登録中...' : '登録'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
