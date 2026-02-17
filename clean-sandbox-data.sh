#!/bin/bash

echo "🗑️ 仮環境データ削除スクリプト"
echo "=============================="

DB_FILE="menya-nishiki-order.db"

if [ ! -f "$DB_FILE" ]; then
  echo "❌ データベースファイルが見つかりません: $DB_FILE"
  exit 1
fi

echo ""
echo "📊 削除前のデータ件数確認"
echo "--------------------------"

# トランザクションデータ件数確認
echo "仕訳帳: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM journal_entries').get().count);" 2>/dev/null) 件"
echo "受注取引: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM order_receipts').get().count);" 2>/dev/null) 件"
echo "在庫: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM inventory').get().count);" 2>/dev/null) 件"
echo "在庫移動: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM inventory_movements').get().count);" 2>/dev/null) 件"

echo ""
echo "🗑️ トランザクションデータを削除中..."
echo "--------------------------"

# Node.jsでトランザクション削除
node << 'NODESCRIPT'
const Database = require('better-sqlite3');
const db = new Database('menya-nishiki-order.db');

try {
  // トランザクション開始
  const deleteTransaction = db.transaction(() => {
    // 1. 在庫関連データ削除
    const deletedMovements = db.prepare('DELETE FROM inventory_movements').run();
    console.log(`✅ 在庫移動履歴: ${deletedMovements.changes} 件削除`);
    
    const deletedAlerts = db.prepare('DELETE FROM stock_alerts').run();
    console.log(`✅ 在庫アラート: ${deletedAlerts.changes} 件削除`);
    
    const deletedInventory = db.prepare('DELETE FROM inventory').run();
    console.log(`✅ 在庫データ: ${deletedInventory.changes} 件削除`);
    
    // 2. 受注関連データ削除
    const deletedOrderItems = db.prepare('DELETE FROM order_receipt_items').run();
    console.log(`✅ 受注明細: ${deletedOrderItems.changes} 件削除`);
    
    const deletedOrders = db.prepare('DELETE FROM order_receipts').run();
    console.log(`✅ 受注取引: ${deletedOrders.changes} 件削除`);
    
    // 3. 発注関連データ削除
    const deletedPurchaseItems = db.prepare('DELETE FROM purchase_order_items').run();
    console.log(`✅ 発注明細: ${deletedPurchaseItems.changes} 件削除`);
    
    const deletedPurchases = db.prepare('DELETE FROM purchase_orders').run();
    console.log(`✅ 発注書: ${deletedPurchases.changes} 件削除`);
    
    // 4. 仕訳帳削除
    const deletedJournal = db.prepare('DELETE FROM journal_entries').run();
    console.log(`✅ 仕訳帳: ${deletedJournal.changes} 件削除`);
    
    // 5. 現金出納帳削除
    const deletedCashBook = db.prepare('DELETE FROM cash_book').run();
    console.log(`✅ 現金出納帳: ${deletedCashBook.changes} 件削除`);
  });
  
  // トランザクション実行
  deleteTransaction();
  
  console.log('\n✅ トランザクションデータの削除完了');
  
} catch (error) {
  console.error('❌ エラー:', error.message);
  process.exit(1);
} finally {
  db.close();
}
NODESCRIPT

echo ""
echo "📊 削除後のデータ件数確認"
echo "--------------------------"

# 削除後の件数確認
echo "仕訳帳: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM journal_entries').get().count);" 2>/dev/null) 件"
echo "受注取引: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM order_receipts').get().count);" 2>/dev/null) 件"
echo "在庫: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM inventory').get().count);" 2>/dev/null) 件"
echo "在庫移動: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM inventory_movements').get().count);" 2>/dev/null) 件"

echo ""
echo "📊 マスタデータ（保持）"
echo "--------------------------"
echo "顧客: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM customers').get().count);" 2>/dev/null) 件"
echo "仕入先: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count);" 2>/dev/null) 件"
echo "勘定科目: $(node -e "const db = require('better-sqlite3')('$DB_FILE'); console.log(db.prepare('SELECT COUNT(*) as count FROM accounts').get().count);" 2>/dev/null) 件"

echo ""
echo "✅ データ削除完了"
