import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);
const packageLock = JSON.parse(
  readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8')
);
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const attributeValue = (tag, attribute) => {
  const attributes = tag.matchAll(/\s+([^\s=/>]+)\s*=\s*(["'])(.*?)\2/g);

  for (const match of attributes) {
    if (match[1].toLowerCase() === attribute.toLowerCase()) {
      return match[3];
    }
  }

  return undefined;
};

const headContent = (html) => {
  const activeHtml = html.replace(/<!--[\s\S]*?-->/g, '');
  return activeHtml.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head\s*>/i)?.[1] ?? '';
};

const metaContent = (attribute, value, html = indexHtml) => {
  const tags = headContent(html)
    .match(/<meta\b[^>]*>/gi)
    ?.filter((candidate) => attributeValue(candidate, attribute) === value) ?? [];

  if (tags.length !== 1) {
    throw new Error(`expected exactly one matching meta tag; found ${tags.length}`);
  }

  const content = attributeValue(tags[0], 'content');
  if (content === undefined) {
    throw new Error('matching meta tag must declare content');
  }

  return content;
};

const titleContent = (html = indexHtml) =>
  headContent(html).match(/<title>([^<]+)<\/title>/i)?.[1];

const assertHttpsUrl = (value, label) => {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must use an absolute HTTPS URL`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`${label} must use an absolute HTTPS URL`);
  }
};

test('metadata lookup ignores lookalike attribute names', () => {
  const html = [
    '<html><head>',
    '<meta data-property="og:image" content="https://example.test/lookalike.png">',
    '<meta property="og:image" content="https://example.test/canonical.png">',
    '</head><body></body></html>',
  ].join('');

  assert.strictEqual(
    attributeValue('<meta data-property="og:image" content="lookalike">', 'property'),
    undefined
  );
  assert.strictEqual(
    metaContent('property', 'og:image', html),
    'https://example.test/canonical.png'
  );
});

test('metadata lookup rejects duplicate matching tags', () => {
  const html = [
    '<html><head>',
    '<meta property="og:image" content="https://example.test/first.png">',
    '<meta property="og:image" content="https://example.test/second.png">',
    '</head><body></body></html>',
  ].join('');

  assert.throws(
    () => metaContent('property', 'og:image', html),
    /expected exactly one matching meta tag; found 2/
  );
});

test('metadata lookup rejects commented-out matching tags', () => {
  const html = [
    '<html><head>',
    '<!-- <meta property="og:image" content="https://example.test/commented.png"> -->',
    '</head><body></body></html>',
  ].join('');

  assert.throws(
    () => metaContent('property', 'og:image', html),
    /expected exactly one matching meta tag; found 0/
  );
});

test('title lookup rejects commented-out title tags', () => {
  const html = [
    '<html><head>',
    '<!-- <title>Finance Freedom</title> -->',
    '</head><body></body></html>',
  ].join('');

  assert.strictEqual(titleContent(html), undefined);
});

test('metadata and title lookup ignore tags outside head', () => {
  const html = [
    '<html><head></head><body>',
    '<meta property="og:image" content="https://example.test/body.png">',
    '<title>Finance Freedom</title>',
    '</body></html>',
  ].join('');

  assert.throws(
    () => metaContent('property', 'og:image', html),
    /expected exactly one matching meta tag; found 0/
  );
  assert.strictEqual(titleContent(html), undefined);
});

test('Open Graph image validation rejects relative and non-HTTPS URLs', () => {
  for (const value of ['/og.png', 'http://example.test/og.png', 'data:image/png;base64,AAAA']) {
    assert.throws(() => assertHttpsUrl(value, 'Open Graph image'), /must use an absolute HTTPS URL/);
  }

  assert.doesNotThrow(() => assertHttpsUrl('https://example.test/og.png', 'Open Graph image'));
});

test('release metadata and scripts remain canonical', () => {
  assert.strictEqual(packageJson.name, 'finance-freedom-showcase');
  assert.strictEqual(packageLock.name, packageJson.name);
  assert.strictEqual(packageLock.packages?.['']?.name, packageJson.name);
  assert.ok(packageJson.description?.trim(), 'package description must not be empty');

  assert.strictEqual(titleContent(), 'Finance Freedom');
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
  assertHttpsUrl(openGraphImage, 'Open Graph image');
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
