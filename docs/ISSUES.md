# Issues — finance-freedom-showcase

> Routing rule (Work Item Routing Standard): this file is the home for anything
> **broken, wrong, missing, or knowingly deferred**. Ideas go to
> `FEATURES-BACKLOG.md`, sequenced commitments to `ROADMAP.md`, decisions with
> rationale to `DECISIONS.md`. Every entry carries evidence (or says it is
> undiagnosed) and says whether it is user-visible.

## Open

Filed 2026-10-20 from the mobile companion benchmark
(`portofolio-hub/docs/MOBILE_COMPANION_BENCHMARK.md`, measured 2026-09-21; raw
probes in the untracked `media/benchmark/`), with the source-level claims
re-checked against `main` @ `8d5529f` on 2026-10-20. Not re-measured against
the live deployment. Fix order in the benchmark: last of the five released.

### ISSUE-001 · Tablets get the desktop cockpit automatically, with every target too small
- **Severity:** medium · **Status:** open · **Visible:** yes, any 768–1023px screen
- **Evidence:** `src/main.jsx:20-21` sends only `max-width: 767px` to the phone app; `:61-70` then pins the viewport to `width=1180` for everything else under 1024. Benchmark: 41 of 41 targets under 44px on a portrait iPad, and the desktop onboarding modal renders in tiny text. Re-checked in source 2026-10-20.
- **Next action:** design a tablet tier (companion, two columns) and make the scaled desktop an explicit choice with a visible way back, not the automatic tablet default.

### ISSUE-002 · Three dead "buttons" on the phone Home
- **Severity:** low · **Status:** open · **Visible:** yes
- **Evidence:** `src/Mobile.jsx:63` renders Send / Request / Pay bill as plain `<div>`s with no handler or role. Re-checked 2026-10-20.
- **Next action:** wire them to real screens or remove them (template item 10, no dead affordances).

### ISSUE-003 · The signature workflow (add a transaction) is unreachable on the phone
- **Severity:** medium · **Status:** open · **Visible:** yes
- **Evidence:** `src/Mobile.jsx` only lists and searches transactions (`:52`, `:171-181`); no add path exists in the file. Re-checked 2026-10-20.
- **Next action:** a one-step-per-screen add flow, or a designed desk-only state that says why (template items 9 and 11).

### ISSUE-004 · Phone/desktop choice is read once at load, so rotation does nothing
- **Severity:** low-medium · **Status:** open · **Visible:** yes, on any phone that rotates past 767px
- **Evidence:** `isSmallScreen` is a module-level `const` from `matchMedia('(max-width: 767px)')` (`src/main.jsx:20-21`), never subscribed. Phone routes are `useState`, so no screen is URL-addressable.
- **Next action:** one reactive breakpoint shared by JS and CSS; `?view=` routes for each phone screen.

### ISSUE-005 · Phone landscape spends a third of the height on bars; no phone first-run
- **Severity:** low · **Status:** open · **Visible:** yes
- **Evidence:** benchmark: 67% of the height left for content in phone landscape; no phone orientation exists (tablets get the desktop modal).
- **Next action:** side-rail tabs on short landscape screens; a phone-sized orientation (reference: Grant Tracker `Onboarding.jsx`).

### ISSUE-006 · Release gates cannot catch any of the above
- **Severity:** medium · **Status:** open (latent) · **Visible:** no
- **Evidence:** `package.json` `test:release` is build + `tests/*.test.mjs` + Playwright (`e2e/smoke`, `e2e/accessibility`); there is no `mobile-sweep` or `viewport-sweep`, no touch-floor, table, scroll or tablet check, and no `--self-test` proving the gate can fail. Per the benchmark a squeezed desktop would pass.
- **Next action:** port `mobile-sweep` and `viewport-sweep` (with `--self-test`) from `janus-showcase/scripts/` first and record the failing baseline before fixing 001-005.

## Closed
