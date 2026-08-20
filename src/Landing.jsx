/* Finance Freedom — marketing hero landing (shown before the app, not a sign-in gate).
   Built in the "Ledger" design idiom: oklch design tokens, the accent-filled
   brand mark, display/UI/mono typefaces, hairline rules, and money-card surfaces.
   "Launch demo" enters the app; the page themes via [data-theme]/[data-accent]
   on <html> exactly like the rest of the app, and reuses the ThemeSwitcher so a
   visitor can pick light/dark + accent before entering. */
import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';

// Feature highlights — drawn from what the app actually shows (the case-study
// body in apps/web/content/systems/finance-freedom.mdx), sanitized and
// vendor-agnostic. Each maps to a glyph mirroring the in-app nav iconography.
const FEATURES = [
  {
    glyph: '≡',
    title: 'Multi-account ledger',
    body: 'Cash, credit, investment, retirement, and asset accounts grouped by type — with a double-entry register you can edit inline.',
  },
  {
    glyph: '⊜',
    title: 'Register rules + auto-categorize',
    body: 'A transaction register backed by auto-categorization rules matched against payees, so activity files itself as it lands.',
  },
  {
    glyph: '◫',
    title: 'Budgets & cash-flow forecast',
    body: 'Envelope-style budgets with over-budget flags, plus a 60-day cash-flow forecast that warns on the low points ahead.',
  },
  {
    glyph: '◈',
    title: 'Assets & net worth',
    body: 'Holdings with cost basis and gain/loss roll up against debts into a single net-worth view of where you actually stand.',
  },
  {
    glyph: '⌘',
    title: '⌘K command palette',
    body: 'Jump to any screen, account, or action from the keyboard — the cockpit shortcut for moving fast across the whole workspace.',
  },
  {
    glyph: '☾',
    title: 'Themeable design system',
    body: 'A token-driven "Ledger" system — light and dark modes plus accent colors, persisted to local storage and applied everywhere.',
  },
];

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--r-card)',
  boxShadow: 'var(--shadow-sm)',
};

const eyebrow = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--accent)',
  fontFamily: 'var(--font-ui)',
};

export function Landing({ onEnter }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--canvas)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-ui)',
        boxSizing: 'border-box',
      }}
    >
      {/* Top bar — brand mark + mock-data note + theme/accent picker */}
      <header
        style={{
          flexShrink: 0,
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 16,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              flexShrink: 0,
            }}
          >
            F
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: 'var(--display-tracking)',
              color: 'var(--text)',
            }}
          >
            Finance Freedom
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-faint)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Mock data · not real accounts
          </span>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Hero + feature grid */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1120,
          margin: '0 auto',
          padding: '56px 24px 48px',
          boxSizing: 'border-box',
        }}
      >
        <section style={{ maxWidth: 720 }}>
          <p style={eyebrow}>Portfolio demo · mock data</p>
          <h1
            style={{
              margin: '18px 0 0',
              fontSize: 'clamp(34px, 5.2vw, 56px)',
              lineHeight: 1.05,
              fontWeight: 'var(--display-weight)',
              fontFamily: 'var(--font-display)',
              letterSpacing: 'var(--display-tracking)',
              color: 'var(--text)',
            }}
          >
            The everyday cockpit for your whole financial life.
          </h1>
          <p
            style={{
              margin: '20px 0 0',
              maxWidth: 600,
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--text-2)',
            }}
          >
            A personal-finance command center that pulls accounts, transactions,
            budgets, payees, rules, and assets into one data-dense workspace — so the
            question “where do I actually stand?” has a single answer. Built
            local-first for people who track money by hand: every register is
            fully manual — no bank links, no cloud, no subscription, no AI required.
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-3)' }}>
            Desktop-first build — on a phone you&rsquo;ll get the mobile companion:
            the same system, focused for the essentials on the go.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              flexWrap: 'wrap',
              marginTop: 30,
            }}
          >
            <button
              type="button"
              onClick={onEnter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                height: 44,
                padding: '0 22px',
                borderRadius: 'var(--r-ctrl)',
                border: 0,
                cursor: 'pointer',
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Launch demo
              <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>
                →
              </span>
            </button>
            <span
              className="num"
              style={{
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              Cockpit, not the engine.
            </span>
          </div>
        </section>

        <section
          aria-label="Product highlights"
          style={{
            marginTop: 52,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--gap)',
          }}
        >
          {FEATURES.map((f) => (
            <article
              key={f.title}
              style={{
                ...card,
                padding: 'var(--pad)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'var(--accent-weak)',
                  color: 'var(--accent)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {f.glyph}
              </span>
              <h2
                style={{
                  margin: '6px 0 0',
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {f.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: 'var(--text-2)',
                }}
              >
                {f.body}
              </p>
            </article>
          ))}
        </section>
      </main>

      {/* Footer — sanitized provenance note, no external links */}
      <footer
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--line)',
          background: 'var(--surface)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          fontSize: 11.5,
          color: 'var(--text-faint)',
        }}
      >
        <span>Finance Freedom — “Ledger” design demo</span>
        <span>Mock data only · not real accounts</span>
      </footer>
    </div>
  );
}

export default Landing;
