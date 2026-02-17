# 🚀 麺家弍色システム 新規本番環境デプロイ - クイックスタート

## 📍 リポジトリ情報
- **GitHub**: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud.git
- **最新コミット**: `def4a45`

---

## PART 1: Render バックエンド（5分）

### 1. サービス作成
https://render.com/dashboard → **New +** → **Web Service**

### 2. 基本設定
```
Name: menya-nishiki-production-2026
Region: Singapore
Branch: main
Build Command: npm install
Start Command: node server/index.js
Instance Type: Starter
```

### 3. 環境変数（6個）⚠️ コピペ推奨
```
NODE_ENV=production
PORT=5003
SERVE_FRONTEND=false
RESET_DB=true
DB_PATH=/data/menya-nishiki-order.db
JWT_SECRET=menya_nishiki_production_secret_2026_change_this
```

### 4. ディスク設定
```
Name: sqlite-data
Mount Path: /data
Size: 1 GB
```

### 5. デプロイ＆確認
- **Create Web Service** → ログ確認（3-5分）
- ⚠️ **重要**: デプロイ完了後、`RESET_DB=false` に変更！
- 🔗 **Render URL をメモ** → 例: `https://menya-nishiki-production-2026.onrender.com`

---

## PART 2: Vercel フロントエンド（5分）

### 1. プロジェクト作成
https://vercel.com/dashboard → **Add New...** → **Project**

### 2. リポジトリインポート
- `menya-nishiki-system-cloud` を検索 → **Import**

### 3. プロジェクト設定
```
Project Name: menya-nishiki-production-2026
Framework: Vite (自動検出)
```

### 4. 環境変数（2個）⚠️ 超重要
```
VITE_API_URL=https://【Render URL】/api
NODE_ENV=production
```
> ⚠️ `VITE_API_URL` の末尾に `/api` を必ず付けてください！

### 5. デプロイ＆確認
- **Deploy** → ビルドログ確認（3-5分）
- 🔗 **Vercel URL をメモ** → 例: `https://menya-nishiki-production-2026.vercel.app`

---

## PART 3: 在庫会計連携テスト（5分）

### 1. ログイン
- URL: Vercel URL にアクセス
- ユーザー名: `麺家弍色`
- パスワード: `admin123`

### 2. 在庫登録（現金購入モード）
**在庫管理** → **在庫登録**
```
商品名: ねぎ
カテゴリ: 野菜
現在在庫: 10
単位: 個
単価: 220
```
→ **登録**

#### ✅ 期待される結果：
- 在庫に「ねぎ 10個」が登録される
- 自動仕訳生成: 借方 商品 ¥2,200 / 貸方 現金 ¥2,200

### 3. キャッシュフロー確認
**会計** → **キャッシュフロー計算書**
```
✅ 営業支出: -¥2,200
```

### 4. 在庫出庫（売上原価計上）
**在庫管理** → **在庫一覧** → 「ねぎ」選択 → **出庫**
```
出庫数量: 3
```
→ **確定**

#### ✅ 期待される結果：
- 在庫が「7個」に減少
- 自動仕訳生成: 借方 売上原価 ¥660 / 貸方 商品 ¥660

### 5. 損益計算書確認
**会計** → **損益計算書**
```
✅ 売上原価: ¥660
```

### 6. 貸借対照表確認
**会計** → **貸借対照表**
```
✅ 商品: ¥1,540（残り7個分）
✅ 現金: -¥2,200
✅ 当期純損失: -¥660
```

---

## ✅ チェックリスト

### Render
- [ ] `RESET_DB=false` に変更済み
- [ ] ヘルスチェックAPI正常（`/api/health`）
- [ ] ログに「勘定科目追加」メッセージ確認

### Vercel
- [ ] `VITE_API_URL` に `/api` 付与確認
- [ ] ビルド成功（`dist` 生成確認）
- [ ] ログインページ表示確認

### 在庫会計連携
- [ ] 在庫登録でキャッシュフロー自動反映
- [ ] 在庫出庫で損益計算書自動反映
- [ ] 貸借対照表で資産が正しく表示

---

## 🚨 トラブルシューティング

### 問題: 在庫データが会計帳簿に反映されない
**解決策**: Renderログで「勘定科目追加」メッセージを確認。なければ `RESET_DB=true` に一時変更して再デプロイ後、`false` に戻す。

### 問題: API接続エラー
**解決策**: Vercelの `VITE_API_URL` が `https://[Render URL]/api` の形式（末尾 `/api`）であることを確認。修正後 **Redeploy**。

---

## 📚 詳細ドキュメント
完全版ガイド: `NEW_PRODUCTION_DEPLOYMENT_COMPLETE_GUIDE.md`

---

**デプロイ時間**: 約15分  
**作成日**: 2026-02-16
