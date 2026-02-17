import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// PDFエンドポイント（認証不要）
// 損益計算書PDF生成
router.get('/profit-loss/pdf', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const params = [];
    
    let dateFilter = '';
    if (start_date) { 
      dateFilter += ' AND je.entry_date >= ?';
      params.push(start_date);
    }
    if (end_date) { 
      dateFilter += ' AND je.entry_date <= ?';
      params.push(end_date);
    }
    
    // 収益の詳細（勘定科目別）
    const revenueDetails = db.prepare(`
      SELECT a.account_code, a.account_name, COALESCE(SUM(je.amount), 0) as amount
      FROM journal_entries je 
      JOIN accounts a ON je.credit_account_id = a.id 
      WHERE a.account_type = 'revenue' ${dateFilter}
      GROUP BY a.id, a.account_code, a.account_name
      ORDER BY a.account_code
    `).all(...params);
    
    // 費用の詳細（勘定科目別）
    const expenseDetails = db.prepare(`
      SELECT a.account_code, a.account_name, COALESCE(SUM(je.amount), 0) as amount
      FROM journal_entries je 
      JOIN accounts a ON je.debit_account_id = a.id 
      WHERE a.account_type = 'expense' ${dateFilter}
      GROUP BY a.id, a.account_code, a.account_name
      ORDER BY a.account_code
    `).all(...params);
    
    const revenueTotal = revenueDetails.reduce((sum, item) => sum + item.amount, 0);
    const expensesTotal = expenseDetails.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = revenueTotal - expensesTotal;
    
    const html = generateProfitLossHTML(revenueDetails, expenseDetails, revenueTotal, expensesTotal, netIncome, start_date, end_date);
    res.send(html);
  } catch (error) {
    console.error('Error generating profit-loss PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// 貸借対照表PDF生成
router.get('/balance-sheet/pdf', (req, res) => {
  try {
    const { as_of_date } = req.query;
    const dateFilter = as_of_date ? ' AND je.entry_date <= ?' : '';
    const params = as_of_date ? [as_of_date] : [];
    
    // 資産の詳細（勘定科目別）
    const assetDetails = db.prepare(`
      SELECT a.account_code, a.account_name,
             COALESCE(SUM(CASE WHEN je.debit_account_id = a.id THEN je.amount ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN je.credit_account_id = a.id THEN je.amount ELSE 0 END), 0) as amount
      FROM accounts a
      LEFT JOIN journal_entries je ON (je.debit_account_id = a.id OR je.credit_account_id = a.id) ${dateFilter}
      WHERE a.account_type = 'asset'
      GROUP BY a.id, a.account_code, a.account_name
      HAVING amount != 0
      ORDER BY a.account_code
    `).all(...params);
    
    // 負債の詳細（勘定科目別）
    const liabilityDetails = db.prepare(`
      SELECT a.account_code, a.account_name,
             COALESCE(SUM(CASE WHEN je.credit_account_id = a.id THEN je.amount ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN je.debit_account_id = a.id THEN je.amount ELSE 0 END), 0) as amount
      FROM accounts a
      LEFT JOIN journal_entries je ON (je.debit_account_id = a.id OR je.credit_account_id = a.id) ${dateFilter}
      WHERE a.account_type = 'liability'
      GROUP BY a.id, a.account_code, a.account_name
      HAVING amount != 0
      ORDER BY a.account_code
    `).all(...params);
    
    // 純資産の詳細（勘定科目別）
    const equityDetails = db.prepare(`
      SELECT a.account_code, a.account_name,
             COALESCE(SUM(CASE WHEN je.credit_account_id = a.id THEN je.amount ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN je.debit_account_id = a.id THEN je.amount ELSE 0 END), 0) as amount
      FROM accounts a
      LEFT JOIN journal_entries je ON (je.debit_account_id = a.id OR je.credit_account_id = a.id) ${dateFilter}
      WHERE a.account_type = 'equity'
      GROUP BY a.id, a.account_code, a.account_name
      HAVING amount != 0
      ORDER BY a.account_code
    `).all(...params);
    
    const assetsTotal = assetDetails.reduce((sum, item) => sum + item.amount, 0);
    const liabilitiesTotal = liabilityDetails.reduce((sum, item) => sum + item.amount, 0);
    const equityTotal = equityDetails.reduce((sum, item) => sum + item.amount, 0);
    
    const html = generateBalanceSheetHTML(assetDetails, liabilityDetails, equityDetails, assetsTotal, liabilitiesTotal, equityTotal, as_of_date);
    res.send(html);
  } catch (error) {
    console.error('Error generating balance-sheet PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// 認証が必要なエンドポイント
router.use(authenticateToken);

// 勘定科目一覧取得
router.get('/accounts', (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM accounts WHERE is_active = 1 ORDER BY account_code').all();
    // フロントエンド互換性のためにcode/nameプロパティを追加
    const mappedAccounts = accounts.map(acc => ({
      ...acc,
      code: acc.account_code,
      name: acc.account_name
    }));
    res.json(mappedAccounts);
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

// 仕訳帳取得（自動生成・手動入力両方を含む）
router.get('/journal', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        je.*,
        da.account_name as debit_account_name, 
        da.account_code as debit_account_code,
        ca.account_name as credit_account_name, 
        ca.account_code as credit_account_code,
        CASE 
          WHEN je.reference_type IS NOT NULL THEN '自動'
          ELSE '手動'
        END as entry_source
      FROM journal_entries je
      LEFT JOIN accounts da ON je.debit_account_id = da.id 
      LEFT JOIN accounts ca ON je.credit_account_id = ca.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) { 
      query += ' AND je.entry_date >= ?'; 
      params.push(start_date); 
    }
    if (end_date) { 
      query += ' AND je.entry_date <= ?'; 
      params.push(end_date); 
    }
    
    query += ' ORDER BY je.entry_date DESC, je.id DESC';
    const entries = db.prepare(query).all(...params);
    res.json(entries);
  } catch (error) {
    console.error('Error getting journal entries:', error);
    res.status(500).json({ error: 'Failed to get journal entries' });
  }
});

// 手動仕訳登録
router.post('/journal', (req, res) => {
  try {
    const { entry_date, description, debit_account_id, credit_account_id, amount, notes } = req.body;
    
    if (!debit_account_id || !credit_account_id || !amount || amount <= 0) {
      return res.status(400).json({ error: '必須項目を入力してください' });
    }
    
    const result = db.prepare(`
      INSERT INTO journal_entries (
        entry_date, description, debit_account_id, credit_account_id, 
        amount, notes, admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry_date, 
      description, 
      debit_account_id, 
      credit_account_id, 
      amount, 
      notes, 
      req.user.id
    );
    
    res.status(201).json({ 
      id: result.lastInsertRowid,
      message: '仕訳を登録しました'
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// 仕訳削除
router.delete('/journal/:id', (req, res) => {
  try {
    const entry = db.prepare('SELECT reference_type, reference_id FROM journal_entries WHERE id = ?').get(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: '仕訳が見つかりません' });
    }
    
    // トランザクション開始
    const deleteTransaction = db.transaction(() => {
      // 自動生成された仕訳の場合、関連データも削除
      if (entry.reference_type && entry.reference_id) {
        console.log(`🗑️ 自動生成仕訳を削除: reference_type=${entry.reference_type}, reference_id=${entry.reference_id}`);
        
        // 参照元のデータタイプに応じて削除
        if (entry.reference_type === 'purchase_order') {
          // 発注書を削除
          db.prepare('DELETE FROM purchase_order_items WHERE purchase_order_id = ?').run(entry.reference_id);
          db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(entry.reference_id);
          console.log(`✅ 発注書 ID=${entry.reference_id} を削除`);
        } else if (entry.reference_type === 'order_receipt') {
          // 受注書を削除
          db.prepare('DELETE FROM order_receipt_items WHERE receipt_id = ?').run(entry.reference_id);
          db.prepare('DELETE FROM order_receipts WHERE id = ?').run(entry.reference_id);
          console.log(`✅ 受注書 ID=${entry.reference_id} を削除`);
        } else if (entry.reference_type === 'expense_payment') {
          // 経費支払いデータを削除（journal_entriesのみ）
          console.log(`✅ 経費支払い仕訳 ID=${entry.reference_id} を削除`);
        } else if (entry.reference_type === 'deposit_transaction') {
          // 預金取引データを削除（journal_entriesのみ）
          console.log(`✅ 預金取引仕訳 ID=${entry.reference_id} を削除`);
        }
        
        // 関連する全ての仕訳を削除
        const relatedEntries = db.prepare(
          'SELECT id FROM journal_entries WHERE reference_type = ? AND reference_id = ?'
        ).all(entry.reference_type, entry.reference_id);
        
        relatedEntries.forEach(e => {
          db.prepare('DELETE FROM journal_entries WHERE id = ?').run(e.id);
        });
        
        console.log(`✅ 関連仕訳 ${relatedEntries.length}件 を削除`);
        
        // 現金出納帳の関連エントリも削除
        const deletedCashBook = db.prepare(
          'DELETE FROM cash_book WHERE reference_type = ? AND reference_id = ?'
        ).run(entry.reference_type, entry.reference_id);
        
        console.log(`✅ 現金出納帳 ${deletedCashBook.changes}件 を削除`);
        
        // 現金出納帳の残高を再計算
        const cashBookEntries = db.prepare('SELECT * FROM cash_book ORDER BY transaction_date, id').all();
        let balance = 0;
        cashBookEntries.forEach(cb => {
          if (cb.transaction_type === 'income') {
            balance += cb.amount;
          } else {
            balance -= cb.amount;
          }
          db.prepare('UPDATE cash_book SET balance = ? WHERE id = ?').run(balance, cb.id);
        });
        
        console.log(`✅ 現金出納帳の残高を再計算`);
      } else {
        // 手動仕訳の場合は単純に削除
        db.prepare('DELETE FROM journal_entries WHERE id = ?').run(req.params.id);
        console.log(`✅ 手動仕訳 ID=${req.params.id} を削除`);
      }
    });
    
    deleteTransaction();
    
    res.json({ message: '仕訳を削除しました' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: '仕訳の削除に失敗しました: ' + error.message });
  }
});

// 損益計算書
router.get('/profit-loss', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const params = [];
    
    let dateFilter = '';
    if (start_date) { 
      dateFilter += ' AND je.entry_date >= ?';
      params.push(start_date);
    }
    if (end_date) { 
      dateFilter += ' AND je.entry_date <= ?';
      params.push(end_date);
    }
    
    // サブカテゴリ別に集計する関数
    const getAmountBySubcategory = (subcategory, isRevenue) => {
      if (isRevenue) {
        // 収益は貸方
        const result = db.prepare(`
          SELECT COALESCE(SUM(je.amount), 0) as total 
          FROM journal_entries je 
          JOIN accounts a ON je.credit_account_id = a.id 
          WHERE a.account_type = 'revenue' AND a.subcategory = ? ${dateFilter}
        `).get(subcategory, ...params);
        return result?.total || 0;
      } else {
        // 費用は借方
        const result = db.prepare(`
          SELECT COALESCE(SUM(je.amount), 0) as total 
          FROM journal_entries je 
          JOIN accounts a ON je.debit_account_id = a.id 
          WHERE a.account_type = 'expense' AND a.subcategory = ? ${dateFilter}
        `).get(subcategory, ...params);
        return result?.total || 0;
      }
    };
    
    // 1. 売上高
    const salesRevenue = getAmountBySubcategory('sales_revenue', true);
    
    // 2. 売上原価
    const costOfSales = getAmountBySubcategory('cost_of_sales', false);
    
    // 3. 売上総利益
    const grossProfit = salesRevenue - costOfSales;
    
    // 4. 販売費及び一般管理費
    const sellingExpenses = getAmountBySubcategory('selling_expenses', false);
    
    // 5. 営業利益
    const operatingIncome = grossProfit - sellingExpenses;
    
    // 6. 営業外収益
    const nonOperatingIncome = getAmountBySubcategory('non_operating_income', true);
    
    // 7. 営業外費用
    const nonOperatingExpense = getAmountBySubcategory('non_operating_expense', false);
    
    // 8. 経常利益
    const ordinaryIncome = operatingIncome + nonOperatingIncome - nonOperatingExpense;
    
    // 9. 特別利益
    const extraordinaryIncome = getAmountBySubcategory('extraordinary_income', true);
    
    // 10. 特別損失
    const extraordinaryLoss = getAmountBySubcategory('extraordinary_loss', false);
    
    // 11. 税引前当期純利益
    const incomeBeforeTax = ordinaryIncome + extraordinaryIncome - extraordinaryLoss;
    
    // 12. 法人税等
    const corporateTax = getAmountBySubcategory('corporate_tax', false);
    
    // 13. 当期純利益
    const netIncome = incomeBeforeTax - corporateTax;
    
    res.json({ 
      sales_revenue: salesRevenue,              // 売上高
      cost_of_sales: costOfSales,              // 売上原価
      gross_profit: grossProfit,               // 売上総利益
      selling_expenses: sellingExpenses,       // 販売費及び一般管理費
      operating_income: operatingIncome,       // 営業利益
      non_operating_income: nonOperatingIncome,    // 営業外収益
      non_operating_expense: nonOperatingExpense,  // 営業外費用
      ordinary_income: ordinaryIncome,         // 経常利益
      extraordinary_income: extraordinaryIncome,   // 特別利益
      extraordinary_loss: extraordinaryLoss,   // 特別損失
      income_before_tax: incomeBeforeTax,      // 税引前当期純利益
      corporate_tax: corporateTax,             // 法人税等
      net_income: netIncome                    // 当期純利益
    });
  } catch (error) {
    console.error('Error getting profit and loss:', error);
    res.status(500).json({ error: 'Failed to get profit and loss' });
  }
});

// 貸借対照表
router.get('/balance-sheet', (req, res) => {
  try {
    const { as_of_date } = req.query;
    const dateFilter = as_of_date ? ' AND je.entry_date <= ?' : '';
    const params = as_of_date ? [as_of_date] : [];
    
    // 各勘定科目の残高を計算
    const accountBalances = db.prepare(`
      SELECT 
        a.id,
        a.account_code,
        a.account_name,
        a.account_type,
        COALESCE(SUM(CASE WHEN je.debit_account_id = a.id THEN je.amount ELSE 0 END), 0) as debit_total,
        COALESCE(SUM(CASE WHEN je.credit_account_id = a.id THEN je.amount ELSE 0 END), 0) as credit_total
      FROM accounts a
      LEFT JOIN journal_entries je ON (je.debit_account_id = a.id OR je.credit_account_id = a.id) ${dateFilter.replace('je.entry_date', 'je.entry_date')}
      WHERE a.is_active = 1
      GROUP BY a.id, a.account_code, a.account_name, a.account_type
      ORDER BY a.account_code
    `).all(...params);
    
    // 勘定科目を種類別に分類
    const assetAccounts = [];
    const liabilityAccounts = [];
    const equityAccounts = [];
    
    let assetsTotal = 0;
    let liabilitiesTotal = 0;
    let equityTotal = 0;
    
    let revenueTotal = 0;
    let expenseTotal = 0;
    
    accountBalances.forEach(acc => {
      // 残高計算（資産・費用は借方、負債・純資産・収益は貸方が正）
      let balance = 0;
      if (acc.account_type === 'asset' || acc.account_type === 'expense') {
        balance = acc.debit_total - acc.credit_total;
      } else {
        balance = acc.credit_total - acc.debit_total;
      }
      
      if (balance !== 0) {
        const accountData = {
          id: acc.id,
          code: acc.account_code,
          name: acc.account_name,
          balance: balance
        };
        
        if (acc.account_type === 'asset') {
          assetAccounts.push(accountData);
          assetsTotal += balance;
        } else if (acc.account_type === 'liability') {
          liabilityAccounts.push(accountData);
          liabilitiesTotal += balance;
        } else if (acc.account_type === 'equity') {
          equityAccounts.push(accountData);
          equityTotal += balance;
        } else if (acc.account_type === 'revenue') {
          revenueTotal += balance;
        } else if (acc.account_type === 'expense') {
          expenseTotal += balance;
        }
      }
    });
    
    // 当期純利益を計算（収益 - 費用）
    const netIncome = revenueTotal - expenseTotal;
    
    // 当期純利益を純資産に追加
    if (netIncome !== 0) {
      equityAccounts.push({
        id: 9999,
        code: '9999',
        name: '当期純利益',
        balance: netIncome
      });
      equityTotal += netIncome;
    }
    
    res.json({ 
      assets: assetsTotal, 
      liabilities: liabilitiesTotal, 
      equity: equityTotal,
      assetAccounts: assetAccounts,
      liabilityAccounts: liabilityAccounts,
      equityAccounts: equityAccounts
    });
  } catch (error) {
    console.error('Error getting balance sheet:', error);
    res.status(500).json({ error: 'Failed to get balance sheet' });
  }
});

// 試算表
router.get('/trial-balance', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const params = [];
    
    let dateFilter = '';
    if (start_date) { 
      dateFilter += ' AND je.entry_date >= ?';
      params.push(start_date);
    }
    if (end_date) { 
      dateFilter += ' AND je.entry_date <= ?';
      params.push(end_date);
    }
    
    const accounts = db.prepare(`
      SELECT 
        a.id,
        a.account_code,
        a.account_name,
        a.account_type as category,
        COALESCE(SUM(CASE WHEN je.debit_account_id = a.id THEN je.amount ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN je.credit_account_id = a.id THEN je.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_entries je ON (je.debit_account_id = a.id OR je.credit_account_id = a.id) ${dateFilter.replace('je.entry_date', 'je.entry_date')}
      WHERE a.is_active = 1
      GROUP BY a.id, a.account_code, a.account_name, a.account_type
      HAVING total_debit > 0 OR total_credit > 0
      ORDER BY a.account_code
    `).all(...params);
    
    res.json(accounts);
  } catch (error) {
    console.error('Error getting trial balance:', error);
    res.status(500).json({ error: 'Failed to get trial balance' });
  }
});

// ============================================
// 自動仕訳生成ヘルパー関数
// ============================================

// 書類（請求書・見積書）から仕訳を自動生成
export function createJournalFromDocument(documentId, documentType) {
  try {
    const doc = db.prepare(`
      SELECT d.*, c.name as customer_name
      FROM documents d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.id = ?
    `).get(documentId);
    
    if (!doc) return;
    
    // 請求書のみ仕訳を作成（見積書は作成しない）
    if (documentType === 'invoice' && doc.status === 'issued') {
      // 既存の仕訳を削除
      db.prepare(`
        DELETE FROM journal_entries 
        WHERE reference_type = 'document' AND reference_id = ?
      `).run(documentId);
      
      // 売掛金科目と売上科目を取得
      const receivableAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1100'").get();
      const revenueAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '4000'").get();
      
      if (receivableAccount && revenueAccount) {
        // 借方：売掛金 / 貸方：売上高
        db.prepare(`
          INSERT INTO journal_entries (
            entry_date, description, debit_account_id, credit_account_id, 
            amount, reference_type, reference_id, admin_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          doc.issue_date,
          `${doc.customer_name} 売上計上 (${doc.document_number})`,
          receivableAccount.id,
          revenueAccount.id,
          doc.total_amount,
          'document',
          documentId,
          doc.created_by || 1
        );
      }
      
      // 入金時の仕訳
      if (doc.payment_date) {
        const cashAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get();
        
        if (cashAccount && receivableAccount) {
          // 借方：現金 / 貸方：売掛金
          db.prepare(`
            INSERT INTO journal_entries (
              entry_date, description, debit_account_id, credit_account_id, 
              amount, reference_type, reference_id, admin_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            doc.payment_date,
            `${doc.customer_name} 入金 (${doc.document_number})`,
            cashAccount.id,
            receivableAccount.id,
            doc.total_amount,
            'document_payment',
            documentId,
            doc.created_by || 1
          );
        }
      }
    }
  } catch (error) {
    console.error('Error creating journal from document:', error);
  }
}

// 発注書から仕訳を自動生成
export function createJournalFromPurchaseOrder(orderId) {
  try {
    console.log('[仕訳作成] 発注ID:', orderId);
    
    const order = db.prepare(`
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `).get(orderId);
    
    if (!order) {
      console.log('[仕訳作成] 発注が見つかりません');
      return;
    }
    
    console.log('[仕訳作成] 発注データ:', { order_number: order.order_number, status: order.status, total_amount: order.total_amount });
    
    // 既存の仕訳を削除
    db.prepare(`
      DELETE FROM journal_entries 
      WHERE reference_type = 'purchase_order' AND reference_id = ?
    `).run(orderId);
    
    // 既存の現金出納帳エントリを削除
    db.prepare(`
      DELETE FROM cash_book 
      WHERE reference_type = 'purchase_order' AND reference_id = ?
    `).run(orderId);
    
    // 納品完了時に買掛金計上の仕訳を作成
    if (order.status === 'delivered') {
      const purchaseAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '5000'").get();
      const payableAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '2000'").get();
      
      console.log('[仕訳作成] 勘定科目:', { purchase: purchaseAccount?.id, payable: payableAccount?.id });
      
      if (purchaseAccount && payableAccount) {
        // 日付は actual_delivery_date > expected_delivery_date > order_date の順で取得
        const entryDate = order.actual_delivery_date || order.expected_delivery_date || order.order_date;
        
        console.log('[仕訳作成] 使用する日付:', entryDate);
        
        // 借方：仕入高 / 貸方：買掛金
        const result = db.prepare(`
          INSERT INTO journal_entries (
            entry_date, description, debit_account_id, credit_account_id, 
            amount, reference_type, reference_id, admin_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          entryDate,
          `${order.supplier_name} 仕入計上 (${order.order_number})`,
          purchaseAccount.id,
          payableAccount.id,
          order.total_amount,
          'purchase_order',
          orderId,
          order.created_by || 1
        );
        
        console.log('[仕訳作成] 成功 - ID:', result.lastInsertRowid);
      } else {
        console.log('[仕訳作成] 勘定科目が見つかりません');
      }
    } else {
      console.log('[仕訳作成] ステータスがdeliveredではありません:', order.status);
    }
  } catch (error) {
    console.error('[仕訳作成] エラー:', error);
  }
}

// 発注取引の支払処理（買掛金 → 現金）
export function processPurchasePayment(orderId, paymentDate) {
  try {
    console.log('[支払処理] 発注ID:', orderId, '支払日:', paymentDate);
    
    const order = db.prepare(`
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `).get(orderId);
    
    if (!order) {
      console.log('[支払処理] 発注が見つかりません');
      return;
    }
    
    const cashAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get(); // 現金
    const payableAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '2000'").get(); // 買掛金
    
    if (cashAccount && payableAccount) {
      // 借方：買掛金 / 貸方：現金（支払処理）
      db.prepare(`
        INSERT INTO journal_entries (
          entry_date, description, debit_account_id, credit_account_id, 
          amount, reference_type, reference_id, admin_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentDate,
        `${order.supplier_name} 買掛金支払 (${order.order_number})`,
        payableAccount.id,
        cashAccount.id,
        order.total_amount,
        'purchase_order',
        orderId,
        order.created_by || 1
      );
      
      console.log(`✅ 仕訳帳登録: 買掛金支払 ${order.order_number} ¥${order.total_amount}`);
      
      // 現金出納帳にも記録
      const currentBalance = db.prepare(
        'SELECT balance FROM cash_book ORDER BY transaction_date DESC, created_at DESC LIMIT 1'
      ).get();
      const newBalance = (currentBalance?.balance || 0) - order.total_amount;
      
      db.prepare(`
        INSERT INTO cash_book (
          transaction_date, transaction_type, category, description, 
          amount, balance, reference_type, reference_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentDate,
        '出金',
        '仕入',
        `発注取引: ${order.order_number}`,
        order.total_amount,
        newBalance,
        'purchase_order',
        orderId
      );
      
      console.log(`✅ 現金出納帳登録: ${order.order_number} -¥${order.total_amount}`);
    }
  } catch (error) {
    console.error('[支払処理] エラー:', error);
  }
}

// 在庫移動から仕訳を自動生成
export function createJournalFromInventoryMovement(movementId) {
  try {
    const movement = db.prepare(`
      SELECT im.*, i.item_name, i.category
      FROM inventory_movements im
      LEFT JOIN inventory i ON im.inventory_id = i.id
      WHERE im.id = ?
    `).get(movementId);
    
    if (!movement) return;
    
    // 入庫時のみ仕訳を作成（購買による在庫増加）
    if (movement.movement_type === 'in' && movement.reference_type === 'purchase') {
      const inventoryAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get();
      const purchaseAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '5000'").get();
      
      if (inventoryAccount && purchaseAccount) {
        const amount = movement.quantity * (movement.unit_cost || 0);
        
        // 借方：在庫資産 / 貸方：仕入高（または現金）
        db.prepare(`
          INSERT INTO journal_entries (
            entry_date, description, debit_account_id, credit_account_id, 
            amount, reference_type, reference_id, admin_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          movement.performed_at.split(' ')[0],
          `${movement.item_name} 在庫計上`,
          inventoryAccount.id,
          purchaseAccount.id,
          amount,
          'inventory_movement',
          movementId,
          movement.performed_by || 1
        );
      }
    }
  } catch (error) {
    console.error('Error creating journal from inventory movement:', error);
  }
}

// 認証が必要なエンドポイント（PDF生成以外）
router.use(authenticateToken);

// 損益計算書HTML生成関数
function generateProfitLossHTML(revenueDetails, expenseDetails, revenueTotal, expensesTotal, netIncome, startDate, endDate) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>損益計算書</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'MS PGothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; 
      background: white;
      padding: 15mm;
      font-size: 11pt;
    }
    .page { 
      max-width: 180mm;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .company-name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .company-info {
      font-size: 9pt;
      color: #333;
      line-height: 1.5;
    }
    .doc-title {
      font-size: 18pt;
      font-weight: bold;
      margin: 15px 0 10px 0;
      text-align: center;
    }
    .period {
      font-size: 10pt;
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #ccc;
    }
    
    th {
      background: #f5f5f5;
      font-weight: bold;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }
    
    td.amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    
    tr.section-header td {
      font-weight: bold;
      background: #f9f9f9;
      border-top: 1px solid #999;
      padding-top: 12px;
    }
    
    tr.subtotal td {
      font-weight: bold;
      border-top: 1px solid #666;
      border-bottom: 1px solid #666;
      background: #f5f5f5;
    }
    
    tr.total td {
      font-weight: bold;
      font-size: 12pt;
      border-top: 2px solid #000;
      border-bottom: 3px double #000;
      background: #e8f4f8;
      padding: 12px;
    }
    
    tr.indent td.label {
      padding-left: 30px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #999;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    @media print {
      body { padding: 0; }
      .page { max-width: none; }
    }
  </style>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="company-name">麺家弍色</div>
      <div class="company-info">
        〒252-0241 神奈川県相模原市中央区横山台2-9-8　TEL: 042-704-9657
      </div>
    </div>

    <div class="doc-title">損益計算書</div>
    <div class="period">
      自 ${startDate || '期首'} 　至 ${endDate || '期末'}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 60%;">科目</th>
          <th style="width: 40%; text-align: right;">金額</th>
        </tr>
      </thead>
      <tbody>
        <!-- 売上高 -->
        <tr class="section-header">
          <td colspan="2">【売上高】</td>
        </tr>
        ${revenueDetails.map(item => `
        <tr class="indent">
          <td class="label">${item.account_name}</td>
          <td class="amount">¥${item.amount.toLocaleString()}</td>
        </tr>
        `).join('')}
        ${revenueDetails.length === 0 ? '<tr class="indent"><td class="label">売上データなし</td><td class="amount">¥0</td></tr>' : ''}
        <tr class="subtotal">
          <td class="label">売上高合計</td>
          <td class="amount">¥${revenueTotal.toLocaleString()}</td>
        </tr>
        
        <!-- 経費 -->
        <tr class="section-header">
          <td colspan="2">【経費】</td>
        </tr>
        ${expenseDetails.map(item => `
        <tr class="indent">
          <td class="label">${item.account_name}</td>
          <td class="amount">¥${item.amount.toLocaleString()}</td>
        </tr>
        `).join('')}
        ${expenseDetails.length === 0 ? '<tr class="indent"><td class="label">経費データなし</td><td class="amount">¥0</td></tr>' : ''}
        <tr class="subtotal">
          <td class="label">経費合計</td>
          <td class="amount">¥${expensesTotal.toLocaleString()}</td>
        </tr>
        
        <!-- 当期純利益 -->
        <tr class="total">
          <td class="label">${netIncome >= 0 ? '当期純利益' : '当期純損失'}</td>
          <td class="amount">${netIncome >= 0 ? '' : '△'}¥${Math.abs(netIncome).toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div>発行日: ${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div style="margin-top: 5px;">麺家弍色 SYSTEM CLOUD</div>
    </div>
  </div>
</body>
</html>`;
}

// 貸借対照表HTML生成関数
function generateBalanceSheetHTML(assetDetails, liabilityDetails, equityDetails, assetsTotal, liabilitiesTotal, equityTotal, asOfDate) {
  const totalLiabilitiesEquity = liabilitiesTotal + equityTotal;
  
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>貸借対照表</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'MS PGothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; 
      background: white;
      padding: 15mm;
      font-size: 11pt;
    }
    .page { 
      max-width: 180mm;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .company-name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .company-info {
      font-size: 9pt;
      color: #333;
      line-height: 1.5;
    }
    .doc-title {
      font-size: 18pt;
      font-weight: bold;
      margin: 15px 0 10px 0;
      text-align: center;
    }
    .as-of-date {
      font-size: 10pt;
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5px;
    }
    
    th, td {
      padding: 8px 12px;
      text-align: left;
      border: 1px solid #999;
    }
    
    th {
      background: #f5f5f5;
      font-weight: bold;
      border: 2px solid #000;
      text-align: center;
    }
    
    td.amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    
    tr.section-header td {
      font-weight: bold;
      background: #f9f9f9;
      border-top: 2px solid #666;
      border-bottom: 1px solid #666;
    }
    
    tr.subtotal td {
      font-weight: bold;
      background: #f5f5f5;
      border-top: 1px solid #666;
    }
    
    tr.total td {
      font-weight: bold;
      font-size: 12pt;
      border: 2px solid #000;
      background: #e8f4f8;
      padding: 12px;
    }
    
    tr.indent td.label {
      padding-left: 30px;
    }
    
    .balance-check {
      text-align: center;
      margin: 20px 0;
      padding: 10px;
      background: ${Math.abs(assetsTotal - totalLiabilitiesEquity) < 0.01 ? '#f6ffed' : '#fff1f0'};
      border: 1px solid ${Math.abs(assetsTotal - totalLiabilitiesEquity) < 0.01 ? '#b7eb8f' : '#ffa39e'};
      border-radius: 4px;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #999;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    @media print {
      body { padding: 0; }
      .page { max-width: none; }
    }
  </style>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="company-name">麺家弍色</div>
      <div class="company-info">
        〒252-0241 神奈川県相模原市中央区横山台2-9-8　TEL: 042-704-9657
      </div>
    </div>

    <div class="doc-title">貸借対照表</div>
    <div class="as-of-date">
      ${asOfDate || new Date().toISOString().split('T')[0]} 現在
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 60%;">資産の部</th>
          <th style="width: 40%;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${assetDetails.map(item => `
        <tr class="indent">
          <td class="label">${item.account_name}</td>
          <td class="amount">¥${item.amount.toLocaleString()}</td>
        </tr>
        `).join('')}
        ${assetDetails.length === 0 ? '<tr class="indent"><td class="label">資産データなし</td><td class="amount">¥0</td></tr>' : ''}
        <tr class="total">
          <td class="label">資産合計</td>
          <td class="amount">¥${assetsTotal.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <table>
      <thead>
        <tr>
          <th style="width: 60%;">負債の部</th>
          <th style="width: 40%;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${liabilityDetails.map(item => `
        <tr class="indent">
          <td class="label">${item.account_name}</td>
          <td class="amount">¥${item.amount.toLocaleString()}</td>
        </tr>
        `).join('')}
        ${liabilityDetails.length === 0 ? '<tr class="indent"><td class="label">負債データなし</td><td class="amount">¥0</td></tr>' : ''}
        <tr class="subtotal">
          <td class="label">負債合計</td>
          <td class="amount">¥${liabilitiesTotal.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <table>
      <thead>
        <tr>
          <th style="width: 60%;">純資産の部</th>
          <th style="width: 40%;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${equityDetails.map(item => `
        <tr class="indent">
          <td class="label">${item.account_name}</td>
          <td class="amount">¥${item.amount.toLocaleString()}</td>
        </tr>
        `).join('')}
        ${equityDetails.length === 0 ? '<tr class="indent"><td class="label">純資産データなし</td><td class="amount">¥0</td></tr>' : ''}
        <tr class="subtotal">
          <td class="label">純資産合計</td>
          <td class="amount">¥${equityTotal.toLocaleString()}</td>
        </tr>
        <tr class="total">
          <td class="label">負債・純資産合計</td>
          <td class="amount">¥${totalLiabilitiesEquity.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="balance-check">
      ${Math.abs(assetsTotal - totalLiabilitiesEquity) < 0.01 ? '✓ 貸借バランス一致' : '⚠ 貸借バランス不一致'}
      (差額: ¥${Math.abs(assetsTotal - totalLiabilitiesEquity).toLocaleString()})
    </div>

    <div class="footer">
      <div>発行日: ${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div style="margin-top: 5px;">麺家弍色 SYSTEM CLOUD</div>
    </div>
  </div>
</body>
</html>`;
}

// キャッシュフロー計算書エンドポイント
router.get('/cashflow', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    // 現金勘定（1000）のIDを取得
    const cashAccount = db.prepare('SELECT id FROM accounts WHERE account_code = ?').get('1000');
    if (!cashAccount) {
      return res.status(404).json({ error: 'Cash account not found' });
    }

    // 現金が関係する仕訳を取得（借方または貸方が現金）
    const cashTransactions = db.prepare(`
      SELECT 
        j.*,
        da.account_name as debit_name, da.account_code as debit_code, da.account_type as debit_type,
        ca.account_name as credit_name, ca.account_code as credit_code, ca.account_type as credit_type
      FROM journal_entries j
      LEFT JOIN accounts da ON j.debit_account_id = da.id
      LEFT JOIN accounts ca ON j.credit_account_id = ca.id
      WHERE (j.debit_account_id = ? OR j.credit_account_id = ?)
        AND j.entry_date >= ? AND j.entry_date <= ?
      ORDER BY j.entry_date ASC, j.id ASC
    `).all(cashAccount.id, cashAccount.id, start_date, end_date);

    // 営業キャッシュフロー
    const operatingCF = {
      revenue: 0,      // 売上による収入
      expenses: 0,     // 費用による支出
      net: 0
    };

    // 投資キャッシュフロー
    const investingCF = {
      purchases: 0,    // 固定資産購入
      sales: 0,        // 固定資産売却
      net: 0
    };

    // 財務キャッシュフロー
    const financingCF = {
      borrowings: 0,   // 借入
      repayments: 0,   // 返済
      capital: 0,      // 資本金増減
      net: 0
    };

    // 期首の現金残高を計算
    const beginningBalanceData = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN debit_account_id = ? THEN amount ELSE 0 END), 0) as debit,
        COALESCE(SUM(CASE WHEN credit_account_id = ? THEN amount ELSE 0 END), 0) as credit
      FROM journal_entries
      WHERE entry_date < ?
    `).get(cashAccount.id, cashAccount.id, start_date);
    
    const beginningBalance = beginningBalanceData.debit - beginningBalanceData.credit;

    // 現金取引を分類
    cashTransactions.forEach(tx => {
      const amount = tx.amount;
      const isCashDebit = tx.debit_account_id === cashAccount.id;  // 現金が借方（入金）
      const isCashCredit = tx.credit_account_id === cashAccount.id; // 現金が貸方（出金）
      
      // 相手勘定の種類を確認
      const otherAccountType = isCashDebit ? tx.credit_type : tx.debit_type;
      const otherAccountCode = isCashDebit ? tx.credit_code : tx.debit_code;
      const otherAccountName = isCashDebit ? tx.credit_name : tx.debit_name;
      
      // 営業キャッシュフロー
      if (otherAccountType === 'revenue') {
        // 収益科目：売上など（現金が借方 = 入金）
        if (isCashDebit) {
          operatingCF.revenue += amount;
        }
      } else if (otherAccountType === 'expense') {
        // 費用科目：仕入、給料、家賃など（現金が貸方 = 出金）
        if (isCashCredit) {
          operatingCF.expenses += amount;
        }
      } else if (otherAccountType === 'asset') {
        // 資産科目の処理
        if (otherAccountCode === '1300') {
          // 商品購入（借方：商品、貸方：現金）
          if (isCashCredit) {
            operatingCF.expenses += amount;
          }
        } else {
          // 売掛金回収など（借方：現金、貸方：売掛金）
          if (isCashDebit) {
            operatingCF.revenue += amount;
          }
        }
      } else if (otherAccountType === 'liability' && otherAccountCode === '2000') {
        // 買掛金支払（借方：買掛金、貸方：現金）
        if (isCashCredit) {
          operatingCF.expenses += amount;
        }
      }
      // 投資キャッシュフロー
      else if (tx.description && (tx.description.includes('固定資産') || tx.description.includes('設備投資'))) {
        if (isCashCredit) {
          investingCF.purchases += amount;
        } else if (isCashDebit) {
          investingCF.sales += amount;
        }
      }
      // 財務キャッシュフロー
      else if (otherAccountType === 'equity' || (tx.description && tx.description.includes('資本金'))) {
        if (isCashDebit) {
          financingCF.capital += amount;
        } else {
          financingCF.capital -= amount;
        }
      } else if (tx.description && (tx.description.includes('借入') || tx.description.includes('融資'))) {
        if (isCashDebit) {
          financingCF.borrowings += amount;
        } else {
          financingCF.repayments += amount;
        }
      }
    });

    // 各セクションの純額を計算
    operatingCF.net = operatingCF.revenue - operatingCF.expenses;
    investingCF.net = investingCF.sales - investingCF.purchases;
    financingCF.net = financingCF.borrowings - financingCF.repayments + financingCF.capital;

    // 現金増減額
    const cashIncrease = operatingCF.net + investingCF.net + financingCF.net;

    // 期末残高を計算
    const endingBalance = beginningBalance + cashIncrease;

    res.json({
      operating: operatingCF,
      investing: investingCF,
      financing: financingCF,
      beginningBalance,
      cashIncrease,
      endingBalance,
      calculatedEndingBalance: beginningBalance + cashIncrease,
      transactions: cashTransactions.length
    });
  } catch (error) {
    console.error('Error calculating cashflow:', error);
    res.status(500).json({ error: 'Failed to calculate cashflow' });
  }
});

export default router;
