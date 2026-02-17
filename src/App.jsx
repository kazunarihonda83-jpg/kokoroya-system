import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Documents from './pages/Documents';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Inventory from './pages/Inventory';
import OrderReceipts from './pages/OrderReceipts';
import OrderReceiptsUpload from './pages/OrderReceiptsUpload';
import GeneralLedger from './pages/GeneralLedger';
import BalanceSheet from './pages/BalanceSheet';
import BalanceSheetDebug from './pages/BalanceSheetDebug';
import ProfitLoss from './pages/ProfitLoss';
import AccountingCashflow from './pages/AccountingCashflow';
import Profile from './pages/Profile';
import SettingsEmail from './pages/SettingsEmail';
import SettingsTax from './pages/SettingsTax';
import SettingsPassword from './pages/SettingsPassword';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Layout><Customers /></Layout></PrivateRoute>} />
      <Route path="/documents" element={<PrivateRoute><Layout><Documents /></Layout></PrivateRoute>} />
      <Route path="/suppliers" element={<PrivateRoute><Layout><Suppliers /></Layout></PrivateRoute>} />
      <Route path="/purchases" element={<PrivateRoute><Layout><PurchaseOrders /></Layout></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><Layout><Inventory /></Layout></PrivateRoute>} />
      
      {/* 受注取引管理 */}
      <Route path="/order-receipts" element={<PrivateRoute><Layout><OrderReceipts /></Layout></PrivateRoute>} />
      <Route path="/order-receipts-upload" element={<PrivateRoute><Layout><OrderReceiptsUpload /></Layout></PrivateRoute>} />
      
      {/* 会計帳簿 - /accounting へのアクセスは総勘定元帳にリダイレクト */}
      <Route path="/accounting" element={<Navigate to="/accounting/general-ledger" replace />} />
      <Route path="/accounting/general-ledger" element={<PrivateRoute><Layout><GeneralLedger /></Layout></PrivateRoute>} />
      <Route path="/accounting/balance-sheet" element={<PrivateRoute><Layout><BalanceSheet /></Layout></PrivateRoute>} />
      <Route path="/accounting/balance-sheet-debug" element={<PrivateRoute><Layout><BalanceSheetDebug /></Layout></PrivateRoute>} />
      <Route path="/accounting/profit-loss" element={<PrivateRoute><Layout><ProfitLoss /></Layout></PrivateRoute>} />
      <Route path="/accounting/cashflow" element={<PrivateRoute><Layout><AccountingCashflow /></Layout></PrivateRoute>} />
      
      {/* 設定 */}
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="/settings/email" element={<PrivateRoute><Layout><SettingsEmail /></Layout></PrivateRoute>} />
      <Route path="/settings/tax" element={<PrivateRoute><Layout><SettingsTax /></Layout></PrivateRoute>} />
      <Route path="/settings/password" element={<PrivateRoute><Layout><SettingsPassword /></Layout></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
