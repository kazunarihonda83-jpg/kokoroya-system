# 🚀 新規本番環境作成ガイド

## 📅 作成日: 2026-02-16

---

## 🎯 目的

仮環境（https://3017-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai）の機能を
完全に新しい本番環境に移行する。

特に**在庫会計連携機能**（在庫入庫→キャッシュフロー、在庫出庫→損益計算書）を
確実に動作させる。

---

## 📦 実装済み機能（仮環境）

### ✅ 在庫会計連携機能
1. **在庫入庫** → 自動仕訳生成
   - 借方: 商品（1300）/ 貸方: 現金（1000）
   - キャッシュフロー計算書の営業支出に即座反映

2. **在庫出庫** → 自動仕訳生成
   - 借方: 売上原価（5100）/ 貸方: 商品（1300）
   - 損益計算書の売上原価に反映

3. **在庫調整** → 自動仕訳生成
   - 増加: 借方 商品 / 貸方 雑収入（7100）
   - 減少: 借方 雑損失（8100）/ 貸方 商品

### ✅ その他の機能
- 受注管理システム
- 仕入管理システム
- 会計帳簿（仕訳帳）
- 損益計算書（13項目対応）
- 貸借対照表
- キャッシュフロー計算書

---

## 🔵 STEP 1: Render 新規バックエンド作成

### 1-1. Render にアクセス

1. https://render.com/dashboard を開く
2. GitHubアカウントでサインイン

---

### 1-2. 新しい Web Service を作成

1. 右上の **「New +」** ボタンをクリック
2. **「Web Service」** を選択
3. GitHubリポジトリを選択: **「menya-nishiki-system-cloud」**
4. **「Connect」** をクリック

---

### 1-3. サービス設定

| 項目 | 設定値 |
|------|--------|
| **Name** | `menya-nishiki-production` |
| **Region** | `Singapore` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | `Starter` (無料プラン) |

---

### 1-4. 環境変数設定（6個）

**重要**: すべて正確に入力してください

```
NODE_ENV=production
PORT=5003
SERVE_FRONTEND=false
RESET_DB=true
DB_PATH=/data/menya-nishiki-order.db
JWT_SECRET=menya_nishiki_production_secret_2026_change_this
```

⚠️ **注意**: 
- 初回デプロイは `RESET_DB=true` で開始
- データベース初期化後、必ず `RESET_DB=false` に変更

---

### 1-5. ディスク設定（SQLite用）

1. **「Add Disk」** をクリック
2. 設定:
   - **Name**: `sqlite-data`
   - **Mount Path**: `/data`
   - **Size**: `1 GB`
3. **「Save」** をクリック

---

### 1-6. デプロイ開始

1. **「Create Web Service」** をクリック
2. デプロイログを確認（5-10分）

**期待されるログ:**
```
Initializing database at: /opt/render/project/src/menya-nishiki-order.db
⚠️  RESET_DB=true detected. Deleting existing database...
Creating default admin user...
✅ Default admin user created successfully
   Username: 麺家弍色
   Password: admin123
Creating default accounts...
✅ Default accounts created successfully
✅ 勘定科目追加: [1300] 商品 (なし)
✅ 勘定科目追加: [5100] 売上原価 (cost_of_sales)
Server is running on port 5003
```

---

### 1-7. バックエンドURL確認

デプロイ完了後、画面上部に表示されるURLをメモ:
- 例: `https://menya-nishiki-production.onrender.com`

---

### 1-8. RESET_DB を false に変更（重要！）

1. **「Environment」** タブをクリック
2. **「RESET_DB」** を探す
3. **「Edit」** をクリック
4. 値を **`false`** に変更
5. **「Save Changes」** をクリック
6. 自動的に再デプロイされる（1-2分）

---

## 🟢 STEP 2: Vercel 新規フロントエンド作成

### 2-1. Vercel にアクセス

1. https://vercel.com/dashboard を開く
2. GitHubアカウントでサインイン

---

### 2-2. 新しいプロジェクトを作成

1. **「Add New...」** ボタンをクリック
2. **「Project」** を選択
3. GitHubリポジトリを選択: **「menya-nishiki-system-cloud」**
4. **「Import」** をクリック

---

### 2-3. プロジェクト設定

| 項目 | 設定値 |
|------|--------|
| **Project Name** | `menya-nishiki-production` |
| **Framework Preset** | `Vite` (自動検出) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

### 2-4. 環境変数設定（2個）

**重要**: RenderのURLを正確に入力

```
VITE_API_URL=https://menya-nishiki-production.onrender.com/api
NODE_ENV=production
```

⚠️ **超重要**: `VITE_API_URL` の末尾に `/api` を必ず付けてください！

---

### 2-5. デプロイ開始

1. **「Deploy」** ボタンをクリック
2. ビルドログを確認（3-5分）

**期待されるログ:**
```
Running "npm install"
added 527 packages

Running "npm run build"
> vite build

vite v5.4.21 building for production...
✓ 1642 modules transformed.
dist/index.html                   0.43 kB
dist/assets/index-CE8DXIyO.css    0.39 kB
dist/assets/index-CHJYZ8-S.js   385.64 kB
✓ built in 4.21s

Build Completed
```

---

### 2-6. フロントエンドURL確認

デプロイ完了後、画面に表示されるURLをメモ:
- 例: `https://menya-nishiki-production.vercel.app`

---

## ✅ STEP 3: 統合テスト

### 3-1. ログインテスト

1. Vercel URLをブラウザで開く
2. ログイン画面が表示される
3. 認証情報を入力:
   - **ユーザー名**: `麺家弍色`
   - **パスワード**: `admin123`
4. ログイン成功 → ダッシュボード表示

---

### 3-2. 在庫登録テスト（キャッシュフロー反映確認）

1. 左メニュー **「在庫管理」** をクリック
2. **「新規登録」** ボタンをクリック
3. 入力:
   - 商品名: `ねぎ`
   - カテゴリ: `野菜`
   - 数量: `10`
   - 単価: `220`
   - 単位: `個`
4. **「保存」** をクリック
5. 成功メッセージ確認

**期待される仕訳:**
```
借方: 商品 (1300)     ¥2,200
貸方: 現金 (1000)     ¥2,200
```

---

### 3-3. キャッシュフロー確認

1. 左メニュー **「会計帳簿」** → **「キャッシュフロー計算書」**
2. 期間を今月に設定
3. **「検索」** をクリック

**期待される結果:**
```
営業キャッシュフロー:
  営業支出: ¥2,200
  純額:     -¥2,200
```

✅ 在庫購入が営業支出に反映されている

---

### 3-4. 在庫出庫テスト（損益計算書反映確認）

1. **「在庫管理」** に戻る
2. 登録した「ねぎ」の **「出庫」** ボタンをクリック
3. 出庫数量: `3` を入力
4. **「保存」** をクリック
5. 成功メッセージ確認

**期待される仕訳:**
```
借方: 売上原価 (5100)  ¥660
貸方: 商品 (1300)      ¥660
```

---

### 3-5. 損益計算書確認

1. 左メニュー **「会計帳簿」** → **「損益計算書」**
2. 期間を今月に設定
3. **「検索」** をクリック

**期待される結果:**
```
売上原価: ¥660  (= ¥220 × 3個)
粗利益:   -¥660
純利益:   -¥660
```

✅ 在庫出庫が売上原価に反映されている

---

### 3-6. 貸借対照表確認

1. 左メニュー **「会計帳簿」** → **「貸借対照表」**
2. 期間を今月に設定
3. **「検索」** をクリック

**期待される結果:**
```
資産:
  現金:   -¥2,200
  商品:    ¥1,540  (= ¥220 × 7個)
  合計:   -¥660

負債:     ¥0

純資産:   -¥660
```

---

## 🎉 デプロイ完了チェックリスト

### バックエンド (Render)
- [ ] サービス名: `menya-nishiki-production`
- [ ] 環境変数6個すべて設定済み
- [ ] ディスク `/data` マウント済み
- [ ] `RESET_DB=false` に変更済み
- [ ] サービスが「Live」状態
- [ ] `/api/health` が応答する

### フロントエンド (Vercel)
- [ ] プロジェクト名: `menya-nishiki-production`
- [ ] 環境変数2個設定済み
- [ ] `VITE_API_URL` に `/api` 付き
- [ ] デプロイが「Ready」状態
- [ ] サイトが表示される

### 統合テスト
- [ ] ログイン成功
- [ ] 在庫登録成功
- [ ] キャッシュフローに反映（営業支出 ¥2,200）
- [ ] 在庫出庫成功
- [ ] 損益計算書に反映（売上原価 ¥660）
- [ ] 貸借対照表が正しい

---

## 📊 新規本番環境情報

| 項目 | URL / 情報 |
|------|-----------|
| **バックエンド (Render)** | https://menya-nishiki-production.onrender.com |
| **フロントエンド (Vercel)** | https://menya-nishiki-production.vercel.app |
| **GitHubリポジトリ** | https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud |
| **最新コミット** | def4a45 |
| **デフォルトユーザー** | 麺家弍色 |
| **デフォルトパスワード** | admin123 |

---

## ⚠️ セキュリティ重要事項

1. **JWT_SECRET** を変更してください
   ```bash
   openssl rand -base64 32
   ```

2. **デフォルトパスワード** を変更してください
   - 初回ログイン後、必ず変更

3. **RESET_DB=false** を確認してください
   - 本番運用中は絶対に `true` にしない

---

## 📞 サポート

問題が発生した場合:
- Render ログを確認
- Vercel ログを確認
- ブラウザのコンソール（F12）を確認

---

**作成日**: 2026-02-16  
**バージョン**: v1.0.0  
**ステータス**: デプロイ準備完了
