# 🍖 鉄板焼き居酒屋なかまる 受注管理システム デプロイガイド

## 📋 システム情報

**会社情報:**
- 店名: 鉄板焼き居酒屋なかまる
- 住所: 〒252-0241 神奈川県相模原市中央区横山台2-9-8コーポ栗山103
- TEL: 042-704-9657
- Email: takui.n@icloud.com
- 食べログ: https://tabelog.com/kanagawa/A1407/A140701/14058526/

**ログイン情報:**
- ユーザー名: `鉄板焼き居酒屋なかまる`
- パスワード: `admin123`

**ポート設定:**
- バックエンド: 5001
- フロントエンド: 3002

---

## 🚀 デプロイ手順

### ステップ 1: GitHubリポジトリ作成

1. **GitHub にアクセス**
   - https://github.com にログイン

2. **新規リポジトリ作成**
   - 右上の「+」→「New repository」をクリック
   - Repository name: `nakamaru-teppanyaki-system`
   - Description: `鉄板焼き居酒屋なかまる 受注管理システム`
   - Public または Private を選択
   - ✅ 「Create repository」をクリック

3. **ローカルからプッシュ**
   ```bash
   cd /home/user/webapp/nakamaru-order-management-system
   git remote set-url origin https://github.com/YOUR_USERNAME/nakamaru-teppanyaki-system.git
   git push -u origin main
   ```

---

### ステップ 2: Render でバックエンドをデプロイ

#### 2.1 Renderアカウント作成・ログイン
1. https://render.com にアクセス
2. GitHubアカウントで連携ログイン

#### 2.2 新規Web Service作成
1. ダッシュボードから「New +」→「Web Service」を選択
2. GitHubリポジトリを接続
3. `nakamaru-teppanyaki-system` を選択

#### 2.3 設定入力

| 項目 | 設定値 |
|------|--------|
| **Name** | `nakamaru-backend` |
| **Region** | Singapore (または近いリージョン) |
| **Branch** | `main` |
| **Root Directory** | (空欄のまま) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | `Free` |

#### 2.4 環境変数設定

「Environment」タブで以下を追加:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5001` |
| `JWT_SECRET` | (ランダムな文字列、例: `nakamaru-secret-key-2026`) |

#### 2.5 デプロイ開始
- 「Create Web Service」をクリック
- 5-10分待つとデプロイ完了
- URLをメモ: `https://nakamaru-backend.onrender.com`

---

### ステップ 3: Vercel でフロントエンドをデプロイ

#### 3.1 Vercelアカウント作成・ログイン
1. https://vercel.com にアクセス
2. GitHubアカウントで連携ログイン

#### 3.2 新規プロジェクト作成
1. 「Add New...」→「Project」を選択
2. GitHubリポジトリをインポート
3. `nakamaru-teppanyaki-system` を選択

#### 3.3 設定入力

| 項目 | 設定値 |
|------|--------|
| **Project Name** | `nakamaru-system` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `.` (そのまま) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

#### 3.4 環境変数設定

「Environment Variables」で以下を追加:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://nakamaru-backend.onrender.com/api` |

> ⚠️ **重要**: `https://nakamaru-backend.onrender.com` の部分は、ステップ2でメモしたRenderのURLに置き換えてください。

#### 3.5 デプロイ開始
- 「Deploy」をクリック
- 2-3分待つとデプロイ完了
- URLが表示される: `https://nakamaru-system.vercel.app`

---

## ✅ デプロイ完了後の確認

### 1. バックエンドの動作確認
```bash
curl https://nakamaru-backend.onrender.com/api/health
```
期待される応答:
```json
{"status":"ok","timestamp":"2026-01-22T..."}
```

### 2. フロントエンドアクセス
1. ブラウザで `https://nakamaru-system.vercel.app` を開く
2. ログイン画面が表示される

### 3. ログインテスト
- **ユーザー名**: `鉄板焼き居酒屋なかまる`
- **パスワード**: `admin123`

---

## 🔧 トラブルシューティング

### バックエンドが起動しない場合
1. Renderのログを確認
2. `PORT` 環境変数が `5001` に設定されているか確認
3. `node server/index.js` コマンドが正しいか確認

### フロントエンドからAPIに接続できない場合
1. `VITE_API_URL` が正しいRender URLになっているか確認
2. RenderのURLの末尾に `/api` が付いているか確認
3. ブラウザのコンソールでエラーを確認

### ログインできない場合
1. データベースが正しく初期化されているか確認
2. Renderのログで「デフォルト管理者作成」メッセージを確認
3. ユーザー名を完全にコピー&ペースト

---

## 📦 システム機能

### 主要機能
- ✅ 書類管理（見積書、発注書、納品書、請求書）
- ✅ 発注管理機能
- ✅ 在庫管理機能
- ✅ 会計機能（仕訳、会計帳簿）
- ✅ 顧客管理
- ✅ 仕入先管理
- ✅ ダッシュボード（売上・在庫・支出分析）
- ✅ PDF出力・プレビュー機能
- ✅ 有効期限フィールド

### 書類フォーマット
1. **御見積書** (青色 #1890ff)
2. **発注書** (紫色 #722ed1)
3. **納品書** (青緑 #13c2c2)
4. **御請求書** (緑色 #52c41a)

---

## 📝 TSUDOI システムとの独立性

### 完全独立デプロイ
- ✅ 別のGitHubリポジトリ
- ✅ 別のRenderサービス（ポート 5001）
- ✅ 別のVercelプロジェクト
- ✅ 独立したデータベース
- ✅ なかまる専用の会社情報

### TSUDOI システムへの影響
- ❌ 影響なし（完全に独立）
- TSUDOI: `tsudoi-order-management-system`
- なかまる: `nakamaru-order-management-system`

---

## 📞 サポート

デプロイに関する質問や問題がある場合は、このガイドを参照してください。

---

## 🎉 デプロイが完成したら

1. ログイン: `https://nakamaru-system.vercel.app`
2. ユーザー名: `鉄板焼き居酒屋なかまる`
3. パスワード: `admin123`
4. ダッシュボードから各機能を確認
5. 書類作成→PDF出力をテスト

**おめでとうございます！🎊 なかまるの受注管理システムが本番稼働しました！**
