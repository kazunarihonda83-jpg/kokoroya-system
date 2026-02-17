import { useState } from 'react';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function OrderReceiptsUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('CSVファイルを選択してください');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/order-receipts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setFile(null);
      // Reset file input
      document.getElementById('file-input').value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // CSV template
    const template = `receipt_number,customer_name,order_date,delivery_date,status,subtotal,payment_status,payment_date,notes
OR-2026-001,株式会社サンプル,2026-02-01,2026-02-05,pending,100000,unpaid,,テストデータ
OR-2026-002,サンプル商事,2026-02-03,2026-02-07,delivered,50000,paid,2026-02-07,`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'order_receipts_template.csv';
    link.click();
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Upload size={24} />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>受注取引一覧アップロード</h1>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Instructions */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
            <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
                CSVアップロードについて
              </h3>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#1e40af', fontSize: '14px' }}>
                <li>UTF-8形式のCSVファイルのみ対応しています</li>
                <li>顧客名は既存の顧客マスタに登録されている名前を使用してください</li>
                <li>日付はYYYY-MM-DD形式で入力してください</li>
                <li>ステータスは pending, processing, shipped, delivered, cancelled のいずれかを指定してください</li>
                <li>支払状況は unpaid, partial, paid のいずれかを指定してください</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Template Download */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={downloadTemplate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Download size={18} />
            テンプレートをダウンロード
          </button>
        </div>

        {/* File Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
          }}>
            CSVファイルを選択
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              border: '2px dashed #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          />
          {file && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#374151'
            }}>
              <FileText size={16} style={{ display: 'inline', marginRight: '8px' }} />
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
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

        {/* Success Result */}
        {result && (
          <div style={{
            padding: '16px',
            backgroundColor: result.errorCount > 0 ? '#fef3c7' : '#d1fae5',
            border: `1px solid ${result.errorCount > 0 ? '#fde68a' : '#a7f3d0'}`,
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: result.errorCount > 0 ? '#92400e' : '#065f46'
            }}>
              アップロード結果
            </h3>
            <div style={{ fontSize: '14px', color: result.errorCount > 0 ? '#92400e' : '#065f46' }}>
              <p style={{ margin: '4px 0' }}>成功: {result.successCount}件</p>
              <p style={{ margin: '4px 0' }}>失敗: {result.errorCount}件</p>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>エラー詳細:</h4>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {result.errors.map((err, idx) => (
                    <div key={idx} style={{
                      padding: '6px 8px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '13px'
                    }}>
                      <strong>{err.row}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: !file || uploading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !file || uploading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {uploading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              アップロード中...
            </>
          ) : (
            <>
              <Upload size={20} />
              アップロード
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
