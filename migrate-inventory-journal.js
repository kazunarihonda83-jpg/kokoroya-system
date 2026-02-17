import Database from 'better-sqlite3';

const db = new Database('./menya-nishiki-order.db');

console.log('📦 在庫データの会計仕訳を遡及生成します...\n');

// 在庫関連の勘定科目を作成
function ensureInventoryAccounts() {
  const accounts = [
    { code: '1300', name: '商品', type: 'asset' },
    { code: '5100', name: '売上原価', type: 'expense' },
    { code: '8100', name: '雑損失', type: 'expense' },
    { code: '7100', name: '雑収入', type: 'revenue' }
  ];

  accounts.forEach(acc => {
    const exists = db.prepare('SELECT * FROM accounts WHERE account_code = ?').get(acc.code);
    if (!exists) {
      db.prepare(`
        INSERT INTO accounts (account_code, account_name, account_type)
        VALUES (?, ?, ?)
      `).run(acc.code, acc.name, acc.type);
      console.log(`✅ 勘定科目追加: [${acc.code}] ${acc.name}`);
    }
  });
}

// 在庫移動履歴から仕訳を生成
function migrateInventoryJournals() {
  const movements = db.prepare(`
    SELECT m.*, i.item_name, i.unit
    FROM inventory_movements m
    JOIN inventory i ON m.inventory_id = i.id
    ORDER BY m.performed_at
  `).all();

  console.log(`\n📊 処理対象: ${movements.length}件の在庫移動履歴\n`);

  let created = 0;
  let skipped = 0;

  movements.forEach(m => {
    // 既に仕訳が存在するかチェック
    const existingEntry = db.prepare(`
      SELECT * FROM journal_entries 
      WHERE reference_type = 'inventory_movement' AND reference_id = ?
    `).get(m.inventory_id);

    if (existingEntry) {
      console.log(`⏭️  スキップ: ${m.item_name} (既存)`);
      skipped++;
      return;
    }

    const amount = Math.abs(m.quantity) * (m.unit_cost || 0);
    const entryDate = m.performed_at.split(' ')[0];
    
    let debitAccount, creditAccount, description;
    
    if (m.movement_type === 'in' || m.movement_type === 'initial') {
      debitAccount = '1300';  // 商品（資産）
      creditAccount = '2000'; // 買掛金（負債）
      description = `在庫入庫: ${m.item_name} ${Math.abs(m.quantity)}${m.unit}`;
    } else if (m.movement_type === 'out') {
      debitAccount = '5100';  // 売上原価（費用）
      creditAccount = '1300'; // 商品（資産）
      description = `在庫出庫: ${m.item_name} ${Math.abs(m.quantity)}${m.unit}`;
    } else if (m.movement_type === 'adjustment') {
      if (m.quantity > 0) {
        debitAccount = '1300';  // 商品（資産）
        creditAccount = '7100'; // 雑収入（収益）
        description = `在庫調整（増加）: ${m.item_name} +${Math.abs(m.quantity)}${m.unit}`;
      } else {
        debitAccount = '8100';  // 雑損失（費用）
        creditAccount = '1300'; // 商品（資産）
        description = `在庫調整（減少）: ${m.item_name} -${Math.abs(m.quantity)}${m.unit}`;
      }
    }

    if (m.notes) {
      description += ` (${m.notes})`;
    }

    try {
      // 勘定科目IDを取得
      const debitAccountId = db.prepare('SELECT id FROM accounts WHERE account_code = ?').get(debitAccount)?.id;
      const creditAccountId = db.prepare('SELECT id FROM accounts WHERE account_code = ?').get(creditAccount)?.id;
      
      if (!debitAccountId || !creditAccountId) {
        console.error(`❌ エラー: 勘定科目が見つかりません (借方: ${debitAccount}, 貸方: ${creditAccount})`);
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
        'inventory_movement', m.inventory_id, m.performed_by || 1
      );

      console.log(`✅ 仕訳生成: ${description} ¥${amount.toLocaleString()}`);
      created++;
    } catch (error) {
      console.error(`❌ エラー: ${description}`, error.message);
    }
  });

  console.log(`\n📝 完了: ${created}件の仕訳を生成、${skipped}件をスキップ`);
}

// 実行
try {
  ensureInventoryAccounts();
  migrateInventoryJournals();
  console.log('\n✅ 在庫データの会計連携が完了しました！');
} catch (error) {
  console.error('❌ エラーが発生しました:', error);
} finally {
  db.close();
}
