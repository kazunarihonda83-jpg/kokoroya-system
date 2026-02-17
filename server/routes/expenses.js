import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// 経費支払いの作成
router.post('/payments', (req, res) => {
  try {
    const db = req.app.get('db');
    const { 
      payment_date, 
      expense_category,  // '給料', '地代家賃', '水道光熱費' など
      description, 
      amount 
    } = req.body;

    if (!payment_date || !expense_category || !amount) {
      return res.status(400).json({ error: 'Payment date, category, and amount are required' });
    }

    // 勘定科目コードのマッピング
    const expenseCategoryMap = {
      '給料': '6000',
      '地代家賃': '7000',
      '水道光熱費': '8000'
    };

    const accountCode = expenseCategoryMap[expense_category];
    if (!accountCode) {
      return res.status(400).json({ error: 'Invalid expense category' });
    }

    // 勘定科目を取得
    const cashAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get(); // 現金
    const expenseAccount = db.prepare("SELECT id FROM accounts WHERE account_code = ?").get(accountCode);

    if (!cashAccount || !expenseAccount) {
      return res.status(500).json({ error: 'Required accounts not found' });
    }

    // 仕訳を作成
    // 借方: 経費科目（給料など） / 貸方: 現金
    const result = db.prepare(`
      INSERT INTO journal_entries (
        entry_date, description, debit_account_id, credit_account_id, 
        amount, reference_type, reference_id, admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payment_date,
      description || `${expense_category}支払い`,
      expenseAccount.id,
      cashAccount.id,
      amount,
      'expense_payment',
      null,
      req.user?.id || 1
    );

    console.log(`✅ 仕訳帳登録: ${expense_category}支払い ¥${amount} (支払日: ${payment_date})`);

    // 現金出納帳に記録
    const currentBalance = db.prepare(
      'SELECT balance FROM cash_book ORDER BY transaction_date DESC, created_at DESC LIMIT 1'
    ).get();
    const newBalance = (currentBalance?.balance || 0) - amount;

    db.prepare(`
      INSERT INTO cash_book (
        transaction_date, transaction_type, category, description, 
        amount, balance, reference_type, reference_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payment_date,
      'expense',
      expense_category,
      description || `${expense_category}支払い`,
      amount,
      newBalance,
      'expense_payment',
      null,
      req.user?.id || 1
    );

    console.log(`✅ 現金出納帳登録: ${expense_category}支払い ¥${amount} (残高: ¥${newBalance})`);

    res.status(201).json({ 
      message: 'Expense payment created successfully',
      data: { 
        id: result.lastInsertRowid,
        category: expense_category,
        amount: amount
      }
    });
  } catch (error) {
    console.error('Error creating expense payment:', error);
    res.status(500).json({ error: 'Failed to create expense payment' });
  }
});

// 経費支払い一覧の取得
router.get('/payments', (req, res) => {
  try {
    const db = req.app.get('db');
    const payments = db.prepare(`
      SELECT 
        cb.id,
        cb.transaction_date,
        cb.category,
        cb.description,
        cb.amount,
        cb.balance,
        cb.created_at
      FROM cash_book cb
      WHERE cb.transaction_type = 'expense'
        AND cb.reference_type = 'expense_payment'
      ORDER BY cb.transaction_date DESC, cb.created_at DESC
    `).all();
    
    res.json(payments);
  } catch (error) {
    console.error('Error getting expense payments:', error);
    res.status(500).json({ error: 'Failed to get expense payments' });
  }
});

export default router;
