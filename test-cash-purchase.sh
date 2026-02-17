#!/bin/bash

echo "🧪 現金購入モードテスト"
echo "===================="

# 既存データを削除
echo ""
echo "🗑️ 既存データをクリア"
node << 'NODESCRIPT'
const Database = require('better-sqlite3');
const db = new Database('menya-nishiki-order.db');

const deleteTransaction = db.transaction(() => {
  db.prepare('DELETE FROM inventory_movements').run();
  db.prepare('DELETE FROM stock_alerts').run();
  db.prepare('DELETE FROM inventory').run();
  db.prepare('DELETE FROM order_receipt_items').run();
  db.prepare('DELETE FROM order_receipts').run();
  db.prepare('DELETE FROM journal_entries').run();
  console.log('✅ データクリア完了');
});

deleteTransaction();
db.close();
NODESCRIPT

echo ""
echo "📦 新規在庫登録テスト"
echo "--------------------"

# ログイン
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "✅ ログイン成功"

# 在庫登録
echo ""
echo "在庫登録: ねぎ 10個 @ ¥220"
INVENTORY_RESPONSE=$(curl -s -X POST http://localhost:5003/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "item_name": "ねぎ",
    "category": "野菜",
    "unit": "個",
    "current_stock": 10,
    "unit_cost": 220
  }')

echo "$INVENTORY_RESPONSE" | jq '.'

# 仕訳確認
echo ""
echo "📊 生成された仕訳"
curl -s "http://localhost:5003/api/accounting/journal?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {
    entry_date,
    description,
    debit_account: .debit_account_name,
    debit_code: .debit_account_code,
    credit_account: .credit_account_name,
    credit_code: .credit_account_code,
    amount
  }'

# 貸借対照表
echo ""
echo "📊 貸借対照表"
curl -s "http://localhost:5003/api/accounting/balance-sheet?as_of_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    assets,
    liabilities,
    equity,
    assetAccounts: [.assetAccounts[] | {code, name, balance}]
  }'

# 損益計算書
echo ""
echo "📊 損益計算書"
curl -s "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    sales_revenue,
    cost_of_sales,
    gross_profit,
    net_income
  }'

# キャッシュフロー
echo ""
echo "📊 キャッシュフロー計算書"
curl -s "http://localhost:5003/api/accounting/cashflow?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    operating,
    beginningBalance,
    cashIncrease,
    endingBalance
  }'

echo ""
echo "✅ テスト完了"
