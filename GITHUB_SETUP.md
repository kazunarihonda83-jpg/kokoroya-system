# 🔧 GitHubリポジトリ作成手順

## 手動でGitHubリポジトリを作成する方法

### ステップ 1: GitHubでリポジトリを作成

1. **GitHubにログイン**
   - https://github.com にアクセス
   - アカウント `kazunarihonda83-jpg` でログイン

2. **新規リポジトリ作成**
   - 右上の「+」アイコンをクリック
   - 「New repository」を選択

3. **リポジトリ設定**
   ```
   Repository name: nakamaru-teppanyaki-system
   Description: 鉄板焼き居酒屋なかまる 受注管理システム
   
   ⚪ Public  ⚫ Private  (どちらか選択)
   
   ❌ Add a README file (チェックしない)
   ❌ Add .gitignore (チェックしない)
   ❌ Choose a license (選択しない)
   ```

4. **「Create repository」をクリック**

---

### ステップ 2: ローカルからプッシュ

GitHubでリポジトリを作成した後、以下のコマンドを実行:

```bash
cd /home/user/webapp/nakamaru-order-management-system

# リモートURLを設定
git remote set-url origin https://github.com/kazunarihonda83-jpg/nakamaru-teppanyaki-system.git

# または、リモートがない場合は追加
git remote add origin https://github.com/kazunarihonda83-jpg/nakamaru-teppanyaki-system.git

# プッシュ
git push -u origin main
```

---

### ステップ 3: プッシュ確認

```bash
# リモートURL確認
git remote -v

# プッシュ履歴確認
git log --oneline
```

---

## 🔄 代替方法: 既存のTSUDOIリポジトリを使用する場合

もし専用のリポジトリを作らず、TSUDOIリポジトリのブランチとして管理する場合:

```bash
cd /home/user/webapp/nakamaru-order-management-system

# TSUDOIリポジトリを参照
git remote add origin https://github.com/kazunarihonda83-jpg/tsudoi-order-management-system.git

# 新しいブランチを作成
git checkout -b nakamaru-system

# プッシュ
git push -u origin nakamaru-system
```

**注意**: この方法では両システムが同じリポジトリで管理されます。
完全独立のためには、別リポジトリの作成を推奨します。

---

## 📋 現在の状態

### ローカル Git 設定
```
ディレクトリ: /home/user/webapp/nakamaru-order-management-system
ブランチ: main
コミット数: 2
最新コミット: d78a21b (docs: デプロイガイドを追加)
```

### コミット履歴
```
d78a21b - docs: デプロイガイドを追加
16810b7 - feat: 鉄板焼き居酒屋なかまる 受注管理システム初回コミット
```

---

## ✅ プッシュが成功したら

次のステップに進みます:

1. **Render デプロイ**
   - https://render.com
   - GitHubリポジトリを接続
   - バックエンドをデプロイ

2. **Vercel デプロイ**
   - https://vercel.com
   - GitHubリポジトリをインポート
   - フロントエンドをデプロイ

詳細は `NAKAMARU_DEPLOY_GUIDE.md` を参照してください。

---

## 🆘 トラブルシューティング

### 認証エラーが出る場合

```bash
# Git credentialを確認
git config --global credential.helper

# Personal Access Token (PAT) を使用する場合
# GitHubで設定 → Developer settings → Personal access tokens → Generate new token
# repo権限を付与

# Tokenを使ってプッシュ
git push https://YOUR_TOKEN@github.com/kazunarihonda83-jpg/nakamaru-teppanyaki-system.git main
```

### リモートURL変更

```bash
# 現在のリモート削除
git remote remove origin

# 新しいリモート追加
git remote add origin https://github.com/kazunarihonda83-jpg/nakamaru-teppanyaki-system.git

# 確認
git remote -v
```

---

**作成日**: 2026-01-22
