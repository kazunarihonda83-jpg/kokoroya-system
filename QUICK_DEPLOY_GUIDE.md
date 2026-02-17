# 麺家弍色システム - クイックデプロイガイド 🚀

## ⏱️ 所要時間: 15分

---

## 📦 準備完了確認

✅ **最新コード**: commit `2a0b661` プッシュ済み  
✅ **ビルド確認**: ローカルビルド成功  
✅ **設定ファイル**: `render.yaml` と `vercel.json` 準備完了  
✅ **環境変数**: `.env.production` 設定済み  

---

## 🎯 デプロイ 3 ステップ

### STEP 1: Render でバックエンドをデプロイ (5分)

1. **Render にアクセス**: https://render.com
2. **新規サービス作成**:
   - 「New +」→「Web Service」
   - GitHubリポジトリを選択: `menya-nishiki-system-cloud`
   - 「Connect」

3. **自動設定を確認** (render.yaml が読み込まれます):
   ```
   Name: menya-nishiki-backend
   Region: Singapore
   Branch: main
   Build: npm install
   Start: node server/index.js
   ```

4. **環境変数を追加**:
   ```
   RESET_DB=false
   DB_PATH=/data/menya-nishiki-order.db
   ```
   ※ その他の変数は `render.yaml` で自動設定されます

5. **ディスクを確認**:
   - Name: `sqlite-data`
   - Mount: `/data`
   - Size: 1GB
   ※ これも `render.yaml` で自動設定されます

6. **「Create Web Service」をクリック**

7. **URLをコピー** (例: `https://menya-nishiki-backend.onrender.com`)

---

### STEP 2: Vercel でフロントエンドをデプロイ (5分)

1. **Vercel にアクセス**: https://vercel.com
2. **新規プロジェクト作成**:
   - 「Add New...」→「Project」
   - GitHubリポジトリを選択: `menya-nishiki-system-cloud`
   - 「Import」

3. **自動設定を確認** (vercel.json が読み込まれます):
   ```
   Framework: Vite
   Build: npm run build
   Output: dist
   ```

4. **環境変数を追加**:
   - Key: `VITE_API_URL`
   - Value: `https://menya-nishiki-backend.onrender.com/api`
     ※ STEP 1 の URL に `/api` を追加
   
   - Key: `NODE_ENV`
   - Value: `production`

5. **「Deploy」をクリック**

6. **URLを確認** (例: `https://menya-nishiki.vercel.app`)

---

### STEP 3: 動作確認 (5分)

#### バックエンド確認

```bash
# ヘルスチェック
curl https://menya-nishiki-backend.onrender.com/api/health

# 期待される結果:
# {"status":"ok","timestamp":"2026-02-13T..."}

# ログインテスト
curl -X POST https://menya-nishiki-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"麺家弍色","password":"admin123"}'

# 期待される結果:
# {"token":"eyJhbGciOiJ...","user":{...}}
```

#### フロントエンド確認

1. ブラウザで Vercel URL を開く
2. ログイン画面が表示される
3. ログイン:
   - ユーザー名: `麺家弍色`
   - パスワード: `admin123`
4. ダッシュボードが表示される

#### 統合テスト

1. **在庫登録テスト**:
   - 在庫管理 → 新規登録
   - 商品: `ねぎ`
   - 数量: `10`
   - 単価: `220`
   - 保存

2. **財務諸表確認**:
   - 会計帳簿 → 損益計算書
   - 会計帳簿 → 貸借対照表
   - 会計帳簿 → キャッシュフロー計算書

3. **在庫出庫テスト**:
   - 在庫管理 → 出庫
   - 商品: `ねぎ`
   - 数量: `3`
   - 保存

4. **損益計算書確認**:
   - 売上原価: `660円` が表示されること

---

## ✅ デプロイ成功チェックリスト

### バックエンド (Render)
- [ ] サービスが「Live」状態
- [ ] `/api/health` が応答する
- [ ] ログインAPIが成功する
- [ ] ログに "Server is running" が表示される

### フロントエンド (Vercel)
- [ ] デプロイが「Ready」状態
- [ ] サイトが表示される
- [ ] ログインが成功する
- [ ] 全画面が正常に表示される

### 機能テスト
- [ ] 在庫登録が成功する
- [ ] 在庫出庫が成功する
- [ ] キャッシュフローに反映される
- [ ] 損益計算書に反映される
- [ ] 貸借対照表が正しい

---

## 🔧 よくあるトラブル

### ❌ Renderでエラーが出る

**問題**: "Build failed" または "Deploy failed"

**解決策**:
1. ログを確認
2. 環境変数 `DB_PATH=/data/menya-nishiki-order.db` を追加
3. ディスクが正しくマウントされているか確認
4. 「Manual Deploy」で再デプロイ

### ❌ Vercelで画面が真っ白

**問題**: ブラウザのコンソールに "Failed to fetch" エラー

**解決策**:
1. 環境変数 `VITE_API_URL` が正しいか確認
2. RenderのURLに `/api` を付けているか確認
3. Renderのサービスが「Live」状態か確認
4. Vercelで「Redeploy」

### ❌ CORSエラー

**問題**: "CORS policy" エラー

**解決策**:
1. Renderの環境変数 `SERVE_FRONTEND=false` を確認
2. 両方のサービスを再デプロイ
3. しばらく待つ（Renderの起動に1-2分かかることがあります）

---

## 📊 デプロイ後の確認事項

### 1. セキュリティ

- [ ] デフォルトパスワードを変更
- [ ] JWT_SECRET が自動生成されている（Renderで確認）

### 2. パフォーマンス

- [ ] ページ読み込み速度を確認
- [ ] API応答時間を確認
- [ ] Renderのメトリクスを確認

### 3. データバックアップ

- [ ] 重要データは定期的にエクスポート
- [ ] APIエンドポイントからJSON形式でバックアップ

---

## 🎉 デプロイ完了！

| サービス | URL |
|----------|-----|
| **バックエンド** | https://menya-nishiki-backend.onrender.com |
| **フロントエンド** | https://menya-nishiki.vercel.app |
| **リポジトリ** | https://github.com/kazunarihonda83-jpg/menya-nishiki-system-cloud |

### 🔗 便利なリンク

- [Render ダッシュボード](https://dashboard.render.com)
- [Vercel ダッシュボード](https://vercel.com/dashboard)
- [詳細デプロイマニュアル](./DEPLOYMENT_MANUAL.md)

---

**作成日**: 2026-02-13  
**バージョン**: v1.0.0  
**最終コミット**: 2a0b661
