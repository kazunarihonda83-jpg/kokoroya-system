#!/bin/bash

API_URL="https://5003-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai/api"

# ログイン
echo "=== ログイン ==="
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}' | jq -r '.token')

echo "✅ ログイン成功"

# 現在の仕訳を確認
echo -e "\n=== 削除前の仕訳一覧 ==="
curl -s -X GET "$API_URL/accounting/journal" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[] | "\(.id)\t\(.entry_date)\t\(.description)\t\(.entry_source)"' | head -5

# 自動生成された仕訳を1つ削除してみる（ID=4: 千葉食材センター 仕入計上）
ENTRY_ID=4
echo -e "\n=== 仕訳 ID=$ENTRY_ID を削除 ==="
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/accounting/journal/$ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN")
echo $DELETE_RESPONSE | jq .

# 削除後の仕訳を確認
echo -e "\n=== 削除後の仕訳一覧 ==="
curl -s -X GET "$API_URL/accounting/journal" \
  -H "Authorization: Bearer $TOKEN" | jq -r 'length as $count | "総件数: \($count)件"'

curl -s -X GET "$API_URL/accounting/journal" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[] | "\(.id)\t\(.entry_date)\t\(.description)\t\(.entry_source)"' | head -10

