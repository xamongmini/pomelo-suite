'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  CpuWorkItem,
  PriorityQueue,
  WorkItem,
  WorkItemState,
  WorkQueue,
  WorkerTaskError,
  WorkerThreadPool,
} = require('../src');
const { runTask } = require('../src/work/cpu-tasks');
const pkg = require('../package.json');

class DemoWorkItem extends WorkItem {
  constructor(log) {
    super();
    this.log = log;
  }

  async perform() {
    this.log.push('performed');
  }
}

test('WorkQueue runs queued WorkItem instances', async () => {
  const log = [];
  const queue = new WorkQueue({ concurrentLimit: 1 });
  const item = new DemoWorkItem(log);

  queue.add(item);
  assert.equal(await queue.waitAll(1000), true);
  assert.deepEqual(log, ['performed']);
  assert.equal(item.state, WorkItemState.Completed);
});

test('declares stable package entrypoints', () => {
  assert.equal(pkg.name, '@pomelo-suite/workqueue');
  assert.equal(pkg.main, 'src/index.js');
  assert.equal(pkg.exports['.'].require, './src/index.js');
  assert.equal(pkg.exports['.'].default, './src/index.js');
  assert.equal(pkg.exports['./package.json'], './package.json');
  assert.equal(pkg.pomeloSuite.stability, 'stable');
});

test('exports worker and queue helpers', () => {
  assert.equal(typeof WorkerThreadPool, 'function');
  assert.equal(typeof WorkerTaskError, 'function');
  assert.equal(typeof CpuWorkItem, 'function');
  assert.equal(typeof PriorityQueue, 'function');
});

test('uses shared calculator dependency for default CPU tasks', async () => {
  const result = await runTask('calculateExpression', { expression: '1+2' });
  assert.equal(String(result.value), '3');
});
