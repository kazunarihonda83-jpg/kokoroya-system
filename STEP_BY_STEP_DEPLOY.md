# 麺家弍色システム - ステップバイステップデプロイガイド

## 📅 作成日: 2026-02-13

---

## 🎯 デプロイ概要

このガイドでは、RenderとVercelで**完全にゼロから**デプロイを実施します。

### 準備完了状態
- ✅ 最新コード: `ead3679` プッシュ済み
- ✅ リポジトリ: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud
- ✅ ローカルビルド: 成功確認済み

---

## 🔵 PART 1: Render でバックエンドをデプロイ

### ステップ 1: Render にアクセス

1. ブラウザで https://render.com を開く
2. 「Sign In」をクリック
3. **GitHub アカウント**でサインイン
4. 権限を承認

---

### ステップ 2: 新しい Web Service を作成

1. ダッシュボードで右上の **「New +」** ボタンをクリック
2. ドロップダウンメニューから **「Web Service」** を選択

![New Web Service](https://render.com/docs/static/new-web-service.png)

---

### ステップ 3: リポジトリを接続

1. 「Connect a repository」画面が表示されます
2. 右側の **「Configure GitHub」** をクリック（初回のみ）
3. GitHub の権限設定画面が開きます
4. **「menya-nishiki-system-cloud」** リポジトリを選択
5. 「Install」または「Save」をクリック
6. Render に戻り、**「menya-nishiki-system-cloud」** が表示されることを確認
7. 右側の **「Connect」** ボタンをクリック

---

### ステップ 4: サービス設定を入力

以下の項目を**正確に**入力してください：

#### 基本設定

| 項目 | 入力値 |
|------|--------|
| **Name** | `menya-nishiki-backend` |
| **Region** | `Singapore` (ドロップダウンから選択) |
| **Branch** | `main` (デフォルト) |
| **Root Directory** | (空欄のまま) |

#### ビルド設定

| 項目 | 入力値 |
|------|--------|
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server/index.js` |

#### プラン

| 項目 | 入力値 |
|------|--------|
| **Instance Type** | `Starter` (無料プラン) |

---

### ステップ 5: 環境変数を設定

画面下部の **「Environment Variables」** セクションまでスクロールします。

**「Add Environment Variable」** ボタンを複数回クリックして、以下を**すべて**追加：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5003` |
| `SERVE_FRONTEND` | `false` |
| `RESET_DB` | `false` |
| `DB_PATH` | `/data/menya-nishiki-order.db` |
| `JWT_SECRET` | `menya_nishiki_jwt_secret_2026_change_in_production` |

⚠️ **重要**: 
- すべての環境変数を正確に入力してください
- `JWT_SECRET` は本番環境では必ず変更してください

---

### ステップ 6: 永続ディスク（SQLite用）を追加

1. さらに下にスクロールして **「Add Disk」** ボタンをクリック
2. 以下を入力：

| 項目 | 入力値 |
|------|--------|
| **Name** | `sqlite-data` |
| **Mount Path** | `/data` |
| **Size** | `1` (GB) |

3. **「Save」** をクリック

---

### ステップ 7: デプロイを開始

1. すべての設定を確認
2. 画面下部の **「Create Web Service」** ボタンをクリック
3. デプロイが自動的に開始されます

---

### ステップ 8: デプロイログを確認

1. デプロイ画面が表示されます
2. 「Logs」タブでリアルタイムログを確認
3. 以下のメッセージが表示されるまで待ちます（5-10分）：

```
==> Building...
npm install
added 527 packages

==> Deploying...
==> Starting service...
Server is running on port 5003
Environment: production
```

4. 画面上部に **「Live」** と表示されたらデプロイ成功です

---

### ステップ 9: バックエンドURLを確認

1. 画面上部に表示されるURLをコピーします
   - 例: `https://menya-nishiki-backend.onrender.com`
2. このURLを**メモ帳などに保存**してください（次のVercelデプロイで使用）

---

### ステップ 10: バックエンド動作確認

ターミナルで以下のコマンドを実行：

```bash
# ヘルスチェック（YOUR_URLを実際のURLに置き換え）
curl https://YOUR_URL.onrender.com/api/health
```

**期待される結果:**
```json
{"status":"ok","timestamp":"2026-02-13T..."}
```

✅ この JSON が返ってきたらバックエンドデプロイ成功です！

---

## 🟢 PART 2: Vercel でフロントエンドをデプロイ

### ステップ 1: Vercel にアクセス

1. 新しいタブで https://vercel.com を開く
2. 右上の **「Sign In」** をクリック
3. **GitHub アカウント**でサインイン

---

### ステップ 2: 新しいプロジェクトをインポート

1. ダッシュボードで **「Add New...」** ボタンをクリック
2. ドロップダウンから **「Project」** を選択

---

### ステップ 3: リポジトリを選択

1. 「Import Git Repository」画面が表示されます
2. 検索ボックスに **「menya-nishiki」** と入力
3. **「menya-nishiki-system-cloud」** が表示されます
4. 右側の **「Import」** ボタンをクリック

---

### ステップ 4: プロジェクト設定

以下の項目を確認・入力します：

#### 基本設定

| 項目 | 値 |
|------|-----|
| **Project Name** | `menya-nishiki-system-cloud` (自動入力) |
| **Framework Preset** | `Vite` (自動検出) |
| **Root Directory** | `./` (デフォルト) |

#### ビルド設定

| 項目 | 値 |
|------|-----|
| **Build Command** | `npm run build` (自動入力) |
| **Output Directory** | `dist` (自動入力) |
| **Install Command** | `npm install` (自動入力) |

---

### ステップ 5: 環境変数を設定（重要！）

1. **「Environment Variables」** セクションを展開
2. 以下の環境変数を追加：

#### 環境変数 1
- **Key**: `VITE_API_URL`
- **Value**: `https://YOUR_RENDER_URL.onrender.com/api`
  
  ⚠️ **重要**: 
  - `YOUR_RENDER_URL` を **PART 1 ステップ 9** でメモしたRenderのURLに置き換えてください
  - 末尾に `/api` を**必ず**付けてください
  - 例: `https://menya-nishiki-backend.onrender.com/api`

#### 環境変数 2
- **Key**: `NODE_ENV`
- **Value**: `production`

---

### ステップ 6: デプロイを開始

1. すべての設定を確認
2. **「Deploy」** ボタンをクリック
3. デプロイが自動的に開始されます

---

### ステップ 7: デプロイログを確認

1. ビルドログが表示されます
2. 以下のメッセージが表示されるまで待ちます（3-5分）：

```
Running "npm install"
added 527 packages

Running "npm run build"
vite v5.4.21 building for production...
✓ 1642 modules transformed.
dist/index.html                   0.43 kB
dist/assets/index-CE8DXIyO.css    0.39 kB
dist/assets/index-CHJYZ8-S.js   385.64 kB
✓ built in 4.21s

Build Completed
```

3. **「Congratulations!」** が表示されたらデプロイ成功です

---

### ステップ 8: デプロイURLを確認

1. 画面に表示される **「Visit」** ボタンをクリック
2. または、画面上部のURLをコピー
   - 例: `https://menya-nishiki-system-cloud.vercel.app`

---

### ステップ 9: フロントエンド動作確認

1. ブラウザでVercelのURLを開く
2. **ログイン画面**が表示されることを確認

---

## ✅ PART 3: 統合テスト

### ステップ 1: ログイン

1. フロントエンド（Vercel URL）を開く
2. 以下の認証情報を入力：
   - **ユーザー名**: `麺家弍色`
   - **パスワード**: `admin123`
3. **「ログイン」** ボタンをクリック

✅ ダッシュボードが表示されたら成功！

---

### ステップ 2: 在庫登録テスト

1. 左メニューから **「在庫管理」** をクリック
2. **「新規登録」** ボタンをクリック
3. 以下を入力：
   - **商品名**: `ねぎ`
   - **カテゴリ**: `野菜`
   - **数量**: `10`
   - **単価**: `220`
   - **単位**: `個`
4. **「保存」** ボタンをクリック

✅ 「在庫を登録しました」と表示されたら成功！

---

### ステップ 3: キャッシュフロー確認

1. 左メニューから **「会計帳簿」** → **「キャッシュフロー計算書」** をクリック
2. 期間を今月に設定
3. **「検索」** ボタンをクリック

**期待される結果:**
- 営業キャッシュフロー
  - 営業支出: **¥2,200**
  - 純額: **-¥2,200**

✅ キャッシュフローに反映されていたら成功！

---

### ステップ 4: 在庫出庫テスト

1. **「在庫管理」** に戻る
2. 登録した「ねぎ」の行の **「出庫」** ボタンをクリック
3. **出庫数量**: `3` を入力
4. **「保存」** をクリック

✅ 「在庫を更新しました」と表示されたら成功！

---

### ステップ 5: 損益計算書確認

1. **「会計帳簿」** → **「損益計算書」** をクリック
2. 期間を今月に設定
3. **「検索」** ボタンをクリック

**期待される結果:**
- 売上原価: **¥660** (= ¥220 × 3個)
- 粗利益: **-¥660**

✅ 損益計算書に反映されていたら成功！

---

## 🎉 デプロイ完了！

すべてのテストが成功したら、デプロイは完全に成功しています。

### 📊 デプロイ情報まとめ

| サービス | URL | 状態 |
|----------|-----|------|
| **バックエンド (Render)** | https://YOUR_RENDER_URL.onrender.com | ✅ Live |
| **フロントエンド (Vercel)** | https://YOUR_VERCEL_URL.vercel.app | ✅ Ready |
| **GitHub リポジトリ** | https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud | ✅ 最新 |

### 🔐 ログイン情報

- **ユーザー名**: `麺家弍色`
- **パスワード**: `admin123`

⚠️ **セキュリティ重要**: 本番運用前に必ずパスワードを変更してください！

---

## 🔧 トラブルシューティング

### ❌ Renderで "Build failed"

1. ログを確認して具体的なエラーを特定
2. 環境変数 `DB_PATH=/data/menya-nishiki-order.db` が設定されているか確認
3. ディスクが正しくマウントされているか確認
4. 「Manual Deploy」→「Deploy latest commit」で再デプロイ

### ❌ Vercelで "Build failed"

1. 環境変数 `VITE_API_URL` が正しいか確認
   - Renderの正しいURLが設定されているか
   - 末尾に `/api` が付いているか
2. Settings → Redeploy で再デプロイ

### ❌ ログイン画面が表示されるが真っ白

1. ブラウザのコンソール（F12）でエラーを確認
2. 環境変数 `VITE_API_URL` が正しいか確認
3. Renderのバックエンドが「Live」状態か確認
4. `/api/health` エンドポイントが応答するか確認

### ❌ ログインできない

1. デフォルト認証情報を確認:
   - ユーザー名: `麺家弍色`
   - パスワード: `admin123`
2. Renderの環境変数 `RESET_DB=false` を確認
3. 一度 `RESET_DB=true` に変更してデプロイ
4. その後 `RESET_DB=false` に戻して再デプロイ

### ❌ CORSエラー

1. Renderの環境変数 `SERVE_FRONTEND=false` を確認
2. 両方のサービスを再デプロイ
3. しばらく待つ（1-2分）

---

## 📞 サポート

問題が解決しない場合：

- **Render ドキュメント**: https://render.com/docs
- **Vercel ドキュメント**: https://vercel.com/docs
- **GitHub リポジトリ**: https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud

---

**作成日**: 2026-02-13  
**バージョン**: v2.0.0  
**最終更新**: ead3679

このガイドに従ってデプロイを進めてください 🚀
