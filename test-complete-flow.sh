#!/bin/bash

echo "🧪 完全フローテスト（現金購入モード）"
echo "===================================="

TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "✅ ログイン成功"

# ステップ1: 在庫登録（現金購入）
echo ""
echo "📦 ステップ1: 在庫登録（ねぎ 10個 @ ¥220）"
INVENTORY_RESPONSE=$(curl -s -X POST http://localhost:5003/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"item_name":"ねぎ","category":"野菜","unit":"個","current_stock":10,"unit_cost":220}')

INVENTORY_ID=$(echo "$INVENTORY_RESPONSE" | jq -r '.id')
echo "在庫ID: $INVENTORY_ID"

# ステップ2: 在庫出庫
echo ""
echo "📤 ステップ2: 在庫出庫（3個使用）"
curl -s -X POST "http://localhost:5003/api/inventory/$INVENTORY_ID/movement" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"movement_type":"out","quantity":3,"notes":"ラーメン作成に使用"}' | jq '.'

# ステップ3: 売上計上
echo ""
echo "💰 ステップ3: 売上計上（ラーメン販売 ¥1,000）"
curl -s -X POST http://localhost:5003/api/order-receipts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_id": 1,
    "order_date": "2026-02-13",
    "items": [{"product_name":"ラーメン","quantity":1,"unit_price":1000}],
    "tax_rate": 10
  }' | jq '.'

# ステップ4: 現金売上（売掛金回収）
echo ""
echo "💵 ステップ4: 現金回収（¥1,100）"
CASH_ACCOUNT_ID=1
RECEIVABLE_ACCOUNT_ID=2
curl -s -X POST http://localhost:5003/api/accounting/journal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"entry_date\": \"2026-02-13\",
    \"description\": \"現金売上回収\",
    \"debit_account_id\": $CASH_ACCOUNT_ID,
    \"credit_account_id\": $RECEIVABLE_ACCOUNT_ID,
    \"amount\": 1100
  }" | jq '.'

# 最終レポート
echo ""
echo "======================================"
echo "📊 最終レポート"
echo "======================================"

echo ""
echo "📋 在庫状況"
curl -s http://localhost:5003/api/inventory \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {item_name, current_stock, unit_cost, total_value: (.current_stock * .unit_cost)}'

echo ""
echo "📊 損益計算書"
curl -s "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    売上高: .sales_revenue,
    売上原価: .cost_of_sales,
    粗利益: .gross_profit,
    当期純利益: .net_income
  }'

echo ""
echo "📊 キャッシュフロー計算書"
curl -s "http://localhost:5003/api/accounting/cashflow?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    営業収入: .operating.revenue,
    営業支出: .operating.expenses,
    営業CF純額: .operating.net,
    期首現金残高: .beginningBalance,
    現金増減: .cashIncrease,
    期末現金残高: .endingBalance
  }'

echo ""
echo "📊 貸借対照表"
curl -s "http://localhost:5003/api/accounting/balance-sheet?as_of_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    総資産: .assets,
    総負債: .liabilities,
    純資産: .equity,
    資産明細: [.assetAccounts[] | {科目: .name, 残高: .balance}]
  }'

echo ""
echo "✅ 完全フローテスト完了"
