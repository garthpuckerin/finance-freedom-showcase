import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const attributeValue = (tag, attribute) => {
  const match = tag.match(new RegExp(`\\b${attribute}=["']([^"']*)["']`, 'i'));
  return match?.[1];
};

const metaContent = (attribute, value) => {
  const tag = indexHtml
    .match(/<meta\b[^>]*>/gi)
    ?.find((candidate) => attributeValue(candidate, attribute) === value);

  return tag ? attributeValue(tag, 'content') : undefined;
};

test('release metadata and scripts remain canonical', () => {
  assert.strictEqual(packageJson.name, 'finance-freedom-showcase');
  assert.ok(packageJson.description?.trim(), 'package description must not be empty');

  assert.strictEqual(indexHtml.match(/<title>([^<]+)<\/title>/i)?.[1], 'Finance Freedom');
  assert.strictEqual(
    metaContent('name', 'description'),
    'The soul of Microsoft Money, rebuilt for 2026. A 15-screen desktop finance cockpit — registers, cash-flow forecast, budgets in five styles (envelopes to FIRE), reports, goals. Portfolio demo on mock data, by Garth Puckerin.'
  );
  assert.strictEqual(
    metaContent('property', 'og:title'),
    'Finance Freedom — the soul of Microsoft Money, rebuilt for 2026'
  );
  assert.strictEqual(
    metaContent('property', 'og:description'),
    'A 15-screen desktop finance cockpit: registers, cash-flow forecast, budgets in five styles (envelopes to FIRE), reports, goals. Local-first, cloud optional. Portfolio demo on mock data.'
  );

  assert.strictEqual(metaContent('name', 'robots'), 'noindex');

  const openGraphImage = metaContent('property', 'og:image');
  assert.ok(openGraphImage, 'Open Graph image must be declared');
  assert.doesNotThrow(() => new URL(openGraphImage), 'Open Graph image must use an absolute URL');
  assert.strictEqual(metaContent('property', 'og:image:width'), '2400');
  assert.strictEqual(metaContent('property', 'og:image:height'), '1260');
  assert.strictEqual(metaContent('name', 'twitter:card'), 'summary_large_image');

  assert.strictEqual(packageJson.scripts?.['test:unit'], 'node --test tests/*.test.mjs');
  assert.strictEqual(
    packageJson.scripts?.['test:release'],
    'npm run build && npm run test:unit && npm run test:e2e',
    'test:release must run build, unit, and browser gates sequentially'
  );
});
