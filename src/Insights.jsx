/* Finance Freedom — Insights, Search, Tax */
import React from 'react';
import { AppData, fmt, fmtN } from './data.js';
import { Badge, Stat, Card } from './ui.jsx';
import { useBudgetStyle, styleInsight } from './BudgetStyles.jsx';
const { useState: useInS, useMemo: useInM } = React;

const TH2 = (extra) => Object.assign({ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontWeight: 600, padding: '9px 14px', background: 'var(--surface-3)', borderBottom: '1px solid var(--line-2)' }, extra);
const TD2 = (extra) => Object.assign({ padding: '0 14px', height: 'var(--row-h)', borderBottom: '1px solid var(--line)', color: 'var(--text)', fontSize: 'var(--fs-table)', verticalAlign: 'middle' }, extra);

/* ============ INSIGHTS ============ */
function InsightCard({ ins }) {
  const tones = {
    neg: ['var(--neg-weak)', 'var(--neg)'], warn: ['var(--warn-weak)', 'var(--warn)'],
    pos: ['var(--pos-weak)', 'var(--pos)'], info: ['var(--info-weak)', 'var(--info)'],
  };
  const [bg, fg] = tones[ins.tone] || tones.info;
  return (
    <div className="card" style={{ padding: 'var(--pad)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, color: fg, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{ins.glyph}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{ins.title}</span>
          <Badge tone="neutral">{ins.tag}</Badge>
          {ins.impact && <Badge tone="pos">−${fmtN(ins.impact)}/mo</Badge>}
        </div>
        <p style={{ margin: '0 0 11px', fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-2)' }}>{ins.body}</p>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-weak)', border: '1px solid var(--accent-line)', borderRadius: 'var(--r-ctrl)', padding: '5px 11px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>{ins.action} →</button>
      </div>
    </div>
  );
}

export function InsightsScreen() {
  const D = AppData;
  const [style] = useBudgetStyle();
  const styleIns = styleInsight(style); // null under envelope — stock feed already speaks envelope
  const subs = D.subscriptions;
  const subTotal = subs.reduce((s, x) => s + x.amount, 0);
  const unused = subs.filter(s => s.status === 'unused');
  const unusedTotal = unused.reduce((s, x) => s + x.amount, 0);
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="New This Week" v={`${D.insights.length}`} d={`${D.insights.filter(i => i.tone === 'neg' || i.tone === 'warn').length} need attention`} dColor="var(--warn)" />
          <Stat k="Subscriptions" v={`$${fmtN(subTotal)}`} d={`${subs.length} recurring · /mo`} />
          <Stat k="Unused Subs" v={`$${fmtN(unusedTotal)}`} d={`${unused.length} found · /mo`} dColor="var(--neg)" />
          <Stat k="Potential Savings" v={`${fmt(unusedTotal, { maximumFractionDigits: 0 })}/mo`} d={`≈ ${fmt(unusedTotal * 12, { maximumFractionDigits: 0 })} / year`} dColor="var(--pos)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--gap)', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
            {styleIns && <InsightCard ins={styleIns} />}
            {D.insights.map(ins => <InsightCard key={ins.id} ins={ins} />)}
          </div>
          <Card title="Detected Subscriptions" pad={false}>
            {subs.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 16px', borderBottom: '1px solid var(--line)', background: s.status === 'unused' ? 'var(--neg-weak)' : 'transparent' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-3)', color: 'var(--text-2)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-display)' }}>{s.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: s.status === 'unused' ? 'var(--neg)' : 'var(--text-faint)' }}>{s.status === 'unused' ? s.note : `${s.cadence} · next ${s.next}`}</div>
                </div>
                <div className="num" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>${fmtN(s.amount)}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============ SEARCH ============ */
export function SearchScreen() {
  const D = AppData;
  const [q, setQ] = useInS('');
  const [cat, setCat] = useInS('all');
  const cats = ['all', 'Income', 'Housing', 'Food', 'Transport', 'Shopping', 'Utilities', 'Health', 'Entertainment', 'Transfer'];
  const results = useInM(() => {
    const ql = q.trim().toLowerCase();
    return D.transactions.filter(t => {
      const matchQ = !ql || t.payee.toLowerCase().includes(ql) || (t.cat || '').toLowerCase().includes(ql) || (t.memo || '').toLowerCase().includes(ql);
      const matchC = cat === 'all' || (t.cat || '').startsWith(cat);
      return matchQ && matchC;
    });
  }, [q, cat]);
  const inflow = results.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outflow = results.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div className="card" style={{ padding: '12px 14px', marginBottom: 'var(--gap)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)' }}>
            <span style={{ color: 'var(--text-faint)', fontSize: 16 }}>⌕</span>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search payees, categories, memos…" style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)' }} />
            {q && <button onClick={() => setQ('')} style={{ border: 0, background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 14 }}>✕</button>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ fontSize: 11.5, fontWeight: cat === c ? 600 : 500, padding: '4px 11px', borderRadius: 'var(--r-pill)', cursor: 'pointer', fontFamily: 'var(--font-ui)', border: '1px solid ' + (cat === c ? 'transparent' : 'var(--line-2)'), background: cat === c ? 'var(--accent)' : 'var(--surface)', color: cat === c ? 'var(--on-accent)' : 'var(--text-2)' }}>{c === 'all' ? 'All' : c}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, padding: '0 2px' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}><b style={{ color: 'var(--text)' }}>{results.length}</b> {results.length === 1 ? 'result' : 'results'}{q ? ` for “${q}”` : ''}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Inflow <span className="num pos" style={{ fontWeight: 600 }}>+${fmtN(inflow)}</span></span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Outflow <span className="num neg" style={{ fontWeight: 600 }}>−${fmtN(outflow)}</span></span>
        </div>
        <Card pad={false}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
            <thead><tr>
              <th style={TH2({ width: 90 })}>Date</th><th style={TH2()}>Payee</th>
              <th style={TH2({ width: 170 })}>Category</th><th style={TH2({ width: 120, textAlign: 'right' })}>Amount</th>
            </tr></thead>
            <tbody>
              {results.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent' }}>
                  <td className="num" style={TD2({ color: 'var(--text-3)' })}>{t.date.slice(5).replace('-', '/')}</td>
                  <td style={TD2({ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{hl(t.payee, q)}</td>
                  <td style={TD2({ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{t.cat || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Uncategorized</span>}</td>
                  <td className="num" style={TD2({ textAlign: 'right', fontWeight: 600, color: t.amount > 0 ? 'var(--pos)' : 'var(--text)' })}>{t.amount > 0 ? '+' : '−'}${fmtN(t.amount)}</td>
                </tr>
              ))}
              {!results.length && <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>No transactions match your search.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/* ============ TAX ============ */
export function TaxScreen() {
  const D = AppData;
  const [rows, setRows] = useInS(() => D.taxCategories.map(c => ({ ...c })));
  const deductibleTotal = rows.filter(r => r.deductible).reduce((s, r) => s + r.amount, 0);
  const estSavings = deductibleTotal * 0.24;
  // Filing deadline DERIVED from today: April 15 of next year (current tax year
  // filed next spring). Days-to-deadline computed, never frozen.
  const today = new Date(D.labels.today);
  const deadline = new Date(today.getFullYear() + 1, 3, 15); // Apr = month 3
  const daysToDeadline = Math.round((deadline - today) / 86400000);
  const deadlineLabel = deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  function toggle(i) { setRows(rs => rs.map((r, j) => j === i ? { ...r, deductible: !r.deductible } : r)); }
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ padding: 'var(--pad) 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
          <Stat k="Deductible · YTD" v={fmt(deductibleTotal, { maximumFractionDigits: 0 })} d={`${rows.filter(r => r.deductible).length} categories tracked`} />
          <Stat k="Est. Tax Savings" v={fmt(estSavings, { maximumFractionDigits: 0 })} d="at 24% marginal rate" dColor="var(--pos)" />
          <Stat k="Filing Status" v="MFJ" d="Married, joint" />
          <Stat k="Days to Deadline" v={`${daysToDeadline}`} d={deadlineLabel} />
        </div>
        <Card title="Deductible Categories · 2026" pad={false} action={<button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-weak)', border: '1px solid var(--accent-line)', borderRadius: 'var(--r-ctrl)', padding: '5px 11px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>↓ Export Schedule C</button>}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', tableLayout: 'fixed' }}>
            <thead><tr>
              <th style={TH2({ width: 64 })}>Track</th><th style={TH2()}>Category</th>
              <th style={TH2({ width: 200 })}>Maps to</th>
              <th style={TH2({ width: 200 })}>Notes</th>
              <th style={TH2({ width: 130, textAlign: 'right' })}>Amount</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 ? 'var(--surface-2)' : 'transparent', opacity: r.deductible ? 1 : 0.5 }}>
                  <td style={TD2()}>
                    <button onClick={() => toggle(i)} style={{ width: 34, height: 20, borderRadius: 99, border: 0, cursor: 'pointer', padding: 2, background: r.deductible ? 'var(--accent)' : 'var(--line-strong)', display: 'flex', justifyContent: r.deductible ? 'flex-end' : 'flex-start', transition: 'background .15s' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--surface)', display: 'block', boxShadow: 'var(--shadow-sm)' }} />
                    </button>
                  </td>
                  <td style={TD2({ fontWeight: 600 })}>{r.category}</td>
                  <td style={TD2({ color: 'var(--text-2)' })}><span className="num" style={{ fontSize: 11.5 }}>{r.schedule}</span></td>
                  <td style={TD2({ color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{r.note}</td>
                  <td className="num" style={TD2({ textAlign: 'right', fontWeight: 600, color: r.amount ? 'var(--text)' : 'var(--text-faint)' })}>${fmtN(r.amount)}</td>
                </tr>
              ))}
              <tr>
                <td style={TD2({ borderBottom: 0 })}></td>
                <td style={TD2({ borderBottom: 0, fontWeight: 700 })}>Total deductible</td>
                <td style={TD2({ borderBottom: 0 })}></td><td style={TD2({ borderBottom: 0 })}></td>
                <td className="num" style={TD2({ borderBottom: 0, textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 14 })}>${fmtN(deductibleTotal)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function hl(text, q) {
  const ql = (q || '').trim();
  if (!ql) return text;
  const idx = text.toLowerCase().indexOf(ql.toLowerCase());
  if (idx < 0) return text;
  return React.createElement(React.Fragment, null, text.slice(0, idx),
    React.createElement('mark', { style: { background: 'var(--accent-weak)', color: 'var(--text)', borderRadius: 3, padding: '0 1px' } }, text.slice(idx, idx + ql.length)),
    text.slice(idx + ql.length));
}
