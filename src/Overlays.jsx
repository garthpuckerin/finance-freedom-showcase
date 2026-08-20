/* Finance Freedom — Overlays: Drawer, Modal, Transaction editor, Reconcile, Add, Account link */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { iso } from './dates.js';
import { Segmented } from './ui.jsx';
const { useState: useOvS, useEffect: useOvE, useMemo: useOvM, useRef: useOvR } = React;

/* inject overlay animations once */
(function () {
  if (document.getElementById('ff-overlay-style')) return;
  const s = document.createElement('style');
  s.id = 'ff-overlay-style';
  s.textContent = `
    @keyframes ffSlideIn { from { transform: translateX(18px); } to { transform: none; } }
    @keyframes ffPop { from { transform: translateY(8px); } to { transform: none; } }
    @keyframes ffFade { from { opacity: 0.4; } to { opacity: 1; } }
    @keyframes ffSpin { to { transform: rotate(360deg); } }
    @keyframes ffCheck { from { transform: scale(.6); } to { transform: scale(1); } }
  `;
  document.head.appendChild(s);
})();

const ovScrim = { position: 'fixed', inset: 0, zIndex: 130, background: 'oklch(0.18 0.02 256 / 0.42)', backdropFilter: 'blur(2px)' };
const ovInput = { width: '100%', boxSizing: 'border-box', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '9px 11px', outline: 'none' };
const ovLabel = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', display: 'block', marginBottom: 6 };
const ovPrimary = { fontSize: 13, fontWeight: 600, color: 'var(--on-accent)', background: 'var(--accent)', border: 0, borderRadius: 'var(--r-ctrl)', padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' };
const ovGhost = { fontSize: 13, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' };

const CATS = ['Income : Salary', 'Income : Interest', 'Housing : Rent', 'Food : Groceries', 'Food : Dining', 'Food : Coffee', 'Transport : Fuel', 'Transport : Rideshare', 'Shopping : Household', 'Utilities : Electric', 'Utilities : Internet', 'Health : Fitness', 'Health : Pharmacy', 'Entertainment : Streaming', 'Transfer', 'Savings'];

function CloseX({ onClose }) {
  return <button onClick={onClose} title="Close" style={{ width: 30, height: 30, borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line-2)', background: 'var(--surface)', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, display: 'grid', placeItems: 'center', flexShrink: 0 }}>✕</button>;
}

export function Drawer({ open, onClose, title, sub, children, footer, width = 460 }) {
  useOvE(() => { const h = e => e.key === 'Escape' && onClose(); if (open) window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [open]);
  if (!open) return null;
  return (
    <div style={ovScrim} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, height: '100%', width, maxWidth: '94vw', background: 'var(--surface)', borderLeft: '1px solid var(--line)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', animation: 'ffSlideIn .22s cubic-bezier(.2,.7,.3,1)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)' }}>{title}</div>
            {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
          </div>
          <CloseX onClose={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>{children}</div>
        {footer && <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, sub, children, footer, width = 480 }) {
  useOvE(() => { const h = e => e.key === 'Escape' && onClose(); if (open) window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [open]);
  if (!open) return null;
  return (
    <div style={Object.assign({}, ovScrim, { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 })} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width, maxWidth: '94vw', maxHeight: '88vh', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'ffPop .2s cubic-bezier(.2,.7,.3,1)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)' }}>{title}</div>
            {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
          </div>
          <CloseX onClose={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>{children}</div>
        {footer && <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ============ TRANSACTION DETAIL / EDIT ============ */
function StatusPicker({ status, onChange }) {
  const opts = [['', 'Uncleared'], ['E', 'E-cleared'], ['C', 'Cleared'], ['R', 'Reconciled']];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {opts.map(([v, l]) => {
        const on = status === v;
        const col = v === '' ? 'var(--text-faint)' : v === 'E' ? 'var(--warn)' : 'var(--pos)';
        return <button key={v} onClick={() => onChange(v)} style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: '7px 4px', borderRadius: 'var(--r-chip)', cursor: 'pointer', fontFamily: 'var(--font-ui)', border: '1px solid ' + (on ? col : 'var(--line-2)'), background: on ? 'color-mix(in oklch, ' + col + ' 14%, var(--surface))' : 'var(--surface)', color: on ? col : 'var(--text-3)' }}>{l}</button>;
      })}
    </div>
  );
}

export function TxDrawer({ tx, onClose, onSave, onDelete }) {
  const open = !!tx;
  const [f, setF] = useOvS(null);
  const [split, setSplit] = useOvS(false);
  const [parts, setParts] = useOvS([]);
  useOvE(() => {
    if (tx) {
      setF({ payee: tx.payee, date: tx.date, amount: tx.amount, cat: tx.cat || '', memo: tx.memo || '', status: tx.status, flagged: !!tx.flagged });
      setSplit(false);
      setParts([{ cat: tx.cat || '', amount: Math.abs(tx.amount) }]);
    }
  }, [tx]);
  const rule = useOvM(() => {
    if (!tx) return null;
    return (AppData.rules || []).find(r => r.enabled && r.cat === tx.cat && tx.payee.toLowerCase().split(' ')[0] && r.target.toLowerCase().includes(tx.payee.toLowerCase().split(' ')[0]));
  }, [tx]);
  if (!open || !f) return null;
  const inc = f.amount > 0;
  const total = Math.abs(f.amount);
  const partsSum = parts.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const remaining = total - partsSum;

  function save() {
    const cat = split ? (parts.map(p => p.cat).filter(Boolean).join(' + ') || f.cat) : f.cat;
    onSave({ ...tx, payee: f.payee, date: f.date, amount: parseFloat(f.amount) || tx.amount, cat, memo: f.memo, status: f.status, flagged: f.flagged, split: split ? parts : null });
  }

  return (
    <Drawer open={open} onClose={onClose} title={f.payee || 'Transaction'} sub={`${new Date(f.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
      footer={<>
        <button style={Object.assign({}, ovGhost, { color: 'var(--neg)', borderColor: 'var(--neg-weak)' })} onClick={() => onDelete(tx.id)}>Delete</button>
        <div style={{ flex: 1 }} />
        <button style={ovGhost} onClick={onClose}>Cancel</button>
        <button style={ovPrimary} onClick={save}>Save changes</button>
      </>}>
      <div style={{ textAlign: 'center', padding: '6px 0 18px', borderBottom: '1px solid var(--line)', marginBottom: 18 }}>
        <div className="num" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', color: inc ? 'var(--pos)' : 'var(--text)' }}>{inc ? '+' : '−'}${fmtN(f.amount)}</div>
        {rule && <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--text-2)', background: 'var(--accent-weak)', border: '1px solid var(--accent-line)', borderRadius: 'var(--r-pill)', padding: '4px 11px' }}><span style={{ color: 'var(--accent)' }}>⊜</span>Auto-categorized by rule <b className="num" style={{ color: 'var(--text)' }}>{rule.match}</b></div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div><label style={ovLabel}>Payee</label><input value={f.payee} onChange={e => setF({ ...f, payee: e.target.value })} style={ovInput} /></div>
        <div><label style={ovLabel}>Date</label><input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} style={ovInput} /></div>
      </div>
      <div style={{ marginBottom: 14 }}><label style={ovLabel}>Amount</label><input value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} className="num" style={ovInput} /></div>

      {!split ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={Object.assign({}, ovLabel, { margin: 0 })}>Category</label>
            <button onClick={() => { setSplit(true); setParts([{ cat: f.cat, amount: (total / 2).toFixed(2) }, { cat: '', amount: (total / 2).toFixed(2) }]); }} style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>+ Split</button>
          </div>
          <select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })} style={ovInput}>
            <option value="">Uncategorized</option>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      ) : (
        <div style={{ marginBottom: 14, padding: 12, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={Object.assign({}, ovLabel, { margin: 0 })}>Split across categories</label>
            <button onClick={() => { setSplit(false); }} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Remove split</button>
          </div>
          {parts.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select value={p.cat} onChange={e => setParts(ps => ps.map((x, j) => j === i ? { ...x, cat: e.target.value } : x))} style={Object.assign({}, ovInput, { flex: 1 })}>
                <option value="">Category…</option>{CATS.map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={p.amount} onChange={e => setParts(ps => ps.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} className="num" style={Object.assign({}, ovInput, { width: 92, textAlign: 'right' })} />
              {parts.length > 1 && <button onClick={() => setParts(ps => ps.filter((_, j) => j !== i))} style={{ border: 0, background: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 14 }}>✕</button>}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <button onClick={() => setParts(ps => [...ps, { cat: '', amount: Math.max(0, remaining).toFixed(2) }])} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>+ Add split</button>
            <span className="num" style={{ fontSize: 11.5, fontWeight: 600, color: Math.abs(remaining) < 0.005 ? 'var(--pos)' : 'var(--neg)' }}>{Math.abs(remaining) < 0.005 ? '✓ Balanced' : `${remaining > 0 ? '' : '−'}$${fmtN(remaining)} left`}</span>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}><label style={ovLabel}>Memo</label><textarea value={f.memo} onChange={e => setF({ ...f, memo: e.target.value })} rows={2} placeholder="Add a note…" style={Object.assign({}, ovInput, { resize: 'vertical', lineHeight: 1.5 })} /></div>

      <div style={{ marginBottom: 14 }}>
        <label style={ovLabel}>Receipt / attachment</label>
        <div style={{ border: '1.5px dashed var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '18px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, cursor: 'pointer', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>⎙</div>Drag a receipt here, or click to attach
        </div>
      </div>

      <div style={{ marginBottom: 14 }}><label style={ovLabel}>Status</label><StatusPicker status={f.status} onChange={v => setF({ ...f, status: v })} /></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--line)' }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Flag for review</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 1 }}>Surface this in your review queue</div></div>
        <button onClick={() => setF({ ...f, flagged: !f.flagged })} style={{ width: 38, height: 22, borderRadius: 99, border: 0, cursor: 'pointer', padding: 2, background: f.flagged ? 'var(--warn)' : 'var(--line-strong)', display: 'flex', justifyContent: f.flagged ? 'flex-end' : 'flex-start', flexShrink: 0 }}><span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }} /></button>
      </div>
    </Drawer>
  );
}

/* ============ RECONCILE ============ */
export function ReconcileModal({ open, account, txs, onClose, onReconcile }) {
  const sumAll = txs.reduce((s, t) => s + t.amount, 0);
  const nonRecon = txs.filter(t => t.status !== 'R');
  const beginning = account.balance - nonRecon.reduce((s, t) => s + t.amount, 0);
  const [ending, setEnding] = useOvS(account.balance.toFixed(2));
  const [ticked, setTicked] = useOvS({});
  useOvE(() => { if (open) { const init = {}; nonRecon.forEach(t => { if (t.status === 'C') init[t.id] = true; }); setTicked(init); setEnding(account.balance.toFixed(2)); } }, [open]);
  const clearedSum = nonRecon.filter(t => ticked[t.id]).reduce((s, t) => s + t.amount, 0);
  const cleared = beginning + clearedSum;
  const diff = (parseFloat(ending) || 0) - cleared;
  const balanced = Math.abs(diff) < 0.005;
  const Tile = ({ k, v, c }) => <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600 }}>{k}</div><div className="num" style={{ fontSize: 16, fontWeight: 700, marginTop: 3, color: c || 'var(--text)' }}>{v}</div></div>;

  return (
    <Modal open={open} onClose={onClose} title="Reconcile — Everyday Checking" sub="Match your register to your bank statement" width={560}
      footer={<>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{nonRecon.filter(t => ticked[t.id]).length} of {nonRecon.length} items selected</span>
        <div style={{ flex: 1 }} />
        <button style={ovGhost} onClick={onClose}>Cancel</button>
        <button style={Object.assign({}, ovPrimary, balanced ? {} : { opacity: 0.4, cursor: 'not-allowed' })} disabled={!balanced} onClick={() => balanced && onReconcile(Object.keys(ticked).filter(id => ticked[id]))}>Reconcile {nonRecon.filter(t => ticked[t.id]).length} items</button>
      </>}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14 }}>
        <div style={{ flex: 1 }}><label style={ovLabel}>Statement ending balance</label><input value={ending} onChange={e => setEnding(e.target.value)} className="num" style={ovInput} /></div>
        <div style={{ flex: 1 }}><label style={ovLabel}>Statement date</label><input type="date" defaultValue={iso(AppData.labels.today)} style={ovInput} /></div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '14px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)', marginBottom: 16 }}>
        <Tile k="Beginning" v={fmt(beginning)} c="var(--text-2)" />
        <div style={{ width: 1, background: 'var(--line)' }} />
        <Tile k="Cleared" v={fmt(cleared)} c="var(--text-2)" />
        <div style={{ width: 1, background: 'var(--line)' }} />
        <Tile k="Difference" v={fmt(diff)} c={balanced ? 'var(--pos)' : 'var(--neg)'} />
      </div>
      {balanced && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: 'var(--pos-weak)', borderRadius: 'var(--r-ctrl)', marginBottom: 14, fontSize: 12.5, color: 'var(--pos)', fontWeight: 600 }}><span>✓</span>Balanced — you're ready to reconcile.</div>}
      <label style={ovLabel}>Mark items that appear on your statement</label>
      <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)', overflow: 'hidden' }}>
        {nonRecon.map((t, i) => {
          const on = !!ticked[t.id];
          return (
            <div key={t.id} onClick={() => setTicked(s => ({ ...s, [t.id]: !s[t.id] }))} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 12px', borderBottom: i < nonRecon.length - 1 ? '1px solid var(--line)' : 0, cursor: 'pointer', background: on ? 'var(--accent-weak)' : (i % 2 ? 'var(--surface-2)' : 'transparent') }}>
              <span style={{ width: 17, height: 17, borderRadius: 5, border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--line-strong)'), background: on ? 'var(--accent)' : 'transparent', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>{on ? '✓' : ''}</span>
              <span className="num" style={{ fontSize: 11.5, color: 'var(--text-3)', width: 44, flexShrink: 0 }}>{t.date.slice(5).replace('-', '/')}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.payee}</span>
              <span className="num" style={{ fontSize: 12.5, fontWeight: 600, color: t.amount > 0 ? 'var(--pos)' : 'var(--text)' }}>{t.amount > 0 ? '+' : '−'}${fmtN(t.amount)}</span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/* ============ ADD TRANSACTION ============ */
export function AddTxModal({ open, accounts, defaultAccount, onClose, onAdd }) {
  const [f, setF] = useOvS({ acct: defaultAccount || 'chk', kind: 'expense', payee: '', cat: '', amount: '', date: iso(AppData.labels.today), memo: '', recurring: false, freq: 'Monthly' });
  useOvE(() => { if (open) setF(s => ({ ...s, acct: defaultAccount || 'chk', kind: 'expense', payee: '', cat: '', amount: '', memo: '', recurring: false })); }, [open]);
  const payees = useOvM(() => Array.from(new Set([...(AppData.topPayees || []).map(p => p.payee), ...(AppData.subscriptions || []).map(s => s.name), ...(AppData.transactions || []).map(t => t.payee)])), []);
  const valid = f.payee.trim() && !isNaN(parseFloat(f.amount)) && parseFloat(f.amount) > 0;
  function submit() {
    if (!valid) return;
    const mag = Math.abs(parseFloat(f.amount));
    const amount = f.kind === 'income' ? mag : -mag;
    onAdd({ acct: f.acct, payee: f.payee.trim(), cat: f.kind === 'transfer' ? 'Transfer' : f.cat, amount, date: f.date, memo: f.memo, recurring: f.recurring, freq: f.freq });
  }
  return (
    <Modal open={open} onClose={onClose} title="Add transaction" sub="Record a payment, deposit, or transfer" width={500}
      footer={<><div style={{ flex: 1 }} /><button style={ovGhost} onClick={onClose}>Cancel</button><button style={Object.assign({}, ovPrimary, valid ? {} : { opacity: 0.4, cursor: 'not-allowed' })} disabled={!valid} onClick={submit}>Add transaction</button></>}>
      <div style={{ marginBottom: 14 }}>
        <Segmented value={f.kind} onChange={v => setF({ ...f, kind: v })} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfer' }]} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div><label style={ovLabel}>Account</label><select value={f.acct} onChange={e => setF({ ...f, acct: e.target.value })} style={ovInput}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div><label style={ovLabel}>Date</label><input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} style={ovInput} /></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={ovLabel}>{f.kind === 'transfer' ? 'Transfer to' : 'Payee'}</label>
        <input list="ff-payees" value={f.payee} onChange={e => setF({ ...f, payee: e.target.value })} placeholder={f.kind === 'transfer' ? 'Destination account or payee…' : 'Who did you pay?'} style={ovInput} />
        <datalist id="ff-payees">{payees.map(p => <option key={p} value={p} />)}</datalist>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: f.kind === 'transfer' ? '1fr' : '1fr 150px', gap: 14, marginBottom: 14 }}>
        {f.kind !== 'transfer' && <div><label style={ovLabel}>Category</label><select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })} style={ovInput}><option value="">Uncategorized</option>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>}
        <div><label style={ovLabel}>Amount</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: 13 }}>$</span>
            <input value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} placeholder="0.00" className="num" style={Object.assign({}, ovInput, { paddingLeft: 22, textAlign: 'right' })} />
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}><label style={ovLabel}>Memo</label><input value={f.memo} onChange={e => setF({ ...f, memo: e.target.value })} placeholder="Optional note" style={ovInput} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)' }}>
        <button onClick={() => setF({ ...f, recurring: !f.recurring })} style={{ width: 38, height: 22, borderRadius: 99, border: 0, cursor: 'pointer', padding: 2, background: f.recurring ? 'var(--accent)' : 'var(--line-strong)', display: 'flex', justifyContent: f.recurring ? 'flex-end' : 'flex-start', flexShrink: 0 }}><span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }} /></button>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Make recurring</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Schedule it as a repeating bill or deposit</div></div>
        {f.recurring && <select value={f.freq} onChange={e => setF({ ...f, freq: e.target.value })} style={Object.assign({}, ovInput, { width: 120, padding: '6px 9px' })}><option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select>}
      </div>
    </Modal>
  );
}

/* ============ ACCOUNT LINK / ONBOARDING ============ */
const INSTITUTIONS = [
  ['Chase', 'var(--cat-1)'], ['Bank of America', 'var(--cat-4)'], ['Wells Fargo', 'var(--cat-3)'], ['Citi', 'var(--cat-1)'],
  ['Capital One', 'var(--cat-4)'], ['Ally Bank', 'var(--cat-5)'], ['Charles Schwab', 'var(--cat-2)'], ['Vanguard', 'var(--cat-4)'],
  ['Fidelity', 'var(--cat-2)'], ['Schwab', 'var(--cat-1)'], ['American Express', 'var(--cat-6)'], ['Discover', 'var(--cat-3)'],
];
const DISCOVERED = {
  Chase: [{ name: 'Sapphire Checking', kind: 'Checking', mask: '4021', bal: 6210.55 }, { name: 'Freedom Unlimited', kind: 'Credit card', mask: '7788', bal: -1840.20 }, { name: 'Premier Savings', kind: 'Savings', mask: '0143', bal: 15400.00 }],
  default: [{ name: 'Everyday Checking', kind: 'Checking', mask: '5567', bal: 4820.12 }, { name: 'High-Yield Savings', kind: 'Savings', mask: '9920', bal: 22150.00 }],
};

export function LinkAccountFlow({ open, onClose, onLinked }) {
  const [step, setStep] = useOvS(0);
  const [bank, setBank] = useOvS(null);
  const [q, setQ] = useOvS('');
  const [picked, setPicked] = useOvS({});
  useOvE(() => { if (open) { setStep(0); setBank(null); setQ(''); setPicked({}); } }, [open]);
  useOvE(() => {
    if (step === 1) { const tm = setTimeout(() => setStep(2), 1500); return () => clearTimeout(tm); }
  }, [step]);
  const accts = bank ? (DISCOVERED[bank] || DISCOVERED.default) : [];
  useOvE(() => { if (step === 2) { const init = {}; accts.forEach((_, i) => init[i] = true); setPicked(init); } }, [step]);
  const pickedCount = Object.values(picked).filter(Boolean).length;
  const list = INSTITUTIONS.filter(([n]) => n.toLowerCase().includes(q.toLowerCase()));

  const titles = ['Link an account', `Connecting to ${bank || ''}`, 'Choose accounts to import', 'All set'];
  const subs = ['Search 12,000+ banks and brokerages', 'Establishing a secure read-only connection', `Found ${accts.length} accounts at ${bank}`, ''];

  let footer = null;
  if (step === 2) footer = <><span style={{ fontSize: 12, color: 'var(--text-3)' }}>{pickedCount} selected</span><div style={{ flex: 1 }} /><button style={ovGhost} onClick={() => setStep(0)}>Back</button><button style={Object.assign({}, ovPrimary, pickedCount ? {} : { opacity: 0.4 })} disabled={!pickedCount} onClick={() => setStep(3)}>Import {pickedCount} accounts</button></>;
  else if (step === 3) footer = <><div style={{ flex: 1 }} /><button style={ovPrimary} onClick={() => { onLinked && onLinked(pickedCount, bank); onClose(); }}>Done</button></>;

  return (
    <Modal open={open} onClose={onClose} title={titles[step]} sub={subs[step]} width={540} footer={footer}>
      {step === 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', marginBottom: 14 }}>
            <span style={{ color: 'var(--text-faint)' }}>⌕</span>
            <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Search your bank…" style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--text)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {list.map(([name, col]) => (
              <button key={name} onClick={() => { setBank(name); setStep(1); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '16px 8px', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface-2)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.background = 'var(--surface)'; }}>
                <span style={{ width: 36, height: 36, borderRadius: 9, background: col, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{name[0]}</span>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text)', textAlign: 'center', lineHeight: 1.3 }}>{name}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 11.5, color: 'var(--text-faint)', justifyContent: 'center' }}>
            <span>🔒</span>256-bit encryption · read-only access · credentials never stored
          </div>
        </div>
      )}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: (INSTITUTIONS.find(i => i[0] === bank) || [])[1] || 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 22 }}>{bank && bank[0]}</div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid var(--line-2)', borderTopColor: 'var(--accent)', animation: 'ffSpin .8s linear infinite' }} />
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 18 }}>Securely connecting…</div>
        </div>
      )}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {accts.map((a, i) => {
            const on = !!picked[i];
            return (
              <div key={i} onClick={() => setPicked(p => ({ ...p, [i]: !p[i] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line-2)'), borderRadius: 'var(--r-ctrl)', cursor: 'pointer', background: on ? 'var(--accent-weak)' : 'var(--surface)' }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--line-strong)'), background: on ? 'var(--accent)' : 'transparent', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>{on ? '✓' : ''}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.name}</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{a.kind} ····{a.mask}</div></div>
                <span className="num" style={{ fontSize: 13, fontWeight: 600, color: a.bal < 0 ? 'var(--neg)' : 'var(--text)' }}>{a.bal < 0 ? '−' : ''}${fmtN(a.bal)}</span>
              </div>
            );
          })}
        </div>
      )}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--pos-weak)', color: 'var(--pos)', display: 'grid', placeItems: 'center', fontSize: 32, animation: 'ffCheck .35s cubic-bezier(.2,.7,.3,1)' }}>✓</div>
          <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginTop: 18 }}>{pickedCount} {pickedCount === 1 ? 'account' : 'accounts'} linked</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 5, textAlign: 'center', maxWidth: 320 }}>{bank} is now syncing. Your transactions will appear in the register within a few minutes.</div>
        </div>
      )}
    </Modal>
  );
}
