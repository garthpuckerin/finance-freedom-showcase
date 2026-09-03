// Finance Freedom smoke test — proof-of-life (fixtures-only, zero network).
//
// Asserts:
//   1. The desktop app shell renders with the "Finance Freedom" sidebar brand mark.
//   2. A stable sidebar nav item ("Dashboard") is visible — confirms the shell
//      fully mounted (not a blank page or error fallback).
//   3. The mobile companion view (?view=mobile) renders its iOS-framed showcase.
//   4. ZERO browser console errors, ZERO page errors, ZERO failed network
//      requests on BOTH views.
//
// Any failed request or console error is a genuine defect (residual backend
// coupling) — the assertions are intentionally strict and must not be weakened.
//
// Selector rationale: this app styles entirely with inline styles (no class
// names on the brand/nav), so text/role locators are the durable choice.
// "Finance Freedom" is the unique brand string in <Sidebar>, which is
// unconditionally mounted in <App> with no auth gate or async dependency.

import { test, expect } from '@playwright/test'

// Demo-gate helper — the app now shows a marketing landing on first visit. Seed
// the persisted "entered" flag BEFORE the page script runs (addInitScript) so
// the app shell (desktop or ?view=mobile) mounts directly, bypassing the gate.
// This is the cleanest way to keep the strict shell assertions intact.
const ENTERED_KEY = 'ff:entered:v1'
async function enterDemo(page) {
  await page.addInitScript((key) => {
    try { window.sessionStorage.setItem(key, 'true') } catch (e) {}
  }, ENTERED_KEY)
}

// Shared error-capture wiring — registers listeners BEFORE navigation and
// returns the three collectors for strict 0/0/0 assertions.
function trackErrors(page) {
  const consoleErrors = []
  const pageErrors = []
  const failedRequests = []

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  page.on('pageerror', err => {
    pageErrors.push(err.message)
  })

  page.on('requestfailed', request => {
    // Ignore browser-internal about: or chrome-extension: requests
    const url = request.url()
    if (!url.startsWith('about:') && !url.startsWith('chrome-extension:')) {
      failedRequests.push(`${request.method()} ${url} — ${request.failure()?.errorText}`)
    }
  })

  return { consoleErrors, pageErrors, failedRequests }
}

function assertZero({ consoleErrors, pageErrors, failedRequests }) {
  expect(
    consoleErrors,
    `Console errors detected (${consoleErrors.length}): ${consoleErrors.join('; ')}`
  ).toHaveLength(0)

  expect(
    pageErrors,
    `Page errors detected (${pageErrors.length}): ${pageErrors.join('; ')}`
  ).toHaveLength(0)

  expect(
    failedRequests,
    `Failed network requests detected (${failedRequests.length}): ${failedRequests.join('; ')}`
  ).toHaveLength(0)
}

test('landing: marketing hero renders with zero console/page/network errors', async ({ page }) => {
  const errors = trackErrors(page)

  // Fresh visit (no seeded flag) → the marketing landing gate is shown.
  await page.goto('/')

  // The "Launch demo" CTA is the unique, stable landing affordance.
  await expect(
    page.getByRole('button', { name: 'Launch demo' }),
    'Landing "Launch demo" CTA should be visible on a fresh visit'
  ).toBeVisible()

  // Clicking it enters the desktop app shell (sidebar brand mark appears).
  await page.getByRole('button', { name: 'Launch demo' }).click()
  await expect(
    page.getByText('Finance Freedom', { exact: true }),
    'Launching the demo should mount the app shell'
  ).toBeVisible()

  assertZero(errors)
})

test('desktop: fixtures-only render with zero console/page/network errors', async ({ page }) => {
  const errors = trackErrors(page)

  await enterDemo(page)
  await page.goto('/')

  // 1. Brand mark — "Finance Freedom" renders inside <Sidebar>, which is
  //    unconditionally mounted in <App>. Unique, stable fixture string.
  await expect(
    page.getByText('Finance Freedom', { exact: true }),
    'Sidebar brand mark "Finance Freedom" should be visible'
  ).toBeVisible()

  // 2. A stable nav item — confirms the shell fully rendered, correct variant.
  await expect(
    page.getByRole('button', { name: 'Dashboard' }),
    'Sidebar "Dashboard" nav item should be visible'
  ).toBeVisible()

  // 3. Strict error assertions — any entry here is a real defect.
  assertZero(errors)
})

test('mobile: iOS-framed companion renders with zero console/page/network errors', async ({ page }) => {
  const errors = trackErrors(page)

  await enterDemo(page)
  await page.goto('/?view=mobile')

  // The mobile companion showcase renders a stable headline + the iOS frame.
  await expect(
    page.getByRole('heading', { name: 'The same system, at phone scale' }),
    'Mobile companion headline should be visible'
  ).toBeVisible()

  // The iOS status-bar time "9:41" is rendered inside the device bezel —
  // proof the iOS frame mounted.
  await expect(
    page.getByText('9:41').first(),
    'iOS device frame status-bar time should be visible'
  ).toBeVisible()

  assertZero(errors)
})
