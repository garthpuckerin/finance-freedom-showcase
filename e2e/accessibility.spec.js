import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ENTERED_KEY = 'ff:entered:v1'
const APPEARANCE_KEY = 'ff:appearance:v1'
const THEMES = ['light', 'dark']
const ACCENTS = ['evergreen', 'ink', 'teal', 'amber', 'violet']
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const DESKTOP_VIEWPORT = { width: 1440, height: 1000 }
const PHONE_VIEWPORT = { width: 390, height: 844 }

const SURFACES = [
  {
    name: 'fresh marketing landing',
    path: '/',
    entered: false,
    viewport: DESKTOP_VIEWPORT,
    ready: page => page.getByRole('button', { name: 'Launch demo' }),
  },
  {
    name: 'entered desktop shell',
    path: '/',
    entered: true,
    viewport: DESKTOP_VIEWPORT,
    ready: page => page.getByRole('button', { name: 'Dashboard' }),
  },
  {
    name: 'framed mobile companion',
    path: '/?view=mobile',
    entered: true,
    viewport: DESKTOP_VIEWPORT,
    ready: page => page.getByRole('heading', { name: 'The same system, at phone scale' }),
  },
  {
    name: 'forced mobile companion at phone viewport',
    path: '/?view=mobile',
    entered: true,
    viewport: PHONE_VIEWPORT,
    ready: page => page.getByRole('heading', { name: 'The same system, at phone scale' }),
  },
  {
    name: 'automatic phone app',
    path: '/',
    entered: true,
    viewport: PHONE_VIEWPORT,
    ready: page => page.getByRole('button', { name: /Home/ }),
  },
]

async function seedState(page, appearance, entered) {
  await page.addInitScript(
    ({ appearanceKey, enteredKey, appearanceValue, hasEntered }) => {
      window.localStorage.setItem(appearanceKey, JSON.stringify(appearanceValue))
      if (hasEntered) window.sessionStorage.setItem(enteredKey, 'true')
      else window.sessionStorage.removeItem(enteredKey)
    },
    {
      appearanceKey: APPEARANCE_KEY,
      enteredKey: ENTERED_KEY,
      appearanceValue: appearance,
      hasEntered: entered,
    }
  )
}

async function expectNoWcagViolations(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_AA_TAGS)
    .analyze()

  const summary = violations.flatMap(({ id, impact, nodes }) =>
    nodes.map(({ target, failureSummary }) => ({
      rule: id,
      impact,
      target: target.join(' '),
      failureSummary,
    }))
  )

  expect(summary).toEqual([])
}

for (const surface of SURFACES) {
  test.describe(surface.name, () => {
    for (const theme of THEMES) {
      for (const accent of ACCENTS) {
        test(`${theme}/${accent} meets WCAG A/AA`, async ({ page }) => {
          await page.setViewportSize(surface.viewport)
          await seedState(page, { theme, accent }, surface.entered)
          await page.goto(surface.path)

          await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
          await expect(page.locator('html')).toHaveAttribute('data-accent', accent)
          await expect(surface.ready(page)).toBeVisible()

          if (surface.name === 'automatic phone app') {
            await expect(
              page.getByRole('heading', { name: 'The same system, at phone scale' })
            ).toHaveCount(0)
          }

          await expectNoWcagViolations(page)
        })
      }
    }
  })
}
