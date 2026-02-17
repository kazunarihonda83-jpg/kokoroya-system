import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'menya-nishiki-order.db');
const db = new Database(dbPath);

console.log('=== テストデータをクリア ===');

// 受注取引と関連データを削除
db.prepare('DELETE FROM order_receipt_items').run();
db.prepare('DELETE FROM order_receipts').run();
db.prepare('DELETE FROM journal_entries').run();
db.prepare('DELETE FROM cash_book').run();

console.log('✅ 受注取引データをクリア');
console.log('✅ 仕訳帳をクリア');
console.log('✅ 現金出納帳をクリア');

db.close();
