/* Finance Freedom — Dashboard */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { fmtMonthDay } from './dates.js';
import { Card, Stat, Badge } from './ui.jsx';
import { AreaTrend, Donut, GaugeBar, CashFlowChart } from './charts.jsx';
import { BUDGET_STYLES, useBudgetStyle, styleSavingsGoal, StyleBudgetCardBody } from './BudgetStyles.jsx';
const { useMemo: useDbM } = React;

function MiniTxRow({ tx }) {
  const inc = tx.amount > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: inc ? 'var(--pos-weak)' : 'var(--surface-3)', color: inc ? 'var(--pos)' : 'var(--text-3)', display: 'grid', placeItems: 'center', fontSize: 12, flexShrink: 0 }}>{inc ? '↓' : '↑'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.payee}</div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{(tx.cat || 'Uncategorized').split(' : ')[0]} · {tx.date.slice(5).replace('-', '/')}</div>
      </div>
      <div className="num" style={{ fontSize: 12.5, fontWeight: 600, color: inc ? 'var(--pos)' : 'var(--text)' }}>{inc ? '+' : '−'}${fmtN(tx.amount)}</div>
    </div>
  );
}

function BillRow({ b }) {
  const urgent = b.daysUntil <= 3;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.payee}</div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Due {b.date} · {b.cat}</div>
      </div>
      {b.autopay && <Badge tone="info">AUTO</Badge>}
      <div style={{ textAlign: 'right' }}>
        <div className="num" style={{ fontSize: 12.5, fontWeight: 600, color: urgent ? 'var(--neg)' : 'var(--text)' }}>${fmtN(b.amount)}</div>
        <div className="num" style={{ fontSize: 11, color: urgent ? 'var(--neg)' : 'var(--text-faint)' }}>{b.daysUntil}d</div>
      </div>
    </div>
  );
}

export function Dashboard({ onNav }) {
  const D = AppData;
  // Canonical period (trailing 30 days) — the SAME window used everywhere.
  const income = D.totals.income;
  const expense = D.totals.spending;            // spending excludes transfers
  const savings = D.totals.savingsRate.toFixed(1);
  // Period-over-period deltas, derived from the matching prior window.
  const incomeDelta = income - D.prior.income;
  const spendDelta = expense - D.prior.spending;
  const recent = D.transactions.slice(0, 6);
  const billsTotal = D.upcomingBills.reduce((s, b) => s + b.amount, 0);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const periodLabel = D.period.shortLabel;
  const sign = (v) => (v >= 0 ? '▲ ' : '▼ ') + fmt(Math.abs(v), { maximumFractionDigits: 0 });
  const [style] = useBudgetStyle();
  const styleDef = BUDGET_STYLES.find(s => s.id === style);
  const savingsGoal = styleSavingsGoal(style);

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 'var(--display-weight)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)' }}>{greet}, {D.user.name}</h2>
          <p style={{ margin: '3px 0 0', color: 'var(--text-3)', fontSize: 13 }}>{D.labels.todayLong} · Here's where your money stands.</p>
        </div>

        {/* stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Net Worth" v={fmt(D.netWorth, { maximumFractionDigits: 0 })} d={`${sign(D.netWorthDelta12mo)} over 12 mo`} dColor={D.netWorthDelta12mo >= 0 ? 'var(--pos)' : 'var(--neg)'} />
          <Stat k={`Income · ${periodLabel}`} v={fmt(income, { maximumFractionDigits: 0 })} d={`${sign(incomeDelta)} vs prior 30d`} dColor={incomeDelta >= 0 ? 'var(--pos)' : 'var(--neg)'} />
          <Stat k={`Spending · ${periodLabel}`} v={fmt(expense, { maximumFractionDigits: 0 })} d={`${sign(spendDelta)} vs prior 30d`} dColor={spendDelta <= 0 ? 'var(--pos)' : 'var(--neg)'} />
          <Stat k="Savings Rate" v={`${savings}%`} d={savingsGoal.label} dColor={parseFloat(savings) >= savingsGoal.target ? 'var(--pos)' : 'var(--warn)'} />
        </div>

        {/* cash flow forecast — hero */}
        <div className="card" style={{ marginBottom: 'var(--gap)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px 6px' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Cash-Flow Forecast</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>Everyday Checking · next 60 days · low of <span className="num neg">{fmt(D.forecast.lowBal)}</span> on {fmtMonthDay(D.forecast.lowDate)}</div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-2)' }}><i style={{ width: 14, height: 2, borderRadius: 2, background: 'var(--accent)' }} />Actual</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-2)' }}><i style={{ width: 14, height: 0, borderTop: '2px dashed var(--accent)' }} />Forecast</span>
              <button onClick={() => onNav('cashflow')} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>Open →</button>
            </div>
          </div>
          <div style={{ padding: '0 10px 8px' }}><CashFlowChart height={260} /></div>
        </div>

        {/* trend + breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Card title="Income vs Spending" action={<span style={{ display: 'flex', gap: 12, fontSize: 11.5 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-2)' }}><i style={{ width: 10, height: 2, background: 'var(--pos)', borderRadius: 2 }} />Income</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-2)' }}><i style={{ width: 10, height: 2, background: 'var(--neg)', borderRadius: 2 }} />Spending</span></span>}>
            <AreaTrend data={D.monthlyTrend} height={230} />
          </Card>
          <Card title="Spending by Category" action={<button onClick={() => onNav('reports')} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>Report →</button>}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Donut segments={D.spendingByCategory.map(c => ({ value: c.amount, color: c.color, label: c.category, pct: c.pct }))} size={150} />
              <div style={{ flex: 1 }}>
                {D.spendingByCategory.slice(0, 6).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{c.category}</span>
                    <span className="num" style={{ fontSize: 11.5, color: 'var(--text)', fontWeight: 600 }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* bottom: budget, bills, recent */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap)' }}>
          <Card title={style === 'envelope' ? 'Budgets' : `Budgets · ${styleDef.label}`} action={<button onClick={() => onNav('budgets')} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>All →</button>}>
            {style === 'envelope' ? D.budgets.slice(0, 5).map(b => (
              <div key={b.id} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>{b.category}</span>
                  <span className="num" style={{ color: b.spent > b.budgeted ? 'var(--neg)' : 'var(--text-3)', fontWeight: 600 }}>${b.spent} / ${b.budgeted}</span>
                </div>
                <GaugeBar value={b.spent} max={b.budgeted} color={b.color} height={5} />
              </div>
            )) : <StyleBudgetCardBody style={style} />}
          </Card>
          <Card title="Upcoming Bills" action={<Badge tone="warn">${fmtN(billsTotal)} due</Badge>}>
            {D.upcomingBills.map(b => <BillRow key={b.id} b={b} />)}
          </Card>
          <Card title="Recent Activity" action={<button onClick={() => onNav('accounts')} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>Register →</button>}>
            {recent.map(tx => <MiniTxRow key={tx.id} tx={tx} />)}
          </Card>
        </div>
      </div>
    </div>
  );
}
