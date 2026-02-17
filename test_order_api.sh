#!/bin/bash

TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "=== 受注取引一覧API ==="
curl -s "http://localhost:5003/api/order-receipts" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 損益計算書API ==="
curl -s "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq .

