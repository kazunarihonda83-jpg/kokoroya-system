import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// 預金取引の作成（預け入れ・引き出し）
router.post('/transactions', (req, res) => {
  try {
    const db = req.app.get('db');
    const { 
      transaction_date, 
      transaction_type,  // 'deposit' (預け入れ) or 'withdrawal' (引き出し)
      description, 
      amount 
    } = req.body;

    if (!transaction_date || !transaction_type || !amount) {
      return res.status(400).json({ error: 'Transaction date, type, and amount are required' });
    }

    if (!['deposit', 'withdrawal'].includes(transaction_type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // 勘定科目を取得
    const cashAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get(); // 現金
    const depositAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1200'").get(); // 預金

    if (!cashAccount || !depositAccount) {
      return res.status(500).json({ error: 'Required accounts not found' });
    }

    let debitAccountId, creditAccountId, journalDescription, cashBookCategory;

    if (transaction_type === 'deposit') {
      // 預け入れ: 借方: 預金 / 貸方: 現金
      debitAccountId = depositAccount.id;
      creditAccountId = cashAccount.id;
      journalDescription = description || '預金預け入れ';
      cashBookCategory = '預金預け入れ';
    } else {
      // 引き出し: 借方: 現金 / 貸方: 預金
      debitAccountId = cashAccount.id;
      creditAccountId = depositAccount.id;
      journalDescription = description || '預金引き出し';
      cashBookCategory = '預金引き出し';
    }

    // 仕訳を作成
    const result = db.prepare(`
      INSERT INTO journal_entries (
        entry_date, description, debit_account_id, credit_account_id, 
        amount, reference_type, reference_id, admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transaction_date,
      journalDescription,
      debitAccountId,
      creditAccountId,
      amount,
      'deposit_transaction',
      null,
      req.user?.id || 1
    );

    console.log(`✅ 仕訳帳登録: ${journalDescription} ¥${amount} (取引日: ${transaction_date})`);

    // 現金出納帳に記録（引き出しの場合は増、預け入れの場合は減）
    const currentBalance = db.prepare(
      'SELECT balance FROM cash_book ORDER BY transaction_date DESC, created_at DESC LIMIT 1'
    ).get();
    
    let newBalance, cashBookTransactionType;
    if (transaction_type === 'deposit') {
      // 預け入れ: 現金減少
      newBalance = (currentBalance?.balance || 0) - amount;
      cashBookTransactionType = 'expense';
    } else {
      // 引き出し: 現金増加
      newBalance = (currentBalance?.balance || 0) + amount;
      cashBookTransactionType = 'income';
    }

    db.prepare(`
      INSERT INTO cash_book (
        transaction_date, transaction_type, category, description, 
        amount, balance, reference_type, reference_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transaction_date,
      cashBookTransactionType,
      cashBookCategory,
      journalDescription,
      amount,
      newBalance,
      'deposit_transaction',
      null,
      req.user?.id || 1
    );

    console.log(`✅ 現金出納帳登録: ${journalDescription} ¥${amount} (残高: ¥${newBalance})`);

    res.status(201).json({ 
      message: 'Deposit transaction created successfully',
      data: { 
        id: result.lastInsertRowid,
        type: transaction_type,
        amount: amount
      }
    });
  } catch (error) {
    console.error('Error creating deposit transaction:', error);
    res.status(500).json({ error: 'Failed to create deposit transaction' });
  }
});

// 預金取引一覧の取得
router.get('/transactions', (req, res) => {
  try {
    const db = req.app.get('db');
    const transactions = db.prepare(`
      SELECT 
        je.id,
        je.entry_date,
        je.description,
        je.amount,
        CASE 
          WHEN je.credit_account_id = (SELECT id FROM accounts WHERE account_code = '1000')
          THEN 'deposit'
          ELSE 'withdrawal'
        END as transaction_type,
        je.created_at
      FROM journal_entries je
      WHERE je.reference_type = 'deposit_transaction'
      ORDER BY je.entry_date DESC, je.created_at DESC
    `).all();
    
    res.json(transactions);
  } catch (error) {
    console.error('Error getting deposit transactions:', error);
    res.status(500).json({ error: 'Failed to get deposit transactions' });
  }
});

export default router;
