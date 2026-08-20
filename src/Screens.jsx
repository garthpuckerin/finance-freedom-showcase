/* Finance Freedom — Cash Flow, Budgets, and placeholder screens */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { fmtMonthDay } from './dates.js';
import { Stat, Card, Segmented, Badge } from './ui.jsx';
import { CashFlowChart } from './charts.jsx';
const { useState: useScS } = React;

export function CashFlowScreen() {
  const D = AppData;
  const f = D.forecast;
  const [fcWin, setFcWin] = useScS('60d');
  const fcDays = fcWin === '30d' ? 30 : 60;
  // The Scheduled-Bills table reads the SAME event rows the chart plots — each
  // row already carries the projected running balance (baseline daily spend
  // folded in), so table, chart and KPIs cannot disagree.
  const events = f.eventRows;
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Balance Today" v={fmt(f.startBal)} d="Everyday Checking" />
          <Stat k="Projected Low" v={fmt(f.lowBal)} d={`${fmtMonthDay(f.lowDate)} · ${f.lowBal < f.floor ? 'below floor' : 'above floor'}`} dColor={f.lowBal < f.floor ? 'var(--neg)' : 'var(--warn)'} />
          <Stat k="60-Day In" v={`+${fmt(f.in60, { maximumFractionDigits: 0 })}`} d={`${f.paydays} paydays`} dColor="var(--pos)" />
          <Stat k="60-Day Out" v={`−${fmt(f.out60, { maximumFractionDigits: 0 })}`} d={`${f.bills} scheduled bills`} dColor="var(--neg)" />
        </div>

        <div className="card" style={{ marginBottom: 'var(--gap)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 4px' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Projected Balance · Everyday Checking</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>30 days history + {fcDays} days forecast · hover to inspect any day</div>
            </div>
            <Segmented size="sm" value={fcWin} onChange={setFcWin} options={[{ value: '30d', label: '30d' }, { value: '60d', label: '60d' }]} />
          </div>
          <div style={{ padding: '4px 10px 10px' }}><CashFlowChart height={340} days={fcDays} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--gap)' }}>
          <Card title="Scheduled Bills & Deposits" pad={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' }}>
              <thead><tr>
                {['Date', 'Payee', 'Type', 'Amount', 'Projected Balance'].map((h, i) => (
                  <th key={h} style={{ textAlign: i >= 3 ? 'right' : 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600, padding: '9px 16px', borderBottom: '1px solid var(--line-2)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {events.map((e, i) => {
                  const runBal = e.balance;
                  const danger = runBal < f.floor;
                  return (
                    <tr key={i} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent' }}>
                      <td className="num" style={{ padding: '0 16px', height: 'var(--row-h)', borderBottom: '1px solid var(--line)', color: 'var(--text-3)', fontSize: 'var(--fs-table)' }}>{e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td style={{ padding: '0 16px', borderBottom: '1px solid var(--line)', color: 'var(--text)', fontWeight: 500, fontSize: 'var(--fs-table)' }}>{e.label === 'Payday' ? 'Employer Payroll' : e.label === 'Net' ? 'Transfer → Brokerage' : e.label === 'Card' ? 'Sapphire Reserve' : e.label === 'Auto' ? 'Auto Loan' : e.label === 'Utils' ? 'Utilities' : e.label}</td>
                      <td style={{ padding: '0 16px', borderBottom: '1px solid var(--line)', fontSize: 'var(--fs-table)' }}>{e.pos ? <Badge tone="pos">Deposit</Badge> : <Badge tone="neutral">Bill</Badge>}</td>
                      <td className="num" style={{ padding: '0 16px', borderBottom: '1px solid var(--line)', textAlign: 'right', fontWeight: 600, color: e.pos ? 'var(--pos)' : 'var(--neg)', fontSize: 'var(--fs-table)' }}>{e.pos ? '+' : '−'}${fmtN(e.amt)}</td>
                      <td className="num" style={{ padding: '0 16px', borderBottom: '1px solid var(--line)', textAlign: 'right', fontWeight: 600, color: danger ? 'var(--neg)' : 'var(--text)', fontSize: 'var(--fs-table)' }}>${fmtN(runBal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

// NOTE: a duplicate BudgetsScreen lived here but was never wired (app.jsx imports
// BudgetsScreen from Depth.jsx). Removed to prevent the two copies drifting apart.

const SCREEN_META = {
  bills: { glyph: '◷', title: 'Bills & Deposits', desc: 'Schedule recurring bills and income, see what posts when, and feed the cash-flow forecast.' },
  search: { glyph: '⌕', title: 'Search', desc: 'Full-text search across every transaction, payee, memo and category in your file.' },
  investments: { glyph: '◬', title: 'Investments', desc: 'Holdings, cost basis, allocation and performance across your brokerage and retirement accounts.' },
  networth: { glyph: '◈', title: 'Net Worth', desc: 'Assets minus debts over time, with every account contributing to one trend line.' },
  reports: { glyph: '▤', title: 'Reports', desc: 'Spending, income, cash flow and tax reports — the classic Money report gallery, modernized.' },
  insights: { glyph: '◉', title: 'Insights', desc: 'Automatic detection of subscriptions, spending anomalies and savings opportunities.' },
  tax: { glyph: '⊞', title: 'Tax', desc: 'Tag deductible categories and export a Schedule C / tax-time summary.' },
  goals: { glyph: '◎', title: 'Goals', desc: 'Fund goals from envelopes and watch projected completion dates against your cash flow.' },
  debt: { glyph: '⊖', title: 'Debt Payoff', desc: 'Avalanche vs. snowball strategies with an interest-saved projection.' },
  rules: { glyph: '⊜', title: 'Rules', desc: 'Auto-categorize and rename payees as transactions import.' },
  settings: { glyph: '⚙', title: 'Settings', desc: 'Accounts, categories, payees, appearance and security.' },
  assistant: { glyph: '✦', title: 'Assistant', desc: 'Ask questions about your money in plain language; grounded in your real register.' },
};

export function Placeholder({ screen }) {
  const m = SCREEN_META[screen] || { glyph: '◯', title: screen, desc: '' };
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--canvas)', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 28, color: 'var(--accent)', margin: '0 auto 18px', boxShadow: 'var(--shadow-sm)' }}>{m.glyph}</div>
        <h2 style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)' }}>{m.title}</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--text-2)', fontSize: 14, lineHeight: 1.55 }}>{m.desc}</p>
        <div style={{ marginTop: 18 }}><Badge tone="accent">Built on the same Ledger tokens</Badge></div>
      </div>
    </div>
  );
}
