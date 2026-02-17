import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, Users, FileText, Package, ShoppingCart, Calculator, 
  LogOut, Warehouse, ChevronDown, ChevronUp, Menu,
  User, Mail, Settings, Lock, Bell
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);
  const [orderReceiptOpen, setOrderReceiptOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Left Sidebar */}
      <div style={{
        width: '250px',
        background: '#2563ab',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Menu size={24} />
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '700',
            letterSpacing: '1px'
          }}>SYSTEM CLOUD</h2>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {/* ホーム */}
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 20px',
            background: isActive('/') ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: isActive('/') ? '4px solid white' : '4px solid transparent',
            transition: 'all 0.2s'
          }}>
            <Home size={20} />
            <span>ホーム</span>
          </Link>

          {/* 顧客管理 */}
          <Link to="/customers" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 20px',
            background: isActive('/customers') ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: isActive('/customers') ? '4px solid white' : '4px solid transparent',
            transition: 'all 0.2s'
          }}>
            <Users size={20} />
            <span>顧客管理</span>
          </Link>

          {/* 受注取引管理 */}
          <div>
            <div 
              onClick={() => setOrderReceiptOpen(!orderReceiptOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                color: 'white',
                padding: '12px 20px',
                cursor: 'pointer',
                background: 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={20} />
                <span>受注取引管理</span>
              </div>
              {orderReceiptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {orderReceiptOpen && (
              <div style={{ paddingLeft: '20px', background: 'rgba(0,0,0,0.1)' }}>
                <Link to="/order-receipts" style={{
                  display: 'block',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isActive('/order-receipts') ? 'rgba(255,255,255,0.15)' : 'transparent'
                }}>
                  受注取引一覧
                </Link>
                <Link to="/order-receipts-upload" style={{
                  display: 'block',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isActive('/order-receipts-upload') ? 'rgba(255,255,255,0.15)' : 'transparent'
                }}>
                  受注取引一覧アップロード
                </Link>
              </div>
            )}
          </div>

          {/* 発注取引管理 */}
          <Link to="/purchases" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 20px',
            background: isActive('/purchases') ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: isActive('/purchases') ? '4px solid white' : '4px solid transparent',
            transition: 'all 0.2s'
          }}>
            <ShoppingCart size={20} />
            <span>発注取引管理</span>
          </Link>

          {/* 在庫管理 */}
          <Link to="/inventory" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 20px',
            background: isActive('/inventory') ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: isActive('/inventory') ? '4px solid white' : '4px solid transparent',
            transition: 'all 0.2s'
          }}>
            <Warehouse size={20} />
            <span>在庫管理</span>
          </Link>

          {/* 書類管理 */}
          <Link to="/documents" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 20px',
            background: isActive('/documents') ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: isActive('/documents') ? '4px solid white' : '4px solid transparent',
            transition: 'all 0.2s'
          }}>
            <FileText size={20} />
            <span>書類管理</span>
          </Link>

          {/* 仕入先管理 */}
          <Link to="/suppliers" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 20px',
            background: isActive('/suppliers') ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: isActive('/suppliers') ? '4px solid white' : '4px solid transparent',
            transition: 'all 0.2s'
          }}>
            <Package size={20} />
            <span>仕入先管理</span>
          </Link>

          {/* 会計帳簿 */}
          <div>
            <div 
              onClick={() => setAccountingOpen(!accountingOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                color: 'white',
                padding: '12px 20px',
                cursor: 'pointer',
                background: 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calculator size={20} />
                <span>会計帳簿</span>
              </div>
              {accountingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {accountingOpen && (
              <div style={{ paddingLeft: '20px', background: 'rgba(0,0,0,0.1)' }}>
                <Link to="/accounting/general-ledger" style={{
                  display: 'block',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isActive('/accounting/general-ledger') ? 'rgba(255,255,255,0.15)' : 'transparent'
                }}>
                  総勘定元帳
                </Link>
                <Link to="/accounting/balance-sheet" style={{
                  display: 'block',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isActive('/accounting/balance-sheet') ? 'rgba(255,255,255,0.15)' : 'transparent'
                }}>
                  貸借対照表
                </Link>
                <Link to="/accounting/profit-loss" style={{
                  display: 'block',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isActive('/accounting/profit-loss') ? 'rgba(255,255,255,0.15)' : 'transparent'
                }}>
                  損益計算書
                </Link>
                <Link to="/accounting/cashflow" style={{
                  display: 'block',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: isActive('/accounting/cashflow') ? 'rgba(255,255,255,0.15)' : 'transparent'
                }}>
                  キャッシュフロー計算書
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ marginLeft: '250px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <div style={{
          background: 'white',
          padding: '15px 30px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#2563ab' }}>
            海鮮いろり心や
          </div>
          
          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 15px',
                background: '#f5f5f5',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid #e8e8e8'
              }}
            >
              <User size={20} color="#2563ab" />
              <span style={{ fontSize: '14px', color: '#333' }}>海鮮いろり心や</span>
              {userMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '10px',
                background: 'white',
                border: '1px solid #e8e8e8',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '250px',
                zIndex: 1000
              }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #e8e8e8' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>海鮮いろり心や</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>1961.k.s.4222@gmail.com</div>
                </div>

                <div style={{ padding: '10px 0' }}>
                  <Link to="/profile" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 15px',
                    color: '#333',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <User size={16} />
                    <span>プロフィール</span>
                  </Link>

                  <Link to="/settings/email" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 15px',
                    color: '#333',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Mail size={16} />
                    <span>メールアドレス</span>
                  </Link>

                  <Link to="/settings/tax" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 15px',
                    color: '#333',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Settings size={16} />
                    <span>消費税表示設定</span>
                  </Link>

                  <Link to="/settings/password" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 15px',
                    color: '#333',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Lock size={16} />
                    <span>パスワード変更</span>
                  </Link>

                  <div style={{ borderTop: '1px solid #e8e8e8', marginTop: '10px', paddingTop: '10px' }}>
                    <div
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 15px',
                        color: '#e74c3c',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={16} />
                      <span>ログアウト</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '30px', background: '#f5f5f5', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
