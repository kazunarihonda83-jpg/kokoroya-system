import { useState, useEffect } from 'react';
import { TrendingUp, Download } from 'lucide-react';
import api from '../utils/api';

export default function ProfitLoss() {
  const [profitLoss, setProfitLoss] = useState({
    sales_revenue: 0,
    cost_of_sales: 0,
    gross_profit: 0,
    selling_expenses: 0,
    operating_income: 0,
    non_operating_income: 0,
    non_operating_expense: 0,
    ordinary_income: 0,
    extraordinary_income: 0,
    extraordinary_loss: 0,
    income_before_tax: 0,
    corporate_tax: 0,
    net_income: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('📊 損益計算書データ取得開始', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      const response = await api.get('/accounting/profit-loss', {
        params: { start_date: dateRange.start, end_date: dateRange.end }
      });
      console.log('✅ 損益計算書レスポンス:', response.data);
      setProfitLoss(response.data);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = '損益計算書,\n';
    csvContent += `期間,${dateRange.start} 〜 ${dateRange.end}\n\n`;
    csvContent += '費目,金額\n';
    csvContent += '売上高,' + Math.round(profitLoss.sales_revenue) + '\n';
    csvContent += '売上原価,' + Math.round(profitLoss.cost_of_sales) + '\n';
    csvContent += '売上総利益,' + Math.round(profitLoss.gross_profit) + '\n';
    csvContent += '販売費及び一般管理費,' + Math.round(profitLoss.selling_expenses) + '\n';
    csvContent += '営業利益,' + Math.round(profitLoss.operating_income) + '\n';
    csvContent += '営業外収益,' + Math.round(profitLoss.non_operating_income) + '\n';
    csvContent += '営業外費用,' + Math.round(profitLoss.non_operating_expense) + '\n';
    csvContent += '経常利益,' + Math.round(profitLoss.ordinary_income) + '\n';
    csvContent += '特別利益,' + Math.round(profitLoss.extraordinary_income) + '\n';
    csvContent += '特別損失,' + Math.round(profitLoss.extraordinary_loss) + '\n';
    csvContent += '税引前当期純利益,' + Math.round(profitLoss.income_before_tax) + '\n';
    csvContent += '法人税等,' + Math.round(profitLoss.corporate_tax) + '\n';
    csvContent += '当期純利益,' + Math.round(profitLoss.net_income) + '\n';
    
    const filename = `profit_loss_${dateRange.start}_${dateRange.end}.csv`;
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
          <TrendingUp size={28} /> 損益計算書
        </h1>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* メインコンテンツ */}
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* ヘッダー部分 */}
          <div style={{ background: '#fafafa', padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>損益計算書</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '14px', color: '#666' }}>自</label>
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
                <label style={{ fontSize: '14px', color: '#666' }}>至</label>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
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
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', background: '#fafafa' }}>
                    費目
                  </th>
                  <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', background: '#fafafa', width: '200px' }}>
                    金額
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 売上高 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>売上高</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                    {Math.round(profitLoss.sales_revenue).toLocaleString()}
                  </td>
                </tr>
                
                {/* 売上原価 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>売上原価</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                    {Math.round(profitLoss.cost_of_sales).toLocaleString()}
                  </td>
                </tr>
                
                {/* 売上総利益 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#f0f9ff' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600' }}>売上総利益</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                    {Math.round(profitLoss.gross_profit).toLocaleString()}
                  </td>
                </tr>
                
                {/* 販売費及び一般管理費 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>販売費及び一般管理費</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                    {Math.round(profitLoss.selling_expenses).toLocaleString()}
                  </td>
                </tr>
                
                {/* 営業利益 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#f0f9ff' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600' }}>営業利益</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                    {Math.round(profitLoss.operating_income).toLocaleString()}
                  </td>
                </tr>
                
                {/* 営業外収益 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>営業外収益</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                    {Math.round(profitLoss.non_operating_income).toLocaleString()}
                  </td>
                </tr>
                
                {/* 営業外費用 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>営業外費用</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                    {Math.round(profitLoss.non_operating_expense).toLocaleString()}
                  </td>
                </tr>
                
                {/* 経常利益 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#f0f9ff' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600' }}>経常利益</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                    {Math.round(profitLoss.ordinary_income).toLocaleString()}
                  </td>
                </tr>
                
                {/* 特別利益 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>特別利益</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                    {Math.round(profitLoss.extraordinary_income).toLocaleString()}
                  </td>
                </tr>
                
                {/* 特別損失 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>特別損失</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                    {Math.round(profitLoss.extraordinary_loss).toLocaleString()}
                  </td>
                </tr>
                
                {/* 税引前当期純利益 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#f0f9ff' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600' }}>税引前当期純利益</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                    {Math.round(profitLoss.income_before_tax).toLocaleString()}
                  </td>
                </tr>
                
                {/* 法人税等 */}
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>法人税等</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                    {Math.round(profitLoss.corporate_tax).toLocaleString()}
                  </td>
                </tr>
                
                {/* 当期純利益 */}
                <tr style={{ borderTop: '2px solid #e0e0e0', background: profitLoss.net_income >= 0 ? '#f6ffed' : '#fff7e6' }}>
                  <td style={{ padding: '16px', fontSize: '15px', fontWeight: '600', color: profitLoss.net_income >= 0 ? '#52c41a' : '#fa8c16' }}>
                    当期純利益
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: '600', color: profitLoss.net_income >= 0 ? '#52c41a' : '#fa8c16' }}>
                    {Math.round(profitLoss.net_income).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* フッター：CSVボタン */}
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
