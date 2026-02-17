# Vercel 手動再デプロイ手順

## 問題の状況

### 確認された事実
- ✅ GitHubに最新コミット（`eec7122`）がプッシュ済み
- ✅ ソースコードは正しく「麺家弍色」に変更済み
- ✅ ビルドファイルにも「麺家弍色」が含まれている
- ❌ Vercelは古いコミット（`e4b047a`）をデプロイ中
  - このコミットは会社名変更**前**のもの

### 最新コミット履歴
```
bbd7867 - docs: 会社名変更完了レポートを追加
eec7122 - fix: 会社名を「システムクラウド株式会社」から「麺家弍色」に変更  ← この変更が必要
e4b047a - docs: Renderバックエンドデプロイ完了報告を追加  ← Vercelが現在使用中
```

---

## 解決方法：Vercelで手動再デプロイ

### オプション1: Vercelダッシュボードで再デプロイ

#### Step 1: Vercelダッシュボードにアクセス
```
https://vercel.com/dashboard
```

#### Step 2: プロジェクトを選択
- プロジェクト名: `menya-nishiki-frontend`

#### Step 3: Deploymentsタブを開く
- 上部メニューの「Deployments」をクリック

#### Step 4: 最新のデプロイを確認
- 一番上のデプロイを確認
- コミットハッシュが `e4b047a` の場合、これは古い

#### Step 5: 新しいデプロイをトリガー
以下のいずれかの方法：

##### 方法A: 「Redeploy」ボタン
1. 最新のデプロイをクリック
2. 右上の「...」メニューをクリック
3. 「Redeploy」を選択
4. 「Use existing Build Cache」のチェックを**外す**
5. 「Redeploy」をクリック

##### 方法B: GitHubから強制トリガー
1. GitHubリポジトリに空のコミットをプッシュ
   ```bash
   git commit --allow-empty -m "chore: Vercel再デプロイをトリガー"
   git push origin main
   ```
2. Vercelが自動的に新しいデプロイを開始

---

### オプション2: Vercel CLIで再デプロイ

#### Step 1: Vercel CLIをインストール（未インストールの場合）
```bash
npm install -g vercel
```

#### Step 2: Vercelにログイン
```bash
vercel login
```

#### Step 3: プロジェクトディレクトリに移動
```bash
cd /home/user/webapp/menya-nishiki-order-management-system
```

#### Step 4: 本番環境にデプロイ
```bash
vercel --prod
```

---

## 推奨手順（最も簡単）

### GitHubから空のコミットで強制デプロイ

```bash
cd /home/user/webapp/menya-nishiki-order-management-system

# 空のコミットを作成
git commit --allow-empty -m "chore: Vercel再デプロイをトリガー（会社名変更を反映）"

# GitHubにプッシュ
git push origin main
```

これにより：
1. GitHubの`main`ブランチが更新される
2. Vercelが自動的に新しいデプロイを開始
3. 最新のコード（`eec7122`を含む）がデプロイされる

---

## デプロイ完了後の確認

### 1. Vercelダッシュボードで確認
- コミットハッシュが `eec7122` または `bbd7867` になっている
- Status が「Ready」になっている

### 2. フロントエンドで確認
```
https://menya-nishiki-frontend.vercel.app
```

1. ログイン: ユーザー名=`麺家弍色`, パスワード=`admin123`
2. ヘッダー左上を確認: **「麺家弍色」**と表示される
3. ユーザーメニュー（右上）を確認: **「麺家弍色」**と表示される

### 3. ブラウザキャッシュをクリア
もし古い名前が表示される場合：
- ハードリフレッシュ: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- シークレットモードで確認

---

## トラブルシューティング

### 問題: Vercelが自動デプロイしない

**原因**: GitHub連携の問題、またはVercelの設定

**解決策**:
1. Vercel → プロジェクト → Settings → Git
2. 「Production Branch」が `main` になっているか確認
3. 「Automatically expose System Environment Variables」が有効か確認

### 問題: デプロイは成功したが古い名前が表示される

**原因**: ブラウザキャッシュ

**解決策**:
1. ブラウザのキャッシュを完全にクリア
2. シークレット/プライベートモードで確認
3. 別のブラウザで確認

### 問題: ビルドエラーが発生する

**原因**: 環境変数またはビルド設定

**解決策**:
1. Vercel → プロジェクト → Settings → Environment Variables
2. `VITE_API_URL=https://menya-nishiki-backend.onrender.com/api` が設定されているか確認
3. 再デプロイ

---

## まとめ

### 現在の状態
- ✅ コード変更完了
- ✅ GitHubにプッシュ済み
- ❌ Vercelは古いコミットを使用中

### 次のアクション
1. **空のコミットをプッシュ**して再デプロイをトリガー
   ```bash
   git commit --allow-empty -m "chore: Vercel再デプロイをトリガー"
   git push origin main
   ```

2. **Vercelダッシュボード**でデプロイ進捗を確認
   - 約2-3分待つ

3. **フロントエンドURL**にアクセスして確認
   - https://menya-nishiki-frontend.vercel.app
   - ヘッダーとユーザーメニューに「麺家弍色」が表示される

---

作成日: 2026-02-13  
最終更新: 2026-02-13  
ステータス: 対応待ち（Vercel再デプロイが必要）
