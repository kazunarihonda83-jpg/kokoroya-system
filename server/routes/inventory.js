import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 在庫関連の勘定科目を取得または作成
function ensureInventoryAccounts() {
  const accounts = [
    { code: '1300', name: '商品', type: 'asset', subcategory: null },
    { code: '5100', name: '売上原価', type: 'expense', subcategory: 'cost_of_sales' },
    { code: '8100', name: '雑損失', type: 'expense', subcategory: 'non_operating_expense' },
    { code: '7100', name: '雑収入', type: 'revenue', subcategory: 'non_operating_income' }
  ];

  accounts.forEach(acc => {
    const exists = db.prepare('SELECT * FROM accounts WHERE account_code = ?').get(acc.code);
    if (!exists) {
      db.prepare(`
        INSERT INTO accounts (account_code, account_name, account_type, subcategory)
        VALUES (?, ?, ?, ?)
      `).run(acc.code, acc.name, acc.type, acc.subcategory);
      console.log(`✅ 勘定科目追加: [${acc.code}] ${acc.name} (${acc.subcategory || 'なし'})`);
    } else if (acc.subcategory && !exists.subcategory) {
      // subcategoryが未設定の場合は更新
      db.prepare('UPDATE accounts SET subcategory = ? WHERE account_code = ?')
        .run(acc.subcategory, acc.code);
      console.log(`✅ 勘定科目更新: [${acc.code}] ${acc.name} → ${acc.subcategory}`);
    }
  });
}

// 在庫移動時の仕訳を自動生成
function createInventoryJournalEntry(inventoryId, movementType, quantity, unitCost, userId, notes) {
  try {
    ensureInventoryAccounts();
    
    const inventory = db.prepare('SELECT * FROM inventory WHERE id = ?').get(inventoryId);
    if (!inventory) return;

    const amount = Math.abs(quantity) * (unitCost || inventory.unit_cost);
    const entryDate = new Date().toISOString().split('T')[0];
    
    let debitAccount, creditAccount, description;
    
    if (movementType === 'in' || movementType === 'initial') {
      // 入庫: 借方 商品 / 貸方 現金（現金購入）
      debitAccount = '1300';  // 商品（資産）
      creditAccount = '1000'; // 現金（資産）
      description = `在庫入庫: ${inventory.item_name} ${Math.abs(quantity)}${inventory.unit}`;
    } else if (movementType === 'out') {
      // 出庫: 借方 売上原価 / 貸方 商品
      debitAccount = '5100';  // 売上原価（費用）
      creditAccount = '1300'; // 商品（資産）
      description = `在庫出庫: ${inventory.item_name} ${Math.abs(quantity)}${inventory.unit}`;
    } else if (movementType === 'adjustment') {
      // 調整: 増加は雑収入、減少は雑損失
      if (quantity > 0) {
        debitAccount = '1300';  // 商品（資産）
        creditAccount = '7100'; // 雑収入（収益）
        description = `在庫調整（増加）: ${inventory.item_name} +${Math.abs(quantity)}${inventory.unit}`;
      } else {
        debitAccount = '8100';  // 雑損失（費用）
        creditAccount = '1300'; // 商品（資産）
        description = `在庫調整（減少）: ${inventory.item_name} -${Math.abs(quantity)}${inventory.unit}`;
      }
    } else {
      return; // 未知の移動タイプ
    }
    
    if (notes) {
      description += ` (${notes})`;
    }

    // 勘定科目IDを取得
    const debitAccountId = db.prepare('SELECT id FROM accounts WHERE account_code = ?').get(debitAccount)?.id;
    const creditAccountId = db.prepare('SELECT id FROM accounts WHERE account_code = ?').get(creditAccount)?.id;
    
    if (!debitAccountId || !creditAccountId) {
      console.error(`❌ 在庫仕訳エラー: 勘定科目が見つかりません (借方: ${debitAccount}, 貸方: ${creditAccount})`);
      return;
    }

    // 仕訳を生成（1つのエントリで借方・貸方を記録）
    db.prepare(`
      INSERT INTO journal_entries (
        entry_date, description, debit_account_id, credit_account_id, amount,
        reference_type, reference_id, admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entryDate, description, debitAccountId, creditAccountId, amount,
      'inventory_movement', inventoryId, userId
    );
    
    console.log(`✅ 在庫仕訳生成: ${description} ¥${amount}`);
  } catch (error) {
    console.error('Error creating inventory journal entry:', error);
    throw error;
  }
}

// すべてのルートに認証を適用
router.use(authenticateToken);

// 在庫一覧取得
router.get('/', (req, res) => {
  try {
    const { category, supplier_id, low_stock } = req.query;
    let query = `
      SELECT i.*, s.name as supplier_name,
        CASE 
          WHEN i.current_stock <= i.reorder_point THEN 'low'
          WHEN i.current_stock >= i.optimal_stock THEN 'optimal'
          ELSE 'normal'
        END as stock_status
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND i.category = ?';
      params.push(category);
    }

    if (supplier_id) {
      query += ' AND i.supplier_id = ?';
      params.push(supplier_id);
    }

    if (low_stock === 'true') {
      query += ' AND i.current_stock <= i.reorder_point';
    }

    query += ' ORDER BY i.item_name';

    const inventory = db.prepare(query).all(...params);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// 在庫詳細取得
router.get('/:id', (req, res) => {
  try {
    const inventory = db.prepare(`
      SELECT i.*, s.name as supplier_name
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // 在庫移動履歴も取得
    const movements = db.prepare(`
      SELECT m.*, a.username as performed_by_name
      FROM inventory_movements m
      LEFT JOIN administrators a ON m.performed_by = a.id
      WHERE m.inventory_id = ?
      ORDER BY m.performed_at DESC
      LIMIT 50
    `).all(req.params.id);

    res.json({ ...inventory, movements });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// 在庫新規作成
router.post('/', (req, res) => {
  try {
    const {
      item_name, category, supplier_id, unit, current_stock,
      reorder_point, optimal_stock, unit_cost, expiry_date,
      storage_location, notes
    } = req.body;

    // バリデーション
    if (!item_name || !category) {
      return res.status(400).json({ error: '商品名とカテゴリは必須です' });
    }

    console.log('在庫登録データ:', { item_name, category, supplier_id, unit, current_stock, reorder_point, optimal_stock, unit_cost });

    const result = db.prepare(`
      INSERT INTO inventory (
        item_name, category, supplier_id, unit, current_stock,
        reorder_point, optimal_stock, unit_cost, expiry_date,
        storage_location, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item_name, category, supplier_id || null, unit || '個', current_stock || 0,
      reorder_point || 0, optimal_stock || 0, unit_cost || 0,
      expiry_date || null, storage_location || null, notes || null
    );

    // 初期在庫の移動履歴を記録
    if (current_stock && current_stock > 0) {
      db.prepare(`
        INSERT INTO inventory_movements (
          inventory_id, movement_type, quantity, unit_cost,
          reference_type, notes, performed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        result.lastInsertRowid,
        'initial',
        current_stock,
        unit_cost,
        'manual',
        '初期在庫登録',
        req.user.id
      );
      
      // 会計仕訳を自動生成
      createInventoryJournalEntry(
        result.lastInsertRowid,
        'initial',
        current_stock,
        unit_cost,
        req.user.id,
        '初期在庫登録'
      );
    }

    // 在庫アラートをチェック
    checkStockAlerts(result.lastInsertRowid);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Inventory item created successfully' });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', req.body);
    res.status(500).json({ error: `在庫の作成に失敗しました: ${error.message}` });
  }
});

// 在庫更新
router.put('/:id', (req, res) => {
  try {
    const {
      item_name, category, supplier_id, unit, reorder_point,
      optimal_stock, unit_cost, expiry_date, storage_location, notes
    } = req.body;

    const result = db.prepare(`
      UPDATE inventory SET
        item_name = ?, category = ?, supplier_id = ?, unit = ?,
        reorder_point = ?, optimal_stock = ?, unit_cost = ?,
        expiry_date = ?, storage_location = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      item_name, category, supplier_id, unit,
      reorder_point, optimal_stock, unit_cost,
      expiry_date || null, storage_location || null, notes || null,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // 在庫アラートを再チェック
    checkStockAlerts(req.params.id);

    res.json({ message: 'Inventory item updated successfully' });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// 在庫データ一括削除エンドポイント（/:idより前に定義）
router.delete('/bulk-delete', (req, res) => {
  try {
    // トランザクション開始
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // 在庫移動履歴を削除
      db.prepare('DELETE FROM inventory_movements').run();
      
      // 在庫アラートを削除
      db.prepare('DELETE FROM stock_alerts').run();
      
      // 在庫データを削除
      const result = db.prepare('DELETE FROM inventory').run();
      
      // トランザクションコミット
      db.prepare('COMMIT').run();
      
      res.json({ 
        message: '在庫データを全て削除しました',
        deleted_count: result.changes 
      });
    } catch (error) {
      // エラー時はロールバック
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error bulk deleting inventory:', error);
    res.status(500).json({ error: '在庫データの一括削除に失敗しました' });
  }
});

// 在庫削除
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// 在庫移動（入庫・出庫・調整）
router.post('/:id/movement', (req, res) => {
  try {
    const { movement_type, quantity, unit_cost, reference_type, reference_id, notes } = req.body;

    if (!['in', 'out', 'adjustment'].includes(movement_type)) {
      return res.status(400).json({ error: 'Invalid movement type' });
    }

    // 現在の在庫を取得
    const inventory = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // 在庫を更新
    let newStock;
    if (movement_type === 'in') {
      newStock = inventory.current_stock + quantity;
    } else if (movement_type === 'out') {
      newStock = inventory.current_stock - quantity;
      if (newStock < 0) {
        return res.status(400).json({ error: '在庫が不足しています' });
      }
    } else { // adjustment
      newStock = quantity;
    }

    db.prepare('UPDATE inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStock, req.params.id);

    // 移動履歴を記録
    const actualQuantity = movement_type === 'out' ? -Math.abs(quantity) : Math.abs(quantity);
    db.prepare(`
      INSERT INTO inventory_movements (
        inventory_id, movement_type, quantity, unit_cost,
        reference_type, reference_id, notes, performed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id,
      movement_type,
      actualQuantity,
      unit_cost || inventory.unit_cost,
      reference_type || null,
      reference_id || null,
      notes || null,
      req.user.id
    );
    
    // 会計仕訳を自動生成
    createInventoryJournalEntry(
      req.params.id,
      movement_type,
      actualQuantity,
      unit_cost || inventory.unit_cost,
      req.user.id,
      notes
    );

    // 在庫アラートをチェック
    checkStockAlerts(req.params.id);

    res.json({ 
      message: 'Inventory movement recorded successfully',
      new_stock: newStock
    });
  } catch (error) {
    console.error('Error recording inventory movement:', error);
    res.status(500).json({ error: 'Failed to record inventory movement' });
  }
});

// 在庫アラート一覧取得
router.get('/alerts/list', (req, res) => {
  try {
    const { is_resolved } = req.query;
    let query = `
      SELECT a.*, i.item_name, i.category, i.current_stock
      FROM stock_alerts a
      JOIN inventory i ON a.inventory_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (is_resolved !== undefined) {
      query += ' AND a.is_resolved = ?';
      params.push(is_resolved === 'true' ? 1 : 0);
    }

    query += ' ORDER BY a.alert_level DESC, a.created_at DESC';

    const alerts = db.prepare(query).all(...params);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    res.status(500).json({ error: 'Failed to fetch stock alerts' });
  }
});

// アラート解決
router.put('/alerts/:id/resolve', (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE stock_alerts SET
        is_resolved = 1,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = ?
      WHERE id = ?
    `).run(req.user.id, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert resolved successfully' });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// アラート一括削除エンドポイント（/:idより前に定義）
router.delete('/alerts/bulk-delete', (req, res) => {
  try {
    // 完全削除ではなく、全て解決済みとしてマークする
    const result = db.prepare(`
      UPDATE stock_alerts SET 
        is_resolved = 1,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = ?
      WHERE is_resolved = 0
    `).run(req.user.id);
    
    res.json({ 
      message: 'アラートを全て削除しました',
      deleted_count: result.changes 
    });
  } catch (error) {
    console.error('Error bulk deleting alerts:', error);
    res.status(500).json({ error: 'アラートの一括削除に失敗しました' });
  }
});

// アラート削除
router.delete('/alerts/:id', (req, res) => {
  try {
    // ユーザーが手動で削除したことをマーク（二度と復活させない）
    const result = db.prepare(`
      UPDATE stock_alerts SET 
        is_resolved = 1,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = ?,
        manually_dismissed = 1
      WHERE id = ?
    `).run(req.user.id, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// カテゴリ一覧取得
router.get('/categories/list', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category
      FROM inventory
      WHERE category IS NOT NULL
      ORDER BY category
    `).all();

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 在庫統計取得
router.get('/stats/summary', (req, res) => {
  try {
    const stats = {
      total_items: db.prepare('SELECT COUNT(*) as count FROM inventory').get().count,
      low_stock_items: db.prepare('SELECT COUNT(*) as count FROM inventory WHERE current_stock <= reorder_point').get().count,
      total_value: db.prepare('SELECT SUM(current_stock * unit_cost) as value FROM inventory').get().value || 0,
      expiring_soon: db.prepare(`
        SELECT COUNT(*) as count FROM inventory 
        WHERE expiry_date IS NOT NULL 
        AND date(expiry_date) <= date('now', '+7 days')
        AND date(expiry_date) >= date('now')
      `).get().count,
      categories: db.prepare(`
        SELECT category, COUNT(*) as count, SUM(current_stock * unit_cost) as value
        FROM inventory
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY value DESC
      `).all()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ error: 'Failed to fetch inventory stats' });
  }
});

// 在庫アラートチェック関数
function checkStockAlerts(inventoryId) {
  try {
    const inventory = db.prepare('SELECT * FROM inventory WHERE id = ?').get(inventoryId);
    if (!inventory) return;

    // 既存のアラート（未解決 + 解決済み + 手動削除）を取得
    const existingAlerts = db.prepare(`
      SELECT alert_type, is_resolved, manually_dismissed, resolved_at FROM stock_alerts 
      WHERE inventory_id = ?
      ORDER BY created_at DESC
    `).all(inventoryId);

    const hasLowStockAlert = existingAlerts.some(a => a.alert_type === 'low_stock' && a.is_resolved === 0);
    const hasExpiryAlert = existingAlerts.some(a => a.alert_type === 'expiry_warning' && a.is_resolved === 0);
    
    // ユーザーが手動で削除したアラートは二度と作成しない
    const wasManuallyDismissedLowStock = existingAlerts.some(a => 
      a.alert_type === 'low_stock' && a.manually_dismissed === 1
    );
    
    const wasManuallyDismissedExpiry = existingAlerts.some(a => 
      a.alert_type === 'expiry_warning' && a.manually_dismissed === 1
    );

    // 在庫不足アラート - 手動削除されていない場合のみ作成
    if (inventory.current_stock <= inventory.reorder_point && !hasLowStockAlert && !wasManuallyDismissedLowStock) {
      db.prepare(`
        INSERT INTO stock_alerts (inventory_id, alert_type, alert_level, message)
        VALUES (?, ?, ?, ?)
      `).run(
        inventoryId,
        'low_stock',
        'warning',
        `${inventory.item_name}の在庫が発注点（${inventory.reorder_point}${inventory.unit}）以下です。現在在庫：${inventory.current_stock}${inventory.unit}`
      );
    } else if (inventory.current_stock > inventory.reorder_point && hasLowStockAlert) {
      // 在庫が回復したら自動解決（手動削除フラグはリセット）
      db.prepare(`
        UPDATE stock_alerts SET 
          is_resolved = 1, 
          resolved_at = CURRENT_TIMESTAMP,
          manually_dismissed = 0
        WHERE inventory_id = ? AND alert_type = 'low_stock' AND is_resolved = 0
      `).run(inventoryId);
    }

    // 賞味期限アラート - 手動削除されていない場合のみ作成
    if (inventory.expiry_date && !hasExpiryAlert && !wasManuallyDismissedExpiry) {
      const expiryCheck = db.prepare(`
        SELECT date(?) <= date('now', '+7 days') AND date(?) >= date('now') as is_expiring
      `).get(inventory.expiry_date, inventory.expiry_date);

      if (expiryCheck.is_expiring) {
        db.prepare(`
          INSERT INTO stock_alerts (inventory_id, alert_type, alert_level, message)
          VALUES (?, ?, ?, ?)
        `).run(
          inventoryId,
          'expiry_warning',
          'urgent',
          `${inventory.item_name}の賞味期限が近づいています（${inventory.expiry_date}）`
        );
      }
    }
  } catch (error) {
    console.error('Error checking stock alerts:', error);
  }
}

export default router;
