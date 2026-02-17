import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { createJournalFromPurchaseOrder, processPurchasePayment } from './accounting.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT po.*, s.name as supplier_name 
      FROM purchase_orders po 
      LEFT JOIN suppliers s ON po.supplier_id = s.id 
      ORDER BY po.order_date DESC
    `).all();
    res.json(orders);
  } catch (error) {
    console.error('Error getting purchase orders:', error);
    res.status(500).json({ error: 'Failed to get purchase orders' });
  }
});

// 発注データから発注書を生成（このルートは /orders/:id より前に配置）
router.post('/orders/:id/create-document', async (req, res) => {
  try {
    const order = db.prepare(`
      SELECT po.*, s.name as supplier_name, s.address, s.phone, s.email
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `).get(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const items = db.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').all(req.params.id);
    
    // 発注書番号を生成
    const today = new Date();
    const docNumber = `O${today.getFullYear().toString().slice(-2)}${(today.getMonth()+1).toString().padStart(2,'0')}${Date.now().toString().slice(-5)}`;
    
    // 仕入先を顧客として一時的に作成または取得
    let customer = db.prepare('SELECT * FROM customers WHERE name = ?').get(order.supplier_name);
    
    if (!customer) {
      const result = db.prepare(`
        INSERT INTO customers (customer_type, name, address, phone, email)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'supplier',  // 仕入先として登録
        order.supplier_name,
        order.address || '',
        order.phone || '',
        order.email || ''
      );
      customer = { id: result.lastInsertRowid };
    }
    
    // 発注書を作成
    const documentResult = db.prepare(`
      INSERT INTO documents (
        document_number, document_type, customer_id, issue_date,
        tax_type, tax_rate, subtotal, tax_amount, total_amount,
        notes, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      docNumber,
      'order',
      customer.id,
      order.order_date,
      'exclusive',
      10,
      order.subtotal,
      order.tax_amount,
      order.total_amount,
      `発注番号: ${order.order_number}\n${order.notes || ''}`,
      'issued',
      req.user.id
    );
    
    // 明細を追加
    items.forEach(item => {
      db.prepare(`
        INSERT INTO document_items (document_id, item_name, quantity, unit_price, amount)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        documentResult.lastInsertRowid,
        item.item_name,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price
      );
    });
    
    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentResult.lastInsertRowid);
    res.status(201).json(document);
  } catch (error) {
    console.error('Create document from purchase order error:', error);
    res.status(500).json({ error: 'Failed to create document from purchase order' });
  }
});

router.get('/orders/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Purchase order not found' });
    
    const items = db.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').all(req.params.id);
    res.json({ ...order, items });
  } catch (error) {
    console.error('Error getting purchase order:', error);
    res.status(500).json({ error: 'Failed to get purchase order' });
  }
});

router.post('/orders', (req, res) => {
  try {
    const { supplier_id, order_date, items, notes, status, payment_status, payment_date } = req.body;
    
    let subtotal = 0;
    items.forEach(item => { 
      subtotal += item.unit_price * item.quantity; 
    });
    
    const taxAmount = Math.floor(subtotal * 10 / 100);
    const totalAmount = subtotal + taxAmount;
    const orderNumber = `PO${new Date().getFullYear().toString().slice(-2)}${Date.now().toString().slice(-6)}`;
    
    // デフォルトで納品済みステータスにして自動仕訳を作成
    const finalStatus = status || 'delivered';
    const finalPaymentStatus = payment_status || 'unpaid';
    
    const result = db.prepare(`
      INSERT INTO purchase_orders (
        order_number, supplier_id, order_date, 
        subtotal, tax_amount, total_amount, status, payment_status, payment_date, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNumber, 
      supplier_id, 
      order_date, 
      subtotal, 
      taxAmount, 
      totalAmount, 
      finalStatus,
      finalPaymentStatus,
      payment_date || null,
      notes, 
      req.user.id
    );
    
    items.forEach(item => {
      db.prepare(`
        INSERT INTO purchase_order_items (
          purchase_order_id, item_name, quantity, unit_price, amount
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        result.lastInsertRowid, 
        item.product_name, 
        item.quantity, 
        item.unit_price, 
        item.unit_price * item.quantity
      );
    });
    
    // 納品済みの場合、自動仕訳を作成
    if (finalStatus === 'delivered') {
      createJournalFromPurchaseOrder(result.lastInsertRowid);
    }
    
    // 支払済みの場合、現金支払いの仕訳を作成
    if (finalPaymentStatus === 'paid') {
      const effectivePaymentDate = payment_date || order_date;
      
      // 勘定科目を取得
      const cashAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get(); // 現金
      const payableAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '2000'").get(); // 買掛金
      const supplier = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplier_id);
      
      if (cashAccount && payableAccount && supplier) {
        // 借方: 買掛金 / 貸方: 現金
        db.prepare(`
          INSERT INTO journal_entries (
            entry_date, description, debit_account_id, credit_account_id, 
            amount, reference_type, reference_id, admin_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          effectivePaymentDate,
          `${supplier.name} 仕入支払い (${orderNumber})`,
          payableAccount.id,
          cashAccount.id,
          totalAmount,
          'purchase_order',
          result.lastInsertRowid,
          req.user.id
        );
        
        console.log(`✅ 仕訳帳登録: 仕入支払い ${orderNumber} ¥${totalAmount} (支払日: ${effectivePaymentDate})`);
        
        // 現金出納帳に記録
        const currentBalance = db.prepare(
          'SELECT balance FROM cash_book ORDER BY transaction_date DESC, created_at DESC LIMIT 1'
        ).get();
        const newBalance = (currentBalance?.balance || 0) - totalAmount;
        
        db.prepare(`
          INSERT INTO cash_book (
            transaction_date, transaction_type, category, description, 
            amount, balance, reference_type, reference_id, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          effectivePaymentDate,
          'expense',
          '仕入',
          `発注取引: ${orderNumber}`,
          totalAmount,
          newBalance,
          'purchase_order',
          result.lastInsertRowid,
          req.user.id
        );
        
        console.log(`✅ 現金出納帳登録: ${orderNumber} ¥${totalAmount} (残高: ¥${newBalance})`);
      }
    }
    
    res.status(201).json({ 
      id: result.lastInsertRowid, 
      order_number: orderNumber 
    });
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.put('/orders/:id', (req, res) => {
  try {
    const { supplier_id, order_date, items, notes, status, actual_delivery_date, payment_status, payment_date } = req.body;
    
    // 既存の発注を取得
    const existing = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    let subtotal = 0;
    items.forEach(item => { 
      subtotal += item.unit_price * item.quantity; 
    });
    
    const taxAmount = Math.floor(subtotal * 10 / 100);
    const totalAmount = subtotal + taxAmount;
    
    db.prepare(`
      UPDATE purchase_orders SET 
        supplier_id = ?, 
        order_date = ?, 
        subtotal = ?, 
        tax_amount = ?, 
        total_amount = ?, 
        notes = ?,
        status = ?,
        actual_delivery_date = ?,
        payment_status = ?,
        payment_date = ?
      WHERE id = ?
    `).run(
      supplier_id, 
      order_date, 
      subtotal, 
      taxAmount, 
      totalAmount, 
      notes,
      status || 'ordered',
      actual_delivery_date || null,
      payment_status || 'unpaid',
      payment_date || null,
      req.params.id
    );
    
    db.prepare('DELETE FROM purchase_order_items WHERE purchase_order_id = ?').run(req.params.id);
    
    items.forEach(item => {
      db.prepare(`
        INSERT INTO purchase_order_items (
          purchase_order_id, item_name, quantity, unit_price, amount
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        req.params.id, 
        item.product_name, 
        item.quantity, 
        item.unit_price, 
        item.unit_price * item.quantity
      );
    });
    
    // 納品済みの場合、自動仕訳を更新
    if (status === 'delivered') {
      createJournalFromPurchaseOrder(req.params.id);
    }
    
    // 未払い→支払済みへの変更時、現金支払いの仕訳を作成
    if (payment_status === 'paid' && existing.payment_status !== 'paid') {
      const effectivePaymentDate = payment_date || order_date;
      
      // 勘定科目を取得
      const cashAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get(); // 現金
      const payableAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '2000'").get(); // 買掛金
      const supplier = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplier_id);
      
      if (cashAccount && payableAccount && supplier) {
        // 借方: 買掛金 / 貸方: 現金
        db.prepare(`
          INSERT INTO journal_entries (
            entry_date, description, debit_account_id, credit_account_id, 
            amount, reference_type, reference_id, admin_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          effectivePaymentDate,
          `${supplier.name} 仕入支払い (${existing.order_number})`,
          payableAccount.id,
          cashAccount.id,
          totalAmount,
          'purchase_order',
          req.params.id,
          req.user.id
        );
        
        console.log(`✅ 仕訳帳登録: 仕入支払い ${existing.order_number} ¥${totalAmount} (支払日: ${effectivePaymentDate})`);
        
        // 現金出納帳に記録
        const currentBalance = db.prepare(
          'SELECT balance FROM cash_book ORDER BY transaction_date DESC, created_at DESC LIMIT 1'
        ).get();
        const newBalance = (currentBalance?.balance || 0) - totalAmount;
        
        db.prepare(`
          INSERT INTO cash_book (
            transaction_date, transaction_type, category, description, 
            amount, balance, reference_type, reference_id, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          effectivePaymentDate,
          'expense',
          '仕入',
          `発注取引: ${existing.order_number}`,
          totalAmount,
          newBalance,
          'purchase_order',
          req.params.id,
          req.user.id
        );
        
        console.log(`✅ 現金出納帳登録: ${existing.order_number} ¥${totalAmount} (残高: ¥${newBalance})`);
      }
    }
    
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    res.json(order);
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

router.delete('/orders/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    if (order) {
      console.log(`🗑️ 発注取引削除: ${order.order_number}`);
    }

    // 関連する仕訳を削除
    const journalDeleted = db.prepare(`
      DELETE FROM journal_entries 
      WHERE reference_type = 'purchase_order' 
      AND reference_id = ?
    `).run(req.params.id);
    console.log(`  - 仕訳帳エントリ削除: ${journalDeleted.changes}件`);
    
    // 関連する現金出納帳エントリを削除
    const cashBookDeleted = db.prepare(`
      DELETE FROM cash_book 
      WHERE reference_type = 'purchase_order' 
      AND reference_id = ?
    `).run(req.params.id);
    console.log(`  - 現金出納帳エントリ削除: ${cashBookDeleted.changes}件`);

    // 現金出納帳の残高を再計算
    const cashEntries = db.prepare(`
      SELECT * FROM cash_book 
      ORDER BY transaction_date ASC, created_at ASC
    `).all();
    
    let balance = 0;
    for (const entry of cashEntries) {
      if (entry.transaction_type === 'income' || entry.transaction_type === '入金') {
        balance += entry.amount;
      } else {
        balance -= entry.amount;
      }
      db.prepare('UPDATE cash_book SET balance = ? WHERE id = ?').run(balance, entry.id);
    }
    console.log(`  - 現金出納帳残高再計算完了`);
    
    // 発注書と明細を削除
    db.prepare('DELETE FROM purchase_order_items WHERE purchase_order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(req.params.id);
    
    if (order) {
      console.log(`✅ 発注取引削除完了: ${order.order_number}`);
    }
    
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

// ステータス更新専用エンドポイント
router.patch('/orders/:id/status', (req, res) => {
  try {
    const { status, actual_delivery_date } = req.body;
    
    db.prepare(`
      UPDATE purchase_orders SET 
        status = ?,
        actual_delivery_date = ?
      WHERE id = ?
    `).run(status, actual_delivery_date || null, req.params.id);
    
    // 納品済みに変更された場合、自動仕訳を作成
    if (status === 'delivered') {
      createJournalFromPurchaseOrder(req.params.id);
    }
    
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// 発注取引の支払処理エンドポイント
router.post('/orders/:id/payment', (req, res) => {
  try {
    const { payment_date } = req.body;
    
    if (!payment_date) {
      return res.status(400).json({ error: 'payment_date is required' });
    }
    
    // 発注書が存在するか確認
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    // 支払処理（仕訳帳と現金出納帳に記録）
    processPurchasePayment(req.params.id, payment_date);
    
    res.json({ message: 'Payment processed successfully' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
