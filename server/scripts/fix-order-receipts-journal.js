import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { join } from 'path';

// データベースパスを取得
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
db.pragma('foreign_keys = ON');

console.log('\n=== 受注取引の仕訳修正スクリプト ===\n');

try {
  // 勘定科目を取得
  const cashAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1000'").get(); // 現金
  const receivableAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '1100'").get(); // 売掛金
  const revenueAccount = db.prepare("SELECT id FROM accounts WHERE account_code = '4000'").get(); // 売上高

  if (!cashAccount || !receivableAccount || !revenueAccount) {
    console.error('❌ 必要な勘定科目が見つかりません');
    console.log('現金(1000):', cashAccount?.id || '未登録');
    console.log('売掛金(1100):', receivableAccount?.id || '未登録');
    console.log('売上高(4000):', revenueAccount?.id || '未登録');
    process.exit(1);
  }

  console.log('✅ 勘定科目確認完了');
  console.log(`  - 現金(1000): ID ${cashAccount.id}`);
  console.log(`  - 売掛金(1100): ID ${receivableAccount.id}`);
  console.log(`  - 売上高(4000): ID ${revenueAccount.id}`);
  console.log('');

  // 全受注取引を取得
  const orderReceipts = db.prepare(`
    SELECT 
      ore.*,
      c.name as customer_name
    FROM order_receipts ore
    LEFT JOIN customers c ON ore.customer_id = c.id
    ORDER BY ore.order_date ASC
  `).all();

  console.log(`📋 受注取引: ${orderReceipts.length}件\n`);

  if (orderReceipts.length === 0) {
    console.log('⚠️ 受注取引が登録されていません');
    process.exit(0);
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const receipt of orderReceipts) {
    console.log(`処理中: ${receipt.receipt_number} (${receipt.customer_name}) - ¥${receipt.total_amount.toLocaleString()}`);

    // 既存の仕訳を確認
    const existingJournal = db.prepare(`
      SELECT COUNT(*) as count FROM journal_entries 
      WHERE reference_type = 'order_receipt' AND reference_id = ?
    `).get(receipt.id);

    if (existingJournal.count > 0) {
      console.log(`  ⏭️  既に仕訳が存在します（${existingJournal.count}件）\n`);
      skippedCount++;
      continue;
    }

    // 支払状況に応じて仕訳を作成
    if (receipt.payment_status === 'paid') {
      // 支払済み: 借方:現金 / 貸方:売上高
      const effectivePaymentDate = receipt.payment_date || receipt.order_date;
      
      db.prepare(`
        INSERT INTO journal_entries (
          entry_date, description, debit_account_id, credit_account_id, 
          amount, reference_type, reference_id, admin_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        effectivePaymentDate,
        `${receipt.customer_name} 現金売上 (${receipt.receipt_number})`,
        cashAccount.id,
        revenueAccount.id,
        receipt.total_amount,
        'order_receipt',
        receipt.id,
        1
      );

      console.log(`  ✅ 仕訳作成: 現金売上 (${effectivePaymentDate})`);

      // 現金出納帳に追加
      const currentBalance = db.prepare(
        'SELECT balance FROM cash_book ORDER BY transaction_date DESC, created_at DESC LIMIT 1'
      ).get();
      const newBalance = (currentBalance?.balance || 0) + receipt.total_amount;

      db.prepare(`
        INSERT INTO cash_book (
          transaction_date, transaction_type, category, description, 
          amount, balance, reference_type, reference_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        effectivePaymentDate,
        'income',
        '売上',
        `受注取引: ${receipt.receipt_number}`,
        receipt.total_amount,
        newBalance,
        'order_receipt',
        receipt.id,
        1
      );

      console.log(`  ✅ 現金出納帳登録: 残高 ¥${newBalance.toLocaleString()}`);

    } else {
      // 未払い: 借方:売掛金 / 貸方:売上高
      db.prepare(`
        INSERT INTO journal_entries (
          entry_date, description, debit_account_id, credit_account_id, 
          amount, reference_type, reference_id, admin_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        receipt.order_date,
        `${receipt.customer_name} 売掛金計上 (${receipt.receipt_number})`,
        receivableAccount.id,
        revenueAccount.id,
        receipt.total_amount,
        'order_receipt',
        receipt.id,
        1
      );

      console.log(`  ✅ 仕訳作成: 売掛金計上 (${receipt.order_date})`);
    }

    createdCount++;
    console.log('');
  }

  console.log('=== 処理完了 ===\n');
  console.log(`✅ 仕訳作成: ${createdCount}件`);
  console.log(`⏭️  スキップ: ${skippedCount}件`);
  console.log(`📊 合計: ${orderReceipts.length}件\n`);

  // 最終確認
  const totalJournals = db.prepare(`
    SELECT COUNT(*) as count FROM journal_entries 
    WHERE reference_type = 'order_receipt'
  `).get();
  
  console.log(`📝 受注取引関連の仕訳総数: ${totalJournals.count}件\n`);

} catch (error) {
  console.error('❌ エラーが発生しました:', error.message);
  process.exit(1);
} finally {
  db.close();
}
