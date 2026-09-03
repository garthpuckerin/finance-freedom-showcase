# Finance Freedom Showcase Release Hardening Design

## Objective

Make the existing Finance Freedom showcase verifiably release-ready without changing its visible product design, copy, feature behavior, or public identity.

## Scope

- Repair the Playwright web-server command so `npm run test:e2e` starts the standalone repository correctly.
- Repair the demo-gate test helper so it seeds the same session storage used by the application.
- Add deterministic unit coverage for the canonical financial register and its derived totals.
- Add a single release command that runs the production build, unit tests, and browser tests.
- Add CI enforcement for the release command.
- Add automated accessibility checks to the existing landing, desktop, and mobile browser coverage.
- Add metadata assertions for title, description, robots posture, and social-card configuration.

## Non-goals

- No UI redesign, copy rewrite, data-fixture rewrite, or product rename.
- No change to the intentional `noindex` posture.
- No screenshot-baseline suite; it would add brittle review overhead without addressing the current failures.
- No dependency major-version upgrades as part of this change.

## Design

Financial derivations already live behind the pure `src/derive.js` and `src/data.js` boundary. Node's built-in test runner will characterize that existing boundary and verify its accounting invariants without introducing a second unit-test framework or changing product behavior.

Playwright remains the behavioral gate. Its server command will use this repository's own `npm run dev` script, and the gate helper will use session storage because that is the application's source of truth. Accessibility and metadata assertions will run against the same three user-visible surfaces already covered by smoke tests.

The `test:release` command will be the single local and CI contract: build, unit tests, then browser tests. GitHub Actions will install from the lockfile, install Chromium, and run that command.

## Acceptance criteria

- The original launcher failure is reproduced before the configuration fix.
- The desktop and mobile gate failures are reproduced before the storage fix.
- Financial characterization tests pass against the existing pure derivation boundary and cover the advertised reconciliation invariants.
- All prior and new tests pass after implementation.
- The production build succeeds.
- The working tree contains no generated test or build artifacts.
