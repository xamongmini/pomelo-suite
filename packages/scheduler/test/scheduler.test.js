'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  PomeloScheduler,
  IntervalSchedule,
  Schedule,
  ScheduleCollection,
  ScheduleType,
} = require('../src');
const pkg = require('../package.json');

test('exports scheduler primitives and accepts schedules', () => {
  const scheduler = new PomeloScheduler({ autoStart: false });
  const schedule = new IntervalSchedule('job-1', 'every-minute', new Date('2026-05-01T00:00:00.000Z'), 60);
  const collection = new ScheduleCollection();

  collection.add(new Schedule({ Name: 'daily', Type: ScheduleType.DAILY }));
  scheduler.addSchedule(schedule);

  assert.equal(typeof scheduler.completeSchedule, 'function');
  assert.equal(collection.findSchedule('daily').Name, 'daily');
  assert.equal(scheduler.getSchedule('job-1'), schedule);
  assert.equal(Object.hasOwn(require('../src'), ['Amo', 'ebaTermScheduler'].join('')), false);
});

test('declares stable package entrypoints', () => {
  assert.equal(pkg.name, '@pomelo-suite/scheduler');
  assert.equal(pkg.main, 'src/index.js');
  assert.equal(pkg.exports['.'].require, './src/index.js');
  assert.equal(pkg.exports['.'].default, './src/index.js');
  assert.equal(pkg.exports['./package.json'], './package.json');
  assert.equal(pkg.pomeloSuite.stability, 'stable');
});
