'use strict';

const assert = require('node:assert/strict');

const {
  DailySchedule,
  FixDaySchedule,
  IntervalSchedule,
  IntervalSchedule2,
  Schedule,
  ScheduleCollection,
  ScheduleType,
} = require('../../../packages/runtime/src');

const startTime = new Date('2026-05-01T00:00:00.000Z');

const interval = new IntervalSchedule('interval-1', 'every-30s', startTime, 30);
assert.equal(interval.triggerEvents().toISOString(), '2026-05-01T00:00:30.000Z');

const daily = new DailySchedule('daily-1', 'daily', startTime);
assert.equal(daily.triggerEvents().toISOString(), '2026-05-02T00:00:00.000Z');

const fixedDay = new FixDaySchedule('fixed-day-1', 'fixed-day', new Date('2026-05-01T10:30:00.000Z'), 3);
assert.equal(fixedDay.triggerEvents().toISOString(), '2026-05-02T03:00:00.000Z');

const interval2 = new IntervalSchedule2('interval-2', 'interval2', startTime, 15, {
  now: () => new Date('2026-05-01T12:00:00.000Z'),
});
assert.equal(interval2.recalculateNextInvokeTime().toISOString(), '2026-05-01T12:00:15.000Z');
assert.equal(interval2.triggerEvents().toISOString(), '2027-05-01T12:00:00.000Z');

const collection = new ScheduleCollection();
assert.equal(collection.add(new Schedule({ Name: 'beta', Type: ScheduleType.DAILY })), 0);
assert.equal(collection.add(new Schedule({ Name: 'alpha', Type: ScheduleType.ONETIME })), 1);
assert.equal(collection.Count, 2);
assert.equal(collection.findSchedule('alpha').Type, ScheduleType.ONETIME);

collection.sortByName();
assert.deepEqual(collection.toArray().map((schedule) => schedule.Name), ['alpha', 'beta']);
assert.equal(collection[0].Name, 'alpha');

console.log('SCHEDULER_EXAMPLE_OK');
console.log(`intervalNext=${interval.nextInvokeTime.toISOString()}`);
console.log(`interval2FarFuture=${interval2.nextInvokeTime.toISOString()}`);
console.log(`scheduleNames=${collection.toArray().map((schedule) => schedule.Name).join(',')}`);
