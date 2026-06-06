/**
 * scripts/build-ui.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds ui.html from src/ui files.
 *
 *   1. Sync the suite SpanGrid source into src/ui/span-grid.js when available.
 *   2. Concatenate span-grid.js and ui.js in that order.
 *   3. Minify with Terser.
 *   4. Replace @@CSS@@ / @@JS@@ in ui.template.html.
 *   5. Write ui.html.
 *
 * Usage:
 *   node scripts/build-ui.js
 *   node scripts/build-ui.js --watch
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const SUITE_ROOT = path.resolve(ROOT, '..', '..');
const SRC_UI     = path.join(ROOT, 'src', 'ui');
const OUT_HTML   = path.join(ROOT, 'ui.html');

const TEMPLATE   = path.join(SRC_UI, 'ui.template.html');
const CSS_FILE   = path.join(SRC_UI, 'ui.css');
const SPANGRID   = path.join(SRC_UI, 'span-grid.js');
const SUITE_SPANGRID = path.join(SUITE_ROOT, 'packages', 'spangrid', 'src', 'span-grid.js');
const UI_JS      = path.join(SRC_UI, 'ui.js');

const WATCH_MODE = process.argv.includes('--watch');

const TERSER_OPTIONS = {
  mangle: {
    toplevel: false,
    properties: false,
  },
  compress: {
    passes: 1,
    drop_console: false,
    drop_debugger: true,
    inline: 1,
    unsafe: false,
  },
  format: {
    comments: false,
    beautify: false,
  },
};

function syncSpanGridSource() {
  if (!fs.existsSync(SUITE_SPANGRID)) return;

  const suiteSource = fs.readFileSync(SUITE_SPANGRID, 'utf8');
  const localSource = fs.existsSync(SPANGRID) ? fs.readFileSync(SPANGRID, 'utf8') : '';
  if (suiteSource !== localSource) {
    fs.writeFileSync(SPANGRID, suiteSource, 'utf8');
  }
}

async function build() {
  const t0 = Date.now();
  syncSpanGridSource();

  for (const f of [TEMPLATE, CSS_FILE, SPANGRID, UI_JS]) {
    if (!fs.existsSync(f)) {
      console.error(`[build-ui] Missing file: ${f}`);
      console.error('  Run npm run extract:ui first if you need to regenerate src/ui files.');
      if (!WATCH_MODE) process.exit(1);
      return;
    }
  }

  const spanGridSrc = fs.readFileSync(SPANGRID, 'utf8');
  const uiJsSrc     = fs.readFileSync(UI_JS, 'utf8');
  const combined    = spanGridSrc + '\n\n' + uiJsSrc;

  let minifiedJS;
  try {
    const { minify } = require('terser');
    const result = await minify(combined, TERSER_OPTIONS);
    if (result.code == null) throw new Error('Terser returned empty output.');
    minifiedJS = result.code;
  } catch (err) {
    console.error('[build-ui] Terser error:', err.message);
    if (!WATCH_MODE) process.exit(1);
    return;
  }

  const css = fs.readFileSync(CSS_FILE, 'utf8');

  let template = fs.readFileSync(TEMPLATE, 'utf8');
  template = template.replace('@@CSS@@', css);
  template = template.replace('@@JS@@', minifiedJS);

  fs.writeFileSync(OUT_HTML, template, 'utf8');

  const elapsed = Date.now() - t0;
  const sizeKB  = (Buffer.byteLength(template, 'utf8') / 1024).toFixed(1);
  const jsKB    = (Buffer.byteLength(minifiedJS, 'utf8') / 1024).toFixed(1);
  console.log(`[build-ui] ui.html built. JS: ${jsKB} KB  total: ${sizeKB} KB  (${elapsed}ms)`);
}

if (!WATCH_MODE) {
  build();
} else {
  console.log('[build-ui] Watch mode started.');
  build();

  let debounceTimer = null;
  const watchTargets = [CSS_FILE, SPANGRID, UI_JS, TEMPLATE];

  watchTargets.forEach(file => {
    if (!fs.existsSync(file)) return;
    fs.watch(file, () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log(`[build-ui] Changed: ${path.basename(file)}`);
        build();
      }, 200);
    });
  });

  fs.watch(SRC_UI, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => build(), 200);
  });

  process.on('SIGINT',  () => { console.log('\n[build-ui] Stopped.'); process.exit(0); });
  process.on('SIGTERM', () => process.exit(0));
}
