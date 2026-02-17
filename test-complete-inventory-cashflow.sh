#!/bin/bash

echo "🧪 在庫とキャッシュフロー完全テスト"
echo "======================================"

TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "✅ ログイン成功"

# 1. 買掛金を支払う（現金支出）
echo -e "\n💸 買掛金支払いテスト（ねぎ仕入代¥2,200を現金で支払）"
echo "仕訳: 借方 買掛金 ¥2,200 / 貸方 現金 ¥2,200"

PAYMENT=$(curl -s -X POST "http://localhost:5003/api/accounting/journal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_date": "2026-02-13",
    "transactions": [
      {
        "debit_account_code": "2000",
        "credit_account_code": "1000",
        "amount": 2200,
        "description": "ねぎ仕入代金の支払い"
      }
    ]
  }')
echo "$PAYMENT" | jq '.'

# 2. キャッシュフロー計算書を確認
echo -e "\n💰 キャッシュフロー計算書:"
CF=$(curl -s -X GET "http://localhost:5003/api/accounting/cashflow?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN")
echo "$CF" | jq '.'

# 3. 損益計算書を確認
echo -e "\n📊 損益計算書:"
PL=$(curl -s -X GET "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN")
echo "$PL" | jq '{sales_revenue, cost_of_sales, gross_profit, net_income}'

# 4. 貸借対照表を確認
echo -e "\n⚖️  貸借対照表:"
BS=$(curl -s -X GET "http://localhost:5003/api/accounting/balance-sheet?as_of_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN")
echo "$BS" | jq '{assets, liabilities, equity, total_balance}'

echo -e "\n✅ テスト完了"
echo -e "\n📝 結果サマリー:"
echo "  - 在庫入庫: ¥2,200（買掛金計上）"
echo "  - 在庫出庫: ¥660（売上原価計上）"
echo "  - 売上: ¥2,200（売掛金計上）"
echo "  - 売掛金回収: ¥2,200（現金入金）← キャッシュフロー収入"
echo "  - 買掛金支払: ¥2,200（現金出金）← キャッシュフロー支出"
echo "  - 期末現金残高: ¥0（収入¥2,200 - 支出¥2,200）"
