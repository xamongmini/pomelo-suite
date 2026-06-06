'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['packages', 'figma-plugins', 'examples', 'tests', 'scripts'];

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = TARGETS.flatMap((target) => walk(path.join(ROOT, target)));
const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    failures.push({
      file: path.relative(ROOT, file),
      output: `${result.stdout}${result.stderr}`.trim(),
    });
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`Syntax check failed: ${failure.file}`);
    console.error(failure.output);
  }
  process.exitCode = 1;
} else {
  console.log(`Syntax OK (${files.length} files)`);
}
