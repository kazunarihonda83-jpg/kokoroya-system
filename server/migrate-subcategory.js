// Render本番環境用：勘定科目にsubcategoryを追加するマイグレーション
import Database from 'better-sqlite3';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

const dbPath = process.env.VERCEL 
  ? join(tmpdir(), 'menya-nishiki-order.db')
  : existsSync('/data')
  ? '/data/menya-nishiki-order.db'
  : join(process.cwd(), 'menya-nishiki-order.db');

console.log('📊 マイグレーション開始:', dbPath);

const db = new Database(dbPath);

try {
  // subcategoryカラムが存在するか確認
  const columns = db.prepare('PRAGMA table_info(accounts)').all();
  const hasSubcategory = columns.some(col => col.name === 'subcategory');
  
  if (!hasSubcategory) {
    console.log('✅ subcategoryカラムを追加...');
    db.prepare('ALTER TABLE accounts ADD COLUMN subcategory TEXT').run();
  } else {
    console.log('✅ subcategoryカラムは既に存在します');
  }
  
  // 既存の勘定科目にsubcategoryを設定
  const updates = [
    { code: '4000', subcategory: 'sales_revenue' },        // 売上高
    { code: '5000', subcategory: 'cost_of_sales' },       // 売上原価
    { code: '6000', subcategory: 'selling_expenses' },     // 販売費及び一般管理費
    { code: '7000', subcategory: 'selling_expenses' },     // 販売費及び一般管理費
    { code: '8000', subcategory: 'selling_expenses' },     // 販売費及び一般管理費
  ];
  
  updates.forEach(({ code, subcategory }) => {
    const result = db.prepare('UPDATE accounts SET subcategory = ? WHERE account_code = ?').run(subcategory, code);
    if (result.changes > 0) {
      console.log(`✅ ${code}のsubcategoryを${subcategory}に設定`);
    }
  });
  
  // 新しい勘定科目を追加
  const newAccounts = [
    { code: '8100', name: '受取利息', type: 'revenue', subcategory: 'non_operating_income' },
    { code: '8200', name: '受取配当金', type: 'revenue', subcategory: 'non_operating_income' },
    { code: '8300', name: '雑収入', type: 'revenue', subcategory: 'non_operating_income' },
    { code: '8400', name: '支払利息', type: 'expense', subcategory: 'non_operating_expense' },
    { code: '8500', name: '雑損失', type: 'expense', subcategory: 'non_operating_expense' },
    { code: '8600', name: '固定資産売却益', type: 'revenue', subcategory: 'extraordinary_income' },
    { code: '8700', name: '固定資産売却損', type: 'expense', subcategory: 'extraordinary_loss' },
    { code: '8800', name: '法人税等', type: 'expense', subcategory: 'corporate_tax' },
  ];
  
  newAccounts.forEach(({ code, name, type, subcategory }) => {
    try {
      const existing = db.prepare('SELECT id FROM accounts WHERE account_code = ?').get(code);
      if (!existing) {
        db.prepare('INSERT INTO accounts (account_code, account_name, account_type, subcategory, is_active) VALUES (?, ?, ?, ?, 1)')
          .run(code, name, type, subcategory);
        console.log(`✅ ${code} ${name} を追加`);
      } else {
        console.log(`- ${code} ${name} は既に存在`);
      }
    } catch (error) {
      console.log(`⚠️  ${code}の追加でエラー:`, error.message);
    }
  });
  
  console.log('\n✅ マイグレーション完了');
  
  // 確認
  const account4000 = db.prepare('SELECT * FROM accounts WHERE account_code = ?').get('4000');
  console.log('\n確認: 勘定科目4000:', account4000);
  
} catch (error) {
  console.error('❌ マイグレーションエラー:', error);
  process.exit(1);
} finally {
  db.close();
}
