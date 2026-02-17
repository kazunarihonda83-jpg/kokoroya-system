import express from 'express';

const router = express.Router();

// Get tax deductions
router.get('/tax-deductions', (req, res) => {
  try {
    const db = req.app.get('db');
    const { start_date, end_date } = req.query;

    let query = `
      SELECT * FROM tax_deductions
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ` AND transaction_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND transaction_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY transaction_date DESC`;

    const deductions = db.prepare(query).all(...params);

    // Calculate summary
    const summary = {
      total_taxable_amount: 0,
      total_tax_amount: 0,
      total_amount: 0,
      count: deductions.length
    };

    deductions.forEach(d => {
      summary.total_taxable_amount += d.taxable_amount;
      summary.total_tax_amount += d.tax_amount;
      summary.total_amount += d.total_amount;
    });

    res.json({ data: deductions, summary });
  } catch (error) {
    console.error('Error fetching tax deductions:', error);
    res.status(500).json({ error: 'Failed to fetch tax deductions' });
  }
});

// Create tax deduction
router.post('/tax-deductions', (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      transaction_date,
      supplier_name,
      invoice_number,
      tax_rate,
      taxable_amount,
      category,
      notes,
      reference_type,
      reference_id
    } = req.body;

    if (!transaction_date || !supplier_name || !tax_rate || !taxable_amount) {
      return res.status(400).json({ 
        error: 'Transaction date, supplier name, tax rate, and taxable amount are required' 
      });
    }

    const tax_amount = Math.round(taxable_amount * (tax_rate / 100));
    const total_amount = taxable_amount + tax_amount;

    const result = db.prepare(`
      INSERT INTO tax_deductions (
        transaction_date, supplier_name, invoice_number, tax_rate,
        taxable_amount, tax_amount, total_amount, category, notes,
        reference_type, reference_id, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transaction_date,
      supplier_name,
      invoice_number || null,
      tax_rate,
      taxable_amount,
      tax_amount,
      total_amount,
      category || null,
      notes || null,
      reference_type || null,
      reference_id || null,
      req.user?.id || 1
    );

    res.status(201).json({ 
      message: 'Tax deduction created successfully',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating tax deduction:', error);
    res.status(500).json({ error: 'Failed to create tax deduction' });
  }
});

// Get cash book entries
router.get('/cash-book', (req, res) => {
  try {
    const db = req.app.get('db');
    const { start_date, end_date, transaction_type } = req.query;

    let query = `
      SELECT * FROM cash_book
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ` AND transaction_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND transaction_date <= ?`;
      params.push(end_date);
    }
    if (transaction_type) {
      query += ` AND transaction_type = ?`;
      params.push(transaction_type);
    }

    query += ` ORDER BY transaction_date DESC, created_at DESC`;

    const entries = db.prepare(query).all(...params);

    // Calculate summary
    const summary = {
      total_income: 0,
      total_expense: 0,
      current_balance: 0,
      count: entries.length
    };

    entries.forEach(e => {
      if (e.transaction_type === 'income') {
        summary.total_income += e.amount;
      } else {
        summary.total_expense += e.amount;
      }
    });

    if (entries.length > 0) {
      summary.current_balance = entries[0].balance;
    }

    res.json({ data: entries, summary });
  } catch (error) {
    console.error('Error fetching cash book:', error);
    res.status(500).json({ error: 'Failed to fetch cash book' });
  }
});

// Create cash book entry
router.post('/cash-book', (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      transaction_date,
      transaction_type,
      category,
      description,
      amount,
      reference_type,
      reference_id
    } = req.body;

    if (!transaction_date || !transaction_type || !description || !amount) {
      return res.status(400).json({ 
        error: 'Transaction date, type, description, and amount are required' 
      });
    }

    // Get current balance
    const currentBalance = db.prepare(
      'SELECT balance FROM cash_book ORDER BY transaction_date DESC, created_at DESC LIMIT 1'
    ).get();

    let newBalance = currentBalance?.balance || 0;
    if (transaction_type === 'income') {
      newBalance += amount;
    } else {
      newBalance -= amount;
    }

    const result = db.prepare(`
      INSERT INTO cash_book (
        transaction_date, transaction_type, category, description,
        amount, balance, reference_type, reference_id, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transaction_date,
      transaction_type,
      category || null,
      description,
      amount,
      newBalance,
      reference_type || null,
      reference_id || null,
      req.user?.id || 1
    );

    res.status(201).json({ 
      message: 'Cash book entry created successfully',
      data: { id: result.lastInsertRowid, balance: newBalance }
    });
  } catch (error) {
    console.error('Error creating cash book entry:', error);
    res.status(500).json({ error: 'Failed to create cash book entry' });
  }
});

// Get invoice ledger
router.get('/invoice-ledger', (req, res) => {
  try {
    const db = req.app.get('db');
    const { start_date, end_date, status } = req.query;

    let query = `
      SELECT 
        d.*,
        c.name as customer_name,
        c.customer_type
      FROM documents d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.document_type = 'invoice'
    `;
    const params = [];

    if (start_date) {
      query += ` AND d.issue_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND d.issue_date <= ?`;
      params.push(end_date);
    }
    if (status) {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY d.issue_date DESC`;

    const invoices = db.prepare(query).all(...params);

    // Calculate summary
    const summary = {
      total_amount: 0,
      paid_amount: 0,
      unpaid_amount: 0,
      overdue_amount: 0,
      count: invoices.length
    };

    const today = new Date().toISOString().split('T')[0];

    invoices.forEach(inv => {
      summary.total_amount += inv.total_amount;
      
      if (inv.status === 'paid') {
        summary.paid_amount += inv.total_amount;
      } else {
        summary.unpaid_amount += inv.total_amount;
        
        if (inv.due_date && inv.due_date < today) {
          summary.overdue_amount += inv.total_amount;
        }
      }
    });

    res.json({ data: invoices, summary });
  } catch (error) {
    console.error('Error fetching invoice ledger:', error);
    res.status(500).json({ error: 'Failed to fetch invoice ledger' });
  }
});

// Get general ledger
router.get('/general-ledger', (req, res) => {
  try {
    const db = req.app.get('db');
    const { start_date, end_date, account_id } = req.query;

    // Build base query
    let query = `
      SELECT 
        je.id,
        je.entry_date,
        je.description,
        je.amount,
        debit_acc.account_code as debit_code,
        debit_acc.account_name as debit_name,
        credit_acc.account_code as credit_code,
        credit_acc.account_name as credit_name,
        je.reference_type,
        je.reference_id
      FROM journal_entries je
      LEFT JOIN accounts debit_acc ON je.debit_account_id = debit_acc.id
      LEFT JOIN accounts credit_acc ON je.credit_account_id = credit_acc.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by date range
    if (start_date) {
      query += ` AND je.entry_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND je.entry_date <= ?`;
      params.push(end_date);
    }

    // Filter by specific account
    if (account_id) {
      query += ` AND (je.debit_account_id = ? OR je.credit_account_id = ?)`;
      params.push(account_id, account_id);
    }

    query += ` ORDER BY je.entry_date DESC, je.id DESC`;

    const entries = db.prepare(query).all(...params);

    // Get all accounts for the ledger view
    const accounts = db.prepare('SELECT id, account_code, account_name, account_type FROM accounts ORDER BY account_code').all();

    // Calculate balances for each account
    const accountBalances = {};
    accounts.forEach(account => {
      const balanceData = db.prepare(`
        SELECT 
          SUM(CASE WHEN debit_account_id = ? THEN amount ELSE 0 END) as total_debit,
          SUM(CASE WHEN credit_account_id = ? THEN amount ELSE 0 END) as total_credit
        FROM journal_entries
        WHERE 1=1
          ${start_date ? 'AND entry_date >= ?' : ''}
          ${end_date ? 'AND entry_date <= ?' : ''}
      `).get(
        account.id, 
        account.id,
        ...(start_date ? [start_date] : []),
        ...(end_date ? [end_date] : [])
      );

      const total_debit = balanceData?.total_debit || 0;
      const total_credit = balanceData?.total_credit || 0;

      // Calculate balance based on account type
      let balance;
      if (['asset', 'expense'].includes(account.account_type)) {
        balance = total_debit - total_credit;
      } else {
        balance = total_credit - total_debit;
      }

      accountBalances[account.id] = {
        code: account.account_code,
        name: account.account_name,
        account_type: account.account_type,
        total_debit,
        total_credit,
        balance
      };
    });

    res.json({ 
      data: entries,
      accounts: accountBalances,
      summary: {
        total_entries: entries.length,
        period: { start_date, end_date }
      }
    });
  } catch (error) {
    console.error('Error fetching general ledger:', error);
    res.status(500).json({ error: 'Failed to fetch general ledger' });
  }
});

// Get cashflow statement
router.get('/cashflow', (req, res) => {
  try {
    const db = req.app.get('db');
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Operating activities
    const operatingCash = db.prepare(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as cash_in,
        SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as cash_out
      FROM cash_book
      WHERE transaction_date BETWEEN ? AND ?
        AND category IN ('売上', '仕入', '給与', '家賃', '水道光熱費', '通信費', '消耗品費')
    `).get(start_date, end_date);

    // Investment activities
    const investingCash = db.prepare(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as cash_in,
        SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as cash_out
      FROM cash_book
      WHERE transaction_date BETWEEN ? AND ?
        AND category IN ('固定資産購入', '固定資産売却', '投資')
    `).get(start_date, end_date);

    // Financing activities
    const financingCash = db.prepare(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as cash_in,
        SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as cash_out
      FROM cash_book
      WHERE transaction_date BETWEEN ? AND ?
        AND category IN ('借入金', '借入金返済', '出資')
    `).get(start_date, end_date);

    // Calculate net cash flow
    const operating_net = (operatingCash.cash_in || 0) - (operatingCash.cash_out || 0);
    const investing_net = (investingCash.cash_in || 0) - (investingCash.cash_out || 0);
    const financing_net = (financingCash.cash_in || 0) - (financingCash.cash_out || 0);
    const total_net = operating_net + investing_net + financing_net;

    // Get opening and closing balance
    const openingBalance = db.prepare(`
      SELECT balance FROM cash_book
      WHERE transaction_date < ?
      ORDER BY transaction_date DESC, created_at DESC
      LIMIT 1
    `).get(start_date);

    const closingBalance = db.prepare(`
      SELECT balance FROM cash_book
      WHERE transaction_date <= ?
      ORDER BY transaction_date DESC, created_at DESC
      LIMIT 1
    `).get(end_date);

    const data = {
      period: { start_date, end_date },
      operating_activities: {
        cash_in: operatingCash.cash_in || 0,
        cash_out: operatingCash.cash_out || 0,
        net: operating_net
      },
      investing_activities: {
        cash_in: investingCash.cash_in || 0,
        cash_out: investingCash.cash_out || 0,
        net: investing_net
      },
      financing_activities: {
        cash_in: financingCash.cash_in || 0,
        cash_out: financingCash.cash_out || 0,
        net: financing_net
      },
      summary: {
        total_net_cashflow: total_net,
        opening_balance: openingBalance?.balance || 0,
        closing_balance: closingBalance?.balance || 0
      }
    };

    res.json({ data });
  } catch (error) {
    console.error('Error fetching cashflow:', error);
    res.status(500).json({ error: 'Failed to fetch cashflow statement' });
  }
});

export default router;
