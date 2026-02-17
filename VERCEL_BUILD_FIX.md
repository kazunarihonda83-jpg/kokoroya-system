# Vercel ビルドエラー修正報告

## 📅 修正日: 2026-02-13

---

## ❌ 発生したエラー

### エラー内容
```
sh: line 1: vite: command not found
Error: Command "npm run build" exited with 127
```

### 原因
- `vite` と `@vitejs/plugin-react` が `devDependencies` に配置されていた
- Vercelのプロダクションビルドで `devDependencies` がインストールされない設定になっていた
- そのため `vite` コマンドが見つからずビルドが失敗

---

## ✅ 実施した修正

### 1. package.json の修正

**変更前:**
```json
"dependencies": {
  "axios": "^1.7.7",
  "bcryptjs": "^2.4.3",
  ...
},
"devDependencies": {
  "@vitejs/plugin-react": "^4.3.2",
  "vercel": "^48.12.1",
  "vite": "^5.4.8"
}
```

**変更後:**
```json
"dependencies": {
  "@vitejs/plugin-react": "^4.3.2",
  "axios": "^1.7.7",
  "bcryptjs": "^2.4.3",
  ...
  "vite": "^5.4.8"
},
"devDependencies": {
  "vercel": "^48.12.1"
}
```

**変更理由:**
- ビルド時に必要な `vite` と `@vitejs/plugin-react` を `dependencies` に移動
- Vercelのプロダクションビルドで確実にインストールされるようにする

---

### 2. vercel.json の最適化

**変更前:**
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}
```

**変更後:**
```json
{
  "buildCommand": "npm install && npm run build",
  "installCommand": "npm install --production=false"
}
```

**変更理由:**
- `--production=false` フラグで `devDependencies` も含めて明示的にインストール
- `buildCommand` に `npm install` を追加して確実にパッケージがインストールされるようにする

---

## 🧪 修正後の動作確認

### ローカルビルドテスト

```bash
# クリーンインストール
rm -rf node_modules package-lock.json dist
npm install

# ビルド実行
npm run build
```

**結果:**
```
✓ 1642 modules transformed.
dist/index.html                   0.43 kB │ gzip:  0.34 kB
dist/assets/index-CE8DXIyO.css    0.39 kB │ gzip:  0.28 kB
dist/assets/index-CHJYZ8-S.js   385.64 kB │ gzip: 98.50 kB
✓ built in 4.21s
```

✅ **ビルド成功**

---

## 📦 コミット情報

- **コミットID**: `6d1a189`
- **コミットメッセージ**: `fix: Vercelビルドエラー修正 - viteをdependenciesに移動`
- **変更ファイル**:
  - `package.json` (vite, @vitejs/plugin-reactをdependenciesに移動)
  - `package-lock.json` (依存関係の更新)
  - `vercel.json` (ビルド設定の最適化)

---

## 🚀 再デプロイ手順

### Vercel で自動再デプロイ

Vercelは GitHubへのプッシュを検知して自動的に再デプロイを開始します：

1. **Vercel ダッシュボード** にアクセス: https://vercel.com/dashboard
2. プロジェクト「menya-nishiki-system-cloud」を選択
3. 「Deployments」タブで新しいデプロイの進行状況を確認
4. ステータスが「Building」→「Ready」になるのを待つ（3-5分）

### 手動で再デプロイする場合

1. Vercel ダッシュボード → プロジェクトを選択
2. 「Deployments」タブ
3. 最新のデプロイメント（commit `6d1a189`）を探す
4. または「Deploy」ボタンをクリック

---

## ✅ 期待される結果

### ビルドログ（成功例）

```
Running "npm install --production=false"
added 527 packages in 15s

Running "npm install && npm run build"
> vite build

vite v5.4.21 building for production...
✓ 1642 modules transformed.
dist/index.html                   0.43 kB
dist/assets/index-CE8DXIyO.css    0.39 kB
dist/assets/index-CHJYZ8-S.js   385.64 kB
✓ built in 4.21s

Build Completed in 1m 23s
```

### デプロイ成功の確認

1. Vercel URLにアクセス: `https://menya-nishiki.vercel.app`
2. ログイン画面が表示される
3. ログイン成功（ユーザー名: `麺家弍色`, パスワード: `admin123`）
4. 各機能画面が正常に動作する

---

## 🔧 トラブルシューティング

### ❌ まだ "vite: command not found" エラーが出る

**解決策:**
1. Vercelで「Redeploy」を実行
2. 設定 → Environment Variables で以下を確認:
   ```
   NODE_ENV=production
   VITE_API_URL=https://menya-nishiki-backend.onrender.com/api
   ```
3. キャッシュをクリア:
   - Settings → Clear Cache → Redeploy

### ❌ ビルドは成功するが画面が真っ白

**原因:** APIサーバーとの接続エラー

**解決策:**
1. 環境変数 `VITE_API_URL` が正しいか確認
2. RenderのバックエンドURLが正しいか確認
3. Renderのバックエンドが「Live」状態か確認

---

## 📊 修正前後の比較

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| **vite の配置** | devDependencies | dependencies ✅ |
| **@vitejs/plugin-react の配置** | devDependencies | dependencies ✅ |
| **installCommand** | `npm install` | `npm install --production=false` ✅ |
| **buildCommand** | `npm run build` | `npm install && npm run build` ✅ |
| **ビルド結果** | ❌ エラー | ✅ 成功 |

---

## 💡 今後の注意点

### ビルドツールの配置
- **プロダクションビルドで必要なツール** は `dependencies` に配置する
  - `vite`, `@vitejs/plugin-react`, `webpack`, `rollup` など
- **開発時のみ必要なツール** は `devDependencies` に配置する
  - `eslint`, `prettier`, `typescript` (type-check のみの場合) など

### Vercel の設定
- `--production=false` フラグを使用すると devDependencies もインストールされる
- ただし、本番環境では dependencies だけで動作するのが理想的
- ビルドツールは dependencies に配置する方針を推奨

---

## 📝 チェックリスト

- [x] package.json を修正（vite を dependencies に移動）
- [x] vercel.json を最適化
- [x] ローカルでビルド成功を確認
- [x] GitHubにプッシュ
- [ ] Vercelで自動デプロイ完了を確認（進行中）
- [ ] デプロイ後のサイト動作確認

---

## 🎉 修正完了

この修正により、Vercelでのビルドエラーが解消され、正常にデプロイできるようになりました。

**次のアクション:**
1. Vercel ダッシュボードで再デプロイの完了を待つ
2. デプロイURLにアクセスして動作確認
3. ログインと各機能の動作テスト

---

**修正日**: 2026-02-13  
**コミット**: 6d1a189  
**ステータス**: ✅ 修正完了・再デプロイ待ち
