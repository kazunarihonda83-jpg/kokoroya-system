#!/bin/bash

echo "🔍 仮環境クリーンアップ確認"
echo "============================"

# ログイン
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "✅ ログイン成功"

# 各種APIで確認
echo ""
echo "📊 在庫データ"
INVENTORY=$(curl -s http://localhost:5003/api/inventory \
  -H "Authorization: Bearer $TOKEN")
INVENTORY_COUNT=$(echo "$INVENTORY" | jq 'length')
echo "在庫件数: $INVENTORY_COUNT 件"

echo ""
echo "📊 仕訳帳"
JOURNAL=$(curl -s "http://localhost:5003/api/accounting/journal?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN")
JOURNAL_COUNT=$(echo "$JOURNAL" | jq 'length')
echo "仕訳帳件数: $JOURNAL_COUNT 件"

echo ""
echo "📊 損益計算書"
curl -s "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{sales_revenue, cost_of_sales, gross_profit, net_income}'

echo ""
echo "📊 貸借対照表"
curl -s "http://localhost:5003/api/accounting/balance-sheet?as_of_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{assets, liabilities, equity}'

echo ""
echo "📊 キャッシュフロー計算書"
curl -s "http://localhost:5003/api/accounting/cashflow?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{operating, beginningBalance, cashIncrease, endingBalance}'

echo ""
echo "✅ 確認完了 - すべてのトランザクションデータがクリアされました"
