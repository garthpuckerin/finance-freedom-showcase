// Appearance persistence — theme (light|dark) + accent (5 options).
// Applies via data-* attributes on <html>; index.css consumes
// [data-theme]/[data-accent]/[data-temp]/etc. The fixed system
// characteristics (temp/density/type) are pinned on boot.

const KEY = 'ff:appearance:v1';

export const THEMES = ['light', 'dark'];

// [id, label, swatch] — mirrors the ACCENTS list from the source App.jsx.
export const ACCENTS = [
  ['evergreen', 'Evergreen', 'oklch(0.47 0.094 159)'],
  ['ink', 'Ink Blue', 'oklch(0.47 0.15 262)'],
  ['teal', 'Teal', 'oklch(0.49 0.09 198)'],
  ['amber', 'Amber', 'oklch(0.62 0.13 64)'],
  ['violet', 'Violet', 'oklch(0.5 0.17 292)'],
];

const ACCENT_IDS = ACCENTS.map(([id]) => id);

// Pinned (non-user-editable) system characteristics.
const FIXED = { temp: 'slate', density: 'cozy', type: 'grotesk' };

const DEFAULTS = { theme: 'light', accent: 'evergreen' };

const isValidTheme = (t) => THEMES.includes(t);
const isValidAccent = (a) => ACCENT_IDS.includes(a);

function normalize(partial) {
  return {
    theme: isValidTheme(partial?.theme) ? partial.theme : DEFAULTS.theme,
    accent: isValidAccent(partial?.accent) ? partial.accent : DEFAULTS.accent,
  };
}

function readStored() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return normalize(JSON.parse(raw));
  } catch {
    // storage unavailable / malformed (private mode); fall back to defaults
    return { ...DEFAULTS };
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode); appearance still applies for the session */
  }
}

function applyToRoot(value) {
  const r = document.documentElement;
  r.setAttribute('data-theme', value.theme);
  r.setAttribute('data-accent', value.accent);
  // pin the fixed tokens every time so index.html defaults can't drift
  r.setAttribute('data-temp', FIXED.temp);
  r.setAttribute('data-density', FIXED.density);
  r.setAttribute('data-type', FIXED.type);
}

/** Current appearance (theme + accent), read from storage with safe fallbacks. */
export function getAppearance() {
  return readStored();
}

// Custom event so any mounted control (topbar switcher + Settings card)
// stays in sync when appearance changes from elsewhere.
export const APPEARANCE_EVENT = 'ff:appearance-change';

/** Merge a partial appearance, persist, and apply to <html>. Returns the merged value. */
export function setAppearance(partial) {
  const next = normalize({ ...readStored(), ...(partial || {}) });
  applyToRoot(next);
  writeStored(next);
  try {
    window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: next }));
  } catch {
    /* no window (SSR) or CustomEvent unsupported — applying + persisting still happened */
  }
  return next;
}

/** Apply stored appearance on boot (call before render to avoid a flash). Returns it. */
export function applyStoredAppearance() {
  const value = readStored();
  applyToRoot(value);
  return value;
}
