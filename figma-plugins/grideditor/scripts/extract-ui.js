

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const SRC_UI  = path.join(ROOT, 'src', 'ui');
const UI_HTML = path.join(ROOT, 'ui.html');


if (!fs.existsSync(UI_HTML)) {
  console.error('ui.html not found:', UI_HTML);
  process.exit(1);
}

const html = fs.readFileSync(UI_HTML, 'utf8');
fs.mkdirSync(SRC_UI, { recursive: true });


const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) {
  console.error('<style> block not found.');
  process.exit(1);
}
const cssContent = cssMatch[1].replace(/^\n/, '').replace(/\n$/, '');


const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
const scripts = [];
let m;
while ((m = scriptRegex.exec(html)) !== null) {
  scripts.push(m[1].replace(/^\n/, '').replace(/\n$/, ''));
}

if (scripts.length < 2) {
  console.error(`<script> block count is ${scripts.length}. At least 2 are required.`);
  process.exit(1);
}

const spanGridJS = scripts[0];
const uiJS       = scripts[1];


fs.writeFileSync(path.join(SRC_UI, 'ui.css'), cssContent, 'utf8');
console.log('✓ src/ui/ui.css           ', `(${(cssContent.length / 1024).toFixed(1)} KB)`);

fs.writeFileSync(path.join(SRC_UI, 'span-grid.js'), spanGridJS, 'utf8');
console.log('✓ src/ui/span-grid.js     ', `(${(spanGridJS.length / 1024).toFixed(1)} KB)`);

fs.writeFileSync(path.join(SRC_UI, 'ui.js'), uiJS, 'utf8');
console.log('✓ src/ui/ui.js            ', `(${(uiJS.length / 1024).toFixed(1)} KB)`);


let template = html.replace(
  /<style>[\s\S]*?<\/style>/,
  '<style>\n@@CSS@@\n</style>'
);


const firstScriptIdx = template.indexOf('<script>');
const lastScriptEnd  = template.lastIndexOf('</script>') + '</script>'.length;

if (firstScriptIdx === -1 || lastScriptEnd <= firstScriptIdx) {
  console.error('Could not locate script block replacement range.');
  process.exit(1);
}

template =
  template.slice(0, firstScriptIdx) +
  '<script>\n@@JS@@\n</script>' +
  template.slice(lastScriptEnd);

fs.writeFileSync(path.join(SRC_UI, 'ui.template.html'), template, 'utf8');
console.log('✓ src/ui/ui.template.html ', `(${(template.length / 1024).toFixed(1)} KB)`);

console.log('\nExtraction complete. Edit src/ui/ and run npm run build:ui.');
