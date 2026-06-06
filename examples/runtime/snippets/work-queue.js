'use strict';

const assert = require('node:assert/strict');

const {
  WorkItem,
  WorkItemState,
  WorkQueue,
} = require('../../../packages/runtime/src');

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class DemoWorkItem extends WorkItem {
  constructor(name, task) {
    super();
    this.name = name;
    this.task = task;
  }

  async perform() {
    await this.task();
  }
}

async function main() {
  const queue = new WorkQueue({ concurrentLimit: 2 });
  const events = [];
  const completed = [];
  let running = 0;
  let maxRunning = 0;

  queue.on('runningWorkItem', ({ workItem }) => {
    events.push(`running:${workItem.name}`);
  });

  queue.on('failedWorkItem', ({ workItem }) => {
    events.push(`failed:${workItem.name}`);
  });

  queue.on('completedWorkItem', ({ workItem }) => {
    events.push(`completed:${workItem.name}`);
  });

  const itemA = new DemoWorkItem('collect-a', async () => {
    running += 1;
    maxRunning = Math.max(maxRunning, running);
    await delay(15);
    completed.push('collect-a');
    running -= 1;
  });

  const itemB = new DemoWorkItem('collect-b', async () => {
    running += 1;
    maxRunning = Math.max(maxRunning, running);
    await delay(5);
    completed.push('collect-b');
    running -= 1;
  });

  const failingItem = new DemoWorkItem('failing-job', async () => {
    throw new Error('demo failure');
  });

  queue.add(itemA);
  queue.add(itemB);
  queue.add(failingItem);

  await queue.waitAll();

  assert.equal(queue.count, 0);
  assert.equal(maxRunning, 2);
  assert.equal(failingItem.state, WorkItemState.Completed);
  assert.equal(failingItem.failedException.message, 'demo failure');
  assert.deepEqual(completed.sort(), ['collect-a', 'collect-b']);
  assert.ok(events.includes('failed:failing-job'));

  console.log('WORK_QUEUE_EXAMPLE_OK');
  console.log(`maxRunning=${maxRunning}`);
  console.log(`completed=${completed.sort().join(',')}`);
  console.log(`failed=${failingItem.failedException.message}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
