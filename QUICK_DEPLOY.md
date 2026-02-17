# 🚀 クイックデプロイガイド

## 📋 事前準備

### 必要なアカウント
- ✅ GitHub: https://github.com/kazunarihonda83-jpg
- ✅ Render: https://dashboard.render.com/
- ✅ Vercel: https://vercel.com/

### リポジトリ情報
- **リポジトリ**: https://github.com/kazunarihonda83-jpg/nakamaru-teppanyaki-system
- **ブランチ**: `menya-nishiki-main`

---

## 🔧 Step 1: Render（バックエンド）

### 1-1. 新規Web Service作成
https://dashboard.render.com/ → **New +** → **Web Service**

### 1-2. 基本設定
```
Name: menya-nishiki-backend
Region: Singapore
Branch: menya-nishiki-main
Runtime: Node
Build Command: npm install
Start Command: node server/index.js
Instance Type: Starter ($7/月)
```

### 1-3. 環境変数
```
NODE_ENV = production
PORT = 5003
JWT_SECRET = （下記コマンドで生成）
SERVE_FRONTEND = false
```

**JWT_SECRET生成コマンド**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1-4. 永続化ディスク追加
Settings → Disks → Add Disk
```
Name: sqlite-data
Mount Path: /data
Size: 1 GB
```

### 1-5. デプロイ完了後
バックエンドURLをコピー（例: `https://menya-nishiki-backend.onrender.com`）

---

## 🎨 Step 2: Vercel（フロントエンド）

### 2-1. 新規プロジェクト作成
https://vercel.com/ → **Add New...** → **Project**

### 2-2. リポジトリ選択
```
Repository: kazunarihonda83-jpg/nakamaru-teppanyaki-system
Import → Project Settings
```

### 2-3. 基本設定
```
Project Name: menya-nishiki-system-cloud
Framework Preset: Vite
Root Directory: (空欄)
Build Command: npm run build
Output Directory: dist
```

### 2-4. 環境変数
```
VITE_API_URL = https://menya-nishiki-backend.onrender.com/api
```
⚠️ **重要**: 末尾に `/api` を忘れずに！

Environment: **Production, Preview, Development** すべてチェック

### 2-5. Git Branch設定
```
Production Branch: menya-nishiki-main
```

### 2-6. デプロイ開始
**Deploy** ボタンをクリック

---

## ✅ 動作確認

### フロントエンドURLにアクセス
例: `https://menya-nishiki-system-cloud.vercel.app`

### ログイン
- **ユーザー名**: 麺家弍色
- **パスワード**: admin123

### 確認項目
- ✅ ログイン成功
- ✅ ダッシュボード表示
- ✅ 顧客管理
- ✅ 受注取引一覧
- ✅ 会計帳簿
- ✅ 設定ページ

---

## ❌ トラブルシューティング

### ログインできない（500エラー）
→ Render Logsでエラー確認
→ 環境変数確認
→ 永続化ディスク確認

### Network Error
→ Vercelの `VITE_API_URL` 確認
→ 末尾に `/api` があるか確認
→ Vercel再デプロイ

---

## 📞 サポート

詳細な手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

**デプロイ完了おめでとうございます！🎉**
