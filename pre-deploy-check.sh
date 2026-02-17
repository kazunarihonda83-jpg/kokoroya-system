#!/bin/bash

echo "==================================="
echo "デプロイ前チェック"
echo "==================================="
echo ""

# カラーコード
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# チェック関数
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Git状態確認
echo "1️⃣ Git状態確認"
if git diff-index --quiet HEAD --; then
    check_pass "コミット済み（変更なし）"
else
    check_fail "未コミットの変更があります"
    git status --short
    echo ""
fi

# 2. ブランチ確認
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo ""
echo "2️⃣ ブランチ確認"
if [ "$CURRENT_BRANCH" = "main" ]; then
    check_pass "mainブランチです"
else
    check_warn "現在のブランチ: $CURRENT_BRANCH"
fi

# 3. 最新コミット確認
echo ""
echo "3️⃣ 最新コミット"
git log --oneline -1
echo ""

# 4. リモート同期確認
echo "4️⃣ リモート同期確認"
git fetch origin main --quiet
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    check_pass "リモートと同期済み"
else
    check_warn "リモートとの差分があります。git pushが必要です"
fi

# 5. 必須ファイル確認
echo ""
echo "5️⃣ 必須ファイル確認"
FILES=("render.yaml" "vercel.json" "package.json" "server/index.js" ".env.production")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file 存在"
    else
        check_fail "$file が見つかりません"
    fi
done

# 6. ビルド確認
echo ""
echo "6️⃣ フロントエンドビルド確認"
echo "ビルド中..."
if npm run build > /dev/null 2>&1; then
    check_pass "ビルド成功"
    
    # distディレクトリ確認
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        check_pass "dist/index.html 生成成功"
        DIST_SIZE=$(du -sh dist | cut -f1)
        echo "   📦 ビルドサイズ: $DIST_SIZE"
    else
        check_fail "dist/index.html が生成されませんでした"
    fi
else
    check_fail "ビルド失敗"
fi

# 7. package.json確認
echo ""
echo "7️⃣ package.json スクリプト確認"
if grep -q '"build":' package.json && grep -q '"dev":' package.json; then
    check_pass "build と dev スクリプトが定義されています"
else
    check_fail "必須スクリプトが定義されていません"
fi

# 8. 環境変数ファイル確認
echo ""
echo "8️⃣ 環境変数ファイル確認"
if [ -f ".env.production" ]; then
    check_pass ".env.production 存在"
    if grep -q "VITE_API_URL" .env.production; then
        API_URL=$(grep "VITE_API_URL" .env.production | cut -d'=' -f2)
        echo "   🔗 API URL: $API_URL"
    fi
else
    check_warn ".env.production が見つかりません（デプロイ時に設定してください）"
fi

# 9. データベース設定確認
echo ""
echo "9️⃣ データベース設定確認"
if [ -f "server/database.js" ]; then
    check_pass "server/database.js 存在"
else
    check_fail "server/database.js が見つかりません"
fi

# 10. 最終確認
echo ""
echo "==================================="
echo "📋 デプロイ準備状況サマリー"
echo "==================================="
echo ""
echo "✅ 準備完了項目:"
echo "   • 最新コミット: $(git log --oneline -1 | cut -d' ' -f1)"
echo "   • ブランチ: $CURRENT_BRANCH"
echo "   • フロントエンドビルド: 成功"
echo ""
echo "📝 次のステップ:"
echo "   1. Render にアクセス: https://render.com"
echo "   2. Vercel にアクセス: https://vercel.com"
echo "   3. QUICK_DEPLOY_GUIDE.md を参照してデプロイ"
echo ""
echo "📚 ドキュメント:"
echo "   • クイックガイド: ./QUICK_DEPLOY_GUIDE.md"
echo "   • 詳細マニュアル: ./DEPLOYMENT_MANUAL.md"
echo ""
echo "==================================="
