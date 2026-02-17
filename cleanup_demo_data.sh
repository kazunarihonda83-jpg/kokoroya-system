#!/bin/bash
# cleanup_demo_data.sh - デモ/テストデータを削除してクリーンな状態にする

cd /home/user/webapp/menya-nishiki-order-management-system

echo "=========================================="
echo "  デモデータ削除スクリプト"
echo "=========================================="
echo ""
echo "警告: このスクリプトは以下のデータを削除します:"
echo "  - すべての仕訳データ"
echo "  - すべての発注データ"
echo "  - すべての受注取引データ"
echo "  - すべての現金出納帳データ"
echo ""
echo "勘定科目マスタ、ユーザーアカウントは保持されます。"
echo ""
read -p "続行しますか？ (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "キャンセルしました。"
  exit 0
fi

echo ""
echo "=== デモデータ削除開始 ==="

node -e "
const Database = require('better-sqlite3');
const db = new Database('./server/menya-nishiki-order.db');

console.log('現在のデータ件数:');

// 削除前の件数を確認
const journalCount = db.prepare('SELECT COUNT(*) as count FROM journal_entries').get();
console.log('  仕訳データ:', journalCount.count);

const poCount = db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get();
console.log('  発注データ:', poCount.count);

const receiptCount = db.prepare('SELECT COUNT(*) as count FROM order_receipts').get();
console.log('  受注取引:', receiptCount.count);

const itemCount = db.prepare('SELECT COUNT(*) as count FROM order_receipt_items').get();
console.log('  受注明細:', itemCount.count);

const cashCount = db.prepare('SELECT COUNT(*) as count FROM cash_book').get();
console.log('  現金出納帳:', cashCount.count);

console.log('');
console.log('削除中...');

// 仕訳データを削除
const deleteJournals = db.prepare('DELETE FROM journal_entries');
const journalResult = deleteJournals.run();
console.log('✓ 仕訳データを削除しました:', journalResult.changes, '件');

// 発注データを削除
const deletePurchaseOrders = db.prepare('DELETE FROM purchase_orders');
const poResult = deletePurchaseOrders.run();
console.log('✓ 発注データを削除しました:', poResult.changes, '件');

// 受注取引データを削除
const deleteReceipts = db.prepare('DELETE FROM order_receipts');
const receiptResult = deleteReceipts.run();
console.log('✓ 受注取引を削除しました:', receiptResult.changes, '件');

const deleteItems = db.prepare('DELETE FROM order_receipt_items');
const itemResult = deleteItems.run();
console.log('✓ 受注明細を削除しました:', itemResult.changes, '件');

// 現金出納帳データを削除
const deleteCashBook = db.prepare('DELETE FROM cash_book');
const cashResult = deleteCashBook.run();
console.log('✓ 現金出納帳を削除しました:', cashResult.changes, '件');

db.close();
"

echo ""
echo "=========================================="
echo "  ✅ デモデータ削除完了"
echo "=========================================="
echo ""
echo "データベースがクリーンな状態になりました。"
echo ""
echo "次のステップ:"
echo "1. フロントエンドにアクセス"
echo "   URL: https://3014-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai"
echo ""
echo "2. ログイン"
echo "   ユーザー名: 麺家弍色"
echo "   パスワード: admin123"
echo ""
echo "3. 損益計算書を確認"
echo "   会計帳簿 → 損益計算書"
echo "   すべての項目が ¥0 になっているはず"
echo ""
echo "4. 新規データの登録を開始"
echo "   - 顧客管理 → 顧客一覧で顧客登録"
echo "   - 受注取引管理 → 受注取引一覧で受注登録"
echo ""
