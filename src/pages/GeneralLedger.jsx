import { useState, useEffect } from 'react';
import { Book, Plus, Download, Calendar, Trash2, X } from 'lucide-react';
import api from '../utils/api';

export default function GeneralLedger() {
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    debit_account_id: '',
    credit_account_id: '',
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchAccounts();
    fetchData();
  }, [dateRange]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounting/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/journal', {
        params: { 
          start_date: dateRange.start, 
          end_date: dateRange.end,
          _t: Date.now() // キャッシュバスティング
        }
      });
      setJournalEntries(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounting/journal', formData);
      alert('仕訳を登録しました');
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || '登録に失敗しました');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この仕訳を削除してもよろしいですか？\nこの操作は元に戻せません。')) return;
    try {
      await api.delete(`/accounting/journal/${id}`);
      alert('仕訳を削除しました');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || '削除に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      description: '',
      debit_account_id: '',
      credit_account_id: '',
      amount: 0,
      notes: ''
    });
  };

  const getAccountName = (id) => {
    const account = accounts.find(a => a.id === parseInt(id));
    return account ? `${account.account_code} ${account.account_name}` : '-';
  };

  const formatCurrency = (amount) => {
    return `¥${Math.round(amount).toLocaleString()}`;
  };

  const exportToCSV = () => {
    let csvContent = '日付,摘要,借方科目,貸方科目,金額\n';
    const filteredEntries = getFilteredEntries();
    filteredEntries.forEach(entry => {
      csvContent += `${entry.entry_date},${entry.description},${entry.debit_account_code} ${entry.debit_account_name},${entry.credit_account_code} ${entry.credit_account_name},${entry.amount}\n`;
    });
    const filename = `general_ledger_${dateRange.start}_${dateRange.end}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const getFilteredEntries = () => {
    if (!selectedAccount) return journalEntries;
    return journalEntries.filter(entry => 
      entry.debit_account_id === parseInt(selectedAccount) || 
      entry.credit_account_id === parseInt(selectedAccount)
    );
  };

  const setCurrentMonth = () => {
    const now = new Date();
    setDateRange({
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
  };

  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

  const filteredEntries = getFilteredEntries();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: '600' }}>
          <Book size={28} /> 総勘定元帳
        </h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#1890ff',
            color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          <Plus size={18} /> 新規登録
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {/* フィルター */}
        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#666" />
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
              <span style={{ color: '#666' }}>〜</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
              <button onClick={setCurrentMonth}
                style={{ padding: '8px 16px', background: '#fafafa', border: '1px solid #d9d9d9', borderRadius: '4px', 
                  cursor: 'pointer', fontSize: '14px' }}>
                今月
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <label style={{ fontSize: '14px', color: '#666' }}>勘定科目:</label>
              <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px', minWidth: '180px' }}>
                <option value="">すべて</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_code} {acc.account_name}
                  </option>
                ))}
              </select>
              <button onClick={exportToCSV}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#52c41a',
                  color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <Download size={16} /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* テーブル */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>日付</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>摘要</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>借方</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>貸方</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#666' }}>金額</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#666', width: '80px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#bfbfbf', fontSize: '14px' }}>
                    データがありません
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => (
                  <tr key={entry.id} style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    background: index % 2 === 0 ? 'white' : '#fafafa'
                  }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{entry.entry_date}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{entry.description}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                      {entry.debit_account_code} {entry.debit_account_name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                      {entry.credit_account_code} {entry.credit_account_name}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', fontSize: '14px' }}>
                      {formatCurrency(entry.amount)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button onClick={() => handleDelete(entry.id)}
                        style={{ padding: '4px 8px', background: '#ff4d4f', color: 'white', border: 'none',
                          borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 仕訳登録フォーム */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', width: '90%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>仕訳登録</h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>日付 *</label>
                <input type="date" value={formData.entry_date}
                  onChange={(e) => setFormData({...formData, entry_date: e.target.value})} required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>摘要 *</label>
                <input type="text" value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})} required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>借方科目 *</label>
                <select value={formData.debit_account_id}
                  onChange={(e) => setFormData({...formData, debit_account_id: e.target.value})} required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="">選択してください</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_code} {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>貸方科目 *</label>
                <select value={formData.credit_account_id}
                  onChange={(e) => setFormData({...formData, credit_account_id: e.target.value})} required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="">選択してください</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_code} {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>金額 *</label>
                <input type="number" value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>備考</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '4px',
                    cursor: 'pointer' }}>
                  キャンセル
                </button>
                <button type="submit"
                  style={{ padding: '10px 20px', background: '#1890ff', color: 'white', border: 'none',
                    borderRadius: '4px', cursor: 'pointer' }}>
                  登録
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
