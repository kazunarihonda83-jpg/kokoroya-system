import Database from 'better-sqlite3';

const db = new Database('./menya-nishiki-order.db');

console.log('📝 勘定科目にsubcategoryカラムを追加します...\n');

try {
  // subcategoryカラムを追加
  console.log('1. subcategoryカラムを追加中...');
  db.prepare('ALTER TABLE accounts ADD COLUMN subcategory TEXT').run();
  console.log('✅ subcategoryカラムを追加しました\n');
  
  // 各勘定科目にsubcategoryを設定
  console.log('2. 各勘定科目にsubcategoryを設定中...\n');
  
  const updates = [
    // 収益
    { code: '4000', subcategory: 'sales_revenue', name: '売上高' },
    { code: '7100', subcategory: 'non_operating_income', name: '雑収入' },
    
    // 費用
    { code: '5000', subcategory: 'cost_of_sales', name: '仕入高' },
    { code: '5100', subcategory: 'cost_of_sales', name: '売上原価' },
    { code: '6000', subcategory: 'selling_expenses', name: '給料' },
    { code: '7000', subcategory: 'selling_expenses', name: '地代家賃' },
    { code: '8100', subcategory: 'non_operating_expense', name: '雑損失' }
  ];
  
  updates.forEach(item => {
    db.prepare('UPDATE accounts SET subcategory = ? WHERE account_code = ?')
      .run(item.subcategory, item.code);
    console.log(`  ✅ [${item.code}] ${item.name} → ${item.subcategory}`);
  });
  
  console.log('\n✅ マイグレーション完了！');
  
  // 結果確認
  console.log('\n📋 更新後の勘定科目:');
  const accounts = db.prepare(`
    SELECT account_code, account_name, account_type, subcategory 
    FROM accounts 
    WHERE subcategory IS NOT NULL
    ORDER BY account_code
  `).all();
  
  accounts.forEach(a => {
    console.log(`  [${a.account_code}] ${a.account_name} (${a.account_type}) → ${a.subcategory}`);
  });
  
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('ℹ️  subcategoryカラムは既に存在します。更新のみ実行します。\n');
    
    // 既存の場合は更新のみ実行
    const updates = [
      { code: '4000', subcategory: 'sales_revenue' },
      { code: '7100', subcategory: 'non_operating_income' },
      { code: '5000', subcategory: 'cost_of_sales' },
      { code: '5100', subcategory: 'cost_of_sales' },
      { code: '6000', subcategory: 'selling_expenses' },
      { code: '7000', subcategory: 'selling_expenses' },
      { code: '8100', subcategory: 'non_operating_expense' }
    ];
    
    updates.forEach(item => {
      db.prepare('UPDATE accounts SET subcategory = ? WHERE account_code = ?')
        .run(item.subcategory, item.code);
    });
    
    console.log('✅ subcategory更新完了！');
  } else {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

db.close();
