import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function BalanceSheetDebug() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [asOfDate]);

  const fetchData = async () => {
    try {
      const response = await api.get('/accounting/balance-sheet', {
        params: { as_of_date: asOfDate }
      });
      console.log('Balance Sheet API Response:', response.data);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>貸借対照表 デバッグページ</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>基準日: </label>
        <input 
          type="date" 
          value={asOfDate} 
          onChange={(e) => setAsOfDate(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button onClick={fetchData} style={{ marginLeft: '10px', padding: '8px 16px' }}>
          再読込
        </button>
      </div>

      {error && (
        <div style={{ padding: '20px', background: '#ffebee', border: '1px solid #f44336', borderRadius: '4px', marginBottom: '20px' }}>
          <strong>エラー:</strong> {error}
        </div>
      )}

      {data && (
        <div>
          <h2>APIレスポンス:</h2>
          <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>

          <h2>資産の部 ({data.assetAccounts?.length || 0}件)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#e0e0e0' }}>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>コード</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>科目名</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>残高</th>
              </tr>
            </thead>
            <tbody>
              {data.assetAccounts?.map((acc) => (
                <tr key={acc.id}>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.code}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                    ¥{Math.round(acc.balance).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>負債の部 ({data.liabilityAccounts?.length || 0}件)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#e0e0e0' }}>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>コード</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>科目名</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>残高</th>
              </tr>
            </thead>
            <tbody>
              {data.liabilityAccounts?.length > 0 ? (
                data.liabilityAccounts.map((acc) => (
                  <tr key={acc.id}>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.id}</td>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.code}</td>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                      ¥{Math.round(acc.balance).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center', color: '#999' }}>
                    データなし
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <h2>純資産の部 ({data.equityAccounts?.length || 0}件)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#e0e0e0' }}>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>コード</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>科目名</th>
                <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>残高</th>
              </tr>
            </thead>
            <tbody>
              {data.equityAccounts?.map((acc) => (
                <tr key={acc.id}>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.code}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{acc.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                    ¥{Math.round(acc.balance).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>合計</h2>
          <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '4px' }}>
            <div><strong>資産合計:</strong> ¥{Math.round(data.assets).toLocaleString()}</div>
            <div><strong>負債合計:</strong> ¥{Math.round(data.liabilities).toLocaleString()}</div>
            <div><strong>純資産合計:</strong> ¥{Math.round(data.equity).toLocaleString()}</div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #1976d2' }}>
              <strong>負債・純資産合計:</strong> ¥{Math.round(data.liabilities + data.equity).toLocaleString()}
            </div>
            <div style={{ marginTop: '10px', color: data.assets === (data.liabilities + data.equity) ? '#4caf50' : '#f44336' }}>
              <strong>バランス:</strong> {data.assets === (data.liabilities + data.equity) ? '✓ 一致' : '✗ 不一致'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
