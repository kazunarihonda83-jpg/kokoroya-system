import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log('ログイン送信:', { username });
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error('ログイン失敗:', err);
      const errorMessage = err.response?.data?.error || err.message || 'ログインに失敗しました';
      setError(errorMessage);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#e8e8e8'
    }}>
      <div style={{
        background: 'white',
        padding: '60px 80px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '500px',
        maxWidth: '90%'
      }}>
        {/* Title */}
        <h1 style={{
          textAlign: 'center',
          marginBottom: '8px',
          color: '#2563ab',
          fontSize: '36px',
          fontWeight: '700',
          letterSpacing: '3px'
        }}>SYSTEM CLOUD</h1>
        
        <p style={{
          textAlign: 'center',
          marginBottom: '50px',
          color: '#333',
          fontSize: '18px',
          fontWeight: '400'
        }}>ログインする</p>

        {error && (
          <div style={{
            color: '#e74c3c',
            marginBottom: '20px',
            textAlign: 'center',
            padding: '10px',
            background: '#fdeaea',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="メールアドレス"
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#333'
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '35px' }}>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#333'
              }}
            />
          </div>

          {/* Login Button */}
          <button 
            type="submit" 
            style={{
              width: '100%',
              padding: '16px',
              background: '#2563ab',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '25px'
            }}
          >
            ログインする
          </button>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'center' }}>
            <a 
              href="#" 
              style={{
                color: '#4da6ff',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              パスワードを忘れた方はこちら
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
