# デプロイチェックリスト

## 📋 PART 1: Render バックエンドデプロイ

### 準備
- [ ] https://render.com にアクセス
- [ ] GitHubアカウントでサインイン完了

### サービス作成
- [ ] 「New +」→「Web Service」をクリック
- [ ] GitHubリポジトリ「menya-nishiki-system-cloud」を接続
- [ ] 「Connect」ボタンをクリック

### 基本設定
- [ ] Name: `menya-nishiki-backend`
- [ ] Region: `Singapore`
- [ ] Branch: `main`
- [ ] Runtime: `Node`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node server/index.js`
- [ ] Plan: `Starter`

### 環境変数（6個すべて設定）
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5003`
- [ ] `SERVE_FRONTEND` = `false`
- [ ] `RESET_DB` = `false`
- [ ] `DB_PATH` = `/data/menya-nishiki-order.db`
- [ ] `JWT_SECRET` = `menya_nishiki_jwt_secret_2026_change_in_production`

### ディスク設定
- [ ] 「Add Disk」をクリック
- [ ] Name: `sqlite-data`
- [ ] Mount Path: `/data`
- [ ] Size: `1` GB

### デプロイ実行
- [ ] 「Create Web Service」をクリック
- [ ] ログで "Server is running on port 5003" を確認
- [ ] ステータスが「Live」になることを確認
- [ ] **バックエンドURL**をメモ: ___________________________

### 動作確認
- [ ] `curl https://YOUR_URL/api/health` で JSON が返ってくる

---

## 📋 PART 2: Vercel フロントエンドデプロイ

### 準備
- [ ] https://vercel.com にアクセス
- [ ] GitHubアカウントでサインイン完了

### プロジェクト作成
- [ ] 「Add New...」→「Project」をクリック
- [ ] 「menya-nishiki-system-cloud」を検索
- [ ] 「Import」ボタンをクリック

### プロジェクト設定（自動入力を確認）
- [ ] Framework Preset: `Vite`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

### 環境変数（2個設定）
- [ ] `VITE_API_URL` = `https://【RenderのURL】/api`
  - ⚠️ Render URLの末尾に `/api` を**必ず**付ける
- [ ] `NODE_ENV` = `production`

### デプロイ実行
- [ ] 「Deploy」ボタンをクリック
- [ ] ログで "Build Completed" を確認
- [ ] 「Congratulations!」が表示される
- [ ] **フロントエンドURL**をメモ: ___________________________

### 動作確認
- [ ] ブラウザでVercel URLを開く
- [ ] ログイン画面が表示される

---

## 📋 PART 3: 統合テスト

### ログインテスト
- [ ] ユーザー名: `麺家弍色`
- [ ] パスワード: `admin123`
- [ ] ログイン成功、ダッシュボードが表示される

### 在庫登録テスト
- [ ] 「在庫管理」→「新規登録」
- [ ] 商品名: `ねぎ`, カテゴリ: `野菜`, 数量: `10`, 単価: `220`
- [ ] 保存成功

### キャッシュフロー確認
- [ ] 「会計帳簿」→「キャッシュフロー計算書」
- [ ] 営業支出: `¥2,200` が表示される

### 在庫出庫テスト
- [ ] 「在庫管理」→「ねぎ」の「出庫」
- [ ] 出庫数量: `3`
- [ ] 保存成功

### 損益計算書確認
- [ ] 「会計帳簿」→「損益計算書」
- [ ] 売上原価: `¥660` が表示される

---

## ✅ デプロイ完了

すべてのチェックボックスが完了したら、デプロイ成功です！

### 📊 デプロイ情報

| サービス | URL |
|----------|-----|
| **バックエンド** | https://______________________.onrender.com |
| **フロントエンド** | https://______________________.vercel.app |

### 🔐 認証情報

- **ユーザー名**: `麺家弍色`
- **パスワード**: `admin123`

⚠️ **重要**: 本番運用前にパスワードを変更してください！

---

**チェックリスト完了日**: ____________________  
**デプロイ担当者**: ____________________
