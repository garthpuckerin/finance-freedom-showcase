import React, { useState, useEffect } from 'react';
import { ACCENTS, getAppearance, setAppearance, APPEARANCE_EVENT } from './theme.js';

// Compact, accessible appearance control for the topbar:
//   • a light/dark toggle button
//   • an accent picker (5 swatches)
// Persists immediately via theme.js.

const wrap = {
  display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
};

const toggleBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: 32, width: 32, borderRadius: 8, cursor: 'pointer',
  background: 'var(--surface-2)', border: '1px solid var(--line-2)',
  color: 'var(--text-3)', fontSize: 15, lineHeight: 1, padding: 0,
};

function swatch(active, color) {
  return {
    width: 18, height: 18, borderRadius: 6, cursor: 'pointer', padding: 0,
    background: color, border: '1px solid var(--line-2)',
    outline: active ? '2px solid var(--text)' : 'none', outlineOffset: 2,
  };
}

export function ThemeSwitcher() {
  const [appearance, setLocal] = useState(() => getAppearance());

  // keep in sync when appearance changes elsewhere (e.g. Settings → Appearance)
  useEffect(() => {
    const on = (e) => setLocal(e.detail || getAppearance());
    window.addEventListener(APPEARANCE_EVENT, on);
    return () => window.removeEventListener(APPEARANCE_EVENT, on);
  }, []);

  function toggleTheme() {
    const next = appearance.theme === 'dark' ? 'light' : 'dark';
    setLocal(setAppearance({ theme: next }));
  }

  function pickAccent(accent) {
    setLocal(setAppearance({ accent }));
  }

  const isDark = appearance.theme === 'dark';

  return (
    <div style={wrap} role="group" aria-label="Appearance">
      <button
        type="button"
        onClick={toggleTheme}
        style={toggleBtn}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-pressed={isDark}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        <span aria-hidden="true">{isDark ? '☾' : '☀'}</span>
      </button>
      <div
        role="radiogroup"
        aria-label="Accent color"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
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
              onClick={() => pickAccent(id)}
              style={swatch(active, color)}
            />
          );
        })}
      </div>
    </div>
  );
}
