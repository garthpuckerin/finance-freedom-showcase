/* Finance Freedom — Mobile companion (Ledger tokens inside an iOS bezel) */
import React, { useState } from 'react';

import { AppData, fmt, fmtN } from './data.js';
import { IOSDevice } from './ios-frame.jsx';
import { LineTrend, Donut } from './charts.jsx';

const SB_TOP = 56; // clearance for status bar + dynamic island

function MbHeader({ sub, title, right, onBack }) {
  return (
    <div style={{ padding: `${SB_TOP}px 18px 12px`, background: 'var(--surface)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, minWidth: 0 }}>
          {onBack && (
            <button onClick={onBack} aria-label="Back" style={{ border: 0, background: 'var(--surface-2)', color: 'var(--accent)', width: 32, height: 32, borderRadius: 9, fontSize: 17, cursor: 'pointer', flexShrink: 0, marginBottom: 2, fontFamily: 'var(--font-ui)' }}>‹</button>
          )}
          <div style={{ minWidth: 0 }}>
            {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>{sub}</div>}
            <div style={{ fontSize: 24, fontWeight: 'var(--display-weight)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

function MbTabBar({ tab, setTab }) {
  const tabs = [['home', 'Home', '▦'], ['spend', 'Spending', '◫'], ['tx', 'Activity', '≡'], ['more', 'More', '⋯']];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 78, paddingBottom: 20, background: 'color-mix(in oklch, var(--surface) 86%, transparent)', backdropFilter: 'blur(14px) saturate(160%)', WebkitBackdropFilter: 'blur(14px) saturate(160%)', borderTop: '1px solid var(--line)', display: 'flex', zIndex: 30 }}>
      {tabs.map(([id, label, glyph]) => {
        const on = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', color: on ? 'var(--accent)' : 'var(--text-faint)', paddingTop: 8 }}>
            <span style={{ fontSize: 19 }}>{glyph}</span>
            <span style={{ fontSize: 10, fontWeight: on ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

const mbCard = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)' };

function MbHome() {
  const D = AppData;
  const checking = D.accounts.find(a => a.id === 'chk');
  const month = D.transactions;
  const recent = month.slice(0, 5);
  const topCats = D.spendingByCategory.slice(0, 4);
  const monthSpend = D.spendingByCategory.reduce((s, c) => s + c.amount, 0);
  return (
    <div style={{ padding: '14px 16px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* hero balance */}
      <div style={Object.assign({}, mbCard, { padding: 18, background: 'var(--accent)', border: 'none', color: 'var(--on-accent)' })}>
        <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>{checking.name} · {checking.inst}</div>
        <div className="num" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 12px' }}>${fmtN(checking.balance)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Send', 'Request', 'Pay bill'].map(a => <div key={a} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, padding: '7px 0', borderRadius: 'var(--r-ctrl)', background: 'rgba(255,255,255,0.16)' }}>{a}</div>)}
        </div>
      </div>

      {/* net worth + cash strip */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[['Net Worth', fmt(D.netWorth, { maximumFractionDigits: 0 }), `▲ ${fmt(D.netWorthDelta12mo, { maximumFractionDigits: 0 })} / yr`, 'var(--pos)'], ['Savings', fmt(D.accounts.find(a => a.id === 'sav').balance, { maximumFractionDigits: 0 }), 'Emergency Fund', 'var(--text-3)']].map(([k, v, d, c]) => (
          <div key={k} style={Object.assign({}, mbCard, { padding: 14, flex: 1 })}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', fontWeight: 600 }}>{k}</div>
            <div className="num" style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: '5px 0 3px' }}>{v}</div>
            <div style={{ fontSize: 11, color: c }}>{d}</div>
          </div>
        ))}
      </div>

      {/* this month */}
      <div style={Object.assign({}, mbCard, { padding: 16 })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Spent · {D.period.shortLabel}</span>
          <span className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>${fmtN(monthSpend)}</span>
        </div>
        <div style={{ display: 'flex', height: 9, borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
          {topCats.concat([{ category: 'Other', amount: monthSpend - topCats.reduce((s, c) => s + c.amount, 0), color: 'var(--text-faint)' }]).map((c, i) => (
            <div key={i} style={{ width: `${c.amount / monthSpend * 100}%`, background: c.color }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {topCats.map(c => (
            <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)' }}>{c.category}</span>
              <span className="num" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>${fmtN(c.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* recent */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px 8px' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Recent activity</span>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>See all</span>
        </div>
        <div style={Object.assign({}, mbCard, { overflow: 'hidden' })}>
          {recent.map((t, i) => <MbTxRow key={t.id} t={t} last={i === recent.length - 1} />)}
        </div>
      </div>

      {/* desktop-first / POC framing — visible on first scroll, not shouty */}
      <MbPocNote compact />
    </div>
  );
}

function MbTxRow({ t, last }) {
  const inc = t.amount > 0;
  const cat = (t.cat || 'Uncategorized').split(' : ')[0];
  const colorMap = AppData.catColor;
  const dot = colorMap[cat] || 'var(--text-faint)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: last ? 0 : '1px solid var(--line)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0, color: dot, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{t.payee[0]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.payee}</div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{cat} · {t.date.slice(5).replace('-', '/')}</div>
      </div>
      <div className="num" style={{ fontSize: 13.5, fontWeight: 600, color: inc ? 'var(--pos)' : 'var(--text)', flexShrink: 0 }}>{inc ? '+' : '−'}${fmtN(t.amount)}</div>
    </div>
  );
}

function MbSpend() {
  const D = AppData;
  const monthSpend = D.spendingByCategory.reduce((s, c) => s + c.amount, 0);
  // donut
  const R = 64, C = 2 * Math.PI * R; let acc = 0;
  return (
    <div style={{ padding: '14px 16px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={Object.assign({}, mbCard, { padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' })}>
        <svg width="170" height="170" viewBox="0 0 170 170">
          <g transform="rotate(-90 85 85)">
            {D.spendingByCategory.map((c, i) => {
              const frac = c.amount / monthSpend; const len = frac * C;
              const el = <circle key={i} cx="85" cy="85" r={R} fill="none" stroke={c.color} strokeWidth="20" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />;
              acc += len; return el;
            })}
          </g>
          <text x="85" y="80" textAnchor="middle" fontSize="11" fill="var(--text-3)" fontFamily="var(--font-ui)">Total spent</text>
          <text x="85" y="100" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text)" fontFamily="var(--font-num)">${(monthSpend / 1000).toFixed(1)}k</text>
        </svg>
      </div>
      <div style={Object.assign({}, mbCard, { overflow: 'hidden' })}>
        {D.spendingByCategory.map((c, i) => (
          <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: i === D.spendingByCategory.length - 1 ? 0 : '1px solid var(--line)' }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: c.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{c.category}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{c.pct}%</span>
            <span className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 64, textAlign: 'right' }}>${fmtN(c.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MbActivity() {
  const D = AppData;
  const [q, setQ] = useState('');
  const list = D.transactions.filter(t => !q || t.payee.toLowerCase().includes(q.toLowerCase()));
  // group by date
  const groups = {};
  list.forEach(t => { (groups[t.date] = groups[t.date] || []).push(t); });
  const dates = Object.keys(groups).sort().reverse();
  const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div style={{ padding: '8px 16px 96px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-pill)', marginBottom: 14 }}>
        <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>⌕</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search transactions" style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--text)' }} />
      </div>
      {dates.map(d => (
        <div key={d} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', padding: '0 2px 7px' }}>{fmtDate(d)}</div>
          <div style={Object.assign({}, mbCard, { overflow: 'hidden' })}>
            {groups[d].map((t, i) => <MbTxRow key={t.id} t={t} last={i === groups[d].length - 1} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* POC framing — Finance Freedom is desktop-first; the phone view is a
 * proof-of-concept companion, and the demo says so out loud. */
function MbPocNote({ compact = false }) {
  return (
    <div style={Object.assign({}, mbCard, { padding: compact ? '11px 14px' : 16, background: 'var(--accent-weak)', border: '1px solid var(--line-2)' })}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 4 }}>Desktop-first app</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
        This mobile companion is a proof of concept, not the final mobile build. The full 15-screen cockpit — registers, forecast, reports, budgets, rules — lives on desktop.
      </div>
      <a href="?view=desktop" style={{ display: 'inline-block', marginTop: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>Open the desktop cockpit →</a>
    </div>
  );
}

function MbPocScreen({ area }) {
  return (
    <div style={{ padding: '14px 16px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={Object.assign({}, mbCard, { padding: 18, textAlign: 'center' })}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>🖥</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>{area} lives on the desktop cockpit</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.55 }}>Finance Freedom is desktop-first; this mobile companion is a proof of concept. {area} hasn't been re-flowed for phones yet.</div>
      </div>
      <MbPocNote compact />
    </div>
  );
}

function MbMore({ onOpen }) {
  const D = AppData;
  // All detail figures DERIVED so the mobile "More" list matches the desktop.
  const investTotal = D.holdings.reduce((s, h) => s + h.shares * h.price, 0);
  const debtTotal = D.debts.reduce((s, d) => s + d.balance, 0);
  // [glyph, label, detail, screen] — screen null = desktop-only (POC note)
  const items = [
    ['◬', 'Investments', fmt(investTotal, { maximumFractionDigits: 0 }), 'invest'], ['◈', 'Net Worth', fmt(D.netWorth, { maximumFractionDigits: 0 }), 'networth'], ['◷', 'Bills & Deposits', `${D.upcomingBills.length} upcoming`, 'bills'],
    ['◎', 'Goals', null, null], ['⊖', 'Debt Payoff', fmt(debtTotal, { maximumFractionDigits: 0 }), 'debt'], ['◉', 'Insights', `${D.insights.length} new`, 'insights'],
    ['⊞', 'Tax', AppData.labels.year, null], ['⚙', 'Settings', null, null], ['✦', 'Assistant', null, null],
  ];
  return (
    <div style={{ padding: '14px 16px 96px' }}>
      <div style={{ marginBottom: 14 }}><MbPocNote compact /></div>
      <div style={Object.assign({}, mbCard, { overflow: 'hidden' })}>
        {items.map(([g, label, detail, screen], i) => (
          <button key={label} onClick={() => onOpen(screen || 'poc:' + label)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', borderBottom: i === items.length - 1 ? 0 : '1px solid var(--line)' }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-weak)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0 }}>{g}</span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{label}</span>
            {detail && <span className="num" style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{detail}</span>}
            {!screen && <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-faint)', border: '1px solid var(--line-2)', borderRadius: 4, padding: '2px 5px' }}>DESKTOP</span>}
            <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>›</span>
          </button>
        ))}
      </div>
      {/* Sign out — clears the demo gate and returns to the marketing landing. */}
      <button
        type="button"
        onClick={() => window.__ffSignOut && window.__ffSignOut()}
        aria-label="Sign out"
        style={Object.assign({}, mbCard, {
          marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 15px', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-ui)', color: 'var(--neg)',
        })}
      >
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--neg-weak)', color: 'var(--neg)', display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0 }}>⏻</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Sign out</span>
        <span style={{ color: 'var(--neg)', fontSize: 13 }}>›</span>
      </button>
    </div>
  );
}

/* ---- More-tab detail screens (POC subset) ------------------------------- *
 * Each is the desktop screen's essence re-flowed for a phone, derived from
 * the SAME data layer — proof the system scales down, not a separate build. */

function MbNetWorth() {
  const D = AppData;
  const assets = D.accounts.filter(a => a.balance > 0);
  const debts = D.accounts.filter(a => a.balance < 0);
  const nwTrend = D.netWorthHistory.map(h => ({ label: h.m, sub: String(h.year), value: h.net * 1000 }));
  return (
    <div style={{ padding: '14px 16px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {[['Net Worth', fmt(D.netWorth, { maximumFractionDigits: 0 }), `▲ ${fmt(D.netWorthDelta12mo, { maximumFractionDigits: 0 })} / yr`, 'var(--pos)'],
          ['Assets − Debts', fmt(assets.reduce((s, a) => s + a.balance, 0), { maximumFractionDigits: 0 }), `−${fmt(Math.abs(debts.reduce((s, a) => s + a.balance, 0)), { maximumFractionDigits: 0 })} owed`, 'var(--neg)']].map(([k, v, d, c]) => (
          <div key={k} style={Object.assign({}, mbCard, { padding: 14, flex: 1 })}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', fontWeight: 600 }}>{k}</div>
            <div className="num" style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: '5px 0 3px' }}>{v}</div>
            <div style={{ fontSize: 11, color: c }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={Object.assign({}, mbCard, { padding: 14 })}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Trailing 12 months</div>
        <LineTrend data={nwTrend} height={210} />
      </div>
      <div style={Object.assign({}, mbCard, { overflow: 'hidden' })}>
        {[...assets, ...debts].map((a, i, arr) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i === arr.length - 1 ? 0 : '1px solid var(--line)' }}>
            <span style={{ color: 'var(--accent)', fontSize: 14, width: 18, textAlign: 'center' }}>{a.glyph}</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
            <span className="num" style={{ fontSize: 12.5, fontWeight: 600, color: a.balance < 0 ? 'var(--neg)' : 'var(--text)' }}>{a.balance < 0 ? '−' : ''}${fmtN(a.balance)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MbBills() {
  const D = AppData;
  return (
    <div style={{ padding: '14px 16px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={Object.assign({}, mbCard, { overflow: 'hidden' })}>
        {D.upcomingBills.map((b, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i === arr.length - 1 ? 0 : '1px solid var(--line)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.payee}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{b.cat} · in {b.daysUntil} {b.daysUntil === 1 ? 'day' : 'days'}</div>
            </div>
            {b.autopay && <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent)', background: 'var(--accent-weak)', borderRadius: 4, padding: '2px 6px' }}>AUTO</span>}
            <span className="num" style={{ fontSize: 13, fontWeight: 600, color: b.daysUntil <= 3 ? 'var(--neg)' : 'var(--text)' }}>${fmtN(b.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MbInvest() {
  const D = AppData;
  const total = D.holdings.reduce((s, h) => s + h.shares * h.price, 0);
  return (
    <div style={{ padding: '14px 16px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={Object.assign({}, mbCard, { padding: 16, display: 'flex', alignItems: 'center', gap: 16 })}>
        <Donut segments={D.holdings.map(h => ({ value: h.shares * h.price, color: h.color, label: h.sym }))} size={118} />
        <div>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', fontWeight: 600 }}>Portfolio Value</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{fmt(total, { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Brokerage + 401(k)</div>
        </div>
      </div>
      <div style={Object.assign({}, mbCard, { overflow: 'hidden' })}>
        {D.holdings.map((h, i, arr) => (
          <div key={h.sym + i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i === arr.length - 1 ? 0 : '1px solid var(--line)' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: h.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{h.sym}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name} · {h.acct}</div>
            </div>
            <span className="num" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>${fmtN(h.shares * h.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MbDebt() {
  const D = AppData;
  const total = D.debts.reduce((s, d) => s + d.balance, 0);
  return (
    <div style={{ padding: '14px 16px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={Object.assign({}, mbCard, { padding: 16 })}>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', fontWeight: 600 }}>Total Debt</div>
        <div className="num" style={{ fontSize: 24, fontWeight: 700, color: 'var(--neg)', margin: '5px 0 3px' }}>−{fmt(total, { maximumFractionDigits: 0 })}</div>
        <div style={{ fontSize: 11, color: 'var(--pos)' }}>Paying down ≈ ${fmtN(D.debts.reduce((s, d) => s + d.min, 0))}/mo</div>
      </div>
      {D.debts.map(d => (
        <div key={d.id} style={Object.assign({}, mbCard, { padding: 14 })}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{d.name}</span>
            <span className="num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--neg)' }}>−${fmtN(d.balance)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>{d.inst} · {d.kind} · {d.apr}% APR · min ${fmtN(d.min)}/mo</div>
        </div>
      ))}
    </div>
  );
}

function MbInsights() {
  const D = AppData;
  const toneColor = { pos: 'var(--pos)', warn: 'var(--warn)', neg: 'var(--neg)' };
  return (
    <div style={{ padding: '14px 16px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {D.insights.map(ins => (
        <div key={ins.id} style={Object.assign({}, mbCard, { padding: 14 })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <span style={{ color: toneColor[ins.tone] || 'var(--accent)', fontSize: 15 }}>{ins.glyph}</span>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{ins.title}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-3)', border: '1px solid var(--line-2)', borderRadius: 4, padding: '2px 6px' }}>{ins.tag}</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>{ins.body}</div>
        </div>
      ))}
    </div>
  );
}

// Derive avatar initials from the persona so the demo stays aligned when the
// user object changes (Demo User → DU).
const userInitials = AppData.user.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

// The phone screen itself — shared by the framed showcase (desktop ?view=mobile)
// and the frameless standalone route (real phones).
function MobileScreen({ tab, setTab }) {
  // More-tab detail navigation: 'invest' | 'networth' | 'bills' | 'debt' |
  // 'insights' open real POC screens; 'poc:<Area>' shows the desktop-first
  // note. Switching bottom tabs always clears the detail.
  const [detail, setDetail] = useState(null);
  const openDetail = (id) => setDetail(id);
  const closeDetail = () => setDetail(null);
  const switchTab = (t) => { setDetail(null); setTab(t); };

  const greetHour = new Date().getHours();
  const mbGreet = greetHour < 12 ? 'Good morning' : greetHour < 18 ? 'Good afternoon' : 'Good evening';
  const titles = { home: [AppData.labels.todayLongNoYear, `${mbGreet}, ${AppData.user.name}`], spend: [AppData.period.shortLabel, 'Spending'], tx: ['Everyday Checking', 'Activity'], more: [null, 'More'] };
  const detailTitles = { invest: ['Brokerage + 401(k)', 'Investments'], networth: ['trailing 12 months', 'Net Worth'], bills: ['next 60 days', 'Bills & Deposits'], debt: ['2 accounts', 'Debt Payoff'], insights: ['this week', 'Insights'] };
  const isPoc = detail && detail.startsWith('poc:');
  const [sub, title] = detail
    ? (isPoc ? ['desktop-first', detail.slice(4)] : detailTitles[detail])
    : titles[tab];

  let body;
  if (!detail) {
    body = <>
      {tab === 'home' && <MbHome />}
      {tab === 'spend' && <MbSpend />}
      {tab === 'tx' && <MbActivity />}
      {tab === 'more' && <MbMore onOpen={openDetail} />}
    </>;
  } else if (isPoc) body = <MbPocScreen area={detail.slice(4)} />;
  else if (detail === 'invest') body = <MbInvest />;
  else if (detail === 'networth') body = <MbNetWorth />;
  else if (detail === 'bills') body = <MbBills />;
  else if (detail === 'debt') body = <MbDebt />;
  else if (detail === 'insights') body = <MbInsights />;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <MbHeader sub={sub} title={title} onBack={detail ? closeDetail : null} right={!detail && tab === 'home' ? <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{userInitials}</div> : null} />
        {body}
      </div>
      <MbTabBar tab={tab} setTab={switchTab} />
    </div>
  );
}

export function MobilePhone({ initial = 'home' }) {
  const [tab, setTab] = useState(initial);
  return (
    <IOSDevice>
      <MobileScreen tab={tab} setTab={setTab} />
    </IOSDevice>
  );
}

// Standalone mobile app — full-bleed on a real phone (no iOS bezel; the visitor
// is already holding the device the frame imitates).
export function MobileStandalone({ initial = 'home' }) {
  const [tab, setTab] = useState(initial);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--canvas)', overflow: 'hidden' }}>
      <MobileScreen tab={tab} setTab={setTab} />
    </div>
  );
}

export function MobileApp() {
  return (
    <div style={{ minHeight: '100%', background: 'var(--canvas)', padding: '40px 24px 60px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto 34px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 8 }}>Ledger · Mobile companion</div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 'var(--display-weight)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)' }}>The same system, at phone scale</h1>
        <p style={{ margin: '10px auto 0', maxWidth: 560, fontSize: 14, lineHeight: 1.55, color: 'var(--text-2)' }}>Identical tokens — color, type, spacing, radii — re-flowed for a 402&nbsp;pt screen. Tap the bottom tabs on either device. Both respond to the same theme and accent as the desktop app.</p>
      </div>
      <div style={{ display: 'flex', gap: 48, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <MobilePhone initial="home" />
          <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500 }}>Home · balance, net worth, spending, activity</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <MobilePhone initial="tx" />
          <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500 }}>Activity · the register, grouped by day</div>
        </div>
      </div>
    </div>
  );
}
