'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

const expectedPackages = [
  ['spangrid', '@pomelo-suite/spangrid', 'stable', '0.1.1'],
  ['calculator', '@pomelo-suite/calculator', 'stable'],
  ['scheduler', '@pomelo-suite/scheduler', 'stable'],
  ['workqueue', '@pomelo-suite/workqueue', 'stable'],
  ['runtime', '@pomelo-suite/runtime', 'experimental'],
  ['color-picker', '@pomelo-suite/color-picker', 'stable'],
  ['input', '@pomelo-suite/input', 'stable'],
  ['timeline', '@pomelo-suite/timeline', 'stable'],
  ['diagram', '@pomelo-suite/diagram', 'experimental'],
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function listFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeText(contents) {
  return contents.replace(/\r\n/g, '\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractInlineScripts(html) {
  return [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
}

test('root package is a private npm workspace for Pomelo Suite packages and integrations', () => {
  const pkg = readJson('package.json');

  assert.equal(pkg.name, 'pomelo-suite');
  assert.equal(pkg.private, true);
  assert.deepEqual(pkg.workspaces, [
    'packages/spangrid',
    'packages/calculator',
    'packages/scheduler',
    'packages/workqueue',
    'packages/runtime',
    'packages/color-picker',
    'packages/input',
    'packages/timeline',
    'packages/diagram',
    'figma-plugins/grideditor',
  ]);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.scripts.test, 'node --test tests/*.test.js && npm run test --workspaces --if-present');
  assert.equal(pkg.scripts['lint:syntax'], 'node scripts/check-js-syntax.cjs');
  assert.match(pkg.scripts['pack:dry-run'], /^npm pack /);
  assert.match(pkg.scripts['pack:dry-run'], / --dry-run$/);
  for (const [, packageName] of expectedPackages) {
    assert.match(pkg.scripts['pack:dry-run'], new RegExp(`--workspace ${escapeRegExp(packageName)}(?:\\s|$)`));
  }
  assert.doesNotMatch(pkg.scripts['pack:dry-run'], /grideditor|figma-plugins/);
  assert.equal(pkg.scripts['package-studio'], 'node examples/package-studio/server.js');
  assert.equal(pkg.scripts['runtime-playground'], 'node examples/runtime/server.js');
});

test('SpanGrid package has package metadata and a readme', () => {
  for (const [directory, packageName, stability, version = '0.1.0'] of expectedPackages) {
    const packageRoot = path.join(ROOT, 'packages', directory);
    const pkg = readJson(path.join('packages', directory, 'package.json'));

    assert.equal(pkg.name, packageName);
    assert.equal(pkg.version, version);
    assert.equal(pkg.license, 'MIT');
    assert.equal(pkg.private, false);
    assert.equal(pkg.pomeloSuite.stability, stability);
    assert.equal(fs.existsSync(path.join(packageRoot, 'README.md')), true);
    assert.equal(fs.existsSync(path.join(packageRoot, 'LICENSE')), true);
  }
});

test('GridEditor Figma plugin is tracked as a private suite integration', () => {
  const pluginRoot = path.join(ROOT, 'figma-plugins', 'grideditor');
  const pkg = readJson('figma-plugins/grideditor/package.json');
  const manifest = readJson('figma-plugins/grideditor/manifest.json');

  assert.equal(pkg.name, '@pomelo-suite/grideditor-figma');
  assert.equal(pkg.private, true);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.main, 'code.js');
  assert.equal(pkg.scripts.build, 'esbuild code.ts --bundle --outfile=code.js --format=iife --platform=neutral --target=es2017');
  assert.equal(manifest.name, 'GridEditor | Table Creator & Editor');
  assert.equal(manifest.id, '1631306873580716777');
  assert.equal(manifest.main, 'code.js');
  assert.equal(manifest.ui, 'ui.html');

  for (const relativeFile of [
    'code.ts',
    'spanGridFigma.ts',
    'ui.html',
    'src/ui/span-grid.js',
    'src/ui/ui.js',
    'src/ui/ui.css',
    'src/ui/ui.template.html',
    'scripts/build-ui.js',
  ]) {
    assert.equal(fs.existsSync(path.join(pluginRoot, relativeFile)), true, `${relativeFile} is missing`);
  }

  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  assert.match(gitignore, /^node_modules\/$/m);

  for (const excluded of ['publish', 'docs', 'package-lock.json']) {
    assert.equal(fs.existsSync(path.join(pluginRoot, excluded)), false, `${excluded} should not be copied`);
  }
});

test('GridEditor Figma plugin uses the suite SpanGrid source', () => {
  const suiteSpanGrid = normalizeText(fs.readFileSync(path.join(ROOT, 'packages', 'spangrid', 'src', 'span-grid.js'), 'utf8'));
  const pluginSpanGrid = normalizeText(fs.readFileSync(path.join(ROOT, 'figma-plugins', 'grideditor', 'src', 'ui', 'span-grid.js'), 'utf8'));

  assert.equal(pluginSpanGrid, suiteSpanGrid);
});

test('public workspace files and integrations do not contain Korean text', () => {
  const publicFiles = [
    'README.md',
    'package.json',
    'tests/workspace-packages.test.js',
    'scripts/check-js-syntax.cjs',
    'examples/package-studio/server.js',
    'examples/package-studio/public/index.html',
    'examples/package-studio/public/app.js',
    'examples/package-studio/public/styles.css',
    'examples/runtime/README.md',
    'examples/runtime/server.js',
    'examples/runtime/public/index.html',
    'examples/runtime/public/app.js',
    'examples/runtime/public/styles.css',
    'examples/runtime/snippets/scheduler.js',
    'examples/runtime/snippets/work-queue.js',
    'examples/runtime/snippets/common-crypto.js',
    'docs/spangrid/API.md',
    'docs/spangrid/USAGE.md',
    'examples/diagram/diagram-editor.html',
    'examples/diagram/diagram-core.js',
    'examples/diagram/diagram-style.css',
    'examples/diagram/renderer-lab.html',
    'examples/diagram/renderer-lab.js',
    'examples/diagram/renderer-lab.css',
    'packages/spangrid/README.md',
    'examples/spangrid/index.html',
    'examples/spangrid/showcase.html',
    'examples/spangrid/query-analyzer.html',
    'examples/spangrid/spreadsheet.html',
    'examples/spangrid/meta-management.html',
    'packages/spangrid/package.json',
    'packages/spangrid/src/span-grid.js',
    'packages/spangrid/test/span-grid.test.js',
  ];

  for (const [directory] of expectedPackages) {
    const packageRoot = path.join(ROOT, 'packages', directory);
    for (const file of listFiles(packageRoot)) {
      publicFiles.push(path.relative(ROOT, file));
    }
  }

  for (const file of publicFiles) {
    const contents = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.equal(/[\uac00-\ud7af]/.test(contents), false, `${file} contains Korean text`);
  }

  for (const file of listFiles(path.join(ROOT, 'figma-plugins', 'grideditor'))) {
    const contents = fs.readFileSync(file, 'utf8');
    const relative = path.relative(ROOT, file);
    assert.equal(/[\uac00-\ud7af]/.test(contents), false, `${relative} contains Korean text`);
  }
});

test('package studio, runtime, and diagram examples are public examples, not packaged npm payloads', () => {
  const rootPkg = readJson('package.json');
  assert.match(rootPkg.scripts['package-studio'], /examples\/package-studio\/server\.js/);
  const packageStudioHtml = fs.readFileSync(path.join(ROOT, 'examples', 'package-studio', 'public', 'index.html'), 'utf8');
  const packageStudioServer = fs.readFileSync(path.join(ROOT, 'examples', 'package-studio', 'server.js'), 'utf8');

  const runtimePkg = readJson('packages/runtime/package.json');
  assert.deepEqual(runtimePkg.files, [
    'src',
    'README.md',
    'LICENSE',
  ]);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'package-studio', 'public', 'index.html')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'runtime', 'public', 'index.html')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'runtime', 'snippets', 'scheduler.js')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'runtime', 'snippets', 'work-queue.js')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'runtime', 'snippets', 'common-crypto.js')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'packages', 'runtime', 'examples')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'packages', 'runtime', 'playground')), false);

  const spanGridPkg = readJson('packages/spangrid/package.json');
  assert.deepEqual(spanGridPkg.files, [
    'src',
    'README.md',
    'LICENSE',
  ]);
  assert.equal(fs.existsSync(path.join(ROOT, 'docs', 'spangrid', 'API.md')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'docs', 'spangrid', 'USAGE.md')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'packages', 'spangrid', 'docs')), false);

  const diagramPkg = readJson('packages/diagram/package.json');
  assert.deepEqual(diagramPkg.files, [
    'src',
    'README.md',
    'LICENSE',
  ]);
  assert.equal(diagramPkg.browser, undefined);
  assert.equal(fs.existsSync(path.join(ROOT, 'packages', 'diagram', 'src', 'diagram-editor.html')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'packages', 'diagram', 'src', 'diagram-style.css')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'diagram', 'diagram-editor.html')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'diagram', 'diagram-core.js')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'diagram', 'diagram-style.css')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'diagram', 'renderer-lab.html')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'diagram', 'renderer-lab.js')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'examples', 'diagram', 'renderer-lab.css')), true);
  assert.match(packageStudioHtml, /src="\/examples\/diagram\/diagram-editor\.html"/);
  assert.match(packageStudioHtml, /href="\/examples\/diagram\/diagram-editor\.html"/);
  assert.match(packageStudioHtml, /href="\/examples\/diagram\/renderer-lab\.html"/);
  assert.doesNotMatch(packageStudioHtml, /\/packages\/diagram\/src\/diagram-editor\.html/);
  assert.match(packageStudioServer, /const EXAMPLES_DIR = path\.join\(ROOT, 'examples'\);/);
  assert.match(packageStudioServer, /requestUrl\.pathname\.startsWith\('\/examples\/'\)/);
});

test('SpanGrid examples include a query analyzer data grid demo', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'index.html'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'query-analyzer.html'), 'utf8');

  assert.match(indexHtml, /query-analyzer\.html/);
  assert.match(html, /<script src="\.\.\/\.\.\/packages\/spangrid\/src\/span-grid\.js"><\/script>/);
  assert.match(html, /Local sample database/);
  assert.match(html, /SAMPLE_DATABASE/);
  assert.match(html, /SELECT \* FROM orders ORDER BY order_total DESC LIMIT 25/);
  assert.match(html, /PRAGMA table_info\(orders\)/);
  assert.match(html, /COUNT\(\*\) AS order_count/);
  assert.match(html, /new SpanGridControl/);
  assert.match(html, /new SpanGridCanvasView/);
  assert.match(html, /new SpanGridFixed/);
  assert.match(html, /copySelectionToTsv/);
  assert.match(html, /autoFitCols/);
  assert.match(html, /type: "column-header"/);
  assert.match(html, /type: "row-header"/);
  assert.match(html, /function executeQuery/);
  assert.match(html, /function sortRows/);

  for (const [index, script] of extractInlineScripts(html).entries()) {
    assert.doesNotThrow(() => new Function(script), `inline script ${index + 1} should parse`);
  }
});

test('SpanGrid examples include an Excel-style spreadsheet demo with a context menu', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'index.html'), 'utf8');
  const queryAnalyzerHtml = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'query-analyzer.html'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'spreadsheet.html'), 'utf8');

  assert.match(indexHtml, /spreadsheet\.html/);
  assert.match(queryAnalyzerHtml, /spreadsheet\.html/);
  assert.match(html, /<script src="\.\.\/\.\.\/packages\/spangrid\/src\/span-grid\.js"><\/script>/);
  assert.match(html, /SpanGrid Spreadsheet/);
  assert.match(html, /columnNameFromIndex/);
  assert.match(html, /MAX_COLUMN_COUNT = 702/);
  assert.match(html, /ZZ/);
  assert.match(html, /new SpanGridControl/);
  assert.match(html, /new SpanGridCanvasView/);
  assert.match(html, /new SpanGridFixed/);
  assert.match(html, /contextmenu/);
  assert.match(html, /SHEET_CONTEXT_MENU_DEF/);
  assert.match(html, /copySelectionToTsv/);
  assert.match(html, /pasteTsv/);
  assert.match(html, /insertRowAbove/);
  assert.match(html, /insertColumnLeft/);
  assert.match(html, /sortSelectedColumn/);
  assert.match(html, /fillDown/);
  assert.match(html, /fillRight/);
  assert.match(html, /type: "column-header"/);
  assert.match(html, /type: "row-header"/);

  for (const [index, script] of extractInlineScripts(html).entries()) {
    assert.doesNotThrow(() => new Function(script), `inline script ${index + 1} should parse`);
  }
});

test('SpanGrid examples include a meta management demo with three editable grids', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'index.html'), 'utf8');
  const queryAnalyzerHtml = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'query-analyzer.html'), 'utf8');
  const spreadsheetHtml = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'spreadsheet.html'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'examples', 'spangrid', 'meta-management.html'), 'utf8');

  assert.match(indexHtml, /meta-management\.html/);
  assert.match(queryAnalyzerHtml, /meta-management\.html/);
  assert.match(spreadsheetHtml, /meta-management\.html/);
  assert.match(html, /<script src="\.\.\/\.\.\/packages\/spangrid\/src\/span-grid\.js"><\/script>/);
  assert.match(html, /SpanGrid Meta Management/);
  assert.match(html, /META_TREE/);
  assert.match(html, /SAMPLE_META_STORE/);
  assert.match(html, /TEMPLATES/);
  assert.match(html, /ATTRIBUTES/);
  assert.match(html, /INSTANCES/);
  assert.match(html, /new SpanGridControl/);
  assert.match(html, /new SpanGridCanvasView/);
  assert.match(html, /new SpanGridFixed/);
  assert.match(html, /autoFitCols/);
  assert.match(html, /onSelectionChange/);
  assert.match(html, /commitCellEdit/);
  assert.match(html, /META_CONTEXT_MENU_DEF/);
  assert.match(html, /contextmenu/);
  assert.match(html, /type: "chk"/);
  assert.match(html, /type: "del"/);
  assert.match(html, /_isNew/);
  assert.match(html, /_isModified/);
  assert.match(html, /function addRow/);
  assert.match(html, /function saveGrid/);
  assert.match(html, /function duplicateRow/);
  assert.match(html, /Path Lab/);
  assert.match(html, /id="pathInput"/);
  assert.match(html, /id="setCodeItems"/);
  assert.match(html, /id="pathResult"/);
  assert.match(html, /Metabase\.Apps\.OlivePick\.ApiMapping/);
  assert.match(html, /function normalizeMetaPath/);
  assert.match(html, /function getCodeUIDByPath/);
  assert.match(html, /function getCodeRowByPath/);
  assert.match(html, /function getCodeRowsByPath/);
  assert.match(html, /function getCodeValuesByPath/);
  assert.match(html, /function setCodeByPath/);
  assert.match(html, /function syncMetaFromCodePath/);
  assert.match(html, /function pathFromNode/);
  assert.match(html, /dom\.pathInput\.value = pathFromNode\(node\)/);
  assert.match(html, /html,\s*body\s*{[\s\S]*height: 100%;[\s\S]*overflow: hidden;/);
  assert.match(html, /\.shell\s*{[\s\S]*height: 100vh;[\s\S]*overflow: hidden;/);
  assert.match(html, /\.main\s*{[\s\S]*overflow: hidden;/);
  assert.match(html, /\.grid-area\s*{[\s\S]*overflow: hidden;/);
  assert.match(html, /\.grid-shell\s*{[\s\S]*overflow: hidden;/);

  for (const [index, script] of extractInlineScripts(html).entries()) {
    assert.doesNotThrow(() => new Function(script), `inline script ${index + 1} should parse`);
  }
});
