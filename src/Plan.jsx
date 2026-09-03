/* Finance Freedom — Debt Payoff & Rules */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { Stat, Segmented, Card, Badge } from './ui.jsx';
import { GaugeBar } from './charts.jsx';
const { useState: usePlS, useMemo: usePlM } = React;

const TH3 = (extra) => Object.assign({ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600, padding: '9px 14px', background: 'var(--surface-3)', borderBottom: '1px solid var(--line-2)' }, extra);
const TD3 = (extra) => Object.assign({ padding: '0 14px', height: 'var(--row-h)', borderBottom: '1px solid var(--line)', color: 'var(--text)', fontSize: 'var(--fs-table)', verticalAlign: 'middle' }, extra);

/* ---- amortization simulator (shared with the Assistant so its payoff date
   matches this screen exactly) ---- */
export function simulate(debts, monthlyBudget, strategy) {
  let bal = debts.map(d => ({ ...d }));
  let totalInterest = 0, months = 0;
  const minSum = bal.reduce((s, d) => s + d.min, 0);
  if (monthlyBudget < minSum) monthlyBudget = minSum;
  while (bal.some(d => d.balance > 0.01) && months < 600) {
    months++;
    // accrue interest
    bal.forEach(d => { if (d.balance > 0) { const i = d.balance * (d.apr / 100 / 12); d.balance += i; totalInterest += i; } });
    // pay minimums
    let pool = monthlyBudget;
    bal.forEach(d => { if (d.balance > 0) { const p = Math.min(d.min, d.balance); d.balance -= p; pool -= p; } });
    // order for extra
    const active = bal.filter(d => d.balance > 0.01);
    active.sort((a, b) => strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr);
    for (const d of active) { if (pool <= 0) break; const p = Math.min(pool, d.balance); d.balance -= p; pool -= p; }
  }
  return { months, totalInterest };
}

export function DebtScreen() {
  const D = AppData;
  const [strategy, setStrategy] = usePlS('avalanche');
  const [extra, setExtra] = usePlS(300);
  const totalDebt = D.debts.reduce((s, d) => s + d.balance, 0);
  const minSum = D.debts.reduce((s, d) => s + d.min, 0);
  const budget = minSum + extra;
  const plan = usePlM(() => simulate(D.debts, budget, strategy), [budget, strategy]);
  const baseline = usePlM(() => simulate(D.debts, minSum, 'avalanche'), [minSum]);
  const saved = baseline.totalInterest - plan.totalInterest;
  const monthsSaved = baseline.months - plan.months;
  const order = D.debts.slice().sort((a, b) => strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr);
  const freeDate = new Date(D.labels.today); freeDate.setDate(1); freeDate.setMonth(freeDate.getMonth() + plan.months);
  const fd = freeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Total Debt" v={fmt(totalDebt, { maximumFractionDigits: 0 })} d={`${D.debts.length} accounts`} dColor="var(--neg)" />
          <Stat k="Debt-Free By" v={fd} d={`${plan.months} months`} dColor="var(--pos)" />
          <Stat k="Interest Saved" v={fmt(saved, { maximumFractionDigits: 0 })} d={`${monthsSaved} mo sooner vs minimums`} dColor="var(--pos)" />
          <Stat k="Monthly Payment" v={fmt(budget, { maximumFractionDigits: 0 })} d={`$${minSum.toFixed(0)} min + $${extra} extra`} />
        </div>

        <div className="card" style={{ padding: 'var(--pad)', marginBottom: 'var(--gap)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>Payoff Strategy</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{strategy === 'avalanche' ? 'Avalanche — attack the highest APR first to minimize interest.' : 'Snowball — clear the smallest balance first for quick wins.'}</div>
            </div>
            <Segmented value={strategy} onChange={setStrategy} options={[{ value: 'avalanche', label: 'Avalanche' }, { value: 'snowball', label: 'Snowball' }]} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500, whiteSpace: 'nowrap' }}>Extra per month</span>
            <input type="range" min="0" max="1500" step="50" value={extra} onChange={e => setExtra(+e.target.value)} style={{ flex: 1, accentColor: 'var(--accent)' }} />
            <span className="num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', minWidth: 64, textAlign: 'right' }}>+${extra}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
          <Card title="Payoff Order" pad={false}>
            {order.map((d, i) => {
              const target = i === 0;
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: target ? 'var(--accent-fill)' : 'var(--surface-3)', color: target ? 'var(--on-accent)' : 'var(--text-3)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-num)' }}>{i + 1}</div>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{d.kind} · {d.apr}% APR</div>
                  </div>
                  {target && <Badge tone="accent">Focus</Badge>}
                  <div className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--neg)' }}>${fmtN(d.balance)}</div>
                </div>
              );
            })}
          </Card>

          <Card title="Accounts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {D.debts.map(d => {
                const ratio = d.balance / totalDebt * 100;
                return (
                  <div key={d.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.name}</span>
                        <Badge tone={d.apr > 15 ? 'neg' : 'neutral'}>{d.apr}% APR</Badge>
                      </div>
                      <span className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--neg)' }}>${fmtN(d.balance)}</span>
                    </div>
                    <GaugeBar value={ratio} max={100} color={d.color} height={8} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11.5, color: 'var(--text-faint)' }}>
                      <span>{d.inst}</span>
                      <span className="num">Min ${d.min.toFixed(2)}/mo</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 4, padding: '11px 13px', borderRadius: 'var(--r-ctrl)', background: 'var(--accent-weak)', border: '1px solid var(--accent-line)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Paying <b className="num" style={{ color: 'var(--text)' }}>${budget.toFixed(0)}/mo</b> with the <b>{strategy}</b> method clears all debt by <b style={{ color: 'var(--accent)' }}>{fd}</b> and saves <b className="num" style={{ color: 'var(--pos)' }}>${fmtN(saved)}</b> in interest.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============ RULES ============ */
export function RulesScreen() {
  const D = AppData;
  const [rules, setRules] = usePlS(() => D.rules.map(r => ({ ...r })));
  const active = rules.filter(r => r.enabled).length;
  const totalHits = rules.reduce((s, r) => s + (r.enabled ? r.hits : 0), 0);
  function toggle(id) { setRules(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)); }
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Active Rules" v={`${active}`} d={`of ${rules.length} total`} />
          <Stat k="Auto-Categorized" v={`${totalHits}`} d="transactions this year" dColor="var(--pos)" />
          <Stat k="Coverage" v="94%" d="of imports matched a rule" />
        </div>
        <Card title="Categorization Rules" pad={false} action={<button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--on-accent)', background: 'var(--accent-fill)', border: 0, borderRadius: 'var(--r-ctrl)', padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>⊕ New Rule</button>}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
            <thead><tr>
              <th style={TH3({ width: 56 })}>On</th>
              <th style={TH3({ width: 230 })}>Condition</th>
              <th style={TH3()}>Action</th>
              <th style={TH3({ width: 70, textAlign: 'right' })}>Matches</th>
            </tr></thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent', opacity: r.enabled ? 1 : 0.5 }}>
                  <td style={TD3()}>
                    <button onClick={() => toggle(r.id)} style={{ width: 34, height: 20, borderRadius: 99, border: 0, cursor: 'pointer', padding: 2, background: r.enabled ? 'var(--accent)' : 'var(--line-strong)', display: 'flex', justifyContent: r.enabled ? 'flex-end' : 'flex-start', transition: 'background .15s' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--surface)', display: 'block', boxShadow: 'var(--shadow-sm)' }} />
                    </button>
                  </td>
                  <td style={TD3({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
                    <span style={{ color: 'var(--text-3)' }}>{r.when} </span>
                    <span className="num" style={{ fontWeight: 600, color: 'var(--text)', background: 'var(--surface-3)', borderRadius: 4, padding: '1px 6px', fontSize: 11.5 }}>{r.match}</span>
                  </td>
                  <td style={TD3({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
                    <span style={{ color: 'var(--text-3)' }}>{r.then} </span>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{r.target}</span>
                  </td>
                  <td className="num" style={TD3({ textAlign: 'right', color: 'var(--text-3)' })}>{r.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
