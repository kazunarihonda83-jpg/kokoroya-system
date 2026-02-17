# 麺家弍色システム デプロイメントガイド

## 概要

このシステムは以下の構成でデプロイします：
- **フロントエンド**: Vercel
- **バックエンド**: Render

## アーキテクチャ

```
[ユーザー]
    ↓
[Vercel] (フロントエンド - React/Vite)
    ↓ API呼び出し
[Render] (バックエンド - Node.js/Express + SQLite)
```

## 1. Render（バックエンド）のデプロイ

### 前提条件
- Renderアカウント: https://render.com
- GitHubリポジトリへのアクセス

### デプロイ手順

#### Step 1: Renderにログイン
1. https://dashboard.render.com にアクセス
2. GitHubアカウントでログイン

#### Step 2: 新しいWebサービスを作成
1. ダッシュボードで「New +」→「Web Service」をクリック
2. GitHubリポジトリを接続
   - リポジトリ: `kazunarihonda83-jpg/menya-nishiki-system-cloud`
   - ブランチ: `main`（または `genspark_ai_developer`をマージ後）

#### Step 3: サービス設定
以下の設定を入力：

| 項目 | 値 |
|------|-----|
| Name | `menya-nishiki-backend` |
| Region | `Singapore` |
| Branch | `main` |
| Root Directory | (空白) |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `node server/index.js` |
| Plan | `Starter` (無料) |

#### Step 4: 環境変数を設定
「Environment」タブで以下を追加：

```
NODE_ENV=production
PORT=5003
JWT_SECRET=[自動生成または任意の文字列]
SERVE_FRONTEND=false
```

**JWT_SECRETの生成**（オプション）：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 5: ディスク（永続ストレージ）を追加
1. 「Disks」タブに移動
2. 「Add Disk」をクリック
3. 設定：
   - Name: `sqlite-data`
   - Mount Path: `/data`
   - Size: `1 GB`

#### Step 6: デプロイ実行
1. 「Create Web Service」をクリック
2. デプロイが開始されます（約3-5分）
3. デプロイ完了後、URLが表示されます
   - 例: `https://menya-nishiki-backend.onrender.com`

#### Step 7: データベース初期化（初回のみ）
デプロイ完了後、Render Shellでマイグレーションを実行：

1. ダッシュボード → サービス → 「Shell」タブ
2. 以下のコマンドを実行：
```bash
npm run migrate
```

#### Step 8: 動作確認
ブラウザまたはcurlで確認：
```bash
curl https://menya-nishiki-backend.onrender.com/api/health
```

期待されるレスポンス：
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T..."
}
```

### Render設定ファイル（既存）
`render.yaml` が既に存在します：
```yaml
services:
  - type: web
    name: menya-nishiki-backend
    env: node
    region: singapore
    plan: starter
    branch: menya-nishiki-main
    buildCommand: npm install
    startCommand: node server/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5003
      - key: JWT_SECRET
        generateValue: true
      - key: SERVE_FRONTEND
        value: false
    disk:
      name: sqlite-data
      mountPath: /data
      sizeGB: 1
```

**注意**: `branch: menya-nishiki-main` を `main` に変更する必要があります。

---

## 2. Vercel（フロントエンド）のデプロイ

### 前提条件
- Vercelアカウント: https://vercel.com
- GitHubリポジトリへのアクセス

### デプロイ手順

#### Step 1: Vercelにログイン
1. https://vercel.com/login にアクセス
2. GitHubアカウントでログイン

#### Step 2: 新しいプロジェクトをインポート
1. ダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリを選択
   - リポジトリ: `kazunarihonda83-jpg/menya-nishiki-system-cloud`
3. 「Import」をクリック

#### Step 3: プロジェクト設定
以下の設定を入力：

| 項目 | 値 |
|------|-----|
| Project Name | `menya-nishiki-frontend` |
| Framework Preset | `Vite` |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

#### Step 4: 環境変数を設定
「Environment Variables」セクションで以下を追加：

```
VITE_API_URL=https://menya-nishiki-backend.onrender.com/api
```

**重要**: `menya-nishiki-backend.onrender.com` を実際のRender URLに置き換えてください。

#### Step 5: デプロイ実行
1. 「Deploy」をクリック
2. デプロイが開始されます（約2-3分）
3. デプロイ完了後、URLが表示されます
   - 例: `https://menya-nishiki-frontend.vercel.app`

#### Step 6: 動作確認
1. フロントエンドURLにアクセス
2. ログイン画面が表示される
3. ログイン情報でログイン：
   - ユーザー名: `麺家弍色`
   - パスワード: `admin123`

### Vercel設定ファイル（既存）
`vercel.json` が既に存在します：
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 3. 環境変数の更新

### .env.production を更新
フロントエンドの本番環境変数を更新します：

```bash
# .env.production
VITE_API_URL=https://menya-nishiki-backend.onrender.com/api
```

**Renderのバックエンドデプロイ後、実際のURLに置き換えてください。**

---

## 4. デプロイ前のチェックリスト

### コード準備
- [x] すべての変更をコミット
- [x] `genspark_ai_developer` ブランチを `main` にマージ
- [ ] `.env.production` に正しいRender URLを設定
- [ ] `render.yaml` の `branch` を `main` に更新
- [ ] GitHubにプッシュ

### 設定確認
- [ ] Renderアカウント作成済み
- [ ] Vercelアカウント作成済み
- [ ] GitHubリポジトリが最新

---

## 5. デプロイ後の確認項目

### バックエンド（Render）
1. ヘルスチェック
   ```bash
   curl https://menya-nishiki-backend.onrender.com/api/health
   ```
2. ログインAPI
   ```bash
   curl -X POST https://menya-nishiki-backend.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"麺家弍色","password":"admin123"}'
   ```
3. 勘定科目API
   ```bash
   curl https://menya-nishiki-backend.onrender.com/api/accounts \
     -H "Authorization: Bearer [TOKEN]"
   ```

### フロントエンド（Vercel）
1. ホーム画面が表示される
2. ログインが成功する
3. 各メニューが正常に動作する
4. APIエラーが発生しない（開発者ツールで確認）

---

## 6. トラブルシューティング

### 問題: Renderデプロイが失敗する

**原因**: `better-sqlite3` のネイティブビルドエラー

**解決策**:
1. Render Shellを開く
2. 以下を実行：
   ```bash
   npm rebuild better-sqlite3
   ```

### 問題: フロントエンドからAPIに接続できない

**原因**: CORS設定またはURL間違い

**確認項目**:
1. Vercelの環境変数 `VITE_API_URL` が正しいか
2. RenderのCORS設定が有効か（`server/index.js` で確認）
3. ブラウザの開発者ツールでネットワークエラーを確認

**解決策**:
`server/index.js` でCORS設定を確認：
```javascript
app.use(cors({
  origin: ['https://menya-nishiki-frontend.vercel.app'],
  credentials: true
}));
```

### 問題: データベースが初期化されていない

**原因**: マイグレーション未実行

**解決策**:
Render Shellで実行：
```bash
npm run migrate
```

### 問題: Renderのディスクにデータが保存されない

**原因**: Mount Pathが間違っている

**解決策**:
1. Render → サービス → Disks タブ
2. Mount Path が `/data` になっているか確認
3. `server/database-init.js` で `/data` にDBが作成されているか確認

---

## 7. カスタムドメインの設定（オプション）

### Vercel
1. Vercel ダッシュボード → プロジェクト → Settings → Domains
2. カスタムドメインを追加
3. DNSレコードを設定（A/CNAMEレコード）

### Render
1. Render ダッシュボード → サービス → Settings → Custom Domains
2. カスタムドメインを追加
3. DNSレコードを設定（CNAMEレコード）

---

## 8. 自動デプロイの設定

### Render
- デフォルトで `main` ブランチへのプッシュ時に自動デプロイ
- `render.yaml` の `branch` 設定で変更可能

### Vercel
- デフォルトで `main` ブランチへのプッシュ時に自動デプロイ
- Vercel ダッシュボード → Settings → Git で設定可能

---

## 9. モニタリングとログ

### Render
- ダッシュボード → サービス → Logs でリアルタイムログを確認
- Metrics タブでCPU/メモリ使用量を確認

### Vercel
- ダッシュボード → プロジェクト → Deployments でデプロイ履歴を確認
- Analytics タブでアクセス状況を確認

---

## 10. コスト

### Render（無料プラン）
- 750時間/月の無料枠
- 非アクティブ時に自動スリープ（15分後）
- 初回アクセス時のコールドスタート（約30秒）

### Vercel（無料プラン）
- 100 GBの帯域幅/月
- 無制限のデプロイ
- カスタムドメイン対応

---

## まとめ

✅ **デプロイ手順**:
1. Renderでバックエンドをデプロイ → URLを取得
2. `.env.production` を更新（Render URL）
3. Vercelでフロントエンドをデプロイ
4. 動作確認

✅ **次のステップ**:
1. `render.yaml` の `branch` を更新
2. `.env.production` を更新
3. 変更をコミット＆プッシュ
4. Renderでデプロイ開始
5. Vercelでデプロイ開始

---
作成日: 2026-02-12  
最終更新: 2026-02-12
