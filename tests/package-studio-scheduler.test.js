'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createDemoServer } = require('../examples/package-studio/server');

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function collectRegistryStream(url, stopWhen, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const records = [];
  const startedAt = Date.now();

  try {
    const response = await fetch(url, { signal: controller.signal });
    assert.equal(response.status, 200);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines.filter(Boolean)) {
        const record = {
          elapsedMs: Date.now() - startedAt,
          message: JSON.parse(line),
        };
        records.push(record);
        if (stopWhen(record, records)) {
          await reader.cancel();
          return records;
        }
      }
    }

    return records;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

test('package studio scheduler registry waits until the start time before running work', async (t) => {
  const server = createDemoServer();
  const port = await listen(server);
  t.after(() => server.close());

  const start = new Date(Date.now() + 350).toISOString();
  const schedules = [{
    delayMs: 40,
    fixedDay: 31,
    fixedHour: 6,
    id: 'SCH-001',
    intervalSeconds: 1,
    name: 'Future interval',
    start,
    triggerCount: 1,
    type: 'INTERVAL',
    weekdays: [1, 2, 3, 4, 5],
  }];
  const url = `http://127.0.0.1:${port}/api/scheduler/registry/events?schedules=${
    encodeURIComponent(JSON.stringify(schedules))
  }`;

  const records = await collectRegistryStream(url, (record) => {
    const lastEvent = record.message.payload.events.at(-1);
    return lastEvent?.type === 'INVOKED';
  });

  const running = records.find((record) => record.message.payload.events.at(-1)?.type === 'RUNNING');
  const invoked = records.find((record) => record.message.payload.events.at(-1)?.type === 'INVOKED');

  assert.ok(running, 'expected RUNNING event');
  assert.ok(invoked, 'expected INVOKED event');
  assert.ok(running.elapsedMs >= 250, `RUNNING emitted too early after ${running.elapsedMs}ms`);
  assert.ok(invoked.elapsedMs >= running.elapsedMs + 30, `INVOKED did not include delay after ${invoked.elapsedMs}ms`);
});

test('package studio scheduler registry starts immediately when the start time is in the past', async (t) => {
  const server = createDemoServer();
  const port = await listen(server);
  t.after(() => server.close());

  const start = new Date(Date.now() - 60_000).toISOString();
  const schedules = [{
    delayMs: 40,
    fixedDay: 31,
    fixedHour: 6,
    id: 'SCH-002',
    intervalSeconds: 1,
    name: 'Past interval',
    start,
    triggerCount: 1,
    type: 'INTERVAL',
    weekdays: [1, 2, 3, 4, 5],
  }];
  const url = `http://127.0.0.1:${port}/api/scheduler/registry/events?schedules=${
    encodeURIComponent(JSON.stringify(schedules))
  }`;

  const records = await collectRegistryStream(url, (record) => {
    const lastEvent = record.message.payload.events.at(-1);
    return lastEvent?.type === 'INVOKED';
  });

  const scheduled = records.find((record) => record.message.payload.events.at(-1)?.type === 'SCHEDULED');
  const running = records.find((record) => record.message.payload.events.at(-1)?.type === 'RUNNING');
  const invoked = records.find((record) => record.message.payload.events.at(-1)?.type === 'INVOKED');

  assert.ok(scheduled, 'expected SCHEDULED event');
  assert.equal(scheduled.message.payload.schedules[0].remainingMs, 0);
  assert.ok(running, 'expected RUNNING event');
  assert.ok(invoked, 'expected INVOKED event');
  assert.ok(running.elapsedMs < 250, `RUNNING should start immediately, emitted after ${running.elapsedMs}ms`);
  assert.ok(invoked.elapsedMs >= running.elapsedMs + 30, `INVOKED did not include delay after ${invoked.elapsedMs}ms`);
});
