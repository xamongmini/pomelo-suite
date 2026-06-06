'use strict';

const ScheduleType = Object.freeze({
  ONETIME: 'ONETIME',
  INTERVAL: 'INTERVAL',
  INTERVAL2: 'INTERVAL2',
  MINUTELY: 'MINUTELY',
  TIMELY: 'TIMELY',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  FIXTIME: 'FIXTIME',
  FIXDAILY: 'FIXDAILY',
  FIXMONTHLY: 'FIXMONTHLY',
});

module.exports = { ScheduleType };
