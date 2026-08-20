/* Finance Freedom — first-run onboarding wizard
 *
 * Shown once after entering the demo (flag ff_onboarded_v1; sign-out clears it
 * so replaying the demo replays the journey). Three steps: welcome → pick your
 * budgeting style (the product's signature choice) → you're set. The style
 * choice applies immediately via the shared BudgetStyles store, so Dashboard,
 * Budgets, and Insights conform the moment the wizard closes.
 */
import React from 'react';
import { Modal } from './Overlays.jsx';
import { BUDGET_STYLES, useBudgetStyle } from './BudgetStyles.jsx';

const { useState: useObS } = React;

const nextBtn = { fontSize: 12.5, fontWeight: 600, color: 'var(--on-accent)', background: 'var(--accent)', border: 0, borderRadius: 'var(--r-ctrl)', padding: '8px 18px', cursor: 'pointer', fontFamily: 'var(--font-ui)' };
const backBtn = { fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-ctrl)', padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--font-ui)' };

function Dots({ step, count }) {
  return (
    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 99, background: i === step ? 'var(--accent)' : 'var(--line-strong)', transition: 'width .15s' }} />
      ))}
    </div>
  );
}

function WelcomeStep() {
  const points = [
    ['⊞', 'Your money, in one file', 'Local-first: your data lives in a file you own. Cloud sync is there if you want it — optional, end-to-end encrypted, never required.'],
    ['◫', 'A full desktop cockpit', 'Fifteen screens — registers, cash-flow forecast, budgets, reports, goals, rules — the depth Microsoft Money users remember.'],
    ['◎', 'Budget your way', 'Classic envelopes, 50/30/20, zero-based, FIRE, or pay-yourself-first. Next step: pick yours.'],
  ];
  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
        The soul of Microsoft Money, rebuilt for 2026. This demo runs on mock data — poke anything.
      </p>
      {points.map(([g, t, b]) => (
        <div key={t} style={{ display: 'flex', gap: 13, alignItems: 'flex-start', padding: '11px 0', borderTop: '1px solid var(--line)' }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent-weak)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{g}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.5 }}>{b}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StyleStep({ value, onPick }) {
  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
        Finance Freedom reframes your Dashboard, Budgets, and Insights around the method you actually use. You can switch anytime.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BUDGET_STYLES.map(s => {
          const on = value === s.id;
          return (
            <button key={s.id} onClick={() => onPick(s.id)} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer', padding: '11px 13px',
              borderRadius: 'var(--r-ctrl)', fontFamily: 'var(--font-ui)',
              background: on ? 'var(--accent-weak)' : 'var(--surface-2)',
              border: on ? '1px solid var(--accent-line)' : '1px solid var(--line-2)',
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: '50%', marginTop: 1, flexShrink: 0, display: 'grid', placeItems: 'center',
                border: on ? '5px solid var(--accent)' : '1px solid var(--line-strong)', background: 'var(--surface)',
              }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: on ? 'var(--accent)' : 'var(--text)' }}>{s.label}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-faint)' }}>{s.tag.toUpperCase()}</span>
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>{s.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DoneStep({ styleId }) {
  const s = BUDGET_STYLES.find(x => x.id === styleId) || BUDGET_STYLES[0];
  return (
    <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--pos-weak)', color: 'var(--pos)', display: 'grid', placeItems: 'center', fontSize: 24, margin: '0 auto 14px' }}>✓</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>You're budgeting with {s.label}</div>
      <p style={{ margin: '0 auto', maxWidth: 380, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
        {s.blurb} Your Dashboard, Budgets, and Insights now speak {s.label}. Change it anytime — Settings → Preferences, or right on the Budgets screen.
      </p>
    </div>
  );
}

export function OnboardingWizard({ open, onDone }) {
  const [step, setStep] = useObS(0);
  const [style, setStyle] = useBudgetStyle();
  const TITLES = [
    ['Welcome to Finance Freedom', 'Two minutes, three choices, no account needed'],
    ['How do you like to budget?', 'Pick the method — the app conforms to it'],
    ['You’re set', 'The demo is yours'],
  ];
  const [title, sub] = TITLES[step];
  const last = step === TITLES.length - 1;
  return (
    <Modal open={open} onClose={onDone} title={title} sub={sub} width={560}
      footer={
        <>
          <Dots step={step} count={TITLES.length} />
          {step > 0 && <button style={backBtn} onClick={() => setStep(s => s - 1)}>Back</button>}
          <button style={nextBtn} onClick={() => last ? onDone() : setStep(s => s + 1)}>
            {last ? 'Open the dashboard' : step === 0 ? 'Get started' : 'Continue'}
          </button>
        </>
      }>
      {step === 0 && <WelcomeStep />}
      {step === 1 && <StyleStep value={style} onPick={setStyle} />}
      {step === 2 && <DoneStep styleId={style} />}
    </Modal>
  );
}
