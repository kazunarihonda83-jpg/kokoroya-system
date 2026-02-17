#!/bin/bash

# ログイン
TOKEN=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "Token: ${TOKEN:0:20}..."
echo ""

# 損益計算書API
echo "=== Profit-Loss API (2026-02-01 ~ 2026-02-28) ==="
curl -s "http://localhost:5003/api/accounting/profit-loss?start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq .

