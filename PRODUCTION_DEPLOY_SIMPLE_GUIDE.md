# 🚀 麺家弍色システム 本番環境デプロイ - 完全ガイド

仮環境（Sandbox）から本番環境（Render + Vercel）への完全移行手順

---

## 📍 現在の仮環境

- **URL**: https://3017-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai
- **リポジトリ**: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud.git
- **最新コミット**: cc24f9f

### ✅ 実装済み機能

- 在庫管理（登録・入庫・出庫・調整）
- 在庫会計連携（入庫→現金減少、出庫→売上原価計上）
- 損益計算書・貸借対照表・キャッシュフロー計算書
- 会計仕訳の自動生成

---

## 🎯 STEP 1: Render バックエンド（約5分）

### 1-1. Render にアクセス

https://render.com/dashboard

### 1-2. 新規 Web Service 作成

**New +** → **Web Service**

### 1-3. GitHub リポジトリ接続

`menya-nishiki-system-cloud` を検索 → **Connect**

### 1-4. 基本設定

```
Name: menya-nishiki-prod-final
Region: Singapore
Branch: main
Runtime: Node
Build Command: npm install
Start Command: node server/index.js
Instance Type: Free
```

### 1-5. 環境変数（6個）⚠️ 重要

```bash
NODE_ENV=production
PORT=5003
SERVE_FRONTEND=false
RESET_DB=true
DB_PATH=/data/menya-nishiki-order.db
JWT_SECRET=menya_nishiki_secret_2026_CHANGE_THIS
```

> ⚠️ `RESET_DB=true` は初回のみ。デプロイ完了後すぐに `false` に変更！

### 1-6. ディスク設定（必須）

```
Name: sqlite-data
Mount Path: /data
Size: 1 GB
```

> 💡 1GBまで無料！ディスクがないとデータが消えます。

### 1-7. デプロイ開始

**Create Web Service** をクリック

### 1-8. ログ確認（重要）

**Logs** タブで以下を確認：

```
✅ Database initialized at: /data/menya-nishiki-order.db
✅ Admin user created: 麺家弍色
✅ 勘定科目追加: [1000] 現金
✅ 勘定科目追加: [1100] 預金
✅ 勘定科目追加: [1300] 商品
✅ 勘定科目追加: [5100] 売上原価
✅ 勘定科目追加: [7100] 雑収入
✅ 勘定科目追加: [8100] 雑損失
✅ Server is running on port 5003
```

### 1-9. RESET_DB を false に変更（必須）

1. **Environment** タブを開く
2. **RESET_DB** を見つける
3. **Edit** → 値を `false` に変更
4. **Save Changes**

### 1-10. Render URL をメモ

例: `https://menya-nishiki-prod-final.onrender.com`

---

## 🌐 STEP 2: Vercel フロントエンド（約5分）

### 2-1. Vercel にアクセス

https://vercel.com/dashboard

### 2-2. 新規プロジェクト作成

**Add New...** → **Project**

### 2-3. GitHub リポジトリインポート

`menya-nishiki-system-cloud` を検索 → **Import**

### 2-4. プロジェクト設定

```
Project Name: menya-nishiki-prod-final
Framework Preset: Vite（自動検出）
Build Command: npm run build（自動）
Output Directory: dist（自動）
```

### 2-5. 環境変数（2個）⚠️ 超重要

```bash
VITE_API_URL=https://【Render URL】/api
NODE_ENV=production
```

> ⚠️ `VITE_API_URL` は必ず末尾に `/api` を付けてください！

例:
```
VITE_API_URL=https://menya-nishiki-prod-final.onrender.com/api
```

### 2-6. デプロイ開始

**Deploy** をクリック

### 2-7. ビルドログ確認

```
✓ Building for production...
✓ 1642 modules transformed.
dist/index.html                   0.43 kB
dist/assets/index-*.css           0.39 kB
dist/assets/index-*.js          385.30 kB
✓ Build Completed
```

### 2-8. Vercel URL をメモ

例: `https://menya-nishiki-prod-final.vercel.app`

---

## ✅ STEP 3: 在庫会計連携機能テスト（約5分）

### 3-1. ログイン

Vercel URL にアクセス

```
ユーザー名: 麺家弍色
パスワード: admin123
```

### 3-2. 在庫登録テスト（現金購入モード）

**在庫管理** → **在庫登録**

```
商品名: ねぎ
カテゴリ: 野菜
現在在庫: 10
単位: 個
単価: 220
発注点: 5
最適在庫: 20
```

**登録** をクリック

#### 期待される結果：
- ✅ 在庫に「ねぎ 10個」が登録される
- ✅ 自動仕訳生成: 借方 商品 ¥2,200 / 貸方 現金 ¥2,200

### 3-3. キャッシュフロー計算書確認

**会計** → **キャッシュフロー計算書**

#### 期待される表示：
```
営業活動によるキャッシュフロー
  営業支出: -¥2,200  ← ねぎ購入による現金減少
```

### 3-4. 在庫出庫テスト（売上原価計上）

**在庫管理** → **在庫一覧** → 「ねぎ」を選択

**出庫** をクリック

```
出庫数量: 3
```

**確定** をクリック

#### 期待される結果：
- ✅ 在庫が「10個 → 7個」に減少
- ✅ 自動仕訳生成: 借方 売上原価 ¥660 / 貸方 商品 ¥660

### 3-5. 損益計算書確認

**会計** → **損益計算書**

#### 期待される表示：
```
売上原価: ¥660  ← ねぎ3個分（220×3）
```

### 3-6. 貸借対照表確認

**会計** → **貸借対照表**

#### 期待される表示：
```
【資産の部】
  商品: ¥1,540  ← 残り7個分（220×7）
  現金: -¥2,200 ← ねぎ購入による減少

【純資産の部】
  当期純損失: -¥660  ← 売上原価として計上
```

---

## 📋 最終チェックリスト

### Render バックエンド
- [ ] デプロイ完了
- [ ] ヘルスチェック OK（`/api/health`）
- [ ] ログに「勘定科目追加」メッセージ確認
- [ ] ログに「Server is running」メッセージ確認
- [ ] **RESET_DB を false に変更済み**

### Vercel フロントエンド
- [ ] デプロイ完了
- [ ] ビルド成功（dist 生成確認）
- [ ] `VITE_API_URL` に `/api` 付与確認
- [ ] ログインページ表示確認

### 在庫会計連携機能
- [ ] 在庫登録でキャッシュフロー自動反映
- [ ] 在庫出庫で損益計算書自動反映
- [ ] 仕訳データが正しく生成
- [ ] 貸借対照表で資産が正しく表示

---

## 🚨 トラブルシューティング

### 問題1: 在庫データが会計帳簿に反映されない

**原因**: 必要な勘定科目が存在しない

**解決策**:
1. Render の **Logs** タブを確認
2. 「勘定科目追加」メッセージがあることを確認
3. なければ `RESET_DB=true` に変更して再デプロイ
4. 完了後 `RESET_DB=false` に戻す

### 問題2: API接続エラー「Failed to fetch」

**原因**: `VITE_API_URL` の設定ミス

**解決策**:
1. Vercel の **Settings** → **Environment Variables**
2. `VITE_API_URL` が `https://【Render URL】/api` の形式か確認（末尾 `/api` 必須）
3. 修正後 **Deployments** → **Redeploy**

### 問題3: データが消える

**原因**: `RESET_DB=true` のまま、またはディスクなし

**解決策**:
1. **RESET_DB を false に変更**
2. **ディスクが正しくマウントされているか確認**（/data に 1GB）

---

## 🎉 デプロイ完了！

### 本番環境URL

- **フロントエンド**: https://menya-nishiki-prod-final.vercel.app
- **バックエンドAPI**: https://menya-nishiki-prod-final.onrender.com/api

### デフォルト認証情報

```
ユーザー名: 麺家弍色
パスワード: admin123
```

⚠️ **初回ログイン後、必ずパスワードを変更してください！**

---

**作成日**: 2026-02-16  
**所要時間**: 約15分  
**完全無料**: Render Free + Vercel Free
