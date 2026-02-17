import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { existsSync, unlinkSync } from 'fs';

const dbPath = '/data/menya-nishiki-order.db';

console.log('=== データベースリセット開始 ===');

// 既存のデータベースファイルを削除
if (existsSync(dbPath)) {
  console.log('既存のデータベースを削除中...');
  unlinkSync(dbPath);
  if (existsSync(`${dbPath}-shm`)) unlinkSync(`${dbPath}-shm`);
  if (existsSync(`${dbPath}-wal`)) unlinkSync(`${dbPath}-wal`);
  console.log('削除完了');
}

// 新しいデータベースを作成
console.log('新しいデータベースを作成中...');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// administratorsテーブル作成
db.exec(`
  CREATE TABLE administrators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'admin',
    permissions TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// デフォルト管理者を作成
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO administrators (username, password, email, permissions) VALUES (?, ?, ?, ?)').run(
  '麺家弍色',
  hashedPassword,
  '0hp2c84c787541j@ezweb.ne.jp',
  'all'
);

console.log('管理者ユーザー作成完了');

// 確認
const user = db.prepare('SELECT id, username, email FROM administrators WHERE id = 1').get();
console.log('作成されたユーザー:', user);

db.close();
console.log('=== データベースリセット完了 ===');
