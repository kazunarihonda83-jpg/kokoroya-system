#!/bin/bash

echo "🧪 在庫フロー完全テスト"
echo "======================="

# ログイン
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' \
  | jq -r '.token')

echo "✅ ログイン成功"

# 1. 在庫出庫（売上原価計上のテスト）
echo -e "\n📤 在庫出庫テスト（ねぎ 3個を出庫）"
OUTBOUND=$(curl -s -X POST "http://localhost:5003/api/inventory/2/movement" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "movement_type": "out",
    "quantity": 3,
    "unit_cost": 220,
    "notes": "売上による出庫"
  }')
echo "$OUTBOUND" | jq '.'

# 2. 損益計算書を確認
echo -e "\n💰 損益計算書確認（売上原価が計上されているか）:"
PL=$(curl -s -X GET "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN")
echo "$PL" | jq '{sales_revenue, cost_of_sales, gross_profit, net_income}'

# 3. 仕訳帳を確認
echo -e "\n📖 仕訳帳確認（最新3件）:"
JOURNAL=$(curl -s -X GET "http://localhost:5003/api/accounting/journal?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN")
echo "$JOURNAL" | jq '[.[] | {date: .entry_date, description, debit: .debit_account_name, credit: .credit_account_name, amount}] | .[0:3]'

# 4. 在庫残高を確認
echo -e "\n📦 在庫残高確認:"
INVENTORY=$(curl -s -X GET "http://localhost:5003/api/inventory" \
  -H "Authorization: Bearer $TOKEN")
echo "$INVENTORY" | jq '[.[] | {item_name, current_stock, unit_cost, value: (.current_stock * .unit_cost)}]'

echo -e "\n✅ テスト完了"
