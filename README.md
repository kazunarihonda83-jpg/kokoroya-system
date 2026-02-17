# 麺家弍色 SYSTEM CLOUD

北海道河東郡音更町の飲食店「麺家弍色」向けの統合受発注管理システムです。

## 🌟 特徴

- **受注取引管理**: 受注データの完全管理、CSV一括登録
- **会計帳簿**: 税額控除帳、現金出納帳、請求判明書、キャッシュフロー計算書
- **在庫管理**: リアルタイム在庫追跡、アラート機能
- **書類管理**: 見積書、発注書、納品書、請求書の作成・管理
- **顧客管理**: 顧客情報・連絡先管理
- **仕入先管理**: 仕入先情報・支払条件管理
- **ダッシュボード**: 売上・支出の可視化、最近の取引表示

## 🚀 本番環境

- **フロントエンド**: https://menya-nishiki-system-cloud.vercel.app （予定）
- **バックエンド**: https://menya-nishiki-backend.onrender.com （予定）

## 🔐 ログイン情報

- **ユーザー名**: 麺家弍色
- **パスワード**: admin123

## 🛠️ 技術スタック

### フロントエンド
- React 18
- Vite
- React Router v6
- Lucide React Icons

### バックエンド
- Node.js
- Express
- SQLite3 (better-sqlite3)
- JWT認証
- bcryptjs

## 📦 ローカル開発環境

### 必要条件
- Node.js 18以上
- npm 8以上

### セットアップ

1. **リポジトリをクローン**
```bash
git clone https://github.com/kazunarihonda83-jpg/nakamaru-teppanyaki-system.git
cd nakamaru-teppanyaki-system
git checkout menya-nishiki-main
```

2. **依存関係をインストール**
```bash
npm install
```

3. **環境変数を設定**
```bash
# .env.developmentファイルを作成（既に存在する場合はスキップ）
cp .env.example .env.development
```

4. **バックエンドを起動** (別ターミナル)
```bash
node server/index.js
```
バックエンドは http://localhost:5003 で起動します。

5. **フロントエンドを起動**
```bash
npm run dev
```
フロントエンドは http://localhost:3009 で起動します。

### ビルド

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

## 📚 デプロイ手順

詳細なデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### 簡易手順

1. **Renderでバックエンドをデプロイ**
   - Instance Type: Starter ($7/月)
   - 永続化ディスク: 1GB (/data)

2. **Vercelでフロントエンドをデプロイ**
   - 環境変数 `VITE_API_URL` を設定

## 📂 プロジェクト構造

```
menya-nishiki-order-management-system/
├── src/                      # フロントエンドソース
│   ├── components/           # Reactコンポーネント
│   ├── contexts/             # Reactコンテキスト
│   ├── pages/                # ページコンポーネント
│   ├── utils/                # ユーティリティ
│   ├── App.jsx               # アプリケーションルート
│   └── main.jsx              # エントリーポイント
├── server/                   # バックエンドソース
│   ├── routes/               # APIルート
│   ├── middleware/           # ミドルウェア
│   ├── database-init.js      # データベース初期化
│   ├── database.js           # データベース接続
│   └── index.js              # サーバーエントリーポイント
├── public/                   # 静的ファイル
├── dist/                     # ビルド出力（自動生成）
├── .env.development          # 開発環境変数
├── .env.production.example   # 本番環境変数の例
├── vite.config.js            # Vite設定
├── vercel.json               # Vercel設定
├── render.yaml               # Render設定
├── package.json              # 依存関係
├── DEPLOYMENT.md             # デプロイ手順書
└── README.md                 # このファイル
```

## 🎯 主要機能

### 受注取引管理
- 受注データの登録・編集・削除
- ステータス管理（受注済み、処理中、出荷済み、納品完了、キャンセル）
- 支払状況管理（未払い、一部払い、支払済み）
- CSV一括登録
- 検索・フィルター

### 会計帳簿
- **税額控除帳**: 消費税控除対象取引の管理
- **現金出納帳**: 現金収支の記録と残高管理
- **請求判明書**: 請求書の発行・入金管理
- **キャッシュフロー計算書**: 営業・投資・財務活動のキャッシュフロー

### 在庫管理
- 在庫数量のリアルタイム追跡
- 在庫アラート（閾値設定）
- 在庫取引履歴

### 書類管理
- 見積書作成・発行
- 発注書作成・発行
- 納品書作成・発行
- 請求書作成・発行
- PDF出力

### 設定
- プロフィール設定
- メールアドレス変更
- 消費税表示設定（税抜/税込、税率、端数処理）
- パスワード変更

## 🔒 セキュリティ

- JWT認証
- パスワードハッシュ化（bcrypt）
- 環境変数による機密情報管理
- CORS設定

## 📞 サポート

### 会社情報
- **会社名**: 麺家弍色
- **住所**: 〒080-0101 北海道河東郡音更町大通6-6
- **電話番号**: 070-2184-0992
- **メールアドレス**: 0hp2c84c787541j@ezweb.ne.jp
- **業種**: 飲食業

### 開発情報
- **GitHubリポジトリ**: https://github.com/kazunarihonda83-jpg/nakamaru-teppanyaki-system
- **ブランチ**: menya-nishiki-main

## 📄 ライセンス

このプロジェクトは麺家弍色専用のシステムです。

---

**Built with ❤️ for 麺家弍色**
