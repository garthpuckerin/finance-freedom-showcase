/* Finance Freedom — Settings (sectioned) */
import React from 'react';
import { AppData, fmtN } from './data.js';
import { Card, Segmented, Badge } from './ui.jsx';
import { ACCENTS, getAppearance, setAppearance, APPEARANCE_EVENT } from './theme.js';
import { BUDGET_STYLES, useBudgetStyle } from './BudgetStyles.jsx';
const { useState: useSeS, useEffect: useSeE } = React;

const SECTIONS = [
  ['profile', '◉', 'Profile & Household'],
  ['prefs', '◫', 'Preferences'],
  ['accounts', '⊞', 'Accounts & Import'],
  ['rules', '⊜', 'Categorization Rules'],
  ['notifications', '◷', 'Notifications'],
  ['security', '⊙', 'Security & Privacy'],
  ['data', '↓', 'Data & Export'],
  ['about', 'ⓘ', 'About'],
];

const ctrl = { width: '100%', boxSizing: 'border-box', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '8px 11px', outline: 'none' };

function SeToggle({ on, onToggle, big }) {
  const w = big ? 38 : 34, h = big ? 22 : 20, k = big ? 18 : 16;
  return (
    <button onClick={onToggle} style={{ width: w, height: h, borderRadius: 99, border: 0, cursor: 'pointer', padding: 2, background: on ? 'var(--accent)' : 'var(--line-strong)', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'background .15s', flexShrink: 0 }}>
      <span style={{ width: k, height: k, borderRadius: '50%', background: 'var(--surface)', display: 'block', boxShadow: 'var(--shadow-sm)' }} />
    </button>
  );
}

function SeRow({ label, desc, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', borderBottom: last ? 0 : '1px solid var(--line)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
    </div>
  );
}

function SeField({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '13px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ width: 168, flexShrink: 0, paddingTop: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1, maxWidth: 400 }}>{children}</div>
    </div>
  );
}

const primaryBtn = { fontSize: 12, fontWeight: 600, color: 'var(--on-accent)', background: 'var(--accent)', border: 0, borderRadius: 'var(--r-ctrl)', padding: '7px 13px', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' };
const ghostBtn = { fontSize: 12, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '7px 13px', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' };

const toast = (m) => window.__ffToast && window.__ffToast(m);

/* Real exports of the mock register — CSV and QIF are plain text, so the demo
 * genuinely downloads them; OFX and PDF stay mocked (toast) honestly. */
function downloadText(filename, mime, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportRegister(fmt) {
  const txs = AppData.transactions;
  if (fmt === 'CSV') {
    const esc = (s) => `"${String(s == null ? '' : s).replace(/"/g, '""')}"`;
    const rows = [['Date', 'Payee', 'Category', 'Memo', 'Amount', 'Balance'].join(',')]
      .concat(txs.map(t => [esc(t.date), esc(t.payee), esc(t.cat), esc(t.memo), t.amount.toFixed(2), t.balance.toFixed(2)].join(',')));
    downloadText('finance-freedom-register.csv', 'text/csv', rows.join('\r\n'));
    toast(`Exported ${txs.length} transactions · CSV`);
  } else if (fmt === 'QIF') {
    const mdy = (iso) => { const [y, m, d] = iso.split('-'); return `${m}/${d}/${y}`; };
    const body = txs.map(t => `D${mdy(t.date)}\nT${t.amount.toFixed(2)}\nP${t.payee}\nL${t.cat || 'Uncategorized'}\n${t.memo ? 'M' + t.memo + '\n' : ''}^`).join('\n');
    downloadText('finance-freedom-register.qif', 'application/qif', `!Type:Bank\n${body}\n`);
    toast(`Exported ${txs.length} transactions · QIF`);
  } else {
    toast(`${fmt} export is mocked in this demo — try CSV or QIF`);
  }
}

/* ---------- PROFILE & HOUSEHOLD ---------- */
function ProfileSection() {
  const members = [
    { name: 'Demo User', role: 'Owner', email: 'demo@financefreedom.app', initials: 'DU', accent: true },
    { name: 'Guest User', role: 'Partner', email: 'guest@financefreedom.app', initials: 'GU' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <Card title="Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', flexShrink: 0 }}>DU</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Demo User</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Owner · member since 2023</div>
          </div>
          <button style={ghostBtn} onClick={() => toast('Photo upload is mocked in this demo')}>Change photo</button>
        </div>
        <SeField label="Full name"><input defaultValue="Demo User" style={ctrl} /></SeField>
        <SeField label="Email" hint="Used for sign-in & alerts"><input defaultValue="demo@financefreedom.app" style={ctrl} /></SeField>
        <SeField label="Phone"><input defaultValue="(415) 555-0142" style={ctrl} /></SeField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14 }}>
          <button style={ghostBtn} onClick={() => toast('Changes discarded')}>Cancel</button><button style={primaryBtn} onClick={() => toast('Profile saved — demo build, resets on reload')}>Save changes</button>
        </div>
      </Card>

      <Card title="Household" pad={false} action={<button style={primaryBtn} onClick={() => toast('Invites are mocked in this demo')}>⊕ Invite member</button>}>
        <div style={{ padding: 'var(--pad)' }}>
          <SeField label="Household name"><input defaultValue="Demo Household" style={ctrl} /></SeField>
          <SeField label="Base currency">
            <select style={ctrl} defaultValue="USD"><option>USD — US Dollar</option><option>EUR — Euro</option><option>GBP — British Pound</option><option>CAD — Canadian Dollar</option></select>
          </SeField>
          <SeField label="Fiscal year starts"><select style={ctrl} defaultValue="January"><option>January</option><option>April</option><option>July</option><option>October</option></select></SeField>
        </div>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {members.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < members.length - 1 ? '1px solid var(--line)' : 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.accent ? 'var(--accent)' : 'var(--surface-3)', color: m.accent ? 'var(--on-accent)' : 'var(--text-2)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', flexShrink: 0 }}>{m.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{m.email}</div>
              </div>
              <Badge tone={m.accent ? 'accent' : 'neutral'}>{m.role}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- APPEARANCE (wired to theme.js) ---------- */
function AppearanceCard() {
  const [appearance, setLocal] = useSeS(() => getAppearance());

  // stay in sync with the topbar switcher (and any other control)
  useSeE(() => {
    const on = (e) => setLocal(e.detail || getAppearance());
    window.addEventListener(APPEARANCE_EVENT, on);
    return () => window.removeEventListener(APPEARANCE_EVENT, on);
  }, []);

  const setTheme = (theme) => setLocal(setAppearance({ theme }));
  const setAccent = (accent) => setLocal(setAppearance({ accent }));

  // Honest, fixed system characteristics — not user-tunable in this build.
  const fixed = [
    ['Neutral temperature', 'Cool slate'],
    ['Density', 'Cozy'],
    ['Typeface', 'Grotesk'],
  ];

  return (
    <Card title="Appearance">
      <p style={{ margin: '0 0 4px', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
        Built on the <b>Ledger</b> token system — every screen re-derives from a handful of axes. Theme and accent are yours to set; the rest are tuned for this product.
      </p>
      <SeField label="Theme" hint="Light or dark, applied instantly">
        <Segmented
          value={appearance.theme}
          onChange={setTheme}
          options={[{ value: 'light', label: '☀ Light' }, { value: 'dark', label: '☾ Dark' }]}
        />
      </SeField>
      <SeField label="Accent" hint="Drives links, highlights & charts">
        <div role="radiogroup" aria-label="Accent color" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6, flexWrap: 'wrap' }}>
          {ACCENTS.map(([id, label, color]) => {
            const active = appearance.accent === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${label} accent`}
                title={label}
                onClick={() => setAccent(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                  padding: '5px 10px 5px 6px', borderRadius: 'var(--r-ctrl)',
                  background: active ? 'var(--accent-weak)' : 'var(--surface-2)',
                  border: active ? '1px solid var(--accent-line)' : '1px solid var(--line-2)',
                  fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: active ? 600 : 500,
                  color: active ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                <span style={{ width: 16, height: 16, borderRadius: 5, background: color, border: '1px solid var(--line-2)', flexShrink: 0 }} />
                {label}
              </button>
            );
          })}
        </div>
      </SeField>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
        {fixed.map(([label, value]) => (
          <div key={label} style={{ padding: '10px 13px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- PREFERENCES ---------- */
function PreferencesSection() {
  // Date-format dropdown shows the *real today* rendered each way, so the samples stay current.
  const fmtToday = (style) => {
    const t = AppData.labels.today;
    const mm = String(t.getMonth() + 1).padStart(2, '0'), dd = String(t.getDate()).padStart(2, '0'), yy = t.getFullYear();
    if (style === 'us') return `${mm}/${dd}/${yy}`;
    if (style === 'eu') return `${dd}/${mm}/${yy}`;
    if (style === 'iso') return `${yy}-${mm}-${dd}`;
    return t.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  const dateFmts = [fmtToday('long'), fmtToday('us'), fmtToday('eu'), fmtToday('iso')];
  const [p, setP] = useSeS({ landing: 'Dashboard', week: 'Sunday', numfmt: '1,234.56', datefmt: dateFmts[0], confirm: true, round: false });
  const [budgetStyle, setBudgetStyle] = useBudgetStyle();
  const styleDef = BUDGET_STYLES.find(s => s.id === budgetStyle);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <Card title="General">
        <SeField label="Default landing screen" hint="Opens here on launch">
          <select style={ctrl} value={p.landing} onChange={e => setP({ ...p, landing: e.target.value })}><option>Dashboard</option><option>Accounts</option><option>Cash Flow</option><option>Budgets</option><option>Net Worth</option></select>
        </SeField>
        <SeField label="Budgeting style" hint={styleDef ? styleDef.blurb : 'How the Budgets screen frames your month'}>
          <select style={ctrl} value={budgetStyle} onChange={e => { setBudgetStyle(e.target.value); toast(`Budgets now use ${BUDGET_STYLES.find(s => s.id === e.target.value).label}`); }}>
            {BUDGET_STYLES.map(s => <option key={s.id} value={s.id}>{s.label} — {s.tag}</option>)}
          </select>
        </SeField>
        <SeField label="Start of week">
          <Segmented value={p.week} onChange={v => setP({ ...p, week: v })} options={[{ value: 'Sunday', label: 'Sunday' }, { value: 'Monday', label: 'Monday' }]} />
        </SeField>
        <SeField label="Number format"><select style={ctrl} value={p.numfmt} onChange={e => setP({ ...p, numfmt: e.target.value })}><option>1,234.56</option><option>1.234,56</option><option>1 234.56</option></select></SeField>
        <SeField label="Date format"><select style={ctrl} value={p.datefmt} onChange={e => setP({ ...p, datefmt: e.target.value })}>{dateFmts.map(d => <option key={d}>{d}</option>)}</select></SeField>
        <SeRow label="Confirm before deleting transactions" on={p.confirm}><SeToggle big on={p.confirm} onToggle={() => setP({ ...p, confirm: !p.confirm })} /></SeRow>
        <SeRow label="Round projections to whole dollars" desc="Hide cents on charts and forecasts" last><SeToggle big on={p.round} onToggle={() => setP({ ...p, round: !p.round })} /></SeRow>
      </Card>

      <AppearanceCard />
    </div>
  );
}

/* ---------- CONNECTED ACCOUNTS ---------- */
function AccountsSection() {
  const D = AppData;
  return (
    <Card title="Accounts" pad={false} action={<button style={ghostBtn} onClick={() => window.__ffLink ? window.__ffLink() : toast('Link flow unavailable')}>⊕ Link account (optional)</button>}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pos)' }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>All {D.accounts.length} accounts tracked by hand · stored in your local file · no cloud, no subscription, no AI required</span>
        <div style={{ flex: 1 }} />
        <button style={Object.assign({}, ghostBtn, { padding: '5px 11px', fontSize: 11.5 })} onClick={() => toast('Statement import is mocked in this demo')}>⇪ Import statement…</button>
      </div>
      {D.accounts.map((a, i) => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < D.accounts.length - 1 ? '1px solid var(--line)' : 0 }}>
          <span style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-3)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0 }}>{a.glyph}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{a.inst} · {a.kind}</div>
          </div>
          <Badge tone="pos">● Manual</Badge>
          <div className="num" style={{ fontSize: 13, fontWeight: 600, color: a.balance < 0 ? 'var(--neg)' : 'var(--text)', minWidth: 100, textAlign: 'right' }}>{a.balance < 0 ? '−' : ''}${fmtN(a.balance)}</div>
          <button aria-label={`Options for ${a.name}`} onClick={() => toast('Account options are mocked in this demo')} style={{ border: 0, background: 'transparent', color: 'var(--text-faint)', fontSize: 15, cursor: 'pointer', width: 18, textAlign: 'center', padding: 0, fontFamily: 'inherit' }}>⋯</button>
        </div>
      ))}
    </Card>
  );
}

/* ---------- CATEGORIZATION RULES ---------- */
function RulesSettingsSection({ onNav }) {
  const D = AppData;
  const [opt, setOpt] = useSeS({ auto: true, rename: true, suggest: true });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <Card title="Automation">
        <SeRow label="Auto-categorize on import" desc="Apply matching rules as transactions download"><SeToggle big on={opt.auto} onToggle={() => setOpt({ ...opt, auto: !opt.auto })} /></SeRow>
        <SeRow label="Auto-rename payees" desc="Clean up cryptic bank descriptors"><SeToggle big on={opt.rename} onToggle={() => setOpt({ ...opt, rename: !opt.rename })} /></SeRow>
        <SeRow label="Suggest rules from patterns" desc="Detect repeat payees and propose new rules" last><SeToggle big on={opt.suggest} onToggle={() => setOpt({ ...opt, suggest: !opt.suggest })} /></SeRow>
      </Card>
      <Card title="Active Rules" pad={false} action={<button style={primaryBtn} onClick={() => onNav && onNav('rules')}>Open full editor →</button>}>
        {D.rules.slice(0, 5).map((r, i) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--line)', opacity: r.enabled ? 1 : 0.5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.enabled ? 'var(--pos)' : 'var(--text-faint)', flexShrink: 0 }} />
            <span className="num" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', background: 'var(--surface-3)', borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>{r.match}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>→ <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{r.target}</span></span>
            <span className="num" style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{r.hits} matches</span>
          </div>
        ))}
        <div style={{ padding: '10px 16px', fontSize: 11.5, color: 'var(--text-faint)' }}>Showing 5 of {D.rules.length} rules</div>
      </Card>
    </div>
  );
}

/* ---------- NOTIFICATIONS ---------- */
function NotificationsSection() {
  const init = [
    { label: 'Low balance alert', desc: 'When checking is projected below your $1,000 floor', ch: ['Push', 'Email'], on: true },
    { label: 'Bill reminders', desc: '3 days before a scheduled bill is due', ch: ['Push'], on: true },
    { label: 'Large transaction', desc: 'Any single charge over $500', ch: ['Push', 'Email'], on: true },
    { label: 'Budget exceeded', desc: 'When an envelope goes over its limit', ch: ['Push'], on: true },
    { label: 'Deposit received', desc: 'Payroll and incoming transfers', ch: ['Push'], on: false },
    { label: 'Weekly summary', desc: 'Sunday recap of spending & cash flow', ch: ['Email'], on: true },
    { label: 'Unusual activity', desc: 'Spending anomalies flagged by Insights', ch: ['Push', 'Email'], on: true },
  ];
  const [n, setN] = useSeS(init);
  const toggle = (i) => setN(arr => arr.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  return (
    <Card title="Notifications">
      {n.map((x, i) => (
        <SeRow key={i} label={x.label} desc={x.desc} last={i === n.length - 1}>
          <div style={{ display: 'flex', gap: 5, opacity: x.on ? 1 : 0.4 }}>
            {x.ch.map(c => <span key={c} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-3)', borderRadius: 'var(--r-chip)', padding: '2px 7px' }}>{c}</span>)}
          </div>
          <SeToggle big on={x.on} onToggle={() => toggle(i)} />
        </SeRow>
      ))}
    </Card>
  );
}

/* ---------- SECURITY & PRIVACY ---------- */
function SecuritySection() {
  const [sec, setSec] = useSeS({ faceid: true, twofa: true, lock: false, masked: true });
  const [devices, setDevices] = useSeS([
    { device: 'MacBook Pro 16"', loc: 'San Francisco, CA', when: 'This device', current: true },
    { device: 'iPhone 15 Pro', loc: 'San Francisco, CA', when: '2 hours ago' },
    { device: 'iPad Air', loc: 'San Francisco, CA', when: '5 days ago' },
  ]);
  const dropDevice = (name) => { setDevices(ds => ds.filter(d => d.device !== name)); toast(`Signed out ${name}`); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <Card title="Authentication">
        <SeRow label="Face ID unlock" desc="Require biometric auth to open the app"><SeToggle big on={sec.faceid} onToggle={() => setSec({ ...sec, faceid: !sec.faceid })} /></SeRow>
        <SeRow label="Two-factor authentication" desc="SMS code on new devices"><SeToggle big on={sec.twofa} onToggle={() => setSec({ ...sec, twofa: !sec.twofa })} /></SeRow>
        <SeRow label="Auto-lock after 5 minutes" desc="Lock the app when idle"><SeToggle big on={sec.lock} onToggle={() => setSec({ ...sec, lock: !sec.lock })} /></SeRow>
        <SeRow label="Mask balances by default" desc="Hide amounts until tapped" last><SeToggle big on={sec.masked} onToggle={() => setSec({ ...sec, masked: !sec.masked })} /></SeRow>
        <div style={{ display: 'flex', gap: 10, paddingTop: 14 }}><button style={ghostBtn} onClick={() => toast('Password change is mocked in this demo')}>Change password</button></div>
      </Card>
      <Card title="Active Sessions" pad={false}>
        {devices.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < devices.length - 1 ? '1px solid var(--line)' : 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.device}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{d.loc} · {d.when}</div>
            </div>
            {d.current ? <Badge tone="pos">● Current</Badge> : <button style={Object.assign({}, ghostBtn, { padding: '5px 11px', fontSize: 11.5, color: 'var(--neg)' })} onClick={() => dropDevice(d.device)}>Sign out</button>}
          </div>
        ))}
      </Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: 'var(--text-faint)', padding: '0 2px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pos)', flexShrink: 0 }} />
        Bank connections use read-only OAuth. Finance Freedom never stores your bank credentials. Last security review {AppData.labels.monthYear}.
      </div>
    </div>
  );
}

/* ---------- DATA & EXPORT ---------- */
function DataSection() {
  // Local-first by default; cloud is a first-class OPTION, not the default.
  const [cloud, setCloud] = useSeS(false);
  const toggleCloud = () => {
    setCloud(c => { toast(c ? 'Cloud sync off — local file remains the record' : 'Cloud sync on — encrypted, local file stays source of truth'); return !c; });
  };
  const exports = [
    ['QIF', 'Quicken Interchange — for Quicken & Money'], ['OFX', 'Open Financial Exchange'],
    ['CSV', 'Spreadsheet-friendly transactions'], ['PDF', 'Formatted report for printing'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <Card title="Export Data">
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>Download your full register and reports. Exports include all accounts, categories and memos.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {exports.map(([fmt, desc]) => (
            <button key={fmt} onClick={() => exportRegister(fmt)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}>
              <span className="num" style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{fmt}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Export {fmt}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{desc}</span>
              </span>
              <span style={{ color: 'var(--text-faint)', fontSize: 15 }}>↓</span>
            </button>
          ))}
        </div>
      </Card>
      <Card title="Import & Backup">
        <SeRow label="Import transactions" desc="From Quicken, Mint, or a CSV file"><button style={ghostBtn} onClick={() => toast('Import is mocked in this demo')}>Choose file…</button></SeRow>
        <SeRow label="Automatic local backups" desc={`Versioned snapshots kept beside your data file · last ${AppData.labels.medium} · 9:42 AM`}><Badge tone="pos">● On</Badge></SeRow>
        <SeRow label="Cloud sync" desc="Optional — end-to-end encrypted; your local file stays the source of truth"><SeToggle big on={cloud} onToggle={toggleCloud} /></SeRow>
        <SeRow label="Download full archive" desc="Everything, as an encrypted .zip" last><button style={ghostBtn} onClick={() => toast('Archive prep is mocked in this demo — try Export CSV')}>Prepare archive</button></SeRow>
      </Card>
      <Card title="Danger Zone" style={{ borderColor: 'var(--neg-weak)' }}>
        <SeRow label="Reset categorization rules" desc="Restore the default rule set"><button style={Object.assign({}, ghostBtn, { color: 'var(--neg)', borderColor: 'var(--neg-weak)' })} onClick={() => toast('Rule set restored to defaults (demo)')}>Reset</button></SeRow>
        <SeRow label="Delete all data" desc="Permanently erase this household and every account" last>
          <button style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-accent)', background: 'var(--neg)', border: 0, borderRadius: 'var(--r-ctrl)', padding: '7px 13px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }} onClick={() => toast('Demo data is read-only — nothing was deleted')}>Delete everything</button>
        </SeRow>
      </Card>
    </div>
  );
}

/* ---------- ABOUT ---------- */
function AboutSection() {
  const links = [['What\'s new', '↗'], ['Help & Support', '↗'], ['Terms of Service', '↗'], ['Privacy Policy', '↗'], ['Acknowledgements', '↗']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', flexShrink: 0 }}>F</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)' }}>Finance Freedom</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Version 3.2.0 · build 2026.05.29</div>
          </div>
          <button style={ghostBtn} onClick={() => toast('Finance Freedom is up to date')}>Check for updates</button>
        </div>
        <p style={{ margin: '16px 0 0', paddingTop: 16, borderTop: '1px solid var(--line)', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
          The soul of Microsoft Money, rebuilt for 2026. Finance Freedom is built on <b>Ledger</b> — a token-driven design system where every screen re-derives from a handful of axes. Set your theme and accent in <b>Preferences → Appearance</b>.
        </p>
      </Card>
      <Card pad={false}>
        {links.map(([label, glyph], i) => (
          <button key={label} onClick={() => toast(`${label} isn't part of the demo`)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', border: 0, borderBottom: i < links.length - 1 ? '1px solid var(--line)' : 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ flex: 1 }}>{label}</span><span style={{ color: 'var(--text-faint)', fontSize: 13 }}>{glyph}</span>
          </button>
        ))}
      </Card>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.6 }}>© 2026 Finance Freedom · Demo Household<br />Portfolio demo · mock data · no real accounts</div>
    </div>
  );
}

/* ---------- SHELL ---------- */
export function SettingsScreen({ onNav }) {
  const [active, setActive] = useSeS(() => localStorage.getItem('ff_settings') || 'profile');
  React.useEffect(() => { localStorage.setItem('ff_settings', active); }, [active]);
  let body;
  if (active === 'profile') body = <ProfileSection />;
  else if (active === 'prefs') body = <PreferencesSection />;
  else if (active === 'accounts') body = <AccountsSection />;
  else if (active === 'rules') body = <RulesSettingsSection onNav={onNav} />;
  else if (active === 'notifications') body = <NotificationsSection />;
  else if (active === 'security') body = <SecuritySection />;
  else if (active === 'data') body = <DataSection />;
  else body = <AboutSection />;
  const activeLabel = (SECTIONS.find(s => s[0] === active) || [])[2];

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--canvas)' }}>
      <div style={{ display: 'flex', gap: 26, padding: 'var(--pad) 22px', maxWidth: 1080, margin: '0 auto', alignItems: 'flex-start' }}>
        <nav style={{ width: 226, flexShrink: 0, position: 'sticky', top: 14 }}>
          {SECTIONS.map(([id, glyph, label]) => {
            const on = active === id;
            return (
              <button key={id} onClick={() => setActive(id)} style={{
                position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 'var(--r-ctrl)', cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                background: on ? 'var(--surface)' : 'transparent', boxShadow: on ? 'var(--shadow-sm)' : 'none', border: on ? '1px solid var(--line)' : '1px solid transparent',
                color: on ? 'var(--text)' : 'var(--text-2)', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: on ? 600 : 500,
              }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ width: 18, textAlign: 'center', fontSize: 14, color: on ? 'var(--accent)' : 'var(--text-faint)', flexShrink: 0 }}>{glyph}</span>
                <span style={{ flex: 1 }}>{label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: '4px 0 14px', fontSize: 18, fontWeight: 'var(--display-weight)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)' }}>{activeLabel}</h2>
          {body}
        </div>
      </div>
    </div>
  );
}
