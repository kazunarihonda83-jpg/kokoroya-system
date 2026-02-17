import { useState, useEffect } from 'react';
import { TrendingUp, Download, Calendar, DollarSign } from 'lucide-react';
import api from '../utils/api';

export default function AccountingCashflow() {
  const [cashflow, setCashflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadCashflow();
    }
  }, [startDate, endDate]);

  const loadCashflow = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/accounting/cashflow?start_date=${startDate}&end_date=${endDate}`);
      setCashflow(response.data);
    } catch (err) {
      console.error('Error loading cashflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!cashflow) return;
    
    let csvContent = 'キャッシュフロー計算書,\n';
    csvContent += `期間,${startDate} 〜 ${endDate}\n\n`;
    csvContent += 'I. 営業活動によるキャッシュフロー\n';
    csvContent += `営業収入,${cashflow.operating.revenue}\n`;
    csvContent += `営業支出,-${cashflow.operating.expenses}\n`;
    csvContent += `小計,${cashflow.operating.net}\n\n`;
    csvContent += 'II. 投資活動によるキャッシュフロー\n';
    csvContent += `投資収入,${cashflow.investing.sales}\n`;
    csvContent += `投資支出,-${cashflow.investing.purchases}\n`;
    csvContent += `小計,${cashflow.investing.net}\n\n`;
    csvContent += 'III. 財務活動によるキャッシュフロー\n';
    csvContent += `借入金,${cashflow.financing.borrowings}\n`;
    csvContent += `返済,-${cashflow.financing.repayments}\n`;
    csvContent += `資本金,${cashflow.financing.capital}\n`;
    csvContent += `小計,${cashflow.financing.net}\n\n`;
    csvContent += `期首残高,${cashflow.beginningBalance}\n`;
    csvContent += `現金増減額,${cashflow.cashIncrease}\n`;
    csvContent += `期末残高,${cashflow.endingBalance}\n`;
    
    const filename = `cashflow_${startDate}_${endDate}.csv`;
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };



  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;
  if (!cashflow) return <div style={{ padding: '20px' }}>データがありません</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: '600' }}>
          <TrendingUp size={28} /> キャッシュフロー計算書
        </h1>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {/* ヘッダー部分 */}
        <div style={{ background: '#fafafa', padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>キャッシュフロー計算書</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '14px', color: '#666' }}>自</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
              <label style={{ fontSize: '14px', color: '#666' }}>至</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
              <span style={{ fontSize: '14px', color: '#999' }}>(単位　円)</span>
            </div>
          </div>
        </div>

        {/* サマリーカード */}
        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', background: '#f9fafb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>期首残高</div>
              <div style={{ fontSize: '22px', fontWeight: '600', color: '#1890ff' }}>
                ¥{cashflow.beginningBalance.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>現金増減額</div>
              <div style={{ fontSize: '22px', fontWeight: '600', color: cashflow.cashIncrease >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {cashflow.cashIncrease >= 0 ? '+' : ''}¥{cashflow.cashIncrease.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>期末残高</div>
              <div style={{ fontSize: '22px', fontWeight: '600', color: '#262626' }}>
                ¥{cashflow.endingBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* テーブル */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', background: '#fafafa' }}>
                  項目
                </th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', background: '#fafafa', width: '200px' }}>
                  金額
                </th>
              </tr>
            </thead>
            <tbody>
              {/* I. 営業活動 */}
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>I. 営業活動によるキャッシュフロー</td>
                <td style={{ padding: '14px 16px' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px 12px 36px', fontSize: '14px' }}>営業収入</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#52c41a' }}>
                  +{cashflow.operating.revenue.toLocaleString()}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px 12px 36px', fontSize: '14px' }}>営業支出</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#ff4d4f' }}>
                  -{cashflow.operating.expenses.toLocaleString()}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>営業活動による純キャッシュフロー</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '15px', fontWeight: '600', 
                  color: cashflow.operating.net >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {cashflow.operating.net >= 0 ? '+' : ''}{cashflow.operating.net.toLocaleString()}
                </td>
              </tr>

              {/* II. 投資活動 */}
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>II. 投資活動によるキャッシュフロー</td>
                <td style={{ padding: '14px 16px' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px 12px 36px', fontSize: '14px' }}>固定資産売却収入</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#52c41a' }}>
                  +{cashflow.investing.sales.toLocaleString()}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px 12px 36px', fontSize: '14px' }}>固定資産購入支出</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#ff4d4f' }}>
                  -{cashflow.investing.purchases.toLocaleString()}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>投資活動による純キャッシュフロー</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '15px', fontWeight: '600',
                  color: cashflow.investing.net >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {cashflow.investing.net >= 0 ? '+' : ''}{cashflow.investing.net.toLocaleString()}
                </td>
              </tr>

              {/* III. 財務活動 */}
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>III. 財務活動によるキャッシュフロー</td>
                <td style={{ padding: '14px 16px' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px 12px 36px', fontSize: '14px' }}>借入金収入</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#52c41a' }}>
                  +{cashflow.financing.borrowings.toLocaleString()}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px 12px 36px', fontSize: '14px' }}>借入金返済支出</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#ff4d4f' }}>
                  -{cashflow.financing.repayments.toLocaleString()}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px 12px 36px', fontSize: '14px' }}>資本金増減</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', 
                  color: cashflow.financing.capital >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {cashflow.financing.capital >= 0 ? '+' : ''}{cashflow.financing.capital.toLocaleString()}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>財務活動による純キャッシュフロー</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '15px', fontWeight: '600',
                  color: cashflow.financing.net >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {cashflow.financing.net >= 0 ? '+' : ''}{cashflow.financing.net.toLocaleString()}
                </td>
              </tr>

              {/* 期末残高 */}
              <tr style={{ borderTop: '2px solid #e0e0e0', background: '#f6ffed' }}>
                <td style={{ padding: '16px', fontSize: '15px', fontWeight: '600' }}>
                  現金及び現金同等物の期末残高
                </td>
                <td style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: '600' }}>
                  ¥{cashflow.endingBalance.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* フッター：CSVボタン */}
        <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '12px', background: '#fafafa' }}>
          <button onClick={exportToCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', background: '#52c41a',
              color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            <Download size={16} /> CSV出力
          </button>
        </div>
      </div>
    </div>
  );
}
