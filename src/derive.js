/* Finance Freedom — derivation layer (single source of truth).
 *
 * Everything a screen shows about "this period" — KPIs, deltas, the spending
 * donut, the budget spent-by-category, top payees, the monthly trend's current
 * point — is COMPUTED here from the resolved transaction ledger. Nothing is
 * hand-typed in the view layer, so the demo stays internally coherent on ANY
 * date the relative-date engine slides the ledger to.
 *
 * Pure functions only. No mutation, no Math.random, no external deps.
 */
import { TODAY, fmtMonthDay, iso } from './dates.js';

/* ---- Canonical period -------------------------------------------------- *
 * ONE window reused everywhere a "this month / this period" number or label
 * appears. We use the trailing 30 days ending today: it is always fully
 * covered by the ~60-day ledger (so it never shows $0 on the 1st of a month),
 * and it slides forward with the clock. The label is honest about the window.
 */
export const PERIOD_DAYS = 30;

/** True when a resolved txn falls inside the trailing-PERIOD_DAYS window. */
export function inCurrentPeriod(tx, today = TODAY) {
  const t = new Date(tx.date + 'T00:00:00');
  const start = new Date(today);
  start.setDate(start.getDate() - (PERIOD_DAYS - 1));
  return t >= start && t <= today;
}

/** Canonical period descriptor (window bounds + display label), today-relative. */
export function buildPeriod(today = TODAY) {
  const end = new Date(today);
  const start = new Date(today);
  start.setDate(start.getDate() - (PERIOD_DAYS - 1));
  return {
    days: PERIOD_DAYS,
    start,
    end,
    // "May 24 – Jun 22" — accurate to the actual window, never a frozen month.
    label: `${fmtMonthDay(start)} – ${fmtMonthDay(end)}`,
    shortLabel: `Last ${PERIOD_DAYS} days`,
  };
}

/** Transfers are not spending — exclude them from expense/category rollups. */
export function isTransfer(tx) {
  const top = (tx.cat || '').split(' : ')[0].trim();
  return top === 'Transfer';
}

const topCat = (tx) => (tx.cat || '').split(' : ')[0].trim() || 'Other';

/* ---- Period totals ----------------------------------------------------- */
export function periodTotals(transactions, today = TODAY) {
  const rows = transactions.filter((t) => inCurrentPeriod(t, today));
  const income = rows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  // "Spending" excludes transfers (moving money between your own accounts is
  // not an expense) so the KPI reconciles with the category breakdown.
  const spending = rows
    .filter((t) => t.amount < 0 && !isTransfer(t))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const transfersOut = rows
    .filter((t) => t.amount < 0 && isTransfer(t))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = income - spending - transfersOut;
  const savingsRate = income > 0 ? ((income - spending - transfersOut) / income) * 100 : 0;
  return { rows, income, spending, transfersOut, net, savingsRate };
}

/** The matching trailing window immediately BEFORE the current one (for deltas). */
export function priorPeriodTotals(transactions, today = TODAY) {
  const prevEnd = new Date(today);
  prevEnd.setDate(prevEnd.getDate() - PERIOD_DAYS);
  return periodTotals(transactions, prevEnd);
}

/* ---- Cash-flow chart history: derived from the real ledger -------------- *
 * The cash-flow chart's "actual" (past) portion must show the account's real
 * day-by-day balance, not a synthetic walk — otherwise real withdrawals in the
 * register (rent, transfers, groceries, ...) don't show up as dips in the
 * chart. Carry the balance forward from each day's last transaction (days
 * with no transaction keep the prior day's balance, which is what actually
 * happens to an account).
 *
 * IMPORTANT: `ascTransactions` must already be in true posting order —
 * ascending by date, and for same-day transactions in the order they were
 * actually applied (the order their `.balance` running total was computed
 * in). Re-sorting by date alone is NOT safe: several same-day transactions
 * (e.g. two bills posting on the same day) are only distinguishable by their
 * original posting order, not by date string, so a date-only sort can pick
 * the wrong one as "last" and misreport that day's ending balance. Pass the
 * ascending ledger array data.js already computes the running balance from
 * (its `asc`), not the newest-first display list.
 */
export function deriveActualBalanceSeries(ascTransactions, days, today = TODAY) {
  const pts = [];
  let idx = 0;
  // Balance immediately before the earliest known transaction — only used as
  // a fallback if the ledger doesn't reach back `days` days (it does here).
  let bal = ascTransactions.length ? ascTransactions[0].balance - ascTransactions[0].amount : 0;
  for (let i = -days; i <= 0; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = iso(d);
    while (idx < ascTransactions.length && ascTransactions[idx].date <= key) {
      bal = ascTransactions[idx].balance;
      idx += 1;
    }
    pts.push({ t: i, date: d, bal, actual: true });
  }
  return pts;
}

/* ---- Spending by category (donut + breakdown) -------------------------- *
 * pct is DERIVED from value so the printed percent always matches the drawn
 * segment. Categories are color-mapped from the shared catColor table.
 */
export function deriveSpendingByCategory(transactions, catColor, today = TODAY) {
  const rows = transactions.filter(
    (t) => inCurrentPeriod(t, today) && t.amount < 0 && !isTransfer(t)
  );
  const byCat = {};
  rows.forEach((t) => {
    const c = topCat(t);
    byCat[c] = (byCat[c] || 0) + Math.abs(t.amount);
  });
  const total = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;
  const palette = catColor || {};
  return Object.entries(byCat)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      pct: Math.round((amount / total) * 100),
      color: palette[category] || 'var(--text-3)',
    }))
    .sort((a, b) => b.amount - a.amount);
}

/* ---- Budgets: spent-by-category derived from the ledger ----------------- *
 * Keeps each envelope's budgeted/colour/id, but recomputes `spent` from the
 * period ledger so the four "monthly spend" numbers reconcile. Budget names
 * map to ledger categories (some envelopes are sub-categories of Food).
 */
const BUDGET_LEDGER_MATCH = {
  Groceries: (t) => t.cat === 'Food : Groceries',
  'Dining out': (t) => t.cat === 'Food : Dining',
  Transport: (t) => topCat(t) === 'Transport',
  Shopping: (t) => topCat(t) === 'Shopping',
  Entertainment: (t) => topCat(t) === 'Entertainment',
  Health: (t) => topCat(t) === 'Health',
  Utilities: (t) => topCat(t) === 'Utilities' && !/software/i.test(t.cat || ''),
  Subscriptions: (t) => /software/i.test(t.cat || ''),
};

export function deriveBudgetSpent(budgets, transactions, today = TODAY) {
  const rows = transactions.filter(
    (t) => inCurrentPeriod(t, today) && t.amount < 0 && !isTransfer(t)
  );
  return budgets.map((b) => {
    const match = BUDGET_LEDGER_MATCH[b.category];
    const spent = match
      ? rows.filter(match).reduce((s, t) => s + Math.abs(t.amount), 0)
      : b.spent;
    return { ...b, spent: Math.round(spent) };
  });
}

/* ---- Top payees (reports) ---------------------------------------------- *
 * Aggregate resolved spending transactions over the period by payee, take the
 * top N by total. Excludes income + transfers (they aren't "payees" you spend
 * at). Payee display names are lightly normalised (drop the "— …" suffix).
 */
export function deriveTopPayees(transactions, n = 8, today = TODAY) {
  const rows = transactions.filter(
    (t) => inCurrentPeriod(t, today) && t.amount < 0 && !isTransfer(t)
  );
  const byPayee = {};
  rows.forEach((t) => {
    const name = t.payee.split(' — ')[0].trim();
    const e = (byPayee[name] = byPayee[name] || { payee: name, cat: topCat(t), txns: 0, total: 0 });
    e.txns += 1;
    e.total += Math.abs(t.amount);
  });
  return Object.values(byPayee)
    .map((e) => ({ ...e, total: Math.round(e.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}

/* ---- Monthly trend: replace the current point with the derived total ---- *
 * The historical months stay as illustrative back-history, but the LAST point
 * (the current period) is recomputed from the ledger so the trend chart agrees
 * with the KPI. Expense excludes transfers, matching the spending definition.
 */
export function deriveMonthlyTrend(baseTrend, transactions, today = TODAY) {
  const { income, spending } = periodTotals(transactions, today);
  const out = baseTrend.slice();
  out[out.length - 1] = {
    ...out[out.length - 1],
    income: Math.round(income),
    expense: Math.round(spending),
  };
  return out;
}
