/* Finance Freedom — budgeting styles (methodology lens over the same ledger)
 *
 * The product choice: you pick HOW you budget — classic envelopes, 50/30/20,
 * zero-based, FIRE, or pay-yourself-first — and the Budgets screen re-derives
 * its summary from the SAME canonical ledger. The envelope grid stays (it's
 * the underlying data); the lens changes what the numbers mean.
 *
 * Persistence mirrors theme.js: localStorage + a window event so the Settings
 * picker and the Budgets-screen chips stay in sync.
 */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { Stat } from './ui.jsx';
import { GaugeBar } from './charts.jsx';

const { useState: useBsS, useEffect: useBsE } = React;

export const BUDGET_STYLE_EVENT = 'ff:budget-style';
const KEY = 'ff_budget_style';

export const BUDGET_STYLES = [
  { id: 'envelope', label: 'Envelopes', tag: 'Classic', blurb: 'Give each category its own envelope of dollars — the Microsoft Money way.' },
  { id: '503020', label: '50/30/20', tag: 'Balanced', blurb: 'Needs 50%, wants 30%, savings 20% — judge the month by three buckets, not twenty.' },
  { id: 'zero', label: 'Zero-based', tag: 'Every dollar', blurb: 'Income minus assignments should hit exactly zero — every dollar gets a job.' },
  { id: 'fire', label: 'FIRE', tag: 'Independence', blurb: 'Maximize savings rate, track progress to your FI number (25× annual expenses).' },
  { id: 'pyf', label: 'Pay yourself first', tag: 'Automated', blurb: 'Savings transfers leave on payday; whatever remains is yours to spend guilt-free.' },
];

export function getBudgetStyle() {
  try { const v = localStorage.getItem(KEY); return BUDGET_STYLES.some(s => s.id === v) ? v : 'envelope'; }
  catch { return 'envelope'; }
}
export function setBudgetStyle(id) {
  try { localStorage.setItem(KEY, id); } catch (e) {}
  window.dispatchEvent(new CustomEvent(BUDGET_STYLE_EVENT, { detail: id }));
  return id;
}
export function useBudgetStyle() {
  const [style, setLocal] = useBsS(getBudgetStyle);
  useBsE(() => {
    const on = (e) => setLocal(e.detail || getBudgetStyle());
    window.addEventListener(BUDGET_STYLE_EVENT, on);
    return () => window.removeEventListener(BUDGET_STYLE_EVENT, on);
  }, []);
  return [style, (id) => setLocal(setBudgetStyle(id))];
}

/* ---- Derivations — all from the canonical ledger, same as every screen ---- */
const RENT = 2850; // Housing lives in Bills, not envelopes (see upcomingBills)
export function deriveStyleMetrics(rows) {
  const D = AppData;
  const income = Math.round(4750 * 26 / 12); // biweekly payroll, per BudgetsScreen
  const totBudget = rows.reduce((s, b) => s + b.budgeted, 0);
  const totSpent = rows.reduce((s, b) => s + b.spent, 0);
  const NEEDS = ['b1', 'b3', 'b6', 'b7'];
  const needsSpent = rows.filter(b => NEEDS.includes(b.id)).reduce((s, b) => s + b.spent, 0) + RENT;
  const wantsSpent = rows.filter(b => !NEEDS.includes(b.id)).reduce((s, b) => s + b.spent, 0);
  // Savings = deliberate "Transfer to …" moves in the trailing 30 days
  const cutoff = new Date(D.labels.today); cutoff.setDate(cutoff.getDate() - 30);
  const savings = D.transactions
    .filter(t => t.payee.startsWith('Transfer to') && new Date(t.date + 'T12:00:00') >= cutoff)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const annualExpenses = (needsSpent + wantsSpent) * 12;
  const fiNumber = annualExpenses * 25;
  const netWorth = D.netWorth;
  // Years to FI at current savings pace, 5% real return (standard annuity form)
  const r = 0.05, S = savings * 12;
  const yearsToFI = netWorth >= fiNumber ? 0
    : Math.log((fiNumber * r + S) / (netWorth * r + S)) / Math.log(1 + r);
  return { income, totBudget, totSpent, needsSpent, wantsSpent, savings, annualExpenses, fiNumber, netWorth, yearsToFI, rent: RENT };
}

/* ---- Picker chips (Budgets screen header) ----
 * DEMO affordance: in-page chips invite visitors to flip styles and watch the
 * screens re-derive. In production, switching would be a dropdown here or live
 * strictly in Settings — decided 2026-08-19; don't ship chips as prod UX. */
export function StyleChips({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budgeting style</span>
      {BUDGET_STYLES.map(s => {
        const on = value === s.id;
        return (
          <button key={s.id} onClick={() => onChange(s.id)} title={s.blurb} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 99, cursor: 'pointer',
            background: on ? 'var(--accent-weak)' : 'var(--surface)', border: on ? '1px solid var(--accent-line)' : '1px solid var(--line-2)',
            color: on ? 'var(--accent)' : 'var(--text-2)', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: on ? 600 : 500,
          }}>
            {s.label}
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', color: on ? 'var(--accent)' : 'var(--text-faint)', opacity: 0.8 }}>{s.tag.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---- Style lens — the band that reframes the month per methodology ---- */
function LensRow({ label, spent, cap, color }) {
  const over = spent > cap;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <span className="num" style={{ color: over ? 'var(--neg)' : 'var(--text-3)' }}>${fmtN(spent)} of ${fmtN(cap)}</span>
      </div>
      <GaugeBar value={spent} max={cap} color={over ? 'var(--neg)' : color} height={8} />
    </div>
  );
}

export function StyleLens({ style, rows }) {
  const m = deriveStyleMetrics(rows);
  const def = BUDGET_STYLES.find(s => s.id === style) || BUDGET_STYLES[0];
  const wrap = (children) => (
    <div className="card" style={{ padding: 'var(--pad)', marginBottom: 'var(--gap)' }}>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
        <b style={{ color: 'var(--text)' }}>{def.label}.</b> {def.blurb}
      </div>
      {children}
    </div>
  );

  if (style === '503020') {
    return wrap(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)' }}>
        <LensRow label="Needs · 50%" spent={m.needsSpent} cap={Math.round(m.income * 0.5)} color="var(--cat-2)" />
        <LensRow label="Wants · 30%" spent={m.wantsSpent} cap={Math.round(m.income * 0.3)} color="var(--cat-4)" />
        <LensRow label="Savings · 20%" spent={m.savings} cap={Math.round(m.income * 0.2)} color="var(--cat-1)" />
      </div>
    );
  }
  if (style === 'zero') {
    const assigned = m.totBudget + m.rent + m.savings;
    const left = m.income - assigned;
    return wrap(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)' }}>
        <Stat k="Income this month" v={fmt(m.income, { maximumFractionDigits: 0 })} d="biweekly payroll ×26 ÷12" />
        <Stat k="Assigned" v={fmt(assigned, { maximumFractionDigits: 0 })} d="envelopes + housing + savings" dColor="var(--text-3)" />
        <Stat k="Left to assign" v={fmt(left, { maximumFractionDigits: 0 })} d={left === 0 ? 'every dollar has a job' : left > 0 ? 'give these dollars a job' : 'over-assigned — trim an envelope'} dColor={left === 0 ? 'var(--pos)' : left > 0 ? 'var(--accent)' : 'var(--neg)'} />
        <Stat k="Spent so far" v={fmt(m.totSpent + m.rent, { maximumFractionDigits: 0 })} d="incl. housing" dColor="var(--text-3)" />
      </div>
    );
  }
  if (style === 'fire') {
    const rate = Math.round(m.savings / m.income * 100);
    const pct = Math.min(100, m.netWorth / m.fiNumber * 100);
    return wrap(
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 14 }}>
          <Stat k="Savings rate" v={`${rate}%`} d={`$${fmtN(m.savings)} of $${fmtN(m.income)} this period`} dColor={rate >= 25 ? 'var(--pos)' : 'var(--text-3)'} />
          <Stat k="Annual expenses" v={fmt(m.annualExpenses, { maximumFractionDigits: 0 })} d="current pace ×12" dColor="var(--text-3)" />
          <Stat k="FI number" v={fmt(m.fiNumber, { maximumFractionDigits: 0 })} d="25× annual expenses" dColor="var(--text-3)" />
          <Stat k="Years to FI" v={m.yearsToFI === 0 ? 'Reached' : m.yearsToFI.toFixed(1)} d="at current pace · 5% real return" dColor="var(--accent)" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>Progress to financial independence</span>
          <span className="num" style={{ color: 'var(--text-3)' }}>${fmtN(Math.round(m.netWorth))} of ${fmtN(m.fiNumber)} · {pct.toFixed(1)}%</span>
        </div>
        <GaugeBar value={m.netWorth} max={m.fiNumber} color="var(--accent)" height={8} />
      </div>
    );
  }
  if (style === 'pyf') {
    const target = Math.round(m.income * 0.2);
    const hit = m.savings >= target;
    return wrap(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)' }}>
        <Stat k="Paid yourself" v={fmt(m.savings, { maximumFractionDigits: 0 })} d="automatic transfers this period" dColor={hit ? 'var(--pos)' : 'var(--neg)'} />
        <Stat k="Target · 20% of income" v={fmt(target, { maximumFractionDigits: 0 })} d={hit ? `hit — ${Math.round(m.savings / target * 100)}% of target` : `$${fmtN(target - m.savings)} short`} dColor={hit ? 'var(--pos)' : 'var(--neg)'} />
        <Stat k="Yours to spend" v={fmt(m.income - m.savings - m.rent, { maximumFractionDigits: 0 })} d="after savings & housing — guilt-free" dColor="var(--accent)" />
      </div>
    );
  }
  return null; // envelope — the grid below IS the methodology
}

/* ---- Style-aware savings-rate framing (Dashboard KPI) ---- */
export function styleSavingsGoal(style) {
  if (style === 'fire') return { label: 'FIRE target: 50%', target: 50 };
  if (style === 'pyf') return { label: 'Pay-yourself-first: 20%', target: 20 };
  if (style === '503020') return { label: '50/30/20 savings: 20%', target: 20 };
  return { label: 'Goal: 15%', target: 15 };
}

/* ---- Compact Budgets-card body for the Dashboard ---- */
export function StyleBudgetCardBody({ style }) {
  const D = AppData;
  const m = deriveStyleMetrics(D.budgets);
  const line = (k, v, c) => (
    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
      <span style={{ color: 'var(--text-2)' }}>{k}</span>
      <span className="num" style={{ color: c || 'var(--text)', fontWeight: 600 }}>{v}</span>
    </div>
  );
  if (style === '503020') {
    return (
      <div>
        {[['Needs · 50%', m.needsSpent, m.income * 0.5, 'var(--cat-2)'], ['Wants · 30%', m.wantsSpent, m.income * 0.3, 'var(--cat-4)'], ['Savings · 20%', m.savings, m.income * 0.2, 'var(--cat-1)']].map(([k, v, cap, color]) => (
          <div key={k} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
              <span style={{ color: 'var(--text-2)' }}>{k}</span>
              <span className="num" style={{ color: v > cap ? 'var(--neg)' : 'var(--text-3)', fontWeight: 600 }}>${fmtN(Math.round(v))} / ${fmtN(Math.round(cap))}</span>
            </div>
            <GaugeBar value={v} max={cap} color={v > cap ? 'var(--neg)' : color} height={5} />
          </div>
        ))}
      </div>
    );
  }
  if (style === 'zero') {
    const assigned = m.totBudget + m.rent + m.savings;
    const left = m.income - assigned;
    return (
      <div>
        {line('Income this month', fmt(m.income, { maximumFractionDigits: 0 }))}
        {line('Assigned', fmt(assigned, { maximumFractionDigits: 0 }), 'var(--text-3)')}
        {line('Left to assign', fmt(left, { maximumFractionDigits: 0 }), left === 0 ? 'var(--pos)' : left > 0 ? 'var(--accent)' : 'var(--neg)')}
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 4 }}>{left === 0 ? 'Every dollar has a job.' : left > 0 ? 'Give these dollars a job.' : 'Over-assigned — trim an envelope.'}</div>
      </div>
    );
  }
  if (style === 'fire') {
    const pct = Math.min(100, m.netWorth / m.fiNumber * 100);
    return (
      <div>
        {line('Savings rate', `${Math.round(m.savings / m.income * 100)}%`, 'var(--pos)')}
        {line('FI number', fmt(m.fiNumber, { maximumFractionDigits: 0 }), 'var(--text-3)')}
        {line('Years to FI', m.yearsToFI === 0 ? 'Reached' : m.yearsToFI.toFixed(1), 'var(--accent)')}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
          <span style={{ color: 'var(--text-2)' }}>FI progress</span>
          <span className="num" style={{ color: 'var(--text-3)', fontWeight: 600 }}>{pct.toFixed(1)}%</span>
        </div>
        <GaugeBar value={m.netWorth} max={m.fiNumber} color="var(--accent)" height={5} />
      </div>
    );
  }
  if (style === 'pyf') {
    const target = Math.round(m.income * 0.2);
    return (
      <div>
        {line('Paid yourself', fmt(m.savings, { maximumFractionDigits: 0 }), m.savings >= target ? 'var(--pos)' : 'var(--neg)')}
        {line('Target · 20%', fmt(target, { maximumFractionDigits: 0 }), 'var(--text-3)')}
        {line('Yours to spend', fmt(m.income - m.savings - m.rent, { maximumFractionDigits: 0 }), 'var(--accent)')}
        <div style={{ marginTop: 4 }}><GaugeBar value={m.savings} max={target} color="var(--pos)" height={5} /></div>
      </div>
    );
  }
  return null; // envelope — Dashboard renders its classic top-5 envelope list
}

/* ---- Style-specific insight for the Insights feed ---- */
export function styleInsight(style) {
  const D = AppData;
  const m = deriveStyleMetrics(D.budgets);
  if (style === '503020') {
    const wantsPct = Math.round(m.wantsSpent / m.income * 100);
    return { id: 'style-i', tone: wantsPct <= 30 ? 'pos' : 'warn', glyph: '◫', tag: '50/30/20',
      title: wantsPct <= 30 ? 'Wants are well inside the 30% lane' : 'Wants are over the 30% lane',
      body: `Wants are ${wantsPct}% of income this period; needs are ${Math.round(m.needsSpent / m.income * 100)}% and savings ${Math.round(m.savings / m.income * 100)}%.`, action: 'Review the split' };
  }
  if (style === 'zero') {
    const left = m.income - (m.totBudget + m.rent + m.savings);
    if (left === 0) return { id: 'style-i', tone: 'pos', glyph: '⊜', tag: 'Zero-based', title: 'Every dollar has a job', body: 'Income minus assignments is exactly zero this month.', action: 'Open Budgets' };
    return { id: 'style-i', tone: left > 0 ? 'info' : 'warn', glyph: '⊜', tag: 'Zero-based',
      title: left > 0 ? `$${fmtN(left)} still needs a job` : `Plan is over-assigned by $${fmtN(-left)}`,
      body: left > 0 ? 'Assign the remainder to an envelope, savings, or debt to zero out the month.' : 'Assignments exceed income — trim an envelope or reduce a transfer to zero out the month.', action: 'Open Budgets' };
  }
  if (style === 'fire') {
    return { id: 'style-i', tone: 'pos', glyph: '◎', tag: 'FIRE',
      title: `Savings rate ${Math.round(m.savings / m.income * 100)}% — FI in ~${m.yearsToFI.toFixed(1)} years`,
      body: `At the current pace you reach your FI number (${fmt(m.fiNumber, { maximumFractionDigits: 0 })}) in about ${m.yearsToFI.toFixed(1)} years, assuming a 5% real return.`, action: 'Open Budgets' };
  }
  if (style === 'pyf') {
    const target = Math.round(m.income * 0.2);
    const hit = m.savings >= target;
    return { id: 'style-i', tone: hit ? 'pos' : 'warn', glyph: '✦', tag: 'Pay yourself first',
      title: hit ? `You paid yourself ${Math.round(m.savings / target * 100)}% of target` : 'This month’s transfer is short of target',
      body: hit ? `$${fmtN(m.savings)} moved to savings against a $${fmtN(target)} target — automation is doing its job.` : `$${fmtN(m.savings)} moved against a $${fmtN(target)} target. Consider raising the payday transfer.`, action: 'Open Budgets' };
  }
  return null; // envelope — the stock insights already speak envelope
}
