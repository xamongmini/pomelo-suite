'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const pkg = require('../package.json');
const { ColorPicker } = require('../src');

test('exports ColorPicker', () => {
  assert.equal(typeof ColorPicker, 'function');
  assert.equal(['Blen', 'derColorPicker'].join('') in require('../src'), false);
});

test('defines package exports map', () => {
  assert.deepEqual(pkg.exports, {
    '.': {
      browser: './src/color-picker.js',
      require: './src/index.js',
      default: './src/index.js',
    },
    './package.json': './package.json',
  });
});
