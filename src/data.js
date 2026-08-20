/* Finance Freedom — mock data for the Ledger design-system app */
import { daysFromToday, isoFromToday, iso, TODAY, fmtYearMonth, fmtMonthDay } from './dates.js';
import { buildPeriod, periodTotals, priorPeriodTotals, deriveSpendingByCategory, deriveBudgetSpent, deriveTopPayees, deriveMonthlyTrend, deriveActualBalanceSeries } from './derive.js';

const { AppData, fmt, fmtN } = (function () {
  const fmt = (v, opts) => new Intl.NumberFormat('en-US', Object.assign({ style: 'currency', currency: 'USD' }, opts || {})).format(v);
  const fmtN = (v) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

  // ---- Accounts (grouped) ----
  const accounts = [
    { id: 'chk', group: 'Cash', name: 'Everyday Checking', inst: 'Northlake Bank', kind: 'checking', balance: 5420.18, glyph: '≡' },
    { id: 'sav', group: 'Cash', name: 'Emergency Fund', inst: 'Ally Bank', kind: 'savings', balance: 24500.00, glyph: '≡' },
    { id: 'cc',  group: 'Credit', name: 'Sapphire Reserve', inst: 'Chase', kind: 'credit', balance: -2104.55, glyph: '▭' },
    { id: 'brk', group: 'Investments', name: 'Brokerage', inst: 'Vanguard', kind: 'investment', balance: 142800.42, glyph: '◬' },
    { id: '401', group: 'Investments', name: '401(k)', inst: 'Fidelity', kind: 'retirement', balance: 68200.00, glyph: '◬' },
    { id: 'car', group: 'Assets', name: '2022 Tesla Model 3', inst: 'Vehicle', kind: 'asset', balance: 18500.00, glyph: '◈' },
    { id: 'loan',group: 'Debts', name: 'Auto Loan', inst: 'Northlake Bank', kind: 'loan', balance: -8805.61, glyph: '⊖' },
  ];
  const netWorth = accounts.reduce((s, a) => s + a.balance, 0);

  // ---- Categories ----
  const catColor = {
    'Income': 'var(--pos)', 'Housing': 'var(--cat-1)', 'Food': 'var(--cat-2)', 'Transport': 'var(--cat-3)',
    'Shopping': 'var(--cat-4)', 'Utilities': 'var(--cat-6)', 'Health': 'var(--cat-7)', 'Entertainment': 'var(--cat-5)',
    'Transfer': 'var(--text-3)', 'Savings': 'var(--cat-8)',
  };

  // ---- Register transactions for Checking ----
  // status: '' uncleared, 'E' e-cleared, 'C' cleared, 'R' reconciled
  //
  // Each row is keyed by `off` = whole-day offset from the REAL today (0 = today,
  // negatives = days ago). This template is FIXED — it doesn't shift the demo's
  // internal relationships, it only slides forward with the calendar so the
  // register always spans ~2 months ending today. Cadence preserved from the
  // original fixture: biweekly payroll (0, −14, −28, −42, −56), monthly rent
  // (−11, −41), monthly utilities + subscriptions, and groceries/dining/
  // transport/coffee sprinkled across the window. Newest-first.
  const txTemplate = [
    // ---- recent ~3 weeks (the original fixture, now offset-based) ----
    { off: 0,   payee: 'Employer Payroll', cat: 'Income : Salary', memo: 'Direct deposit', amount: 4750.00, status: 'C' },
    { off: -1,  payee: 'Whole Foods Market', cat: 'Food : Groceries', memo: '', amount: -84.20, status: 'C' },
    { off: -1,  payee: 'Pacific Gas & Electric', cat: 'Utilities : Electric', memo: 'Autopay', amount: -142.88, status: 'C' },
    { off: -2,  payee: 'Transfer to Brokerage', cat: 'Transfer', memo: 'Monthly invest', amount: -2450.00, status: 'E' },
    { off: -3,  payee: 'Blue Bottle Coffee', cat: '', memo: '', amount: -6.75, status: '' },
    { off: -4,  payee: 'Shell', cat: 'Transport : Fuel', memo: '', amount: -58.40, status: 'C' },
    { off: -5,  payee: 'Netflix', cat: 'Entertainment : Streaming', memo: 'Subscription', amount: -22.99, status: 'C' },
    { off: -6,  payee: 'Trader Joe\'s', cat: 'Food : Groceries', memo: '', amount: -63.12, status: 'C' },
    { off: -7,  payee: 'Chase Sapphire Payment', cat: 'Transfer', memo: 'CC payment', amount: -640.00, status: 'C' },
    { off: -8,  payee: 'Amazon', cat: 'Shopping : Household', memo: '', amount: -119.43, status: 'C' },
    { off: -9,  payee: 'Sweetgreen', cat: 'Food : Dining', memo: '', amount: -16.85, status: 'C' },
    { off: -10, payee: 'Equinox', cat: 'Health : Fitness', memo: 'Membership', amount: -215.00, status: 'C' },
    { off: -11, payee: 'Rent — Maple Apartments', cat: 'Housing : Rent', memo: '', amount: -2850.00, status: 'R' },
    { off: -13, payee: 'Interest Earned', cat: 'Income : Interest', memo: '', amount: 3.41, status: 'R' },
    { off: -14, payee: 'Employer Payroll', cat: 'Income : Salary', memo: 'Direct deposit', amount: 4750.00, status: 'R' },
    { off: -15, payee: 'Comcast', cat: 'Utilities : Internet', memo: 'Autopay', amount: -89.99, status: 'R' },
    { off: -16, payee: 'Uber', cat: 'Transport : Rideshare', memo: '', amount: -24.60, status: 'R' },
    { off: -17, payee: 'Costco', cat: 'Food : Groceries', memo: '', amount: -212.77, status: 'R' },
    { off: -18, payee: 'Spotify', cat: 'Entertainment : Streaming', memo: '', amount: -11.99, status: 'R' },
    { off: -19, payee: 'CVS Pharmacy', cat: 'Health : Pharmacy', memo: '', amount: -34.18, status: 'R' },
    // ---- weeks 4–5 (extending the window back to ~−40d) ----
    { off: -20, payee: 'Blue Bottle Coffee', cat: 'Food : Coffee', memo: '', amount: -5.50, status: 'R' },
    { off: -21, payee: 'Sweetgreen', cat: 'Food : Dining', memo: '', amount: -18.40, status: 'R' },
    { off: -22, payee: 'iCloud+ 2TB', cat: 'Utilities : Software', memo: 'Subscription', amount: -9.99, status: 'R' },
    { off: -23, payee: 'Whole Foods Market', cat: 'Food : Groceries', memo: '', amount: -97.64, status: 'R' },
    { off: -24, payee: 'Shell', cat: 'Transport : Fuel', memo: '', amount: -54.10, status: 'R' },
    { off: -25, payee: 'Transfer to Brokerage', cat: 'Transfer', memo: 'Extra contribution', amount: -1850.00, status: 'R' },
    { off: -26, payee: 'Amazon', cat: 'Shopping : Household', memo: '', amount: -73.28, status: 'R' },
    { off: -27, payee: 'Interest Earned', cat: 'Income : Interest', memo: '', amount: 3.38, status: 'R' },
    { off: -28, payee: 'Employer Payroll', cat: 'Income : Salary', memo: 'Direct deposit', amount: 4750.00, status: 'R' },
    { off: -29, payee: 'Comcast', cat: 'Utilities : Internet', memo: 'Autopay', amount: -89.99, status: 'R' },
    { off: -30, payee: 'Trader Joe\'s', cat: 'Food : Groceries', memo: '', amount: -71.05, status: 'R' },
    { off: -31, payee: 'Equinox', cat: 'Health : Fitness', memo: 'Membership', amount: -215.00, status: 'R' },
    { off: -32, payee: 'Uber', cat: 'Transport : Rideshare', memo: '', amount: -19.85, status: 'R' },
    { off: -34, payee: 'Netflix', cat: 'Entertainment : Streaming', memo: 'Subscription', amount: -22.99, status: 'R' },
    { off: -35, payee: 'Chase Sapphire Payment', cat: 'Transfer', memo: 'CC payment', amount: -580.00, status: 'R' },
    { off: -36, payee: 'Transfer to Brokerage', cat: 'Transfer', memo: 'Monthly invest', amount: -1500.00, status: 'R' },
    { off: -37, payee: 'Blue Bottle Coffee', cat: 'Food : Coffee', memo: '', amount: -6.25, status: 'R' },
    { off: -38, payee: 'Costco', cat: 'Food : Groceries', memo: '', amount: -188.46, status: 'R' },
    { off: -39, payee: 'Spotify', cat: 'Entertainment : Streaming', memo: '', amount: -11.99, status: 'R' },
    { off: -41, payee: 'Rent — Maple Apartments', cat: 'Housing : Rent', memo: '', amount: -2850.00, status: 'R' },
    // ---- weeks 6–9 (extending back to ~−60d) ----
    { off: -42, payee: 'Employer Payroll', cat: 'Income : Salary', memo: 'Direct deposit', amount: 4750.00, status: 'R' },
    { off: -43, payee: 'Pacific Gas & Electric', cat: 'Utilities : Electric', memo: 'Autopay', amount: -131.52, status: 'R' },
    { off: -44, payee: 'Sweetgreen', cat: 'Food : Dining', memo: '', amount: -15.95, status: 'R' },
    { off: -45, payee: 'Whole Foods Market', cat: 'Food : Groceries', memo: '', amount: -88.71, status: 'R' },
    { off: -47, payee: 'Shell', cat: 'Transport : Fuel', memo: '', amount: -49.78, status: 'R' },
    { off: -48, payee: 'Amazon', cat: 'Shopping : Household', memo: '', amount: -64.12, status: 'R' },
    { off: -50, payee: 'iCloud+ 2TB', cat: 'Utilities : Software', memo: 'Subscription', amount: -9.99, status: 'R' },
    { off: -51, payee: 'Blue Bottle Coffee', cat: 'Food : Coffee', memo: '', amount: -5.75, status: 'R' },
    { off: -53, payee: 'Trader Joe\'s', cat: 'Food : Groceries', memo: '', amount: -59.33, status: 'R' },
    { off: -55, payee: 'Uber', cat: 'Transport : Rideshare', memo: '', amount: -22.40, status: 'R' },
    { off: -56, payee: 'Employer Payroll', cat: 'Income : Salary', memo: 'Direct deposit', amount: 4750.00, status: 'R' },
    { off: -58, payee: 'CVS Pharmacy', cat: 'Health : Pharmacy', memo: '', amount: -28.64, status: 'R' },
    { off: -60, payee: 'Costco', cat: 'Food : Groceries', memo: '', amount: -176.20, status: 'R' },
    // ---- larger, older money moves (all > 30 days ago, so they don't affect
    // the trailing-30 "this period" KPIs). These give the file a realistic net
    // savings rate over the window, so the oldest running balance in the
    // register starts at a PLAUSIBLE positive figure (~$5,400) instead of an
    // absurd negative opening. Transfers/taxes are excluded from spending.
    { off: -33, payee: 'Transfer to Emergency Fund', cat: 'Transfer', memo: 'Monthly savings', amount: -1850.00, status: 'R' },
    // Auto-loan autopay — mirrors the Bills schedule (due monthly on the 27th)
    // and the loan register's payment entries, so the books cross-foot.
    { off: -21, payee: 'Auto Loan Payment', cat: 'Transfer', memo: 'Autopay', amount: -412.30, status: 'R' },
    { off: -51, payee: 'Auto Loan Payment', cat: 'Transfer', memo: 'Autopay', amount: -412.30, status: 'R' },
    { off: -38, payee: 'Transfer to House Fund', cat: 'Transfer', memo: 'Down-payment savings', amount: -2900.00, status: 'R' },
    { off: -45, payee: 'IRS — Quarterly Estimate', cat: 'Transfer', memo: 'Q est. tax', amount: -3200.00, status: 'R' },
    { off: -49, payee: 'Transfer to Emergency Fund', cat: 'Transfer', memo: 'Monthly savings', amount: -1850.00, status: 'R' },
    { off: -52, payee: 'State Farm Insurance', cat: 'Transfer', memo: 'Auto + renters (6 mo)', amount: -1400.00, status: 'R' },
  ];
  // Resolve offsets to ISO dates anchored on the real today, ordered TRUE
  // chronologically (`off` ascending, oldest first) for the running-balance
  // walk. IMPORTANT: sorting must happen on `off` (a number), not by relying
  // on reversing the template's definition order — the template mixes a
  // newest-first "regular" block with separately-authored older entries, so
  // `.reverse()` alone does not produce true date order (it previously made
  // the checking balance dip to ~‑$5,981 at points where an older entry was
  // walked out of sequence). Same-day transactions keep their original
  // template order (stable sort) — which of two same-day items "posts first"
  // doesn't matter functionally, only that it's deterministic.
  const asc0 = txTemplate
    .slice()
    .sort((a, b) => a.off - b.off)
    .map(t => {
      const { off, ...rest } = t;
      return Object.assign({ date: isoFromToday(off) }, rest);
    });
  // Newest txn lands on the real current checking balance (5420.18).
  const opening = 5420.18 - asc0.reduce((s, t) => s + t.amount, 0);
  let bal = opening;
  const asc = asc0.map((t, i) => { bal += t.amount; return Object.assign({ id: 'tx' + i, balance: bal }, t); });
  const transactions = asc.slice().reverse();

  // ---- Registers for every other account (manual-tracking story) ----------
  // Same offset-template pattern as checking. Every account is MANUALLY
  // tracked — the offline power-user story: transfers mirror the checking
  // ledger's counterpart entries exactly (same day, same amount, opposite
  // sign), investments and the vehicle carry hand-entered "market value
  // update" revaluations, and the loan splits autopay into payment received
  // + interest charged. The register screen derives each account's opening
  // balance from its current balance minus the ledger sum, so the newest
  // running balance always lands exactly on the account balance.
  function resolveLedger(idPrefix, template) {
    return template
      .slice()
      .sort((a, b) => a.off - b.off)
      .map((t, i) => {
        const { off, ...rest } = t;
        return Object.assign({ id: idPrefix + i, date: isoFromToday(off) }, rest);
      })
      .reverse(); // newest-first, like the checking register
  }
  const accountLedgers = {
    sav: resolveLedger('sav', [
      { off: -13, payee: 'Interest Earned', cat: 'Income : Interest', memo: '4.10% APY', amount: 82.19, status: 'C' },
      { off: -33, payee: 'Transfer from Everyday Checking', cat: 'Transfer', memo: 'Monthly savings', amount: 1850.00, status: 'R' },
      { off: -44, payee: 'Interest Earned', cat: 'Income : Interest', memo: '4.10% APY', amount: 79.44, status: 'R' },
      { off: -49, payee: 'Transfer from Everyday Checking', cat: 'Transfer', memo: 'Monthly savings', amount: 1850.00, status: 'R' },
    ]),
    cc: resolveLedger('cc', [
      { off: -3,  payee: 'United Airlines', cat: 'Transport : Travel', memo: 'SFO–EWR', amount: -428.60, status: 'E' },
      { off: -5,  payee: 'DoorDash', cat: 'Food : Dining', memo: '', amount: -48.72, status: 'C' },
      { off: -7,  payee: 'Payment — Everyday Checking', cat: 'Transfer', memo: 'Autopay', amount: 640.00, status: 'C' },
      { off: -9,  payee: 'Sur La Table', cat: 'Shopping : Household', memo: '', amount: -148.13, status: 'C' },
      { off: -12, payee: 'Apple', cat: 'Utilities : Software', memo: 'Subscription', amount: -9.99, status: 'R' },
      { off: -16, payee: 'Airbnb', cat: 'Transport : Travel', memo: 'Tahoe weekend', amount: -385.00, status: 'R' },
      { off: -19, payee: 'Nopa', cat: 'Food : Dining', memo: '', amount: -86.20, status: 'R' },
      { off: -35, payee: 'Payment — Everyday Checking', cat: 'Transfer', memo: 'Autopay', amount: 580.00, status: 'R' },
      { off: -40, payee: 'Delta Air Lines', cat: 'Transport : Travel', memo: '', amount: -312.40, status: 'R' },
      { off: -47, payee: 'REI', cat: 'Shopping : Household', memo: '', amount: -204.85, status: 'R' },
    ]),
    brk: resolveLedger('brk', [
      { off: -2,  payee: 'Transfer from Everyday Checking', cat: 'Transfer', memo: 'Monthly invest', amount: 2450.00, status: 'E' },
      { off: -8,  payee: 'Market Value Update', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: 1894.30, status: 'C' },
      { off: -18, payee: 'VTI Dividend', cat: 'Income : Dividends', memo: 'Q2 distribution · reinvested', amount: 218.46, status: 'R' },
      { off: -18, payee: 'BND Dividend', cat: 'Income : Dividends', memo: 'Monthly · reinvested', amount: 21.37, status: 'R' },
      { off: -25, payee: 'Transfer from Everyday Checking', cat: 'Transfer', memo: 'Extra contribution', amount: 1850.00, status: 'R' },
      { off: -28, payee: 'Market Value Update', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: -1212.75, status: 'R' },
      { off: -36, payee: 'Transfer from Everyday Checking', cat: 'Transfer', memo: 'Monthly invest', amount: 1500.00, status: 'R' },
      { off: -55, payee: 'Market Value Update', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: 2406.12, status: 'R' },
    ]),
    '401': resolveLedger('k4', [
      { off: 0,   payee: 'Payroll Contribution', cat: 'Income : Contribution', memo: '6% of salary', amount: 346.15, status: 'C' },
      { off: 0,   payee: 'Employer Match', cat: 'Income : Contribution', memo: '3% match', amount: 173.08, status: 'C' },
      { off: -8,  payee: 'Market Value Update', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: 1081.44, status: 'C' },
      { off: -14, payee: 'Payroll Contribution', cat: 'Income : Contribution', memo: '6% of salary', amount: 346.15, status: 'R' },
      { off: -14, payee: 'Employer Match', cat: 'Income : Contribution', memo: '3% match', amount: 173.08, status: 'R' },
      { off: -28, payee: 'Payroll Contribution', cat: 'Income : Contribution', memo: '6% of salary', amount: 346.15, status: 'R' },
      { off: -28, payee: 'Employer Match', cat: 'Income : Contribution', memo: '3% match', amount: 173.08, status: 'R' },
      { off: -28, payee: 'Market Value Update', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: -724.90, status: 'R' },
      { off: -33, payee: 'FXAIX Dividend', cat: 'Income : Dividends', memo: 'Reinvested', amount: 142.11, status: 'R' },
      { off: -42, payee: 'Payroll Contribution', cat: 'Income : Contribution', memo: '6% of salary', amount: 346.15, status: 'R' },
      { off: -42, payee: 'Employer Match', cat: 'Income : Contribution', memo: '3% match', amount: 173.08, status: 'R' },
      { off: -55, payee: 'Market Value Update', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: 1569.25, status: 'R' },
      { off: -56, payee: 'Payroll Contribution', cat: 'Income : Contribution', memo: '6% of salary', amount: 346.15, status: 'R' },
      { off: -56, payee: 'Employer Match', cat: 'Income : Contribution', memo: '3% match', amount: 173.08, status: 'R' },
    ]),
    car: resolveLedger('car', [
      { off: -5,  payee: 'Market Value Update — KBB estimate', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: -275.00, status: 'C' },
      { off: -35, payee: 'Market Value Update — KBB estimate', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: -310.00, status: 'R' },
      { off: -63, payee: 'Market Value Update — KBB estimate', cat: 'Investment : Market change', memo: 'Manual revaluation', amount: -290.00, status: 'R' },
    ]),
    loan: resolveLedger('ln', [
      { off: -21, payee: 'Payment — Everyday Checking', cat: 'Transfer', memo: 'Autopay', amount: 412.30, status: 'C' },
      { off: -21, payee: 'Interest Charge', cat: 'Interest : Loan', memo: '5.90% APR', amount: -43.85, status: 'C' },
      { off: -51, payee: 'Payment — Everyday Checking', cat: 'Transfer', memo: 'Autopay', amount: 412.30, status: 'R' },
      { off: -51, payee: 'Interest Charge', cat: 'Interest : Loan', memo: '5.90% APR', amount: -45.62, status: 'R' },
    ]),
  };

  // ---- Canonical period (single source of truth for "this period") ----
  const period = buildPeriod(TODAY);
  const totals = periodTotals(transactions, TODAY);
  const prior = priorPeriodTotals(transactions, TODAY);

  // ---- Spending by category — DERIVED from the period ledger ----
  // pct is computed from value, so the donut's printed percent always matches
  // the drawn segment, and the total reconciles with the spending KPI.
  const spendingByCategory = deriveSpendingByCategory(transactions, catColor, TODAY);

  // ---- Monthly trend (income vs expense), last 6 months ----
  // Historical months are illustrative back-history; the CURRENT (last) point is
  // recomputed from the ledger so the trend agrees with the period KPIs.
  // Month labels are TODAY-relative (the 5 calendar months before the current
  // window) so the trend slides with the clock like every other display —
  // never a frozen Dec–Apr in the middle of August.
  const trailingMonth = (k) => new Date(TODAY.getFullYear(), TODAY.getMonth() - k, 1).toLocaleDateString('en-US', { month: 'short' });
  // Income is biweekly payroll ($4,750 × 2 ≈ $9.5k most months) — but any
  // trailing-30 window periodically catches THREE paydays (≈ $14.25k), which
  // the derived current point will show whenever the calendar lines up that
  // way. The back-history must exhibit the same 3-paycheck rhythm (oldest
  // month here), or the current spike reads as a data bug instead of the
  // normal biweekly cycle.
  const monthlyTrendBase = [
    { m: trailingMonth(5), income: 14250, expense: 6480 },
    { m: trailingMonth(4), income: 9500, expense: 6840 },
    { m: trailingMonth(3), income: 9620, expense: 5980 },
    { m: trailingMonth(2), income: 9500, expense: 7210 },
    { m: trailingMonth(1), income: 9740, expense: 6390 },
    { m: period.shortLabel, income: 0, expense: 0 },
  ];
  const monthlyTrend = deriveMonthlyTrend(monthlyTrendBase, transactions, TODAY);

  // ---- Budgets (envelopes) ---- spent is DERIVED from the period ledger so the
  // four "monthly spend" numbers (KPI, donut, trend, budgets) all reconcile.
  const budgetsBase = [
    { id: 'b1', category: 'Groceries', budgeted: 900, color: 'var(--cat-2)' },
    { id: 'b2', category: 'Dining out', budgeted: 400, color: 'var(--cat-2)' },
    { id: 'b3', category: 'Transport', budgeted: 500, color: 'var(--cat-3)' },
    { id: 'b4', category: 'Shopping', budgeted: 500, color: 'var(--cat-4)' },
    { id: 'b5', category: 'Entertainment', budgeted: 300, color: 'var(--cat-5)' },
    { id: 'b6', category: 'Health', budgeted: 450, color: 'var(--cat-7)' },
    { id: 'b7', category: 'Utilities', budgeted: 400, color: 'var(--cat-6)' },
    { id: 'b8', category: 'Subscriptions', budgeted: 120, color: 'var(--cat-8)' },
  ];
  const budgets = deriveBudgetSpent(budgetsBase, transactions, TODAY);

  // ---- Upcoming bills ---- (daysUntil keyed off the real today)
  // The bills that are ALSO cash-flow forecast events (Rent, Card→Sapphire,
  // Auto) MUST use the same day offsets as buildForecast()'s `events` array
  // (day 3 / 7 / 10) — otherwise "Upcoming · this cycle" shows a date one day
  // off from the calendar and the Scheduled table, which read from the forecast.
  const billDate = (n) => { const d = daysFromToday(n); return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const upcomingBills = [
    { id: 'u1', payee: 'Rent — Maple Apartments', cat: 'Housing', date: billDate(3), daysUntil: 3, amount: 2850.00, autopay: false },
    { id: 'u2', payee: 'Sapphire Reserve', cat: 'Credit card', date: billDate(7), daysUntil: 7, amount: 640.00, autopay: false },
    { id: 'u3', payee: 'Auto Loan', cat: 'Loan', date: billDate(10), daysUntil: 10, amount: 412.30, autopay: true },
    { id: 'u4', payee: 'Comcast', cat: 'Utilities', date: billDate(15), daysUntil: 15, amount: 89.99, autopay: true },
    { id: 'u5', payee: 'Equinox', cat: 'Health', date: billDate(20), daysUntil: 20, amount: 215.00, autopay: true },
  ];

  // ---- Cash-flow forecast series ----
  // daily points: 30 days past (actual) + 60 days forecast, from the real today.
  //
  // SINGLE SOURCE OF TRUTH for cash flow: the chart, the Scheduled-Bills table,
  // and every "projected low / 60-day in / 60-day out" KPI all read from this
  // one object. The table carries the SAME running balance the chart plots,
  // and `lowBal`/`lowDay` are the actual minimum of the forecast walk — so
  // nothing can drift. The forecast ONLY moves on a scheduled/recurring event
  // (a bill or a paycheck) — there is no invisible background "daily spend."
  // Predicting future cash flow means predicting KNOWN upcoming transactions;
  // a day with no scheduled event shows no change, matching the fact that no
  // row exists for it in the Scheduled Bills & Deposits table below.
  const FORECAST_FLOOR = 1000;
  const FORECAST_START_BAL = 5420.18;  // === checking balance today
  function buildForecast() {
    const today = new Date(TODAY);
    // past 30 days (actual) — derived from the REAL register (the ascending
    // `asc` ledger, so same-day transactions keep their true posting order),
    // not a synthetic walk, so every withdrawal/deposit shown in the register
    // appears as the matching dip/step in the chart's history line.
    const pts = deriveActualBalanceSeries(asc, 30, today);
    // forecast events over 60 days
    const events = [
      { day: 3, label: 'Rent', amt: -2850 },
      { day: 7, label: 'Card', amt: -640 },
      { day: 10, label: 'Auto', amt: -412.30 },
      { day: 16, label: 'Payday', amt: 4750, pos: true },
      { day: 16, label: 'Net', amt: -1500 }, // transfer
      { day: 20, label: 'Utils', amt: -232.87 },
      { day: 31, label: 'Payday', amt: 4750, pos: true },
      { day: 34, label: 'Rent', amt: -2850 },
      { day: 46, label: 'Payday', amt: 4750, pos: true },
    ];
    let fb = FORECAST_START_BAL;
    const eventMarks = [];
    const eventRows = []; // one row per event, carrying the projected balance
                          // AFTER that event posts (matches the chart)
    for (let i = 1; i <= 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const dayEvents = events.filter(e => e.day === i);
      // Apply each event in order, so every table row carries the running
      // balance AFTER that specific transaction. Days with no scheduled event
      // are FLAT (no change) — a real forecast can't show a balance change
      // with nothing behind it. When a day has multiple events (e.g. payday +
      // a transfer), the rows show distinct balances; the last event's balance
      // equals the end-of-day point the chart plots, so table, chart and KPIs
      // still cannot disagree.
      dayEvents.forEach(e => {
        fb += e.amt;
        eventMarks.push({ t: i, date: d, label: e.label, amt: e.amt, pos: e.pos });
        eventRows.push({ t: i, date: d, label: e.label, amt: e.amt, pos: e.pos, balance: fb });
      });
      pts.push({ t: i, date: d, bal: fb, actual: false });
    }
    // Derived metrics — read by KPIs so they can never contradict the chart.
    const forecastPts = pts.filter(p => !p.actual);
    const lowPt = forecastPts.reduce((m, p) => (p.bal < m.bal ? p : m), forecastPts[0]);
    const in60 = eventMarks.filter(e => e.pos).reduce((s, e) => s + e.amt, 0);
    const out60 = eventMarks.filter(e => !e.pos).reduce((s, e) => s + Math.abs(e.amt), 0);
    const paydays = eventMarks.filter(e => e.pos).length;
    const bills = eventMarks.filter(e => !e.pos).length;
    return {
      pts, eventMarks, eventRows, floor: FORECAST_FLOOR,
      startBal: FORECAST_START_BAL,
      lowBal: lowPt.bal, lowDate: lowPt.date, lowDay: lowPt.t,
      in60, out60, paydays, bills,
    };
  }

  const AppData = {
    user: { name: 'Demo User', household: 'Demo Household' },
    currentMonth: fmtYearMonth(TODAY),
    period, totals, prior,
    accounts, netWorth, transactions, accountLedgers, spendingByCategory, monthlyTrend,
    budgets, upcomingBills, forecast: buildForecast(), catColor,
    // Derived, today-relative display labels shared across screens.
    labels: {
      today: TODAY,
      todayLong: TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      todayLongNoYear: TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      monthYear: TODAY.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      monthName: TODAY.toLocaleDateString('en-US', { month: 'long' }),
      year: String(TODAY.getFullYear()),
      medium: TODAY.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      todayMd: `${String(TODAY.getMonth() + 1).padStart(2, '0')}/${String(TODAY.getDate()).padStart(2, '0')}`,
      projectedLowDay: fmtMonthDay(daysFromToday(20)),
    },
  };

  // ---- Investment holdings ----
  // RECONCILED to the account balances: holdings are scaled per-account so that
  // Σ(shares × price) for each account === that account's balance. This makes
  // the Investments screen's portfolio value === the Net Worth investment
  // figure (Brokerage $142,800.42 + 401(k) $68,200 = $211,000.42). Prices and
  // per-share cost basis are kept realistic; only share counts are scaled.
  const rawHoldings = [
    { sym: 'VTI', name: 'Vanguard Total Market', acct: 'Brokerage', shares: 210.4, price: 268.42, cost: 198.10, color: 'var(--cat-1)' },
    { sym: 'VXUS', name: 'Vanguard Intl', acct: 'Brokerage', shares: 180.0, price: 64.18, cost: 58.40, color: 'var(--cat-2)' },
    { sym: 'BND', name: 'Vanguard Total Bond', acct: 'Brokerage', shares: 120.0, price: 72.55, cost: 75.20, color: 'var(--cat-6)' },
    { sym: 'AAPL', name: 'Apple Inc.', acct: 'Brokerage', shares: 64.0, price: 224.30, cost: 142.80, color: 'var(--cat-3)' },
    { sym: 'FXAIX', name: 'Fidelity 500 Index', acct: '401(k)', shares: 312.7, price: 196.04, cost: 121.50, color: 'var(--cat-5)' },
    { sym: 'VMFXX', name: 'Settlement / Cash', acct: 'Brokerage', shares: 4820.0, price: 1.00, cost: 1.00, color: 'var(--text-3)' },
  ];
  const acctTargetMv = { Brokerage: 142800.42, '401(k)': 68200.00 };
  const acctRawMv = rawHoldings.reduce((m, h) => { m[h.acct] = (m[h.acct] || 0) + h.shares * h.price; return m; }, {});
  AppData.holdings = rawHoldings.map(h => {
    const factor = acctTargetMv[h.acct] ? acctTargetMv[h.acct] / acctRawMv[h.acct] : 1;
    return { ...h, shares: Math.round(h.shares * factor * 1000) / 1000 };
  });

  // ---- Net worth history (trailing 12 months, in $k) ----
  // The series shape is illustrative, but the LAST point is PINNED so its net
  // === the real net worth ($248,510). The headline number and the "over 12 mo"
  // delta both derive from this series, so chart endpoint === headline.
  AppData.netWorthHistory = (() => {
    const raw = []; let v = 198;
    // trailing 12 month labels ending on the current month, today-relative.
    const monthDates = Array.from({ length: 12 }, (_, i) => new Date(TODAY.getFullYear(), TODAY.getMonth() - (11 - i), 1));
    for (let i = 0; i < 12; i++) { v += 2.6 + (Math.sin(i / 1.7) * 3.5) + (i === 7 ? -5 : 0); raw.push({ m: monthDates[i].toLocaleDateString('en-US', { month: 'short' }), year: monthDates[i].getFullYear(), assets: v + 78 + i, debts: -(22 - i * 0.6), net: v + (i * 1.1) }); }
    // Pin the final net to the actual net worth (in $k); scale the whole net
    // line proportionally so the endpoint lands exactly on the headline.
    const targetNetK = netWorth / 1000;
    const k = raw[raw.length - 1].net ? targetNetK / raw[raw.length - 1].net : 1;
    return raw.map(h => ({ ...h, assets: h.assets * k, debts: h.debts * k, net: h.net * k }));
  })();
  // Derived 12-month net-worth delta (last − first), in $. Shared by every
  // "▲ … over 12 mo" sublabel (desktop Net Worth, MoreScreens, mobile).
  AppData.netWorthDelta12mo = (AppData.netWorthHistory[AppData.netWorthHistory.length - 1].net
    - AppData.netWorthHistory[0].net) * 1000;

  // ---- Reports: top payees ---- DERIVED by aggregating the period ledger by
  // payee (count + sum of spending), top 8. Always matches the register.
  AppData.topPayees = deriveTopPayees(transactions, 8, TODAY);
  // ---- Subscriptions (detected recurring) ----
  AppData.subscriptions = [
    { name: 'Equinox', cat: 'Health', amount: 215.00, cadence: 'Monthly', last: fmtMonthDay(daysFromToday(-10)), next: fmtMonthDay(daysFromToday(20)), status: 'active' },
    { name: 'Comcast Internet', cat: 'Utilities', amount: 89.99, cadence: 'Monthly', last: fmtMonthDay(daysFromToday(-15)), next: fmtMonthDay(daysFromToday(15)), status: 'active' },
    { name: 'Netflix', cat: 'Entertainment', amount: 22.99, cadence: 'Monthly', last: fmtMonthDay(daysFromToday(-5)), next: fmtMonthDay(daysFromToday(25)), status: 'active' },
    { name: 'Spotify', cat: 'Entertainment', amount: 11.99, cadence: 'Monthly', last: fmtMonthDay(daysFromToday(-18)), next: fmtMonthDay(daysFromToday(12)), status: 'active' },
    { name: 'iCloud+ 2TB', cat: 'Utilities', amount: 9.99, cadence: 'Monthly', last: fmtMonthDay(daysFromToday(-26)), next: fmtMonthDay(daysFromToday(5)), status: 'active' },
    { name: 'NYT Digital', cat: 'Entertainment', amount: 17.00, cadence: 'Monthly', last: fmtMonthDay(daysFromToday(-31)), next: '—', status: 'unused', note: 'No opens in 64 days' },
    { name: 'Adobe CC', cat: 'Shopping', amount: 54.99, cadence: 'Monthly', last: fmtMonthDay(daysFromToday(-47)), next: '—', status: 'unused', note: 'Last used in March' },
  ];

  // ---- Insights (auto-generated) ----
  // Narrative numbers + dates DERIVE from the forecast, holdings and budgets so
  // the copy can never contradict the screens they summarize.
  const fc = AppData.forecast;
  const lowDayLabel = fmtMonthDay(fc.lowDate);          // projected-low day from the forecast walk
  const lowBalStr = fmt(fc.lowBal);                     // e.g. "$692.88"
  const portfolioMv = AppData.holdings.reduce((s, h) => s + h.shares * h.price, 0);
  const cashHolding = AppData.holdings.find(h => h.sym === 'VMFXX');
  const cashMv = cashHolding ? cashHolding.shares * cashHolding.price : 0;
  const cashDragPct = (cashMv / portfolioMv) * 100;
  const cashYield = cashMv * 0.071;                     // ~7.1% recent equity return on the idle cash
  AppData.cashDrag = { mv: cashMv, pct: cashDragPct, yield: cashYield }; // single source for the Insights card AND the Assistant
  // Dining vs budget — read the derived envelope.
  const diningBudget = budgets.find(b => b.id === 'b2') || { spent: 0, budgeted: 0 };
  const transportBudget = budgets.find(b => b.id === 'b3') || { spent: 0, budgeted: 0 };
  const transportOver = Math.max(0, transportBudget.spent - transportBudget.budgeted);
  AppData.insights = [
    { id: 'i1', tone: 'neg', glyph: '◷', title: 'Cash dips below your safety floor', body: `Everyday Checking is projected to reach ${lowBalStr} on ${lowDayLabel} — under your $${fc.floor.toLocaleString()} floor. Rent and the card payment land before your next payday.`, action: 'Schedule a $1,000 transfer from Emergency Fund', tag: 'Cash flow' },
    { id: 'i2', tone: 'warn', glyph: '✦', title: '2 subscriptions look unused', body: 'NYT Digital and Adobe CC total $71.99/mo but show no recent activity. Cancelling both saves about $864 a year.', action: 'Review subscriptions', tag: 'Savings', impact: 71.99 },
    { id: 'i3', tone: diningBudget.spent > diningBudget.budgeted ? 'neg' : 'pos', glyph: '◫', title: diningBudget.spent > diningBudget.budgeted ? 'Dining is over budget' : 'Dining is on track', body: `You've spent $${diningBudget.spent} of your $${diningBudget.budgeted} Dining envelope this period.${transportOver > 0 ? ` Transport is also $${transportOver} over.` : ''}`, action: 'Adjust your budgets', tag: 'Budget' },
    { id: 'i4', tone: 'pos', glyph: '◎', title: 'Emergency Fund hits target early', body: 'At $1,000/mo you\'ll reach the $30,000 goal ahead of plan. Consider redirecting the surplus to your house fund.', action: 'Rebalance goal contributions', tag: 'Goals' },
    { id: 'i5', tone: 'info', glyph: '◬', title: 'Cash drag in your brokerage', body: `VMFXX settlement holds ${fmt(cashMv, { maximumFractionDigits: 0 })} in cash — about ${cashDragPct.toFixed(1)}% of the portfolio. Investing it in VTI could add roughly ${fmt(cashYield, { maximumFractionDigits: 0 })}/yr at recent returns.`, action: 'Review allocation', tag: 'Investing' },
  ];

  // ---- Rules (auto-categorize / rename) ----
  AppData.rules = [
    { id: 'r1', when: 'Payee contains', match: 'WHOLEFDS', then: 'Rename to', target: 'Whole Foods Market', cat: 'Food : Groceries', hits: 18, enabled: true },
    { id: 'r2', when: 'Payee contains', match: 'SQ *BLUE BOTTLE', then: 'Categorize as', target: 'Food : Coffee', cat: 'Food : Coffee', hits: 11, enabled: true },
    { id: 'r3', when: 'Payee contains', match: 'PG&E', then: 'Categorize as', target: 'Utilities : Electric', cat: 'Utilities : Electric', hits: 12, enabled: true },
    { id: 'r4', when: 'Payee contains', match: 'EQUINOX', then: 'Categorize as', target: 'Health : Fitness', cat: 'Health : Fitness', hits: 12, enabled: true },
    { id: 'r5', when: 'Amount equals', match: '−2,850.00', then: 'Categorize as', target: 'Housing : Rent', cat: 'Housing : Rent', hits: 6, enabled: true },
    { id: 'r6', when: 'Payee contains', match: 'AMZN MKTP', then: 'Rename to', target: 'Amazon', cat: 'Shopping : Household', hits: 24, enabled: false },
    { id: 'r7', when: 'Payee contains', match: 'UBER *TRIP', then: 'Categorize as', target: 'Transport : Rideshare', cat: 'Transport : Rideshare', hits: 9, enabled: true },
  ];

  // ---- Tax (deductible tracking, current year) ----
  AppData.taxCategories = [
    { category: 'Home Office', schedule: 'Schedule C · Line 30', amount: 2880.00, deductible: true, note: '18% of rent + utilities' },
    { category: 'Health Insurance', schedule: 'Schedule 1 · Line 17', amount: 4140.00, deductible: true, note: 'Self-employed premium' },
    { category: 'Charitable Gifts', schedule: 'Schedule A', amount: 1250.00, deductible: true, note: '4 donations' },
    { category: 'Business Software', schedule: 'Schedule C · Line 27a', amount: 659.88, deductible: true, note: 'Adobe, hosting' },
    { category: 'Mileage', schedule: 'Schedule C · Line 9', amount: 1284.00, deductible: true, note: '1,920 mi @ $0.67' },
    { category: 'Retirement (401k)', schedule: 'Pre-tax', amount: 9200.00, deductible: true, note: 'Payroll deferral' },
    { category: 'Mortgage Interest', schedule: 'Schedule A', amount: 0, deductible: false, note: 'No mortgage' },
  ];

  // ---- Debts (payoff planning) ----
  AppData.debts = [
    { id: 'cc', name: 'Sapphire Reserve', inst: 'Chase', kind: 'Credit card', balance: 2104.55, apr: 22.24, min: 75.00, color: 'var(--cat-4)' },
    { id: 'loan', name: 'Auto Loan', inst: 'Northlake Bank', kind: 'Auto loan', balance: 8805.61, apr: 5.90, min: 412.30, color: 'var(--cat-3)' },
  ];

  return { AppData, fmt, fmtN };
})();

export { AppData, fmt, fmtN };
