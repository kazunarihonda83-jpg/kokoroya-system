import { useState, useEffect } from 'react';
import { FileText, Download, Search, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function AccountingInvoiceLedger() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadInvoices();
    }
  }, [startDate, endDate, filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });
      if (filterStatus) {
        params.append('status', filterStatus);
      }
      const response = await api.get(`/accounting-ledgers/invoice-ledger?${params}`);
      setInvoices(response.data.data || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: '下書き', color: 'bg-gray-100 text-gray-800' },
      issued: { label: '発行済み', color: 'bg-blue-100 text-blue-800' },
      paid: { label: '支払済み', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'キャンセル', color: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`px-2 py-1 rounded text-xs ${config.color}`}>{config.label}</span>;
  };

  const exportToPDF = () => {
    alert('PDF出力機能は準備中です');
  };

  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={24} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>請求判明書</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/documents')}
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
            請求書作成
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
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
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
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
              ステータス
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">すべて</option>
              <option value="issued">発行済み</option>
              <option value="paid">支払済み</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
            <input
              type="text"
              placeholder="請求書番号、顧客名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 8px 8px 40px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>請求合計</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              ¥{summary.total_amount?.toLocaleString() || 0}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>入金済み</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              ¥{summary.paid_amount?.toLocaleString() || 0}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>未入金</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              ¥{summary.unpaid_amount?.toLocaleString() || 0}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>期限超過</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              ¥{summary.overdue_amount?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>請求書番号</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>顧客名</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>発行日</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>支払期限</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>金額</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  請求書データがありません
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{invoice.document_number}</td>
                  <td style={{ padding: '12px' }}>{invoice.customer_name}</td>
                  <td style={{ padding: '12px' }}>{invoice.issue_date}</td>
                  <td style={{ padding: '12px' }}>{invoice.due_date || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    ¥{invoice.total_amount?.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {getStatusBadge(invoice.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
