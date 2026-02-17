#!/bin/bash

echo "🔍 在庫登録データの確認"
echo "===================="

# ログイン
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "✅ ログイン成功"

# 在庫データ確認
echo ""
echo "📦 在庫データ"
curl -s http://localhost:5003/api/inventory \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 在庫移動履歴確認
echo ""
echo "📋 在庫移動履歴"
node << 'NODESCRIPT'
const Database = require('better-sqlite3');
const db = new Database('menya-nishiki-order.db');

const movements = db.prepare(`
  SELECT im.*, i.item_name 
  FROM inventory_movements im
  LEFT JOIN inventory i ON im.inventory_id = i.id
  ORDER BY im.performed_at DESC
`).all();

console.log(JSON.stringify(movements, null, 2));
db.close();
NODESCRIPT

# 仕訳帳確認
echo ""
echo "📊 仕訳帳（在庫関連）"
curl -s "http://localhost:5003/api/accounting/journal?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.reference_type == "inventory_movement")'

# 仕訳帳全件確認
echo ""
echo "📊 仕訳帳（全件）"
curl -s "http://localhost:5003/api/accounting/journal?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
echo "件"

# 損益計算書確認
echo ""
echo "📊 損益計算書"
curl -s "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{sales_revenue, cost_of_sales, gross_profit, net_income}'

# キャッシュフロー確認
echo ""
echo "📊 キャッシュフロー計算書"
curl -s "http://localhost:5003/api/accounting/cashflow?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '{operating, beginningBalance, endingBalance}'

echo ""
echo "✅ 確認完了"
