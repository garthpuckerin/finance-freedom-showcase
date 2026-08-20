/* Finance Freedom — left rail: nav + account tree */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
const { useState: useSbS } = React;

const NAV = [
  { label: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', glyph: '▦' },
    { id: 'accounts', label: 'Accounts', glyph: '≡' },
  ]},
  { label: 'Money', items: [
    { id: 'cashflow', label: 'Cash Flow', glyph: '〜' },
    { id: 'budgets', label: 'Budgets', glyph: '◫' },
    { id: 'bills', label: 'Bills & Deposits', glyph: '◷' },
    { id: 'search', label: 'Search', glyph: '⌕' },
  ]},
  { label: 'Portfolio', items: [
    { id: 'investments', label: 'Investments', glyph: '◬' },
    { id: 'networth', label: 'Net Worth', glyph: '◈' },
  ]},
  { label: 'Analyze', items: [
    { id: 'reports', label: 'Reports', glyph: '▤' },
    { id: 'insights', label: 'Insights', glyph: '◉' },
    { id: 'tax', label: 'Tax', glyph: '⊞' },
  ]},
  { label: 'Plan', items: [
    { id: 'goals', label: 'Goals', glyph: '◎' },
    { id: 'debt', label: 'Debt Payoff', glyph: '⊖' },
    { id: 'rules', label: 'Rules', glyph: '⊜' },
  ]},
];

function NavItem({ item, active, onNav, caret, caretOpen }) {
  const [hov, setHov] = useSbS(false);
  return (
    <button onClick={() => onNav(item.id)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      aria-expanded={caret ? !!caretOpen : undefined}
      style={{
        position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px 7px 12px', border: 0, borderRadius: 8, cursor: 'pointer', textAlign: 'left',
        background: active ? 'var(--rail-2)' : (hov ? 'color-mix(in oklch, var(--rail-2) 55%, transparent)' : 'transparent'),
        color: active ? 'var(--rail-text)' : (hov ? 'var(--rail-text)' : 'var(--rail-text-2)'),
        fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: active ? 600 : 500, marginBottom: 1, transition: 'background .12s, color .12s',
      }}>
      {active && <span style={{ position: 'absolute', left: 0, top: '24%', bottom: '24%', width: 3, borderRadius: '0 3px 3px 0', background: 'var(--accent)' }} />}
      <span style={{ width: 16, textAlign: 'center', fontSize: 14, color: active ? 'var(--accent)' : 'inherit', opacity: active ? 1 : 0.8, flexShrink: 0 }}>{item.glyph}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
      {caret && <span aria-hidden="true" style={{ fontSize: 8, flexShrink: 0, opacity: 0.7, transform: caretOpen ? 'rotate(90deg)' : 'none', transition: 'transform .12s' }}>▸</span>}
    </button>
  );
}

export function AccountTree({ activeAccount, onAccount }) {
  const { accounts } = AppData;
  const groups = ['Cash', 'Credit', 'Investments', 'Assets', 'Debts'];
  const [open, setOpen] = useSbS({ Cash: true, Credit: true, Investments: false, Assets: false, Debts: false });
  return (
    <div style={{ padding: '4px 8px' }}>
      {groups.map(g => {
        const accts = accounts.filter(a => a.group === g);
        if (!accts.length) return null;
        const sum = accts.reduce((s, a) => s + a.balance, 0);
        const isOpen = open[g];
        return (
          <div key={g} style={{ marginBottom: 2 }}>
            <button onClick={() => setOpen(o => ({ ...o, [g]: !o[g] }))} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', border: 0, background: 'transparent',
              cursor: 'pointer', color: 'var(--rail-text-3)', fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <span style={{ fontSize: 8, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .12s', width: 8 }}>▸</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{g}</span>
              <span className="num" style={{ color: sum < 0 ? 'var(--neg)' : 'var(--rail-text-3)', fontSize: 10 }}>{sum < 0 ? '−' : ''}${Math.abs(Math.round(sum / 1000))}k</span>
            </button>
            {isOpen && accts.map(a => {
              const active = activeAccount === a.id;
              return (
                <button key={a.id} onClick={() => onAccount(a.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px 5px 22px', border: 0,
                  borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                  background: active ? 'var(--rail-2)' : 'transparent',
                  color: active ? 'var(--rail-text)' : 'var(--rail-text-2)', fontFamily: 'var(--font-ui)', fontSize: 12, marginBottom: 1,
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'color-mix(in oklch, var(--rail-2) 55%, transparent)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <span className="num" style={{ fontSize: 11, color: a.balance < 0 ? 'var(--neg)' : 'var(--rail-text-2)' }}>{a.balance < 0 ? '−' : ''}${fmtN(a.balance)}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Sign out — clears the demo gate (ff:entered:v1) and returns to the marketing
// landing. Wired via the global hook installed by main.jsx so no prop has to be
// threaded through the screen router.
function SignOutButton() {
  const [hov, setHov] = useSbS(false);
  return (
    <button
      type="button"
      onClick={() => window.__ffSignOut && window.__ffSignOut()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label="Sign out"
      title="Sign out — return to landing"
      style={{
        display: 'flex', alignItems: 'center', gap: 5, border: 0, cursor: 'pointer',
        background: hov ? 'color-mix(in oklch, var(--rail-2) 70%, transparent)' : 'transparent',
        color: hov ? 'var(--rail-text)' : 'var(--rail-text-3)', borderRadius: 6,
        padding: '3px 7px', fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600,
        flexShrink: 0, transition: 'background .12s, color .12s',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 11, lineHeight: 1 }}>⏻</span>
      Sign out
    </button>
  );
}

export function Sidebar({ screen, acctDrawerOpen, onNav, onToggleAccounts }) {
  const { netWorth, user, accounts } = AppData;
  const assets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const debts = accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0);
  return (
    <aside style={{
      width: 234, minWidth: 234, height: '100%', background: 'var(--rail)', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--rail-line)', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* brand */}
      <div style={{ padding: '14px 14px', borderBottom: '1px solid var(--rail-line)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0, fontFamily: 'var(--font-display)' }}>F</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rail-text)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)' }}>Finance Freedom</div>
          <div style={{ fontSize: 10, color: 'var(--rail-text-3)', marginTop: -1 }}>{user.household} · {AppData.labels.monthYear}</div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px 4px' }}>
        {NAV.map((sec, si) => (
          <div key={sec.label} style={{ marginBottom: 6 }}>
            <div style={{ padding: '5px 10px 3px', fontSize: 9.5, fontWeight: 700, color: 'var(--rail-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sec.label}</div>
            {sec.items.map(it => {
              const isAccounts = it.id === 'accounts';
              return (
                <NavItem
                  key={it.id}
                  item={it}
                  active={isAccounts ? acctDrawerOpen : screen === it.id}
                  onNav={isAccounts ? onToggleAccounts : onNav}
                  caret={isAccounts}
                  caretOpen={isAccounts && acctDrawerOpen}
                />
              );
            })}
          </div>
        ))}
        <div style={{ height: 1, background: 'var(--rail-line)', margin: '4px 10px' }} />
        <NavItem item={{ id: 'settings', label: 'Settings', glyph: '⚙' }} active={screen === 'settings'} onNav={onNav} />
        <NavItem item={{ id: 'assistant', label: 'Assistant', glyph: '✦' }} active={screen === 'assistant'} onNav={onNav} />
      </nav>

      {/* net worth */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--rail-line)', background: 'var(--rail-2)', flexShrink: 0 }}>
        <div style={{ fontSize: 9.5, color: 'var(--rail-text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700 }}>Net Worth</div>
        <div className="num" style={{ fontSize: 19, fontWeight: 700, color: 'var(--rail-text)', marginTop: 3, letterSpacing: '-0.02em' }}>{fmt(netWorth, { maximumFractionDigits: 0 })}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 7 }}>
          <div><div style={{ fontSize: 9, color: 'var(--rail-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assets</div><div className="num pos" style={{ fontSize: 11.5, marginTop: 1 }}>${Math.round(assets / 1000)}k</div></div>
          <div><div style={{ fontSize: 9, color: 'var(--rail-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Debts</div><div className="num neg" style={{ fontSize: 11.5, marginTop: 1 }}>${Math.round(Math.abs(debts) / 1000)}k</div></div>
        </div>
      </div>
      <div style={{ padding: '7px 14px', borderTop: '1px solid var(--rail-line)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pos)', flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: 'var(--rail-text-3)', flex: 1 }}>Local file · saved 9:42 AM</span>
        <SignOutButton />
      </div>
    </aside>
  );
}
