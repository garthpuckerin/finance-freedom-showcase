import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'parse5';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);
const packageLock = JSON.parse(
  readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8')
);
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const workflow = readFileSync(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8'
);

const significantYamlLines = (yaml) =>
  yaml
    .split(/\r?\n/u)
    .filter((line) => line.trim() && !line.trimStart().startsWith('#'));

const elementAttributes = (element) => {
  const attributes = new Map();
  for (const attribute of element.attrs) {
    assert.ok(
      !attributes.has(attribute.name),
      `duplicate ${attribute.name} attribute on <${element.tagName}>`
    );
    attributes.set(attribute.name, attribute.value);
  }
  return attributes;
};

const findElements = (root, tagName) => {
  const matches = [];
  for (const child of root.childNodes ?? []) {
    if (child.nodeName === tagName) matches.push(child);
    matches.push(...findElements(child, tagName));
  }
  return matches;
};

const textContent = (element) =>
  (element.childNodes ?? [])
    .map((child) => (child.nodeName === '#text' ? child.value : textContent(child)))
    .join('');

const parsedDocument = (html) => {
  const document = parse(html, { scriptingEnabled: true });
  const htmlElements = findElements(document, 'html');
  assert.strictEqual(
    htmlElements.length,
    1,
    'parsed document must contain exactly one <html> element'
  );
  const heads = findElements(htmlElements[0], 'head');
  assert.strictEqual(heads.length, 1, 'parsed document must contain exactly one active <head>');
  return { document, head: heads[0] };
};

const belongsTo = (node, ancestor) => {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (parent === ancestor) return true;
  }
  return false;
};

const requireUniqueHeadMeta = (html, selector) => {
  const { document, head } = parsedDocument(html);
  const matches = findElements(document, 'meta')
    .map((element) => ({ attributes: elementAttributes(element), element }))
    .filter(({ attributes }) =>
      Object.entries(selector).every(
        ([name, value]) => attributes.get(name.toLowerCase()) === value
      )
    );
  const selectorLabel = Object.entries(selector)
    .map(([name, value]) => `${name}="${value}"`)
    .join(' ');

  assert.strictEqual(
    matches.length,
    1,
    `expected exactly one active <meta ${selectorLabel}>`
  );
  assert.ok(
    belongsTo(matches[0].element, head),
    `<meta ${selectorLabel}> must be inside the active <head>`
  );
  return matches[0].attributes;
};

const requireUniqueHeadTitle = (html) => {
  const { document, head } = parsedDocument(html);
  const titles = findElements(document, 'title').filter(
    (element) => element.namespaceURI === HTML_NAMESPACE
  );

  assert.strictEqual(titles.length, 1, 'document must contain exactly one active <title>');
  assert.ok(belongsTo(titles[0], head), 'active <title> must be inside the active <head>');
  return textContent(titles[0]).trim();
};

const metaContent = (attribute, value, html = indexHtml) =>
  requireUniqueHeadMeta(html, { [attribute]: value }).get('content');

const titleContent = (html = indexHtml) => requireUniqueHeadTitle(html);

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
  const lookalikeOnly = [
    '<html><head>',
    '<meta data-property="og:image" content="https://example.test/lookalike.png">',
    '</head><body></body></html>',
  ].join('');

  assert.strictEqual(
    metaContent('property', 'og:image', html),
    'https://example.test/canonical.png'
  );
  assert.throws(() => metaContent('property', 'og:image', lookalikeOnly), /exactly one active/);
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
    /exactly one/
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
    /exactly one/
  );
});

test('title lookup rejects commented-out title tags', () => {
  const html = [
    '<html><head>',
    '<!-- <title>Finance Freedom</title> -->',
    '</head><body></body></html>',
  ].join('');

  assert.throws(() => titleContent(html), /exactly one/);
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
    /(exactly one|must be inside)/
  );
  assert.throws(() => titleContent(html), /(exactly one|must be inside)/);
});

test('metadata parsing rejects inert and raw-content tags', () => {
  for (const tagName of ['script', 'style', 'template', 'noscript']) {
    const metaOnly = `
      <html><head>
        <${tagName}><meta property="og:title" content="embedded"></${tagName}>
      </head><body></body></html>`;
    const titleOnly = `
      <html><head>
        <${tagName}><title>embedded</title></${tagName}>
      </head><body></body></html>`;

    assert.throws(
      () => metaContent('property', 'og:title', metaOnly),
      /exactly one/,
      `<meta> text inside <${tagName}> must not satisfy the contract`
    );
    assert.throws(
      () => titleContent(titleOnly),
      /exactly one/,
      `<title> text inside <${tagName}> must not satisfy the contract`
    );
  }
});

test('metadata parsing rejects a fake head inside textarea content', () => {
  const html = `
    <html><body><textarea>
      <head>
        <meta property="og:title" content="textarea content">
        <title>textarea content</title>
      </head>
    </textarea></body></html>`;

  assert.throws(() => metaContent('property', 'og:title', html), /exactly one/);
  assert.throws(() => titleContent(html), /exactly one/);
});

test('title parsing rejects duplicates and titles outside the active head', () => {
  const duplicate = `
    <html><head><title>Finance Freedom</title></head><body>
      <title>Finance Freedom</title>
    </body></html>`;
  const outsideHead = `
    <html><head></head><body><title>Finance Freedom</title></body></html>`;

  assert.throws(() => titleContent(duplicate), /exactly one/);
  assert.throws(() => titleContent(outsideHead), /must be inside/);
});

test('title uniqueness ignores SVG accessibility titles', () => {
  const html = `
    <html>
      <head><title>Finance Freedom</title></head>
      <body>
        <svg role="img" aria-labelledby="chart-title">
          <title id="chart-title">Net worth trend</title>
        </svg>
      </body>
    </html>`;

  assert.strictEqual(titleContent(html), 'Finance Freedom');
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
  assert.strictEqual(
    packageJson.description,
    'Finance Freedom ("Ledger") — public cockpit demo. A personal-finance command center where every figure derives from one canonical register. Mock data; the engine is private.'
  );
  assert.strictEqual(packageJson.devDependencies?.parse5, '8.0.1');

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

test('CI runs the shared release command with Node 24 actions', () => {
  assert.deepStrictEqual(significantYamlLines(workflow), [
    'name: Finance Freedom Release',
    'on:',
    '  push:',
    '    branches:',
    '      - main',
    '  pull_request:',
    '    branches:',
    '      - main',
    'permissions:',
    '  contents: read',
    'jobs:',
    '  release:',
    '    runs-on: ubuntu-24.04',
    '    timeout-minutes: 15',
    '    steps:',
    '      - name: Checkout',
    '        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    '        with:',
    '          persist-credentials: false',
    '      - name: Setup Node',
    '        uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
    '        with:',
    '          node-version: 24.16.0',
    '          cache: npm',
    '      - name: Install dependencies',
    '        run: npm ci',
    '      - name: Install Chromium',
    '        run: npx playwright install --with-deps chromium',
    '      - name: Verify release',
    '        run: npm run test:release'
  ]);
});
