#!/bin/bash

echo "🧪 買掛金支払いテスト"
echo "===================="

# ログイン
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "✅ ログイン成功"

# 買掛金支払い（現金で買掛金を支払う）
# 借方: 買掛金（負債減少） ¥2,200
# 貸方: 現金（資産減少） ¥2,200
echo ""
echo "💰 買掛金支払い登録（ねぎ購入分）"
PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:5003/api/accounting/journal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "entry_date": "2026-02-13",
    "description": "買掛金支払い（ねぎ購入分）",
    "debit_account_id": 3,
    "credit_account_id": 1,
    "amount": 2200,
    "notes": "在庫仕入れ分の支払い"
  }')

echo "$PAYMENT_RESPONSE" | jq .

# キャッシュフロー確認
echo ""
echo "📊 キャッシュフロー計算書"
curl -s "http://localhost:5003/api/accounting/cashflow?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 貸借対照表確認
echo ""
echo "📊 貸借対照表"
curl -s "http://localhost:5003/api/accounting/balance-sheet?as_of_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{assets: .assets, liabilities: .liabilities, equity: .equity}'

# 損益計算書確認
echo ""
echo "📊 損益計算書"
curl -s "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{sales_revenue, cost_of_sales, gross_profit, net_income}'

echo ""
echo "✅ テスト完了"
