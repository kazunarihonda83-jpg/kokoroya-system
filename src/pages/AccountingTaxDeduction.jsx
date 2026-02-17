import { useState, useEffect } from 'react';
import { Calculator, Download, Search, Plus, Calendar } from 'lucide-react';
import api from '../utils/api';

export default function AccountingTaxDeduction() {
  const [deductions, setDeductions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    transaction_date: '',
    supplier_name: '',
    invoice_number: '',
    tax_rate: 10,
    taxable_amount: 0,
    category: '',
    notes: ''
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
      loadDeductions();
    }
  }, [startDate, endDate]);

  const loadDeductions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/accounting-ledgers/tax-deductions?start_date=${startDate}&end_date=${endDate}`);
      setDeductions(response.data.data || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      console.error('Error loading tax deductions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeductions = deductions.filter(d =>
    d.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToPDF = () => {
    alert('PDF出力機能は準備中です');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounting-ledgers/tax-deductions', formData);
      alert('税額控除データを登録しました');
      setShowModal(false);
      resetForm();
      loadDeductions();
    } catch (err) {
      console.error('Error creating tax deduction:', err);
      alert('登録に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_date: '',
      supplier_name: '',
      invoice_number: '',
      tax_rate: 10,
      taxable_amount: 0,
      category: '',
      notes: ''
    });
  };

  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calculator size={24} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>税額控除帳</h1>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '15px', alignItems: 'end' }}>
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
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
            <input
              type="text"
              placeholder="仕入先名、請求書番号で検索..."
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
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>課税対象額</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              ¥{summary.total_taxable_amount?.toLocaleString() || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>控除税額</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              ¥{summary.total_tax_amount?.toLocaleString() || 0}
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>合計金額</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              ¥{summary.total_amount?.toLocaleString() || 0}
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>取引日</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>仕入先</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>請求書番号</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>税率</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>課税対象額</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>税額</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>合計</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>カテゴリ</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeductions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  税額控除データがありません
                </td>
              </tr>
            ) : (
              filteredDeductions.map((deduction) => (
                <tr key={deduction.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{deduction.transaction_date}</td>
                  <td style={{ padding: '12px' }}>{deduction.supplier_name}</td>
                  <td style={{ padding: '12px' }}>{deduction.invoice_number || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{deduction.tax_rate}%</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    ¥{deduction.taxable_amount?.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    ¥{deduction.tax_amount?.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    ¥{deduction.total_amount?.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px' }}>{deduction.category || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>税額控除 新規登録</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>取引日 *</label>
                <input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>仕入先名 *</label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>請求書番号</label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>税率 (%) *</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>課税対象額 *</label>
                  <input
                    type="number"
                    required
                    value={formData.taxable_amount}
                    onChange={(e) => setFormData({ ...formData, taxable_amount: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>カテゴリ</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>備考</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
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
