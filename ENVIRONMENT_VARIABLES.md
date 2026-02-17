# 🔧 環境変数設定 - 完全版

## 📦 Render バックエンド環境変数（6個）

以下を**コピー＆ペースト**してください：

---

### 1️⃣ NODE_ENV
```
NODE_ENV
```
**値:**
```
production
```

---

### 2️⃣ PORT
```
PORT
```
**値:**
```
5003
```

---

### 3️⃣ SERVE_FRONTEND
```
SERVE_FRONTEND
```
**値:**
```
false
```

---

### 4️⃣ RESET_DB ⚠️ 重要
```
RESET_DB
```
**値:**
```
true
```

> ⚠️ **注意**: 初回デプロイ時のみ `true`。デプロイ完了後すぐに `false` に変更してください！

---

### 5️⃣ DB_PATH
```
DB_PATH
```
**値:**
```
/data/menya-nishiki-order.db
```

---

### 6️⃣ JWT_SECRET ⚠️ セキュリティ重要
```
JWT_SECRET
```
**値:**
```
menya_nishiki_secret_2026_CHANGE_THIS_IN_PRODUCTION
```

> ⚠️ **本番環境では必ず変更してください！** ランダムな文字列を使用することを推奨します。

---

## 🌐 Vercel フロントエンド環境変数（2個）

以下を**コピー＆ペースト**してください：

---

### 1️⃣ VITE_API_URL ⚠️ 超重要
```
VITE_API_URL
```
**値:**
```
https://【Render URL】/api
```

**例:**
```
https://menya-nishiki-prod-final.onrender.com/api
```

> ⚠️ **必ず末尾に `/api` を付けてください！**

---

### 2️⃣ NODE_ENV
```
NODE_ENV
```
**値:**
```
production
```

---

## 📋 環境変数一覧表

### Render（6個）

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NODE_ENV` | `production` | Node.js 実行環境 |
| `PORT` | `5003` | サーバーポート |
| `SERVE_FRONTEND` | `false` | フロントエンド配信無効 |
| `RESET_DB` | `true` → `false` | DB初期化フラグ（初回のみtrue） |
| `DB_PATH` | `/data/menya-nishiki-order.db` | データベースファイルパス |
| `JWT_SECRET` | `menya_nishiki_secret_2026_CHANGE_THIS_IN_PRODUCTION` | JWT署名キー（本番では変更必須） |

### Vercel（2個）

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `VITE_API_URL` | `https://【Render URL】/api` | バックエンドAPIのURL（末尾 /api 必須） |
| `NODE_ENV` | `production` | Node.js 実行環境 |

---

## 🔐 セキュリティ推奨事項

### JWT_SECRET の生成方法

以下のコマンドで強力なランダム文字列を生成できます：

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

生成例:
```
a7f3c8e1b2d4f6a8c9e0b1d3f5a7c9e1b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2
```

---

## ⚠️ 重要な注意事項

### RESET_DB について

1. **初回デプロイ時**: `RESET_DB=true` で開始
2. **ログ確認**: 以下のメッセージを確認
   ```
   ✅ Database initialized at: /data/menya-nishiki-order.db
   ✅ Admin user created: 麺家弍色
   ✅ 勘定科目追加: [1300] 商品
   ✅ 勘定科目追加: [5100] 売上原価
   ```
3. **すぐに変更**: `RESET_DB=false` に変更
4. **理由**: `true` のままだと再起動時にデータが消える

### VITE_API_URL について

1. **必ず末尾に `/api` を付ける**
   - ✅ 正しい: `https://menya-nishiki-prod-final.onrender.com/api`
   - ❌ 間違い: `https://menya-nishiki-prod-final.onrender.com`

2. **Render の URL を正確にコピー**
   - Render のダッシュボードからコピー
   - 手入力は避ける

---

## 📝 設定手順

### Render での設定

1. サービス作成画面で「**Environment Variables**」セクションを見つける
2. 「**Add Environment Variable**」をクリック
3. 上記の6個の変数を1つずつ追加
4. 各変数の「Key」と「Value」を正確に入力

### Vercel での設定

1. プロジェクトインポート画面で「**Environment Variables**」セクションを見つける
2. 「**Add**」をクリック
3. 上記の2個の変数を1つずつ追加
4. 各変数の「Name」と「Value」を正確に入力

---

## ✅ チェックリスト

### Render
- [ ] `NODE_ENV=production` を追加
- [ ] `PORT=5003` を追加
- [ ] `SERVE_FRONTEND=false` を追加
- [ ] `RESET_DB=true` を追加（初回のみ）
- [ ] `DB_PATH=/data/menya-nishiki-order.db` を追加
- [ ] `JWT_SECRET` を追加（セキュアな値に変更推奨）
- [ ] デプロイ完了後 `RESET_DB=false` に変更

### Vercel
- [ ] `VITE_API_URL` を追加（Render URL + `/api`）
- [ ] `NODE_ENV=production` を追加

---

**作成日**: 2026-02-16  
**最終更新**: 2026-02-16
