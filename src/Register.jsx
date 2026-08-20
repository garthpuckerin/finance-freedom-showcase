/* Finance Freedom — Account Register (the ledger soul of MS Money) */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { iso } from './dates.js';
import { Badge, Segmented } from './ui.jsx';
import { TxDrawer, ReconcileModal } from './Overlays.jsx';
const { useState: useRgS, useMemo: useRgM } = React;

const STATUS_CYCLE = { '': 'E', 'E': 'C', 'C': 'R', 'R': '' };

function Flag({ status, onClick }) {
  const base = { width: 20, height: 20, borderRadius: 'var(--r-table)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-num)', fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: 'all .12s' };
  const styles = {
    'R': { borderColor: 'var(--pos)', color: 'var(--pos)', background: 'var(--pos-weak)' },
    'C': { borderColor: 'var(--pos)', color: 'var(--pos)', background: 'var(--pos-weak)' },
    'E': { borderColor: 'var(--warn)', color: 'var(--warn)', background: 'var(--warn-weak)' },
    '': { borderColor: 'var(--line-strong)', color: 'transparent', background: 'transparent' },
  };
  const label = { 'R': '⚑', 'C': 'C', 'E': 'E', '': '' };
  const title = { 'R': 'Reconciled — click to clear', 'C': 'Cleared — click to reconcile', 'E': 'E-cleared — click to clear', '': 'Uncleared — click to mark E-cleared' };
  return <button title={title[status]} onClick={onClick} style={Object.assign({}, base, styles[status])}>{label[status]}</button>;
}

function QuickEntry({ onAdd }) {
  const [payee, setPayee] = useRgS('');
  const [cat, setCat] = useRgS('');
  const [amt, setAmt] = useRgS('');
  const fld = { font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-table)', border: 0, background: 'transparent', color: 'var(--text)', width: '100%', outline: 'none', padding: 0 };
  function submit() {
    const n = parseFloat(amt);
    if (!payee || isNaN(n)) return;
    onAdd({ payee, cat, amount: n });
    setPayee(''); setCat(''); setAmt('');
  }
  return (
    <tr style={{ background: 'var(--accent-weak)' }}>
      <td style={{ padding: '0 12px' }}><span style={{ color: 'var(--accent)', fontSize: 14 }}>⊕</span></td>
      <td className="num" style={{ color: 'var(--text-3)', padding: '0 12px', fontSize: 'var(--fs-table)' }}>{AppData.labels.todayMd}</td>
      <td style={{ padding: '0 12px' }}><input value={payee} onChange={e => setPayee(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="New transaction — type a payee…" style={fld} /></td>
      <td style={{ padding: '0 12px' }}><input value={cat} onChange={e => setCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Category" style={Object.assign({}, fld, { color: 'var(--text-2)' })} /></td>
      <td colSpan="2" style={{ padding: '0 12px' }}><input value={amt} onChange={e => setAmt(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="0.00  (− expense)" className="num" style={Object.assign({}, fld, { textAlign: 'right' })} /></td>
      <td style={{ padding: '0 12px', textAlign: 'right' }}><button onClick={submit} style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>↵ ADD</button></td>
    </tr>
  );
}

export function Register({ activeAccount, txs: txsProp, setTxs: setTxsProp }) {
  const D = AppData;
  const account = D.accounts.find(a => a.id === activeAccount) || D.accounts[0];
  // Every account carries a manually-tracked register: checking uses the main
  // app-level ledger state; the rest read their seed from accountLedgers.
  // (app.jsx keys this component by account id, so local state re-seeds on switch.)
  const isChk = account.id === 'chk';
  const seedLedger = isChk ? D.transactions : (D.accountLedgers[account.id] || []);
  const hasData = seedLedger.length > 0;
  const [localTxs, setLocalTxs] = useRgS(() => seedLedger.map(t => ({ ...t })));
  const txs = (isChk && txsProp) || localTxs;
  const setTxs = (isChk && setTxsProp) || setLocalTxs;
  const [edit, setEdit] = useRgS(null);
  const [reconcile, setReconcile] = useRgS(false);
  const [query, setQuery] = useRgS('');
  const [showCleared, setShowCleared] = useRgS('all');

  // fixed opening balance so the running-balance column stays internally consistent across edits
  const opening = useRgM(() => account.balance - seedLedger.reduce((s, t) => s + t.amount, 0), [account.id]);
  const display = useRgM(() => {
    let b = opening;
    const asc = txs.slice().reverse().map(t => { b += t.amount; return { ...t, balance: b }; });
    return asc.reverse();
  }, [txs, opening]);
  const currentBalance = display.length ? display[0].balance : account.balance;
  const pendingSum = txs.filter(t => t.status === '' || t.status === 'E').reduce((s, t) => s + t.amount, 0);
  const clearedBal = currentBalance - pendingSum;
  const unclearedCount = txs.filter(t => t.status === '' || t.status === 'E').length;

  function cycle(id) { setTxs(prev => prev.map(t => t.id === id ? { ...t, status: STATUS_CYCLE[t.status] } : t)); }
  function addTx({ payee, cat, amount }) {
    setTxs(prev => [{ id: 'new' + Date.now(), date: iso(AppData.labels.today), payee, cat, memo: '', amount, status: 'E' }, ...prev]);
  }
  function saveTx(updated) { setTxs(prev => prev.map(t => t.id === updated.id ? updated : t)); setEdit(null); }
  function deleteTx(id) { setTxs(prev => prev.filter(t => t.id !== id)); setEdit(null); }
  function reconcileItems(ids) { const set = new Set(ids); setTxs(prev => prev.map(t => set.has(t.id) ? { ...t, status: 'R' } : t)); setReconcile(false); }

  const filtered = useRgM(() => {
    let r = display;
    if (query) r = r.filter(t => (t.payee + ' ' + (t.cat || '')).toLowerCase().includes(query.toLowerCase()));
    if (showCleared === 'uncleared') r = r.filter(t => t.status === '' || t.status === 'E');
    return r;
  }, [display, query, showCleared]);

  const th = { textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600, padding: '9px 12px', background: 'var(--surface-3)', borderBottom: '1px solid var(--line-2)', position: 'sticky', top: 0, zIndex: 1 };
  const thr = Object.assign({}, th, { textAlign: 'right' });
  const td = { padding: '0 12px', height: 'var(--row-h)', borderBottom: '1px solid var(--line)', color: 'var(--text)', verticalAlign: 'middle', fontSize: 'var(--fs-table)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--canvas)' }}>
      {/* account header */}
      <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--accent-weak)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{account.glyph}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)' }}>{account.name}</span>
            <Badge tone="neutral">{account.inst}</Badge>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, textTransform: 'capitalize' }}>{account.kind} account</div>
        </div>
        <div style={{ display: 'flex', gap: 26 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600 }}>Cleared</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)', marginTop: 2 }}>{fmt(clearedBal)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600 }}>Current Balance</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 700, color: currentBalance < 0 ? 'var(--neg)' : 'var(--text)', marginTop: 1, letterSpacing: '-0.02em' }}>{fmt(currentBalance)}</div>
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div style={{ padding: '9px 22px', borderBottom: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '5px 10px', width: 250 }}>
          <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>⌕</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter this register…" style={{ border: 0, background: 'transparent', outline: 'none', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--text)', width: '100%' }} />
        </div>
        <Segmented size="sm" value={showCleared} onChange={setShowCleared} options={[{ value: 'all', label: 'All' }, { value: 'uncleared', label: 'Uncleared' }]} />
        <div style={{ flex: 1 }} />
        {unclearedCount > 0 && <Badge tone="warn">{unclearedCount} uncleared</Badge>}
        <button onClick={() => hasData && setReconcile(true)} style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>⚑ Reconcile</button>
        <button onClick={() => window.__ffAdd && window.__ffAdd()} style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>⊕ New</button>
      </div>

      {/* ledger */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 22px' }}>
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          {hasData ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={Object.assign({}, th, { width: 38 })}>⚑</th>
                  <th style={Object.assign({}, th, { width: 86 })}>Date</th>
                  <th style={th}>Payee</th>
                  <th style={Object.assign({}, th, { width: 190 })}>Category</th>
                  <th style={Object.assign({}, thr, { width: 112 })}>Payment</th>
                  <th style={Object.assign({}, thr, { width: 112 })}>Deposit</th>
                  <th style={Object.assign({}, thr, { width: 130 })}>Balance</th>
                </tr>
              </thead>
              <tbody>
                <QuickEntry onAdd={addTx} />
                {filtered.map((t, i) => {
                  const inc = t.amount > 0;
                  const isSel = edit && edit.id === t.id;
                  const uncat = !t.cat;
                  return (
                    <tr key={t.id} onClick={() => setEdit(t)} className="ff-reg-row"
                      style={{
                        background: isSel ? 'var(--accent-weak)' : (i % 2 ? 'var(--surface-2)' : 'transparent'),
                        cursor: 'pointer', boxShadow: isSel ? 'inset 2px 0 0 var(--accent)' : 'none',
                        transition: 'background .1s ease, box-shadow .1s ease',
                      }}
                      onMouseEnter={e => { if (!isSel) { e.currentTarget.style.background = 'var(--accent-weak)'; e.currentTarget.style.boxShadow = 'inset 2px 0 0 var(--accent-line)'; } }}
                      onMouseLeave={e => { if (!isSel) { e.currentTarget.style.background = i % 2 ? 'var(--surface-2)' : 'transparent'; e.currentTarget.style.boxShadow = 'none'; } }}>
                      <td style={td} onClick={e => e.stopPropagation()}><Flag status={t.status} onClick={() => cycle(t.id)} /></td>
                      <td className="num" style={Object.assign({}, td, { color: 'var(--text-3)' })}>{t.date.slice(5).replace('-', '/')}</td>
                      <td style={Object.assign({}, td, { fontWeight: 500 })}>{t.flagged && <span title="Flagged for review" style={{ color: 'var(--warn)', marginRight: 5 }}>⚑</span>}{t.payee}{t.memo && <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}> · {t.memo}</span>}</td>
                      <td style={Object.assign({}, td, { color: uncat ? 'var(--warn)' : 'var(--text-2)' })}>{uncat ? 'Uncategorized' : t.cat}</td>
                      <td className="num" style={Object.assign({}, td, { textAlign: 'right', color: 'var(--neg)' })}>{!inc ? fmtN(t.amount) : ''}</td>
                      <td className="num" style={Object.assign({}, td, { textAlign: 'right', color: 'var(--pos)' })}>{inc ? fmtN(t.amount) : ''}</td>
                      <td className="num" style={Object.assign({}, td, { textAlign: 'right', fontWeight: 600, color: t.balance < 0 ? 'var(--neg)' : 'var(--text)' })}>{t.balance < 0 ? '−' : ''}{fmtN(t.balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, color: 'var(--text-faint)', marginBottom: 10 }}>{account.glyph}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No transactions in this view</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, maxWidth: 340, margin: '4px auto 0' }}>Add transactions by hand, import a statement (QIF/OFX/CSV) — or link {account.inst}, if you want to. Manual tracking is a first-class citizen here.</div>
              <button onClick={() => window.__ffAdd && window.__ffAdd()} style={{ marginTop: 16, background: 'var(--accent)', color: 'var(--on-accent)', border: 0, borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Add a transaction</button>
            </div>
          )}
        </div>
      </div>

      {/* footer summary */}
      {hasData && (
        <div style={{ padding: '8px 22px', borderTop: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 22, fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>
          <span>{filtered.length} transactions</span>
          <span>·</span>
          <span>Cleared <span className="num" style={{ color: 'var(--text-2)', fontWeight: 600 }}>{fmt(clearedBal)}</span></span>
          <span>·</span>
          <span>Running balance <span className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(currentBalance)}</span></span>
          <div style={{ flex: 1 }} />
          <span style={{ color: 'var(--text-faint)' }}>Tip: click any row to edit · click the ⚑ flag to cycle cleared status</span>
        </div>
      )}

      <TxDrawer tx={edit} onClose={() => setEdit(null)} onSave={saveTx} onDelete={deleteTx} />
      <ReconcileModal open={reconcile} account={account} txs={txs} onClose={() => setReconcile(false)} onReconcile={reconcileItems} />
    </div>
  );
}
