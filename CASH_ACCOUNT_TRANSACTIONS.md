# 総勘定元帳 - 現金勘定の取引分類

## 📋 現在の実装状況

### ✅ 実装済み

#### 借方（現金の増加）
1. **売掛金回収**
   - 摘要: `{顧客名} 売掛金回収 (OR-YYYYMMDD-XXXX)`
   - 仕訳: 借方 現金 / 貸方 売掛金
   - 実装箇所: `server/routes/order-receipts.js`（支払済み受注取引）

### 📝 今後実装予定

#### 借方（現金の増加）

2. **現金売上**
   - 摘要: `{顧客名} 現金売上 (OR-YYYYMMDD-XXXX)`
   - 仕訳: 借方 現金 / 貸方 売上高
   - 用途: 売掛金を経由せず即時現金で売上を計上

3. **借入金受領**
   - 摘要: `{金融機関名} 借入金受領`
   - 仕訳: 借方 現金 / 貸方 借入金
   - 用途: 銀行からの融資受領

4. **前受金受領**
   - 摘要: `{顧客名} 前受金受領`
   - 仕訳: 借方 現金 / 貸方 前受金
   - 用途: サービス提供前の代金受領

5. **預金引き出し**
   - 摘要: `{銀行名} 預金引き出し`
   - 仕訳: 借方 現金 / 貸方 預金
   - 用途: 銀行口座から現金を引き出し

#### 貸方（現金の減少）

1. **仕入支払い**
   - 摘要: `{仕入先名} 仕入支払い (PO-YYYYMMDD-XXXX)`
   - 仕訳: 借方 買掛金 / 貸方 現金
   - 用途: 仕入代金の現金払い

2. **経費支払い**
   - 摘要: `{経費項目} 支払い`
   - 仕訳: 借方 {経費科目} / 貸方 現金
   - 用途: 給料、地代家賃などの経費支払い

3. **預金への預け入れ**
   - 摘要: `{銀行名} 預金預け入れ`
   - 仕訳: 借方 預金 / 貸方 現金
   - 用途: 現金を銀行口座に預け入れ

## 🔧 実装例

### 1. 売掛金回収（既に実装済み）

```javascript
// server/routes/order-receipts.js
db.prepare(`
  INSERT INTO journal_entries (
    entry_date, description, debit_account_id, credit_account_id, 
    amount, reference_type, reference_id, admin_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  effectivePaymentDate,
  `${customer.name} 売掛金回収 (${receipt_number})`,
  cashAccount.id,        // 借方: 現金
  receivableAccount.id,  // 貸方: 売掛金
  total_amount,
  'order_receipt',
  result.lastInsertRowid,
  req.user?.id || 1
);
```

### 2. 仕入支払い（実装例）

```javascript
// server/routes/purchases.js
// 支払済み発注の場合
db.prepare(`
  INSERT INTO journal_entries (
    entry_date, description, debit_account_id, credit_account_id, 
    amount, reference_type, reference_id, admin_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  payment_date,
  `${supplier.name} 仕入支払い (${purchase_number})`,
  payableAccount.id,  // 借方: 買掛金
  cashAccount.id,     // 貸方: 現金
  total_amount,
  'purchase_order',
  result.lastInsertRowid,
  req.user?.id || 1
);
```

### 3. 預金預け入れ（実装例）

```javascript
// server/routes/cash-transfers.js (新規作成)
db.prepare(`
  INSERT INTO journal_entries (
    entry_date, description, debit_account_id, credit_account_id, 
    amount, admin_id
  ) VALUES (?, ?, ?, ?, ?, ?)
`).run(
  transfer_date,
  `${bank_name} 預金預け入れ`,
  depositAccount.id,  // 借方: 預金
  cashAccount.id,     // 貸方: 現金
  amount,
  req.user?.id || 1
);
```

## 📊 総勘定元帳での表示例

### 現金勘定（コード: 1000）

| 日付 | 摘要 | 相手科目 | 借方 | 貸方 | 残高 |
|------|------|----------|------|------|------|
| 2026-02-12 | テスト株式会社 売掛金回収 (OR-20260212-0001) | 売掛金 | 1,650 | | 1,650 |
| 2026-02-12 | 山田商店 仕入支払い (PO-20260212-0001) | 買掛金 | | 500 | 1,150 |
| 2026-02-13 | みずほ銀行 預金預け入れ | 預金 | | 1,000 | 150 |
| 2026-02-14 | 鈴木物産 売掛金回収 (OR-20260214-0001) | 売掛金 | 2,200 | | 2,350 |

## 🎯 推奨される摘要の命名規則

### フォーマット
```
{相手方名} {取引内容} (参照番号)
```

### 例
- `テスト株式会社 売掛金回収 (OR-20260212-0001)`
- `山田商店 仕入支払い (PO-20260212-0001)`
- `みずほ銀行 預金預け入れ`
- `給料支払い (2026年2月分)`

## 📝 必要な勘定科目

現在実装されている科目：
- 1000: 現金（資産）
- 1100: 売掛金（資産）
- 2000: 買掛金（負債）
- 4000: 売上高（収益）

追加が必要な科目：
- 1200: 預金（資産）
- 2100: 借入金（負債）
- 2200: 前受金（負債）
- 5000: 仕入高（費用）
- 6000: 給料（費用）
- 7000: 地代家賃（費用）

## 🔄 実装の優先順位

1. **高優先度**
   - ✅ 売掛金回収（実装済み）
   - 仕入支払い（発注取引との連携）
   - 預金預け入れ/引き出し

2. **中優先度**
   - 現金売上（即時売上）
   - 経費支払い（給料、家賃など）

3. **低優先度**
   - 借入金受領/返済
   - 前受金受領/売上振替

## 📚 参考資料

- 総勘定元帳: 全取引を勘定科目ごとに時系列で記録
- 借方: 資産の増加、負債・純資産の減少
- 貸方: 資産の減少、負債・純資産の増加

---

**作成日**: 2026-02-12
**更新日**: 2026-02-12
