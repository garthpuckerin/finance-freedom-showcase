/* Finance Freedom — Assistant */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
const { useState: useSaS, useRef: useSaR, useEffect: useSaE } = React;

/* ============ ASSISTANT ============ */
function answer(q) {
  const D = AppData;
  const t = q.toLowerCase();
  const month = D.transactions.filter(x => x.date.startsWith(D.currentMonth));
  const income = month.filter(x => x.amount > 0).reduce((s, x) => s + x.amount, 0);
  const expense = month.filter(x => x.amount < 0).reduce((s, x) => s + Math.abs(x.amount), 0);

  if (/(net worth|worth)/.test(t)) return { text: `Your net worth is **${fmt(D.netWorth, { maximumFractionDigits: 0 })}** — up about $14,820 over the trailing 12 months. Assets total ${fmt(D.accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0), { maximumFractionDigits: 0 })} against ${fmt(Math.abs(D.accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0)), { maximumFractionDigits: 0 })} in debts.`, chips: ['Show net worth trend', 'What are my debts?'] };
  if (/(subscription|recurring)/.test(t)) { const tot = D.subscriptions.reduce((s, x) => s + x.amount, 0); const un = D.subscriptions.filter(s => s.status === 'unused'); return { text: `I found **${D.subscriptions.length} recurring subscriptions** totaling **$${fmtN(tot)}/mo**. ${un.length} look unused — ${un.map(u => u.name).join(' and ')} — cancelling them would save about $${(un.reduce((s, u) => s + u.amount, 0) * 12).toFixed(0)} a year.`, chips: ['Cancel unused subs', 'Biggest expense?'] }; }
  for (const cat of ['food', 'housing', 'transport', 'shopping', 'utilities', 'health', 'entertainment']) {
    if (t.includes(cat)) { const c = D.spendingByCategory.find(x => x.category.toLowerCase() === cat); if (c) return { text: `You've spent **$${fmtN(c.amount)}** on **${c.category}** this month — that's ${c.pct}% of your spending. ${c.amount > 600 ? 'It\'s one of your larger categories.' : 'That\'s on the lighter side.'}`, chips: ['Spending by category', 'Am I over budget?'] }; }
  }
  if (/(biggest|largest|top).*(expense|spend|cost)/.test(t) || /where.*money/.test(t)) { const top = D.spendingByCategory[0]; return { text: `Your biggest expense this month is **${top.category}** at **$${fmtN(top.amount)}** (${top.pct}%), driven mostly by rent. Food is next at $${fmtN(D.spendingByCategory[1].amount)}.`, chips: ['Spending by category', 'How can I save more?'] }; }
  if (/(save|saving|savings rate)/.test(t)) { const rate = (((income - expense) / income) * 100).toFixed(1); return { text: `Your savings rate this month is **${rate}%** — income of ${fmt(income, { maximumFractionDigits: 0 })} against ${fmt(expense, { maximumFractionDigits: 0 })} in spending. Cancelling 2 unused subscriptions and trimming dining would push you past your 15% goal.`, chips: ['What\'s over budget?', 'When am I debt-free?'] }; }
  if (/(debt|payoff|owe)/.test(t)) { const tot = D.debts.reduce((s, d) => s + d.balance, 0); return { text: `You carry **${fmt(tot, { maximumFractionDigits: 0 })}** across ${D.debts.length} accounts. Using the avalanche method with $300 extra a month, you'd be debt-free by mid-2028 and save hundreds in interest — the 22% Sapphire Reserve is the one to attack first.`, chips: ['Open Debt Payoff', 'Net worth?'] }; }
  if (/(budget|over)/.test(t)) { const over = D.budgets.filter(b => b.spent > b.budgeted); return { text: `You're over budget in **${over.length} envelopes**: ${over.map(b => b.category).join(', ')}. Dining is $${(D.budgets[1].spent - D.budgets[1].budgeted).toFixed(0)} over and Transport is $${(D.budgets[2].spent - D.budgets[2].budgeted).toFixed(0)} over with a few days left in ${D.labels.monthName}.`, chips: ['Spending by category', 'How can I save more?'] }; }
  if (/(income|earn|make|salary)/.test(t)) return { text: `Your income this month is **${fmt(income, { maximumFractionDigits: 0 })}**, from two payroll deposits plus a little interest. Your trailing average is about $9,180/mo.`, chips: ['Savings rate?', 'Net worth?'] };
  if (/(afford|can i)/.test(t)) return { text: `Based on your 60-day forecast, checking dips to **$420** on ${D.labels.projectedLowDay} before payday — so a large purchase before then would breach your safety floor. A couple of days later you'd have room. Want me to model a specific amount?`, chips: ['Show cash flow', 'Savings rate?'] };
  if (/(invest|portfolio|stock)/.test(t)) { const mv = D.holdings.reduce((s, h) => s + h.shares * h.price, 0); return { text: `Your portfolio is worth **${fmt(mv, { maximumFractionDigits: 0 })}** across 6 holdings. One note: $4,820 sits idle in settlement cash — investing it could add roughly $340/yr.`, chips: ['Open Investments', 'Net worth?'] }; }
  return { text: `I can answer questions about your spending, budgets, net worth, debts, subscriptions and cash flow — all grounded in your real register. Try one of these:`, chips: ['What\'s my net worth?', 'Biggest expense this month?', 'Find unused subscriptions', 'When am I debt-free?'] };
}

function renderRich(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => p.startsWith('**') ? <b key={i} className={/\$|%/.test(p) ? 'num' : ''} style={{ color: 'var(--text)', fontWeight: 700 }}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>);
}

export function AssistantScreen() {
  const [msgs, setMsgs] = useSaS([{ role: 'a', ...answer('') }]);
  const [input, setInput] = useSaS('');
  const scrollRef = useSaR(null);
  useSaE(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs]);
  function send(text) {
    const q = (text != null ? text : input).trim();
    if (!q) return;
    setInput('');
    setMsgs(m => [...m, { role: 'u', text: q }]);
    setTimeout(() => setMsgs(m => [...m, { role: 'a', ...answer(q) }]), 320);
  }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--canvas)' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 'var(--pad) 22px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {msgs.map((m, i) => m.role === 'u' ? (
            <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '78%', background: 'var(--accent)', color: 'var(--on-accent)', padding: '9px 14px', borderRadius: '14px 14px 4px 14px', fontSize: 13.5, lineHeight: 1.5, boxShadow: 'var(--shadow-sm)' }}>{m.text}</div>
          ) : (
            <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%', display: 'flex', gap: 11 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent-weak)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0, border: '1px solid var(--accent-line)' }}>✦</div>
              <div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '11px 15px', borderRadius: '14px 14px 14px 4px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-2)', boxShadow: 'var(--shadow-sm)' }}>{renderRich(m.text)}</div>
                {m.chips && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
                  {m.chips.map(c => <button key={c} onClick={() => send(c)} style={{ fontSize: 11.5, fontWeight: 500, padding: '5px 11px', borderRadius: 'var(--r-pill)', cursor: 'pointer', fontFamily: 'var(--font-ui)', border: '1px solid var(--line-2)', background: 'var(--surface)', color: 'var(--accent)' }}>{c}</button>)}
                </div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--surface)', padding: '12px 22px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px 6px 14px', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-pill)' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Ask about your money — grounded in your register…" style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--text)' }} />
          <button onClick={() => send()} disabled={!input.trim()} style={{ width: 34, height: 34, borderRadius: '50%', border: 0, cursor: input.trim() ? 'pointer' : 'default', background: input.trim() ? 'var(--accent)' : 'var(--line-strong)', color: 'var(--on-accent)', fontSize: 15, display: 'grid', placeItems: 'center', flexShrink: 0 }}>↑</button>
        </div>
        <div style={{ maxWidth: 760, margin: '7px auto 0', fontSize: 10.5, color: 'var(--text-faint)', textAlign: 'center' }}>Answers are generated from your local register data. Not financial advice.</div>
      </div>
    </div>
  );
}
