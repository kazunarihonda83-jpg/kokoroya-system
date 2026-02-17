# 【完全版】麺家弍色システム 新規本番環境デプロイガイド

## 📋 概要

本ガイドは、開発環境（Sandbox）で実装された全機能を**新規の本番環境**に移行するための完全手順書です。

### 🎯 実装済み機能（すべて本番環境に移行）

1. **在庫管理システム**
   - 在庫登録・更新・削除
   - 在庫入庫・出庫・調整機能
   - 在庫アラート機能

2. **在庫会計連携機能** ⭐ **重要**
   - **在庫入庫時**: 借方 商品（資産） / 貸方 現金（資産）を自動仕訳
   - **在庫出庫時**: 借方 売上原価（費用） / 貸方 商品（資産）を自動仕訳
   - **在庫調整時**: 増加は雑収入、減少は雑損失として自動仕訳

3. **会計システム**
   - 損益計算書（13項目）
   - 貸借対照表
   - キャッシュフロー計算書（営業・投資・財務活動）
   - 会計仕訳の自動生成

### 🔗 リポジトリ情報

- **GitHub**: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud.git
- **最新コミット**: `def4a45` (2026-02-15)
- **ブランチ**: `main`

---

## 🚀 STEP 1: Render バックエンド新規作成

### 1-1. Render アカウント準備

1. https://render.com にアクセス
2. GitHub アカウントでサインイン（または新規登録）

### 1-2. 新規 Web Service 作成

1. **Dashboard** で「**New +**」ボタン → 「**Web Service**」を選択
2. **Connect a repository**
   - GitHub リポジトリ一覧から `menya-nishiki-system-cloud` を検索
   - 「**Connect**」をクリック

### 1-3. サービス設定

以下を**正確に**入力してください：

| 項目 | 設定値 |
|------|--------|
| **Name** | `menya-nishiki-production-2026` ⭐ 新規名 |
| **Region** | `Singapore` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | `Starter` (無料) |

### 1-4. 環境変数設定（6個）⭐ 重要

**「Environment Variables」** セクションで以下を追加：

#### 1️⃣ NODE_ENV
```
NODE_ENV=production
```

#### 2️⃣ PORT
```
PORT=5003
```

#### 3️⃣ SERVE_FRONTEND
```
SERVE_FRONTEND=false
```

#### 4️⃣ RESET_DB ⭐ 初回デプロイ時のみ `true`
```
RESET_DB=true
```
> **重要**: 初回デプロイ完了後、すぐに `false` に変更してください！

#### 5️⃣ DB_PATH
```
DB_PATH=/data/menya-nishiki-order.db
```

#### 6️⃣ JWT_SECRET ⭐ セキュリティ重要
```
JWT_SECRET=menya_nishiki_production_secret_2026_change_this_immediately
```
> **注意**: 本番環境では必ず強力なランダム文字列に変更してください！

### 1-5. ディスク設定（SQLiteデータベース用）

**「Disk」** セクションで：

1. 「**Add Disk**」をクリック
2. **Name**: `sqlite-data`
3. **Mount Path**: `/data`
4. **Size**: `1 GB`

### 1-6. デプロイ開始

1. すべての設定を確認
2. 「**Create Web Service**」をクリック
3. デプロイログを監視（約3-5分）

### 1-7. デプロイ確認

#### ログで確認すべき項目：

```bash
✅ Database initialized at: /data/menya-nishiki-order.db
✅ Admin user created: 麺家弍色
✅ 勘定科目追加: [1000] 現金
✅ 勘定科目追加: [1300] 商品
✅ 勘定科目追加: [5100] 売上原価
✅ 勘定科目追加: [7100] 雑収入
✅ 勘定科目追加: [8100] 雑損失
✅ Server is running on port 5003
```

#### APIヘルスチェック：

デプロイURL（例: `https://menya-nishiki-production-2026.onrender.com`）を取得後、以下で確認：

```bash
curl https://menya-nishiki-production-2026.onrender.com/api/health
```

期待するレスポンス：
```json
{"status":"ok","timestamp":"2026-02-15T..."}
```

### 1-8. RESET_DB を false に変更 ⭐ 必須

1. **Environment** タブを開く
2. **RESET_DB** を見つける
3. 「**Edit**」 → 値を `false` に変更
4. **Save** → 自動的に再デプロイが始まります

---

## 🌐 STEP 2: Vercel フロントエンド新規作成

### 2-1. Vercel アカウント準備

1. https://vercel.com にアクセス
2. GitHub アカウントでサインイン（または新規登録）

### 2-2. 新規プロジェクト作成

1. **Dashboard** で「**Add New...**」→ 「**Project**」を選択
2. **Import Git Repository**
   - リポジトリ検索で `menya-nishiki` と入力
   - `menya-nishiki-system-cloud` を見つけて「**Import**」をクリック

### 2-3. プロジェクト設定

| 項目 | 設定値 |
|------|--------|
| **Project Name** | `menya-nishiki-production-2026` ⭐ 新規名 |
| **Framework Preset** | `Vite` (自動検出) |
| **Build Command** | `npm run build` (自動) |
| **Output Directory** | `dist` (自動) |
| **Install Command** | `npm install` (自動) |

### 2-4. 環境変数設定（2個）⭐ 超重要

**「Environment Variables」** セクションで以下を追加：

#### 1️⃣ VITE_API_URL ⭐ 最重要
```
VITE_API_URL=https://menya-nishiki-production-2026.onrender.com/api
```
> **警告**: 必ず末尾に `/api` を付けてください！

#### 2️⃣ NODE_ENV
```
NODE_ENV=production
```

### 2-5. デプロイ開始

1. 「**Deploy**」ボタンをクリック
2. ビルドログを監視（約3-5分）

### 2-6. デプロイ確認

#### 期待するビルドログ：

```bash
✓ Building for production...
✓ 1642 modules transformed.
dist/index.html                   0.43 kB │ gzip: 0.34 kB
dist/assets/index-CE8DXIyO.css    0.39 kB │ gzip: 0.28 kB
dist/assets/index-CST2dw7A.js   385.30 kB │ gzip: 98.48 kB
✓ Build Completed in 1m 23s
```

#### デプロイURL取得：

デプロイ完了後、URLが表示されます（例: `https://menya-nishiki-production-2026.vercel.app`）

---

## ✅ STEP 3: 在庫会計連携機能の動作確認テスト

### 3-1. ログイン確認

1. Vercel URL（`https://menya-nishiki-production-2026.vercel.app`）にアクセス
2. ログイン画面で以下を入力：
   - **ユーザー名**: `麺家弍色`
   - **パスワード**: `admin123`
3. ログイン成功を確認

### 3-2. 在庫登録テスト（現金購入モード）

1. **在庫管理** → **在庫登録** を開く
2. 以下を入力：
   - **商品名**: `ねぎ`
   - **カテゴリ**: `野菜`
   - **現在在庫**: `10`
   - **単位**: `個`
   - **単価**: `220`
3. 「**登録**」をクリック

#### 期待される動作：
- ✅ 在庫に「ねぎ 10個」が登録される
- ✅ **自動仕訳が生成される**:
  - 借方: 商品（1300） ¥2,200
  - 貸方: 現金（1000） ¥2,200

### 3-3. キャッシュフロー計算書確認

1. **会計** → **キャッシュフロー計算書** を開く
2. 当月のデータを確認

#### 期待される表示：
```
営業活動によるキャッシュフロー
  営業支出: -¥2,200  ← ねぎ購入による現金減少
```

### 3-4. 在庫出庫テスト（売上原価計上）

1. **在庫管理** → **在庫一覧** を開く
2. 「ねぎ」を選択 → **出庫** をクリック
3. 以下を入力：
   - **出庫数量**: `3`
4. 「**確定**」をクリック

#### 期待される動作：
- ✅ 在庫が「10個 → 7個」に減少
- ✅ **自動仕訳が生成される**:
  - 借方: 売上原価（5100） ¥660
  - 貸方: 商品（1300） ¥660

### 3-5. 損益計算書確認

1. **会計** → **損益計算書** を開く
2. 当月のデータを確認

#### 期待される表示：
```
売上原価: ¥660  ← ねぎ3個分（220×3）
```

### 3-6. 貸借対照表確認

1. **会計** → **貸借対照表** を開く
2. 当月のデータを確認

#### 期待される表示：
```
【資産の部】
  商品: ¥1,540  ← 残り7個分（220×7）
  現金: -¥2,200 ← ねぎ購入による減少

【純資産の部】
  当期純損失: -¥660  ← 売上原価として計上
```

---

## 🎯 STEP 4: 最終チェックリスト

### バックエンド（Render）
- [ ] デプロイURL取得完了
- [ ] ヘルスチェックAPI正常応答
- [ ] `RESET_DB=false` に変更済み
- [ ] ログに「勘定科目追加」メッセージ確認
- [ ] ログに「Server is running」メッセージ確認

### フロントエンド（Vercel）
- [ ] デプロイURL取得完了
- [ ] ビルド成功（dist生成確認）
- [ ] `VITE_API_URL` に `/api` 付与確認
- [ ] ログインページ表示確認

### 在庫会計連携機能
- [ ] 在庫登録でキャッシュフロー自動反映
- [ ] 在庫出庫で損益計算書自動反映
- [ ] 仕訳データが正しく生成されている
- [ ] 貸借対照表で資産が正しく表示

### セキュリティ
- [ ] JWT_SECRETを強力な値に変更
- [ ] 初回ログイン後パスワード変更
- [ ] 環境変数の機密情報を確認

---

## 📚 トラブルシューティング

### 問題1: 在庫データが会計帳簿に反映されない

**原因**: 必要な勘定科目が存在しない

**解決策**:
1. Renderの**Logs**タブを確認
2. 以下のログがあることを確認：
   ```
   ✅ 勘定科目追加: [1300] 商品
   ✅ 勘定科目追加: [5100] 売上原価
   ```
3. もしない場合は、`RESET_DB=true` に一時的に変更して再デプロイ
4. データベースが再初期化されたら、`RESET_DB=false` に戻す

### 問題2: Vercelで「vite: command not found」エラー

**原因**: `vite` が dependencies に含まれていない

**解決策**:
- 現在のコードでは修正済み（`vite` は dependencies に移動済み）
- もしエラーが出る場合は、最新コードを pull してください

### 問題3: API接続エラー「Failed to fetch」

**原因**: `VITE_API_URL` の設定ミス

**解決策**:
1. Vercelの **Settings** → **Environment Variables** を開く
2. `VITE_API_URL` の値を確認
3. 必ず `https://[Render URL]/api` の形式（末尾に `/api`）
4. 修正後、**Deployments** → **Redeploy** を実行

---

## 📖 参考ドキュメント

- [Render 公式ドキュメント](https://render.com/docs)
- [Vercel 公式ドキュメント](https://vercel.com/docs)
- [Vite デプロイガイド](https://vitejs.dev/guide/static-deploy.html)

---

## 🎉 デプロイ成功！

すべてのテストが完了したら、新しい本番環境は準備完了です。

### 本番環境URL（例）
- **フロントエンド**: https://menya-nishiki-production-2026.vercel.app
- **バックエンドAPI**: https://menya-nishiki-production-2026.onrender.com/api

### デフォルト認証情報
- **ユーザー名**: `麺家弍色`
- **パスワード**: `admin123`
- ⚠️ **初回ログイン後、必ずパスワードを変更してください！**

---

**作成日**: 2026-02-16  
**バージョン**: 1.0  
**最終更新**: 2026-02-16
