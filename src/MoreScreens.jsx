/* Finance Freedom — Investments, Net Worth, Bills, Reports */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { daysFromToday } from './dates.js';
import { Stat, Card, Badge, Segmented } from './ui.jsx';
import { Donut, AreaTrend, LineTrend } from './charts.jsx';
import { isTransfer } from './derive.js';
const { useState: useMoreS } = React;

const TH = (extra) => Object.assign({ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600, padding: '9px 14px', background: 'var(--surface-3)', borderBottom: '1px solid var(--line-2)' }, extra);
const TD = (extra) => Object.assign({ padding: '0 14px', height: 'var(--row-h)', borderBottom: '1px solid var(--line)', color: 'var(--text)', fontSize: 'var(--fs-table)', verticalAlign: 'middle' }, extra);

/* ============ INVESTMENTS ============ */
export function InvestmentsScreen() {
  const H = AppData.holdings;
  const rows = H.map(h => {
    const mv = h.shares * h.price, cb = h.shares * h.cost, gain = mv - cb;
    return { ...h, mv, cb, gain, gainPct: cb ? (gain / cb) * 100 : 0 };
  });
  const totMv = rows.reduce((s, r) => s + r.mv, 0);
  const totCb = rows.reduce((s, r) => s + r.cb, 0);
  const totGain = totMv - totCb;
  // "Today" day-change derived from portfolio value so the $ and % agree.
  const dayPct = 0.4;
  const dayChange = totMv * (dayPct / 100);
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Portfolio Value" v={fmt(totMv, { maximumFractionDigits: 0 })} d="2 accounts · 6 holdings" />
          <Stat k="Total Cost Basis" v={fmt(totCb, { maximumFractionDigits: 0 })} />
          <Stat k="Unrealized Gain" v={fmt(totGain, { maximumFractionDigits: 0 })} d={`▲ ${(totGain / totCb * 100).toFixed(1)}% all-time`} dColor="var(--pos)" />
          <Stat k="Today" v={`+${fmt(dayChange, { maximumFractionDigits: 0 })}`} d={`▲ ${dayPct}%`} dColor="var(--pos)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Card title="Holdings" pad={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
              <thead><tr>
                <th style={TH({ width: 64 })}>Symbol</th><th style={TH()}>Name</th>
                <th style={TH({ width: 88, textAlign: 'right' })}>Shares</th>
                <th style={TH({ width: 80, textAlign: 'right' })}>Price</th>
                <th style={TH({ width: 110, textAlign: 'right' })}>Mkt Value</th>
                <th style={TH({ width: 130, textAlign: 'right' })}>Gain/Loss</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.sym} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent' }}>
                    <td style={TD({ fontWeight: 700 })}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />{r.sym}</span></td>
                    <td style={TD({ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{r.name}</td>
                    <td className="num" style={TD({ textAlign: 'right', color: 'var(--text-3)' })}>{r.shares.toLocaleString()}</td>
                    <td className="num" style={TD({ textAlign: 'right' })}>${fmtN(r.price)}</td>
                    <td className="num" style={TD({ textAlign: 'right', fontWeight: 600 })}>${fmtN(r.mv)}</td>
                    <td className="num" style={TD({ textAlign: 'right', fontWeight: 600, color: r.gain >= 0 ? 'var(--pos)' : 'var(--neg)' })}>{r.gain >= 0 ? '+' : '−'}${fmtN(r.gain)} <span style={{ fontSize: 10.5, opacity: 0.8 }}>({r.gainPct >= 0 ? '+' : ''}{r.gainPct.toFixed(0)}%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Allocation">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <Donut segments={rows.map(r => ({ value: r.mv, color: r.color }))} size={156} />
              <div style={{ width: '100%' }}>
                {rows.map(r => (
                  <div key={r.sym} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{r.sym}</span>
                    <span className="num" style={{ fontSize: 11.5, color: 'var(--text)', fontWeight: 600 }}>{(r.mv / totMv * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// NOTE: a duplicate NetWorthScreen lived here but was never wired (app.jsx imports
// NetWorthScreen from Depth.jsx). Removed to prevent the two copies drifting apart.

/* ============ BILLS & DEPOSITS ============ */
const evName = (label) => ({ Payday: 'Employer Payroll', Net: 'Transfer → Brokerage', Card: 'Sapphire Reserve', Auto: 'Auto Loan', Utils: 'Utilities', Rent: 'Rent — Maple Apts' }[label] || label);
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function BillsCalendar({ events }) {
  const today = new Date(AppData.labels.today);
  // Open on the CURRENT month so today and the imminent bills are in view —
  // the near-term due dates cluster in the next couple of weeks, not next month.
  const HOME_VIEW = { y: today.getFullYear(), m: today.getMonth() };
  const [view, setView] = useMoreS(HOME_VIEW);
  const [sel, setSel] = useMoreS(null);

  const byDay = {};
  events.forEach(e => { (byDay[dayKey(e.date)] = byDay[dayKey(e.date)] || []).push(e); });

  const first = new Date(view.y, view.m, 1);
  const startDow = first.getDay();
  const gridStart = new Date(view.y, view.m, 1 - startDow);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });
  const usedRows = Math.ceil((startDow + new Date(view.y, view.m + 1, 0).getDate()) / 7);
  const visible = cells.slice(0, usedRows * 7);

  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthEvents = events.filter(e => e.date.getFullYear() === view.y && e.date.getMonth() === view.m);
  const monthIn = monthEvents.filter(e => e.pos).reduce((s, e) => s + e.amt, 0);
  const monthOut = monthEvents.filter(e => !e.pos).reduce((s, e) => s + Math.abs(e.amt), 0);
  const shift = (n) => setView(v => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const navBtn = { width: 28, height: 28, borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line-2)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13, display: 'grid', placeItems: 'center' };

  const selEvents = sel ? (byDay[sel] || []) : [];

  return (
    <Card pad={false}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <button onClick={() => shift(-1)} style={navBtn} title="Previous month">‹</button>
          <button onClick={() => shift(1)} style={navBtn} title="Next month">›</button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{monthLabel}</div>
        <button onClick={() => setView(HOME_VIEW)} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-chip)', padding: '3px 9px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Today</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>In <span className="num pos" style={{ fontWeight: 600 }}>+${fmtN(monthIn)}</span></span>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Out <span className="num neg" style={{ fontWeight: 600 }}>−${fmtN(monthOut)}</span></span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--line)' }}>
        {WEEKDAYS.map(d => <div key={d} style={{ padding: '7px 0 6px', textAlign: 'center', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: 'minmax(92px, 1fr)' }}>
        {visible.map((d, i) => {
          const inMonth = d.getMonth() === view.m;
          const isToday = dayKey(d) === dayKey(today);
          const evs = byDay[dayKey(d)] || [];
          const isSel = sel === dayKey(d);
          return (
            <div key={i} onClick={() => evs.length && setSel(isSel ? null : dayKey(d))}
              style={{ borderRight: (i % 7 !== 6) ? '1px solid var(--line)' : 0, borderBottom: i < visible.length - 7 ? '1px solid var(--line)' : 0, padding: '5px 6px', background: isSel ? 'var(--accent-weak)' : (inMonth ? 'transparent' : 'var(--surface-2)'), cursor: evs.length ? 'pointer' : 'default', minWidth: 0, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
                <span className="num" style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--on-accent)' : (inMonth ? 'var(--text-2)' : 'var(--text-faint)'), background: isToday ? 'var(--accent)' : 'transparent', width: 19, height: 19, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>{d.getDate()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {evs.slice(0, 3).map((e, j) => (
                  <div key={j} title={`${evName(e.label)} · ${e.pos ? '+' : '−'}$${fmtN(e.amt)}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 5px', borderRadius: 4, background: e.pos ? 'var(--pos-weak)' : 'var(--neg-weak)', borderLeft: `2px solid ${e.pos ? 'var(--pos)' : 'var(--neg)'}` }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 10, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evName(e.label)}</span>
                    <span className="num" style={{ fontSize: 9.5, fontWeight: 600, color: e.pos ? 'var(--pos)' : 'var(--neg)' }}>{e.pos ? '+' : '−'}{Math.abs(e.amt) >= 1000 ? (Math.abs(e.amt) / 1000).toFixed(1) + 'k' : Math.round(Math.abs(e.amt))}</span>
                  </div>
                ))}
                {evs.length > 3 && <span style={{ fontSize: 9.5, color: 'var(--text-faint)', paddingLeft: 5 }}>+{evs.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
      {sel && selEvents.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', padding: '11px 16px', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', marginBottom: 7 }}>{new Date(view.y, view.m, +sel.split('-')[2]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          {selEvents.map((e, j) => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: e.pos ? 'var(--pos)' : 'var(--neg)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{evName(e.label)}</span>
              {e.pos ? <Badge tone="pos">Deposit</Badge> : <Badge tone="neutral">Bill</Badge>}
              <span className="num" style={{ fontSize: 13, fontWeight: 600, color: e.pos ? 'var(--pos)' : 'var(--neg)', minWidth: 80, textAlign: 'right' }}>{e.pos ? '+' : '−'}${fmtN(e.amt)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function BillsScreen() {
  const D = AppData;
  const f = D.forecast;
  const events = f.eventMarks.map((e, i) => ({ ...e, id: i }));
  // KPIs DERIVED from the upcoming-bills list + forecast so they can't drift.
  const due7 = D.upcomingBills.filter(b => b.daysUntil <= 7);
  const due7Total = due7.reduce((s, b) => s + b.amount, 0);
  const autopayCount = D.upcomingBills.filter(b => b.autopay).length;
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Due in 7 days" v={fmt(due7Total, { maximumFractionDigits: 0 })} d={`${due7.length} ${due7.length === 1 ? 'bill' : 'bills'}`} dColor="var(--neg)" />
          <Stat k="Scheduled In · 60d" v={`+${fmt(f.in60, { maximumFractionDigits: 0 })}`} d={`${f.paydays} deposits`} dColor="var(--pos)" />
          <Stat k="On Autopay" v={`${autopayCount} of ${D.upcomingBills.length}`} d="bills automated" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--gap)', alignItems: 'start' }}>
          <BillsCalendar events={events} />
          <Card title="Upcoming · this cycle">
            {D.upcomingBills.map(b => {
              const urgent = b.daysUntil <= 3;
              const due = daysFromToday(b.daysUntil);
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                    <div className="num" style={{ fontSize: 15, fontWeight: 700, color: urgent ? 'var(--neg)' : 'var(--text)' }}>{due.getDate()}</div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--text-faint)', letterSpacing: '0.05em' }}>{due.toLocaleDateString('en-US', { month: 'short' })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{b.payee}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{b.cat} · in {b.daysUntil} days</div>
                  </div>
                  {b.autopay && <Badge tone="info">AUTO</Badge>}
                  <div className="num" style={{ fontSize: 13.5, fontWeight: 600, color: urgent ? 'var(--neg)' : 'var(--text)' }}>${fmtN(b.amount)}</div>
                </div>
              );
            })}
          </Card>
        </div>
        <div style={{ marginTop: 'var(--gap)' }}>
          <Card title="All scheduled · next 60 days" pad={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
              <thead><tr><th style={TH({ width: 70 })}>Date</th><th style={TH()}>Item</th><th style={TH({ width: 90 })}>Type</th><th style={TH({ width: 110, textAlign: 'right' })}>Amount</th></tr></thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={e.id} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent' }}>
                    <td className="num" style={TD({ color: 'var(--text-3)' })}>{e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td style={TD({ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{e.label === 'Payday' ? 'Employer Payroll' : e.label === 'Net' ? 'Transfer → Brokerage' : e.label === 'Card' ? 'Sapphire Reserve' : e.label === 'Auto' ? 'Auto Loan' : e.label === 'Utils' ? 'Utilities' : e.label}</td>
                    <td style={TD()}>{e.pos ? <Badge tone="pos">Deposit</Badge> : <Badge tone="neutral">Bill</Badge>}</td>
                    <td className="num" style={TD({ textAlign: 'right', fontWeight: 600, color: e.pos ? 'var(--pos)' : 'var(--neg)' })}>{e.pos ? '+' : '−'}${fmtN(e.amt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============ REPORTS ============ */
// Four real report views, all DERIVED from the same ledger/data the rest of
// the app uses. The period is the app-wide trailing-30-day window — shown as
// an honest label, not a fake switcher (the demo ledger spans ~60 days, so a
// Quarter/YTD toggle could only lie).
export function ReportsScreen({ onNav }) {
  const D = AppData;
  const [view, setView] = useMoreS('spending');

  // spending view data
  const cats = D.spendingByCategory;
  const maxCat = Math.max(...cats.map(c => c.amount));
  const payees = D.topPayees;

  // income view data — derived from the checking ledger's income rows
  const incomeRows = D.transactions.filter(t => t.amount > 0);
  const bySource = {};
  incomeRows.forEach(t => { const src = (t.cat || 'Other').split(' : ').pop(); bySource[src] = (bySource[src] || 0) + t.amount; });
  const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const maxSrc = Math.max(...sources.map(([, v]) => v), 1);
  const byPayee = {};
  incomeRows.forEach(t => { const k = t.payee; byPayee[k] = byPayee[k] || { payee: k, cat: t.cat, txns: 0, total: 0 }; byPayee[k].txns++; byPayee[k].total += t.amount; });
  const incomePayees = Object.values(byPayee).sort((a, b) => b.total - a.total);

  // cash-flow view data — monthly net from the shared trend
  const flow = D.monthlyTrend.map(m => ({ ...m, net: m.income - m.expense }));
  const maxAbsNet = Math.max(...flow.map(f => Math.abs(f.net)), 1);
  // canonical savings rate (same derivation the Dashboard shows) — never a second formula
  const savingsRate = D.totals.savingsRate.toFixed(1);

  // net-worth view data — same interactive chart language as the Net Worth screen
  const hist = D.netWorthHistory;
  const nwTrend = hist.map(h => ({ label: h.m, sub: String(h.year), value: h.net * 1000 }));

  // comparison view data (Quicken-style period comparison) — current vs prior
  // trailing-30 windows, straight from the canonical period derivations.
  const catTotals = (rows) => {
    const m = {};
    rows.filter(t => t.amount < 0 && !isTransfer(t)).forEach(t => {
      const c = (t.cat || 'Uncategorized').split(' : ')[0].trim() || 'Uncategorized';
      m[c] = (m[c] || 0) + Math.abs(t.amount);
    });
    return m;
  };
  const curCats = catTotals(D.totals.rows), prevCats = catTotals(D.prior.rows);
  const compare = [...new Set([...Object.keys(curCats), ...Object.keys(prevCats)])]
    .map(c => ({ cat: c, cur: curCats[c] || 0, prev: prevCats[c] || 0, delta: (curCats[c] || 0) - (prevCats[c] || 0), color: D.catColor[c] || 'var(--cat-4)' }))
    .sort((a, b) => b.cur - a.cur);
  const cmpTotal = { cur: compare.reduce((s, c) => s + c.cur, 0), prev: compare.reduce((s, c) => s + c.prev, 0) };

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--gap)' }}>
          <Segmented value={view} onChange={setView} options={[{ value: 'spending', label: 'Spending' }, { value: 'income', label: 'Income' }, { value: 'cashflow', label: 'Cash Flow' }, { value: 'compare', label: 'Comparison' }, { value: 'networth', label: 'Net Worth' }]} />
          <div style={{ flex: 1 }} />
          <Badge tone="neutral">{D.period.shortLabel}</Badge>
        </div>

        {view === 'spending' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
            <Card title={`Spending by Category · ${D.period.shortLabel}`}>
              {cats.map((c, i) => (
                <div key={i} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: c.color }} />{c.category}</span>
                    <span className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>${fmtN(c.amount)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--inset)', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: (c.amount / maxCat * 100) + '%', height: '100%', background: c.color, borderRadius: 99 }} /></div>
                </div>
              ))}
            </Card>
            <Card title={`Top Payees · ${D.period.shortLabel}`} pad={false}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
                <thead><tr><th style={TH()}>Payee</th><th style={TH({ width: 100 })}>Category</th><th style={TH({ width: 50, textAlign: 'right' })}>#</th><th style={TH({ width: 100, textAlign: 'right' })}>Total</th></tr></thead>
                <tbody>
                  {payees.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent' }}>
                      <td style={TD({ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{p.payee}</td>
                      <td style={TD({ color: 'var(--text-2)' })}>{p.cat}</td>
                      <td className="num" style={TD({ textAlign: 'right', color: 'var(--text-3)' })}>{p.txns}</td>
                      <td className="num" style={TD({ textAlign: 'right', fontWeight: 600 })}>${fmtN(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <Card title="Monthly Income vs Spending · 6 months">
            <AreaTrend data={D.monthlyTrend} height={230} />
          </Card>
        </>}

        {view === 'income' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
            <Card title={`Income by Source · ${D.period.shortLabel}`}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <Donut segments={sources.map(([src, v], i) => ({ value: v, color: `var(--cat-${(i % 8) + 1})`, label: src }))} size={150} />
              </div>
              {sources.map(([src, v], i) => (
                <div key={src} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: `var(--cat-${(i % 8) + 1})` }} />{src}</span>
                    <span className="num" style={{ color: 'var(--pos)', fontWeight: 600 }}>+${fmtN(v)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--inset)', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: (v / maxSrc * 100) + '%', height: '100%', background: 'var(--pos)', borderRadius: 99 }} /></div>
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-3)' }}>Total income · {D.period.shortLabel}</span>
                <span className="num" style={{ fontWeight: 700, color: 'var(--pos)' }}>+{fmt(D.totals.income)}</span>
              </div>
            </Card>
            <Card title="Income Payees" pad={false}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
                <thead><tr><th style={TH()}>Payee</th><th style={TH({ width: 130 })}>Category</th><th style={TH({ width: 50, textAlign: 'right' })}>#</th><th style={TH({ width: 110, textAlign: 'right' })}>Total</th></tr></thead>
                <tbody>
                  {incomePayees.map((p, i) => (
                    <tr key={p.payee} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent' }}>
                      <td style={TD({ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{p.payee}</td>
                      <td style={TD({ color: 'var(--text-2)' })}>{(p.cat || '').split(' : ').pop()}</td>
                      <td className="num" style={TD({ textAlign: 'right', color: 'var(--text-3)' })}>{p.txns}</td>
                      <td className="num" style={TD({ textAlign: 'right', fontWeight: 600, color: 'var(--pos)' })}>+${fmtN(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <Card title="Monthly Income vs Spending · 6 months">
            <AreaTrend data={D.monthlyTrend} height={230} />
          </Card>
        </>}

        {view === 'cashflow' && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
            <Stat k={`In · ${D.period.shortLabel}`} v={`+${fmt(D.totals.income, { maximumFractionDigits: 0 })}`} dColor="var(--pos)" d="all income" />
            <Stat k={`Out · ${D.period.shortLabel}`} v={`−${fmt(D.totals.spending, { maximumFractionDigits: 0 })}`} dColor="var(--neg)" d="spending, excl. transfers" />
            <Stat k="Savings Rate" v={`${savingsRate}%`} d="Goal: 15%" dColor="var(--pos)" />
          </div>
          <Card title="Net Cash Flow by Month · 6 months — income minus spending">
            {flow.map(f => (
              <div key={f.m} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ width: 34, fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>{f.m}</span>
                <div style={{ flex: 1, height: 10, background: 'var(--inset)', borderRadius: 99, overflow: 'hidden', display: 'flex', justifyContent: f.net < 0 ? 'flex-end' : 'flex-start' }}>
                  <div style={{ width: (Math.abs(f.net) / maxAbsNet * 100) + '%', height: '100%', background: f.net < 0 ? 'var(--neg)' : 'var(--pos)', borderRadius: 99 }} />
                </div>
                <span className="num" style={{ width: 86, textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: f.net < 0 ? 'var(--neg)' : 'var(--pos)' }}>{f.net < 0 ? '−' : '+'}${fmtN(Math.abs(f.net))}</span>
              </div>
            ))}
          </Card>
        </>}

        {view === 'compare' && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
            <Stat k="Spending · this period" v={fmt(cmpTotal.cur, { maximumFractionDigits: 0 })} d={D.period.shortLabel} />
            <Stat k="Spending · prior period" v={fmt(cmpTotal.prev, { maximumFractionDigits: 0 })} d="the 30 days before" />
            <Stat k="Change" v={`${cmpTotal.cur - cmpTotal.prev >= 0 ? '+' : '−'}${fmt(Math.abs(cmpTotal.cur - cmpTotal.prev), { maximumFractionDigits: 0 })}`} d={cmpTotal.cur > cmpTotal.prev ? 'spending more' : 'spending less'} dColor={cmpTotal.cur > cmpTotal.prev ? 'var(--neg)' : 'var(--pos)'} />
          </div>
          <Card title="Where the money went · prior vs this period" style={{ marginBottom: 'var(--gap)' }}>
            {/* MS Money-style twin pies: slice = category share of that period,
                pie AREA = that period's total spend (√-scaled diameter), so you
                see both the mix shifting AND the pie itself growing/shrinking. */}
            {(() => {
              const maxTot = Math.max(cmpTotal.cur, cmpTotal.prev, 1);
              const sizeFor = t => Math.max(96, Math.round(190 * Math.sqrt(t / maxTot)));
              const pie = (key) => compare.filter(c => c[key] > 0).map(c => ({ value: c[key], color: c.color, label: c.cat }));
              return (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 64, padding: '8px 0 4px' }}>
                  {[['prev', 'Prior 30 days', cmpTotal.prev], ['cur', D.period.shortLabel, cmpTotal.cur]].map(([key, label, tot]) => (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <Donut segments={pie(key)} size={sizeFor(tot)} />
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>{label}</div>
                      <div className="num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>${fmtN(tot)}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              {compare.map(c => (
                <span key={c.cat} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-2)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: c.color }} />{c.cat}
                </span>
              ))}
            </div>
          </Card>
          <Card title="Spending by Category · this period vs prior" pad={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
              <thead><tr><th style={TH()}>Category</th><th style={TH({ width: 110, textAlign: 'right' })}>This period</th><th style={TH({ width: 110, textAlign: 'right' })}>Prior</th><th style={TH({ width: 130, textAlign: 'right' })}>Change</th></tr></thead>
              <tbody>
                {compare.map((c, i) => (
                  <tr key={c.cat} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent' }}>
                    <td style={TD({ fontWeight: 500 })}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: c.color }} />{c.cat}</span></td>
                    <td className="num" style={TD({ textAlign: 'right', fontWeight: 600 })}>${fmtN(c.cur)}</td>
                    <td className="num" style={TD({ textAlign: 'right', color: 'var(--text-3)' })}>${fmtN(c.prev)}</td>
                    <td className="num" style={TD({ textAlign: 'right', fontWeight: 600, color: c.delta > 0 ? 'var(--neg)' : c.delta < 0 ? 'var(--pos)' : 'var(--text-3)' })}>{c.delta === 0 ? '—' : `${c.delta > 0 ? '▲ +' : '▼ −'}$${fmtN(Math.abs(c.delta))}`}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--surface-3)' }}>
                  <td style={TD({ fontWeight: 700 })}>Total</td>
                  <td className="num" style={TD({ textAlign: 'right', fontWeight: 700 })}>${fmtN(cmpTotal.cur)}</td>
                  <td className="num" style={TD({ textAlign: 'right', fontWeight: 600, color: 'var(--text-3)' })}>${fmtN(cmpTotal.prev)}</td>
                  <td className="num" style={TD({ textAlign: 'right', fontWeight: 700, color: cmpTotal.cur - cmpTotal.prev > 0 ? 'var(--neg)' : 'var(--pos)' })}>{`${cmpTotal.cur - cmpTotal.prev > 0 ? '▲ +' : '▼ −'}$${fmtN(Math.abs(cmpTotal.cur - cmpTotal.prev))}`}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </>}

        {view === 'networth' && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
            <Stat k="Net Worth" v={fmt(D.netWorth, { maximumFractionDigits: 0 })} d={`▲ ${fmt(D.netWorthDelta12mo, { maximumFractionDigits: 0 })} over 12 mo`} dColor="var(--pos)" />
            <Stat k="Assets" v={fmt(D.accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0), { maximumFractionDigits: 0 })} d={`${D.accounts.filter(a => a.balance > 0).length} accounts`} />
            <Stat k="Debts" v={fmt(Math.abs(D.accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0)), { maximumFractionDigits: 0 })} d="being paid down" dColor="var(--neg)" />
          </div>
          <Card title="Net Worth · trailing 12 months" action={
            <button onClick={() => onNav && onNav('networth')} style={{ fontSize: 12, color: 'var(--accent)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>Open Net Worth →</button>
          }>
            <LineTrend data={nwTrend} height={260} />
          </Card>
        </>}
      </div>
    </div>
  );
}

// NOTE: a duplicate (static) GoalsScreen lived here but was never wired (app.jsx
// imports the interactive GoalsScreen from Depth.jsx). Removed to prevent drift.
