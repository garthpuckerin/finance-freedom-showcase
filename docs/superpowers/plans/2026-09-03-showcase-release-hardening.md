# Finance Freedom Showcase Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Finance Freedom's existing showcase behavior reproducibly release-ready with financial-coherence, accessibility, metadata, and CI gates.

**Architecture:** Keep `src/derive.js` and `src/data.js` as the existing pure derivation boundary. Add characterization tests around their exported data, repair Playwright's standalone server and session-gate setup, then bind build/unit/browser checks into one release command shared by local development and CI.

**Tech Stack:** React 18, Vite 5, Node test runner, Playwright, axe-core, GitHub Actions

---

### Task 1: Repair the browser-test launcher and demo gate

**Files:**
- Modify: `playwright.config.js`
- Modify: `e2e/smoke.spec.js`

- [ ] Re-run `npm run test:e2e` and retain the existing launcher failure as RED evidence.
- [ ] Replace the stale workspace-filter command with the repository-local `npm run dev -- --host 127.0.0.1` command.
- [ ] Run the suite and retain the desktop/mobile session-gate failures as RED evidence.
- [ ] Change the test helper from `localStorage` to the application's canonical `sessionStorage` key.
- [ ] Run `npm run test:e2e`; expect all three existing tests to pass.
- [ ] Commit the isolated fix.

### Task 2: Add financial-coherence characterization tests

**Files:**
- Create: `tests/data-coherence.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Add Node tests proving account balances sum to net worth, spending-category totals reconcile with the period spending KPI, the latest monthly-trend point reconciles with period income/spending, investment holdings reconcile by account within rounding tolerance, and the net-worth history endpoint reconciles with the headline.
- [ ] Add `test:unit` using `node --test tests/*.test.mjs`.
- [ ] Run `npm run test:unit`; expect all new characterization tests to pass against the existing derivation layer.
- [ ] Commit the tests and script.

### Task 3: Add accessibility coverage

**Files:**
- Create: `e2e/accessibility.spec.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify only if axe finds a real defect: the smallest affected UI source/style file

- [ ] Install `@axe-core/playwright` as a locked dev dependency.
- [ ] Add axe WCAG A/AA checks for the landing, desktop shell, and mobile companion.
- [ ] Run the accessibility test; if it finds a violation, fix only that verified defect and rerun until green.
- [ ] Commit metadata/accessibility coverage and any minimal verified fix.

### Task 4: Add one release command and CI enforcement

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/release-contract.test.mjs`
- Create: `.github/workflows/release.yml`

- [ ] Add a release-contract test requiring the canonical Finance Freedom title, description, intentional `noindex`, absolute Open Graph image, declared image dimensions, Twitter large-card metadata, and `test:unit`/`test:release` scripts.
- [ ] Run `node --test tests/release-contract.test.mjs`; confirm RED because `test:release` is missing.
- [ ] Add `test:release` to run build, unit, and E2E checks in order.
- [ ] Rerun `node --test tests/release-contract.test.mjs`; expect green before committing.
- [ ] Add a GitHub Actions workflow using `npm ci`, Chromium installation, and `npm run test:release`.
- [ ] Run `npm run test:release`; expect build success and every unit/browser test passing.
- [ ] Verify `git status --short` contains only intended source, test, config, lockfile, and documentation changes.
- [ ] Commit the release gate.
