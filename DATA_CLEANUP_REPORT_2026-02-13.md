# 仮環境データ削除報告書

## 📅 実施日時
2026-02-13

## 🎯 削除対象
仮環境URL: https://3017-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai/accounting/balance-sheet

## 📊 削除前のデータ状況

| データ種別 | 件数 |
|-----------|------|
| 仕訳帳 | 3件 |
| 在庫データ | 1件 |
| 在庫移動履歴 | 2件 |
| 受注取引 | 0件 |
| 発注書 | 0件 |
| 現金出納帳 | 0件 |

## 🗑️ 削除実施内容

### 削除されたトランザクションデータ
1. ✅ **在庫移動履歴**: 2件削除
2. ✅ **在庫アラート**: 0件削除
3. ✅ **在庫データ**: 1件削除
4. ✅ **受注明細**: 0件削除
5. ✅ **受注取引**: 0件削除
6. ✅ **発注明細**: 0件削除
7. ✅ **発注書**: 0件削除
8. ✅ **仕訳帳**: 3件削除
9. ✅ **現金出納帳**: 0件削除

**合計削除件数: 6件**

### 保持されたマスタデータ
- ✅ 顧客: 2件（テスト株式会社、山田太郎）
- ✅ 仕入先: 4件
- ✅ 勘定科目: 12件
  - 1000 現金（資産）
  - 1100 売掛金（資産）
  - 1300 商品（資産）
  - 2000 買掛金（負債）
  - 3000 資本金（純資産）
  - 4000 売上高（収益）- subcategory: sales_revenue
  - 5000 仕入高（費用）- subcategory: cost_of_sales
  - 5100 売上原価（費用）- subcategory: cost_of_sales
  - 6000 給料（費用）- subcategory: selling_expenses
  - 7000 地代家賃（費用）- subcategory: selling_expenses
  - 7100 雑収入（収益）- subcategory: non_operating_income
  - 8100 雑損失（費用）- subcategory: non_operating_expense
- ✅ 管理者: 1件（麺家弍色）

## ✅ 削除後の状態確認

### API確認結果

#### 在庫データ
```json
在庫件数: 0件
```

#### 仕訳帳
```json
仕訳帳件数: 0件
```

#### 損益計算書（2026年2月）
```json
{
  "sales_revenue": 0,
  "cost_of_sales": 0,
  "gross_profit": 0,
  "net_income": 0
}
```

#### 貸借対照表（2026-02-28時点）
```json
{
  "assets": 0,
  "liabilities": 0,
  "equity": 0
}
```

#### キャッシュフロー計算書（2026年2月）
```json
{
  "operating": {
    "revenue": 0,
    "expenses": 0,
    "net": 0
  },
  "beginningBalance": 0,
  "cashIncrease": 0,
  "endingBalance": 0
}
```

## 🎉 削除完了

### ✅ 確認事項
- [x] すべてのトランザクションデータが削除された
- [x] 在庫データが0件になった
- [x] 仕訳帳が空になった
- [x] 損益計算書がすべて0円になった
- [x] 貸借対照表がすべて0円になった
- [x] キャッシュフロー計算書がすべて0円になった
- [x] マスタデータは保持されている

### 📌 次回テスト時の注意事項

#### 1. 在庫管理テスト
```bash
# 在庫登録
POST /api/inventory
{
  "item_name": "ねぎ",
  "current_stock": 10,
  "unit_cost": 220
}

# 自動仕訳確認
→ 借方: 商品 (1300) ¥2,200
→ 貸方: 買掛金 (2000) ¥2,200
```

#### 2. 在庫出庫テスト
```bash
# 在庫出庫
POST /api/inventory/:id/movement
{
  "movement_type": "out",
  "quantity": 3
}

# 自動仕訳確認
→ 借方: 売上原価 (5100) ¥660
→ 貸方: 商品 (1300) ¥660
```

#### 3. 受注取引テスト
```bash
# 受注登録
POST /api/order-receipts
{
  "customer_id": 1,
  "items": [{"product_name": "拉麺", "quantity": 1, "unit_price": 2000}]
}

# 自動仕訳確認
→ 借方: 売掛金 (1100) ¥2,200
→ 貸方: 売上高 (4000) ¥2,200
```

#### 4. 売掛金回収テスト
```bash
# 売掛金回収仕訳
POST /api/accounting/journal
{
  "entry_date": "2026-02-13",
  "description": "売掛金回収",
  "debit_account_id": 1,    // 現金
  "credit_account_id": 2,   // 売掛金
  "amount": 2200
}

# キャッシュフロー確認
→ 営業キャッシュフロー収入: ¥2,200
```

#### 5. 買掛金支払いテスト
```bash
# 買掛金支払い仕訳
POST /api/accounting/journal
{
  "entry_date": "2026-02-13",
  "description": "買掛金支払い",
  "debit_account_id": 3,    // 買掛金
  "credit_account_id": 1,   // 現金
  "amount": 2200
}

# キャッシュフロー確認
→ 営業キャッシュフロー支出: ¥2,200
```

## 📝 削除スクリプト

スクリプトファイル: `clean-sandbox-data.sh`

```bash
#!/bin/bash
# トランザクションデータを削除
# マスタデータ（顧客、仕入先、勘定科目、管理者）は保持
```

再度データ削除が必要な場合:
```bash
cd /home/user/webapp/menya-nishiki-order-management-system
./clean-sandbox-data.sh
```

## 🔐 ログイン情報

- **URL**: https://3017-iwz00ie3gdkhvxpx2ni1z-5c13a017.sandbox.novita.ai
- **ユーザー名**: 麺家弍色
- **パスワード**: admin123

---

**実施者**: AI Assistant  
**データベース**: menya-nishiki-order.db  
**削除方法**: SQLトランザクション（一括削除）  
**ステータス**: ✅ 完了
