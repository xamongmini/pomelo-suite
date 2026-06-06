'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  Calculator,
  DataTypeCheck,
  ExQueue,
  ExStack,
  Token,
  evaluateExpression,
} = require('../src');

const pkg = require('../package.json');

test('exports calculator and expression primitives', () => {
  assert.equal(typeof Calculator, 'function');
  assert.equal(typeof Token, 'function');
  assert.equal(typeof DataTypeCheck.isInteger, 'function');
  assert.equal(typeof ExQueue, 'function');
  assert.equal(typeof ExStack, 'function');
  assert.equal(evaluateExpression('1 + 2 * 3'), '7');
});

test('declares stable package entrypoints', () => {
  assert.equal(pkg.name, '@pomelo-suite/calculator');
  assert.equal(pkg.main, 'src/index.js');
  assert.equal(pkg.exports['.'].require, './src/index.js');
  assert.equal(pkg.exports['.'].default, './src/index.js');
  assert.equal(pkg.exports['./package.json'], './package.json');
  assert.equal(pkg.pomeloSuite.stability, 'stable');
});
