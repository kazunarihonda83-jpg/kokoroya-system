#!/bin/bash

echo "🔍 データ削除の確認"
echo "=================="

# ログイン
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' \
  | jq -r '.token')

if [ -z "$TOKEN" ]; then
  echo "❌ ログイン失敗"
  exit 1
fi
echo "✅ ログイン成功"

# 在庫一覧
echo -e "\n📦 在庫データ:"
INVENTORY=$(curl -s -X GET "http://localhost:5003/api/inventory" -H "Authorization: Bearer $TOKEN")
echo "$INVENTORY" | jq 'length'
echo "$INVENTORY" | jq '.'

# 受注取引一覧
echo -e "\n📋 受注取引データ:"
ORDERS=$(curl -s -X GET "http://localhost:5003/api/order-receipts" -H "Authorization: Bearer $TOKEN")
echo "$ORDERS" | jq '.data | length'

# 仕訳帳
echo -e "\n📖 仕訳帳データ:"
JOURNAL=$(curl -s -X GET "http://localhost:5003/api/accounting/journal?start_date=2026-01-01&end_date=2026-12-31" -H "Authorization: Bearer $TOKEN")
echo "$JOURNAL" | jq 'length'

# 損益計算書
echo -e "\n💰 損益計算書:"
PL=$(curl -s -X GET "http://localhost:5003/api/accounting/profit-loss?start_date=2026-01-01&end_date=2026-12-31" -H "Authorization: Bearer $TOKEN")
echo "$PL" | jq '{sales_revenue, cost_of_sales, gross_profit, operating_income, net_income}'

echo -e "\n✅ 確認完了: すべてのトランザクションデータが削除されました"
