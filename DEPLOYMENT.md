# 麺家弍色 SYSTEM CLOUD - デプロイ手順書

## 📋 概要

このドキュメントは、麺家弍色 SYSTEM CLOUDを本番環境（Render + Vercel）にデプロイする手順を説明します。

---

## 🏗️ システム構成

- **バックエンド**: Render（Node.js + SQLite）
- **フロントエンド**: Vercel（React + Vite）
- **データベース**: SQLite（永続化ディスク使用）

---

## 🚀 デプロイ手順

### 1️⃣ Renderでバックエンドをデプロイ

#### 1-1. Renderアカウントにログイン
https://dashboard.render.com/

#### 1-2. 新しいWeb Serviceを作成
1. **New +** → **Web Service** をクリック
2. GitHubリポジトリを接続
   - リポジトリ: `kazunarihonda83-jpg/nakamaru-teppanyaki-system`
   - ブランチ: `menya-nishiki-main`

#### 1-3. サービス設定

| 項目 | 設定値 |
|------|--------|
| Name | `menya-nishiki-backend` |
| Region | Singapore |
| Branch | `menya-nishiki-main` |
| Root Directory | (空欄) |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server/index.js` |
| Instance Type | Starter ($7/月) |

#### 1-4. 環境変数を設定

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5003` |
| `JWT_SECRET` | （ランダムな文字列を生成）|
| `SERVE_FRONTEND` | `false` |

**JWT_SECRETの生成方法**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 1-5. 永続化ディスクを追加

1. サービス作成後、**Settings** → **Disks** に移動
2. **Add Disk** をクリック
3. 以下を設定：
   - **Name**: `sqlite-data`
   - **Mount Path**: `/data`
   - **Size**: 1 GB
4. **Save** をクリック

#### 1-6. デプロイ開始

**Deploy** ボタンをクリックしてデプロイを開始します。

#### 1-7. バックエンドURLを確認

デプロイ完了後、以下のようなURLが発行されます：
```
https://menya-nishiki-backend.onrender.com
```

このURLをコピーしておきます（次のステップで使用）。

#### 1-8. 動作確認

ブラウザまたはcurlでAPIの動作を確認：
```bash
curl https://menya-nishiki-backend.onrender.com/api/health
```

正常なレスポンス：
```json
{"status":"ok","timestamp":"2026-02-09T..."}
```

---

### 2️⃣ Vercelでフロントエンドをデプロイ

#### 2-1. Vercelアカウントにログイン
https://vercel.com/

#### 2-2. 新しいプロジェクトを作成

1. **Add New...** → **Project** をクリック
2. GitHubリポジトリをインポート
   - リポジトリ: `kazunarihonda83-jpg/nakamaru-teppanyaki-system`
   - **Import** をクリック

#### 2-3. プロジェクト設定

| 項目 | 設定値 |
|------|--------|
| Project Name | `menya-nishiki-system-cloud` |
| Framework Preset | Vite |
| Root Directory | (空欄) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

#### 2-4. 環境変数を設定

**Environment Variables** セクションで以下を追加：

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://menya-nishiki-backend.onrender.com/api` |

**重要**: RenderのバックエンドURLの末尾に `/api` を追加してください。

Environment: **Production, Preview, Development** すべてにチェック

#### 2-5. Git Branchを設定

**Git** セクションで：
- **Production Branch**: `menya-nishiki-main`

#### 2-6. デプロイ開始

**Deploy** ボタンをクリックしてデプロイを開始します。

#### 2-7. フロントエンドURLを確認

デプロイ完了後、以下のようなURLが発行されます：
```
https://menya-nishiki-system-cloud.vercel.app
```

---

## ✅ デプロイ完了後の確認

### 1. ログインテスト

1. フロントエンドURL（Vercel）にアクセス
2. ログイン情報を入力：
   - **ユーザー名**: `麺家弍色`
   - **パスワード**: `admin123`
3. ログインが成功することを確認

### 2. 主要機能の動作確認

- ✅ ダッシュボード表示
- ✅ 顧客管理
- ✅ 受注取引一覧
- ✅ 受注取引CSV アップロード
- ✅ 会計帳簿（税額控除帳、現金出納帳、請求判明書、キャッシュフロー）
- ✅ 在庫管理
- ✅ 書類管理
- ✅ 仕入先管理
- ✅ 発注管理
- ✅ 設定（プロフィール、メール、消費税、パスワード）

### 3. データ永続化の確認

1. Renderでサービスを再起動
2. ログインしてデータが保持されていることを確認

---

## 🔧 トラブルシューティング

### ❌ ログインできない（500エラー）

**原因**: バックエンドが起動していない

**対処法**:
1. Renderダッシュボード → **Logs** でエラーを確認
2. 環境変数が正しく設定されているか確認
3. 永続化ディスクが正しくマウントされているか確認

### ❌ ログインできない（Network Error）

**原因**: フロントエンドがバックエンドに接続できない

**対処法**:
1. Vercelの環境変数 `VITE_API_URL` が正しいか確認
2. RenderのバックエンドURLの末尾に `/api` が付いているか確認
3. Vercelで再デプロイ

### ❌ データが消える

**原因**: 永続化ディスクが正しく設定されていない

**対処法**:
1. Render → **Settings** → **Disks** で永続化ディスクを確認
2. Mount Pathが `/data` になっているか確認
3. Logsで `Initializing database at: /data/menya-nishiki-order.db` を確認

---

## 📞 サポート情報

### 会社情報
- **会社名**: 麺家弍色
- **住所**: 北海道河東郡音更町大通6-6
- **電話番号**: 070-2184-0992
- **メールアドレス**: 0hp2c84c787541j@ezweb.ne.jp

### システム情報
- **システム名**: SYSTEM CLOUD
- **バージョン**: 1.0.0
- **リポジトリ**: https://github.com/kazunarihonda83-jpg/nakamaru-teppanyaki-system (menya-nishiki-mainブランチ)

---

## 📝 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-02-09 | 1.0.0 | 初回デプロイ |

---

**デプロイ完了おめでとうございます！🎉**
