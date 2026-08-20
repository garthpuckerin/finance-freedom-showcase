/* Finance Freedom — app shell, routing, command palette, appearance switcher */
import React, { useState, useEffect, useRef } from 'react';

import { AppData, fmtN } from './data.js';
import { Topbar } from './ui.jsx';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';

import { Sidebar, AccountTree } from './Sidebar.jsx';
import { Dashboard } from './Dashboard.jsx';
import { Register } from './Register.jsx';
// Disambiguation: NetWorthScreen / BudgetsScreen / GoalsScreen exist in both
// Depth and MoreScreens/Screens. The source loaded Depth last, so its
// interactive versions win — import those three from Depth only.
import { NetWorthScreen, BudgetsScreen, GoalsScreen } from './Depth.jsx';
import { CashFlowScreen, Placeholder } from './Screens.jsx';
import { InvestmentsScreen, BillsScreen, ReportsScreen } from './MoreScreens.jsx';
import { InsightsScreen, SearchScreen, TaxScreen } from './Insights.jsx';
import { DebtScreen, RulesScreen } from './Plan.jsx';
import { AssistantScreen } from './SettingsAssistant.jsx';
import { SettingsScreen } from './Settings.jsx';
import { AddTxModal, LinkAccountFlow } from './Overlays.jsx';
import { OnboardingWizard } from './Onboarding.jsx';

const L = AppData.labels;
const SCREEN_TITLE = {
  dashboard: ['Dashboard', L.todayLongNoYear],
  accounts: ['Accounts', null],
  cashflow: ['Cash Flow', '60-day forecast'],
  budgets: ['Budgets', L.monthYear],
  investments: ['Investments', 'Brokerage + 401(k)'],
  networth: ['Net Worth', 'trailing 12 months'],
  bills: ['Bills & Deposits', 'next 60 days'],
  reports: ['Reports', L.monthYear],
  goals: ['Goals', '5 active'],
  insights: ['Insights', '5 new this week'],
  search: ['Search', 'across every transaction'],
  tax: ['Tax', `tax year ${L.year}`],
  debt: ['Debt Payoff', '2 accounts'],
  rules: ['Rules', 'auto-categorization'],
  settings: ['Settings', null],
  assistant: ['Assistant', 'grounded in your register'],
};

const NAV_FLAT = [
  ['dashboard', 'Dashboard', '▦'], ['accounts', 'Accounts', '≡'], ['cashflow', 'Cash Flow', '〜'],
  ['budgets', 'Budgets', '◫'], ['bills', 'Bills & Deposits', '◷'], ['investments', 'Investments', '◬'],
  ['networth', 'Net Worth', '◈'], ['reports', 'Reports', '▤'], ['insights', 'Insights', '◉'],
  ['goals', 'Goals', '◎'], ['debt', 'Debt Payoff', '⊖'], ['rules', 'Rules', '⊜'],
  ['tax', 'Tax', '⊞'], ['settings', 'Settings', '⚙'], ['assistant', 'Assistant', '✦'],
];

function CommandPalette({ open, onClose, onNav }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (open) { setQ(''); setTimeout(() => inputRef.current && inputRef.current.focus(), 30); } }, [open]);
  if (!open) return null;
  const results = NAV_FLAT.filter(([id, label]) => label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(0.2 0.02 256 / 0.4)', backdropFilter: 'blur(2px)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, maxWidth: '90vw', background: 'var(--surface)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ color: 'var(--text-faint)', fontSize: 16 }}>⌕</span>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Jump to a screen, account, or action…" style={{ border: 0, outline: 'none', background: 'transparent', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', flex: 1 }} />
          <kbd className="num" style={{ fontSize: 10, background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 4, padding: '2px 6px', color: 'var(--text-faint)' }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
          {results.map(([id, label, glyph]) => (
            <button key={id} onClick={() => { onNav(id); onClose(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', border: 0, borderRadius: 8, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 18, textAlign: 'center', color: 'var(--accent)', fontSize: 14 }}>{glyph}</span>{label}
            </button>
          ))}
          {!results.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>No matches</div>}
        </div>
      </div>
    </div>
  );
}

function App() {
  // Deep links win over the remembered screen: /cashflow, /networth, /budgets …
  // (vercel.json rewrites every path to the SPA, so direct hits land here).
  const [screen, setScreen] = useState(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (path && SCREEN_TITLE[path]) return path;
    return localStorage.getItem('ff_screen') || 'dashboard';
  });
  const [activeAccount, setActiveAccount] = useState(() => localStorage.getItem('ff_acct') || 'chk');
  const [acctDrawerOpen, setAcctDrawerOpen] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [txs, setTxs] = useState(() => AppData.transactions.map(x => ({ ...x })));
  const [addOpen, setAddOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [toast, setToast] = useState(null);
  // First-run onboarding — sign-out clears the flag so the journey replays.
  const [onboarding, setOnboarding] = useState(() => {
    try { return localStorage.getItem('ff_onboarded_v1') !== 'true'; } catch { return false; }
  });
  function finishOnboarding() {
    try { localStorage.setItem('ff_onboarded_v1', 'true'); } catch (e) {}
    setOnboarding(false);
    setScreen('dashboard');
    flash('Welcome to Finance Freedom — the demo is all yours');
  }

  useEffect(() => { localStorage.setItem('ff_screen', screen); }, [screen]);
  useEffect(() => { localStorage.setItem('ff_acct', activeAccount); }, [activeAccount]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(c => !c); }
      if (e.key === 'Escape') setCmd(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  function nav(id) { setScreen(id); }
  function openAccount(id) { setActiveAccount(id); setScreen('accounts'); }
  // Accounts is a drawer toggle: click to open (and show the accounts screen),
  // click again to close. The account tree slides out beside the rail.
  function toggleAccounts() {
    setAcctDrawerOpen(open => {
      const next = !open;
      if (next) setScreen('accounts');
      return next;
    });
  }

  // global hooks so deep buttons can open these flows (app's own runtime wiring)
  useEffect(() => {
    window.__ffAdd = () => setAddOpen(true);
    window.__ffLink = () => setLinkOpen(true);
    window.__ffToast = (m) => flash(m);
  }, []);
  function flash(msg) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  function addTransaction(d) {
    if (d.acct === 'chk') {
      setTxs(prev => {
        const top = prev[0];
        const nt = { id: 'new' + Date.now(), date: d.date, payee: d.payee, cat: d.cat || '', memo: d.memo || '', amount: d.amount, status: 'E', balance: (top ? top.balance : 0) + d.amount };
        return [nt, ...prev];
      });
      setActiveAccount('chk'); setScreen('accounts');
    }
    setAddOpen(false);
    flash(`${d.recurring ? 'Scheduled' : 'Added'} ${d.payee} · ${d.amount > 0 ? '+' : '−'}$${fmtN(d.amount)}`);
  }

  const [title, sub] = SCREEN_TITLE[screen] || [
    (NAV_FLAT.find(n => n[0] === screen) || [null, 'Finance Freedom'])[1], null
  ];

  let body;
  if (screen === 'dashboard') body = <Dashboard onNav={nav} />;
  else if (screen === 'accounts') body = <Register key={activeAccount} activeAccount={activeAccount} txs={activeAccount === 'chk' ? txs : null} setTxs={activeAccount === 'chk' ? setTxs : null} />;
  else if (screen === 'cashflow') body = <CashFlowScreen />;
  else if (screen === 'budgets') body = <BudgetsScreen />;
  else if (screen === 'investments') body = <InvestmentsScreen />;
  else if (screen === 'networth') body = <NetWorthScreen />;
  else if (screen === 'bills') body = <BillsScreen />;
  else if (screen === 'reports') body = <ReportsScreen onNav={nav} />;
  else if (screen === 'goals') body = <GoalsScreen />;
  else if (screen === 'insights') body = <InsightsScreen />;
  else if (screen === 'search') body = <SearchScreen />;
  else if (screen === 'tax') body = <TaxScreen />;
  else if (screen === 'debt') body = <DebtScreen />;
  else if (screen === 'rules') body = <RulesScreen />;
  else if (screen === 'settings') body = <SettingsScreen onNav={nav} />;
  else if (screen === 'assistant') body = <AssistantScreen />;
  else body = <Placeholder screen={screen} />;

  const accountName = screen === 'accounts' ? (AppData.accounts.find(a => a.id === activeAccount) || {}).name : null;

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: 'var(--canvas)' }}>
      <Sidebar screen={screen} acctDrawerOpen={acctDrawerOpen} onNav={nav} onToggleAccounts={toggleAccounts} />
      {/* Accounts drawer — slides out beside the rail (toggled by the Accounts nav item) */}
      <div style={{
        width: acctDrawerOpen ? 248 : 0, transition: 'width .18s ease', height: '100%',
        overflow: 'hidden', flexShrink: 0, background: 'var(--rail)',
        borderRight: acctDrawerOpen ? '1px solid var(--rail-line)' : '0',
      }}>
        <div style={{ width: 248, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 12px 14px 16px', borderBottom: '1px solid var(--rail-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--rail-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)' }}>Accounts</span>
            <button onClick={() => setAcctDrawerOpen(false)} aria-label="Close accounts drawer" title="Close"
              style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--rail-text-3)', fontSize: 17, lineHeight: 1, padding: '2px 4px', borderRadius: 6 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <AccountTree activeAccount={activeAccount} onAccount={openAccount} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Topbar
          title={screen === 'accounts' && accountName ? accountName : title}
          sub={screen === 'accounts' ? null : sub}
          crumbs={screen === 'accounts' ? 'Accounts' : null}
          onAdd={() => setAddOpen(true)}
          onCmd={() => setCmd(true)}
          right={
            <>
              <a
                href="/design-system.html"
                target="_blank"
                rel="noopener"
                title="Design system"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', borderRadius: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--line-2)', color: 'var(--text-3)',
                  fontFamily: 'var(--font-ui)', fontSize: 12.5, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 13 }}>◫</span><span>Design system</span>
              </a>
              <ThemeSwitcher />
            </>
          }
        />
        {body}
      </div>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} onNav={nav} />
      <OnboardingWizard open={onboarding} onDone={finishOnboarding} />
      <AddTxModal open={addOpen} accounts={AppData.accounts} defaultAccount={activeAccount} onClose={() => setAddOpen(false)} onAdd={addTransaction} />
      <LinkAccountFlow open={linkOpen} onClose={() => setLinkOpen(false)} onLinked={(n, bank) => flash(`Linked ${n} ${n === 1 ? 'account' : 'accounts'} from ${bank}`)} />
      {toast && (
        <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: 'var(--text)', color: 'var(--surface)', borderRadius: 'var(--r-ctrl)', padding: '10px 16px', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 9, animation: 'ffPop .2s ease' }}>
          <span style={{ color: 'var(--pos)' }}>✓</span>{toast}
        </div>
      )}
    </div>
  );
}

export default App;
