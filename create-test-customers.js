import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'server', 'menya-nishiki-order.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

// Check existing customers
console.log('\n=== 既存の顧客 ===');
const existing = db.prepare('SELECT id, name, customer_type FROM customers').all();
console.log(existing);

// Create test customers if they don't exist
if (existing.length === 0) {
  console.log('\n=== テスト顧客を作成 ===');
  
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, customer_type, address, phone, email, payment_terms)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const customer1 = insertCustomer.run('テスト株式会社', 'corporate', '東京都千代田区千代田1-1', '03-1234-5678', 'test@example.com', 30);
  console.log('✅ 顧客1 作成:', customer1.lastInsertRowid);
  
  const customer2 = insertCustomer.run('山田太郎', 'individual', '東京都新宿区新宿2-2', '03-9876-5432', 'yamada@example.com', 30);
  console.log('✅ 顧客2 作成:', customer2.lastInsertRowid);
  
  console.log('\n=== 作成後の顧客一覧 ===');
  const customers = db.prepare('SELECT id, name, customer_type FROM customers').all();
  console.log(customers);
}

db.close();
