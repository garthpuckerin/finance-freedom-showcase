/* Finance Freedom — depth screens: Net Worth, Budgets, Goals (interactive) */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { Stat, Card, Segmented, Badge } from './ui.jsx';
import { GaugeBar } from './charts.jsx';
import { Modal } from './Overlays.jsx';
import { StyleChips, StyleLens, useBudgetStyle, deriveStyleMetrics } from './BudgetStyles.jsx';
const { useState: useDpS, useMemo: useDpM } = React;

const DTH = (extra) => Object.assign({ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600, padding: '9px 14px', background: 'var(--surface-3)', borderBottom: '1px solid var(--line-2)' }, extra);
const DTD = (extra) => Object.assign({ padding: '0 14px', height: 'var(--row-h)', borderBottom: '1px solid var(--line)', color: 'var(--text)', fontSize: 'var(--fs-table)', verticalAlign: 'middle' }, extra);

/* ============ NET WORTH ============ */
const NW_GROUPS = [
  { key: 'cash', label: 'Cash', color: 'var(--cat-2)', accts: ['chk', 'sav'] },
  { key: 'invest', label: 'Investments', color: 'var(--cat-1)', accts: ['brk', '401'] },
  { key: 'assets', label: 'Other Assets', color: 'var(--cat-5)', accts: ['car'] },
  { key: 'debts', label: 'Debts', color: 'var(--cat-4)', accts: ['cc', 'loan'] },
];

export function NetWorthScreen() {
  const D = AppData;
  const hist = D.netWorthHistory;
  const [mode, setMode] = useDpS('net'); // net | assets | debts
  const [hover, setHover] = useDpS(null);

  const assets = D.accounts.filter(a => a.balance > 0);
  const debts = D.accounts.filter(a => a.balance < 0);
  const totA = assets.reduce((s, a) => s + a.balance, 0);
  const totD = debts.reduce((s, a) => s + a.balance, 0);

  // synthesize per-group history ($, not k) from current balances back-cast along the net trend shape
  const groupSeries = useDpM(() => {
    const n = hist.length;
    const factor = hist.map(h => h.net) ;
    const base = factor[n - 1];
    return NW_GROUPS.map(g => {
      const rawCur = g.accts.reduce((s, id) => { const a = D.accounts.find(x => x.id === id); return s + (a ? a.balance : 0); }, 0);
      // Debts are carried as a POSITIVE magnitude so the net = assets − debts
      // pins the series endpoint to the real net worth (and the debts-mode line
      // reads as a positive balance owed).
      const cur = g.key === 'debts' ? Math.abs(rawCur) : rawCur;
      const vals = hist.map((h, i) => {
        // Assets grow toward today (older months smaller). Debts run the
        // OTHER way — the household is paying them down, so older months
        // carry MORE debt (~3.5%/mo, ≈ the loan principal + card paydown).
        const growth = g.key === 'debts'
          ? 1 + (n - 1 - i) * 0.035
          : 0.62 + 0.38 * (factor[i] / base);
        const wobble = 1 + Math.sin((i + g.key.length) / 2.1) * (g.key === 'debts' ? 0.012 : 0.03);
        return cur * growth * wobble;
      });
      // pin the latest month to the exact current balance
      const k = vals[n - 1] ? cur / vals[n - 1] : 1;
      return { ...g, cur, vals: vals.map(v => v * k) };
    });
  }, [hist]);

  const series = useDpM(() => hist.map((h, i) => {
    const a = groupSeries.filter(g => g.key !== 'debts').reduce((s, g) => s + g.vals[i], 0);
    const d = groupSeries.find(g => g.key === 'debts').vals[i];
    return { m: h.m, year: h.year, assets: a, debts: d, net: a - d };
  }), [groupSeries]);

  const valueOf = (pt) => mode === 'assets' ? pt.assets : mode === 'debts' ? pt.debts : pt.net;
  const vals = series.map(valueOf);
  const max = Math.max(...vals) * 1.08;
  const min = Math.min(0, Math.min(...vals) * 0.92);
  const lineColor = mode === 'debts' ? 'var(--neg)' : 'var(--accent)';

  const W = 880, Ht = 280, pl = 58, pr = 16, pt = 18, pb = 30;
  const iw = W - pl - pr, ih = Ht - pt - pb;
  const xx = i => pl + iw / (series.length - 1) * i;
  const yy = v => pt + ih - ((v - min) / (max - min)) * ih;
  const pts = series.map((s, i) => `${xx(i)},${yy(valueOf(s))}`).join(' ');
  const hp = hover != null ? series[hover] : series[series.length - 1];
  const hi = hover != null ? hover : series.length - 1;

  const kfmt = v => (v >= 0 ? '' : '−') + '$' + (Math.abs(v) / 1000).toFixed(0) + 'k';

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Net Worth" v={fmt(D.netWorth, { maximumFractionDigits: 0 })} d={`${D.netWorthDelta12mo >= 0 ? '▲' : '▼'} ${fmt(Math.abs(D.netWorthDelta12mo), { maximumFractionDigits: 0 })} over 12 mo`} dColor={D.netWorthDelta12mo >= 0 ? 'var(--pos)' : 'var(--neg)'} />
          <Stat k="Total Assets" v={fmt(totA, { maximumFractionDigits: 0 })} d={`${assets.length} accounts`} />
          <Stat k="Total Debts" v={fmt(Math.abs(totD), { maximumFractionDigits: 0 })} d={`${debts.length} accounts`} dColor="var(--neg)" />
        </div>

        <Card style={{ marginBottom: 'var(--gap)' }} title="Trend · trailing 12 months" action={
          <Segmented size="sm" value={mode} onChange={setMode} options={[{ value: 'net', label: 'Net Worth' }, { value: 'assets', label: 'Assets' }, { value: 'debts', label: 'Debts' }]} />
        }>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span className="num" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: mode === 'debts' ? 'var(--neg)' : 'var(--text)' }}>{fmt(valueOf(hp), { maximumFractionDigits: 0 })}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{hp.m} {hp.year}</span>
          </div>
          <svg viewBox={`0 0 ${W} ${Ht}`} style={{ width: '100%', height: 'auto', display: 'block' }} onMouseLeave={() => setHover(null)}>
            <defs><linearGradient id="nwFill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lineColor} stopOpacity="0.16" /><stop offset="100%" stopColor={lineColor} stopOpacity="0" /></linearGradient></defs>
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => { const v = min + (max - min) * f; return <g key={i}><line x1={pl} y1={pt + ih - f * ih} x2={W - pr} y2={pt + ih - f * ih} stroke="var(--line)" /><text x={pl - 8} y={pt + ih - f * ih + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-num)" fill="var(--text-faint)">{kfmt(v)}</text></g>; })}
            <polygon points={`${pts} ${xx(series.length - 1)},${yy(0)} ${xx(0)},${yy(0)}`} fill="url(#nwFill2)" />
            <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" />
            {series.map((s, i) => (
              <g key={i}>
                <rect x={xx(i) - iw / series.length / 2} y={pt} width={iw / series.length} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
                <circle cx={xx(i)} cy={yy(valueOf(s))} r={i === hi ? 4.5 : 3} fill="var(--surface)" stroke={lineColor} strokeWidth={i === hi ? 2.5 : 2} />
                <text x={xx(i)} y={Ht - 9} textAnchor="middle" fontSize="10" fill={i === hi ? 'var(--text)' : 'var(--text-3)'} fontWeight={i === hi ? 600 : 400} fontFamily="var(--font-ui)">{s.m}</text>
              </g>
            ))}
            {hover != null && <line x1={xx(hi)} y1={pt} x2={xx(hi)} y2={pt + ih} stroke={lineColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />}
          </svg>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'var(--gap)', alignItems: 'start' }}>
          <Card title="Composition over time" sub="stacked by account group">
            <StackedBars series={groupSeries} months={hist.map(h => h.m)} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              {groupSeries.map(g => (
                <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color }} />
                  <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{g.label}</span>
                  <span className="num" style={{ fontSize: 11.5, fontWeight: 600, color: g.key === 'debts' ? 'var(--neg)' : 'var(--text)' }}>{g.key === 'debts' ? '−' : ''}${fmtN(Math.abs(g.cur))}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="What you own & owe" pad={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
              <thead><tr><th style={DTH()}>Account</th><th style={DTH({ width: 110 })}>Type</th><th style={DTH({ width: 140, textAlign: 'right' })}>Balance</th></tr></thead>
              <tbody>
                {[...assets, ...debts].map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent' }}>
                    <td style={DTD({ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}><span style={{ color: 'var(--accent)', fontSize: 14 }}>{a.glyph}</span>{a.name}</span></td>
                    <td style={DTD()}><Badge tone="neutral">{a.kind}</Badge></td>
                    <td className="num" style={DTD({ textAlign: 'right', fontWeight: 600, color: a.balance < 0 ? 'var(--neg)' : 'var(--text)' })}>{a.balance < 0 ? '−' : ''}${fmtN(a.balance)}</td>
                  </tr>
                ))}
                <tr><td style={DTD({ borderBottom: 0, fontWeight: 700 })}>Net Worth</td><td style={DTD({ borderBottom: 0 })}></td><td className="num" style={DTD({ borderBottom: 0, textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 14 })}>${fmtN(D.netWorth)}</td></tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StackedBars({ series, months }) {
  const n = months.length;
  const stacks = months.map((m, i) => {
    const pos = series.filter(g => g.key !== 'debts').map(g => ({ color: g.color, v: g.vals[i] }));
    const posTotal = pos.reduce((s, x) => s + x.v, 0);
    const debt = series.find(g => g.key === 'debts').vals[i];
    return { m, pos, posTotal, debt };
  });
  const maxPos = Math.max(...stacks.map(s => s.posTotal)) * 1.05;
  const H = 150, dz = 26; // dz = debt zone height below baseline
  const bw = 100 / n;
  return (
    <svg viewBox={`0 0 600 ${H + dz + 18}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1="0" y1={H} x2="600" y2={H} stroke="var(--line-2)" />
      {stacks.map((s, i) => {
        const cx = (i + 0.5) * (600 / n);
        const w = (600 / n) * 0.62;
        let y = H;
        const maxDebt = Math.max(...stacks.map(x => Math.abs(x.debt))) || 1;
        return (
          <g key={i}>
            {s.pos.map((p, j) => { const h = p.v / maxPos * H; y -= h; return <rect key={j} x={cx - w / 2} y={y} width={w} height={Math.max(0, h - 1)} fill={p.color} rx="1.5" />; })}
            <rect x={cx - w / 2} y={H + 1} width={w} height={Math.max(0, Math.abs(s.debt) / maxDebt * dz)} fill="var(--cat-4)" opacity="0.85" rx="1.5" />
            <text x={cx} y={H + dz + 13} textAnchor="middle" fontSize="9.5" fill="var(--text-3)" fontFamily="var(--font-ui)">{s.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============ BUDGETS (editable) ============ */
export function BudgetsScreen() {
  const D = AppData;
  const [rows, setRows] = useDpS(() => D.budgets.map(b => ({ ...b, rollover: b.id === 'b1' || b.id === 'b8', prevRoll: b.id === 'b1' ? 84 : b.id === 'b8' ? 28 : 0 })));
  const [editing, setEditing] = useDpS(null);
  const [style, setStyle] = useBudgetStyle();

  const totBudget = rows.reduce((s, b) => s + b.budgeted, 0);
  const totSpent = rows.reduce((s, b) => s + b.spent, 0);
  // "Left to assign" nets ALL commitments — envelopes + housing (rent) +
  // savings transfers — against income, so it can't contradict the zero-based /
  // FIRE lenses (which account the same way). income-minus-envelopes alone
  // overstated free cash by ignoring the two biggest outflows (rent + savings).
  const m = deriveStyleMetrics(rows);
  const income = m.income;
  const surplus = income - (m.totBudget + m.rent + m.savings);
  const remaining = totBudget - totSpent;

  function setAmt(id, v) { setRows(rs => rs.map(b => b.id === id ? { ...b, budgeted: Math.max(0, Math.round(v)) } : b)); }
  function toggleRoll(id) { setRows(rs => rs.map(b => b.id === id ? { ...b, rollover: !b.rollover } : b)); }
  function fundFromSurplus(id) { if (surplus <= 0) return; setRows(rs => rs.map(b => b.id === id ? { ...b, budgeted: b.budgeted + 50 } : b)); }

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--gap)' }}>
          <StyleChips value={style} onChange={setStyle} />
        </div>
        <StyleLens style={style} rows={rows} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k={`Budgeted · ${D.period.shortLabel}`} v={fmt(totBudget, { maximumFractionDigits: 0 })} d={`across ${rows.length} envelopes`} />
          <Stat k="Spent so far" v={fmt(totSpent, { maximumFractionDigits: 0 })} d={`${Math.round(totSpent / totBudget * 100)}% of plan`} dColor="var(--text-3)" />
          <Stat k="Remaining" v={fmt(remaining, { maximumFractionDigits: 0 })} d="in this period" dColor={remaining < 0 ? 'var(--neg)' : 'var(--pos)'} />
          <Stat k="Left to Assign" v={fmt(surplus, { maximumFractionDigits: 0 })} d={surplus >= 0 ? 'after housing & savings' : 'over-allocated — trim an envelope'} dColor={surplus >= 0 ? 'var(--accent)' : 'var(--neg)'} />
        </div>

        {surplus > 0 && (
          <div className="card" style={{ padding: '12px 16px', marginBottom: 'var(--gap)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--accent-weak)', borderColor: 'var(--accent-line)' }}>
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>✦</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text-2)' }}>You have <b className="num" style={{ color: 'var(--text)' }}>${fmtN(surplus)}</b> left to assign after housing & savings. Click <b>Fund +$50</b> on any envelope to put it to work.</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 'var(--gap)' }}>
          {rows.map(b => {
            const effective = b.budgeted + (b.rollover ? b.prevRoll : 0);
            const pct = Math.round(b.spent / effective * 100);
            const over = b.spent > effective;
            const isEd = editing === b.id;
            return (
              <div key={b.id} className="card" style={{ padding: 'var(--pad)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: b.color }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{b.category}</span>
                    {b.rollover && <Badge tone="accent">+${b.prevRoll} rollover</Badge>}
                  </div>
                  {over ? <Badge tone="neg">Over ${fmtN(b.spent - effective)}</Badge> : <Badge tone="neutral">{Math.max(0, 100 - pct)}% left</Badge>}
                </div>
                <GaugeBar value={b.spent} max={effective} color={over ? 'var(--neg)' : b.color} height={8} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 12.5 }}>
                  <span className="num" style={{ color: over ? 'var(--neg)' : 'var(--text)', fontWeight: 600 }}>${fmtN(b.spent)} <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>spent</span></span>
                  <span className="num" style={{ color: 'var(--text-faint)' }}>of ${fmtN(effective)}</span>
                </div>

                {/* edit controls */}
                <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--line)' }}>
                  {!isEd ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => setEditing(b.id)} style={ctrlBtn}>✎ Adjust</button>
                      <button onClick={() => toggleRoll(b.id)} style={Object.assign({}, ctrlBtn, b.rollover ? { color: 'var(--accent)', borderColor: 'var(--accent-line)', background: 'var(--accent-weak)' } : {})}>{b.rollover ? '✓ ' : ''}Rollover</button>
                      {surplus > 0 && <button onClick={() => fundFromSurplus(b.id)} style={Object.assign({}, ctrlBtn, { marginLeft: 'auto', color: 'var(--accent)' })}>Fund +$50</button>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>Monthly budget</span>
                        <input type="range" min="0" max="1500" step="25" value={b.budgeted} onChange={e => setAmt(b.id, +e.target.value)} style={{ flex: 1, accentColor: b.color }} />
                        <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', minWidth: 70, textAlign: 'right' }}>${b.budgeted}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditing(null)} style={Object.assign({}, ctrlBtn, { color: 'var(--accent)', borderColor: 'var(--accent-line)', background: 'var(--accent-weak)' })}>Done</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const ctrlBtn = { fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '5px 11px', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' };

/* ============ GOALS (fundable) ============ */
export function GoalsScreen() {
  const D = AppData;
  const today = new Date(D.labels.today);
  const [goals, setGoals] = useDpS([
    { id: 'g1', name: 'Emergency Fund', target: 30000, saved: 24500, monthly: 1000, color: 'var(--cat-2)' },
    { id: 'g2', name: 'House Down Payment', target: 120000, saved: 68400, monthly: 2200, color: 'var(--cat-1)' },
    { id: 'g3', name: 'Tesla Payoff', target: 8806, saved: 8806, monthly: 0, color: 'var(--cat-5)' },
    { id: 'g4', name: 'Hawaii Trip', target: 6000, saved: 2150, monthly: 550, color: 'var(--cat-3)' },
    { id: 'g5', name: 'New Laptop', target: 3200, saved: 2880, monthly: 320, color: 'var(--cat-6)' },
  ]);
  const [fund, setFund] = useDpS(null); // {id, amount}

  const etaOf = (g) => {
    if (g.saved >= g.target) return 'Funded';
    if (g.monthly <= 0) return 'No contribution';
    const months = Math.ceil((g.target - g.saved) / g.monthly);
    const d = new Date(today); d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  const tot = goals.reduce((s, g) => s + g.saved, 0), totT = goals.reduce((s, g) => s + g.target, 0);
  const totMonthly = goals.reduce((s, g) => s + (g.saved < g.target ? g.monthly : 0), 0);

  function setMonthly(id, v) { setGoals(gs => gs.map(g => g.id === id ? { ...g, monthly: Math.max(0, Math.round(v / 10) * 10) } : g)); }
  function applyFund() {
    if (!fund) return;
    const amt = parseFloat(fund.amount) || 0;
    setGoals(gs => gs.map(g => g.id === fund.id ? { ...g, saved: Math.min(g.target, g.saved + amt) } : g));
    setFund(null);
    window.__ffToast && window.__ffToast(`Added $${fmtN(amt)} to goal`);
  }
  const fundGoal = fund ? goals.find(g => g.id === fund.id) : null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Saved Toward Goals" v={fmt(tot, { maximumFractionDigits: 0 })} d={`${Math.round(tot / totT * 100)}% of all targets`} dColor="var(--pos)" />
          <Stat k="Active Goals" v={`${goals.filter(g => g.saved < g.target).length}`} d={`${goals.filter(g => g.saved >= g.target).length} completed`} />
          <Stat k="Monthly Contribution" v={fmt(totMonthly, { maximumFractionDigits: 0 })} d="across active goals" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 'var(--gap)' }}>
          {goals.map(g => {
            const pct = Math.min(100, Math.round(g.saved / g.target * 100)), done = g.saved >= g.target;
            return (
              <div key={g.id} className="card" style={{ padding: 'var(--pad)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{g.name}</span>
                  </div>
                  {done ? <Badge tone="pos">✓ Funded</Badge> : <Badge tone="neutral">ETA {etaOf(g)}</Badge>}
                </div>
                <GaugeBar value={g.saved} max={g.target} color={done ? 'var(--pos)' : g.color} height={9} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 12.5 }}>
                  <span className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>${fmtN(g.saved)} <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>/ ${g.target.toLocaleString()}</span></span>
                  <span className="num" style={{ fontWeight: 700, color: done ? 'var(--pos)' : 'var(--accent)' }}>{pct}%</span>
                </div>
                {!done && (
                  <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>Monthly</span>
                      <input type="range" min="0" max="3000" step="50" value={g.monthly} onChange={e => setMonthly(g.id, +e.target.value)} style={{ flex: 1, accentColor: g.color }} />
                      <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 56, textAlign: 'right' }}>${g.monthly}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{g.monthly > 0 ? `On track for ${etaOf(g)}` : 'Set a monthly contribution'}</span>
                      <button onClick={() => setFund({ id: g.id, amount: '500' })} style={Object.assign({}, ctrlBtn, { marginLeft: 'auto', color: 'var(--accent)', borderColor: 'var(--accent-line)', background: 'var(--accent-weak)' })}>＋ Add funds</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {fundGoal && (
        <Modal open={true} onClose={() => setFund(null)} title={`Fund ${fundGoal.name}`} sub="Move money from an account into this goal" width={440}
          footer={<><div style={{ flex: 1 }} /><button style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }} onClick={() => setFund(null)}>Cancel</button><button style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-accent)', background: 'var(--accent-fill)', border: 0, borderRadius: 'var(--r-ctrl)', padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }} onClick={applyFund}>Transfer funds</button></>}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>From account</label>
            <select defaultValue="sav" style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '9px 11px' }}>
              {D.accounts.filter(a => a.balance > 0).map(a => <option key={a.id} value={a.id}>{a.name} — ${fmtN(a.balance)}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: 13 }}>$</span>
              <input value={fund.amount} onChange={e => setFund({ ...fund, amount: e.target.value })} className="num" style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontFamily: 'var(--font-num)', fontSize: 15, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '9px 11px 9px 22px', textAlign: 'right' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[250, 500, 1000, fundGoal.target - fundGoal.saved].map((v, i) => (
                <button key={i} onClick={() => setFund({ ...fund, amount: String(Math.round(v)) })} style={{ flex: 1, fontSize: 11.5, fontWeight: 600, padding: '6px', borderRadius: 'var(--r-chip)', cursor: 'pointer', fontFamily: 'var(--font-ui)', border: '1px solid var(--line-2)', background: 'var(--surface)', color: 'var(--text-2)' }}>{i === 3 ? 'Remaining' : '$' + v}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '11px 13px', borderRadius: 'var(--r-ctrl)', background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--text-2)' }}>
            New balance: <b className="num" style={{ color: 'var(--text)' }}>${fmtN(Math.min(fundGoal.target, fundGoal.saved + (parseFloat(fund.amount) || 0)))}</b> of ${fundGoal.target.toLocaleString()} · {Math.min(100, Math.round((fundGoal.saved + (parseFloat(fund.amount) || 0)) / fundGoal.target * 100))}%
          </div>
        </Modal>
      )}
    </div>
  );
}
