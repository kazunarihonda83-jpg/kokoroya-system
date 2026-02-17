import { useState, useEffect } from 'react';
import { Scale, Calendar, Download } from 'lucide-react';
import api from '../utils/api';

export default function BalanceSheet() {
  const [balanceSheet, setBalanceSheet] = useState({ 
    assets: 0, 
    liabilities: 0, 
    equity: 0,
    assetAccounts: [],
    liabilityAccounts: [],
    equityAccounts: []
  });
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [asOfDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/balance-sheet', {
        params: { as_of_date: asOfDate }
      });
      setBalanceSheet(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `¥${Math.round(amount).toLocaleString()}`;
  };

  const handlePDFExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'https://5003-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai/api';
      const url = `${baseUrl}/accounting/balance-sheet/pdf?as_of_date=${asOfDate}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation error:', errorText);
        throw new Error('PDF生成に失敗しました');
      }
      
      const html = await response.text();
      const newWindow = window.open('', '_blank');
      if (!newWindow) {
        alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
        return;
      }
      newWindow.document.write(html);
      newWindow.document.close();
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF出力に失敗しました');
    }
  };

  const exportToCSV = () => {
    let csvContent = '貸借対照表,\n';
    csvContent += `基準日,${asOfDate}\n\n`;
    csvContent += '資産の部,\n';
    balanceSheet.assetAccounts.forEach(acc => {
      csvContent += `${acc.name},${Math.round(acc.balance)}\n`;
    });
    csvContent += '資産合計,' + Math.round(balanceSheet.assets) + '\n\n';
    csvContent += '負債の部,\n';
    balanceSheet.liabilityAccounts.forEach(acc => {
      csvContent += `${acc.name},${Math.round(acc.balance)}\n`;
    });
    csvContent += '負債合計,' + Math.round(balanceSheet.liabilities) + '\n\n';
    csvContent += '純資産の部,\n';
    balanceSheet.equityAccounts.forEach(acc => {
      csvContent += `${acc.name},${Math.round(acc.balance)}\n`;
    });
    csvContent += '純資産合計,' + Math.round(balanceSheet.equity) + '\n';
    csvContent += '負債・純資産合計,' + Math.round(balanceSheet.liabilities + balanceSheet.equity) + '\n';
    
    const filename = `balance_sheet_${asOfDate}.csv`;
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };



  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: '600' }}>
          <Scale size={28} /> 貸借対照表
        </h1>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* メインコンテンツ */}
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* ヘッダー部分 */}
          <div style={{ background: '#fafafa', padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>貸借対照表</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '14px', color: '#666' }}>日付:</label>
                <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)}
                  style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
                <span style={{ fontSize: '14px', color: '#999' }}>(単位　円)</span>
              </div>
            </div>
          </div>

          {/* テーブル */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', background: '#fafafa', width: '50%' }}>
                    資産の部
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', background: '#fafafa', width: '50%' }}>
                    負債の部
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 資産と負債を行ごとに表示 */}
                {(() => {
                  const maxRows = Math.max(
                    balanceSheet.assetAccounts.length,
                    balanceSheet.liabilityAccounts.length + balanceSheet.equityAccounts.length + 1 // +1 for 純資産の部 header
                  );
                  const rows = [];
                  
                  for (let i = 0; i < maxRows; i++) {
                    const asset = balanceSheet.assetAccounts[i];
                    const liabilityIndex = i;
                    const equityStartIndex = balanceSheet.liabilityAccounts.length + 1; // +1 for header
                    
                    let rightCell;
                    if (liabilityIndex < balanceSheet.liabilityAccounts.length) {
                      // 負債を表示
                      const liability = balanceSheet.liabilityAccounts[liabilityIndex];
                      rightCell = (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px' }}>{liability.name}</span>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatCurrency(liability.balance)}</span>
                        </div>
                      );
                    } else if (liabilityIndex === balanceSheet.liabilityAccounts.length) {
                      // 純資産の部見出し
                      rightCell = (
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>純資産の部</div>
                      );
                    } else {
                      // 純資産を表示
                      const equityIndex = liabilityIndex - equityStartIndex;
                      if (equityIndex < balanceSheet.equityAccounts.length) {
                        const equity = balanceSheet.equityAccounts[equityIndex];
                        rightCell = (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px' }}>{equity.name}</span>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatCurrency(equity.balance)}</span>
                          </div>
                        );
                      } else {
                        rightCell = null;
                      }
                    }
                    
                    rows.push(
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px 16px' }}>
                          {asset && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '14px' }}>{asset.name}</span>
                              <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatCurrency(asset.balance)}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', background: '#fafafa' }}>
                          {rightCell}
                        </td>
                      </tr>
                    );
                  }
                  
                  return rows;
                })()}
                {/* 合計行 */}
                <tr style={{ borderTop: '2px solid #e0e0e0', background: '#f5f5f5' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>資産の部合計</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{Math.round(balanceSheet.assets).toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>負債・純資産の部合計</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{Math.round(balanceSheet.liabilities + balanceSheet.equity).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* フッター：CSV出力ボタン */}
          <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '12px' }}>
            <button onClick={exportToCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', background: '#52c41a',
                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <Download size={16} /> CSV出力
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
