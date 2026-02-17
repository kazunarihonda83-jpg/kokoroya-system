import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { join } from 'path';

const dbPath = process.env.VERCEL 
  ? '/tmp/menya-nishiki-order.db'
  : existsSync('/data')
  ? '/data/menya-nishiki-order.db'
  : join(process.cwd(), 'menya-nishiki-order.db');

console.log('📂 データベースパス:', dbPath);

if (!existsSync(dbPath)) {
  console.error('❌ データベースファイルが見つかりません:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

console.log('\n=== 勘定科目のsubcategory修正 ===\n');

try {
  // 現在の状態を確認
  const accounts = db.prepare('SELECT account_code, account_name, account_type, subcategory FROM accounts').all();
  
  console.log('修正前:');
  accounts.forEach(acc => {
    if (['4000', '5100', '7100', '8100'].includes(acc.account_code)) {
      console.log(`  [${acc.account_code}] ${acc.account_name} (${acc.account_type}): subcategory=${acc.subcategory || 'NULL'}`);
    }
  });
  console.log('');
  
  // 修正マッピング
  const fixes = [
    { code: '4000', name: '売上高', subcategory: 'sales_revenue' },
    { code: '5000', name: '仕入高', subcategory: 'cost_of_sales' },
    { code: '5100', name: '売上原価', subcategory: 'cost_of_sales' },
    { code: '6000', name: '給料', subcategory: 'selling_expenses' },
    { code: '7000', name: '地代家賃', subcategory: 'selling_expenses' },
    { code: '7100', name: '雑収入', subcategory: 'non_operating_income' },
    { code: '8000', name: '水道光熱費', subcategory: 'selling_expenses' },
    { code: '8100', name: '雑損失', subcategory: 'extraordinary_loss' }
  ];
  
  // 修正実行
  console.log('修正中...');
  const updateStmt = db.prepare('UPDATE accounts SET subcategory = ? WHERE account_code = ?');
  
  fixes.forEach(fix => {
    const result = updateStmt.run(fix.subcategory, fix.code);
    if (result.changes > 0) {
      console.log(`  ✅ [${fix.code}] ${fix.name} → subcategory: ${fix.subcategory}`);
    } else {
      console.log(`  ⏭️  [${fix.code}] ${fix.name} は存在しません`);
    }
  });
  
  console.log('');
  
  // 修正後の状態を確認
  const accountsAfter = db.prepare('SELECT account_code, account_name, account_type, subcategory FROM accounts').all();
  
  console.log('修正後:');
  accountsAfter.forEach(acc => {
    if (['4000', '5100', '7100', '8100'].includes(acc.account_code)) {
      console.log(`  [${acc.account_code}] ${acc.account_name} (${acc.account_type}): subcategory=${acc.subcategory || 'NULL'}`);
    }
  });
  
  console.log('\n✅ 修正完了\n');
  
} catch (error) {
  console.error('❌ エラー:', error.message);
  process.exit(1);
} finally {
  db.close();
}
