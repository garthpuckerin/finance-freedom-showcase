import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ENTERED_KEY = 'ff:entered:v1'
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function enterDemo(page) {
  await page.addInitScript((key) => {
    try { window.sessionStorage.setItem(key, 'true') } catch (e) {}
  }, ENTERED_KEY)
}

async function expectNoWcagViolations(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_AA_TAGS)
    .analyze()

  const summary = violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    nodes: nodes.length,
  }))

  expect(summary).toEqual([])
}

test('landing meets WCAG A/AA', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Launch demo' })).toBeVisible()

  await expectNoWcagViolations(page)
})

test('entered desktop shell meets WCAG A/AA', async ({ page }) => {
  await enterDemo(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible()

  await expectNoWcagViolations(page)
})

test('entered mobile companion meets WCAG A/AA at a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enterDemo(page)
  await page.goto('/?view=mobile')
  await expect(
    page.getByRole('heading', { name: 'The same system, at phone scale' })
  ).toBeVisible()

  await expectNoWcagViolations(page)
})
