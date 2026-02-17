#!/bin/bash

echo "🧪 在庫会計連携テスト"
echo "===================="

# ログイン
echo -e "\n📝 ログイン中..."
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ ログイン失敗"
  exit 1
fi
echo "✅ ログイン成功"

# 在庫一覧を取得
echo -e "\n📦 在庫データ取得..."
curl -s -X GET "http://localhost:5003/api/inventory" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | {item_name, current_stock, unit_cost}'

# 総勘定元帳（商品）を取得
echo -e "\n📖 総勘定元帳（商品）取得..."
curl -s -X GET "http://localhost:5003/api/accounting/general-ledger?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '[.[] | select(.account_name == "商品")]'

# 損益計算書を確認
echo -e "\n💰 損益計算書確認..."
curl -s -X GET "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{sales_revenue, cost_of_sales, gross_profit}'

echo -e "\n✅ テスト完了"
