import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Trash2, Edit, Calendar } from 'lucide-react';
import api from '../utils/api';

export default function OrderReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    status: 'pending',
    payment_status: 'unpaid',
    payment_date: '',
    notes: '',
    items: [{ item_name: '', description: '', quantity: 1, unit_price: 0 }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 受注取引と顧客データを並行取得
      const [receiptsRes, customersRes] = await Promise.all([
        api.get('/order-receipts'),
        api.get('/customers')
      ]);
      
      // 受注取引データを設定
      const receiptsData = receiptsRes.data.data || receiptsRes.data || [];
      setReceipts(receiptsData);
      
      // 顧客データを設定（配列を直接取得）
      const customersData = Array.isArray(customersRes.data) ? customersRes.data : [];
      setCustomers(customersData);
      
      console.log('✅ データ読み込み完了');
      console.log('受注件数:', receiptsData.length);
      console.log('顧客件数:', customersData.length);
      console.log('顧客データ:', customersData);
      
    } catch (err) {
      console.error('❌ データ読み込みエラー:', err);
      // エラーメッセージを表示しない
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.customer_id) {
      alert('顧客を選択してください');
      return;
    }
    
    try {
      if (editingReceipt) {
        await api.put(`/order-receipts/${editingReceipt.id}`, formData);
        alert('受注取引を更新しました');
      } else {
        await api.post('/order-receipts', formData);
        alert('受注取引を登録しました');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error('保存エラー:', err);
      alert(err.response?.data?.error || '保存に失敗しました');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      await api.delete(`/order-receipts/${id}`);
      alert('削除しました');
      loadData();
    } catch (err) {
      console.error('削除エラー:', err);
      alert('削除に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      status: 'pending',
      payment_status: 'unpaid',
      payment_date: '',
      notes: '',
      items: [{ item_name: '', description: '', quantity: 1, unit_price: 0 }]
    });
    setEditingReceipt(null);
  };

  const handleEdit = async (receipt) => {
    // 最新の顧客データを取得
    try {
      const customersRes = await api.get('/customers');
      const customersData = Array.isArray(customersRes.data) ? customersRes.data : [];
      setCustomers(customersData);
    } catch (err) {
      console.error('顧客データ取得エラー:', err);
    }
    
    setEditingReceipt(receipt);
    setFormData({
      receipt_number: receipt.receipt_number,
      customer_id: receipt.customer_id,
      order_date: receipt.order_date,
      delivery_date: receipt.delivery_date || '',
      status: receipt.status,
      payment_status: receipt.payment_status,
      payment_date: receipt.payment_date || '',
      notes: receipt.notes || '',
      items: receipt.items || [{ item_name: '', description: '', quantity: 1, unit_price: 0 }]
    });
    setShowModal(true);
  };

  const openNewModal = async () => {
    // 最新の顧客データを取得
    try {
      const customersRes = await api.get('/customers');
      const customersData = Array.isArray(customersRes.data) ? customersRes.data : [];
      setCustomers(customersData);
      
      console.log('🔄 モーダル用顧客データ取得');
      console.log('顧客件数:', customersData.length);
      console.log('顧客一覧:', customersData.map(c => `${c.id}: ${c.name}`));
    } catch (err) {
      console.error('顧客データ取得エラー:', err);
    }
    
    resetForm();
    setShowModal(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item_name: '', description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length > 0 ? newItems : [{ item_name: '', description: '', quantity: 1, unit_price: 0 }] });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const filteredReceipts = receipts.filter(r =>
    r.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: '受注済み', color: '#3b82f6' },
      processing: { label: '処理中', color: '#f59e0b' },
      shipped: { label: '出荷済み', color: '#8b5cf6' },
      delivered: { label: '納品完了', color: '#10b981' },
      cancelled: { label: 'キャンセル', color: '#ef4444' }
    };
    const { label, color } = config[status] || config.pending;
    return (
      <span style={{
        backgroundColor: color + '20',
        color: color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const config = {
      unpaid: { label: '未払い', color: '#ef4444' },
      partial: { label: '部分入金', color: '#f59e0b' },
      paid: { label: '支払済み', color: '#10b981' }
    };
    const { label, color } = config[status] || config.unpaid;
    return (
      <span style={{
        backgroundColor: color + '20',
        color: color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {label}
      </span>
    );
  };

  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={24} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>受注取引一覧</h1>
        </div>
        <button
          onClick={openNewModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <Plus size={20} />
          新規登録
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '10px', top: '10px', color: '#999' }} />
          <input
            type="text"
            placeholder="受注番号、顧客名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>受注番号</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>顧客名</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>受注日</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>納品予定日</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>ステータス</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>支払状況</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  受注取引データがありません
                </td>
              </tr>
            ) : (
              filteredReceipts.map((receipt) => (
                <tr key={receipt.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{receipt.receipt_number}</td>
                  <td style={{ padding: '12px' }}>{receipt.customer_name || '-'}</td>
                  <td style={{ padding: '12px' }}>{receipt.order_date}</td>
                  <td style={{ padding: '12px' }}>{receipt.delivery_date || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(receipt.status)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{getPaymentBadge(receipt.payment_status)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(receipt)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(receipt.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
            padding: '20px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>
              {editingReceipt ? '受注取引編集' : '新規受注取引'}
            </h2>
            
            {/* デバッグ情報 */}
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '12px'
            }}>
              <strong>デバッグ情報:</strong> 顧客データ {customers.length}件
              {customers.length > 0 && (
                <div>顧客: {customers.map(c => c.name).join(', ')}</div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    顧客 * <span style={{ color: '#999', fontSize: '12px' }}>({customers.length}件)</span>
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => {
                      console.log('顧客選択:', e.target.value);
                      setFormData({ ...formData, customer_id: e.target.value });
                    }}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">選択してください</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} (ID: {customer.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>受注日 *</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>納品予定日</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>ステータス *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="pending">受注済み</option>
                    <option value="processing">処理中</option>
                    <option value="shipped">出荷済み</option>
                    <option value="delivered">納品完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>支払状況 *</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="unpaid">未払い</option>
                    <option value="partial">部分入金</option>
                    <option value="paid">支払済み</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>備考</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: '500' }}>商品明細 *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    明細を追加
                  </button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr 1fr auto',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <input
                      type="text"
                      placeholder="商品名"
                      value={item.item_name}
                      onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                      required
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="説明"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                      type="number"
                      placeholder="数量"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      required
                      min="1"
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                      type="number"
                      placeholder="単価"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      style={{
                        padding: '8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {editingReceipt ? '更新' : '登録'}
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
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
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
