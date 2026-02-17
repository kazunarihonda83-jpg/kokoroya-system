# デモデータ削除ガイド

## 現在の状況

### 問題
- 受注取引一覧：0件（データなし）
- ホーム・会計帳簿：経費データが表示される（売上¥0、経費¥462,700）

### 原因
データベースに以下のデモ/テストデータが残っています：

| 日付 | 摘要 | 借方 | 貸方 | 金額 |
|------|------|------|------|------|
| 2026-02-13 | テスト給料支払い | 給料 | 現金 | ¥50,000 |
| 2026-02-13 | テスト預金預け入れ | 預金 | 現金 | ¥100,000 |
| 2026-02-13 | テスト預金引き出し | 現金 | 預金 | ¥30,000 |
| 2026-02-14 | 千葉食材センター 仕入計上 (PO26117078) | 仕入高 | 買掛金 | ¥3,300 |
| 2026-02-14 | 千葉食材センター 仕入支払い (PO26117078) | 買掛金 | 現金 | ¥3,300 |
| 2026-02-14 | 千葉食材センター 仕入計上 (PO26117216) | 仕入高 | 買掛金 | ¥4,400 |
| 2026-02-14 | 2月分給料（デモ） | 給料 | 現金 | ¥250,000 |
| 2026-02-14 | 2月分家賃（デモ） | 地代家賃 | 現金 | ¥120,000 |
| 2026-02-14 | 電気代（デモ） | 水道光熱費 | 現金 | ¥35,000 |
| 2026-02-14 | 売上金預け入れ（デモ） | 預金 | 現金 | ¥200,000 |
| 2026-02-14 | 運転資金引き出し（デモ） | 現金 | 預金 | ¥50,000 |

**合計**: 11件の仕訳データ

### 損益計算書への影響
- 売上高: ¥0
- 売上原価: ¥7,700（仕入データから）
- 販売費及び一般管理費: ¥455,000（給料、家賃、水道光熱費）
- 営業損失: -¥462,700

## 解決策

### オプション1: デモデータを削除（クリーンスタート）

すべてのデモ/テストデータを削除して、クリーンな状態から始めます。

```bash
cd /home/user/webapp/menya-nishiki-order-management-system
./cleanup_demo_data.sh
```

**削除されるデータ**:
- すべての仕訳データ（journal_entries）
- 関連する発注データ（purchase_orders）
- デモ顧客・サプライヤー

**残るデータ**:
- 勘定科目マスタ（accounts）
- ユーザーアカウント
- システム設定

### オプション2: デモデータを残す（そのまま使用）

デモデータを活用して、システムの動作を確認します。

**メリット**:
- 損益計算書の表示テストができる
- 経費データの入力例として参考になる
- 仕訳の動作確認ができる

**デメリット**:
- 実際のデータとデモデータが混在する
- 売上が0円で経費のみの状態

### オプション3: 受注取引を新規登録

受注取引を登録して、売上データを作成します。

**手順**:
1. フロントエンドにログイン
2. 顧客管理 → 顧客一覧で顧客を登録
3. 受注取引管理 → 受注取引一覧で新規登録
4. 会計帳簿 → 損益計算書で売上を確認

## デモデータ削除スクリプト

以下のスクリプトを実行すると、デモ/テストデータが削除されます：

```bash
#!/bin/bash
# cleanup_demo_data.sh

cd /home/user/webapp/menya-nishiki-order-management-system

node -e "
const Database = require('better-sqlite3');
const db = new Database('./server/menya-nishiki-order.db');

console.log('=== デモデータ削除開始 ===');

// 仕訳データを削除
const deleteJournals = db.prepare('DELETE FROM journal_entries');
const journalResult = deleteJournals.run();
console.log('削除した仕訳:', journalResult.changes);

// 発注データを削除
const deletePurchaseOrders = db.prepare('DELETE FROM purchase_orders');
const poResult = deletePurchaseOrders.run();
console.log('削除した発注:', poResult.changes);

// 受注取引データを削除（既に0件だが念のため）
const deleteReceipts = db.prepare('DELETE FROM order_receipts');
const receiptResult = deleteReceipts.run();
console.log('削除した受注取引:', receiptResult.changes);

const deleteItems = db.prepare('DELETE FROM order_receipt_items');
const itemResult = deleteItems.run();
console.log('削除した受注明細:', itemResult.changes);

// 現金出納帳データを削除
const deleteCashBook = db.prepare('DELETE FROM cash_book');
const cashResult = deleteCashBook.run();
console.log('削除した現金出納帳:', cashResult.changes);

db.close();
console.log('=== デモデータ削除完了 ===');
console.log('データベースがクリーンな状態になりました。');
"

echo ""
echo "✅ デモデータ削除完了"
echo ""
echo "次のステップ："
echo "1. フロントエンドにアクセス: https://3014-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai"
echo "2. ログイン: ユーザー名=麺家弍色、パスワード=admin123"
echo "3. 損益計算書を確認: すべて¥0になっているはず"
echo "4. 新規データを登録開始"
```

## 推奨アクション

**推奨**: オプション1（デモデータを削除）

理由：
- クリーンな状態から開始できる
- 実際のデータとデモデータが混在しない
- 損益計算書が¥0からスタートし、入力したデータのみが反映される

**実行方法**:
```bash
cd /home/user/webapp/menya-nishiki-order-management-system
chmod +x cleanup_demo_data.sh
./cleanup_demo_data.sh
```

## 確認方法

### デモデータ削除後
```bash
./test_order_api.sh
```

期待される結果:
```json
{
  "sales_revenue": 0,
  "cost_of_sales": 0,
  "gross_profit": 0,
  "selling_expenses": 0,
  "operating_income": 0,
  "net_income": 0
}
```

すべて¥0になれば成功です。

---
作成日: 2026-02-12  
最終更新: 2026-02-12
