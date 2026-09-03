import test from 'node:test';
import assert from 'node:assert/strict';

import { AppData } from '../src/data.js';

const sumBy = (rows, select) => rows.reduce((total, row) => total + select(row), 0);

test('account balances sum exactly to the net-worth headline', () => {
  const accountTotal = sumBy(AppData.accounts, (account) => account.balance);

  assert.strictEqual(accountTotal, AppData.netWorth);
});

test('rounded spending categories reconcile with period spending', () => {
  const categoryTotal = sumBy(AppData.spendingByCategory, (category) => category.amount);

  assert.ok(
    AppData.spendingByCategory.every((category) => Number.isInteger(category.amount)),
    'spending category amounts must remain rounded to whole dollars'
  );

  // Each category is independently rounded to the nearest whole dollar, so
  // its error is at most $0.50. The summed error cannot exceed that bound
  // multiplied by the number of displayed categories.
  const roundingTolerance = AppData.spendingByCategory.length * 0.5;
  const difference = Math.abs(categoryTotal - AppData.totals.spending);

  assert.ok(
    difference <= roundingTolerance,
    `category total differs from spending by $${difference}, exceeding the $${roundingTolerance} rounding bound`
  );
});

test('latest monthly trend point matches rounded period income and spending', () => {
  const latest = AppData.monthlyTrend.at(-1);

  assert.strictEqual(latest.income, Math.round(AppData.totals.income));
  assert.strictEqual(latest.expense, Math.round(AppData.totals.spending));
});

test('investment holdings reconcile to their account balances within share-rounding tolerance', () => {
  const investmentAccounts = AppData.accounts.filter((account) =>
    ['investment', 'retirement'].includes(account.kind)
  );
  const holdingAccountNames = [...new Set(AppData.holdings.map((holding) => holding.acct))].sort();
  const investmentAccountNames = investmentAccounts.map((account) => account.name).sort();

  assert.deepStrictEqual(holdingAccountNames, investmentAccountNames);

  for (const account of investmentAccounts) {
    const holdings = AppData.holdings.filter((holding) => holding.acct === account.name);
    const marketValue = sumBy(holdings, (holding) => holding.shares * holding.price);

    // Shares are stored to three decimal places. Rounding each holding can
    // change its market value by at most half a thousandth of a share.
    const shareRoundingTolerance = sumBy(
      holdings,
      (holding) => Math.abs(holding.price) * 0.0005
    );
    const difference = Math.abs(marketValue - account.balance);

    assert.ok(
      difference <= shareRoundingTolerance,
      `${account.name} holdings differ from its balance by $${difference}, exceeding the $${shareRoundingTolerance} share-rounding bound`
    );
  }
});

test('net-worth history endpoint matches the net-worth headline', () => {
  const latest = AppData.netWorthHistory.at(-1);

  assert.strictEqual(latest.net * 1000, AppData.netWorth);
});
