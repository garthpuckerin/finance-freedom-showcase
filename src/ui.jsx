/* Finance Freedom — shared UI: Topbar, Card, Stat, Badge, Segmented */
import React from 'react';
const { useState: useUiS } = React;

export function Card({ title, action, children, pad = true, style }) {
  return (
    <div className="card" style={Object.assign({ display: 'flex', flexDirection: 'column' }, style)}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
          {action}
        </div>
      )}
      <div style={{ padding: pad ? 'var(--pad)' : 0, flex: 1 }}>{children}</div>
    </div>
  );
}

export function Stat({ k, v, d, dColor }) {
  return (
    <div className="card" style={{ padding: '15px 18px' }}>
      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', fontWeight: 600 }}>{k}</div>
      <div className="num" style={{ fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--text)' }}>{v}</div>
      {d && <div style={{ fontSize: 12, marginTop: 4, color: dColor || 'var(--text-3)' }}>{d}</div>}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }) {
  const map = {
    pos: ['var(--pos-weak)', 'var(--pos)'], neg: ['var(--neg-weak)', 'var(--neg)'],
    warn: ['var(--warn-weak)', 'var(--warn)'], info: ['var(--info-weak)', 'var(--info)'],
    neutral: ['var(--surface-3)', 'var(--text-2)'], accent: ['var(--accent-weak)', 'var(--accent)'],
  };
  const [bg, fg] = map[tone];
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: bg, color: fg, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>{children}</span>;
}

export function Segmented({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? '3px 8px' : '4px 11px';
  return (
    <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        const on = v === value;
        return <button key={v} onClick={() => onChange(v)} style={{
          font: 'inherit', fontSize: size === 'sm' ? 11 : 12, fontWeight: on ? 600 : 500, border: 0, cursor: 'pointer', padding: pad,
          borderRadius: 6, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--text)' : 'var(--text-2)',
          boxShadow: on ? 'var(--shadow-sm)' : 'none', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap',
        }}>{l}</button>;
      })}
    </div>
  );
}

export function Topbar({ title, sub, crumbs, onAdd, onCmd, right }) {
  return (
    <header style={{
      height: 56, flexShrink: 0, borderBottom: '1px solid var(--line)', background: 'var(--surface)',
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px',
    }}>
      <div style={{ minWidth: 0, flex: '0 1 auto' }}>
        {crumbs && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 1 }}>{crumbs}</div>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 'var(--display-weight)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--display-tracking)', color: 'var(--text)', whiteSpace: 'nowrap' }}>{title}</h1>
          {sub && <span style={{ fontSize: 12.5, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{sub}</span>}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      {right}
      <button onClick={onCmd} title="Command palette (⌘K)" style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
        background: 'var(--surface-2)', border: '1px solid var(--line-2)', color: 'var(--text-3)', fontFamily: 'var(--font-ui)', fontSize: 12.5, whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 13 }}>⌕</span><span>Search or jump…</span>
        <kbd className="num" style={{ fontSize: 10, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-faint)' }}>⌘K</kbd>
      </button>
      <button onClick={onAdd} style={{
        display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', borderRadius: 8, cursor: 'pointer',
        background: 'var(--accent)', border: 0, color: 'var(--on-accent)', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
      }}>
        <span style={{ fontSize: 14 }}>⊕</span> Add
      </button>
    </header>
  );
}
