import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import customersRoutes from './routes/customers.js';
import documentsRoutes from './routes/documents.js';
import suppliersRoutes from './routes/suppliers.js';
import purchasesRoutes from './routes/purchases.js';
import accountingRoutes from './routes/accounting.js';
import inventoryRoutes from './routes/inventory.js';
import expensesRoutes from './routes/expenses.js';
import depositsRoutes from './routes/deposits.js';
import orderReceiptsRoutes from './routes/order-receipts.js';
import accountingLedgersRoutes from './routes/accounting-ledgers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Set database instance for all routes
app.set('db', db);

app.use(cors());
app.use(express.json({ limit: '50mb' })); // 画像データ用にリミットを拡大
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// キャッシュ無効化ミドルウェア（全APIリクエストに適用）
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/deposits', depositsRoutes);
app.use('/api/order-receipts', orderReceiptsRoutes);
app.use('/api/accounting-ledgers', accountingLedgersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint - check admin users (TEMPORARY)
app.get('/api/debug/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, is_active FROM administrators').all();
    res.json({ 
      count: users.length,
      users: users 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production (only if SERVE_FRONTEND is enabled)
// This is disabled on Render backend deployment
if (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  // Handle SPA routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('Serving frontend from dist directory');
} else if (process.env.NODE_ENV === 'production') {
  console.log('Backend API only mode - frontend serving disabled');
}

// 勘定科目のsubcategory修正（起動時に毎回実行）
try {
  console.log('\n🔧 勘定科目のsubcategory確認・修正...');
  const fixes = [
    { code: '4000', subcategory: 'sales_revenue' },
    { code: '5000', subcategory: 'cost_of_sales' },
    { code: '5100', subcategory: 'cost_of_sales' },
    { code: '6000', subcategory: 'selling_expenses' },
    { code: '7000', subcategory: 'selling_expenses' },
    { code: '7100', subcategory: 'non_operating_income' },
    { code: '8000', subcategory: 'selling_expenses' },
    { code: '8100', subcategory: 'extraordinary_loss' }
  ];
  
  let fixCount = 0;
  fixes.forEach(fix => {
    const account = db.prepare('SELECT subcategory FROM accounts WHERE account_code = ?').get(fix.code);
    if (account && !account.subcategory) {
      db.prepare('UPDATE accounts SET subcategory = ? WHERE account_code = ?').run(fix.subcategory, fix.code);
      fixCount++;
    }
  });
  
  if (fixCount > 0) {
    console.log(`✅ 勘定科目のsubcategory修正: ${fixCount}件\n`);
  } else {
    console.log(`✅ 勘定科目のsubcategory: 正常\n`);
  }
} catch (error) {
  console.error('❌ 勘定科目修正エラー:', error.message);
}

// ワンタイム修正スクリプト実行（FIX_ORDER_JOURNALS=true の場合のみ）
if (process.env.FIX_ORDER_JOURNALS === 'true') {
  console.log('\n🔧 受注取引の仕訳修正を実行します...\n');
  try {
    // 勘定科目を取得
    const cashAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get();
    const receivableAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1100'").get();
    const revenueAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '4000'").get();

    if (cashAccount && receivableAccount && revenueAccount) {
      // 全受注取引を取得
      const orderReceipts = db.prepare(`
        SELECT ore.*, c.name as customer_name
        FROM order_receipts ore
        LEFT JOIN customers c ON ore.customer_id = c.id
        ORDER BY ore.order_date ASC
      `).all();

      let createdCount = 0;
      for (const receipt of orderReceipts) {
        // 既存の仕訳を確認
        const existingJournal = db.prepare(`
          SELECT COUNT(*) as count FROM journal_entries 
          WHERE reference_type = 'order_receipt' AND reference_id = ?
        `).get(receipt.id);

        if (existingJournal.count > 0) continue;

        // 仕訳作成
        if (receipt.payment_status === 'paid') {
          const effectivePaymentDate = receipt.payment_date || receipt.order_date;
          db.prepare(`
            INSERT INTO journal_entries (
              entry_date, description, debit_account_id, credit_account_id, 
              amount, reference_type, reference_id, admin_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            effectivePaymentDate,
            `${receipt.customer_name} 現金売上 (${receipt.receipt_number})`,
            cashAccount.id,
            revenueAccount.id,
            receipt.total_amount,
            'order_receipt',
            receipt.id,
            1
          );
          
          const currentBalance = db.prepare(
            'SELECT balance FROM cash_book ORDER BY transaction_date DESC, created_at DESC LIMIT 1'
          ).get();
          const newBalance = (currentBalance?.balance || 0) + receipt.total_amount;
          
          db.prepare(`
            INSERT INTO cash_book (
              transaction_date, transaction_type, category, description, 
              amount, balance, reference_type, reference_id, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            effectivePaymentDate,
            'income',
            '売上',
            `受注取引: ${receipt.receipt_number}`,
            receipt.total_amount,
            newBalance,
            'order_receipt',
            receipt.id,
            1
          );
        } else {
          db.prepare(`
            INSERT INTO journal_entries (
              entry_date, description, debit_account_id, credit_account_id, 
              amount, reference_type, reference_id, admin_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            receipt.order_date,
            `${receipt.customer_name} 売掛金計上 (${receipt.receipt_number})`,
            receivableAccount.id,
            revenueAccount.id,
            receipt.total_amount,
            'order_receipt',
            receipt.id,
            1
          );
        }
        createdCount++;
      }
      console.log(`✅ 受注取引の仕訳修正完了: ${createdCount}件作成\n`);
    }
  } catch (error) {
    console.error('❌ 受注取引の仕訳修正エラー:', error.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
