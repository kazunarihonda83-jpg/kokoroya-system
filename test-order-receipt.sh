#!/bin/bash

# ログイン
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "トークン取得: $TOKEN"
echo ""

# 顧客一覧を確認
echo "=== 顧客一覧 ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5003/api/customers" | python3 -m json.tool | head -30
echo ""

# 受注取引を登録（顧客ID=1として）
echo "=== 受注取引を登録 ==="
RESPONSE=$(curl -s -X POST http://localhost:5003/api/order-receipts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "order_date": "2026-02-12",
    "delivery_date": "2026-02-15",
    "status": "pending",
    "payment_status": "paid",
    "payment_date": "2026-02-12",
    "notes": "テスト受注",
    "items": [
      {
        "item_name": "ラーメン（醤油）",
        "description": "定番の醤油ラーメン",
        "quantity": 10,
        "unit_price": 800
      },
      {
        "item_name": "餃子セット",
        "description": "焼き餃子6個入り",
        "quantity": 5,
        "unit_price": 300
      }
    ]
  }')

echo "$RESPONSE" | python3 -m json.tool
echo ""

# 登録後のデータを確認
echo "=== 登録後の受注取引 ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5003/api/order-receipts" | python3 -m json.tool | head -50
echo ""

# 仕訳データを確認
echo "=== 仕訳データ（売上高） ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5003/api/accounting/journal?start_date=2026-02-01&end_date=2026-02-28" | python3 -m json.tool | grep -A 10 "売上"
echo ""

# 損益計算書を確認
echo "=== 損益計算書 ==="
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" | python3 -m json.tool
