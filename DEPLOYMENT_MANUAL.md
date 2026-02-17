# 麺家弍色システム - Render & Vercel デプロイマニュアル

## 📅 作成日: 2026-02-13

## 🎯 デプロイ概要

- **フロントエンド**: Vercel (React + Vite)
- **バックエンド**: Render (Node.js + Express + SQLite)
- **リポジトリ**: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud.git
- **最新コミット**: 2a0b661

---

## 📋 前提条件チェックリスト

- [ ] GitHubアカウントが利用可能
- [ ] Renderアカウントを作成済み (https://render.com)
- [ ] Vercelアカウントを作成済み (https://vercel.com)
- [ ] 最新コードがGitHubにプッシュ済み ✅
- [ ] リポジトリがpublicまたはRender/Vercelに連携済み

---

## 🚀 デプロイ手順

## STEP 1: Render でバックエンドをデプロイ

### 1.1 Renderにログイン
1. https://render.com にアクセス
2. 「Sign In」をクリック
3. GitHubアカウントで認証

### 1.2 新しいWebサービスを作成
1. ダッシュボードで「New +」→「Web Service」をクリック
2. 「Connect GitHub repository」を選択
3. リポジトリを検索: `menya-nishiki-system-cloud`
4. 「Connect」をクリック

### 1.3 サービス設定

| 項目 | 設定値 |
|------|--------|
| **Name** | `menya-nishiki-backend` |
| **Region** | `Singapore` (最も近いリージョンを選択) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server/index.js` |
| **Plan** | `Starter` (無料プラン) |

### 1.4 環境変数の設定

「Environment Variables」セクションで以下を追加：

```env
NODE_ENV=production
PORT=5003
SERVE_FRONTEND=false
JWT_SECRET=your_secret_key_here_change_this_in_production
RESET_DB=false
DB_PATH=/data/menya-nishiki-order.db
```

⚠️ **重要**: `JWT_SECRET` は必ず変更してください！
推奨方法: `openssl rand -base64 32` で生成

### 1.5 永続ディスク（SQLite用）を追加

1. 「Disks」セクションで「Add Disk」をクリック
2. 設定：
   - **Name**: `sqlite-data`
   - **Mount Path**: `/data`
   - **Size**: `1 GB` (無料プラン)
3. 「Save」をクリック

### 1.6 デプロイ実行

1. 「Create Web Service」をクリック
2. デプロイログを確認（5-10分程度）
3. ログに以下が表示されることを確認：
   ```
   Server is running on port 5003
   Database connection successful
   ```

### 1.7 バックエンドURLを確認

- デプロイ完了後、画面上部に表示されるURL（例: `https://menya-nishiki-backend.onrender.com`）をメモ
- この URL はフロントエンドの環境変数で使用します

### 1.8 動作確認

ターミナルで以下のコマンドを実行：

```bash
# ヘルスチェック
curl https://menya-nishiki-backend.onrender.com/api/health

# ログインテスト
curl -X POST https://menya-nishiki-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}'
```

成功すれば、トークンが返ってきます。

---

## STEP 2: Vercel でフロントエンドをデプロイ

### 2.1 Vercelにログイン
1. https://vercel.com にアクセス
2. 「Sign In」→ GitHubで認証

### 2.2 新しいプロジェクトをインポート

1. 「Add New...」→「Project」をクリック
2. GitHubリポジトリを検索: `menya-nishiki-system-cloud`
3. 「Import」をクリック

### 2.3 プロジェクト設定

| 項目 | 設定値 |
|------|--------|
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Development Command** | `npm run dev` |

### 2.4 環境変数の設定

「Environment Variables」セクションで以下を追加：

```env
VITE_API_URL=https://menya-nishiki-backend.onrender.com/api
NODE_ENV=production
```

⚠️ **重要**: `VITE_API_URL` は STEP 1.7 で取得したRenderのバックエンドURLに `/api` を付けたものです。

### 2.5 デプロイ実行

1. 「Deploy」をクリック
2. ビルドログを確認（3-5分程度）
3. ビルド成功を確認

### 2.6 フロントエンドURLを確認

- デプロイ完了後、画面に表示されるURL（例: `https://menya-nishiki.vercel.app`）を確認
- 「Visit」ボタンをクリックしてサイトにアクセス

### 2.7 動作確認

1. ブラウザでVercelのURLを開く
2. ログイン画面が表示されることを確認
3. 以下の認証情報でログイン：
   - **ユーザー名**: `麺家弍色`
   - **パスワード**: `admin123`
4. 各機能画面（受注管理、在庫管理、会計帳簿、財務諸表）が正常に表示されることを確認

---

## ✅ デプロイ完了チェックリスト

### バックエンド (Render)
- [ ] サービスが正常に起動している（ログ確認）
- [ ] `/api/health` エンドポイントが応答する
- [ ] ログインAPIが正常に動作する
- [ ] データベースファイルが `/data` に作成されている

### フロントエンド (Vercel)
- [ ] サイトが正常に表示される
- [ ] ログイン画面が表示される
- [ ] ログインが成功する
- [ ] 各機能画面が正常に動作する

### 統合テスト
- [ ] 在庫登録が成功する
- [ ] 在庫データがキャッシュフローに反映される
- [ ] 損益計算書に売上原価が表示される
- [ ] 貸借対照表が正しく表示される

---

## 🔧 トラブルシューティング

### ❌ Renderでサーバーが起動しない

**症状**: ログに "Error: Cannot find module" が表示される

**解決方法**:
```bash
# Build Command を以下に変更:
npm install

# Start Command を以下に変更:
node server/index.js
```

### ❌ Vercelでビルドエラー

**症状**: "Build failed" エラー

**解決方法**:
1. ローカルでビルド確認: `npm run build`
2. `node_modules` と `package-lock.json` を削除して再インストール
3. Vercelで「Redeploy」を実行

### ❌ CORS エラー

**症状**: フロントエンドからAPIリクエストが失敗

**解決方法**:
1. Renderの環境変数 `SERVE_FRONTEND=false` を確認
2. Vercelの環境変数 `VITE_API_URL` が正しいか確認
3. 両方のサービスを再デプロイ

### ❌ データベースがリセットされる

**症状**: デプロイのたびにデータが消える

**解決方法**:
1. Renderで永続ディスクが正しくマウントされているか確認
2. 環境変数 `RESET_DB=false` を確認
3. `DB_PATH=/data/menya-nishiki-order.db` を確認

### ❌ ログインできない

**症状**: "Invalid credentials" エラー

**解決方法**:
1. デフォルト認証情報を確認:
   - ユーザー名: `麺家弍色`
   - パスワード: `admin123`
2. データベースを初期化（RESET_DB=true で一度デプロイ、その後false に戻す）

---

## 🔄 再デプロイ手順

### コード変更後の再デプロイ

```bash
# 1. ローカルで変更をコミット
git add .
git commit -m "変更内容の説明"
git push origin main

# 2. Renderは自動デプロイされます（5-10分）
# 3. Vercelも自動デプロイされます（3-5分）
```

### 手動で再デプロイ

**Render**:
1. ダッシュボード → サービスを選択
2. 「Manual Deploy」→「Deploy latest commit」

**Vercel**:
1. プロジェクトを選択 → 「Deployments」タブ
2. 最新のデプロイの右側の「...」→「Redeploy」

---

## 📊 モニタリング

### Render
- ログ: ダッシュボード → サービス → 「Logs」タブ
- メトリクス: 「Metrics」タブでCPU・メモリ使用量を確認

### Vercel
- ログ: プロジェクト → 「Deployments」→ デプロイを選択 → 「View Function Logs」
- アナリティクス: 「Analytics」タブでアクセス状況を確認

---

## 💾 バックアップ

### データベースのバックアップ

Render SSH経由でバックアップ（有料プランのみ）:
```bash
# Renderシェルにアクセス
render shell menya-nishiki-backend

# データベースをバックアップ
cp /data/menya-nishiki-order.db /data/backup-$(date +%Y%m%d).db
```

無料プランの場合は、定期的に以下のエンドポイントからデータをエクスポート：
- `/api/inventory` - 在庫データ
- `/api/orders` - 受注データ
- `/api/accounting/journal` - 仕訳データ

---

## 🔐 セキュリティ推奨事項

1. **JWT_SECRET を変更**: デフォルトのシークレットキーは必ず変更してください
   ```bash
   openssl rand -base64 32
   ```

2. **デフォルトパスワードを変更**: 初回ログイン後、管理者パスワードを変更してください

3. **HTTPS使用**: RenderとVercelは自動的にHTTPSを有効化します

4. **環境変数の保護**: `.env` ファイルはGitにコミットしないでください（`.gitignore` に含まれています）

---

## 📞 サポート情報

- **Render ドキュメント**: https://render.com/docs
- **Vercel ドキュメント**: https://vercel.com/docs
- **GitHub リポジトリ**: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud

---

## 📝 デプロイ完了確認

| 項目 | URL | 状態 |
|------|-----|------|
| **バックエンド (Render)** | https://menya-nishiki-backend.onrender.com | ⏳ デプロイ待ち |
| **フロントエンド (Vercel)** | https://menya-nishiki.vercel.app | ⏳ デプロイ待ち |
| **GitHub リポジトリ** | https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud | ✅ 最新コミット: 2a0b661 |

---

## 🎉 次のステップ

1. ✅ Renderでバックエンドをデプロイ
2. ✅ Vercelでフロントエンドをデプロイ
3. ✅ デフォルト認証情報でログイン
4. ✅ 在庫登録テスト
5. ✅ 財務諸表確認
6. ⚠️ 管理者パスワード変更
7. ⚠️ JWT_SECRET変更

---

**デプロイ完了日**: 2026-02-13  
**バージョン**: v1.0.0  
**最終更新**: 2a0b661
