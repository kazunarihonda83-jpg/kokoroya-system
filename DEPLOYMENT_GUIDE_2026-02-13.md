# 麺家弍色システム デプロイガイド（Render + Vercel）

## 📅 最終更新日
2026-02-13

## 🎯 デプロイ構成

本システムは以下の構成でデプロイします：

| サービス | 役割 | プラットフォーム | URL |
|---------|------|-----------------|-----|
| **フロントエンド** | React SPA | Vercel | https://menya-nishiki.vercel.app |
| **バックエンドAPI** | Express + SQLite | Render | https://menya-nishiki-backend.onrender.com |

## 📋 前提条件

### 必要なアカウント
- ✅ GitHubアカウント
- ✅ Renderアカウント（無料プラン可）
- ✅ Vercelアカウント（無料プラン可）

### リポジトリ
- **GitHub**: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud.git
- **ブランチ**: `main`

## 🚀 デプロイ手順

### ステップ1: GitHubリポジトリの最新化

```bash
# ローカルの変更を最新のmainブランチにプッシュ
cd /home/user/webapp/menya-nishiki-order-management-system
git status
git add .
git commit -m "feat: 現金購入モード実装完了"
git push origin main
```

### ステップ2: Render（バックエンド）のデプロイ

#### 2-1. Renderにログイン
1. https://render.com にアクセス
2. GitHubアカウントでログイン

#### 2-2. 新規Webサービス作成
1. ダッシュボードで「New +」→「Web Service」をクリック
2. GitHubリポジトリを接続
   - Repository: `kazunarihonda83-jpg/menya-nishiki-system-cloud`
3. 以下の設定を入力：

**基本設定:**
```
Name: menya-nishiki-backend
Region: Singapore（または最寄りのリージョン）
Branch: main
Runtime: Node
Build Command: npm install
Start Command: node server/index.js
```

**プラン:**
```
Instance Type: Starter（無料プラン）
```

#### 2-3. 環境変数の設定

「Environment」タブで以下を設定：

```bash
# 必須環境変数
NODE_ENV=production
PORT=5003
SERVE_FRONTEND=false

# JWT秘密鍵（自動生成推奨）
JWT_SECRET=[Generate]ボタンをクリック

# データベース関連
RESET_DB=false
DB_PATH=/data/menya-nishiki-order.db
```

#### 2-4. ディスク設定

「Settings」→「Disks」で設定：
```
Name: sqlite-data
Mount Path: /data
Size: 1 GB
```

#### 2-5. デプロイ実行

「Manual Deploy」→「Deploy latest commit」をクリック

**デプロイ完了確認:**
- ✅ ログに「Server is running on port 5003」が表示される
- ✅ Statusが「Live」になる
- ✅ URLが発行される（例: https://menya-nishiki-backend.onrender.com）

#### 2-6. API動作確認

```bash
# ヘルスチェック
curl https://menya-nishiki-backend.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}'

# 成功レスポンス例:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{...}}
```

---

### ステップ3: Vercel（フロントエンド）のデプロイ

#### 3-1. Vercelにログイン
1. https://vercel.com にアクセス
2. GitHubアカウントでログイン

#### 3-2. 新規プロジェクト作成
1. 「Add New」→「Project」をクリック
2. GitHubリポジトリをインポート
   - Repository: `kazunarihonda83-jpg/menya-nishiki-system-cloud`

#### 3-3. ビルド設定

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev
```

#### 3-4. 環境変数の設定

「Environment Variables」で以下を設定：

```bash
# バックエンドAPI URL（Renderで発行されたURL）
VITE_API_URL=https://menya-nishiki-backend.onrender.com

# 本番環境フラグ
NODE_ENV=production
```

⚠️ **重要**: `VITE_API_URL`にはRenderで発行された実際のURLを設定してください。

#### 3-5. デプロイ実行

「Deploy」ボタンをクリック

**デプロイ完了確認:**
- ✅ ビルドが成功する
- ✅ Production URLが発行される（例: https://menya-nishiki.vercel.app）
- ✅ ブラウザでアクセス可能

#### 3-6. フロントエンド動作確認

1. Vercelで発行されたURLにアクセス
2. ログイン画面が表示される
3. 以下の情報でログイン:
   ```
   ユーザー名: 麺家弍色
   パスワード: admin123
   ```
4. ダッシュボードが表示されることを確認

---

## 🔧 環境変数一覧

### Render（バックエンド）

| 変数名 | 値 | 説明 | 必須 |
|--------|-----|------|------|
| `NODE_ENV` | `production` | 本番環境フラグ | ✅ |
| `PORT` | `5003` | サーバーポート | ✅ |
| `JWT_SECRET` | ランダム文字列 | JWT署名用秘密鍵 | ✅ |
| `SERVE_FRONTEND` | `false` | フロント配信無効化 | ✅ |
| `RESET_DB` | `false` | DB初期化無効化 | ✅ |
| `DB_PATH` | `/data/menya-nishiki-order.db` | DB保存パス | ⭕️ |

### Vercel（フロントエンド）

| 変数名 | 値 | 説明 | 必須 |
|--------|-----|------|------|
| `VITE_API_URL` | RenderのURL | バックエンドAPI URL | ✅ |
| `NODE_ENV` | `production` | 本番環境フラグ | ✅ |

---

## 🔍 デプロイ後の確認項目

### ✅ バックエンド（Render）

1. **サーバー起動確認**
   ```bash
   curl https://menya-nishiki-backend.onrender.com/health
   ```

2. **ログイン機能**
   ```bash
   curl -X POST https://menya-nishiki-backend.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"麺家弍色","password":"admin123"}'
   ```

3. **データベース動作**
   - ログインに成功すること
   - トークンが返却されること

### ✅ フロントエンド（Vercel）

1. **ページ表示**
   - ✅ トップページ（ログイン画面）が表示される
   - ✅ 画像・CSSが正しく読み込まれる

2. **ログイン機能**
   - ✅ ユーザー名・パスワードを入力してログイン
   - ✅ ダッシュボードにリダイレクトされる

3. **各機能の動作**
   - ✅ 在庫管理画面が表示される
   - ✅ 会計帳簿画面が表示される
   - ✅ 損益計算書が表示される
   - ✅ キャッシュフロー計算書が表示される

### ✅ API連携

1. **在庫登録テスト**
   - フロントエンドから在庫を登録
   - 仕訳が自動生成されること確認
   - キャッシュフローに反映されること確認

2. **在庫出庫テスト**
   - 在庫を出庫
   - 売上原価が損益計算書に反映されること確認

---

## 🐛 トラブルシューティング

### 問題1: RenderでCORS エラー

**症状**: フロントエンドからAPIにアクセスできない

**解決方法**:
```javascript
// server/index.js で以下を確認
app.use(cors({
  origin: 'https://menya-nishiki.vercel.app', // Vercelの実際のURL
  credentials: true
}));
```

### 問題2: Vercelでビルドエラー

**症状**: `npm run build` が失敗する

**解決方法**:
1. `package.json` の `scripts` を確認
2. ローカルで `npm run build` を実行してエラー確認
3. 依存関係を `npm install` で再インストール

### 問題3: データベースが初期化される

**症状**: 毎回デプロイ後にデータが消える

**解決方法**:
- Renderの環境変数 `RESET_DB=false` を確認
- Diskが正しくマウントされているか確認（`/data`）

### 問題4: API URLが正しく設定されていない

**症状**: ログインできない、API呼び出しがエラー

**解決方法**:
```bash
# Vercelの環境変数を確認
VITE_API_URL=https://menya-nishiki-backend.onrender.com

# フロントエンドを再デプロイ
```

---

## 📊 デプロイ状況の監視

### Render

1. ダッシュボードで「Logs」タブを確認
2. エラーがないことを確認
3. CPU・メモリ使用率を監視

### Vercel

1. ダッシュボードで「Deployments」を確認
2. ビルドログを確認
3. アクセス数を監視（Analytics）

---

## 🔄 再デプロイ手順

### コード変更後の再デプロイ

```bash
# 1. ローカルで変更をコミット
git add .
git commit -m "fix: バグ修正"
git push origin main

# 2. 自動デプロイ
# → Renderが自動的に再デプロイ
# → Vercelが自動的に再ビルド
```

### 手動再デプロイ

**Render:**
1. ダッシュボードで「Manual Deploy」
2. 「Deploy latest commit」をクリック

**Vercel:**
1. ダッシュボードで「Deployments」
2. 「Redeploy」をクリック

---

## 💾 データベースのバックアップ

### Renderのデータベースをバックアップ

1. Renderダッシュボードで「Shell」を開く
2. 以下のコマンドを実行:

```bash
# データベースファイルをコピー
cp /data/menya-nishiki-order.db /tmp/backup.db

# ダウンロード（Renderの機能で提供される場合）
```

⚠️ **推奨**: 定期的に手動バックアップを実施

---

## 🎉 デプロイ完了チェックリスト

- [ ] GitHubに最新コードがプッシュされている
- [ ] Renderでバックエンドがデプロイされている
- [ ] Renderの環境変数が正しく設定されている
- [ ] Renderのディスクが正しくマウントされている
- [ ] Vercelでフロントエンドがデプロイされている
- [ ] VercelのAPIURLがRenderのURLに設定されている
- [ ] ログイン機能が動作する
- [ ] 在庫管理機能が動作する
- [ ] 会計帳簿機能が動作する
- [ ] 損益計算書が正しく表示される
- [ ] キャッシュフロー計算書が正しく表示される

---

## 📞 サポート情報

### 公式ドキュメント
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs

### リポジトリ
- **GitHub**: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud.git

### ログイン情報（デフォルト）
```
ユーザー名: 麺家弍色
パスワード: admin123
```

⚠️ **セキュリティ**: 本番環境では必ずパスワードを変更してください。

---

**デプロイガイド作成日**: 2026-02-13  
**最終更新**: 現金購入モード実装完了後  
**システムバージョン**: v1.0.0  
**Git commit**: 418a132
