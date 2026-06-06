'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
function requireWorkspacePackage(packageName, packageDir) {
  try {
    return require(packageName);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND' || !error.message.includes(packageName)) {
      throw error;
    }
    return require(path.join(__dirname, '..', '..', packageDir, 'src'));
  }
}

const calculatorPackage = requireWorkspacePackage('@pomelo-suite/calculator', 'calculator');
const schedulerPackage = requireWorkspacePackage('@pomelo-suite/scheduler', 'scheduler');
const workqueuePackage = requireWorkspacePackage('@pomelo-suite/workqueue', 'workqueue');
const runtimePackage = require('../src');
const { TumblrRuntime, PomeloService, WorkQueue, AgentWorkflowRunner, PermissionPolicy, getAttributeWithPath } = runtimePackage;
const pkg = require('../package.json');

function assertBarePlaygroundScriptCommandsAreScoped(markdown, label) {
  const lines = markdown.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.trim() !== 'npm run playground') {
      return;
    }

    const context = lines.slice(Math.max(0, index - 4), index).join('\n');
    assert.match(context, /workspace|repo root|packages\/runtime/, `${label}: unscoped npm run playground command`);
  });
}

test('exports the experimental runtime surface', () => {
  assert.equal(typeof TumblrRuntime, 'function');
  assert.equal(typeof PomeloService, 'function');
  assert.equal(typeof WorkQueue, 'function');
  assert.equal(typeof AgentWorkflowRunner, 'function');
  assert.equal(typeof PermissionPolicy, 'function');
  assert.equal(Object.hasOwn(runtimePackage, ['Tum', 'blrService'].join('')), false);
});

test('declares experimental package entrypoints', () => {
  assert.equal(pkg.name, '@pomelo-suite/runtime');
  assert.equal(pkg.main, 'src/index.js');
  assert.equal(pkg.exports['.'].require, './src/index.js');
  assert.equal(pkg.exports['.'].default, './src/index.js');
  assert.equal(pkg.exports['./package.json'], './package.json');
  assert.equal(pkg.pomeloSuite.stability, 'experimental');
});

test('composes stable package surfaces instead of copying source', () => {
  assert.equal(pkg.dependencies['@pomelo-suite/calculator'], '0.1.0');
  assert.equal(pkg.dependencies['@pomelo-suite/scheduler'], '0.1.0');
  assert.equal(pkg.dependencies['@pomelo-suite/workqueue'], '0.1.0');

  assert.equal(runtimePackage.WorkQueue, workqueuePackage.WorkQueue);
  assert.equal(runtimePackage.WorkItem, workqueuePackage.WorkItem);
  assert.equal(runtimePackage.IntervalSchedule, schedulerPackage.IntervalSchedule);
  assert.equal(runtimePackage.PomeloScheduler, schedulerPackage.PomeloScheduler);
  assert.equal(Object.hasOwn(runtimePackage, ['Amo', 'ebaTermScheduler'].join('')), false);
  assert.equal(runtimePackage.Calculator, calculatorPackage.Calculator);
  assert.equal(runtimePackage.evaluateExpression, calculatorPackage.evaluateExpression);

  const sourceRoot = path.join(__dirname, '..', 'src');
  assert.equal(fs.existsSync(path.join(sourceRoot, 'work')), false);
  assert.equal(fs.existsSync(path.join(sourceRoot, 'scheduler')), false);
  assert.equal(fs.existsSync(path.join(sourceRoot, 'core', 'script')), false);
  assert.equal(fs.existsSync(path.join(sourceRoot, 'core', 'formula')), false);
  assert.equal(fs.existsSync(path.join(sourceRoot, 'core', 'pomelo-service.js')), true);
  assert.equal(fs.existsSync(path.join(sourceRoot, 'common', 'utils.js')), true);
  assert.equal(fs.existsSync(path.join(sourceRoot, 'core', ['tum', 'blr-service.js'].join(''))), false);
  assert.equal(fs.existsSync(path.join(sourceRoot, 'common', ['amo', 'eba-util.js'].join(''))), false);
});

test('executes a simple message action', () => {
  const runtime = new TumblrRuntime();
  const controller = runtime.loadTumbler('demo', {
    type: 'DEFAULT',
    action: {
      type: 'message',
      ProcessID: 'P1',
      msg: 'hello {@parameter.name}',
    },
  }, {
    name: 'world',
  });

  controller.execute();

  assert.equal(getAttributeWithPath(controller.Data, 'record.responseData.ResultMsg'), 'hello world');
});

test('keeps runtime examples outside the npm package source', () => {
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'examples')), false);
  assert.equal(fs.existsSync(path.join(__dirname, '..', '..', '..', 'examples', 'runtime', 'server.js')), true);
  assert.equal(fs.existsSync(path.join(__dirname, '..', '..', '..', 'examples', 'runtime', 'snippets', 'scheduler.js')), true);
  assert.equal(fs.existsSync(path.join(__dirname, '..', '..', '..', 'examples', 'runtime', 'snippets', 'work-queue.js')), true);
  assert.equal(fs.existsSync(path.join(__dirname, '..', '..', '..', 'examples', 'runtime', 'snippets', 'common-crypto.js')), true);
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'playground')), false);

  const playgroundRoot = path.join(__dirname, '..', '..', '..', 'examples', 'runtime');
  const pending = [playgroundRoot];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
      } else {
        assert.equal(/\.(?:log|out\.log|err\.log)$/.test(entry.name), false, entry.name);
      }
    }
  }
});

test('documents repository runtime playground commands', () => {
  const packageReadme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const playgroundReadme = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'examples', 'runtime', 'README.md'), 'utf8');
  const repoCommand = 'node examples/runtime/server.js';

  assert.match(packageReadme, new RegExp(repoCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(playgroundReadme, new RegExp(repoCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assertBarePlaygroundScriptCommandsAreScoped(packageReadme, 'README.md');
  assertBarePlaygroundScriptCommandsAreScoped(playgroundReadme, 'examples/runtime/README.md');
});

test('brands runtime example docs and public UI as Pomelo Suite Runtime', () => {
  const exampleRoot = path.join(__dirname, '..', '..', '..', 'examples', 'runtime');
  const docsAndAssets = new Map([
    ['examples/runtime/README.md', fs.readFileSync(path.join(exampleRoot, 'README.md'), 'utf8')],
    ['examples/runtime/public/index.html', fs.readFileSync(path.join(exampleRoot, 'public', 'index.html'), 'utf8')],
  ]);

  for (const [label, contents] of docsAndAssets) {
    assert.equal(contents.includes('tumblr-js'), false, `${label}: stale tumblr-js branding`);
    assert.match(contents, /@pomelo-suite\/runtime|Pomelo Suite Runtime/, `${label}: missing runtime package branding`);
  }
});
