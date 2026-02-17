# 🚀 麺家弍色システム 本番環境デプロイ - 完全マニュアル

**仮環境から本番環境（Render + Vercel）への完全移行手順**

---

## 📍 前提条件

- 仮環境URL: https://3017-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai
- リポジトリ: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud.git
- GitHubアカウント: kazunarihonda83-jpg

---

# 第1部：Render バックエンドデプロイ（約10分）

## STEP 1-1: Render にサインイン

1. ブラウザで https://render.com を開く
2. 右上の「**Sign In**」をクリック
3. 「**Sign in with GitHub**」をクリック
4. GitHubアカウントでログイン

## STEP 1-2: 新規 Web Service 作成

1. ダッシュボード（https://render.com/dashboard）に移動
2. 右上の「**New +**」ボタンをクリック
3. ドロップダウンメニューから「**Web Service**」を選択

## STEP 1-3: GitHub リポジトリ接続

1. 「**Connect a repository**」画面が表示される
2. 検索ボックスに `menya-nishiki` と入力
3. `menya-nishiki-system-cloud` リポジトリを見つける
4. 右側の「**Connect**」ボタンをクリック

## STEP 1-4: 基本設定を入力

以下を**正確に**入力してください：

### Name（サービス名）
```
menya-nishiki-prod-final
```

### Region（リージョン）
```
Singapore
```
> 💡 ドロップダウンメニューから選択

### Branch（ブランチ）
```
main
```

### Runtime（ランタイム）
```
Node
```
> 💡 自動検出されます

### Build Command（ビルドコマンド）
```
npm install
```

### Start Command（起動コマンド）
```
node server/index.js
```

### Instance Type（インスタンスタイプ）
```
Free
```
> 💡 ドロップダウンメニューから「Free」を選択

## STEP 1-5: 環境変数を設定（6個）

画面を下にスクロールして「**Environment Variables**」セクションを見つけます。

### 環境変数 1: NODE_ENV

1. 「**Add Environment Variable**」をクリック
2. **Key**（左側）に以下を入力：
   ```
   NODE_ENV
   ```
3. **Value**（右側）に以下を入力：
   ```
   production
   ```

### 環境変数 2: PORT

1. 「**Add Environment Variable**」をクリック
2. **Key**（左側）に以下を入力：
   ```
   PORT
   ```
3. **Value**（右側）に以下を入力：
   ```
   5003
   ```

### 環境変数 3: SERVE_FRONTEND

1. 「**Add Environment Variable**」をクリック
2. **Key**（左側）に以下を入力：
   ```
   SERVE_FRONTEND
   ```
3. **Value**（右側）に以下を入力：
   ```
   false
   ```

### 環境変数 4: RESET_DB ⚠️ 超重要

1. 「**Add Environment Variable**」をクリック
2. **Key**（左側）に以下を入力：
   ```
   RESET_DB
   ```
3. **Value**（右側）に以下を入力：
   ```
   true
   ```

> ⚠️ **注意**: 初回デプロイ時のみ `true`。デプロイ完了後すぐに `false` に変更します！

### 環境変数 5: DB_PATH

1. 「**Add Environment Variable**」をクリック
2. **Key**（左側）に以下を入力：
   ```
   DB_PATH
   ```
3. **Value**（右側）に以下を入力：
   ```
   /data/menya-nishiki-order.db
   ```

### 環境変数 6: JWT_SECRET

1. 「**Add Environment Variable**」をクリック
2. **Key**（左側）に以下を入力：
   ```
   JWT_SECRET
   ```
3. **Value**（右側）に以下を入力：
   ```
   menya_nishiki_secret_2026_CHANGE_THIS
   ```

## STEP 1-6: ディスク設定（必須）

画面を下にスクロールして「**Disks**」セクションを見つけます。

1. 「**Add Disk**」ボタンをクリック
2. 以下を入力：
   - **Name**: `sqlite-data`
   - **Mount Path**: `/data`
   - **Size**: `1` GB

> 💡 1GBまで無料です！ディスクがないとデータが消えます。

## STEP 1-7: デプロイを開始

1. 画面を一番下までスクロール
2. 青い「**Create Web Service**」ボタンをクリック
3. デプロイが開始されます（約3-5分）

## STEP 1-8: デプロイログを確認（重要）

1. デプロイが開始されると、自動的に「**Logs**」タブに移動します
2. ログが流れるのを待ちます
3. 以下のメッセージが表示されることを確認：

```
✅ Database initialized at: /data/menya-nishiki-order.db
✅ Admin user created: 麺家弍色
✅ 勘定科目追加: [1000] 現金
✅ 勘定科目追加: [1100] 売掛金
✅ 勘定科目追加: [1300] 商品
✅ 勘定科目追加: [2000] 買掛金
✅ 勘定科目追加: [3000] 資本金
✅ 勘定科目追加: [4000] 売上高
✅ 勘定科目追加: [5000] 仕入高
✅ 勘定科目追加: [5100] 売上原価
✅ 勘定科目追加: [6000] 給料
✅ 勘定科目追加: [7000] 地代家賃
✅ 勘定科目追加: [7100] 雑収入
✅ 勘定科目追加: [8100] 雑損失
✅ Server is running on port 5003
```

4. 「**Live**」と表示されたらデプロイ完了

## STEP 1-9: Render URL を取得

1. 画面上部に表示されるURLをコピー
2. 例: `https://menya-nishiki-prod-final.onrender.com`
3. メモ帳などに保存

## STEP 1-10: RESET_DB を false に変更（必須）⚠️

1. 左側のメニューから「**Environment**」タブをクリック
2. 環境変数一覧から「**RESET_DB**」を見つける
3. 右側の「**Edit**」ボタンをクリック
4. **Value** を `true` から `false` に変更
5. 「**Save Changes**」をクリック
6. 自動的に再デプロイが始まります（約1-2分）

---

# 第2部：Vercel フロントエンドデプロイ（約10分）

## STEP 2-1: Vercel にサインイン

1. ブラウザで https://vercel.com を開く
2. 右上の「**Sign In**」をクリック
3. 「**Continue with GitHub**」をクリック
4. GitHubアカウントでログイン

## STEP 2-2: 新規プロジェクト作成

1. ダッシュボード（https://vercel.com/dashboard）に移動
2. 右上の「**Add New...**」ボタンをクリック
3. ドロップダウンメニューから「**Project**」を選択

## STEP 2-3: GitHub リポジトリインポート

1. 「**Import Git Repository**」画面が表示される
2. 検索ボックスに `menya-nishiki` と入力
3. `menya-nishiki-system-cloud` リポジトリを見つける
4. 右側の「**Import**」ボタンをクリック

## STEP 2-4: プロジェクト設定

以下が自動的に設定されます（変更不要）：

- **Framework Preset**: Vite
- **Root Directory**: ./
- **Build Command**: npm run build
- **Output Directory**: dist
- **Install Command**: npm install

### Project Name を変更

**Project Name** フィールドを以下に変更：
```
menya-nishiki-prod-final
```

## STEP 2-5: 環境変数を設定（2個）⚠️ 超重要

画面を下にスクロールして「**Environment Variables**」セクションを見つけます。

### 環境変数 1: VITE_API_URL ⚠️ 最重要

1. **Name**（左側）に以下を入力：
   ```
   VITE_API_URL
   ```

2. **Value**（右側）に以下を入力（**Render の URL** + `/api`）：
   ```
   https://menya-nishiki-prod-final.onrender.com/api
   ```
   
   > ⚠️ **重要**: 必ず末尾に `/api` を付けてください！
   > 
   > ✅ 正しい: `https://menya-nishiki-prod-final.onrender.com/api`
   > ❌ 間違い: `https://menya-nishiki-prod-final.onrender.com`

3. **Environment** は `Production` のままでOK

4. 「**Add**」ボタンをクリック

### 環境変数 2: NODE_ENV

1. **Name**（左側）に以下を入力：
   ```
   NODE_ENV
   ```

2. **Value**（右側）に以下を入力：
   ```
   production
   ```

3. **Environment** は `Production` のままでOK

4. 「**Add**」ボタンをクリック

## STEP 2-6: デプロイを開始

1. 画面を一番下までスクロール
2. 青い「**Deploy**」ボタンをクリック
3. デプロイが開始されます（約3-5分）

## STEP 2-7: ビルドログを確認

デプロイ中、以下のようなログが表示されます：

```
Running "npm run build"
✓ Building for production...
✓ 1642 modules transformed.
dist/index.html                   0.43 kB │ gzip: 0.34 kB
dist/assets/index-XXXXXXXX.css    0.39 kB │ gzip: 0.28 kB
dist/assets/index-XXXXXXXX.js   385.30 kB │ gzip: 98.48 kB
✓ Build Completed in 4.21s
```

## STEP 2-8: Vercel URL を取得

1. 「**Congratulations!**」画面が表示される
2. 表示されるURLをクリックまたはコピー
3. 例: `https://menya-nishiki-prod-final.vercel.app`
4. メモ帳などに保存

---

# 第3部：動作確認テスト（約10分）

## STEP 3-1: ログイン確認

1. Vercel URL（`https://menya-nishiki-prod-final.vercel.app`）をブラウザで開く
2. ログイン画面が表示される
3. 以下を入力：
   - **ユーザー名**: `麺家弍色`
   - **パスワード**: `admin123`
4. 「**ログイン**」ボタンをクリック
5. ダッシュボードが表示されればOK

## STEP 3-2: 在庫登録テスト（現金購入モード）

1. 左メニューから「**在庫管理**」をクリック
2. 「**在庫登録**」をクリック
3. 以下を入力：
   - **商品名**: `ねぎ`
   - **カテゴリ**: `野菜`
   - **現在在庫**: `10`
   - **単位**: `個`
   - **単価**: `220`
   - **発注点**: `5`
   - **最適在庫**: `20`
4. 「**登録**」ボタンをクリック
5. 「在庫を登録しました」と表示されればOK

### 期待される結果：
- ✅ 在庫に「ねぎ 10個」が登録される
- ✅ 自動仕訳生成: 借方 商品（1300） ¥2,200 / 貸方 現金（1000） ¥2,200

## STEP 3-3: キャッシュフロー計算書確認

1. 左メニューから「**会計**」をクリック
2. 「**キャッシュフロー計算書**」をクリック
3. 当月のデータを確認

### 期待される表示：
```
営業活動によるキャッシュフロー
  営業支出: -¥2,200  ← ねぎ購入による現金減少
```

## STEP 3-4: 在庫出庫テスト（売上原価計上）

1. 左メニューから「**在庫管理**」をクリック
2. 「**在庫一覧**」をクリック
3. 「ねぎ」の行を見つける
4. 右側の「**出庫**」ボタンをクリック
5. 以下を入力：
   - **出庫数量**: `3`
6. 「**確定**」ボタンをクリック
7. 「在庫を出庫しました」と表示されればOK

### 期待される結果：
- ✅ 在庫が「10個 → 7個」に減少
- ✅ 自動仕訳生成: 借方 売上原価（5100） ¥660 / 貸方 商品（1300） ¥660

## STEP 3-5: 損益計算書確認

1. 左メニューから「**会計**」をクリック
2. 「**損益計算書**」をクリック
3. 当月のデータを確認

### 期待される表示：
```
売上原価: ¥660  ← ねぎ3個分（220×3）
```

## STEP 3-6: 貸借対照表確認

1. 左メニューから「**会計**」をクリック
2. 「**貸借対照表**」をクリック
3. 当月のデータを確認

### 期待される表示：
```
【資産の部】
  商品: ¥1,540  ← 残り7個分（220×7）
  現金: -¥2,200 ← ねぎ購入による減少

【純資産の部】
  当期純損失: -¥660  ← 売上原価として計上
```

---

# 第4部：最終チェックリスト

## ✅ Render バックエンド

- [ ] デプロイ完了（「Live」と表示）
- [ ] ログに「勘定科目追加」メッセージ確認（12科目）
- [ ] ログに「Server is running on port 5003」確認
- [ ] ヘルスチェック OK（`/api/health`）
- [ ] **RESET_DB を false に変更済み**
- [ ] ディスク設定完了（1GB、`/data`）

## ✅ Vercel フロントエンド

- [ ] デプロイ完了（「Congratulations!」表示）
- [ ] ビルド成功（「Build Completed」表示）
- [ ] `VITE_API_URL` に `/api` 付与確認
- [ ] ログインページ表示確認

## ✅ 在庫会計連携機能

- [ ] 在庫登録でキャッシュフロー自動反映
- [ ] 在庫出庫で損益計算書自動反映
- [ ] 仕訳データが正しく生成
- [ ] 貸借対照表で資産が正しく表示

---

# トラブルシューティング

## 問題1: Render で「勘定科目追加」メッセージが表示されない

**原因**: `RESET_DB` が正しく設定されていない、またはディスクがない

**解決策**:
1. Render の **Environment** タブで `RESET_DB=true` を確認
2. **Disks** タブで `/data` に 1GB ディスクがあることを確認
3. 右上の「**Manual Deploy → Deploy latest commit**」をクリック
4. ログで「勘定科目追加」メッセージを確認
5. 完了後 `RESET_DB=false` に変更

## 問題2: Vercel でログインページが表示されない

**原因**: ビルドエラー、または `VITE_API_URL` の設定ミス

**解決策**:
1. Vercel の **Deployments** タブを開く
2. 最新のデプロイをクリック
3. 「**Building**」ログを確認
4. エラーがある場合は、**Settings → Environment Variables** で `VITE_API_URL` を確認
5. 修正後、**Deployments → Redeploy** をクリック

## 問題3: ログインできない

**原因**: バックエンドAPIに接続できない

**解決策**:
1. ブラウザのコンソールを開く（F12キー）
2. エラーメッセージを確認
3. `Failed to fetch` エラーの場合：
   - Vercel の **Settings → Environment Variables** を開く
   - `VITE_API_URL` が `https://【Render URL】/api` の形式か確認
   - 末尾に `/api` があるか確認
4. 修正後、**Deployments → Redeploy** をクリック

## 問題4: 在庫データが会計帳簿に反映されない

**原因**: 必要な勘定科目が存在しない

**解決策**:
1. Render の **Logs** タブを確認
2. 「勘定科目追加」メッセージがあることを確認
3. なければ **Environment** タブで `RESET_DB=true` に変更
4. 再デプロイ完了後 `RESET_DB=false` に戻す

## 問題5: データが消える

**原因**: `RESET_DB=true` のまま、またはディスクがない

**解決策**:
1. Render の **Environment** タブで `RESET_DB=false` を確認
2. **Disks** タブで `/data` に 1GB ディスクがあることを確認

---

# 🎉 デプロイ完了！

## 本番環境URL

- **フロントエンド**: https://menya-nishiki-prod-final.vercel.app
- **バックエンドAPI**: https://menya-nishiki-prod-final.onrender.com/api

## デフォルト認証情報

```
ユーザー名: 麺家弍色
パスワード: admin123
```

⚠️ **初回ログイン後、必ずパスワードを変更してください！**

---

## 実装済み機能一覧

### 在庫管理システム
- ✅ 在庫登録・更新・削除
- ✅ 在庫入庫・出庫・調整
- ✅ 在庫アラート機能
- ✅ カテゴリ管理
- ✅ 在庫統計
- ✅ サプライヤー管理

### 在庫会計連携機能
- ✅ 在庫入庫時: 借方 商品（1300） / 貸方 現金（1000）を自動仕訳
- ✅ 在庫出庫時: 借方 売上原価（5100） / 貸方 商品（1300）を自動仕訳
- ✅ 在庫調整時: 増加は雑収入（7100）、減少は雑損失（8100）として自動仕訳

### 会計システム
- ✅ 損益計算書（13項目）
  - 売上高、売上原価、粗利益
  - 販売費及び一般管理費、営業利益
  - 営業外収益、営業外費用、経常利益
  - 特別利益、特別損失、税引前当期純利益
  - 法人税等、当期純利益
- ✅ 貸借対照表
  - 資産の部（流動資産、固定資産）
  - 負債の部（流動負債、固定負債）
  - 純資産の部（資本金、利益剰余金）
- ✅ キャッシュフロー計算書
  - 営業活動によるキャッシュフロー
  - 投資活動によるキャッシュフロー
  - 財務活動によるキャッシュフロー
- ✅ 会計仕訳の自動生成
- ✅ 勘定科目管理（12科目）

---

**作成日**: 2026-02-16  
**所要時間**: 約30分  
**完全無料**: Render Free + Vercel Free
