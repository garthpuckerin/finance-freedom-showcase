// Capture identity-clean preview media (screenshots + a paced walkthrough video)
// from Finance Freedom (personal-finance management demo). The script starts its
// own Vite dev server on :3400 (unless PREVIEW_URL points at a running one),
// captures media, and always tears the server down on exit.
//
//   pnpm --filter finance-freedom exec node scripts/capture-preview.mjs
//   PREVIEW_URL=http://localhost:3400 pnpm --filter finance-freedom exec node scripts/capture-preview.mjs
//
// Output → apps/web/public/media/finance-freedom/:
//   7 light desktop screens (dashboard is the MDX cover), a paced walkthrough.webm,
//   and three showcase shots in fresh, isolated contexts so theme/viewport
//   overrides never leak: -dark.png (Dashboard, dark theme, render-confirmed),
//   -mobile.png (the iOS-framed mobile companion), -design-system.png.
//
// Fail-fast discipline: every step has an explicit timeout; the dev server is
// polled (~20s) before capture; a whole-run hard cap (~150s) aborts a stuck run;
// any failure exits non-zero naming the failed step/selector; a self-started dev
// server is killed on every exit path. No infinite waits.
import { chromium } from '@playwright/test'
import { mkdir, copyFile, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(here, '..')
const repoRoot = path.resolve(here, '..', '..', '..')
const mediaDir = path.resolve(repoRoot, 'apps', 'web', 'public', 'media', 'finance-freedom')
const videoDir = path.resolve(mediaDir, 'video-raw')
const baseURL = process.env.PREVIEW_URL || 'http://localhost:3400'
const useExternalServer = !!process.env.PREVIEW_URL

const VIEWPORT = { width: 1440, height: 1000 }
const APPEARANCE_KEY = 'ff:appearance:v1'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Poll the dev server until it serves; fail fast if it never comes up.
async function waitForServer(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  let lastErr
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return
      lastErr = new Error(`status ${res.status}`)
    } catch (e) {
      lastErr = e
    }
    await wait(500)
  }
  throw new Error(`dev server not reachable at ${url} within ${timeoutMs}ms: ${lastErr?.message}`)
}

// Start a Vite dev server on :3400 unless PREVIEW_URL was supplied. Returns the
// child (or null) so the caller can guarantee teardown on every exit path.
function startDevServer() {
  if (useExternalServer) return null
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const child = spawn(npx, ['vite', '--port', '3400', '--strictPort'], {
    cwd: appRoot,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  child.on('error', (e) => {
    console.error(`FATAL: failed to spawn dev server: ${e.message}`)
    process.exit(1)
  })
  return child
}

function killDevServer(child) {
  if (!child || child.killed) return
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      child.kill('SIGTERM')
    }
  } catch {
    /* best-effort teardown */
  }
}

// Hard cap on the whole run so a stuck step can never hang forever.
let devServer = null
function hardCap(ms) {
  const t = setTimeout(() => {
    console.error(`FATAL: capture exceeded hard cap of ${ms}ms — aborting`)
    killDevServer(devServer)
    process.exit(1)
  }, ms)
  t.unref?.()
  return t
}

async function main() {
  hardCap(150000)
  devServer = startDevServer()
  await waitForServer(baseURL)

  await mkdir(mediaDir, { recursive: true })
  await mkdir(videoDir, { recursive: true })

  const browser = await chromium.launch()

  // ── Walkthrough + 7 light desktop screens (single recorded context) ────────
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    recordVideo: { dir: videoDir, size: VIEWPORT },
  })
  context.setDefaultTimeout(10000) // hard cap: no step can hang the recording

  // Force light theme + a clean starting route before the app boots.
  await context.addInitScript(([key]) => {
    window.localStorage.setItem(key, JSON.stringify({ theme: 'light', accent: 'evergreen' }))
    window.localStorage.removeItem('ff_screen')
    window.localStorage.removeItem('ff_acct')
  }, [APPEARANCE_KEY])

  const page = await context.newPage()

  const shot = async (name) => {
    await page.screenshot({ path: path.join(mediaDir, name), fullPage: false })
    console.log('  captured', name)
  }

  // Navigate via a sidebar nav item by its visible label. Buttons render a glyph
  // span + label span, so the full textContent is "<glyph><label>" — match the
  // label as a substring, scoped to <nav> so the brand never collides.
  const nav = async (label) => {
    const item = page.locator('nav button').filter({ hasText: label }).first()
    try {
      await item.click({ timeout: 10000 })
    } catch (e) {
      throw new Error(`sidebar nav "${label}" did not resolve/click within timeout: ${e.message}`)
    }
  }

  // Optional flourish: never throws, short timeout so it can't freeze the video.
  const optional = async (labelTxt, fn) => {
    try { await fn() } catch (e) { console.log(`  ~ optional "${labelTxt}" skipped: ${e.message}`) }
  }

  // ── 1. Dashboard (cover) ──────────────────────────────────────────────────
  await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 15000 })
  // Confirm we are really mounted on the dashboard before shooting the cover.
  await page.locator('aside').getByText('Finance Freedom').first().waitFor({ timeout: 10000 })
  await page.locator('nav button').filter({ hasText: 'Dashboard' }).first().waitFor({ timeout: 10000 })
  await wait(1500)
  await shot('finance-freedom-dashboard.png')
  await optional('scroll dashboard', async () => { await page.mouse.wheel(0, 500); await wait(800); await page.mouse.wheel(0, -500) })
  await wait(700)

  // ── 2. Accounts ───────────────────────────────────────────────────────────
  await nav('Accounts')
  await wait(1300)
  await shot('finance-freedom-accounts.png')
  await wait(700)

  // ── 3. Budgets ────────────────────────────────────────────────────────────
  await nav('Budgets')
  await wait(1300)
  await shot('finance-freedom-budgets.png')
  await wait(700)

  // ── 4. Investments ────────────────────────────────────────────────────────
  await nav('Investments')
  await wait(1300)
  await shot('finance-freedom-investments.png')
  await wait(700)

  // ── 5. Net Worth ──────────────────────────────────────────────────────────
  await nav('Net Worth')
  await wait(1300)
  await shot('finance-freedom-networth.png')
  await wait(700)

  // ── 6. Insights ───────────────────────────────────────────────────────────
  await nav('Insights')
  await wait(1300)
  await shot('finance-freedom-insights.png')
  await optional('scroll insights', async () => { await page.mouse.wheel(0, 500); await wait(900); await page.mouse.wheel(0, -500) })
  await wait(700)

  // ── 7. Assistant ──────────────────────────────────────────────────────────
  await nav('Assistant')
  await wait(1300)
  await shot('finance-freedom-assistant.png')
  await wait(700)

  // ── Wrap up the walkthrough — close context to finalise video ─────────────
  const video = page.video()
  await context.close()
  if (video) {
    await copyFile(await video.path(), path.join(mediaDir, 'finance-freedom-walkthrough.webm'))
    console.log('  captured finance-freedom-walkthrough.webm')
  }
  await rm(videoDir, { recursive: true, force: true })

  // ── Showcase shots (no video) in fresh, isolated contexts ─────────────────

  // a. Dark-theme Dashboard. Seed appearance BEFORE boot so applyStoredAppearance
  //    paints dark on first frame (no flash, no toggle race).
  {
    const darkCtx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
    darkCtx.setDefaultTimeout(10000)
    await darkCtx.addInitScript(([key]) => {
      window.localStorage.setItem(key, JSON.stringify({ theme: 'dark', accent: 'evergreen' }))
      window.localStorage.removeItem('ff_screen')
      window.localStorage.removeItem('ff_acct')
    }, [APPEARANCE_KEY])
    const darkPage = await darkCtx.newPage()
    await darkPage.goto(baseURL, { waitUntil: 'networkidle', timeout: 15000 })
    await darkPage.locator('aside').getByText('Finance Freedom').first().waitFor({ timeout: 10000 })
    // Kill transitions/animations so the dark background can't lag behind a
    // light/intermediate frame at screenshot time.
    await darkPage.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
    })
    // Confirm dark is *actually rendered* — not just the attribute. Require both
    // data-theme=dark AND a genuinely dark computed body background (parse
    // lightness for oklch/oklab, luma for rgb). Fail loudly on timeout so we
    // never ship a light frame mislabelled as "dark".
    await darkPage.waitForFunction(
      () => {
        const html = document.documentElement
        if (html.getAttribute('data-theme') !== 'dark') return false
        const bg = getComputedStyle(document.body).backgroundColor
        const m = bg.match(/[\d.]+/g)
        if (!m) return false
        if (bg.startsWith('oklch') || bg.startsWith('oklab')) return parseFloat(m[0]) < 0.4
        const [r, g, b] = m.map(Number)
        return 0.299 * r + 0.587 * g + 0.114 * b < 110
      },
      { timeout: 10000 },
    )
    await wait(1200)
    await darkPage.screenshot({ path: path.join(mediaDir, 'finance-freedom-dark.png'), fullPage: false })
    console.log('  captured finance-freedom-dark.png (dark background render confirmed)')
    await darkCtx.close()
  }

  // b. Mobile companion — the iOS-framed showcase at ?view=mobile. Light theme,
  //    desktop viewport so both device frames are visible. Wait for the
  //    showcase heading, settle, shoot.
  {
    const mobileCtx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
    mobileCtx.setDefaultTimeout(10000)
    await mobileCtx.addInitScript(([key]) => {
      window.localStorage.setItem(key, JSON.stringify({ theme: 'light', accent: 'evergreen' }))
    }, [APPEARANCE_KEY])
    const mobilePage = await mobileCtx.newPage()
    await mobilePage.goto(`${baseURL}/?view=mobile`, { waitUntil: 'networkidle', timeout: 15000 })
    try {
      await mobilePage.getByRole('heading', { name: /same system, at phone scale/i }).waitFor({ timeout: 10000 })
    } catch (e) {
      throw new Error(`mobile showcase heading did not appear within timeout: ${e.message}`)
    }
    await wait(1000)
    await mobilePage.screenshot({ path: path.join(mediaDir, 'finance-freedom-mobile.png'), fullPage: false })
    console.log('  captured finance-freedom-mobile.png')
    await mobileCtx.close()
  }

  // c. Design system page (static HTML in /public). Desktop viewport.
  {
    const dsCtx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
    dsCtx.setDefaultTimeout(10000)
    const dsPage = await dsCtx.newPage()
    await dsPage.goto(`${baseURL}/design-system.html`, { waitUntil: 'networkidle', timeout: 15000 })
    try {
      await dsPage.locator('h1').first().waitFor({ timeout: 10000 })
    } catch (e) {
      throw new Error(`design-system <h1> did not appear within timeout: ${e.message}`)
    }
    await wait(1000)
    await dsPage.screenshot({ path: path.join(mediaDir, 'finance-freedom-design-system.png'), fullPage: false })
    console.log('  captured finance-freedom-design-system.png')
    await dsCtx.close()
  }

  await browser.close()
  console.log('done →', mediaDir)
}

main()
  .then(() => { killDevServer(devServer); process.exit(0) })
  .catch((e) => { console.error(e); killDevServer(devServer); process.exit(1) })
