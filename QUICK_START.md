# 🚀 なかまるシステム クイックスタートガイド

## 📍 現在の状態

✅ **ローカル環境で完全稼働中！**

---

## 🌐 今すぐアクセス

### なかまるシステム
**URL**: https://3002-iwz00ie3gdkhvxpx2ni1z-82b888ba.sandbox.novita.ai

**ログイン情報**:
- ユーザー名: `鉄板焼き居酒屋なかまる`
- パスワード: `admin123`

### TSODOIシステム (比較用)
**URL**: https://3001-iwz00ie3gdkhvxpx2ni1z-82b888ba.sandbox.novita.ai

**ログイン情報**:
- ユーザー名: `13湯麺集TSUDOI`
- パスワード: `admin123`

---

## 📦 デプロイ状況

### ✅ 完了済み
- ローカル環境構築
- データベース初期化
- バックエンド起動 (ポート 5001)
- フロントエンド起動 (ポート 3002)
- Git管理開始

### ⏳ 次のステップ
1. **GitHubリポジトリ作成** → `GITHUB_SETUP.md` を参照
2. **Renderデプロイ** → `NAKAMARU_DEPLOY_GUIDE.md` を参照
3. **Vercelデプロイ** → `NAKAMARU_DEPLOY_GUIDE.md` を参照

---

## 🎯 3ステップでデプロイ

### ステップ 1: GitHub
```bash
# 1. https://github.com で新規リポジトリ作成
#    名前: nakamaru-teppanyaki-system

# 2. プッシュ
cd /home/user/webapp/nakamaru-order-management-system
git remote add origin https://github.com/YOUR_USERNAME/nakamaru-teppanyaki-system.git
git push -u origin main
```

### ステップ 2: Render (バックエンド)
1. https://render.com にアクセス
2. 「New + → Web Service」を選択
3. GitHubリポジトリを接続
4. 設定:
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
   - Environment: `PORT=5001`

### ステップ 3: Vercel (フロントエンド)
1. https://vercel.com にアクセス
2. 「Add New... → Project」を選択
3. GitHubリポジトリをインポート
4. 設定:
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Environment: `VITE_API_URL=https://YOUR-RENDER-URL/api`

---

## 📚 詳細ドキュメント

| ドキュメント | 内容 |
|------------|------|
| `GITHUB_SETUP.md` | GitHub設定の詳細手順 |
| `NAKAMARU_DEPLOY_GUIDE.md` | 完全なデプロイガイド |
| `README.md` | システム概要と機能一覧 |
| `/home/user/webapp/SYSTEMS_COMPARISON.md` | TSUDOI vs なかまる 比較表 |

---

## ✅ 動作確認済み

### システム独立性
- ✅ TSODOIとなかまるが独立稼働
- ✅ データベースも完全に分離
- ✅ ポートも分離 (5000/3001 vs 5001/3002)

### 機能テスト
- ✅ ログイン
- ✅ 書類作成
- ✅ PDF出力
- ✅ プレビュー機能
- ✅ 発注管理
- ✅ 在庫管理

---

## 🆘 困ったら

### ローカル環境の再起動

```bash
# バックエンド再起動
cd /home/user/webapp/nakamaru-order-management-system
lsof -ti:5001 | xargs kill -9
node server/index.js > /tmp/nakamaru_backend.log 2>&1 &

# フロントエンド再起動
lsof -ti:3002 | xargs kill -9
PORT=3002 npm run dev
```

### ログ確認

```bash
# バックエンドログ
tail -f /tmp/nakamaru_backend.log

# システムヘルスチェック
curl http://localhost:5001/api/health
```

---

## 📞 サポート

質問や問題がある場合は、各ドキュメントを参照してください:
- GitHub設定: `GITHUB_SETUP.md`
- デプロイ: `NAKAMARU_DEPLOY_GUIDE.md`
- システム比較: `/home/user/webapp/SYSTEMS_COMPARISON.md`

---

**最終更新**: 2026-01-22

🎉 **おめでとうございます！なかまるシステムがローカルで稼働中です！**
