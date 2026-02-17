import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'menya-nishiki-order.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

console.log('\n=== テスト顧客を作成 ===');

const insertCustomer = db.prepare(`
  INSERT INTO customers (name, customer_type, address, phone, email, payment_terms)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const customer1 = insertCustomer.run('テスト株式会社', 'corporate', '東京都千代田区千代田1-1', '03-1234-5678', 'test@example.com', 30);
console.log('✅ 顧客1 作成: ID =', customer1.lastInsertRowid);

const customer2 = insertCustomer.run('山田太郎', 'individual', '東京都新宿区新宿2-2', '03-9876-5432', 'yamada@example.com', 30);
console.log('✅ 顧客2 作成: ID =', customer2.lastInsertRowid);

console.log('\n=== 作成後の顧客一覧 ===');
const customers = db.prepare('SELECT id, name, customer_type FROM customers ORDER BY id').all();
console.log(customers);

db.close();
