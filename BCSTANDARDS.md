# BCSTANDARDS — finance-freedom-showcase

> AI agents: read this before writing code. This is the AI Context Contract for
> this repo. It is written to be safe if this repo is public — keep it that way:
> no other project's embargoed names, no secrets, no engine internals, no private
> absolute paths.

## What this repo is

- A **curated public showcase** of the Finance Freedom ("Ledger") **cockpit** —
  the frontend command-center, not the engine. Mock fixtures only; no backend, no
  network, no secrets. See `README.md` (§"What's real vs. illustrative") for the
  exact cockpit-vs-engine boundary; the production engine (bank/brokerage
  aggregation, transaction sync, the financial engine, persistence) is a separate
  **private** codebase and must never be described or referenced here beyond that
  honest boundary table.
- This repo is the **canonical dev home** for the Finance Freedom cockpit
  frontend. Make frontend edits **here** and push `main` (auto-deploys).
- **Drift-vector warning:** the monorepo copy at
  `portofolio-hub/apps/finance-freedom` still has a `.vercel` link to the **same**
  Vercel project. Do **not** run `vercel deploy --prod` from that copy — it would
  overwrite the git-integrated deploy. It is redundant but not yet retired
  (retirement deferred until demo↔prod reconciliation is verified).

## Governance

- Authority: **Blurred Concepts Engineering Constitution v2.0** —
  `github.com/garthpuckerin/blurred-concepts-engineering`.
- Precedence (Constitution §1): direct owner instruction → this `BCSTANDARDS.md`
  → Constitution → topic standards → supporting docs.

## Code Comprehension (Comprehension Ladder Standard)
<!-- bcstd:managed comprehension v1 -->
- Graph repo_id: `github.com/garthpuckerin/finance-freedom-showcase`
- This repo is **new and not yet ingested** into the code-graph. Until it is,
  raw `Read`/`Grep` are the correct tools here; once ingested, query the ladder
  (`map` / `find` / `explain` / `neighbors` / `read`) with the repo_id above
  before raw reads for structure/behaviour/relationship questions. Note: this is
  a React app — the graph does not model JSX render edges, so grep for "what
  renders X" regardless.
<!-- /bcstd:managed -->

## Git & Release

- **Branch model (alternate, documented per the Git & Release Standard):** this
  repo does not use short-lived `feat/*`/`fix/*` branches. It is solo-maintained
  (owner + AI pair); commits land directly on **`main`**, the Vercel production
  branch. The project **is git-integrated** — push to `main` auto-deploys the
  live demo (verified serving 200 with `noindex` intact).
- **Verify before pushing:** `npm run build` (clean) and `npm run test:e2e`
  (fixtures-only smoke, zero console/page/network errors) must pass. The e2e
  error assertions are strict by design — a failed request or console error is a
  real defect, never weaken them.
- Tags: not adopted here; don't tag unilaterally.

## Publish / spoiler discipline (reveal-season)

- Finance Freedom was **revealed on the site 2026-08-20**; the name is public.
  The **showcase repo's flip to public** remains an **open owner decision** (the
  repo is still private) — owner-only action when decided:
  `gh repo edit garthpuckerin/finance-freedom-showcase --visibility public
  --accept-visibility-change-consequences`.
- **noindex is kept**: the deployed demo carries
  `<meta name="robots" content="noindex">`; SEO/GEO lives on the hub
  (`garthpuckerin.com`), which links to this demo. Do not remove the noindex tag.
- **Sanitized-only.** Never add engine internals, secrets, real PII, or any other
  reveal-season project's still-embargoed name/content. Vercel serves only
  `dist/`, so repo-root docs are not served by the live site — but treat every
  committed file as public.

## Institutional Memory
<!-- bcstd:managed memory v1 -->
- The comprehension and memory habits are active client bindings, not passive
  repository guidance. Each client must use the highest enforcement tier it
  supports under the Comprehension Ladder Standard.
- Recall Ogham with `hybrid_search` when starting work on a system that may
  have prior context. Before ending, store decisions with rationale, gotchas,
  and cross-session operational context with source, controlled tags, and a
  deliberate TTL. Never store secrets or code-structure facts.
- Canonical memory policy: `standards/Memory_Standard.md` in
  blurred-concepts-engineering — it governs on any conflict.
<!-- /bcstd:managed -->
